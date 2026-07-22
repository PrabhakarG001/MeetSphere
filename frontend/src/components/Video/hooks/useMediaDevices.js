import { useState, useRef, useEffect, useCallback } from 'react';
import { getMediaErrorMessage, getPreferredMediaConstraints, hasLiveLocalStream, stopStream, black, silence } from '../utils/mediaHelpers';
import { isLocalSecureContext } from '../utils/meetingHelpers';

export const useMediaDevices = (socketRef, socketIdRef, connectionsRef, askForUsername, joinedWithExistingStreamRef, localVideoref, localStreamRef, initialVideo = true, initialAudio = true) => {
    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(initialVideo);
    const [audio, setAudio] = useState(initialAudio);
    const [mediaError, setMediaError] = useState("");

    const selectedVideoDeviceIdRef = useRef(null);
    const camerasRef = useRef([]);
    const [isRearCamera, setIsRearCamera] = useState(false);
    const isRearCameraRef = useRef(false);

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
                // Playback error (usually requires user interaction)
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

            camerasRef.current = cameras;
            selectedVideoDeviceIdRef.current = selectedCamera?.deviceId || null;
            setVideoAvailable(cameras.length > 0);
            setAudioAvailable(microphones.length > 0);
        } catch (error) {
            console.error("Could not enumerate media devices", error);
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
                window.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, window.localStream);
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

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setVideo(false);
                setAudio(false);

                try {
                    let tracks = localVideoref.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                } catch (e) { console.error(e); }

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
            const stream = await navigator.mediaDevices.getUserMedia(getPreferredMediaConstraints(selectedVideoDeviceIdRef.current, needsVideo, needsAudio, isRearCameraRef.current));
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
            const userMediaStream = await navigator.mediaDevices.getUserMedia(getPreferredMediaConstraints(selectedVideoDeviceIdRef.current, initialVideo, initialAudio, isRearCameraRef.current));

            localStreamRef.current = userMediaStream;
            window.localStream = userMediaStream;
            setVideoAvailable(userMediaStream.getVideoTracks().length > 0 || !initialVideo);
            setAudioAvailable(userMediaStream.getAudioTracks().length > 0 || !initialAudio);
            setVideo(initialVideo && userMediaStream.getVideoTracks().length > 0);
            setAudio(initialAudio && userMediaStream.getAudioTracks().length > 0);
            setMediaError("");

            const activeCamera = userMediaStream.getVideoTracks()[0]?.label;

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

        if (nextVideoState && videoTracks.length === 0) {
            getUserMedia({ forceVideo: true, forceAudio: audio });
        }
    };

    const switchCamera = async () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (!isMobile && camerasRef.current.length < 2) return;
        
        // Stop ALL existing media tracks before switching
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.onended = null;
                track.stop();
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        let videoConstraints;
        
        if (isMobile) {
            // Mobile: Pure facingMode toggle, ignore device list completely
            const nextIsRear = !isRearCameraRef.current;
            setIsRearCamera(nextIsRear);
            isRearCameraRef.current = nextIsRear;
            selectedVideoDeviceIdRef.current = null; // Clear deviceId so handleVideo uses facingMode instead
            videoConstraints = { facingMode: nextIsRear ? "environment" : "user" };
        } else {
            // Desktop: Cycle through enumerated devices
            const currentIndex = camerasRef.current.findIndex(c => c.deviceId === selectedVideoDeviceIdRef.current);
            const nextIndex = (currentIndex + 1) % camerasRef.current.length;
            const nextCamera = camerasRef.current[nextIndex];
            
            if (nextCamera) {
                selectedVideoDeviceIdRef.current = nextCamera.deviceId;
                videoConstraints = { deviceId: { exact: nextCamera.deviceId } };
            } else {
                return; // Should not happen
            }
        }
        
        const fetchAndApplyStream = async () => {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: true
            });
            
            const newVideoTrack = newStream.getVideoTracks()[0];
            const newAudioTrack = newStream.getAudioTracks()[0];
            
            if (newVideoTrack) newVideoTrack.enabled = video; 
            if (newAudioTrack) newAudioTrack.enabled = audio;
            
            if (newVideoTrack) {
                newVideoTrack.onended = () => {
                    setVideo(false);
                };
            }
            
            localStreamRef.current = newStream;
            window.localStream = newStream;
            attachLocalStream(newStream);
            
            for (let id in connectionsRef.current) {
                if (id === socketIdRef.current) continue;
                const pc = connectionsRef.current[id];
                const senders = pc.getSenders();
                
                let renegotiationNeeded = false;
                
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender && newVideoTrack) {
                    videoSender.replaceTrack(newVideoTrack);
                } else if (newVideoTrack) {
                    pc.addTrack(newVideoTrack, newStream);
                    renegotiationNeeded = true;
                }

                const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
                if (audioSender && newAudioTrack) {
                    audioSender.replaceTrack(newAudioTrack);
                } else if (newAudioTrack) {
                    pc.addTrack(newAudioTrack, newStream);
                    renegotiationNeeded = true;
                }

                if (renegotiationNeeded) {
                    pc.createOffer().then((description) => {
                        pc.setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': pc.localDescription }));
                            })
                            .catch(e => console.error(e));
                    });
                }
            }
        };

        try {
            await fetchAndApplyStream();
        } catch (err) {
            console.error("Failed to switch camera video track, retrying once:", err);
            try {
                // Retry once
                await fetchAndApplyStream();
            } catch (err2) {
                console.error("Retry failed, reverting to default:", err2);
                await getUserMedia({ forceVideo: true });
            }
        }
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
        attachLocalStream,
        switchCamera,
        isRearCamera,
        camerasCount: camerasRef.current?.length || 0
    };
};
