'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLDivElement>(null);

    return (
        <div className="animated-bg-wrapper">
            <div className="animated-bg" ref={canvasRef}>
                {/* Animated gradient waves */}
                <div className="wave wave-1"></div>
                <div className="wave wave-2"></div>
                <div className="wave wave-3"></div>

                {/* Floating orbs */}
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>
        </div>
    );
}
