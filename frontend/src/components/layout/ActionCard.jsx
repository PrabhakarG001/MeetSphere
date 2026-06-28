import '../../styles/ActionCard.css';

export default function ActionCard({ icon, title, description, onClick, disabled, badge }) {
    return (
        <button
            className={`group relative z-50 pointer-events-auto flex flex-col p-6 text-left transition-all duration-300 auth-glass-card ${
                disabled 
                    ? 'opacity-60 cursor-not-allowed bg-white/5' 
                    : 'hover:bg-white/10 hover:border-[#6a7cff]/50 hover:shadow-[0_8px_32px_rgba(106,124,255,0.15)] hover:-translate-y-1 cursor-pointer'
            }`}
            onClick={onClick}
            disabled={disabled}
            type="button"
            aria-label={title}
        >
            <div className={`mb-4 inline-flex p-3 rounded-xl transition-colors duration-300 ${disabled ? 'bg-white/5 text-white/50' : 'bg-white/10 text-[#6a7cff] group-hover:bg-[#0b5cff] group-hover:text-white'}`}>
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                {title}
                {badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-[#0b5cff]/20 text-[#6a7cff] border border-[#0b5cff]/30 rounded-full">
                        {badge}
                    </span>
                )}
            </h3>
            <p className="text-sm text-white/70 m-0">
                {description}
            </p>
        </button>
    );
}
