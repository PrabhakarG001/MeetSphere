import '../../styles/EmptyState.css';

export default function EmptyState({ title, description, actionLabel, onAction }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-2xl bg-surface/30">
            <div className="w-24 h-24 mb-6 text-slate-500/50" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" fill="none">
                    {/* Decorative dots */}
                    <circle cx="30" cy="30" r="4" fill="currentColor" opacity="0.15" />
                    <circle cx="170" cy="25" r="6" fill="currentColor" opacity="0.1" />
                    <circle cx="25" cy="130" r="5" fill="currentColor" opacity="0.12" />
                    <circle cx="175" cy="135" r="3" fill="currentColor" opacity="0.18" />
                    <circle cx="155" cy="50" r="3" fill="currentColor" opacity="0.1" />
                    <circle cx="45" cy="55" r="2.5" fill="currentColor" opacity="0.14" />
                    {/* Monitor/screen shape */}
                    <rect x="40" y="35" width="120" height="80" rx="12" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                    <rect x="48" y="43" width="104" height="64" rx="6" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
                    {/* Stand */}
                    <line x1="100" y1="115" x2="100" y2="130" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                    <line x1="75" y1="130" x2="125" y2="130" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
                    {/* Play button circle */}
                    <circle cx="100" cy="75" r="20" stroke="currentColor" strokeWidth="2" opacity="0.35" />
                    <polygon points="94,65 94,85 112,75" fill="currentColor" opacity="0.3" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
            {description && <p className="text-sm text-textSecondary max-w-sm mb-6">{description}</p>}
            {actionLabel && onAction && (
                <button 
                    className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primaryHover transition-colors shadow-lg shadow-primary/20" 
                    onClick={onAction} 
                    type="button"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
