export const removeParticipant = (setVideos, videoRef, id) => {
    setVideos((videos) => {
        const updatedVideos = videos.filter((video) => video.socketId !== id);
        videoRef.current = updatedVideos;
        return updatedVideos;
    });
};
export const updateOrAddParticipant = (setVideos, videoRef, socketListId, track, username = "Guest", isHost = false, picture = null) => {
    setVideos(videos => {
        let existingVideo = videos.find(video => video.socketId === socketListId);

        let finalStream;
        if (existingVideo && existingVideo.stream) {
            // Prevent duplicate tracks of the same kind
            const existingTracks = existingVideo.stream.getTracks().filter(t => t.kind !== track.kind);
            finalStream = new MediaStream([...existingTracks, track]);
        } else {
            finalStream = new MediaStream([track]);
        }

        if (existingVideo) {
            const updatedVideos = videos.map(video =>
                video.socketId === socketListId ? { ...video, stream: finalStream, ...(username && {username}), isHost, ...(picture && {picture}) } : video
            );
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
                playsinline: true
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
