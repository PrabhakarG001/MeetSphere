import '../../styles/RemoteVideo.css';
import { } from 'lucide-react';

export default function RemoteVideo({ video }) {
    return (
        <div className="relative w-full h-full min-h-[200px] bg-[#1a1a1a] rounded-xl overflow-hidden shadow-sm border border-[#2a2a2a] group flex items-center justify-center">
            <video
                className="w-full h-full object-cover"
                data-socket={video.socketId}
                ref={ref => {
                    if (ref && video.stream) {
                        ref.srcObject = video.stream;
                    }
                }}
                autoPlay
                playsInline
            ></video>
            
            {/* Dark gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

            {/* Name tag and Mic status */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white shadow-sm border border-white/5">
                {/* Assuming remote video doesn't provide audio state dynamically in this scope, we simulate or omit. If we had audio state, we'd show it. */}
                <span className="truncate max-w-[120px]">Guest</span>
            </div>
        </div>
    );
}
