import React, { useEffect, useRef } from 'react';

export const ArchitecturalBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Floating architectural geometric nodes & particles
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      shape: 'circle' | 'square' | 'ring';
      angle: number;
      vAngle: number;
    }

    const colors = [
      'rgba(99, 102, 241, 0.18)', // Indigo
      'rgba(139, 92, 246, 0.16)', // Violet
      'rgba(16, 185, 129, 0.15)', // Emerald
      'rgba(59, 130, 246, 0.15)', // Blue
      'rgba(236, 72, 153, 0.12)', // Pink
    ];

    const nodesCount = Math.min(24, Math.floor(width / 60));
    const nodes: Node[] = [];

    for (let i = 0; i < nodesCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 18 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: i % 3 === 0 ? 'ring' : i % 3 === 1 ? 'square' : 'circle',
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.015,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Subtle architectural blueprint grid lines
      const gridSize = 64;
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
      ctx.lineWidth = 1;

      // Draw horizontal grid
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw vertical grid
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Connect nearby nodes with subtle constellation architectural lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.22;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw floating nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.angle += node.vAngle;

        // Bounce from walls
        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;

        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(node.angle);

        ctx.fillStyle = node.color;
        ctx.strokeStyle = node.color.replace(/[\d\.]+\)$/, '0.35)');
        ctx.lineWidth = 1.5;

        if (node.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (node.shape === 'ring') {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, node.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (node.shape === 'square') {
          const size = node.radius * 1.4;
          ctx.strokeRect(-size / 2, -size / 2, size, size);
          ctx.fillRect(-size / 4, -size / 4, size / 2, size / 2);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
      {/* Kinetic Animated Radiant Orbs in corners */}
      <div 
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-violet-400/25 via-indigo-300/20 to-transparent blur-3xl animate-pulse" 
        style={{ animationDuration: '8s' }} 
      />
      <div 
        className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-emerald-400/20 via-teal-300/20 to-transparent blur-3xl animate-pulse" 
        style={{ animationDuration: '10s' }} 
      />
      <div 
        className="absolute -bottom-32 left-1/4 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-pink-400/15 via-indigo-300/15 to-transparent blur-3xl animate-pulse" 
        style={{ animationDuration: '12s' }} 
      />

      {/* Floating Canvas for Architectural Geometry */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />
    </div>
  );
};
