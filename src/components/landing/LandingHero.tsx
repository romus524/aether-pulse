import React, { useState, useCallback } from 'react';
import { SpatialWaveCanvas } from './SpatialWaveCanvas';
import { WireframeRoom3D } from './WireframeRoom3D';
import { LiveEventsPanel } from './LiveEventsPanel';

interface LandingHeroProps {
  onActivate: () => void;
  onNavigateView: (view: 'landing' | 'navigator' | 'inspector') => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onActivate, onNavigateView }) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'Sense' | 'Analyze' | 'Alert'>('Sense');

  // Subtle mouse parallax tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = -(clientY / innerHeight) * 2 + 1;
    setMousePos({ x, y });
  }, []);

  const handleActivateClick = () => {
    setPulseTrigger((prev) => prev + 1);
    setIsActivated(true);

    setTimeout(() => {
      onActivate();
    }, 1200);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen overflow-hidden landing-bg text-slate-100 flex flex-col justify-between select-none"
    >
      {/* 1. Precise 3D Spatial Wave Particle Landscape */}
      <SpatialWaveCanvas pulseTrigger={pulseTrigger} mousePos={mousePos} />

      {/* 2. Deep Atmosphere & Subtle Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Soft center ambient dark purple illumination */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-purple-950/20 rounded-full blur-[140px] pointer-events-none" />
        {/* Top-right soft cyan aura */}
        <div className="absolute top-10 right-10 w-[350px] h-[250px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_45%,rgba(5,4,23,0.85)_100%] pointer-events-none" />
      </div>

      {/* 3. Top Section: Sized-Down Glass Navigation & Top-Right Subtle 3D Room */}
      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-14 pt-5 flex items-start justify-between">
        {/* Upper-Left Translucent Glass Capsule (approx 440px wide, 68px high) */}
        <div
          style={{
            transform: `translate(${mousePos.x * 4}px, ${mousePos.y * -3}px)`,
          }}
          className="organic-blob-nav px-5 py-3 w-auto max-w-[480px] h-[68px] flex items-center gap-6 sm:gap-8 transition-transform duration-500 ease-out"
        >
          {/* Brand with ECG Pulse Icon */}
          <div
            onClick={() => onNavigateView('landing')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex items-center justify-center">
              <svg
                viewBox="0 0 54 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-5 text-cyan-300 drop-shadow-[0_0_6px_rgba(73,232,255,0.7)]"
              >
                <path
                  d="M2 14H14L18 4L24 24L30 8L36 18L40 14H52"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-manrope text-[11px] sm:text-xs font-extrabold tracking-[0.15em] text-white/95 leading-tight">
                AETHERPULSE
              </span>
              <span className="font-manrope text-[9px] sm:text-[10px] font-bold tracking-[0.25em] text-purple-300/80 leading-tight">
                CARE
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-4 sm:gap-6 text-xs font-manrope font-semibold">
            {(['Sense', 'Analyze', 'Alert'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'Analyze') onNavigateView('navigator');
                    else if (tab === 'Alert') onNavigateView('inspector');
                  }}
                  className={`relative py-1 cursor-pointer transition-colors duration-200 ${
                    isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#49e8ff]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Upper-Right Subtle Organic Glass 3D Room Container */}
        <div
          style={{
            transform: `translate(${mousePos.x * -5}px, ${mousePos.y * 4}px)`,
          }}
          className="organic-blob-room p-2 w-36 h-28 sm:w-44 sm:h-32 flex items-center justify-center transition-transform duration-500 ease-out"
        >
          <WireframeRoom3D mousePos={mousePos} />
        </div>
      </header>

      {/* 4. Central Hero with Generous Negative Space & Proportional Scale */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center my-auto -mt-6 sm:-mt-8">
        {/* Central Title (approx 55-65% viewport width, soft white/lavender) */}
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="landing-hero-title text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold uppercase tracking-tight leading-[1.08]">
            AETHERPULSE CARE:
          </h1>
          <h2 className="landing-hero-title text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold uppercase tracking-tight leading-[1.08]">
            KINETIC SENSING
          </h2>
        </div>

        {/* Muted Lavender Narrow Description */}
        <p className="mt-4 sm:mt-5 max-w-xl mx-auto text-xs sm:text-sm md:text-base font-manrope font-normal text-purple-200/70 leading-relaxed">
          Transforming ambient wireless signals into real-time spatial awareness. Detect presence, movement and critical events without cameras, wearables or physical contact.
        </p>

        {/* Small Elegant Glass ACTIVATE Pill */}
        <div className="mt-6 sm:mt-8">
          <button
            type="button"
            onClick={handleActivateClick}
            className="cta-glass-pill px-8 sm:px-11 py-2.5 sm:py-3 rounded-full font-manrope text-xs sm:text-sm font-bold tracking-[0.22em] text-white uppercase cursor-pointer flex items-center gap-2.5 group"
          >
            {isActivated ? (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#49e8ff]" />
                <span className="text-cyan-300">SYSTEM ACTIVE</span>
              </>
            ) : (
              <>
                <span>ACTIVATE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300/80 group-hover:bg-white group-hover:scale-125 transition-all shadow-[0_0_6px_#49e8ff]" />
              </>
            )}
          </button>
        </div>
      </main>

      {/* 5. Bottom Delicate "LIVE EVENTS" Glass Element */}
      <LiveEventsPanel onOpenDashboard={() => onNavigateView('navigator')} />
    </div>
  );
};
