'use client';

import { useEffect, useRef, useState, RefObject } from 'react';

interface ScrollAnimationOptions {
    threshold?: number;
    rootMargin?: string;
    /** If true, stamps --stagger-index on each direct child of the ref element */
    staggerChildren?: boolean;
    /** Once visible, stays visible (default: true) */
    once?: boolean;
}

interface ScrollAnimationResult<T extends HTMLElement> {
    ref: RefObject<T>;
    isVisible: boolean;
}

/**
 * useScrollAnimation
 *
 * Observes when an element enters the viewport and adds the `in-view` class
 * to it (and optionally to each of its children with a stagger index).
 *
 * Usage:
 *   const { ref, isVisible } = useScrollAnimation<HTMLElement>();
 *   <section ref={ref} data-animate className="animate-reveal-up">...</section>
 */
export function useScrollAnimation<T extends HTMLElement = HTMLElement>(
    options: ScrollAnimationOptions = {}
): ScrollAnimationResult<T> {
    const {
        threshold = 0.12,
        rootMargin = '0px 0px -60px 0px',
        staggerChildren = false,
        once = true,
    } = options;

    const ref = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    el.classList.add('in-view');

                    // Stamp stagger indices on direct children
                    if (staggerChildren) {
                        Array.from(el.children).forEach((child, i) => {
                            (child as HTMLElement).style.setProperty('--stagger-index', String(i));
                            child.classList.add('in-view');
                        });
                    }

                    if (once) observer.disconnect();
                } else if (!once) {
                    setIsVisible(false);
                    el.classList.remove('in-view');

                    if (staggerChildren) {
                        Array.from(el.children).forEach((child) => {
                            child.classList.remove('in-view');
                        });
                    }
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin, staggerChildren, once]);

    return { ref, isVisible };
}
