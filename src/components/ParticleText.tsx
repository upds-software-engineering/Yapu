import React, { useEffect, useRef, useState } from 'react';

interface ParticleTextProps {
  text?: string;
  subtext?: string;
  colors?: string[];
  particleSize?: number;
  spacing?: number;
  fontSize?: number;
  className?: string;
  repulseRadius?: number;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export const ParticleText: React.FC<ParticleTextProps> = ({
  text = 'YAPU',
  subtext = 'RUNASIMI YACHAY',
  colors = ['#F59E0B', '#B94700', '#0D9488', '#38BDF8', '#FCD34D'],
  particleSize = 2,
  spacing = 4,
  fontSize = 72,
  className = '',
  repulseRadius = 90
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; isInteracting: boolean }>({
    x: -9999,
    y: -9999,
    isInteracting: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const setupCanvas = () => {
      const container = containerRef.current;
      const width = container ? container.clientWidth : 600;
      const height = container ? Math.min(260, Math.max(180, container.clientHeight)) : 220;

      // Handle retina displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Create offscreen canvas to sample text pixels
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.clearRect(0, 0, width, height);

      // Responsive font size
      const calculatedFontSize = Math.min(fontSize, Math.max(36, Math.floor(width / (text.length * 0.7))));
      offCtx.font = `bold ${calculatedFontSize}px "Space Grotesk", "Plus Jakarta Sans", sans-serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillStyle = '#ffffff';

      const centerY = subtext ? height / 2 - 16 : height / 2;
      offCtx.fillText(text, width / 2, centerY);

      if (subtext) {
        const subFontSize = Math.max(12, Math.floor(calculatedFontSize * 0.28));
        offCtx.font = `600 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
        offCtx.letterSpacing = '3px';
        offCtx.fillStyle = '#ffffff';
        offCtx.fillText(subtext, width / 2, centerY + calculatedFontSize * 0.65);
      }

      const imgData = offCtx.getImageData(0, 0, width, height).data;
      particles = [];

      // Sample pixels
      for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
          const index = (y * width + x) * 4;
          const alpha = imgData[index + 3];

          if (alpha > 128) {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            // Initial scatter position
            const startX = x + (Math.random() - 0.5) * 200;
            const startY = y + (Math.random() - 0.5) * 200;

            particles.push({
              x: startX,
              y: startY,
              originX: x,
              originY: y,
              vx: 0,
              vy: 0,
              size: Math.random() > 0.8 ? particleSize * 1.5 : particleSize,
              color: randomColor,
              alpha: Math.random() * 0.4 + 0.6,
            });
          }
        }
      }
    };

    setupCanvas();

    const handleResize = () => {
      setupCanvas();
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      const container = containerRef.current;
      const width = container ? container.clientWidth : 600;
      const height = container ? container.clientHeight : 220;

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics: distance to origin
        const dx = p.originX - p.x;
        const dy = p.originY - p.y;
        const distToOrigin = Math.sqrt(dx * dx + dy * dy);

        // Spring force towards origin
        const spring = 0.07;
        const friction = 0.86;
        p.vx += dx * spring;
        p.vy += dy * spring;

        // Interaction repulsion force
        if (mouse.isInteracting) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const distToMouse = Math.sqrt(mdx * mdx + mdy * mdy);

          if (distToMouse < repulseRadius && distToMouse > 0) {
            const force = (1 - distToMouse / repulseRadius) * 8;
            const angle = Math.atan2(mdy, mdx);
            p.vx += Math.cos(angle) * force;
            p.vy += Math.sin(angle) * force;
          }
        }

        // Apply friction
        p.vx *= friction;
        p.vy *= friction;

        p.x += p.vx;
        p.y += p.vy;

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [text, subtext, colors, particleSize, spacing, fontSize, repulseRadius]);

  // Pointer event listeners
  const updatePointerPosition = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
      isInteracting: true,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updatePointerPosition(e.clientX, e.clientY);
  };

  const handlePointerLeave = () => {
    mouseRef.current.isInteracting = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updatePointerPosition(touch.clientX, touch.clientY);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full flex items-center justify-center overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerLeave}
        className="touch-none cursor-pointer select-none"
      />
    </div>
  );
};
export default ParticleText;
