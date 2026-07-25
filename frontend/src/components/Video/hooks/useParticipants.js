import { useRef, useState } from 'react';
import { initializeSocket } from '../utils/socketHelpers';
import { PEER_CONFIG_CONNECTIONS } from '../utils/constants';
import { removeParticipant, updateOrAddParticipant, updateParticipantState } from '../utils/participantHelpers';
import { black, silence } from '../utils/mediaHelpers';

export const useParticipants = (addMessage, localStreamRef, socketRef, socketIdRef, connectionsRef) => {
    const videoRef = useRef([]);
    const [videos, setVideos] = useState([]);
    const iceCandidateQueue = useRef({});
    const peerMetadataRef = useRef({});

    const getOrCreatePeerConnection = (targetSocketId, peerUsername = "Guest", peerIsHost = false, peerPicture = null) => {
        if (peerUsername && peerUsername !== "Guest") {
            peerMetadataRef.current[targetSocketId] = {
                username: peerUsername,
                isHost: peerIsHost,
                picture: peerPicture
            };
        }

        if (connectionsRef.current[targetSocketId]) {
            return connectionsRef.current[targetSocketId];
        }

        console.log(`[WebRTC] Creating RTCPeerConnection for ${targetSocketId}`);
        const pc = new RTCPeerConnection(PEER_CONFIG_CONNECTIONS);

        pc.onicecandidate = (event) => {
            if (event.candidate != null) {
                console.log(`[WebRTC] Sending ICE candidate to ${targetSocketId}`);
                socketRef.current?.emit('signal', targetSocketId, JSON.stringify({ 'ice': event.candidate }));
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state with ${targetSocketId}: ${pc.connectionState}`);
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE connection state with ${targetSocketId}: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                console.log(`[WebRTC] ICE state ${pc.iceConnectionState} with ${targetSocketId}, triggering ICE restart...`);
                pc.createOffer({ iceRestart: true })
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => {
                        console.log(`[WebRTC] Sent ICE restart offer to ${targetSocketId}`);
                        socketRef.current?.emit('signal', targetSocketId, JSON.stringify({ 'sdp': pc.localDescription }));
                    })
                    .catch(e => console.error(`[WebRTC] ICE restart failed for ${targetSocketId}:`, e));
            }
        };

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Received remote track (${event.track.kind}) from ${targetSocketId}`, event.streams);
            if (event.track) {
                event.track.enabled = true;
            }

            const remoteStream = (event.streams && event.streams[0]) 
                ? new MediaStream(event.streams[0].getTracks()) 
                : new MediaStream([event.track]);

            const meta = peerMetadataRef.current[targetSocketId] || {};
            const finalUsername = meta.username || peerUsername || "Guest";
            const finalIsHost = meta.isHost !== undefined ? meta.isHost : peerIsHost;
            const finalPicture = meta.picture || peerPicture;

            updateOrAddParticipant(setVideos, videoRef, targetSocketId, remoteStream, finalUsername, finalIsHost, finalPicture);
        };

        const currentStream = localStreamRef.current || window.localStream;
        if (currentStream && currentStream.getTracks().length > 0) {
            currentStream.getTracks().forEach(track => {
                console.log(`[WebRTC] Adding local track (${track.kind}) to PC for ${targetSocketId}`);
                pc.addTrack(track, currentStream);
            });
        } else {
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            localStreamRef.current = blackSilence();
            window.localStream = localStreamRef.current;
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        connectionsRef.current[targetSocketId] = pc;
        return pc;
    };

    const gotMessageFromServer = async (fromId, message) => {
        if (fromId === socketIdRef.current) return;

        let signal;
        try {
            signal = JSON.parse(message);
        } catch (e) {
            console.error("[WebRTC] Error parsing signal message:", e);
            return;
        }

        const pc = getOrCreatePeerConnection(fromId);

        if (signal.sdp) {
            try {
                console.log(`[WebRTC] Received SDP (${signal.sdp.type}) from ${fromId}`);
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

                if (signal.sdp.type === 'offer') {
                    const description = await pc.createAnswer();
                    await pc.setLocalDescription(description);
                    console.log(`[WebRTC] Sending SDP answer to ${fromId}`);
                    socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': pc.localDescription }));
                }

                if (iceCandidateQueue.current[fromId] && iceCandidateQueue.current[fromId].length > 0) {
                    console.log(`[WebRTC] Flushing ${iceCandidateQueue.current[fromId].length} queued ICE candidates for ${fromId}`);
                    for (let ice of iceCandidateQueue.current[fromId]) {
                        await pc.addIceCandidate(new RTCIceCandidate(ice)).catch(e => console.error("[WebRTC] Error adding queued ICE candidate:", e));
                    }
                    iceCandidateQueue.current[fromId] = [];
                }
            } catch (e) {
                console.error("[WebRTC] Error processing SDP from " + fromId + ":", e);
            }
        }

        if (signal.ice) {
            try {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    console.log(`[WebRTC] Adding ICE candidate from ${fromId}`);
                    await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
                } else {
                    console.log(`[WebRTC] Queuing ICE candidate from ${fromId}`);
                    if (!iceCandidateQueue.current[fromId]) iceCandidateQueue.current[fromId] = [];
                    iceCandidateQueue.current[fromId].push(signal.ice);
                }
            } catch (e) {
                console.error("[WebRTC] Error processing ICE from " + fromId + ":", e);
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
                console.log(`[WebRTC] User left: ${id}`);
                if (connectionsRef.current[id]) {
                    connectionsRef.current[id].close();
                    delete connectionsRef.current[id];
                }
                delete peerMetadataRef.current[id];
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

            socketRef.current.on('user-video-status', (id, isVideoEnabled) => {
                updateParticipantState(setVideos, videoRef, id, { isVideoEnabled });
            });

            socketRef.current.on('force-mute', () => {
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
                delete peerMetadataRef.current[id];
                removeParticipant(setVideos, videoRef, id);
            });

            socketRef.current.on('user-joined', (id, clients) => {
                console.log(`[WebRTC] User joined event (joined ID: ${id}, total clients: ${clients.length})`);
                clients.forEach((clientInfo) => {
                    const socketListId = typeof clientInfo === 'string' ? clientInfo : clientInfo.socketId;
                    const peerUsername = typeof clientInfo === 'string' ? "Guest" : clientInfo.username;
                    const peerIsHost = typeof clientInfo === 'string' ? false : !!clientInfo.isHost;
                    const peerPicture = typeof clientInfo === 'string' ? null : clientInfo.picture;

                    if (socketListId !== socketIdRef.current) {
                        peerMetadataRef.current[socketListId] = {
                            username: peerUsername,
                            isHost: peerIsHost,
                            picture: peerPicture
                        };
                        getOrCreatePeerConnection(socketListId, peerUsername, peerIsHost, peerPicture);
                    }
                });

                if (id === socketIdRef.current) {
                    for (let targetId in connectionsRef.current) {
                        if (targetId === socketIdRef.current) continue;
                        const pc = connectionsRef.current[targetId];
                        console.log(`[WebRTC] Creating SDP offer for ${targetId}`);
                        pc.createOffer()
                            .then((description) => pc.setLocalDescription(description))
                            .then(() => {
                                console.log(`[WebRTC] Sending SDP offer to ${targetId}`);
                                socketRef.current.emit('signal', targetId, JSON.stringify({ 'sdp': pc.localDescription }));
                            })
                            .catch(e => console.error("[WebRTC] Error creating offer for " + targetId + ":", e));
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
