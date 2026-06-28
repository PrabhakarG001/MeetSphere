export const useAudio = (audio, setAudio, localStreamRef, getUserMedia, video) => {
    const handleAudio = () => {
        const nextAudioState = !audio;
        const currentStream = localStreamRef.current || window.localStream;
        const audioTracks = currentStream?.getAudioTracks?.() || [];

        audioTracks.forEach(track => {
            track.enabled = nextAudioState;
        });

        setAudio(nextAudioState);

        if (nextAudioState && audioTracks.length === 0) {
            getUserMedia({ forceVideo: video, forceAudio: true });
        }
    };

    return {
        handleAudio
    };
};
