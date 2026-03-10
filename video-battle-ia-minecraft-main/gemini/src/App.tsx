import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stats, Stars } from '@react-three/drei';
import { useWorldStore } from './store';
import { useInventoryStore } from './store/inventory';
import { Chunk } from './components/Chunk';
import { Player } from './components/Player';
import { Clouds } from './components/Clouds';
import { Hand } from './components/Player/Hand';
import { Hotbar } from './components/UI/Hotbar';
import { Inventory } from './components/UI/Inventory';
import { HUD } from './components/UI/HUD';
import { PauseMenu } from './components/UI/PauseMenu';
import { BossBar } from './components/UI/BossBar';
import { AchievementToast } from './components/UI/AchievementToast';
import { useAchievementCheck } from './hooks/useAchievementCheck';
import { MobManager } from './components/Mobs/MobManager';
import { RENDER_DISTANCE, CHUNK_SIZE } from './game/constants';
import * as THREE from 'three';

const Game = () => {
  const chunks = useWorldStore(state => state.chunks);
  const setChunks = useWorldStore(state => state.setChunks);
  const { camera } = useThree();
  
  const lastChunk = useRef<{x: number, z: number} | null>(null);

  useFrame(() => {
    const chunkX = Math.floor(camera.position.x / CHUNK_SIZE);
    const chunkZ = Math.floor(camera.position.z / CHUNK_SIZE);

    if (lastChunk.current?.x !== chunkX || lastChunk.current?.z !== chunkZ) {
        lastChunk.current = { x: chunkX, z: chunkZ };

        // Determine visible chunks
        const visibleChunks = new Set<string>();
        const chunksToLoad: {x: number, z: number}[] = [];
        const chunksToUnload: {x: number, z: number}[] = [];

        for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
            for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
                const cx = chunkX + x;
                const cz = chunkZ + z;
                const key = `${cx},${cz}`;
                visibleChunks.add(key);
                if (!chunks.has(key)) {
                    chunksToLoad.push({ x: cx, z: cz });
                }
            }
        }

        // Unload old chunks
        chunks.forEach((_, key) => {
            if (!visibleChunks.has(key)) {
                const [cx, cz] = key.split(',').map(Number);
                chunksToUnload.push({ x: cx, z: cz });
            }
        });

        // Batch update
        if (chunksToLoad.length > 0 || chunksToUnload.length > 0) {
            setChunks(chunksToLoad, chunksToUnload);
        }
    }
  });

  return (
    <>
      {/* Atmosphere */}
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 30, 90]} />
      
      <Sky 
        sunPosition={[100, 40, 100]} 
        turbidity={0.1} 
        rayleigh={0.8} 
        mieCoefficient={0.005} 
        mieDirectionalG={0.7} 
        inclination={0.6}
        azimuth={0.25}
      />
      <Stars radius={100} depth={50} count={500} factor={4} saturation={0} fade speed={1} />
      <Clouds />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-bias={-0.00005} 
        shadow-normalBias={0.0}
      >
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100, 0.1, 200]} />
      </directionalLight>
      
      <Player />
      <Hand />
      <MobManager />
      
      {Array.from(chunks.entries()).map(([key, data]) => {
        const [x, z] = key.split(',').map(Number);
        return <Chunk key={key} chunkX={x} chunkZ={z} data={data} />;
      })}
    </>
  );
};

// Error Boundary simple
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: 20, background: 'white', position: 'absolute', top: 0, left: 0, zIndex: 1000 }}>
          <h1>Une erreur est survenue.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { toggleInventory, toggleMenu, setMenuOpen, isInventoryOpen, isMenuOpen } = useInventoryStore();
  
  // Hooks
  useAchievementCheck();

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        // Toggle inventory
        // If menu is open, E usually does nothing or closes menu. Let's say it does nothing for now.
        if (!isMenuOpen) toggleInventory();
      } else if (e.code === 'Escape') {
        // Explicitly close menus if open
        if (isInventoryOpen) {
            toggleInventory();
        } else if (isMenuOpen) {
            toggleMenu();
        }
        // If nothing is open, we do nothing here. The browser unlocks the pointer, 
        // triggering pointerlockchange, which opens the menu.
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInventory, toggleMenu, isInventoryOpen, isMenuOpen]);

  // Handle Pointer Lock Changes (Pause on unlock)
  useEffect(() => {
      const handlePointerLockChange = () => {
          if (document.pointerLockElement === null) {
              // Pointer unlocked
              if (!isInventoryOpen && !isMenuOpen) {
                  // We lost focus/lock while playing -> Pause
                  setMenuOpen(true);
              }
          }
      };

      document.addEventListener('pointerlockchange', handlePointerLockChange);
      return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, [isInventoryOpen, isMenuOpen, setMenuOpen]);

  return (
    <div style={{ width: '100vw', height: '100vh', userSelect: 'none' }}>
      <ErrorBoundary>
        <Canvas shadows camera={{ fov: 75, far: 200 }}> 
            {/* <Stats /> Removed per user request */}
            <Game />
        </Canvas>
      </ErrorBoundary>
      
      {/* UI Layer */}
      <AchievementToast />
      <BossBar title="Bienvenue sur GeminiCraft" color="pink" percentage={100} />
      <Hotbar />
      <HUD />
      <Inventory />
      <PauseMenu />
      
      {/* Crosshair */}
      {!isInventoryOpen && !isMenuOpen && (
        <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            width: 16, 
            height: 16,
            pointerEvents: 'none'
        }}>
            {/* Horizontal */}
            <div style={{ position: 'absolute', top: 7, left: 0, width: 16, height: 2, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.5)' }}></div>
            {/* Vertical */}
            <div style={{ position: 'absolute', left: 7, top: 0, width: 2, height: 16, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.5)' }}></div>
        </div>
      )}
    </div>
  );
}

export default App;
