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
    const switchingCameraRef = useRef(false);

    const attachLocalStream = (stream) => {
        localStreamRef.current = stream;
        window.localStream = stream;

        if (!localVideoref.current || !stream) return;

        if (localVideoref.current.srcObject !== stream) {
            localVideoref.current.srcObject = stream;
        }
        
        const playPromise = localVideoref.current.play?.();
        if (playPromise) {
            playPromise.catch(() => {
                // Playback error (usually requires user interaction)
            });
        }
    };

    const findSenderByKind = (pc, kind) => {
        return pc.getSenders().find(sender => sender.track?.kind === kind)
            || pc.getSenders().find(sender => pc.getTransceivers?.().some(transceiver => (
                transceiver.sender === sender && transceiver.sender?.track?.kind === kind
            )));
    };

    const renegotiatePeer = async (pc, id) => {
        if (pc.signalingState !== "stable") {
            console.log(`[WebRTC] Skipping renegotiation for ${id}: signalingState=${pc.signalingState}`);
            return;
        }

        const description = await pc.createOffer();
        await pc.setLocalDescription(description);
        console.log(`[WebRTC] Sending renegotiation offer to ${id}`);
        socketRef.current?.emit('offer', { to: id, offer: pc.localDescription });
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

        attachLocalStream(stream);

        for (let id in connectionsRef.current) {
            if (id === socketIdRef.current) continue;

            const pc = connectionsRef.current[id];
            const senders = pc.getSenders();
            
            const newVideoTrack = window.localStream.getVideoTracks()[0];
            const newAudioTrack = window.localStream.getAudioTracks()[0];

            let renegotiationNeeded = false;

            const videoSender = senders.find(s => s.track?.kind === 'video') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'video'));
            if (videoSender && newVideoTrack) {
                console.log(`[WebRTC] Replacing video track for ${id}`);
                videoSender.replaceTrack(newVideoTrack).catch(e => console.error(e));
            } else if (newVideoTrack) {
                console.log(`[WebRTC] Adding new video track for ${id}`);
                pc.addTrack(newVideoTrack, window.localStream);
                renegotiationNeeded = true;
            }

            const audioSender = senders.find(s => s.track?.kind === 'audio') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'audio'));
            if (audioSender && newAudioTrack) {
                console.log(`[WebRTC] Replacing audio track for ${id}`);
                audioSender.replaceTrack(newAudioTrack).catch(e => console.error(e));
            } else if (newAudioTrack) {
                console.log(`[WebRTC] Adding new audio track for ${id}`);
                pc.addTrack(newAudioTrack, window.localStream);
                renegotiationNeeded = true;
            }

            if (renegotiationNeeded) {
                pc.createOffer().then((description) => {
                    pc.setLocalDescription(description).then(() => {
                        socketRef.current.emit('offer', { to: id, offer: pc.localDescription });
                    }).catch(e => console.error(e));
                }).catch(e => console.error(e));
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

                    let renegotiationNeeded = false;

                    const videoSender = senders.find(s => s.track?.kind === 'video') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'video'));
                    if (videoSender && newVideoTrack) {
                        videoSender.replaceTrack(newVideoTrack).catch(e => console.error(e));
                    } else if (newVideoTrack) {
                        pc.addTrack(newVideoTrack, localStreamRef.current);
                        renegotiationNeeded = true;
                    }
                    
                    const audioSender = senders.find(s => s.track?.kind === 'audio') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'audio'));
                    if (audioSender && newAudioTrack) {
                        audioSender.replaceTrack(newAudioTrack).catch(e => console.error(e));
                    } else if (newAudioTrack) {
                        pc.addTrack(newAudioTrack, localStreamRef.current);
                        renegotiationNeeded = true;
                    }

                    if (renegotiationNeeded) {
                        pc.createOffer().then((description) => {
                            pc.setLocalDescription(description).then(() => {
                                socketRef.current.emit('offer', { to: id, offer: pc.localDescription });
                            }).catch(e => console.error(e));
                        }).catch(e => console.error(e));
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
        // Always request video/audio if the device is available to ensure WebRTC transceivers are created correctly
        const requestVideo = videoAvailable || forceVideo;
        const requestAudio = audioAvailable || forceAudio;

        // The actual desired states based on user preference
        const targetVideoState = video || forceVideo;
        const targetAudioState = audio || forceAudio;

        if (hasLiveLocalStream(currentStream, requestVideo, requestAudio)) {
            joinedWithExistingStreamRef.current = true;
            setMediaError("");
            
            // Apply desired enabled states
            if (currentStream) {
                currentStream.getVideoTracks().forEach(t => t.enabled = targetVideoState);
                currentStream.getAudioTracks().forEach(t => t.enabled = targetAudioState);
            }
            
            attachLocalStream(currentStream);
            return currentStream;
        }

        if (!requestVideo && !requestAudio) {
            stopStream(localStreamRef.current || localVideoref.current?.srcObject);
            return null;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(getPreferredMediaConstraints(selectedVideoDeviceIdRef.current, requestVideo, requestAudio, isRearCameraRef.current));
            
            // Apply desired enabled states
            stream.getVideoTracks().forEach(t => t.enabled = targetVideoState);
            stream.getAudioTracks().forEach(t => t.enabled = targetAudioState);
            
            getUserMediaSuccess(stream);
            return stream;
        } catch (e) {
            console.error("getUserMedia failed while joining meeting", e);
            setMediaError(getMediaErrorMessage(e, "camera", isLocalSecureContext()));

            if (e?.name === "OverconstrainedError" && selectedVideoDeviceIdRef.current) {
                selectedVideoDeviceIdRef.current = null;

                try {
                    const retryStream = await navigator.mediaDevices.getUserMedia({ video: requestVideo, audio: requestAudio });
                    
                    retryStream.getVideoTracks().forEach(t => t.enabled = targetVideoState);
                    retryStream.getAudioTracks().forEach(t => t.enabled = targetAudioState);
                    
                    getUserMediaSuccess(retryStream);
                    return retryStream;
                } catch (retryError) {
                    console.error("Default camera retry failed", retryError);
                    setMediaError(getMediaErrorMessage(retryError, "camera", isLocalSecureContext()));
                }
            }

            if (requestVideo && requestAudio) {
                try {
                    const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    
                    audioOnlyStream.getAudioTracks().forEach(t => t.enabled = targetAudioState);
                    
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

        socketRef.current?.emit("video-status-change", nextVideoState);

        if (nextVideoState && videoTracks.length === 0) {
            getUserMedia({ forceVideo: true, forceAudio: audio });
        }
    };

    const switchCamera = async () => {
        if (switchingCameraRef.current) {
            console.log("[WebRTC] Camera switch already in progress, ignoring duplicate tap");
            return;
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (!isMobile && camerasRef.current.length < 2) return;

        if (!navigator.mediaDevices?.getUserMedia || !isLocalSecureContext()) {
            const message = getMediaErrorMessage(null, "camera", isLocalSecureContext());
            setMediaError(message);
            console.error(message);
            return;
        }

        switchingCameraRef.current = true;
        
        const currentStream = localStreamRef.current || window.localStream;
        const previousIsRear = isRearCameraRef.current;
        const existingAudioTracks = currentStream?.getAudioTracks?.().filter(track => track.readyState === "live") || [];
        
        console.log("[WebRTC] Switching camera", {
            isMobile,
            currentFacingMode: isRearCameraRef.current ? "environment" : "user",
            localTracks: currentStream?.getTracks?.().map(track => `${track.kind}:${track.readyState}:enabled=${track.enabled}`) || []
        });

        try {
            currentStream?.getVideoTracks?.().forEach(track => {
                console.log(`[WebRTC] Stopping previous camera track ${track.id}`);
                track.onended = null;
                track.stop();
            });

            // Mobile Chrome often needs a short release window before opening the opposite camera.
            await new Promise(resolve => setTimeout(resolve, 300));

            let videoConstraints;
            
            if (isMobile) {
                const nextIsRear = !isRearCameraRef.current;
                setIsRearCamera(nextIsRear);
                isRearCameraRef.current = nextIsRear;
                selectedVideoDeviceIdRef.current = null;
                videoConstraints = { facingMode: nextIsRear ? "environment" : "user" };
            } else {
                const currentIndex = camerasRef.current.findIndex(c => c.deviceId === selectedVideoDeviceIdRef.current);
                const nextIndex = (currentIndex + 1) % camerasRef.current.length;
                const nextCamera = camerasRef.current[nextIndex];

                if (nextCamera) {
                    selectedVideoDeviceIdRef.current = nextCamera.deviceId;
                    videoConstraints = { deviceId: { exact: nextCamera.deviceId } };
                } else {
                    return;
                }
            }

            let cameraOnlyStream;
            try {
                cameraOnlyStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: false
                });
            } catch (err) {
                console.error("Failed to switch camera video track, retrying with fallback facingMode:", err);
                cameraOnlyStream = await navigator.mediaDevices.getUserMedia({
                    video: isMobile ? true : videoConstraints,
                    audio: false
                });
            }

            const newVideoTrack = cameraOnlyStream.getVideoTracks()[0];
            if (!newVideoTrack) {
                throw new Error("Camera switch did not return a video track.");
            }

            const newStream = new MediaStream([newVideoTrack, ...existingAudioTracks]);
            newVideoTrack.enabled = video;
            newVideoTrack.onended = () => {
                console.log("[WebRTC] Switched camera track ended");
                setVideo(false);
            };
            existingAudioTracks.forEach(track => {
                track.enabled = audio;
            });

            localStreamRef.current = newStream;
            window.localStream = newStream;

            if (localVideoref.current) {
                localVideoref.current.srcObject = newStream;
                localVideoref.current.play?.().catch(error => {
                    console.log("[WebRTC] Local video play deferred after camera switch:", error?.message || error);
                });
            }

            for (let id in connectionsRef.current) {
                if (id === socketIdRef.current) continue;

                const pc = connectionsRef.current[id];
                if (!pc || pc.connectionState === "closed") continue;

                const sender = findSenderByKind(pc, "video");
                if (sender) {
                    console.log(`[WebRTC] Camera switch: replacing video track for ${id}`, {
                        oldTrackId: sender.track?.id,
                        newTrackId: newVideoTrack.id
                    });
                    await sender.replaceTrack(newVideoTrack);
                    console.log(`[WebRTC] Track replaced successfully for ${id}`);
                } else {
                    const alreadyHasVideoSender = pc.getSenders().some(peerSender => peerSender.track?.kind === "video");
                    if (!alreadyHasVideoSender) {
                        console.log(`[WebRTC] Camera switch: no video sender for ${id}, adding fallback track once`, newVideoTrack.id);
                        pc.addTrack(newVideoTrack, newStream);
                        await renegotiatePeer(pc, id);
                    }
                }
            }

            setVideoAvailable(true);
            setMediaError("");
            socketRef.current?.emit("video-status-change", video);
            await loadMediaDevices();
        } catch (err) {
            console.error("Camera switch failed, restoring default camera:", err);
            setIsRearCamera(previousIsRear);
            isRearCameraRef.current = previousIsRear;
            setMediaError(getMediaErrorMessage(err, "camera", isLocalSecureContext()));
            await getUserMedia({ forceVideo: true, forceAudio: audio });
        } finally {
            switchingCameraRef.current = false;
        }
    };

    const restartMedia = async () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return; // Apply mostly for mobile

        const currentStream = localStreamRef.current || window.localStream;
        
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                track.onended = null;
                track.stop();
            });
        }

        // Delay 200ms before restarting
        await new Promise(resolve => setTimeout(resolve, 200));

        let videoConstraints = video;
        if (video) {
            videoConstraints = { facingMode: isRearCameraRef.current ? "environment" : "user" };
        }

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: audio
            });

            const newVideoTrack = newStream.getVideoTracks()[0];
            const newAudioTrack = newStream.getAudioTracks()[0];

            if (newVideoTrack) {
                newVideoTrack.enabled = video;
                newVideoTrack.onended = () => setVideo(false);
            }
            if (newAudioTrack) {
                newAudioTrack.enabled = audio;
            }

            localStreamRef.current = newStream;
            window.localStream = newStream;
            
            if (localVideoref.current) {
                localVideoref.current.srcObject = newStream;
            }

            for (let id in connectionsRef.current) {
                if (id === socketIdRef.current) continue;
                const pc = connectionsRef.current[id];
                const senders = pc.getSenders();
                
                let renegotiationNeeded = false;
                
                const videoSender = senders.find(s => s.track?.kind === 'video') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'video'));
                if (videoSender && newVideoTrack) {
                    videoSender.replaceTrack(newVideoTrack).catch(e => console.error(e));
                } else if (newVideoTrack) {
                    pc.addTrack(newVideoTrack, newStream);
                    renegotiationNeeded = true;
                }

                const audioSender = senders.find(s => s.track?.kind === 'audio') || senders.find(s => pc.getTransceivers?.().find(t => t.sender === s && t.receiver?.track?.kind === 'audio'));
                if (audioSender && newAudioTrack) {
                    audioSender.replaceTrack(newAudioTrack).catch(e => console.error(e));
                } else if (newAudioTrack) {
                    pc.addTrack(newAudioTrack, newStream);
                    renegotiationNeeded = true;
                }

                if (renegotiationNeeded) {
                    pc.createOffer().then((description) => {
                        pc.setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('offer', { to: id, offer: pc.localDescription });
                            })
                            .catch(e => console.error(e));
                    });
                }
            }
        } catch (err) {
            console.error("Failed to restart media on visibility change:", err);
        }
    };

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible") {
                await restartMedia();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [video, audio]); // Rebind when video/audio state changes

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
