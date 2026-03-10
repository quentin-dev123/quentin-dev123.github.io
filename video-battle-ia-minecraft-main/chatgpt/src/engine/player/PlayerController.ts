import { PerspectiveCamera, Vector3 } from 'three';
import { VoxelPhysics } from '../physics/VoxelPhysics';
import { GameState } from '../ui/GameState';

const UP = new Vector3(0, 1, 0);

export class PlayerController {
  readonly position = new Vector3(8, 38, 8);
  readonly velocity = new Vector3();
  readonly eyeHeight = 1.62;
  readonly lookDirection = new Vector3();

  private readonly camera: PerspectiveCamera;
  private readonly keys = new Set<string>();
  private isPointerLocked = false;
  private yaw = Math.PI * 0.25;
  private pitch = -0.15;
  private isGrounded = false;
  private inWater = false;
  private sensitivity = 0.0023;
  private gameState: GameState | null = null;
  private onToggleInventory: (() => void) | null = null;
  private onEscapeAction: (() => void) | null = null;
  private onSelectHotbar: ((index: number) => void) | null = null;
  private onCycleHotbar: ((delta: number) => void) | null = null;
  private speedMultiplier = 1;

  constructor(camera: PerspectiveCamera) {
    this.camera = camera;
  }

  bindInput(
    domElement: HTMLElement,
    gameState: GameState,
    onToggleInventory: () => void,
    onEscapeAction: () => void,
    onSelectHotbar: (index: number) => void,
    onCycleHotbar: (delta: number) => void,
  ): void {
    this.gameState = gameState;
    this.onToggleInventory = onToggleInventory;
    this.onEscapeAction = onEscapeAction;
    this.onSelectHotbar = onSelectHotbar;
    this.onCycleHotbar = onCycleHotbar;

    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyE' && !event.repeat) {
        event.preventDefault();
        this.onToggleInventory?.();
        return;
      }
      if (event.code === 'Escape' && !event.repeat) {
        event.preventDefault();
        this.onEscapeAction?.();
        return;
      }
      if (event.code.startsWith('Digit') && !event.repeat) {
        const index = Number(event.code.slice(5)) - 1;
        if (index >= 0 && index <= 8) {
          event.preventDefault();
          this.onSelectHotbar?.(index);
          return;
        }
      }
      this.keys.add(event.code);
      this.keys.add(event.key.toLowerCase());
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      this.keys.delete(event.key.toLowerCase());
    });

    domElement.addEventListener('click', () => {
      if (this.gameState?.isGameplayActive()) {
        void domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === domElement;
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isPointerLocked) {
        return;
      }
      this.yaw -= event.movementX * this.sensitivity;
      this.pitch -= event.movementY * this.sensitivity;
      this.pitch = Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, this.pitch));
    });

    domElement.addEventListener('wheel', (event) => {
      if (!this.gameState?.isGameplayActive()) {
        return;
      }
      event.preventDefault();
      const delta = event.deltaY > 0 ? 1 : -1;
      this.onCycleHotbar?.(delta);
    });
  }

  update(dt: number, physics: VoxelPhysics): void {
    if (!this.gameState?.isGameplayActive()) {
      this.velocity.set(0, 0, 0);
      this.syncCamera();
      return;
    }

    const forward = this.isDown('w', 'z', 'KeyW', 'KeyZ', 'ArrowUp') ? 1 : 0;
    const backward = this.isDown('s', 'KeyS', 'ArrowDown') ? 1 : 0;
    const left = this.isDown('a', 'q', 'KeyA', 'KeyQ', 'ArrowLeft') ? 1 : 0;
    const right = this.isDown('d', 'KeyD', 'ArrowRight') ? 1 : 0;

    const moveForward = forward - backward;
    const moveRight = right - left;

    const sprinting = this.keys.has('ShiftLeft');
    const speedBase = this.inWater ? 3.1 : sprinting ? 7.8 : 5.4;
    const speed = speedBase * this.speedMultiplier;
    const accel = this.inWater ? 24 : this.isGrounded ? 72 : 22;
    const friction = this.inWater ? 2.7 : this.isGrounded ? 9 : 0.8;

    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);

    // Alignement sur l'orientation camera: avant = -Z local, droite = +X local.
    const wishX = moveRight * cos - moveForward * sin;
    const wishZ = -moveRight * sin - moveForward * cos;
    const wishLen = Math.hypot(wishX, wishZ);

    if (wishLen > 0.0001) {
      const dirX = wishX / wishLen;
      const dirZ = wishZ / wishLen;
      const targetX = dirX * speed;
      const targetZ = dirZ * speed;
      const blend = Math.min(1, accel * dt);
      this.velocity.x += (targetX - this.velocity.x) * blend;
      this.velocity.z += (targetZ - this.velocity.z) * blend;
    } else {
      const damping = Math.max(0, 1 - friction * dt);
      this.velocity.x *= damping;
      this.velocity.z *= damping;
    }

    if (!this.inWater && this.isGrounded && this.keys.has('Space')) {
      this.velocity.y = 8.6;
      this.isGrounded = false;
    }

    if (this.inWater) {
      if (this.keys.has('Space')) {
        this.velocity.y += 13 * dt;
      }
      if (this.keys.has('ShiftLeft') || this.keys.has('ControlLeft') || this.keys.has('KeyC')) {
        this.velocity.y -= 10 * dt;
      }
      this.velocity.y += -7.2 * dt;
      this.velocity.y = Math.max(-8, Math.min(4.2, this.velocity.y));
    } else {
      this.velocity.y += -24 * dt;
      this.velocity.y = Math.max(this.velocity.y, -45);
    }

    const result = physics.move(this.position, this.velocity, dt);
    this.position.copy(result.position);
    this.velocity.copy(result.velocity);
    this.isGrounded = result.grounded;
    this.inWater = result.inWater;

    this.syncCamera();
  }

  private syncCamera(): void {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.position.copy(this.position).addScaledVector(UP, this.eyeHeight);
    this.camera.getWorldDirection(this.lookDirection);
  }

  private isDown(...codesOrKeys: string[]): boolean {
    return codesOrKeys.some((input) => this.keys.has(input));
  }

  setSensitivity(value: number): void {
    this.sensitivity = Math.max(0.0001, Math.min(0.02, value));
  }

  setSpeedMultiplier(value: number): void {
    this.speedMultiplier = Math.max(0.8, Math.min(1.8, value));
  }
}
