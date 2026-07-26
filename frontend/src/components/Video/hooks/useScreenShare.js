import { useState, useEffect } from 'react';

const isMobileDevice = () => (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || window.matchMedia?.("(max-width: 640px)")?.matches
);

const isScreenShareSupported = () => (
    !isMobileDevice()
    && Boolean(navigator.mediaDevices?.getDisplayMedia)
);

export const useScreenShare = (localStreamRef, localVideoref, connections, socketIdRef, socketRef, getUserMedia, attachLocalStream) => {
    const [screen, setScreen] = useState();
    const [screenAvailable, setScreenAvailable] = useState(isScreenShareSupported());
    const [screenShareMessage, setScreenShareMessage] = useState("");

    const getDisplayMediaSuccess = (stream) => {
        try {
            // Stop ONLY the video tracks to free camera, keep audio tracks running
            localStreamRef.current?.getVideoTracks().forEach(track => {
                track.onended = null;
                track.stop();
            });
        } catch (e) {
            console.error(e);
        }

        // Keep the existing microphone track
        const existingAudioTrack = localStreamRef.current?.getAudioTracks()[0];
        
        // Create a new composite stream with screen video and mic audio
        const screenVideoTrack = stream.getVideoTracks()[0];
        const compositeStream = new MediaStream([screenVideoTrack]);
        if (existingAudioTrack) {
            compositeStream.addTrack(existingAudioTrack);
        }

        localStreamRef.current = compositeStream;
        window.localStream = compositeStream;
        attachLocalStream(compositeStream);

        for (let id in connections.current) {
            if (id === socketIdRef.current) continue;

            const pc = connections.current[id];
            const senders = pc.getSenders();
            
            const newVideoTrack = screenVideoTrack;
            const newAudioTrack = existingAudioTrack;

            let renegotiationNeeded = false;

            const videoSender = senders.find(s => s.track?.kind === 'video') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'video'));
            if (videoSender && newVideoTrack) {
                console.log(`[WebRTC] Screen share: replacing video track for ${id}`);
                videoSender.replaceTrack(newVideoTrack).catch(e => console.error(e));
            } else if (newVideoTrack) {
                pc.addTrack(newVideoTrack, compositeStream);
                renegotiationNeeded = true;
            }

            const audioSender = senders.find(s => s.track?.kind === 'audio') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'audio'));
            if (audioSender && newAudioTrack) {
                console.log(`[WebRTC] Screen share: replacing audio track for ${id}`);
                audioSender.replaceTrack(newAudioTrack).catch(e => console.error(e));
            } else if (newAudioTrack) {
                pc.addTrack(newAudioTrack, compositeStream);
                renegotiationNeeded = true;
            }

            if (renegotiationNeeded) {
                pc.createOffer().then((description) => {
                    pc.setLocalDescription(description).then(() => {
                        socketRef.current.emit('offer', { to: id, offer: pc.localDescription });
                    }).catch(e => console.error(e));
                }).catch(e => console.error(e));
            }
        }

        stream.getVideoTracks()[0].onended = async () => {
            setScreen(false);

            try {
                // Stop screen share tracks
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(track => track.stop());
                }
                if (localVideoref.current && localVideoref.current.srcObject) {
                    localVideoref.current.srcObject.getTracks().forEach(track => track.stop());
                }
                stream.getTracks().forEach(track => track.stop());

                // Reinitialize camera + mic
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                localStreamRef.current = newStream;
                window.localStream = newStream;
                
                if (localVideoref.current) {
                    localVideoref.current.srcObject = newStream;
                    await localVideoref.current.play();
                }

                // Replace tracks in peer connection
                for (let id in connections.current) {
                    if (id === socketIdRef.current) continue;
                    const pc = connections.current[id];
                    const senders = pc.getSenders();
                    
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    const newAudioTrack = newStream.getAudioTracks()[0];

                    let renegotiationNeeded = false;

                    const videoSender = senders.find(s => s.track?.kind === 'video') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'video'));
                    if (videoSender && newVideoTrack) {
                        console.log(`[WebRTC] Restoring camera video track for ${id}`);
                        videoSender.replaceTrack(newVideoTrack).catch(e => console.error(e));
                    } else if (newVideoTrack) {
                        pc.addTrack(newVideoTrack, newStream);
                        renegotiationNeeded = true;
                    }
                    
                    const audioSender = senders.find(s => s.track?.kind === 'audio') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'audio'));
                    if (audioSender && newAudioTrack) {
                        console.log(`[WebRTC] Restoring mic audio track for ${id}`);
                        audioSender.replaceTrack(newAudioTrack).catch(e => console.error(e));
                    } else if (newAudioTrack) {
                        pc.addTrack(newAudioTrack, newStream);
                        renegotiationNeeded = true;
                    }

                    if (renegotiationNeeded) {
                        pc.createOffer().then((description) => {
                            pc.setLocalDescription(description).then(() => {
                                socketRef.current.emit('offer', { to: id, offer: pc.localDescription });
                            }).catch(e => console.error(e));
                        }).catch(e => console.error(e));
                    }
                }

                // Call getUserMedia just to update states correctly
                getUserMedia({ forceVideo: true, forceAudio: true });
            } catch (e) {
                console.error("Failed to restore media after screen share", e);
            }
        };
    };

    useEffect(() => {
        const updateScreenShareAvailability = () => {
            setScreenAvailable(isScreenShareSupported());
        };

        updateScreenShareAvailability();
        window.addEventListener("resize", updateScreenShareAvailability);
        return () => window.removeEventListener("resize", updateScreenShareAvailability);
    }, []);

    useEffect(() => {
        if (screen !== undefined) {
            if (screen) {
                if (isMobileDevice()) {
                    const message = "Screen sharing is not supported on mobile devices. Please use a desktop browser.";
                    console.log(`[ScreenShare] ${message}`);
                    setScreenShareMessage(message);
                    setScreen(false);
                    return;
                }

                if (navigator.mediaDevices?.getDisplayMedia) {
                    setScreenShareMessage("");
                    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                        .then(getDisplayMediaSuccess)
                        .catch((e) => {
                            console.error(e);
                            setScreen(false);
                        });
                } else {
                    const message = "Screen sharing is not available in this browser. Please use a desktop browser.";
                    console.log(`[ScreenShare] ${message}`);
                    setScreenShareMessage(message);
                    setScreen(false);
                }
            }
        }
    }, [screen]);

    const handleScreen = () => {
        if (isMobileDevice()) {
            const message = "Screen sharing is not supported on mobile devices. Please use a desktop browser.";
            console.log(`[ScreenShare] ${message}`);
            setScreenShareMessage(message);
            return;
        }

        if (!navigator.mediaDevices?.getDisplayMedia) {
            const message = "Screen sharing is not available in this browser. Please use a desktop browser.";
            console.log(`[ScreenShare] ${message}`);
            setScreenShareMessage(message);
            return;
        }

        setScreenShareMessage("");
        setScreen(!screen);
    };

    return {
        screen,
        screenAvailable,
        setScreenAvailable,
        screenShareMessage,
        handleScreen
    };
};
