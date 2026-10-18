import { useState, useRef, useCallback, useEffect } from 'react';
import { MeadowCanvas } from './components/MeadowCanvas';
import { HudHeader } from './components/HudHeader';
import { Caption } from './components/Caption';
import { StatusToast } from './components/StatusToast';
import { Vignette } from './components/Vignette';
import { meadowAudio } from './audio/proceduralAudio';
import type { MeadowSceneController } from './types';

const INITIAL_CAPTION =
  '<b>THE LONE GUARDIAN OF WINDBLUME</b><br />A noble knight watching over the peaceful breeze of the meadow.';

export function App() {
  const [statusText, setStatusText] = useState('Loading Mondstadt meadow & knight guardian…');
  const [isReady, setIsReady] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [captionHtml, setCaptionHtml] = useState(INITIAL_CAPTION);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const controllerRef = useRef<MeadowSceneController | null>(null);

  // Start audio on first user click anywhere in the window
  useEffect(() => {
    const handleFirstInteraction = () => {
      meadowAudio.start();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      meadowAudio.dispose();
    };
  }, []);

  const handleControllerReady = useCallback((controller: MeadowSceneController) => {
    controllerRef.current = controller;
  }, []);

  const handleStatusChange = useCallback((status: string, ready?: boolean) => {
    setStatusText(status);
    if (ready) {
      setIsReady(true);
    }
  }, []);

  const handleError = useCallback((err: string | null) => {
    setErrorText(err);
  }, []);

  const handleCaptionChange = useCallback((html: string) => {
    setCaptionHtml(html);
  }, []);

  const handleRestart = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.restart();
      setIsPaused(false);
    }
    meadowAudio.start();
  }, []);

  const handleTogglePause = useCallback(() => {
    if (controllerRef.current) {
      const paused = controllerRef.current.togglePause();
      setIsPaused(paused);
    }
  }, []);

  const handleNextShot = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.nextShot();
    }
    meadowAudio.start();
  }, []);

  const handleToggleAudio = useCallback(() => {
    const muted = meadowAudio.toggleMute();
    setIsMuted(muted);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      <MeadowCanvas
        onControllerReady={handleControllerReady}
        onStatusChange={handleStatusChange}
        onError={handleError}
        onCaptionChange={handleCaptionChange}
      />

      <HudHeader
        isPaused={isPaused}
        isMuted={isMuted}
        onRestart={handleRestart}
        onTogglePause={handleTogglePause}
        onNextShot={handleNextShot}
        onToggleAudio={handleToggleAudio}
      />

      <Caption contentHtml={captionHtml} />

      <StatusToast
        statusText={statusText}
        isReady={isReady}
        errorText={errorText}
        onDismissError={() => setErrorText(null)}
      />

      <Vignette />
    </div>
  );
}

export default App;
