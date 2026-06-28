import '../../styles/TopBar.css';
import { Copy, ShieldCheck } from 'lucide-react';

export default function TopBar({ username, handleCopyInviteLink, inviteCopied }) {
    return (
        <div className="absolute top-4 left-4 z-30 pointer-events-none flex items-center gap-3">
            {/* Meeting Info Badge */}
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded text-sm text-white shadow-sm">
                <ShieldCheck size={16} className="text-green-500" />
                <span className="font-medium">{username || "Meeting Room"}</span>
            </div>

            {/* Copy Link Button */}
            <button 
                className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded text-sm transition-colors shadow-sm ${inviteCopied ? 'text-green-400' : 'text-slate-300 hover:bg-black/80 hover:text-white'}`}
                type="button" 
                onClick={handleCopyInviteLink}
                title="Copy Invite Link"
            >
                <Copy size={14} />
                <span className="hidden md:inline font-medium">{inviteCopied ? "Copied" : "Copy Link"}</span>
            </button>
        </div>
    );
}
