import '../../styles/RemoteVideo.css';
import { MicOff, Hand } from 'lucide-react';
import Avatar from './Avatar';

export default function RemoteVideo({ video }) {
    return (
        <div className="relative w-full h-full min-h-[200px] bg-[#1a1a1a] rounded-xl overflow-hidden shadow-sm border border-[#2a2a2a] group flex items-center justify-center">
            <video
                className={`w-full h-full object-cover ${video.isVideoEnabled === false ? 'opacity-0' : 'opacity-100'}`}
                data-socket={video.socketId}
                ref={ref => {
                    if (ref && video.stream) {
                        ref.srcObject = video.stream;
                    }
                }}
                autoPlay
                playsInline
            ></video>

            {video.isVideoEnabled === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#202124]">
                    <Avatar name={video.username || "Guest"} size={96} />
                </div>
            )}
            
            {/* Dark gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

            {/* Name tag and Mic status */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white shadow-sm border border-white/5">
                {video.isAudioEnabled === false && <MicOff size={12} className="text-red-500" />}
                <span className="truncate max-w-[120px]">{video.username || "Guest"}</span>
            </div>

            {/* Hand Raised overlay */}
            {video.isRaisedHand && (
                <div className="absolute top-3 left-3 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-md p-1.5 border border-white/5 shadow-sm text-yellow-500 animate-bounce">
                    <Hand size={18} strokeWidth={2.5} />
                </div>
            )}
        </div>
    );
}
