import '../../styles/SectionHeader.css';
import { ChevronRight } from 'lucide-react';

export default function SectionHeader({ title, description, action }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
                <h2 className="text-xl font-bold text-text mb-1">{title}</h2>
                {description && <p className="text-sm text-textSecondary m-0">{description}</p>}
            </div>
            {action && (
                <button 
                    className="group flex items-center gap-1 text-sm font-medium text-primary hover:text-primaryHover transition-colors" 
                    onClick={action.onClick} 
                    type="button"
                >
                    {action.label}
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            )}
        </div>
    );
}
