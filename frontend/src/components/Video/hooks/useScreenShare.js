import { useState, useEffect } from 'react';
import { black, silence } from '../utils/mediaHelpers';

export const useScreenShare = (localStreamRef, localVideoref, connections, socketIdRef, socketRef, getUserMedia, attachLocalStream) => {
    const [screen, setScreen] = useState();
    const [screenAvailable, setScreenAvailable] = useState(Boolean(navigator.mediaDevices?.getDisplayMedia));

    useEffect(() => {
        if (screen !== undefined) {
            if (screen) {
                if (navigator.mediaDevices.getDisplayMedia) {
                    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                        .then(getDislayMediaSuccess)
                        .catch((e) => {
                            console.error(e);
                            setScreen(false); // Reset state if user cancels or fails
                        });
                } else {
                    alert("Screen sharing is not supported by your current browser. Please try using a different browser like Chrome or Safari.");
                    setScreen(false);
                }
            }
        }
    }, [screen]);

    const handleScreen = () => {
        setScreen(!screen);
    };

    const getDislayMediaSuccess = (stream) => {
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

            if (senders.length > 0) {
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender && newVideoTrack) videoSender.replaceTrack(newVideoTrack);
                
                const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
                if (audioSender && newAudioTrack) audioSender.replaceTrack(newAudioTrack);
            } else {
                localStreamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, localStreamRef.current);
                });
                pc.createOffer().then((description) => {
                    pc.setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': pc.localDescription }));
                        })
                        .catch(e => console.error(e));
                });
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

                    if (senders.length > 0) {
                        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                        if (videoSender && newVideoTrack) videoSender.replaceTrack(newVideoTrack);
                        
                        const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
                        if (audioSender && newAudioTrack) audioSender.replaceTrack(newAudioTrack);
                    }
                }

                // Call getUserMedia just to update states correctly
                getUserMedia({ forceVideo: true, forceAudio: true });
            } catch (e) {
                console.error("Failed to restore media after screen share", e);
            }
        };
    };

    return {
        screen,
        screenAvailable,
        setScreenAvailable,
        handleScreen
    };
};
