import React, { useMemo } from 'react';

// Simple string hash function to generate a consistent color based on a name
const stringToHslColor = (str, s, l) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
};

export default function Avatar({ name, size = 40, className = "" }) {
    const validName = name && name.trim() ? name.trim() : "?";
    const initial = validName.charAt(0).toUpperCase();
    
    // Use useMemo to avoid recalculating the color on every render
    const bgColor = useMemo(() => {
        if (validName === "?") return '#5f6368'; // Grey for unknown
        // 70% saturation, 45% lightness gives deep, vibrant, legible colors
        return stringToHslColor(validName, 70, 45);
    }, [validName]);

    return (
        <div 
            className={`flex items-center justify-center rounded-full text-white font-medium select-none flex-shrink-0 ${className}`}
            style={{ 
                backgroundColor: bgColor,
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
