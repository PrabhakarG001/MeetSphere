import '../../styles/StatsCard.css';

export default function StatsCard({ icon, value, label, delay = 0 }) {
    return (
        <div 
            className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#3c4043] border border-gray-200 dark:border-transparent shadow-sm animate-fade-in" 
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <div className="flex-shrink-0 p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
            </div>
        </div>
    );
}
