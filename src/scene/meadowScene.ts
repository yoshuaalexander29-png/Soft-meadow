import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { CameraShot, LoadedCharacter, MeadowSceneController } from '../types';

export const SHOTS: CameraShot[] = [
  { t: 0, p: [0, 5.2, 16], look: [0, 1.2, -1.4], f: 45 }, // Wide establishing anime landscape
  { t: 4, p: [-4.2, 2.9, 5.4], look: [0, 1.35, -1.4], f: 36 }, // Flank shot under the trees
  { t: 8, p: [3.8, 2.6, 4.9], look: [0, 1.25, -1.4], f: 34 }, // Golden hour side hero profile
  { t: 13, p: [0, 1.95, 4.2], look: [0, 1.35, -1.4], f: 30 }, // Intimate hero framing on knight
  { t: 20, p: [0.1, 4.2, 10.2], look: [0, 1.3, -1.4], f: 41 }, // Grand pullback over waving meadow
];

const ASSETS = {
  warrior: 'https://cdn.cinevva.com/assets/packs/quaternius/ultimate-animated-characters/Knight_Male.glb?download=1',
};

interface SceneCallbacks {
  onStatusChange: (status: string, isReady?: boolean) => void;
  onError: (errorText: string | null) => void;
  onCaptionChange: (html: string) => void;
}

export function initMeadowScene(
  container: HTMLDivElement,
  callbacks: SceneCallbacks
): MeadowSceneController {
  const { onStatusChange, onError, onCaptionChange } = callbacks;

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Scene setup with Genshin-inspired vibrant anime sky & soft distance fog
  const scene = new THREE.Scene();
  const skyColor = new THREE.Color('#7ecbf7');
  scene.background = skyColor;
  scene.fog = new THREE.Fog('#a0daf5', 22, 78);

  // Camera setup
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const camera = new THREE.PerspectiveCamera(43, width / height, 0.1, 120);
  camera.position.set(0, 5.2, 16);

  // Lighting setup - Genshin Impact warm golden sun & soft cyan sky fill
  const hemiLight = new THREE.HemisphereLight('#f2faff', '#6da25a', 2.3);
  scene.add(hemiLight);

  const sun = new THREE.DirectionalLight('#fff8d8', 3.4);
  sun.position.set(-10, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 65;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);

  // Subtle soft rim backlight for anime character silhouette separation
  const rimLight = new THREE.DirectionalLight('#c5eeff', 1.1);
  rimLight.position.set(8, 6, -10);
  scene.add(rimLight);

  const mat = (color: string, roughness = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });

  // Vibrant rolling meadow ground geometry
  const groundGeo = new THREE.PlaneGeometry(110, 110, 72, 72);
  const gp = groundGeo.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i);
    const z = -gp.getY(i);
    const fade = THREE.MathUtils.smoothstep(Math.hypot(x, z), 3.5, 20);
    gp.setZ(i, fade * (Math.sin(x * 0.19 + z * 0.08) * 0.32 + Math.sin(z * 0.31 - x * 0.11) * 0.16));
  }
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, mat('#5ea848', 0.85));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  // Low-poly layered hills in vibrant Mondstadt emerald/mint tones
  const hill = (x: number, z: number, sx: number, sy: number, sz: number, color: string) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), mat(color, 0.95));
    m.position.set(x, sy * 0.36, z);
    m.scale.set(sx, sy, sz);
    scene.add(m);
    return m;
  };

  const nearHills: [number, number, number, number, number, string][] = [
    [-15, -20, 11, 4.5, 6, '#72bd79'],
    [-4, -24, 13, 5.5, 6, '#64b36c'],
    [10, -22, 14, 5.2, 6, '#5da966'],
    [22, -17, 10, 4.2, 5, '#7ec485'],
  ];
  nearHills.forEach(h => hill(...h));

  const mountainRidges: [number, number, number, number, number, string][] = [
    [-28, -40, 18, 10, 9, '#83cba0'],
    [-14, -44, 20, 13, 10, '#8ec8b5'],
    [6, -46, 23, 14, 11, '#82c4aa'],
    [28, -41, 19, 11, 9, '#88caa3'],
    [44, -47, 21, 13, 11, '#81c0ad'],
  ];
  mountainRidges.forEach(h => hill(...h));

  // PRNG seed generator
  let state = 0x57494c44;
  const rnd = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  // Lush anime trees with rich foliage
  const trunkMat = mat('#694b34');
  const leafColors = ['#2e7c50', '#3b925f', '#4ea66b', '#68ba7a'];
  const leafMats = leafColors.map(c => mat(c));

  const tree = (x: number, z: number, scale = 1) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 2.5, 7), trunkMat);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    g.add(trunk);

    for (let i = 0; i < 5; i++) {
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1, 1),
        leafMats[(i + Math.floor(rnd() * 3)) % leafMats.length]
      );
      crown.position.set((rnd() - 0.5) * 0.7, 2.1 + i * 0.4, (rnd() - 0.5) * 0.5);
      crown.scale.set(1.05 + rnd() * 0.35, 0.85 + rnd() * 0.4, 0.9 + rnd() * 0.3);
      crown.castShadow = true;
      crown.receiveShadow = true;
      g.add(crown);
    }

    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    scene.add(g);
    return g;
  };

  for (let i = 0; i < 34; i++) {
    const z = -5 - rnd() * 26;
    let x = (rnd() - 0.5) * 29;
    if (Math.abs(x) < 2.8 && z > -7) continue; // Keep space open around central hero
    tree(x, z, 0.65 + rnd() * 0.85);
  }

  // Meadow grass instanced mesh - vibrant Mondstadt color palette
  const grassGeo = new THREE.ConeGeometry(0.06, 0.45, 3);
  grassGeo.translate(0, 0.225, 0);
  const grassPalette = ['#4f993d', '#64b248', '#7ecb52', '#3e8b3b', '#9ad95c'];
  const grassMeshes: THREE.InstancedMesh[] = [];

  for (let group = 0; group < grassPalette.length; group++) {
    const count = group === 0 ? 2000 : 850;
    const mesh = new THREE.InstancedMesh(grassGeo, mat(grassPalette[group], 0.75), count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      let x = (rnd() - 0.5) * 36;
      const z = 5 - rnd() * 34;
      if (Math.abs(x) < 2.0 && z > -5 && z < 0.5) {
        x += x < 0 ? -1.8 : 1.8;
      }
      dummy.position.set(x, -0.02, z);
      dummy.rotation.set(0, rnd() * Math.PI, (rnd() - 0.5) * 0.2);
      const s = 0.6 + rnd() * 1.15;
      dummy.scale.set(s, s * (0.7 + rnd() * 0.8), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    grassMeshes.push(mesh);
  }

  // Mondstadt-style anime wildflowers (Windwheel Aster coral, Cecilia cream, Sweet Flower yellow, soft lavender)
  const flowerColors = ['#f26d52', '#fcfbf2', '#fed148', '#a49bf0', '#ff8e6e'];
  for (let patch = 0; patch < 24; patch++) {
    const cx = (rnd() - 0.5) * 28;
    const cz = 1 - rnd() * 26;
    if (Math.abs(cx) < 2.2 && cz > -4) continue;
    for (let i = 0; i < 9; i++) {
      const x = cx + (rnd() - 0.5) * 1.8;
      const z = cz + (rnd() - 0.5) * 1.8;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.26, 4), mat('#498f3b'));
      stem.position.set(x, 0.13, z);
      scene.add(stem);
      const flower = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.08, 1),
        mat(flowerColors[patch % flowerColors.length], 0.7)
      );
      flower.scale.set(1.05, 0.52, 1.05);
      flower.position.set(x, 0.28, z);
      scene.add(flower);
    }
  }

  // Floating Anemo motes & dandelion seeds (Genshin Impact signature atmosphere)
  const moteCount = 90;
  const moteGeo = new THREE.SphereGeometry(0.038, 8, 8);
  const moteMat = new THREE.MeshBasicMaterial({
    color: '#c2f8ff',
    transparent: true,
    opacity: 0.85,
  });
  const moteInstanced = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
  const moteData: { x: number; y: number; z: number; speed: number; phase: number; radius: number }[] = [];
  const dummyMote = new THREE.Object3D();

  for (let i = 0; i < moteCount; i++) {
    const x = (rnd() - 0.5) * 24;
    const y = 0.5 + rnd() * 4.8;
    const z = 2 - rnd() * 20;
    moteData.push({
      x,
      y,
      z,
      speed: 0.25 + rnd() * 0.45,
      phase: rnd() * Math.PI * 2,
      radius: 0.05 + rnd() * 0.08,
    });
    dummyMote.position.set(x, y, z);
    dummyMote.scale.setScalar(0.7 + rnd() * 0.7);
    dummyMote.updateMatrix();
    moteInstanced.setMatrixAt(i, dummyMote.matrix);
  }
  moteInstanced.instanceMatrix.needsUpdate = true;
  scene.add(moteInstanced);

  // Single centered contact shadow for the hero knight
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ color: '#1e3825', transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.008, -1.4);
  shadow.scale.set(0.75, 0.55, 1);
  scene.add(shadow);

  // Character loader - Only the Silverland Knight, re-centered to (0, 0, -1.4)
  const loader = new GLTFLoader();
  const loaded: LoadedCharacter[] = [];

  function fitModel(root: THREE.Group, targetHeight: number) {
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y < 0.01) {
      throw new Error('Model has no measurable geometry');
    }
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= box.min.y;
    root.scale.multiplyScalar(targetHeight / size.y);
    root.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.roughness = Math.max(0.48, material.roughness ?? 0.75);
          material.flatShading = true;
          material.needsUpdate = true;
        }
      }
    });
  }

  onStatusChange('Loading Mondstadt meadow & knight guardian…', false);

  loader.load(
    ASSETS.warrior,
    gltf => {
      const root = gltf.scene;
      try {
        fitModel(root, 2.15);
        // Position directly at the center of the meadow stage
        root.position.set(0, 0, -1.4);
        root.rotation.y = 0.08;
        scene.add(root);

        let mixer: THREE.AnimationMixer | null = null;
        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(root);
          const clip =
            gltf.animations.find(c => /idle|stand/i.test(c.name)) || gltf.animations[0];
          mixer.clipAction(clip).play();
        }
        loaded.push({ root, mixer, clips: gltf.animations || [], label: 'Silverland Knight' });
        onStatusChange('The knight guardian stands ready amidst the Mondstadt meadow', true);
      } catch (e) {
        onError(`Character load error: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    },
    (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error || 'Network issue');
      onError(`Knight asset notice: ${msg}`);
    }
  );

  // Animation and camera sequencer state
  let start = performance.now();
  let paused = false;
  let pauseAt = 0;
  let manual = false;
  let shot = 0;
  let yaw = 0;
  let pitch = 0;
  let drag = false;
  let lastX = 0;
  let lastY = 0;
  let animId = 0;
  let destroyed = false;
  const clock = new THREE.Clock();

  function ease(v: number) {
    return v * v * (3 - 2 * v);
  }

  function cameraAt(t: number) {
    if (manual) return SHOTS[Math.min(shot, SHOTS.length - 1)];
    let i = 0;
    while (i < SHOTS.length - 2 && t > SHOTS[i + 1].t) i++;
    const a = SHOTS[i];
    const b = SHOTS[i + 1];
    const u = ease(THREE.MathUtils.clamp((t - a.t) / (b.t - a.t), 0, 1));
    return {
      p: a.p.map((v, j) => THREE.MathUtils.lerp(v, b.p[j], u)) as [number, number, number],
      look: a.look.map((v, j) => THREE.MathUtils.lerp(v, b.look[j], u)) as [number, number, number],
      f: THREE.MathUtils.lerp(a.f, b.f, u),
    };
  }

  function frame(now: number) {
    if (destroyed) return;
    animId = requestAnimationFrame(frame);
    const t = Math.max(0, ((paused ? pauseAt : now) - start) / 1000);
    const delta = Math.min(clock.getDelta(), 0.05);

    for (const c of loaded) {
      if (c.mixer && !paused) {
        c.mixer.update(delta);
      }
    }

    // Genshin-style rolling wind waves across the grass
    if (!paused) {
      for (let i = 0; i < grassMeshes.length; i++) {
        const wave = Math.sin(t * 2.2 + i * 0.35) * 0.016 + Math.cos(t * 1.4 + i * 0.2) * 0.008;
        grassMeshes[i].rotation.z = wave;
      }

      // Anemo motes and dandelion drifting on the wind
      for (let i = 0; i < moteCount; i++) {
        const m = moteData[i];
        m.x += delta * m.speed * 0.7;
        m.z -= delta * m.speed * 0.35;
        const bob = Math.sin(t * 1.5 + m.phase) * 0.004;
        m.y += bob;

        // Wrap around boundaries
        if (m.x > 14) m.x = -14;
        if (m.z < -18) m.z = 3;

        dummyMote.position.set(m.x, m.y, m.z);
        dummyMote.updateMatrix();
        moteInstanced.setMatrixAt(i, dummyMote.matrix);
      }
      moteInstanced.instanceMatrix.needsUpdate = true;
    }

    const sh = cameraAt(Math.min(t, 20));
    camera.fov = sh.f;
    camera.position.set(sh.p[0] + yaw * 2, sh.p[1] + pitch, sh.p[2]);
    camera.lookAt(sh.look[0], sh.look[1], sh.look[2]);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);

    if (t >= 20 && !paused && !manual) {
      start = now - 20000;
      onCaptionChange('<b>WHERE THE GENTLE WINDS DWELL</b><br />Standing vigil under the ancient trees as dandelion seeds take flight.');
    }
  }

  animId = requestAnimationFrame(frame);

  // Resize handler
  function onResize() {
    if (!container) return;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 1 : 1.35));
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', onResize, { passive: true });

  // Page visibility handler
  function onVisibilityChange() {
    if (document.hidden && !paused) {
      paused = true;
      pauseAt = performance.now();
    } else if (!document.hidden && paused) {
      paused = false;
      start += performance.now() - pauseAt;
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Pointer drag Orbit controls
  const dom = renderer.domElement;
  function onPointerDown(e: PointerEvent) {
    drag = true;
    manual = true;
    lastX = e.clientX;
    lastY = e.clientY;
    dom.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!drag) return;
    yaw = THREE.MathUtils.clamp(yaw - (e.clientX - lastX) * 0.004, -1.1, 1.1);
    pitch = THREE.MathUtils.clamp(pitch + (e.clientY - lastY) * 0.003, -0.8, 0.8);
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onPointerUp(e: PointerEvent) {
    drag = false;
    try {
      dom.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  dom.addEventListener('pointerdown', onPointerDown);
  dom.addEventListener('pointermove', onPointerMove);
  dom.addEventListener('pointerup', onPointerUp);
  dom.addEventListener('pointercancel', onPointerUp);

  // WebGL context lost handler
  function onContextLost(e: Event) {
    e.preventDefault();
    onError('WebGL context lost. Please reload the page to recover.');
  }
  dom.addEventListener('webglcontextlost', onContextLost, { passive: false });

  return {
    restart: () => {
      start = performance.now();
      manual = false;
      shot = 0;
      yaw = 0;
      pitch = 0;
      onCaptionChange('<b>THE LONE GUARDIAN OF WINDBLUME</b><br />A noble knight watching over the peaceful breeze of the meadow.');
    },
    togglePause: () => {
      paused = !paused;
      if (paused) {
        pauseAt = performance.now();
      } else {
        start += performance.now() - pauseAt;
      }
      return paused;
    },
    nextShot: () => {
      manual = true;
      shot = (shot + 1) % SHOTS.length;
      return shot;
    },
    isPaused: () => paused,
    getCurrentShotIndex: () => shot,
    dispose: () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    },
  };
}
