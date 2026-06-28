import '../../styles/SearchBar.css';
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder }) {
    return (
        <div className="relative flex-1 w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search size={18} />
            </div>
            <input
                className="block w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-xl text-sm text-text placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder || 'Search'}
            />
            {value && (
                <button 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-text transition-colors" 
                    onClick={() => onChange('')} 
                    type="button" 
                    aria-label="Clear search"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
