import { useRef, useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { FaPlay, FaPause, FaUpload } from "react-icons/fa";
import { AudioVisualizer } from "./AudioVisualizer";

const GlobalStyle = createGlobalStyle`
  body {
    background: #111;
    color: #fff;
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(135deg, #18181b 0%, #23272f 100%);
  box-sizing: border-box;
`;

const Header = styled.header`
  width: 100%;
  padding: 2rem 0 1rem 0;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -1px;
  background: transparent;
  @media (max-width: 600px) {
    font-size: 1.5rem;
    padding: 1.2rem 0 0.5rem 0;
  }
`;

const UploadLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #222;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  margin: 2rem 0 1rem 0;
  font-size: 1rem;
  transition: background 0.2s;
  &:hover {
    background: #333;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const AudioControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
`;

const VisualizerPlaceholder = styled.div`
  width: 100%;
  max-width: 700px;
  height: 250px;
  background: #18181b;
  border-radius: 16px;
  margin: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
  font-size: 1.2rem;
  box-shadow: 0 4px 32px 0 #0004;
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up existing audio context before creating new URL
      cleanupAudio();
      setAudioUrl(URL.createObjectURL(file));
      setIsPlaying(false);
    }
  };

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
        <Header>Vercel Music Visualizer</Header>
        <UploadLabel>
          <FaUpload /> Upload Music
          <HiddenInput
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
          />
        </UploadLabel>
        {audioUrl && (
          <>
            <audio
              key={audioUrl}
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
            />
            <AudioControls>
              <button
                onClick={togglePlay}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "2rem",
                  cursor: "pointer",
                }}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
            </AudioControls>
            <AudioVisualizer
              audioRef={audioRef}
              isPlaying={isPlaying}
              analyser={analyserRef.current}
            />
          </>
        )}
        {!audioUrl && (
          <VisualizerPlaceholder>
            Visualizer will appear here
          </VisualizerPlaceholder>
        )}
      </Container>
    </>
  );
}

export default App;
