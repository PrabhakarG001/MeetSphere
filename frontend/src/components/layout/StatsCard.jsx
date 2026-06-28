import '../../styles/StatsCard.css';

export default function StatsCard({ icon, value, label, delay = 0 }) {
    return (
        <div 
            className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-surface/50 backdrop-blur-sm animate-fade-in" 
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <div className="flex-shrink-0 p-3 bg-primary/10 text-primary rounded-xl">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-bold text-text">{value}</span>
                <span className="text-sm font-medium text-textSecondary">{label}</span>
            </div>
        </div>
    );
}
