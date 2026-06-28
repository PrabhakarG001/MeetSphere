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
                        .catch((e) => console.log(e));
                }
            }
        }
    }, [screen]);

    const handleScreen = () => {
        setScreen(!screen);
    };

    const getDislayMediaSuccess = (stream) => {
        try {
            localStreamRef.current?.getTracks().forEach(track => track.stop());
        } catch (e) {
            console.log(e);
        }

        localStreamRef.current = stream;
        window.localStream = stream;
        attachLocalStream(stream);

        for (let id in connections.current) {
            if (id === socketIdRef.current) continue;

            const pc = connections.current[id];
            const senders = pc.getSenders();
            
            const newVideoTrack = localStreamRef.current.getVideoTracks()[0];
            const newAudioTrack = localStreamRef.current.getAudioTracks()[0];

            if (senders.length > 0) {
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender && newVideoTrack) videoSender.replaceTrack(newVideoTrack);
                
                const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
                if (audioSender && newAudioTrack) audioSender.replaceTrack(newAudioTrack);
            } else {
                pc.addStream(localStreamRef.current);
                pc.createOffer().then((description) => {
                    pc.setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': pc.localDescription }));
                        })
                        .catch(e => console.log(e));
                });
            }
        }

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setScreen(false);

                try {
                    let tracks = localVideoref.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                } catch (e) {
                    console.log(e);
                }

                let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                localStreamRef.current = blackSilence();
                window.localStream = localStreamRef.current;
                attachLocalStream(localStreamRef.current);

                getUserMedia();
            };
        });
    };

    return {
        screen,
        screenAvailable,
        setScreenAvailable,
        handleScreen
    };
};
