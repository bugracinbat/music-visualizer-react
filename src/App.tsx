import { useRef, useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  FaPlay,
  FaPause,
  FaUpload,
  FaMusic,
  FaVolumeUp,
  FaVolumeMute,
  FaRandom,
  FaRedo,
} from "react-icons/fa";
import { AudioVisualizer } from "./AudioVisualizer";
import { motion, AnimatePresence } from "framer-motion";

const GlobalStyle = createGlobalStyle`
  body {
    background: #000;
    color: #fff;
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  min-height: 100vh;
  background: #000;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 50% 0%,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 0% 100%,
        rgba(255, 255, 255, 0.05) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 100% 100%,
        rgba(255, 255, 255, 0.05) 0%,
        transparent 50%
      );
    pointer-events: none;
  }
`;

const Header = styled.header`
  width: 100%;
  padding: 2rem 0 1rem 0;
  text-align: center;
  background: transparent;
  position: relative;
  z-index: 1;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -1px;
  margin: 0;
  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

  @media (max-width: 600px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0.5rem 0 0 0;
  font-weight: 500;

  @media (max-width: 600px) {
    font-size: 1rem;
  }
`;

const UploadLabel = styled(motion.label)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  margin: 2rem 0 1rem 0;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const AudioInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
  width: 100%;
  max-width: 700px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const TrackTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 500;
  color: #fff;
  margin: 0;
  text-align: center;
`;

const TimeDisplay = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  margin: 0.5rem 0;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const Progress = styled(motion.div)`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const VolumeSlider = styled.input`
  width: 100px;
  -webkit-appearance: none;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const LoadingOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  backdrop-filter: blur(4px);
  z-index: 100;
`;

const VisualizerPlaceholder = styled.div`
  width: 100%;
  max-width: 700px;
  height: 250px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 32px 0 rgba(0, 0, 0, 0.2);
  @media (max-width: 800px) {
    height: 180px;
    font-size: 1rem;
  }
  @media (max-width: 500px) {
    height: 120px;
    font-size: 0.9rem;
    margin: 1rem 0;
  }
`;

function App() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [trackName, setTrackName] = useState<string>("");
  const [isLooping, setIsLooping] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const sampleSongUrl =
    "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3?filename=electronic-future-beats-117997.mp3";

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleLoop = () => {
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };

  const loadSampleSong = () => {
    setIsLoading(true);
    cleanupAudio();
    setAudioUrl(sampleSongUrl);
    setTrackName("Electronic Future Beats");
    setIsPlaying(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      cleanupAudio();
      setAudioUrl(URL.createObjectURL(file));
      setTrackName(file.name.replace(/\.[^/.]+$/, ""));
      setIsPlaying(false);
    }
  };

  // Cleanup function
  const cleanupAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Setup audio context when audio element changes
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    // Clean up existing audio context
    cleanupAudio();

    // Create new audio context and analyzer
    const audioCtx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;

    // Create source node
    const source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Store references
    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceNodeRef.current = source;

    return cleanupAudio;
  }, [audioUrl]); // Only recreate when audio URL changes

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <Title>HarmonyViz</Title>
          <Subtitle>Experience Music in Motion</Subtitle>
        </Header>
        <ButtonGroup>
          <UploadLabel whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <FaUpload /> Upload Music
            <HiddenInput
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
            />
          </UploadLabel>
          <Button
            onClick={loadSampleSong}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaMusic /> Try Sample Song
          </Button>
        </ButtonGroup>
        {audioUrl && (
          <>
            <audio
              key={audioUrl}
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
            <AudioInfo>
              <TrackTitle>{trackName}</TrackTitle>
              <ProgressBar onClick={handleProgressClick}>
                <Progress
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentTime / duration) * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </ProgressBar>
              <TimeDisplay>
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </TimeDisplay>
              <VolumeControl>
                <button
                  onClick={toggleMute}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <VolumeSlider
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                />
              </VolumeControl>
            </AudioInfo>
            <ButtonGroup>
              <Button
                onClick={togglePlay}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </Button>
              <Button
                onClick={toggleLoop}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: isLooping ? "rgba(78, 205, 196, 0.2)" : undefined,
                }}
              >
                <FaRedo />
              </Button>
            </ButtonGroup>
            <div
              style={{ position: "relative", width: "100%", maxWidth: "700px" }}
            >
              <AnimatePresence>
                {isLoading && (
                  <LoadingOverlay
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Loading...
                  </LoadingOverlay>
                )}
              </AnimatePresence>
              <AudioVisualizer
                audioRef={audioRef}
                isPlaying={isPlaying}
                analyser={analyserRef.current}
              />
            </div>
          </>
        )}
        {!audioUrl && (
          <VisualizerPlaceholder>
            Upload a song or try the sample track to see the visualizer in
            action
          </VisualizerPlaceholder>
        )}
      </Container>
    </>
  );
}

export default App;
