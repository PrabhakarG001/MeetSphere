import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import server from '../../../environment';
import { io } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, Settings } from 'lucide-react';
import Avatar from './Avatar';
import '../../styles/Video.css';

export default function PreJoin() {
    const { url } = useParams();
    const navigate = useNavigate();
    const { userData } = useContext(AuthContext);
    
    const [meetingIsValid, setMeetingIsValid] = useState(null);
    const [meetingError, setMeetingError] = useState("");
    const [isHost, setIsHost] = useState(false);
    
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [username, setUsername] = useState(userData?.name || "");
    const [mediaError, setMediaError] = useState(null);
    const [requestStatus, setRequestStatus] = useState("idle"); // idle, pending, rejected

    const localVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const socketRef = useRef(null);

    const usernameRef = useRef(username);
    const videoRef = useRef(video);
    const audioRef = useRef(audio);

    useEffect(() => { usernameRef.current = username; }, [username]);
    useEffect(() => { videoRef.current = video; }, [video]);
    useEffect(() => { audioRef.current = audio; }, [audio]);

    useEffect(() => {
        const isHostLocally = sessionStorage.getItem(`host_${url}`);
        let s;

        if (isHostLocally) {
            setMeetingIsValid(true);
            setIsHost(true);
            navigate(`/meeting/${url}`, { replace: true });
        } else {
            setMeetingIsValid(true);
            setIsHost(false);

            s = io(server, { secure: true, reconnection: true, rejectUnauthorized: false });
            socketRef.current = s;

            s.on("join-approved", () => {
                sessionStorage.setItem(`approved_${url}`, "true");
                navigate(`/meeting/${url}`, { 
                    state: { 
                        username: usernameRef.current, 
                        video: videoRef.current, 
                        audio: audioRef.current,
                        picture: userData?.picture || null
                    } 
                });
            });

            s.on("join-rejected", () => {
                setRequestStatus("rejected");
            });

            s.on("join-error", (msg) => {
                alert(msg || "Could not request join");
                setRequestStatus("idle");
            });
        }

        return () => {
            if (s) {
                s.disconnect();
            }
        };
    }, [url, navigate]);

    useEffect(() => {
        if (!meetingIsValid || isHost) return;
        
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Media access error:", err);
                setMediaError(err.message || "Could not access camera/microphone");
                setVideo(false);
                setAudio(false);
            }
        };
        getMedia();
        
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [meetingIsValid, isHost]);

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !video;
            });
            setVideo(!video);
        }
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !audio;
            });
            setAudio(!audio);
        }
    };

    const handleAskToJoin = () => {
        if (!username.trim()) {
            alert("Please enter your name");
            return;
        }

        setRequestStatus("pending");

        if (socketRef.current) {
            socketRef.current.emit("request-join", `/meeting/${url}`, username);
        }
    };

    if (meetingIsValid === null) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#111111] text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a7cff] mb-4"></div>
                <h2 className="text-xl font-medium">Loading meeting details...</h2>
            </div>
        );
    }

    if (meetingIsValid === false) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#111111] text-white">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Meeting Unavailable</h1>
                <p className="text-lg text-slate-300 mb-8">{meetingError}</p>
                <button 
                    onClick={() => navigate("/")}
                    className="px-6 py-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg transition-colors"
                >
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                
                {/* Left side: Camera Preview */}
                <div className="flex flex-col items-center w-full">
                    <div className="relative w-full aspect-video bg-[#202124] rounded-xl overflow-hidden shadow-xl ring-1 ring-[#333]">
                        {video ? (
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#202124]">
                                <Avatar name={username || "You"} picture={userData?.picture} size={96} />
                            </div>
                        )}
                        
                        {/* Audio/Video Controls overlaid */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            <button 
                                onClick={toggleAudio}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                                    audio ? 'bg-[#3c4043] hover:bg-[#4d5156] text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                            >
                                {audio ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>
                            <button 
                                onClick={toggleVideo}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                                    video ? 'bg-[#3c4043] hover:bg-[#4d5156] text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                            >
                                {video ? <Video size={20} /> : <VideoOff size={20} />}
                            </button>
                        </div>
                    </div>
                    {mediaError && <p className="text-red-400 mt-3 text-sm">{mediaError}</p>}
                </div>

                {/* Right side: Join Controls */}
                <div className="flex flex-col items-center text-center px-4">
                    <h1 className="text-3xl font-normal text-white mb-8 tracking-tight">Ready to join?</h1>
                    
                    {!userData?.token && (
                        <div className="w-full max-w-sm mb-6">
                            <input 
                                type="text"
                                placeholder="Enter your name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-transparent border border-[#5f6368] rounded-lg text-white placeholder-[#8ab4f8] focus:outline-none focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] transition-all"
                            />
                        </div>
                    )}

                    {requestStatus === "idle" && (
                        <div className="w-full max-w-sm flex flex-col gap-3">
                            <button 
                                onClick={handleAskToJoin}
                                className="w-full py-3 px-6 rounded-full font-medium text-sm tracking-wide bg-[#8ab4f8] text-[#202124] hover:bg-[#9ebcf0] hover:shadow-lg transition-all"
                            >
                                Ask to join
                            </button>
                        </div>
                    )}

                    {requestStatus === "pending" && (
                        <div className="fixed inset-0 flex items-center justify-center bg-[#111111] bg-opacity-80 backdrop-blur-sm z-50">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                                <h2 className="text-xl font-medium text-[#8ab4f8] animate-pulse">Waiting for host to admit you...</h2>
                            </div>
                        </div>
                    )}

                    {requestStatus === "rejected" && (
                        <div className="w-full max-w-sm py-3 px-6 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/30">
                            The host denied your request to join.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
