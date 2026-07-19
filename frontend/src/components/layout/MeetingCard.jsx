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
            className="flex flex-col p-5 bg-white dark:bg-[#3c4043] rounded-xl border border-gray-200 dark:border-transparent shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-300 animate-fade-in group cursor-default"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Video size={20} />
                </div>
                <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Completed
                </span>
            </div>
            
            <div className="flex-1 mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate max-w-[200px]" title={meetingCode}>
                    {meetingCode}
                </h3>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400">{getRelativeDate(date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <Clock size={16} className="text-slate-400" />
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
