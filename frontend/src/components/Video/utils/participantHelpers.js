export const removeParticipant = (setVideos, videoRef, id) => {
    setVideos((videos) => {
        const updatedVideos = videos.filter((video) => video.socketId !== id);
        videoRef.current = updatedVideos;
        return updatedVideos;
    });
};
export const updateOrAddParticipant = (setVideos, videoRef, socketListId, stream, username = "Guest") => {
    let videoExists = videoRef.current.find(video => video.socketId === socketListId);

    if (videoExists) {
        setVideos(videos => {
            const updatedVideos = videos.map(video =>
                video.socketId === socketListId ? { ...video, stream: stream, ...(username && {username}) } : video
            );
            videoRef.current = updatedVideos;
            return updatedVideos;
        });
    } else {
        let newVideo = {
            socketId: socketListId,
            stream: stream,
            username: username,
            autoplay: true,
            playsinline: true
        };

        setVideos(videos => {
            const updatedVideos = [...videos, newVideo];
            videoRef.current = updatedVideos;
            return updatedVideos;
        });
    }
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
