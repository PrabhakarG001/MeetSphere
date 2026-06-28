import '../../styles/FilterChips.css';

export default function FilterChips({ filters, activeFilter, onFilterChange }) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar" role="tablist" aria-label="Filter meetings">
            {filters.map(filter => (
                <button
                    key={filter}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                        activeFilter === filter 
                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                            : 'bg-surface text-textSecondary border-border hover:bg-slate-700 hover:text-text'
                    }`}
                    role="tab"
                    aria-selected={activeFilter === filter}
                    onClick={() => onFilterChange(filter)}
                    type="button"
                >
                    {filter}
                </button>
            ))}
        </div>
    );
}
