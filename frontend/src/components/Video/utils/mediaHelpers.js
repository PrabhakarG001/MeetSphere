export const getMediaErrorMessage = (error, mediaType = "camera", isSecure) => {
    if (!navigator.mediaDevices?.getUserMedia) {
        return "Camera access is not supported in this browser. Please use Chrome, Edge, or Firefox.";
    }

    if (!isSecure) {
        return "Camera access requires HTTPS or localhost. Open the meeting on a secure URL and try again.";
    }

    switch (error?.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
            return `Permission to use your ${mediaType} was denied. Allow camera and microphone access in your browser settings, then refresh.`;
        case "NotFoundError":
        case "DevicesNotFoundError":
            return `No ${mediaType} device was found. Connect a device or choose the correct input in your browser settings.`;
        case "NotReadableError":
        case "TrackStartError":
            return `Your ${mediaType} is already in use by another app or browser tab. Close it and try again.`;
        case "OverconstrainedError":
        case "ConstraintNotSatisfiedError":
            return `The selected ${mediaType} could not be used. Switching back to the default device.`;
        case "SecurityError":
            return "Camera access is blocked by browser security settings. Check site permissions and HTTPS.";
        default:
            return `Could not start your ${mediaType}. Check browser permissions and device settings, then try again.`;
    }
};

export const getPreferredMediaConstraints = (selectedVideoDeviceId, useVideo = true, useAudio = true, facingMode = null) => {
    let videoConstraints = true;
    
    if (facingMode) {
        // Mobile-friendly camera toggle
        videoConstraints = { facingMode: { ideal: facingMode } };
    } else if (selectedVideoDeviceId) {
        // Desktop exact device fallback
        videoConstraints = { deviceId: { exact: selectedVideoDeviceId } };
    }

    return {
        video: useVideo ? videoConstraints : false,
        audio: useAudio
    };
};

export function silence() {
    let ctx = new window.AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
}

export function black({ width = 640, height = 480 } = {}) {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
}

export const stopStream = (stream) => {
    try {
        stream?.getTracks().forEach(track => {
            track.onended = null; // Prevent async teardown events from firing
            track.stop();
        });
    } catch (e) {
        console.error(e);
    }
};

export const hasLiveLocalStream = (stream, needsVideo, needsAudio) => {
    if (!stream) return false;

    const hasVideo = !needsVideo || stream.getVideoTracks().some(track => track.readyState === "live");
    const hasAudio = !needsAudio || stream.getAudioTracks().some(track => track.readyState === "live");
    return hasVideo && hasAudio;
};
