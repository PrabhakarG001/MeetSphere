import { useEffect, useState } from 'react';
import '../../styles/VideoGrid.css';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';

export default function VideoGrid({ videos, setLocalVideoElement, video, audio, username, isRaisedHand }) {
    const totalParticipants = videos.length + 1; // including local
    const [reactions, setReactions] = useState([]);

    useEffect(() => {
        const handleReaction = (e) => {
            const { id, emoji } = e.detail;
            
            // Create a unique reaction object
            const newReaction = {
                id: Date.now() + Math.random(),
                socketId: id, // The socket ID of the sender
                emoji: emoji
            };
            
            setReactions(prev => [...prev, newReaction]);
            
            // Remove it after animation ends (e.g., 2 seconds)
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== newReaction.id));
            }, 2500);
        };

        window.addEventListener('show-reaction', handleReaction);
        return () => window.removeEventListener('show-reaction', handleReaction);
    }, []);

    // Zoom-like dynamic grid columns
    let gridClass = "grid-cols-1";
    if (totalParticipants === 2) gridClass = "grid-cols-1 md:grid-cols-2";
    else if (totalParticipants >= 3 && totalParticipants <= 4) gridClass = "grid-cols-2";
    else if (totalParticipants >= 5 && totalParticipants <= 9) gridClass = "grid-cols-2 md:grid-cols-3";
    else if (totalParticipants >= 10) gridClass = "grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

    return (
        <div className="flex-1 w-full h-full p-4 flex items-center justify-center overflow-hidden bg-transparent">
            <div className={`w-full h-full max-h-full grid ${gridClass} gap-4 auto-rows-fr max-w-7xl mx-auto`}>
                
                {/* Local Video */}
                <div 
                    className={`relative w-full h-full transition-all duration-300 rounded-xl ${isRaisedHand ? 'p-[3px]' : ''}`}
                    style={isRaisedHand ? { backgroundImage: 'linear-gradient(135deg, #ff2ea6 0%, #7b61ff 50%, #2d4fc2 100%)' } : {}}
                >
                    <div className="w-full h-full rounded-[10px] overflow-hidden relative">
                        <LocalVideo setLocalVideoElement={setLocalVideoElement} video={video} audio={audio} username={username} isRaisedHand={isRaisedHand} />
                    </div>
                    
                    {/* Render local reactions (where socketId matches a special local token or just self) */}
                    {reactions.filter(r => r.socketId === 'local').map(r => (
                        <div key={r.id} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl animate-float-up pointer-events-none z-50">
                            {r.emoji}
                        </div>
                    ))}
                </div>

                {/* Remote Videos */}
                {videos.map((video) => (
                    <div 
                        key={video.socketId} 
                        className={`relative w-full h-full transition-all duration-300 rounded-xl overflow-hidden ${video.isRaisedHand ? 'p-[3px]' : (video.isAudioEnabled ? 'ring-2 ring-green-500/50 ring-offset-2 ring-offset-[#202124]' : '')}`}
                        style={video.isRaisedHand ? { backgroundImage: 'linear-gradient(135deg, #ff2ea6 0%, #7b61ff 50%, #2d4fc2 100%)' } : {}}
                    >
                        <div className="w-full h-full rounded-[10px] overflow-hidden relative">
                            <RemoteVideo video={video} />
                        </div>
                        
                        {/* Render remote reactions */}
                        {reactions.filter(r => r.socketId === video.socketId).map(r => (
                            <div key={r.id} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl animate-float-up pointer-events-none z-50">
                                {r.emoji}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
