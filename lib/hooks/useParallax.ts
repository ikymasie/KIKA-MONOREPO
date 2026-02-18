'use client';

import { useEffect, useState } from 'react';

/**
 * useParallax
 *
 * Returns a `parallaxY` value (in pixels) that increases as the user scrolls,
 * creating a parallax depth effect. Apply it as a CSS transform on a background
 * element that is slightly larger than its container.
 *
 * @param speed  Fraction of scroll offset to apply (0 = no movement, 1 = full scroll speed).
 *               A value of 0.35 means the background moves at 35% of scroll speed.
 */
export function useParallax(speed: number = 0.35): number {
    const [parallaxY, setParallaxY] = useState(0);

    useEffect(() => {
        let rafId: number;

        const handleScroll = () => {
            rafId = requestAnimationFrame(() => {
                setParallaxY(window.scrollY * speed);
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, [speed]);

    return parallaxY;
}
