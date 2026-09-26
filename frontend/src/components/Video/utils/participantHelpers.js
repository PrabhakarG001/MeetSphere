export const removeParticipant = (setVideos, videoRef, id) => {
    setVideos((videos) => {
        const updatedVideos = videos.filter((video) => video.socketId !== id);
        videoRef.current = updatedVideos;
        return updatedVideos;
    });
};
export const updateOrAddParticipant = (setVideos, videoRef, socketListId, streamOrTrack, username = "Guest", isHost = false, picture = null, explicitVideoEnabled, explicitAudioEnabled) => {
    setVideos(videos => {
        let existingIndex = videos.findIndex(video => video.socketId === socketListId);

        let finalStream;
        if (streamOrTrack instanceof MediaStream) {
            finalStream = streamOrTrack; // DO NOT CLONE: WebRTC updates this stream directly on replaceTrack
        } else if (streamOrTrack && streamOrTrack.kind) {
            const track = streamOrTrack;
            if (existingIndex !== -1 && videos[existingIndex].stream) {
                const existingStream = videos[existingIndex].stream;
                if (!existingStream.getTracks().includes(track)) {
                    existingStream.addTrack(track);
                }
                finalStream = existingStream;
            } else {
                finalStream = new MediaStream([track]);
            }
        } else {
            finalStream = streamOrTrack;
        }

        const videoTracks = finalStream?.getVideoTracks?.() || [];
        const audioTracks = finalStream?.getAudioTracks?.() || [];

        // For remote peers, prefer the explicit camera/mic state delivered via socket
        // status events; fall back to track-derived state. `muted` reflects whether the
        // remote side is actually sending media right now.
        const isVideoEnabled = explicitVideoEnabled !== undefined
            ? explicitVideoEnabled
            : videoTracks.some(track => track.readyState === "live" && !track.muted && track.enabled !== false);
        const isAudioEnabled = explicitAudioEnabled !== undefined
            ? explicitAudioEnabled
            : (audioTracks.length > 0
                ? audioTracks.some(track => track.readyState === "live" && !track.muted && track.enabled !== false)
                : true);

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
