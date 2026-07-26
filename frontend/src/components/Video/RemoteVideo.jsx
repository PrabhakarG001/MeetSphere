import '../../styles/RemoteVideo.css';
import { memo, useRef, useEffect } from 'react';
import { MicOff, Hand } from 'lucide-react';
import Avatar from './Avatar';

const RemoteVideo = memo(function RemoteVideo({ video }) {
    const videoElRef = useRef(null);

    useEffect(() => {
        const el = videoElRef.current;
        if (el && video.stream) {
            if (el.srcObject !== video.stream) {
                el.srcObject = video.stream;
            }
            
            const attemptPlay = () => {
                if (!el) return;
                el.play().catch(error => {
                    console.log("[WebRTC] Remote video play deferred (autoplay policy):", error?.message || error);
                });
            };

            attemptPlay();

            // Fallback: retry play on user interaction if blocked by autoplay policy
            const handleUserInteraction = () => {
                if (el && el.paused) {
                    attemptPlay();
                }
            };

            window.addEventListener('click', handleUserInteraction, { once: true });
            window.addEventListener('touchstart', handleUserInteraction, { once: true });

            return () => {
                window.removeEventListener('click', handleUserInteraction);
                window.removeEventListener('touchstart', handleUserInteraction);
            };
        }
    }, [video.stream, video.isVideoEnabled, video.socketId]);

    const handleLoadedMetadata = () => {
        if (videoElRef.current) {
            videoElRef.current.play().catch(e => console.log("[WebRTC] play on loadedmetadata deferred:", e?.message || e));
        }
    };

    const hasVideoTrack = video.stream?.getVideoTracks?.().some(track => (
        track.readyState === "live" && track.enabled !== false
    ));
    const isVideoVisible = video.isVideoEnabled !== false && hasVideoTrack;

    return (
        <div className="relative w-full h-full min-h-[200px] bg-[#1a1a1a] rounded-xl overflow-hidden shadow-sm border border-[#2a2a2a] group flex items-center justify-center">
            <video
                className={`w-full h-full object-cover transition-opacity duration-300 ${!isVideoVisible ? 'opacity-0' : 'opacity-100'}`}
                data-socket={video.socketId}
                ref={videoElRef}
                autoPlay
                playsInline
                onLoadedMetadata={handleLoadedMetadata}
            ></video>

            {!isVideoVisible && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#202124] z-10">
                    <Avatar name={video.username || "Guest"} picture={video.picture} size={96} />
                </div>
            )}
            
            {/* Dark gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

            {/* Name tag and Mic status */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white shadow-sm border border-white/5">
                {video.isAudioEnabled === false && <MicOff size={12} className="text-red-500" />}
                <span className="truncate max-w-[120px]">{video.username || "Guest"}</span>
                {video.isHost && <span className="bg-blue-600/80 text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wide flex-shrink-0">Host</span>}
            </div>

            {/* Hand Raised overlay */}
            {video.isRaisedHand && (
                <div className="absolute top-3 left-3 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-md p-1.5 border border-white/5 shadow-sm text-yellow-500 animate-bounce">
                    <Hand size={18} strokeWidth={2.5} />
                </div>
            )}
        </div>
    );
});

export default RemoteVideo;
