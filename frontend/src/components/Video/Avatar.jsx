import React, { useMemo } from 'react';

// Generate a gradient based on the name
const stringToGradient = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 40) % 360; // Offset hue for gradient
    return `linear-gradient(135deg, hsl(${h1}, 70%, 55%), hsl(${h2}, 80%, 45%))`;
};

export default function Avatar({ name, picture, size = 40, className = "" }) {
    if (picture) {
        return (
            <div 
                className={`flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 shadow-sm ${className}`}
                style={{ width: `${size}px`, height: `${size}px` }}
                title={name || "Guest"}
            >
                <img src={picture} alt={name || "Guest"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
        );
    }
    const validName = name && name.trim() ? name.trim() : "?";
    const initial = validName.charAt(0).toUpperCase();
    
    // Use useMemo to avoid recalculating the color on every render
    const bgStyle = useMemo(() => {
        if (validName === "?") return 'linear-gradient(135deg, #71717a, #3f3f46)'; // Grey for unknown
        return stringToGradient(validName);
    }, [validName]);

    return (
        <div 
            className={`flex items-center justify-center rounded-full text-white font-medium select-none flex-shrink-0 shadow-sm ${className}`}
            style={{ 
                background: bgStyle,
                width: `${size}px`, 
                height: `${size}px`,
                fontSize: `${Math.max(12, size * 0.4)}px`
            }}
            title={validName}
        >
            {initial}
        </div>
    );
}
