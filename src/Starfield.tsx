import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  s: number;
}

interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stars: Star[] = Array.from({ length: 160 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      s: Math.random() * 1.15 + 0.25,
    }));

    let shot: Shot | null = null;
    let frame = 0;
    let running = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    const draw = () => {
      if (!running) return;
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        frame = requestAnimationFrame(draw);
        return;
      }

      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#08101c");
      sky.addColorStop(0.45, "#0a1424");
      sky.addColorStop(1, "#070b12");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      const nebula = ctx.createRadialGradient(width * 0.72, height * 0.38, 0, width * 0.72, height * 0.38, width * 0.48);
      nebula.addColorStop(0, "rgba(36, 92, 112, 0.38)");
      nebula.addColorStop(0.45, "rgba(64, 42, 88, 0.12)");
      nebula.addColorStop(1, "transparent");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);

      const warm = ctx.createRadialGradient(width * 0.12, height * 0.8, 0, width * 0.12, height * 0.8, width * 0.4);
      warm.addColorStop(0, "rgba(120, 72, 32, 0.16)");
      warm.addColorStop(1, "transparent");
      ctx.fillStyle = warm;
      ctx.fillRect(0, 0, width, height);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const star of stars) {
        if (!reduced) {
          star.x -= 0.00006 + star.z * 0.00018;
          if (star.x < 0) star.x += 1;
        }
        ctx.fillStyle = `rgba(232, 242, 255, ${0.28 + star.z * 0.7})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.s * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) {
        if (!shot && Math.random() < 0.006) {
          shot = {
            x: Math.random() * width * 0.6,
            y: Math.random() * height * 0.45,
            vx: 7 * dpr,
            vy: 2.6 * dpr,
            life: 1,
          };
        }
        if (shot) {
          ctx.strokeStyle = `rgba(255, 248, 236, ${shot.life})`;
          ctx.lineWidth = 1.2 * dpr;
          ctx.beginPath();
          ctx.moveTo(shot.x, shot.y);
          ctx.lineTo(shot.x - shot.vx * 7, shot.y - shot.vy * 7);
          ctx.stroke();
          shot.x += shot.vx;
          shot.y += shot.vy;
          shot.life -= 0.018;
          if (shot.life <= 0) shot = null;
        }
      }

      frame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
