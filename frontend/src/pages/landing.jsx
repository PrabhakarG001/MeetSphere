import '../styles/landing.css';
import { useState, useEffect } from "react";
import "../App.css"
import { useNavigate } from 'react-router-dom'
import img1 from "../assets/img1.png";
import img2 from "../assets/img2.png";
import img3 from "../assets/img3.png";
import img4 from "../assets/img4.png";
import img5 from "../assets/img5.png";

const landingCards = [
    { image: img1 },
    { image: img2 },
    { image: img3 },
    { image: img4 },
    { image: img5 },
]

export default function LandingPage() {
    const router = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 80) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const createMeetingId = () => {
        const randomPart = Math.random().toString(36).slice(2, 8);
        return `meet-${Date.now().toString(36)}-${randomPart}`;
    }

    const createMeeting = () => {
        const meetingId = createMeetingId();
        localStorage.setItem(`host_${meetingId}`, "true");
        localStorage.setItem("pendingMeetingId", meetingId);
        router(`/room/${meetingId}`);
    }

    const renderCards = (hidden = false) =>
        landingCards.map((card, index) => (
            <article className="landingProductCard" key={hidden ? `clone-${index}` : `card-${index}`}>
                <div className="landingCardGlow"></div>
                <div className="landingCardImage">
                    <img src={card.image} alt="Feature illustration" loading={hidden ? "lazy" : "eager"} />
                </div>
            </article>
        ));

    const renderNavContent = (isScrolled) => (
        <>
            <div className='navHeader shrink-0'>
                <button className="landingLogo flex items-center gap-1 sm:gap-2 flex-nowrap whitespace-nowrap" type="button" onClick={() => router("/")}>
                    <img src="/logo-navbar.png" alt="MeetSphere" style={{ width: isScrolled ? '1.5em' : '1.8em', height: isScrolled ? '1.5em' : '1.8em', objectFit: 'contain', transition: 'all 0.3s ease' }} />
                    <span className="inline-block font-bold text-[20px] sm:text-[36px]" style={{ transition: 'all 0.3s ease' }}>MeetSphere</span>
                </button>
            </div>

            <div className={`navlist landingNavActions flex gap-2 sm:gap-4 flex-nowrap items-center justify-end shrink-0`}>
                <button className={`navPillButton navPillBlue text-[12px] sm:text-sm px-3 sm:px-5 ${isScrolled ? 'h-8 sm:h-10' : 'h-9 sm:h-11'} transition-all whitespace-nowrap font-medium`} type="button" onClick={() => router("/login")} style={{ borderRight: '3px solid #ff2ea6' }}>
                    Sign in to continue
                </button>
            </div>
        </>
    );

    return (
        <div className='landingPageContainer'>
            {/* Static Header always visible at the top */}
            <header className="landingNavStatic w-full flex flex-row flex-nowrap items-center justify-between px-3 md:px-14 py-4 sm:py-5 min-h-[70px] gap-2 sm:gap-0">
                {renderNavContent(false)}
            </header>

            {/* Scroll-activated sticky navbar */}
            <nav className={`landingNav w-full flex flex-row flex-nowrap items-center justify-between px-3 md:px-14 py-2 sm:py-2 gap-3 transition-all duration-300 ${scrolled ? 'scrolled' : ''}`}>
                {renderNavContent(true)}
            </nav>

            <div className="landingMainContainer">
                <div className="landingTextContainer">
                 <h1>When Moments Matter, Be There Instantly.</h1>
<p>Ultra-low latency video communication that removes distance and keeps every interaction natural, sharp, and uninterrupted.</p>


                    <div className="landingCtaGroup">
                    </div>
                </div>
            </div>

            <section className="landingCardGrid" aria-label="Product previews">
                <div className="landingMarqueeTrack">
                    {renderCards(false)}
                    {renderCards(true)}
                </div>
            </section>

            {/* â”€â”€ Footer â”€â”€ */}
            <footer className="landingFooter">
                <div className="footerInner">
                    <div className="footerCol footerProject">
                        <h3 className="footerHeading">MeetSphere</h3>
                        <p>A real-time communication platform built for seamless, low-latency video interaction. Crystal-clear calls, instant connections, zero compromise.</p>
                    </div>

                    <div className="footerCol footerDev">
                        <h3 className="footerHeading">About the Developer</h3>
                        <p>Passionate full-stack developer crafting modern, performant web experiences. MeetSphere is built with React, Node.js, Socket.IO, and WebRTC to push the boundaries of real-time communication.</p>
                    </div>

                    <div className="footerCol footerConnect">
                        <h3 className="footerHeading">Connect to Developer</h3>
                        <div className="footerSocials">
                            <a href="https://prabhakar-gupta-dev.vercel.app/" target="_blank" rel="noopener noreferrer" className="footerSocialLink" aria-label="Portfolio">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                <span>Portfolio</span>
                            </a>
                            <a href="https://github.com/PrabhakarG001" target="_blank" rel="noopener noreferrer" className="footerSocialLink" aria-label="GitHub">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.42-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 21.795 24 17.295 24 12 24 5.37 18.627 0 12 0z"/></svg>
                                <span>GitHub</span>
                            </a>
                            <a href="www.linkedin.com/in/prabhakargupta" target="_blank" rel="noopener noreferrer" className="footerSocialLink" aria-label="LinkedIn">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                <span>LinkedIn</span>
                            </a>
                            <a href="mailto:prabhakarg465to@gmail.com" className="footerSocialLink" aria-label="Email">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
                                <span>Email</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="footerBottom">
                    <p>&copy; {new Date().getFullYear()} Design and Developed by Prabhakar Gupta</p>
                </div>
            </footer>
        </div>
    )
}


