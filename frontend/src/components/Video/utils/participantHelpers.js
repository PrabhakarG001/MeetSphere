export const removeParticipant = (setVideos, videoRef, id) => {
    setVideos((videos) => {
        const updatedVideos = videos.filter((video) => video.socketId !== id);
        videoRef.current = updatedVideos;
        return updatedVideos;
    });
};
export const updateOrAddParticipant = (setVideos, videoRef, socketListId, streamOrTrack, username = "Guest", isHost = false, picture = null) => {
    setVideos(videos => {
        let existingIndex = videos.findIndex(video => video.socketId === socketListId);

        let finalStream;
        if (streamOrTrack instanceof MediaStream) {
            finalStream = new MediaStream(streamOrTrack.getTracks());
        } else if (streamOrTrack && streamOrTrack.kind) {
            const track = streamOrTrack;
            if (existingIndex !== -1 && videos[existingIndex].stream) {
                const existingTracks = videos[existingIndex].stream.getTracks().filter(t => t.kind !== track.kind);
                finalStream = new MediaStream([...existingTracks, track]);
            } else {
                finalStream = new MediaStream([track]);
            }
        } else {
            finalStream = streamOrTrack;
        }

        const videoTracks = finalStream?.getVideoTracks?.() || [];
        const isVideoEnabled = videoTracks.length > 0;
        const audioTracks = finalStream?.getAudioTracks?.() || [];
        const isAudioEnabled = audioTracks.length > 0 ? audioTracks.some(t => t.enabled !== false) : true;

        if (existingIndex !== -1) {
            const existingVideo = videos[existingIndex];
            const updatedVideos = [...videos];
            updatedVideos[existingIndex] = {
                ...existingVideo,
                stream: finalStream,
                username: (username && username !== "Guest") ? username : (existingVideo.username || username),
                isHost: isHost !== undefined ? isHost : existingVideo.isHost,
                picture: picture || existingVideo.picture,
                isVideoEnabled: isVideoEnabled,
                isAudioEnabled: isAudioEnabled
            };
            videoRef.current = updatedVideos;
            return updatedVideos;
        } else {
            let newVideo = {
                socketId: socketListId,
                stream: finalStream,
                username: username,
                isHost: isHost,
                picture: picture,
                autoplay: true,
                playsinline: true,
                isVideoEnabled: isVideoEnabled,
                isAudioEnabled: isAudioEnabled
            };
            const updatedVideos = [...videos, newVideo];
            videoRef.current = updatedVideos;
            return updatedVideos;
        }
    });
};

export const updateParticipantState = (setVideos, videoRef, id, stateUpdates) => {
    setVideos(videos => {
        const updatedVideos = videos.map(video => 
            video.socketId === id ? { ...video, ...stateUpdates } : video
        );
        videoRef.current = updatedVideos;
        return updatedVideos;
    });
};
