import '../../styles/MeetingCard.css';
import { Trash2, Video, Calendar, Clock, Play } from 'lucide-react';

export default function MeetingCard({ meetingCode, date, onRejoin, onDelete, delay = 0 }) {
    function getRelativeDate(dateString) {
        const now = new Date();
        const d = new Date(dateString);
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0 && now.toDateString() === d.toDateString()) return 'Today';
        if (diffDays === 1 || (diffDays === 0 && now.toDateString() !== d.toDateString())) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (yesterday.toDateString() === d.toDateString()) return 'Yesterday';
        }
        if (diffDays <= 7) return `${diffDays} days ago`;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    function formatTime(dateString) {
        const d = new Date(dateString);
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    return (
        <div 
            className="flex flex-col p-5 auth-glass-card hover:bg-white/10 hover:border-[#6a7cff]/50 transition-all duration-300 animate-fade-in group cursor-default"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/10 text-[#6a7cff] rounded-lg">
                    <Video size={20} />
                </div>
                <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    Completed
                </span>
            </div>
            
            <div className="flex-1 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 truncate" title={meetingCode}>
                    {meetingCode}
                </h3>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                        <Calendar size={16} className="text-white/50" />
                        {getRelativeDate(date)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                        <Clock size={16} className="text-white/50" />
                        {formatTime(date)}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3 mt-auto">
                <button 
                    className="flex-1 auth-primary-btn !min-h-[2.5rem] !text-sm"
                    onClick={onRejoin} 
                    type="button" 
                    aria-label={`Rejoin meeting ${meetingCode}`}
                >
                    <Play size={16} fill="currentColor" />
                    Rejoin
                </button>
                {onDelete && (
                    <button 
                        className="p-2 flex items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-[#ef4444]/20 hover:text-[#ef4444] transition-colors border border-transparent hover:border-[#ef4444]/30"
                        onClick={(e) => { e.stopPropagation(); onDelete(meetingCode); }} 
                        type="button" 
                        aria-label={`Delete meeting ${meetingCode}`}
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}
