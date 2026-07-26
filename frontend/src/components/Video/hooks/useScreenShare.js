import { useRef, useState } from 'react';

const isMobileDevice = () => (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || window.matchMedia?.("(max-width: 640px)")?.matches
);

const hasDisplayMedia = () => Boolean(navigator.mediaDevices?.getDisplayMedia);

export const useScreenShare = (localStreamRef, localVideoref, connections, socketIdRef, socketRef, getUserMedia, attachLocalStream, switchCamera) => {
    const [screen, setScreen] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(hasDisplayMedia() || isMobileDevice());
    const [screenShareMessage, setScreenShareMessage] = useState("");
    const activeDisplayStreamRef = useRef(null);
    const restoringCameraRef = useRef(false);

    const findSenderByKind = (pc, kind) => (
        pc.getSenders().find(sender => sender.track?.kind === kind)
    );

    const renegotiatePeer = async (pc, id) => {
        if (pc.signalingState !== "stable") {
            console.log(`[WebRTC] Screen share renegotiation skipped for ${id}: signalingState=${pc.signalingState}`);
            return;
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('offer', { to: id, offer: pc.localDescription });
    };

    const replaceVideoTrackForPeers = async (videoTrack, stream, reason) => {
        for (let id in connections.current) {
            if (id === socketIdRef.current) continue;

            const pc = connections.current[id];
            if (!pc || pc.connectionState === "closed") continue;

            const sender = findSenderByKind(pc, "video");
            if (sender) {
                console.log(`[WebRTC] ${reason}: replacing video track for ${id}`, {
                    oldTrackId: sender.track?.id,
                    newTrackId: videoTrack?.id
                });
                await sender.replaceTrack(videoTrack);
                console.log(`[WebRTC] ${reason}: video track replaced successfully for ${id}`);
            } else if (videoTrack && !pc.getSenders().some(peerSender => peerSender.track?.kind === "video")) {
                console.log(`[WebRTC] ${reason}: adding missing video sender for ${id}`, videoTrack.id);
                pc.addTrack(videoTrack, stream);
                await renegotiatePeer(pc, id);
            }
        }
    };

    const restoreCameraAfterScreenShare = async () => {
        if (restoringCameraRef.current) return;
        restoringCameraRef.current = true;

        try {
            console.log("[WebRTC] Restoring camera after screen share");
            activeDisplayStreamRef.current?.getTracks().forEach(track => {
                track.onended = null;
                track.stop();
            });
            activeDisplayStreamRef.current = null;

            const currentStream = localStreamRef.current || window.localStream;
            currentStream?.getVideoTracks?.().forEach(track => {
                track.onended = null;
                track.stop();
            });

            const cameraStream = await getUserMedia({ forceVideo: true, forceAudio: true });
            const cameraTrack = cameraStream?.getVideoTracks?.()[0];

            if (cameraStream) {
                attachLocalStream(cameraStream);
            }

            if (cameraTrack) {
                await replaceVideoTrackForPeers(cameraTrack, cameraStream, "Screen share stop");
            }

            setScreen(false);
            setScreenShareMessage("");
        } catch (error) {
            console.error("[WebRTC] Failed to restore camera after screen share", error);
            setScreen(false);
            setScreenShareMessage("Screen sharing stopped. Please turn your camera back on if it does not resume automatically.");
        } finally {
            restoringCameraRef.current = false;
        }
    };

    const startScreenShare = async () => {
        const mobile = isMobileDevice();

        if (mobile) {
            setScreenShareMessage("Screen sharing is limited on mobile devices. Trying the best available option.");
        }

        if (!hasDisplayMedia()) {
            setScreenAvailable(mobile);
            setScreenShareMessage(
                mobile
                    ? "Screen sharing is limited on mobile devices. Use camera sharing instead, or join from a laptop for screen sharing."
                    : "Screen sharing is not available in this browser. Please use a desktop browser."
            );
            if (mobile && switchCamera) {
                await switchCamera();
            }
            return;
        }

        let displayStream;
        try {
            console.log("[WebRTC] Requesting display media");
            displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
        } catch (error) {
            console.error("[WebRTC] getDisplayMedia failed", error);
            setScreen(false);

            if (mobile) {
                setScreenShareMessage("Screen sharing is limited on mobile devices. Use camera sharing instead, or join from a laptop for screen sharing.");
                if (switchCamera) {
                    await switchCamera();
                }
            } else if (error?.name === "NotAllowedError" || error?.name === "AbortError") {
                setScreenShareMessage("Screen sharing was cancelled.");
            } else {
                setScreenShareMessage("Could not start screen sharing. Please check browser permissions and try again.");
            }
            return;
        }

        const screenVideoTrack = displayStream.getVideoTracks()[0];
        if (!screenVideoTrack) {
            displayStream.getTracks().forEach(track => track.stop());
            setScreenShareMessage("Could not start screen sharing because no screen video track was captured.");
            setScreen(false);
            return;
        }

        try {
            const currentStream = localStreamRef.current || window.localStream;
            const existingAudioTrack = currentStream?.getAudioTracks?.().find(track => track.readyState === "live");
            const compositeStream = new MediaStream([screenVideoTrack]);

            if (existingAudioTrack) {
                compositeStream.addTrack(existingAudioTrack);
            }

            currentStream?.getVideoTracks?.().forEach(track => {
                track.onended = null;
                track.stop();
            });

            activeDisplayStreamRef.current = displayStream;
            localStreamRef.current = compositeStream;
            window.localStream = compositeStream;
            attachLocalStream(compositeStream);

            await replaceVideoTrackForPeers(screenVideoTrack, compositeStream, "Screen share start");

            screenVideoTrack.onended = restoreCameraAfterScreenShare;
            setScreen(true);
            setScreenAvailable(true);
            setScreenShareMessage(mobile ? "Mobile screen sharing support may be limited by your browser." : "");
            socketRef.current?.emit("video-status-change", true);
        } catch (error) {
            console.error("[WebRTC] Failed to apply screen share track", error);
            displayStream.getTracks().forEach(track => track.stop());
            setScreen(false);
            setScreenShareMessage("Could not share your screen. Switching back to camera.");
            await restoreCameraAfterScreenShare();
        }
    };

    const handleScreen = async () => {
        if (screen) {
            activeDisplayStreamRef.current?.getVideoTracks?.().forEach(track => track.stop());
            await restoreCameraAfterScreenShare();
            return;
        }

        await startScreenShare();
    };

    return {
        screen,
        screenAvailable,
        setScreenAvailable,
        screenShareMessage,
        isMobileScreenShareLimited: isMobileDevice(),
        handleScreen
    };
};
