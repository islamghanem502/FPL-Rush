import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useGSAP } from '@gsap/react';

// Registered once — every component imports GSAP from here.
gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

// Web fonts change text heights after triggers are measured — re-measure once
// they land, or reveals fire late (or never) further down the page.
document.fonts?.ready.then(() => ScrollTrigger.refresh());

// Every choreography runs inside `gsap.matchMedia().add(MOTION_OK, …)`, so
// reduced-motion users get the finished layout with nothing left hidden.
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';

export const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export { gsap, ScrollTrigger, useGSAP };
