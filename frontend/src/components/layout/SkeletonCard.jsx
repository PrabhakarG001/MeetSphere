import '../../styles/SkeletonCard.css';

export default function SkeletonCard() {
    return (
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-surface/50 animate-pulse" aria-hidden="true">
            <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg" />
                <div className="w-20 h-6 bg-slate-700/50 rounded-full" />
            </div>
            <div className="flex-1 mb-6 flex flex-col gap-3">
                <div className="w-3/4 h-5 bg-slate-700/50 rounded" />
                <div className="w-1/2 h-4 bg-slate-700/50 rounded" />
                <div className="w-2/3 h-4 bg-slate-700/50 rounded" />
            </div>
            <div className="mt-auto">
                <div className="w-full h-10 bg-slate-700/50 rounded-lg" />
            </div>
        </div>
    );
}
