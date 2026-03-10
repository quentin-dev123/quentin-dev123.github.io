import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  SRGBColorSpace,
  CanvasTexture,
  type Material,
} from 'three';

const BODY_GEOMETRY = new BoxGeometry(1.0, 0.8, 1.6);
const HEAD_GEOMETRY = new BoxGeometry(0.8, 0.8, 0.8);
const LEG_GEOMETRY = new BoxGeometry(0.32, 0.6, 0.32);
const SNOUT_GEOMETRY = new BoxGeometry(0.42, 0.3, 0.12);
const EYE_GEOMETRY = new BoxGeometry(0.08, 0.08, 0.08);
const EAR_GEOMETRY = new BoxGeometry(0.14, 0.16, 0.08);

const SKIN_TEXTURE = createPigSkinTexture();
const SKIN_MATERIAL = new MeshStandardMaterial({
  map: SKIN_TEXTURE,
  roughness: 0.9,
  metalness: 0.02,
});
const SKIN_DARK_MATERIAL = new MeshStandardMaterial({
  color: 0xd1828d,
  roughness: 0.9,
  metalness: 0.02,
});
const SKIN_LIGHT_MATERIAL = new MeshStandardMaterial({
  color: 0xf1b4ba,
  roughness: 0.88,
  metalness: 0.02,
});
const SNOUT_MATERIAL = new MeshStandardMaterial({
  color: 0xea9ea8,
  roughness: 0.88,
  metalness: 0.01,
});
const NOSE_PIXEL_MATERIAL = new MeshStandardMaterial({
  color: 0x6f464d,
  roughness: 0.95,
  metalness: 0,
});
const EYE_MATERIAL = new MeshStandardMaterial({
  color: 0x1f1a1d,
  roughness: 0.8,
  metalness: 0.05,
});

const FACE_MATERIALS: Material[] = [
  SKIN_LIGHT_MATERIAL,
  SKIN_DARK_MATERIAL,
  SKIN_MATERIAL,
  SKIN_DARK_MATERIAL,
  SKIN_MATERIAL,
  SKIN_MATERIAL,
];

export type PigModelParts = {
  root: Group;
  legFL: Mesh;
  legFR: Mesh;
  legBL: Mesh;
  legBR: Mesh;
};

export function createPigModel(): PigModelParts {
  const root = new Group();
  root.name = 'pig';

  const body = new Mesh(BODY_GEOMETRY, SKIN_MATERIAL);
  body.position.set(0, 0.95, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  const head = new Mesh(HEAD_GEOMETRY, FACE_MATERIALS);
  head.position.set(0, 0.95, 1.06);
  head.castShadow = true;
  head.receiveShadow = true;
  root.add(head);

  const snout = new Mesh(SNOUT_GEOMETRY, SNOUT_MATERIAL);
  snout.position.set(0, 0.84, 1.51);
  snout.castShadow = true;
  snout.receiveShadow = true;
  root.add(snout);

  const noseLeft = new Mesh(EYE_GEOMETRY, NOSE_PIXEL_MATERIAL);
  noseLeft.position.set(-0.11, 0.84, 1.57);
  root.add(noseLeft);

  const noseRight = new Mesh(EYE_GEOMETRY, NOSE_PIXEL_MATERIAL);
  noseRight.position.set(0.11, 0.84, 1.57);
  root.add(noseRight);

  const eyeLeft = new Mesh(EYE_GEOMETRY, EYE_MATERIAL);
  eyeLeft.position.set(-0.29, 1.02, 1.38);
  root.add(eyeLeft);

  const eyeRight = new Mesh(EYE_GEOMETRY, EYE_MATERIAL);
  eyeRight.position.set(0.29, 1.02, 1.38);
  root.add(eyeRight);

  const earLeft = new Mesh(EAR_GEOMETRY, SKIN_DARK_MATERIAL);
  earLeft.position.set(-0.23, 1.32, 1.18);
  earLeft.rotation.x = -0.2;
  root.add(earLeft);

  const earRight = new Mesh(EAR_GEOMETRY, SKIN_DARK_MATERIAL);
  earRight.position.set(0.23, 1.32, 1.18);
  earRight.rotation.x = -0.2;
  root.add(earRight);

  const legFL = createLeg(-0.28, 0.3, 0.55);
  const legFR = createLeg(0.28, 0.3, 0.55);
  const legBL = createLeg(-0.28, 0.3, -0.55);
  const legBR = createLeg(0.28, 0.3, -0.55);
  root.add(legFL, legFR, legBL, legBR);

  return { root, legFL, legFR, legBL, legBR };
}

function createLeg(x: number, y: number, z: number): Mesh {
  const leg = new Mesh(LEG_GEOMETRY, SKIN_DARK_MATERIAL);
  leg.position.set(x, y, z);
  leg.castShadow = true;
  leg.receiveShadow = true;
  return leg;
}

function createPigSkinTexture(): CanvasTexture {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexte canvas indisponible pour la texture du cochon');
  }

  ctx.fillStyle = '#e89aa6';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = hash(x, y) % 100;
      if (n > 86) {
        ctx.fillStyle = '#f2b6bf';
        ctx.fillRect(x, y, 1, 1);
      } else if (n < 12) {
        ctx.fillStyle = '#d88794';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function hash(x: number, y: number): number {
  let h = 2166136261;
  h = Math.imul(h ^ (x + 37), 16777619);
  h = Math.imul(h ^ (y + 79), 16777619);
  return Math.abs(h);
}
