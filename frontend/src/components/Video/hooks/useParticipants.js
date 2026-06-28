import { useRef, useState } from 'react';
import { initializeSocket } from '../utils/socketHelpers';
import { PEER_CONFIG_CONNECTIONS } from '../utils/constants';
import { removeParticipant, updateOrAddParticipant } from '../utils/participantHelpers';
import { black, silence } from '../utils/mediaHelpers';

export const useParticipants = (addMessage, localStreamRef, socketRef, socketIdRef, connectionsRef) => {
    const videoRef = useRef([]);
    const [videos, setVideos] = useState([]);

    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connectionsRef.current[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connectionsRef.current[fromId].createAnswer().then((description) => {
                            connectionsRef.current[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connectionsRef.current[fromId].localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }

            if (signal.ice) {
                connectionsRef.current[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    };

    const connectToSocketServer = () => {
        socketRef.current = initializeSocket();
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                if (connectionsRef.current[id]) {
                    connectionsRef.current[id].close();
                    delete connectionsRef.current[id];
                }
                removeParticipant(setVideos, videoRef, id);
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    if (connectionsRef.current[socketListId] === undefined) {
                        connectionsRef.current[socketListId] = new RTCPeerConnection(PEER_CONFIG_CONNECTIONS);
                        
                        connectionsRef.current[socketListId].onicecandidate = function (event) {
                            if (event.candidate != null) {
                                socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                            }
                        };

                        connectionsRef.current[socketListId].onaddstream = (event) => {
                            updateOrAddParticipant(setVideos, videoRef, socketListId, event.stream);
                        };

                        const currentStream = localStreamRef.current || window.localStream;
                        if (currentStream !== undefined && currentStream !== null) {
                            connectionsRef.current[socketListId].addStream(currentStream);
                        } else {
                            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                            localStreamRef.current = blackSilence();
                            window.localStream = localStreamRef.current;
                            connectionsRef.current[socketListId].addStream(localStreamRef.current);
                        }
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connectionsRef.current) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            connectionsRef.current[id2].addStream(localStreamRef.current || window.localStream);
                        } catch (e) { console.log(e); }

                        connectionsRef.current[id2].createOffer().then((description) => {
                            connectionsRef.current[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connectionsRef.current[id2].localDescription }));
                                })
                                .catch(e => console.log(e));
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
