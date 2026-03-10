import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';

export function createNpcModel(variant: 'merchant' | 'brewer'): Group {
  const root = new Group();
  const skin = new MeshStandardMaterial({ color: '#e2b286', roughness: 0.92, metalness: 0.01, flatShading: true });
  const cloth = new MeshStandardMaterial({
    color: variant === 'merchant' ? '#5870a6' : '#8462aa',
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
  });
  const accent = new MeshStandardMaterial({ color: '#4d3b2e', roughness: 0.94, metalness: 0, flatShading: true });

  const body = new Mesh(new BoxGeometry(0.9, 1.2, 0.55), cloth);
  body.position.set(0, 1.1, 0);
  const head = new Mesh(new BoxGeometry(0.6, 0.6, 0.58), skin);
  head.position.set(0, 2, 0);
  const hat = new Mesh(new BoxGeometry(0.8, 0.2, 0.8), accent);
  hat.position.set(0, 2.42, 0);
  const leftLeg = new Mesh(new BoxGeometry(0.28, 0.8, 0.28), accent);
  const rightLeg = new Mesh(new BoxGeometry(0.28, 0.8, 0.28), accent);
  leftLeg.position.set(-0.19, 0.4, 0);
  rightLeg.position.set(0.19, 0.4, 0);
  root.add(body, head, hat, leftLeg, rightLeg);
  root.castShadow = true;
  root.receiveShadow = true;
  return root;
}
