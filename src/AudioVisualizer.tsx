import { useEffect, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { FaExpand, FaCompress } from "react-icons/fa";

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
}

type VisualizerMode =
  | "bars"
  | "wave"
  | "circle"
  | "particles"
  | "spectrum"
  | "flow"
  | "pulse"
  | "rings";

type ColorTheme = "monochrome" | "rainbow" | "neon" | "pastel";

interface VisualizerSettings {
  sensitivity: number;
  intensity: number;
  colorTheme: ColorTheme;
  showControls: boolean;
}

const Container = styled.div`
  width: 100%;
  height: 250px;
  background: #18181b;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 32px 0 #0004;
  @media (max-width: 800px) {
    height: 180px;
  }
  @media (max-width: 500px) {
    height: 120px;
  }
`;

const FullscreenContainer = styled(Container)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  z-index: 1000;
  background: #000;
`;

const ModeSelector = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  z-index: 10;
`;

const ModeButton = styled(motion.button)<{ active: boolean }>`
  background: ${(props) =>
    props.active ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)"};
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const FullscreenButton = styled(ModeButton)`
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
`;

const ControlsPanel = styled(motion.div)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 200px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ControlLabel = styled.label`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ControlSlider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  }
`;

const ThemeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ThemeButton = styled(motion.button)<{ active: boolean }>`
  background: ${(props) =>
    props.active ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)"};
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  flex: 1;
  min-width: 60px;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ToggleButton = styled(motion.button)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  z-index: 30;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
}

interface MatrixDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  brightness: number;
}

export const AudioVisualizer = ({
  audioRef,
  isPlaying,
  analyser,
}: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<VisualizerMode>("bars");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState<VisualizerSettings>({
    sensitivity: 1,
    intensity: 1,
    colorTheme: "monochrome",
    showControls: false,
  });
  const particlesRef = useRef<Particle[]>([]);
  const matrixDropsRef = useRef<MatrixDrop[]>([]);
  const hueRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const initParticles = (width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        color: `hsl(${Math.random() * 360}, 50%, 50%)`,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
    particlesRef.current = particles;
  };

  const initMatrixDrops = (width: number) => {
    const drops: MatrixDrop[] = [];
    for (let i = 0; i < width / 20; i++) {
      drops.push({
        x: i * 20,
        y: Math.random() * -1000,
        speed: Math.random() * 2 + 1,
        length: Math.floor(Math.random() * 20) + 5,
        brightness: Math.random() * 0.5 + 0.5,
      });
    }
    matrixDropsRef.current = drops;
  };

  const getColor = (index: number, alpha: number = 1) => {
    switch (settings.colorTheme) {
      case "rainbow":
        return `hsla(${
          (hueRef.current + index * 10) % 360
        }, 100%, 50%, ${alpha})`;
      case "neon":
        const neonColors = ["#ff00ff", "#00ffff", "#ff0000", "#00ff00"];
        return `${neonColors[index % neonColors.length]}${Math.floor(
          alpha * 255
        )
          .toString(16)
          .padStart(2, "0")}`;
      case "pastel":
        return `hsla(${
          (hueRef.current + index * 30) % 360
        }, 70%, 80%, ${alpha})`;
      default:
        return `rgba(255, 255, 255, ${alpha})`;
    }
  };

  const drawBars = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      dataArray: Uint8Array,
      width: number,
      height: number
    ) => {
      const barWidth = width / dataArray.length;
      const barSpacing = 2;
      const maxBarHeight = height * 0.8 * settings.intensity;
      const sensitivity = settings.sensitivity;

      ctx.save();
      ctx.beginPath();

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * maxBarHeight * sensitivity;
        const x = i * (barWidth + barSpacing);
        const y = height - barHeight;

        ctx.fillStyle = getColor(i, 0.8);
        ctx.fillRect(x, y, barWidth, barHeight);

        if (barHeight > height * 0.1) {
          ctx.shadowColor = getColor(i, 0.5);
          ctx.shadowBlur = 10 * settings.intensity;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      ctx.restore();
    },
    [settings.intensity, settings.sensitivity, getColor]
  );

  const drawWave = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < dataArray.length; i++) {
      const x = (i / dataArray.length) * width;
      const y =
        ((dataArray[i] - 128) / 128) *
          (height / 2) *
          settings.sensitivity *
          settings.intensity +
        height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, getColor(0, 0.8));
    gradient.addColorStop(0.5, getColor(120, 0.8));
    gradient.addColorStop(1, getColor(240, 0.8));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3 * settings.intensity;
    ctx.stroke();

    // Add mirror effect
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < dataArray.length; i++) {
      const x = (i / dataArray.length) * width;
      const y =
        height -
        (((dataArray[i] - 128) / 128) *
          (height / 2) *
          settings.sensitivity *
          settings.intensity +
          height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = gradient;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Add glow effect
    ctx.shadowColor = getColor(0, 0.5);
    ctx.shadowBlur = 15 * settings.intensity;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawCircle = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4 * settings.intensity;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, width, height);

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = getColor(0, 0.3);
    ctx.lineWidth = 2 * settings.intensity;
    ctx.stroke();

    // Draw frequency bars
    for (let i = 0; i < dataArray.length; i++) {
      const angle = (i / dataArray.length) * Math.PI * 2;
      const barLength =
        (dataArray[i] / 255) * radius * 0.5 * settings.sensitivity;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barLength);
      const y2 = centerY + Math.sin(angle) * (radius + barLength);

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, getColor(i, 0.8));
      gradient.addColorStop(1, getColor(i, 0.2));

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 * settings.intensity;
      ctx.stroke();

      // Add glow effect
      ctx.shadowColor = getColor(i, 0.5);
      ctx.shadowBlur = 10 * settings.intensity;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw inner circle
    const innerRadius = radius * 0.3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = getColor(0, 0.2);
    ctx.fill();
  };

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, width, height);

    // Update and draw particles
    particlesRef.current.forEach((particle, i) => {
      const frequency =
        (dataArray[i % dataArray.length] / 255) * settings.sensitivity;

      particle.x += particle.speedX * (1 + frequency) * settings.intensity;
      particle.y += particle.speedY * (1 + frequency) * settings.intensity;
      particle.alpha = 0.5 + frequency * 0.5;

      // Wrap around screen
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;

      // Draw particle with glow
      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.size * (1 + frequency) * settings.intensity,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = getColor(i, particle.alpha);
      ctx.shadowColor = getColor(i, particle.alpha);
      ctx.shadowBlur = 15 * settings.intensity;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw connection lines
      particlesRef.current.forEach((otherParticle, j) => {
        if (i !== j) {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = getColor(i, 0.2 * (1 - distance / 100));
            ctx.lineWidth = 1 * settings.intensity;
            ctx.stroke();
          }
        }
      });
    });
  };

  const drawSpectrum = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) => {
    const barWidth = width / dataArray.length;
    const centerY = height / 2;

    // Create gradient for the spectrum
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, getColor(0, 0.8));
    gradient.addColorStop(0.5, getColor(180, 0.4));
    gradient.addColorStop(1, getColor(360, 0.1));

    ctx.fillStyle = gradient;

    // Draw spectrum bars with smooth curves
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < dataArray.length; i++) {
      const x = i * barWidth;
      const barHeight =
        (dataArray[i] / 255) *
        height *
        0.8 *
        settings.sensitivity *
        settings.intensity;

      // Create smooth curve between points
      if (i === 0) {
        ctx.lineTo(x, centerY - barHeight / 2);
      } else {
        const prevX = (i - 1) * barWidth;
        const prevHeight =
          (dataArray[i - 1] / 255) *
          height *
          0.8 *
          settings.sensitivity *
          settings.intensity;
        const cp1x = prevX + (x - prevX) * 0.5;
        const cp1y = centerY - prevHeight / 2;
        const cp2x = prevX + (x - prevX) * 0.5;
        const cp2y = centerY - barHeight / 2;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, centerY - barHeight / 2);
      }
    }

    // Mirror the top curve to create bottom curve
    for (let i = dataArray.length - 1; i >= 0; i--) {
      const x = i * barWidth;
      const barHeight =
        (dataArray[i] / 255) *
        height *
        0.8 *
        settings.sensitivity *
        settings.intensity;

      if (i === dataArray.length - 1) {
        ctx.lineTo(x, centerY + barHeight / 2);
      } else {
        const nextX = (i + 1) * barWidth;
        const nextHeight =
          (dataArray[i + 1] / 255) *
          height *
          0.8 *
          settings.sensitivity *
          settings.intensity;
        const cp1x = x + (nextX - x) * 0.5;
        const cp1y = centerY + nextHeight / 2;
        const cp2x = x + (nextX - x) * 0.5;
        const cp2y = centerY + barHeight / 2;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, centerY + barHeight / 2);
      }
    }

    ctx.closePath();
    ctx.fill();

    // Add glow effect
    ctx.shadowColor = getColor(0, 0.5);
    ctx.shadowBlur = 20 * settings.intensity;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawFlow = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4 * settings.intensity;

    // Create radial gradient
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      maxRadius
    );
    gradient.addColorStop(0, getColor(0, 0.8));
    gradient.addColorStop(0.5, getColor(180, 0.3));
    gradient.addColorStop(1, getColor(360, 0));

    ctx.fillStyle = gradient;

    // Draw flowing circles
    for (let i = 0; i < dataArray.length; i++) {
      const angle = (i / dataArray.length) * Math.PI * 2;
      const radius = (dataArray[i] / 255) * maxRadius * settings.sensitivity;

      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
        radius * 0.1 * settings.intensity,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Add connecting lines
    ctx.strokeStyle = getColor(0, 0.2);
    ctx.lineWidth = 1 * settings.intensity;

    for (let i = 0; i < dataArray.length; i++) {
      const angle1 = (i / dataArray.length) * Math.PI * 2;
      const angle2 = ((i + 1) / dataArray.length) * Math.PI * 2;
      const radius1 = (dataArray[i] / 255) * maxRadius * settings.sensitivity;
      const radius2 =
        (dataArray[(i + 1) % dataArray.length] / 255) *
        maxRadius *
        settings.sensitivity;

      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle1) * radius1,
        centerY + Math.sin(angle1) * radius1
      );
      ctx.lineTo(
        centerX + Math.cos(angle2) * radius2,
        centerY + Math.sin(angle2) * radius2
      );
      ctx.stroke();
    }

    // Add glow effect
    ctx.shadowColor = getColor(0, 0.3);
    ctx.shadowBlur = 15 * settings.intensity;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawPulse = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) => {
    // Clear the canvas with a fade effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4 * settings.intensity;

    // Create base gradient
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      maxRadius
    );
    gradient.addColorStop(0, getColor(0, 0.9));
    gradient.addColorStop(0.5, getColor(180, 0.3));
    gradient.addColorStop(1, getColor(360, 0));

    // Draw multiple pulsing circles
    for (let i = 0; i < 3; i++) {
      const frequency = (dataArray[i * 42] / 255) * settings.sensitivity;
      const radius = maxRadius * (0.3 + frequency * 0.7);
      const alpha = 0.3 - i * 0.1;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = getColor(i, alpha);
      ctx.fill();

      // Add glow effect
      ctx.shadowColor = getColor(i, 0.5);
      ctx.shadowBlur = 20 * settings.intensity;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw frequency bars
    for (let i = 0; i < dataArray.length; i++) {
      const angle = (i / dataArray.length) * Math.PI * 2;
      const frequency = (dataArray[i] / 255) * settings.sensitivity;
      const radius = maxRadius * (0.3 + frequency * 0.7);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.arc(x, y, 2 * settings.intensity, 0, Math.PI * 2);
      ctx.fillStyle = getColor(i, 0.5 + frequency * 0.5);
      ctx.fill();
    }
  };

  const drawRings = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) => {
    // Clear the canvas with a fade effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4 * settings.intensity;
    const numRings = 5;

    // Draw rings
    for (let ring = 0; ring < numRings; ring++) {
      const ringData = dataArray.slice(
        ring * (dataArray.length / numRings),
        (ring + 1) * (dataArray.length / numRings)
      );
      const baseRadius = (maxRadius * (ring + 1)) / numRings;

      ctx.beginPath();
      for (let i = 0; i < ringData.length; i++) {
        const angle = (i / ringData.length) * Math.PI * 2;
        const frequency = (ringData[i] / 255) * settings.sensitivity;
        const radius = baseRadius * (0.8 + frequency * 0.4);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Create gradient for each ring
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.8,
        centerX,
        centerY,
        baseRadius * 1.2
      );
      gradient.addColorStop(0, getColor(ring * 72, 0.3 - ring * 0.05));
      gradient.addColorStop(1, getColor(ring * 72, 0.1 - ring * 0.02));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 * settings.intensity;
      ctx.stroke();

      // Add glow effect
      ctx.shadowColor = getColor(ring * 72, 0.3);
      ctx.shadowBlur = 15 * settings.intensity;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw center orb
    const centerFrequency = (dataArray[0] / 255) * settings.sensitivity;
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      maxRadius * 0.1 * (0.5 + centerFrequency * 0.5),
      0,
      Math.PI * 2
    );
    ctx.fillStyle = getColor(0, 0.8);
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Initialize data array once
    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);

        if (mode === "particles") {
          initParticles(canvas.width, canvas.height);
        }
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId: number;
    const FPS = 60;
    const frameInterval = 1000 / FPS;

    const draw = (timestamp: number) => {
      if (!ctx || !analyser || !dataArrayRef.current) return;

      // Throttle frame rate
      if (timestamp - lastFrameTimeRef.current < frameInterval) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      lastFrameTimeRef.current = timestamp;

      // Get frequency data
      analyser.getByteFrequencyData(dataArrayRef.current);

      // Clear canvas efficiently
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw current mode
      switch (mode) {
        case "bars":
          drawBars(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "wave":
          drawWave(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "circle":
          drawCircle(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "particles":
          drawParticles(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "spectrum":
          drawSpectrum(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "flow":
          drawFlow(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "pulse":
          drawPulse(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "rings":
          drawRings(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [analyser, isPlaying, mode, isFullscreen, settings]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const VisualizerContainer = isFullscreen ? FullscreenContainer : Container;

  return (
    <VisualizerContainer>
      <canvas ref={canvasRef} />
      <ToggleButton
        onClick={() =>
          setSettings((prev) => ({ ...prev, showControls: !prev.showControls }))
        }
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {settings.showControls ? "Hide Controls" : "Show Controls"}
      </ToggleButton>
      <AnimatePresence>
        {settings.showControls && (
          <ControlsPanel
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ControlGroup>
              <ControlLabel>
                Sensitivity
                <span>{settings.sensitivity.toFixed(1)}</span>
              </ControlLabel>
              <ControlSlider
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.sensitivity}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    sensitivity: parseFloat(e.target.value),
                  }))
                }
              />
            </ControlGroup>
            <ControlGroup>
              <ControlLabel>
                Intensity
                <span>{settings.intensity.toFixed(1)}</span>
              </ControlLabel>
              <ControlSlider
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.intensity}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    intensity: parseFloat(e.target.value),
                  }))
                }
              />
            </ControlGroup>
            <ControlGroup>
              <ControlLabel>Color Theme</ControlLabel>
              <ThemeSelector>
                <ThemeButton
                  active={settings.colorTheme === "monochrome"}
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      colorTheme: "monochrome",
                    }))
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Mono
                </ThemeButton>
                <ThemeButton
                  active={settings.colorTheme === "rainbow"}
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, colorTheme: "rainbow" }))
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Rainbow
                </ThemeButton>
                <ThemeButton
                  active={settings.colorTheme === "neon"}
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, colorTheme: "neon" }))
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Neon
                </ThemeButton>
                <ThemeButton
                  active={settings.colorTheme === "pastel"}
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, colorTheme: "pastel" }))
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Pastel
                </ThemeButton>
              </ThemeSelector>
            </ControlGroup>
          </ControlsPanel>
        )}
      </AnimatePresence>
      <ModeSelector>
        <ModeButton
          active={mode === "bars"}
          onClick={() => setMode("bars")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Bars
        </ModeButton>
        <ModeButton
          active={mode === "wave"}
          onClick={() => setMode("wave")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Wave
        </ModeButton>
        <ModeButton
          active={mode === "circle"}
          onClick={() => setMode("circle")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Circle
        </ModeButton>
        <ModeButton
          active={mode === "particles"}
          onClick={() => setMode("particles")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Particles
        </ModeButton>
        <ModeButton
          active={mode === "spectrum"}
          onClick={() => setMode("spectrum")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Spectrum
        </ModeButton>
        <ModeButton
          active={mode === "flow"}
          onClick={() => setMode("flow")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Flow
        </ModeButton>
        <ModeButton
          active={mode === "pulse"}
          onClick={() => setMode("pulse")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Pulse
        </ModeButton>
        <ModeButton
          active={mode === "rings"}
          onClick={() => setMode("rings")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Rings
        </ModeButton>
      </ModeSelector>
      <FullscreenButton
        onClick={toggleFullscreen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        active={isFullscreen}
      >
        {isFullscreen ? <FaCompress /> : <FaExpand />}
      </FullscreenButton>
    </VisualizerContainer>
  );
};
