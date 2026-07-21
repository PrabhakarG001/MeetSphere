import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';

export default function AccountSelection() {
    const navigate = useNavigate();

    // Mock accounts to simulate Google Account Selection
    const accounts = [
        { id: 1, name: "Prabhakar Gupta", email: "prabhakar@example.com", avatar: "https://ui-avatars.com/api/?name=Prabhakar+Gupta&background=0D8ABC&color=fff" },
        { id: 2, name: "MeetSphere Work", email: "work@meetsphere.com", avatar: "https://ui-avatars.com/api/?name=MeetSphere+Work&background=1D4ED8&color=fff" }
    ];

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 font-sans" 
            style={{
                background: 'linear-gradient(180deg, #0F172A 0%, #1D4ED8 50%, #60A5FA 100%)',
                backgroundAttachment: 'fixed'
            }}
        >
            <div className="bg-white w-full max-w-[440px] rounded-2xl shadow-2xl p-8 sm:p-10 flex flex-col items-center border border-gray-100">
                
                {/* Brand */}
                <div className="mb-6 transform scale-110">
                    <Logo asLink={false} />
                </div>
                
                <h1 className="text-[1.35rem] font-medium text-gray-900 mb-8 tracking-tight">
                    Choose an account
                </h1>
                
                {/* Account List */}
                <div className="w-full flex flex-col gap-2">
                    {accounts.map(acc => (
                        <button 
                            key={acc.id}
                            className="flex items-center gap-4 w-full p-3 rounded-xl bg-transparent hover:bg-gray-50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all border border-transparent hover:border-gray-200 text-left group"
                            onClick={() => navigate('/home')}
                        >
                            <img src={acc.avatar} alt={acc.name} className="w-[42px] h-[42px] rounded-full object-cover" />
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                                    {acc.name}
                                </span>
                                <span className="text-[13px] text-gray-500 font-medium">
                                    {acc.email}
                                </span>
                            </div>
                        </button>
                    ))}
                    
                    <div className="w-full h-px bg-gray-100 my-3"></div>
                    
                    {/* Add another account */}
                    <button className="flex items-center gap-4 w-full p-3 rounded-xl bg-transparent hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200 text-left group">
                        <div className="w-[42px] h-[42px] rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 group-hover:text-blue-700 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                        </div>
                        <span className="font-medium text-gray-700 text-sm group-hover:text-blue-700 transition-colors">
                            Use another account
                        </span>
                    </button>
                </div>

                {/* Footer links */}
                <div className="mt-8 flex items-center justify-center gap-6 text-[13px] font-medium text-gray-500 w-full">
                    <button className="hover:text-gray-900 transition-colors">Help</button>
                    <button className="hover:text-gray-900 transition-colors">Privacy</button>
                    <button className="hover:text-gray-900 transition-colors">Terms</button>
                </div>
            </div>
        </div>
    );
}
