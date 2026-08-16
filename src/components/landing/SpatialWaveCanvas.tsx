import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SpatialWaveCanvasProps {
  pulseTrigger: number;
  mousePos: { x: number; y: number };
}

export const SpatialWaveCanvas: React.FC<SpatialWaveCanvasProps> = ({ pulseTrigger, mousePos }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pulseStartTimeRef = useRef<number>(-999);

  useEffect(() => {
    if (pulseTrigger > 0) {
      pulseStartTimeRef.current = performance.now() * 0.001;
    }
  }, [pulseTrigger]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Responsive particle count distributed along broad horizontal continuous ribbon bands
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200;
    const particleCount = isMobile ? 4500 : isTablet ? 6500 : 9000;

    // Scene & Deep Atmosphere Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050417, 0.012);

    // Perspective Camera with elevated tilt looking down onto 3D waves
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );
    camera.position.set(0, 7.0, 36);
    camera.lookAt(0, -2.5, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Soft, crisp luminous particle texture with clear dot center
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.25, 'rgba(220, 245, 255, 0.9)');
        gradient.addColorStop(0.6, 'rgba(124, 56, 181, 0.35)');
        gradient.addColorStop(1, 'rgba(5, 4, 23, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const particleTexture = createParticleTexture();

    // Geometry buffers
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const baseParams = new Float32Array(particleCount * 4); // [bandId, normX, normZ, speed]
    const sizes = new Float32Array(particleCount);

    // Palette Colors matching prompt instructions
    const colCyan = new THREE.Color('#49E8FF');
    const colBlue = new THREE.Color('#568DFF');
    const colViolet = new THREE.Color('#9B5CFF');
    const colMagenta = new THREE.Color('#D84CFF');
    const colDeepPurple = new THREE.Color('#4B1E78');
    const colWhite = new THREE.Color('#FFFFFF');

    // 5 Distinct Horizontal Structured Wave Bands
    // Band 0: Sparse upper atmospheric signal ribbon (dim cyan/violet)
    // Band 1: Upper-mid arching cyan/electric blue wave (flowing behind/under title)
    // Band 2: Mid violet/magenta continuous undulating ribbon (wide expanse)
    // Band 3: Foreground sweeping cyan/magenta wave (lower half)
    // Band 4: Deep foreground dense floor wave (bottom edge)
    const bandCount = 5;
    const bandZCenters = [-22, -10, 0, 10, 18];
    const bandBaseY = [-1.0, -3.5, -6.0, -8.5, -11.0];

    const xSpan = 90; // broad width from far left to far right

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      // Assign to one of the 5 structured bands
      const rand = Math.random();
      let bandId = 0;
      if (rand < 0.12) bandId = 0;       // sparse upper
      else if (rand < 0.35) bandId = 1;  // upper-mid
      else if (rand < 0.65) bandId = 2;  // mid violet
      else if (rand < 0.88) bandId = 3;  // foreground cyan/magenta
      else bandId = 4;                  // bottom foreground

      // Continuous X coordinate across wide space
      const normX = Math.random(); // 0 to 1
      const x = (normX - 0.5) * xSpan;

      // Structured lateral displacement in each ribbon (thin ribbons, not deep clouds)
      const zOffset = (Math.random() - 0.5) * (bandId === 0 ? 10 : 6.5);
      const z = bandZCenters[bandId] + zOffset;

      // Vertical micro jitter to form crisp point terrain
      const yOffset = (Math.random() - 0.5) * 1.2;
      const y = bandBaseY[bandId] + yOffset;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Speed of flow (very slow, smooth continuous travel)
      const speed = 0.25 + (bandId * 0.05) + Math.random() * 0.15;
      baseParams[i4] = bandId;
      baseParams[i4 + 1] = normX;
      baseParams[i4 + 2] = zOffset;
      baseParams[i4 + 3] = speed;

      // Particle Size & Signal Nodes
      const isSignalNode = Math.random() < 0.035;
      let pSize = 0.5 + Math.random() * 0.6; // mostly 0.5px - 1.2px
      if (bandId >= 3) pSize *= 1.35;       // foreground slightly larger
      else if (bandId === 0) pSize *= 0.75; // background tiny
      if (isSignalNode) pSize = 2.2;        // bright signal node
      sizes[i] = pSize;

      // Precise Color by Band & Horizontal Wave Phase
      const col = new THREE.Color();
      const wavePhase = (normX + Math.random() * 0.1) % 1;

      if (isSignalNode) {
        col.copy(colWhite);
      } else if (bandId === 0) {
        // Sparse upper: dim violet/cyan
        col.lerpColors(colViolet, colCyan, wavePhase);
        col.multiplyScalar(0.45); // dim
      } else if (bandId === 1) {
        // Cyan / Electric Blue wave
        col.lerpColors(colCyan, colBlue, Math.sin(normX * Math.PI) * 0.8 + 0.2);
        col.multiplyScalar(0.75);
      } else if (bandId === 2) {
        // Violet to Magenta wave
        col.lerpColors(colViolet, colMagenta, wavePhase);
        col.multiplyScalar(0.7);
      } else if (bandId === 3) {
        // Cyan / Magenta lower wave (prominent in reference image)
        col.lerpColors(colCyan, colMagenta, Math.sin(normX * Math.PI * 2) * 0.5 + 0.5);
        col.multiplyScalar(0.85);
      } else {
        // Deep foreground wave
        col.lerpColors(colDeepPurple, colViolet, wavePhase);
        col.multiplyScalar(0.6);
      }

      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.85,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Animation & Smooth Wave Evaluation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      // Pulse calculation if activated
      const timeSincePulse = time - pulseStartTimeRef.current;
      const isPulsing = timeSincePulse >= 0 && timeSincePulse < 3.0;
      const pulseRadius = timeSincePulse * 30.0;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const i4 = i * 4;

        const bandId = baseParams[i4];
        const normX = baseParams[i4 + 1];
        const zOffset = baseParams[i4 + 2];
        const speed = baseParams[i4 + 3];

        // 1. Slow, continuous left-to-right fluid horizontal travel
        let curX = ((normX * xSpan + time * speed * 3.5) % xSpan) - xSpan * 0.5;

        // 2. Smooth Long-Wavelength Wave Functions (clean, non-chaotic wave bands)
        // Primary long wave
        const w1 = Math.sin(curX * 0.045 + time * 0.35 + bandId * 1.1) * 3.2;
        // Secondary harmonic
        const w2 = Math.sin(curX * 0.09 - time * 0.22 + bandId * 0.8) * 1.4;
        // Depth modulation
        const wZ = Math.cos(curX * 0.035 + time * 0.18) * 1.8;

        // Band-specific graceful curvature
        let archOffset = 0;
        if (bandId === 1) {
          // Upper-mid cyan arch dipping below the title in the center to preserve negative space
          archOffset = Math.sin((curX / xSpan + 0.5) * Math.PI) * 2.8 - 1.5;
        } else if (bandId === 2) {
          // Violet wave cresting gently
          archOffset = Math.cos((curX / xSpan + 0.5) * Math.PI * 2) * 2.2;
        } else if (bandId === 3) {
          // Lower cyan/magenta wave flowing across lower third
          archOffset = Math.sin((curX / xSpan + 0.2) * Math.PI * 2.5) * 2.5;
        }

        let finalY = bandBaseY[bandId] + w1 + w2 + archOffset;
        let finalZ = bandZCenters[bandId] + zOffset + wZ;
        let finalX = curX;

        // Strict Negative Space Clearance around center title (between Y -2.5 and +4.0 and X -14 to +14)
        if (Math.abs(finalX) < 16 && finalY > -3.0 && finalY < 5.0) {
          // Gently push particles downward to keep the central title region pristine and readable
          finalY -= 3.2 * (1.0 - Math.abs(finalX) / 16);
        }

        // 3. Subtle Activation Pulse Ripple
        if (isPulsing) {
          const dist = Math.sqrt(finalX * finalX + (finalY + 4) * (finalY + 4) + finalZ * finalZ);
          const diff = Math.abs(dist - pulseRadius);
          if (diff < 4.5) {
            const ripple = (1.0 - diff / 4.5) * Math.max(0, 1.0 - timeSincePulse / 3.0);
            finalY += Math.sin(diff * 1.2) * ripple * 2.5;
            finalZ += ripple * 2.0;
          }
        }

        posArray[i3] = finalX;
        posArray[i3 + 1] = finalY;
        posArray[i3 + 2] = finalZ;
      }

      posAttr.needsUpdate = true;

      // Subtle 2-5% Damped Mouse Parallax (camera stays almost stationary)
      const targetCamX = mousePos.x * 1.8;
      const targetCamY = 7.0 - mousePos.y * 1.2;
      const targetCamZ = 36 + mousePos.y * 1.0;

      camera.position.x += (targetCamX - camera.position.x) * 0.04;
      camera.position.y += (targetCamY - camera.position.y) * 0.04;
      camera.position.z += (targetCamZ - camera.position.z) * 0.04;
      camera.lookAt(0, -3.0, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
};
