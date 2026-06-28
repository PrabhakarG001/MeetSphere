import { ShieldCheck } from 'lucide-react';

export default function DeviceStatus({ cameraError }) {
    return (
        <div className="flex items-center gap-4 text-sm mt-4 p-4 rounded-xl bg-[#0a1a4a]/30 border border-[#0a1a4a]">
            <div className="flex flex-col flex-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">Status</span>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cameraError ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    <span className="text-white">{cameraError ? 'Camera/Mic Error' : 'Ready to Join'}</span>
                </div>
            </div>
            
            <div className="flex flex-col flex-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">Security</span>
                <div className="flex items-center gap-1.5 text-white">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span>End-to-end Encrypted</span>
                </div>
            </div>
        </div>
    );
}
