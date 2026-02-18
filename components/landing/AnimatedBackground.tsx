'use client';

import Image from 'next/image';
import { useParallax } from '@/lib/hooks/useParallax';

export default function AnimatedBackground() {
    const parallaxY = useParallax(0.35);

    return (
        <div className="animated-bg-wrapper">
            {/* Background photo with parallax */}
            <div
                className="parallax-bg absolute inset-0 scale-[1.15]"
                style={{ transform: `translateY(${parallaxY}px) scale(1.15)` }}
            >
                <Image
                    src="/images/backgrounds/gaborone-city.jpg"
                    alt="Gaborone city skyline"
                    fill
                    priority
                    quality={85}
                    className="object-cover object-center"
                    sizes="100vw"
                />
            </div>

            {/* Dark overlay to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

            {/* Colour tint overlay to preserve brand feel */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-transparent to-secondary-900/30" />

            {/* Animated orbs on top for depth */}
            <div className="animated-bg">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
            </div>
        </div>
    );
}
