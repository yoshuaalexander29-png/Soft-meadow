import React, { useEffect, useRef } from 'react';
import { initMeadowScene } from '../scene/meadowScene';
import type { MeadowSceneController } from '../types';

interface MeadowCanvasProps {
  onControllerReady: (controller: MeadowSceneController) => void;
  onStatusChange: (status: string, isReady?: boolean) => void;
  onError: (errorText: string | null) => void;
  onCaptionChange: (html: string) => void;
}

export const MeadowCanvas: React.FC<MeadowCanvasProps> = ({
  onControllerReady,
  onStatusChange,
  onError,
  onCaptionChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const controller = initMeadowScene(mountRef.current, {
      onStatusChange,
      onError,
      onCaptionChange,
    });

    onControllerReady(controller);

    return () => {
      controller.dispose();
    };
  }, [onControllerReady, onStatusChange, onError, onCaptionChange]);

  return <div id="stage" ref={mountRef} className="fixed inset-0 w-full h-full" />;
};
