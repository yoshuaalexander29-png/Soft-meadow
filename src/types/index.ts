import type * as THREE from 'three';

export interface CameraShot {
  t: number;
  p: [number, number, number];
  look: [number, number, number];
  f: number;
}

export interface LoadedCharacter {
  root: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  clips: THREE.AnimationClip[];
  label: string;
}

export interface MeadowSceneController {
  restart: () => void;
  togglePause: () => boolean;
  nextShot: () => number;
  isPaused: () => boolean;
  getCurrentShotIndex: () => number;
  dispose: () => void;
}
