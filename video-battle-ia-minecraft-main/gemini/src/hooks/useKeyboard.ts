import { useEffect, useState } from 'react';

export const useKeyboard = () => {
  const [actions, setActions] = useState({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setActions(prev => ({ ...prev, moveForward: true })); break;
        case 'KeyS': setActions(prev => ({ ...prev, moveBackward: true })); break;
        case 'KeyA': setActions(prev => ({ ...prev, moveLeft: true })); break;
        case 'KeyD': setActions(prev => ({ ...prev, moveRight: true })); break;
        case 'Space': setActions(prev => ({ ...prev, jump: true })); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setActions(prev => ({ ...prev, moveForward: false })); break;
        case 'KeyS': setActions(prev => ({ ...prev, moveBackward: false })); break;
        case 'KeyA': setActions(prev => ({ ...prev, moveLeft: false })); break;
        case 'KeyD': setActions(prev => ({ ...prev, moveRight: false })); break;
        case 'Space': setActions(prev => ({ ...prev, jump: false })); break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return actions;
};
