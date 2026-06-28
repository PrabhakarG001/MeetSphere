import { useState, useRef, useEffect, useCallback } from 'react';
import { getMediaErrorMessage, getPreferredMediaConstraints, hasLiveLocalStream, stopStream, black, silence } from '../utils/mediaHelpers';
import { isLocalSecureContext } from '../utils/meetingHelpers';

export const useMediaDevices = (socketRef, socketIdRef, connectionsRef, askForUsername, joinedWithExistingStreamRef, localVideoref, localStreamRef) => {
    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [mediaError, setMediaError] = useState("");

    const selectedVideoDeviceIdRef = useRef(null);

    const attachLocalStream = (stream) => {
        localStreamRef.current = stream;
        window.localStream = stream;

        if (!localVideoref.current || !stream) return;

        if (localVideoref.current.srcObject !== stream) {
            localVideoref.current.srcObject = stream;
        }
        
        const playPromise = localVideoref.current.play?.();
        if (playPromise) {
            playPromise.catch((error) => {
                console.log("Local video playback will resume after browser interaction", error);
            });
        }
    };

    const setLocalVideoElement = useCallback((node) => {
        localVideoref.current = node;
        if (node && localStreamRef.current) {
            attachLocalStream(localStreamRef.current);
        }
    }, []);

    const loadMediaDevices = async () => {
        if (!navigator.mediaDevices?.enumerateDevices) return;

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === "videoinput");
            const microphones = devices.filter(device => device.kind === "audioinput");
            const selectedCamera = cameras[0];

            selectedVideoDeviceIdRef.current = selectedCamera?.deviceId || null;
            if (selectedCamera?.label) {
                console.log("Selected camera:", selectedCamera.label);
            }
            setVideoAvailable(cameras.length > 0);
            setAudioAvailable(microphones.length > 0);
        } catch (error) {
            console.log("Could not enumerate media devices", error);
        }
    };

    const getUserMediaSuccess = (stream) => {
        if (localStreamRef.current && localStreamRef.current !== stream) {
            stopStream(localStreamRef.current);
        }

        localStreamRef.current = stream;
        window.localStream = stream;
        setMediaError("");

        const activeCamera = stream.getVideoTracks()[0]?.label;
        if (activeCamera) console.log("Active camera:", activeCamera);

        attachLocalStream(stream);

        for (let id in connectionsRef.current) {
            if (id === socketIdRef.current) continue;

            const pc = connectionsRef.current[id];
            const senders = pc.getSenders();
            
            const newVideoTrack = window.localStream.getVideoTracks()[0];
            const newAudioTrack = window.localStream.getAudioTracks()[0];

            if (senders.length > 0) {
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender && newVideoTrack) videoSender.replaceTrack(newVideoTrack);
                
                const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
                if (audioSender && newAudioTrack) audioSender.replaceTrack(newAudioTrack);
            } else {
                pc.addStream(window.localStream);
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
                setVideo(false);
                setAudio(false);

                try {
                    let tracks = localVideoref.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                } catch (e) { console.log(e); }

                let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                localStreamRef.current = blackSilence();
                window.localStream = localStreamRef.current;
                attachLocalStream(localStreamRef.current);

                for (let id in connectionsRef.current) {
                    if (id === socketIdRef.current) continue;
                    const pc = connectionsRef.current[id];
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
            };
        });
    };

    const getUserMedia = async ({ forceVideo = false, forceAudio = false } = {}) => {
        if (!navigator.mediaDevices?.getUserMedia || !isLocalSecureContext()) {
            const message = getMediaErrorMessage(null, "camera", isLocalSecureContext());
            setMediaError(message);
            console.error(message);
            return null;
        }

        const currentStream = localStreamRef.current || window.localStream;
        const needsVideo = video && (videoAvailable || forceVideo);
        const needsAudio = audio && (audioAvailable || forceAudio);

        if (hasLiveLocalStream(currentStream, needsVideo, needsAudio)) {
            joinedWithExistingStreamRef.current = true;
            setMediaError("");
            attachLocalStream(currentStream);
            return currentStream;
        }

        if (!needsVideo && !needsAudio) {
            stopStream(localStreamRef.current || localVideoref.current?.srcObject);
            return null;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(getPreferredMediaConstraints(selectedVideoDeviceIdRef.current, needsVideo, needsAudio));
            getUserMediaSuccess(stream);
            return stream;
        } catch (e) {
            console.error("getUserMedia failed while joining meeting", e);
            setMediaError(getMediaErrorMessage(e, "camera", isLocalSecureContext()));

            if (e?.name === "OverconstrainedError" && selectedVideoDeviceIdRef.current) {
                selectedVideoDeviceIdRef.current = null;

                try {
                    const retryStream = await navigator.mediaDevices.getUserMedia({ video: needsVideo, audio: needsAudio });
                    getUserMediaSuccess(retryStream);
                    return retryStream;
                } catch (retryError) {
                    console.error("Default camera retry failed", retryError);
                    setMediaError(getMediaErrorMessage(retryError, "camera", isLocalSecureContext()));
                }
            }

            if (needsVideo && needsAudio) {
                try {
                    const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    getUserMediaSuccess(audioOnlyStream);
                    setVideo(false);
                    setVideoAvailable(false);
                    return audioOnlyStream;
                } catch (audioError) {
                    console.error("Audio-only fallback failed", audioError);
                    setAudio(false);
                    setAudioAvailable(false);
                }
            }

            setVideo(false);
            setVideoAvailable(false);
            return null;
        }
    };

    const getPermissions = async () => {
        if (!navigator.mediaDevices?.getUserMedia || !isLocalSecureContext()) {
            const message = getMediaErrorMessage(null, "camera", isLocalSecureContext());
            setMediaError(message);
            setVideoAvailable(false);
            setAudioAvailable(false);
            console.error(message);
            return;
        }

        try {
            await loadMediaDevices();
            const userMediaStream = await navigator.mediaDevices.getUserMedia(getPreferredMediaConstraints(selectedVideoDeviceIdRef.current, true, true));

            localStreamRef.current = userMediaStream;
            window.localStream = userMediaStream;
            setVideoAvailable(userMediaStream.getVideoTracks().length > 0);
            setAudioAvailable(userMediaStream.getAudioTracks().length > 0);
            setVideo(userMediaStream.getVideoTracks().length > 0);
            setAudio(userMediaStream.getAudioTracks().length > 0);
            setMediaError("");

            const activeCamera = userMediaStream.getVideoTracks()[0]?.label;
            if (activeCamera) console.log("Active camera:", activeCamera);

            attachLocalStream(userMediaStream);
            await loadMediaDevices();
        } catch (error) {
            console.error("getUserMedia failed while initializing lobby preview", error);
            setMediaError(getMediaErrorMessage(error, "camera", isLocalSecureContext()));
            setVideoAvailable(false);

            try {
                const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                localStreamRef.current = audioOnlyStream;
                window.localStream = audioOnlyStream;
                setAudioAvailable(true);
                setAudio(true);
                attachLocalStream(audioOnlyStream);
            } catch (audioError) {
                console.error("Microphone initialization also failed", audioError);
                setAudioAvailable(false);
                setAudio(false);
            }
        }
    };

    useEffect(() => {
        let cancelled = false;
        Promise.resolve().then(() => {
            if (!cancelled) getPermissions();
        });
        return () => {
            cancelled = true;
            stopStream(localStreamRef.current);
        };
    }, []);

    useEffect(() => {
        if (!askForUsername) {
            if (!joinedWithExistingStreamRef.current) {
                getUserMedia({ forceVideo: video, forceAudio: audio });
                console.log("SET STATE HAS ", video, audio);
            }
        }
    }, [askForUsername]);

    const handleVideo = () => {
        const nextVideoState = !video;
        setVideo(nextVideoState);

        const currentStream = localStreamRef.current || window.localStream;
        const videoTracks = currentStream?.getVideoTracks?.() || [];

        videoTracks.forEach(track => {
            track.enabled = nextVideoState;
        });
    };

    return {
        videoAvailable,
        audioAvailable,
        video,
        setVideo,
        audio,
        setAudio,
        mediaError,
        setMediaError,
        setLocalVideoElement,
        getUserMedia,
        handleVideo,
        attachLocalStream
    };
};
