import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/theme.css';

export default function Logo({ asLink = true, className = "", style = {}, onClick, hideText = false }) {
    const content = (
        <div className={`logo-container ${className}`} style={style} onClick={onClick}>
            <img 
                src="/logo-navbar.png" 
                alt="MeetSphere Icon" 
                className="logo-icon transition-transform hover:scale-105" 
            />
            {!hideText && (
                <span className="logo-text tracking-tight transition-transform hover:scale-105">
                    MeetSphere
                </span>
            )}
        </div>
    );

    if (asLink) {
        return (
            <Link to="/" className="text-decoration-none inline-flex items-center" style={{ textDecoration: 'none' }}>
                {content}
            </Link>
        );
    }

    return content;
}
