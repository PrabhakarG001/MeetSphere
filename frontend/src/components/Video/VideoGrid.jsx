import '../../styles/VideoGrid.css';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';

export default function VideoGrid({ videos, setLocalVideoElement, audio, username }) {
    const totalParticipants = videos.length + 1; // including local

    // Zoom-like dynamic grid columns
    let gridClass = "grid-cols-1";
    if (totalParticipants === 2) gridClass = "grid-cols-1 md:grid-cols-2";
    else if (totalParticipants >= 3 && totalParticipants <= 4) gridClass = "grid-cols-2";
    else if (totalParticipants >= 5 && totalParticipants <= 9) gridClass = "grid-cols-2 md:grid-cols-3";
    else if (totalParticipants >= 10) gridClass = "grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

    return (
        <div className="flex-1 w-full h-full p-4 flex items-center justify-center overflow-hidden bg-transparent">
            <div className={`w-full h-full max-h-full grid ${gridClass} gap-4 auto-rows-fr max-w-7xl mx-auto`}>
                <LocalVideo setLocalVideoElement={setLocalVideoElement} audio={audio} username={username} />
                {videos.map((video) => (
                    <RemoteVideo key={video.socketId} video={video} />
                ))}
            </div>
        </div>
    );
}
