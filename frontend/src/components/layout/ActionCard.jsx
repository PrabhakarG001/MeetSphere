import '../../styles/ActionCard.css';

export default function ActionCard({ icon, title, description, onClick, disabled, badge }) {
    return (
        <button
            className={`group relative z-50 pointer-events-auto flex flex-col p-6 text-left transition-all duration-300 bg-white dark:bg-[#3c4043] rounded-xl border border-gray-200 dark:border-transparent shadow-sm ${
                disabled 
                    ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-[#202124]' 
                    : 'hover:border-blue-500 hover:shadow-md hover:-translate-y-1 cursor-pointer'
            }`}
            onClick={onClick}
            disabled={disabled}
            type="button"
            aria-label={title}
        >
            <div className="mb-4 inline-flex p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                {title}
                {badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        {badge}
                    </span>
                )}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 m-0 leading-relaxed">
                {description}
            </p>
        </button>
    );
}
