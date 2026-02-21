/**
 * S³ Hopf Fibration Visualization
 *
 * Renders a rotating wireframe of Hopf fibers on the 3-sphere,
 * projected to 2D via stereographic + perspective projection.
 * The golden ratio drives rotation rates so the motion never repeats.
 */

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;

interface Point4D { x: number; y: number; z: number; w: number }
interface Point2D { x: number; y: number; depth: number }

function hopf(theta: number, phi: number, psi: number): Point4D {
  const ct = Math.cos(theta / 2);
  const st = Math.sin(theta / 2);
  return {
    x: ct * Math.cos((psi + phi) / 2),
    y: ct * Math.sin((psi + phi) / 2),
    z: st * Math.cos((psi - phi) / 2),
    w: st * Math.sin((psi - phi) / 2),
  };
}

function rotateXW(p: Point4D, a: number): Point4D {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: c * p.x - s * p.w, y: p.y, z: p.z, w: s * p.x + c * p.w };
}

function rotateYZ(p: Point4D, a: number): Point4D {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x, y: c * p.y - s * p.z, z: s * p.y + c * p.z, w: p.w };
}

function project(p: Point4D, fov: number): Point2D {
  const stereo = 1 / (1.15 - p.w);
  const x3 = p.x * stereo;
  const y3 = p.y * stereo;
  const z3 = p.z * stereo;
  const persp = fov / (fov + z3);
  return { x: x3 * persp, y: y3 * persp, depth: z3 };
}

export function initS3(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')!;
  let width = 0;
  let height = 0;
  let animId = 0;

  const FIBERS = 20;
  const PTS = 72;
  const FOV = 3.2;

  // Distribute fiber base-points on S² via golden spiral
  const fibers: { theta: number; phi: number }[] = [];
  for (let i = 0; i < FIBERS; i++) {
    const t = i / FIBERS;
    fibers.push({
      theta: Math.acos(1 - 2 * t),
      phi: TAU * i / PHI,
    });
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(time: number) {
    ctx.clearRect(0, 0, width, height);

    const t = time * 0.00018;
    const rXW = t;
    const rYZ = t * PHI * 0.37;

    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) * 0.28;

    for (const fiber of fibers) {
      const pts: Point2D[] = [];

      for (let j = 0; j <= PTS; j++) {
        const psi = (j / PTS) * TAU;
        let p = hopf(fiber.theta, fiber.phi, psi);
        p = rotateXW(p, rXW);
        p = rotateYZ(p, rYZ);
        pts.push(project(p, FOV));
      }

      // Draw with depth-varying opacity and width
      ctx.beginPath();
      for (let j = 0; j < pts.length; j++) {
        const sx = cx + pts[j].x * scale;
        const sy = cy + pts[j].y * scale;
        if (j === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }

      const avgD = pts.reduce((s, p) => s + p.depth, 0) / pts.length;
      const norm = Math.max(0, Math.min(1, (avgD + 2.5) / 5));
      const alpha = 0.04 + norm * 0.2;
      const lw = 0.3 + norm * 0.9;

      ctx.strokeStyle = `rgba(201, 168, 76, ${alpha})`;
      ctx.lineWidth = lw;
      ctx.stroke();
    }

    animId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  animId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  };
}
