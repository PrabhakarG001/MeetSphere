import { useRef, useState } from 'react';
import { initializeSocket } from '../utils/socketHelpers';
import { PEER_CONFIG_CONNECTIONS } from '../utils/constants';
import { removeParticipant, updateOrAddParticipant, updateParticipantState } from '../utils/participantHelpers';
import { black, silence } from '../utils/mediaHelpers';

export const useParticipants = (addMessage, localStreamRef, socketRef, socketIdRef, connectionsRef) => {
    const videoRef = useRef([]);
    const [videos, setVideos] = useState([]);

    const iceCandidateQueue = useRef({});

    const gotMessageFromServer = async (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                try {
                    await connectionsRef.current[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    if (signal.sdp.type === 'offer') {
                        const description = await connectionsRef.current[fromId].createAnswer();
                        await connectionsRef.current[fromId].setLocalDescription(description);
                        socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connectionsRef.current[fromId].localDescription }));
                    }
                    // Process queued ICE candidates
                    if (iceCandidateQueue.current[fromId]) {
                        for (let ice of iceCandidateQueue.current[fromId]) {
                            await connectionsRef.current[fromId].addIceCandidate(new RTCIceCandidate(ice)).catch(e => console.error(e));
                        }
                        iceCandidateQueue.current[fromId] = [];
                    }
                } catch (e) {
                    console.error("Error processing SDP:", e);
                }
            }

            if (signal.ice) {
                try {
                    if (connectionsRef.current[fromId].remoteDescription) {
                        await connectionsRef.current[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
                    } else {
                        if (!iceCandidateQueue.current[fromId]) iceCandidateQueue.current[fromId] = [];
                        iceCandidateQueue.current[fromId].push(signal.ice);
                    }
                } catch (e) {
                    console.error("Error processing ICE:", e);
                }
            }
        }
    };

    const connectToSocketServer = (username, picture) => {
        socketRef.current = initializeSocket();
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            const token = localStorage.getItem("token");
            const pathParts = window.location.pathname.split('/');
            const url = pathParts[pathParts.length - 1];
            const isHostLocally = !!sessionStorage.getItem(`host_${url}`);
            
            socketRef.current.emit('join-call', window.location.pathname, username, token, isHostLocally, picture);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                if (connectionsRef.current[id]) {
                    connectionsRef.current[id].close();
                    delete connectionsRef.current[id];
                }
                removeParticipant(setVideos, videoRef, id);
            });

            socketRef.current.on('user-raised-hand', (id, isRaised) => {
                updateParticipantState(setVideos, videoRef, id, { isRaisedHand: isRaised });
            });

            socketRef.current.on('user-reaction', (id, emoji) => {
                const isLocal = (id === socketIdRef.current);
                const event = new CustomEvent('show-reaction', { detail: { id: isLocal ? 'local' : id, emoji } });
                window.dispatchEvent(event);
            });

            socketRef.current.on('user-audio-status', (id, isAudioEnabled) => {
                updateParticipantState(setVideos, videoRef, id, { isAudioEnabled });
            });

            socketRef.current.on('force-mute', () => {
                // If the user gets forcefully muted, we emit an event that other components can listen to, or we directly turn off the mic
                const event = new CustomEvent('force-mute-local');
                window.dispatchEvent(event);
            });

            socketRef.current.on('force-remove', () => {
                alert("You have been removed from the meeting by the host.");
                window.location.href = '/';
            });

            socketRef.current.on('participant-kicked', (id) => {
                if (connectionsRef.current[id]) {
                    connectionsRef.current[id].close();
                    delete connectionsRef.current[id];
                }
                removeParticipant(setVideos, videoRef, id);
            });

            socketRef.current.on('user-joined', (id, clients, joinedUsername) => {
                clients.forEach((clientInfo) => {
                    // Backwards compatibility for if clients array has strings or objects
                    const socketListId = typeof clientInfo === 'string' ? clientInfo : clientInfo.socketId;
                    const peerUsername = typeof clientInfo === 'string' ? "Guest" : clientInfo.username;
                    const peerIsHost = typeof clientInfo === 'string' ? false : !!clientInfo.isHost;
                    const peerPicture = typeof clientInfo === 'string' ? null : clientInfo.picture;

                    if (connectionsRef.current[socketListId] === undefined) {
                        connectionsRef.current[socketListId] = new RTCPeerConnection(PEER_CONFIG_CONNECTIONS);
                        
                        connectionsRef.current[socketListId].onicecandidate = function (event) {
                            if (event.candidate != null) {
                                socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                            }
                        };

                        connectionsRef.current[socketListId].ontrack = (event) => {
                            const newStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
                            
                            const existingVideo = videoRef.current.find(v => v.socketId === socketListId);
                            let finalStream = newStream;
                            
                            // If stream already exists, we should merge the tracks to prevent overwriting audio with video or vice versa
                            if (existingVideo && existingVideo.stream && existingVideo.stream.id !== newStream.id) {
                                // Create a new MediaStream instance to ensure React triggers re-render (reference change)
                                const allTracks = new Set([...existingVideo.stream.getTracks(), event.track]);
                                finalStream = new MediaStream(Array.from(allTracks));
                                
                                event.track.onended = () => {
                                    // Handle track end if needed, though React state updates usually recreate it
                                };
                            }
                            
                            updateOrAddParticipant(setVideos, videoRef, socketListId, finalStream, peerUsername, peerIsHost, peerPicture);
                        };

                        const currentStream = localStreamRef.current || window.localStream;
                        if (currentStream !== undefined && currentStream !== null) {
                            currentStream.getTracks().forEach(track => {
                                connectionsRef.current[socketListId].addTrack(track, currentStream);
                            });
                        } else {
                            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                            localStreamRef.current = blackSilence();
                            window.localStream = localStreamRef.current;
                            localStreamRef.current.getTracks().forEach(track => {
                                connectionsRef.current[socketListId].addTrack(track, localStreamRef.current);
                            });
                        }
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connectionsRef.current) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            const streamToAdd = localStreamRef.current || window.localStream;
                            streamToAdd.getTracks().forEach(track => {
                                connectionsRef.current[id2].addTrack(track, streamToAdd);
                            });
                        } catch (e) { console.error(e); }

                        connectionsRef.current[id2].createOffer().then((description) => {
                            connectionsRef.current[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connectionsRef.current[id2].localDescription }));
                                })
                                .catch(e => console.error(e));
                        });
                    }
                }
            });
        });
    };

    return {
        videos,
        connectToSocketServer
    };
};
