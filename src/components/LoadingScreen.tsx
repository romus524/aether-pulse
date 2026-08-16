import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Activity } from 'lucide-react';
import aetherPulseLogo from '../assets/images/aether_pulse_logo_1786819504234.jpg';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Interactive Radar / Web Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface ParticleNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      pulse: number;
      pulseSpeed: number;
      isAmbient?: boolean;
    }

    const nodes: ParticleNode[] = [];
    const colors = ['#a855f7', '#06b6d4', '#818cf8', '#c084fc', '#38bdf8', '#e879f9'];

    const createNode = (ambient = false): ParticleNode => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (ambient ? 0.45 : 0.85),
      vy: (Math.random() - 0.5) * (ambient ? 0.45 : 0.85),
      radius: ambient ? Math.random() * 1.5 + 0.8 : Math.random() * 2.2 + 1.2,
      color: ambient
        ? Math.random() > 0.5 ? '#38bdf8' : '#c084fc'
        : colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      isAmbient: ambient,
    });

    const initParticles = () => {
      nodes.length = 0;
      // Calculate target counts based on current full screen dimensions
      const totalArea = width * height;
      const networkCount = Math.max(90, Math.min(220, Math.floor(totalArea / 14000)));
      const ambientCount = Math.max(60, Math.min(160, Math.floor(totalArea / 18000)));

      // Uniformly scatter across 3 horizontal bands (left, center, right) to guarantee full coverage
      for (let i = 0; i < networkCount; i++) {
        const node = createNode(false);
        nodes.push(node);
      }

      for (let i = 0; i < ambientCount; i++) {
        const node = createNode(true);
        nodes.push(node);
      }
    };

    initParticles();

    const handleResize = () => {
      if (!canvas) return;
      const oldW = width || window.innerWidth;
      const oldH = height || window.innerHeight;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // Rescale existing particle positions to stretch to the new full bounds
      if (oldW > 0 && oldH > 0 && (oldW !== width || oldH !== height)) {
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].x = (nodes[i].x / oldW) * width;
          nodes[i].y = (nodes[i].y / oldH) * height;
        }
      }

      // Re-populate if count is insufficient for ultra-wide screen
      const totalArea = width * height;
      const targetCount = Math.max(150, Math.min(380, Math.floor(totalArea / 10000)));
      while (nodes.length < targetCount) {
        nodes.push(createNode(Math.random() > 0.6));
      }
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(document.body);

    let radarAngle = 0;
    let ringRadius = 0;

    const render = () => {
      ctx.fillStyle = '#05020a';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw subtle concentric radar rings around center expanding to screen corners
      const maxDim = Math.max(width, height) * 1.2;
      for (let r = 80; r < maxDim; r += 90) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Expanding Doppler pulse wave 1
      ringRadius = (ringRadius + 1.4) % (maxDim * 0.7);
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(168, 85, 247, ${Math.max(0, 0.28 - ringRadius / (maxDim * 0.7))})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Expanding Doppler pulse wave 2
      const ringRadius2 = (ringRadius + (maxDim * 0.35)) % (maxDim * 0.7);
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6, 182, 212, ${Math.max(0, 0.22 - ringRadius2 / (maxDim * 0.7))})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sweeping radar beam line
      radarAngle += 0.018;
      const beamLength = maxDim;
      const beamX = centerX + Math.cos(radarAngle) * beamLength;
      const beamY = centerY + Math.sin(radarAngle) * beamLength;

      const gradient = ctx.createLinearGradient(centerX, centerY, beamX, beamY);
      gradient.addColorStop(0, 'rgba(192, 132, 252, 0.35)');
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.1)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, beamLength, radarAngle - 0.28, radarAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Update & Draw Web Nodes & Connecting Fibers
      const connectionDist = 145;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;

        // Wrap around boundaries smoothly
        if (n.x < -10) n.x = width + 10;
        if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10;
        if (n.y > height + 10) n.y = -10;

        // Draw connections between nearby nodes (for non-ambient nodes)
        if (!n.isAmbient) {
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            if (n2.isAmbient) continue;

            const dx = n.x - n2.x;
            const dy = n.y - n2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDist) {
              const alpha = (1 - dist / connectionDist) * 0.28;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
              ctx.lineWidth = 0.85;
              ctx.stroke();
            }
          }
        }

        // Pulse scale calculation
        const pulseScale = 1 + Math.sin(n.pulse) * 0.4;
        const currentRadius = n.radius * pulseScale;

        // Draw node point with neon glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = n.isAmbient ? 4 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // 3-second entrance timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#05020a] overflow-hidden select-none"
        >
          {/* Animated Background Canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-100" />

          {/* Atmospheric Glow & Subtle Ambient Depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05020a]/30 via-transparent to-[#05020a]/30 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.14)_0%,rgba(6,182,212,0.05)_55%,transparent_100%)] pointer-events-none" />

          {/* Central Futuristic Loading Card */}
          <div className="relative z-10 w-full max-w-lg mx-4 flex flex-col items-center">
            {/* Holographic Orbiting Logo Frame */}
            <div className="relative mb-8 flex items-center justify-center">
              {/* Outer Pulsing Aura Ring */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-40 h-40 rounded-full border border-purple-500/40 bg-purple-600/10 blur-xl pointer-events-none"
              />

              {/* Orbiting Laser Point */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute w-36 h-36 rounded-full border border-dashed border-cyan-400/30 pointer-events-none"
              >
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
              </motion.div>

              {/* Second Reverse Orbit Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute w-44 h-44 rounded-full border border-purple-500/20 pointer-events-none"
              >
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />
              </motion.div>

              {/* Main 3D Logo Glass Container */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-purple-950/80 p-2 border border-purple-400/50 shadow-[0_0_40px_rgba(168,85,247,0.35)] backdrop-blur-xl overflow-hidden group"
              >
                <img
                  src={aetherPulseLogo}
                  alt="Aether Pulse Care Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-2xl drop-shadow-[0_0_15px_rgba(192,132,252,0.6)]"
                />
                <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-cyan-400/20 opacity-50 pointer-events-none" />
              </motion.div>
            </div>

            {/* Typography & Brand Header */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-500/30 text-purple-300 text-[10px] font-sora font-semibold tracking-widest uppercase mb-2 shadow-inner">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>SPATIAL MEDICAL INTELLIGENCE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-sora font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
                <span>AETHER PULSE</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                  CARE
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-sora mt-1 tracking-wide">
                Non-Invasive Sub-mm FMCW Fall Detection & Vitals Array
              </p>
            </motion.div>

            {/* High-Tech Futuristic Enter Live Ward Button */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="mt-8 flex items-center justify-center"
            >
              <motion.button
                onClick={handleSkip}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative group p-[1px] rounded-full overflow-hidden shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] cursor-pointer"
              >
                {/* Animated Rotating Conic Gradient Border */}
                <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#c084fc_0%,#38bdf8_50%,#a855f7_100%)] opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Inner Pill Surface with Specular Glass Blur */}
                <span className="relative z-10 flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#0d071a]/90 backdrop-blur-xl border border-white/10 group-hover:border-purple-400/40 transition-colors duration-300">
                  {/* Glowing Radar Activity Beacon */}
                  <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                    <Activity className="w-3 h-3 text-cyan-300 animate-pulse" />
                    <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping pointer-events-none" />
                  </span>

                  {/* Button Label */}
                  <span className="font-sora font-semibold text-xs tracking-wider text-white uppercase group-hover:text-purple-100 transition-colors">
                    Enter Live Ward
                  </span>

                  {/* High-Tech Animated Arrow */}
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 group-hover:bg-purple-500/30 text-slate-300 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
