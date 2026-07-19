import { useEffect } from 'react';

export const useAudio = (audio, setAudio, localStreamRef, getUserMedia, video, socketRef) => {
    const handleAudio = (forcedState) => {
        const nextAudioState = typeof forcedState === 'boolean' ? forcedState : !audio;
        const currentStream = localStreamRef.current || window.localStream;
        const audioTracks = currentStream?.getAudioTracks?.() || [];

        audioTracks.forEach(track => {
            track.enabled = nextAudioState;
        });

        setAudio(nextAudioState);

        if (socketRef && socketRef.current) {
            socketRef.current.emit("audio-status-change", nextAudioState);
        }

        if (nextAudioState && audioTracks.length === 0) {
            getUserMedia({ forceVideo: video, forceAudio: true });
        }
    };

    useEffect(() => {
        const handleForceMute = () => {
            if (audio) {
                handleAudio(false);
            }
        };

        window.addEventListener('force-mute-local', handleForceMute);
        return () => window.removeEventListener('force-mute-local', handleForceMute);
    }, [audio, handleAudio]);

    return {
        handleAudio
    };
};
