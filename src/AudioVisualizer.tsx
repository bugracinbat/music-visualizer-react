import { useEffect, useRef } from "react";
import styled from "styled-components";

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
}

const CanvasWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Canvas = styled.canvas`
  width: 100% !important;
  height: 100% !important;
  display: block;
  border-radius: 16px;
  background: transparent;
`;

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioRef,
  isPlaying,
  analyser,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize data array when analyser changes
  useEffect(() => {
    if (analyser) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
  }, [analyser]);

  // Drawing effect
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const dataArray = dataArrayRef.current;
      if (!canvas || !analyser || !dataArray) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth * dpr;
      const height = canvas.clientHeight * dpr;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = width / dataArray.length;
      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const barHeight = height * percent;
        const x = i * barWidth;
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(1, "#666");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * 0.7, barHeight);
      }
    };

    const render = () => {
      draw();
      animationRef.current = requestAnimationFrame(render);
    };

    if (isPlaying && analyser) {
      render();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyser]);

  return (
    <CanvasWrapper>
      <Canvas ref={canvasRef} />
    </CanvasWrapper>
  );
};
