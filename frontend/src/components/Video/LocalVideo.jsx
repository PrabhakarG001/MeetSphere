import '../../styles/LocalVideo.css';
import { MicOff } from 'lucide-react';

export default function LocalVideo({ setLocalVideoElement, audio, username }) {
    return (
        <div className="relative w-full h-full min-h-[200px] bg-[#1a1a1a] rounded-xl overflow-hidden shadow-sm border border-[#2a2a2a] group flex items-center justify-center">
            <video 
                className="w-full h-full object-cover mirror-mode" 
                ref={setLocalVideoElement} 
                autoPlay 
                muted 
                playsInline
            ></video>
            
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

            {/* Name tag and Mic status */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white shadow-sm border border-white/5">
                {!audio && <MicOff size={14} className="text-red-500" />}
                <span className="truncate max-w-[120px]">{username ? username : "You"}</span>
            </div>
        </div>
    );
}
