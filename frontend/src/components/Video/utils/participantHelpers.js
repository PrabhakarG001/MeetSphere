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
            finalStream = streamOrTrack;
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

        if (existingIndex !== -1) {
            const existingVideo = videos[existingIndex];
            if (existingVideo.stream === finalStream && 
                existingVideo.username === username && 
                existingVideo.isHost === isHost && 
                existingVideo.picture === picture) {
                return videos;
            }
            const updatedVideos = [...videos];
            updatedVideos[existingIndex] = {
                ...existingVideo,
                stream: finalStream,
                username: username || existingVideo.username,
                isHost: isHost !== undefined ? isHost : existingVideo.isHost,
                picture: picture || existingVideo.picture
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
                isVideoEnabled: true,
                isAudioEnabled: true
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
