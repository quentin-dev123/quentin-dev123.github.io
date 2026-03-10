import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Scene,
  Vector3,
} from 'three';
import { TextureGenerator } from '../textures/TextureGenerator';
import type { VoxelHit } from './BlockInteractor';

const PLANE_FORWARD = new Vector3(0, 0, 1);
const FACE_OFFSET = 0.503;
const STAGE_COUNT = 10;

export class BlockBreakOverlay {
  private readonly mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  private readonly textures: TextureGenerator;
  private readonly faceNormal = new Vector3();
  private readonly center = new Vector3();
  private readonly overlayPosition = new Vector3();
  private readonly orientation = new Quaternion();
  private currentStage = -1;

  constructor(scene: Scene, textures: TextureGenerator) {
    this.textures = textures;

    const geometry = new PlaneGeometry(1.01, 1.01);
    const material = new MeshBasicMaterial({
      map: textures.getBreakCrackTexture(0),
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      opacity: 0.92,
    });

    this.mesh = new Mesh(geometry, material);
    this.mesh.visible = false;
    this.mesh.renderOrder = 25;
    scene.add(this.mesh);
  }

  setBreakState(hit: VoxelHit, progress: number): void {
    this.faceNormal.set(
      hit.previous.x - hit.hit.x,
      hit.previous.y - hit.hit.y,
      hit.previous.z - hit.hit.z,
    );

    if (this.faceNormal.lengthSq() < 0.25) {
      this.hide();
      return;
    }
    this.faceNormal.normalize();

    this.center.set(hit.hit.x + 0.5, hit.hit.y + 0.5, hit.hit.z + 0.5);
    this.overlayPosition.copy(this.center).addScaledVector(this.faceNormal, FACE_OFFSET);
    this.mesh.position.copy(this.overlayPosition);

    this.orientation.setFromUnitVectors(PLANE_FORWARD, this.faceNormal);
    this.mesh.quaternion.copy(this.orientation);

    const stage = Math.min(STAGE_COUNT - 1, Math.floor(Math.max(0, Math.min(0.9999, progress)) * STAGE_COUNT));
    if (stage !== this.currentStage) {
      this.mesh.material.map = this.textures.getBreakCrackTexture(stage);
      this.mesh.material.needsUpdate = true;
      this.currentStage = stage;
    }

    this.mesh.visible = progress > 0;
  }

  hide(): void {
    this.mesh.visible = false;
    this.currentStage = -1;
  }
}
