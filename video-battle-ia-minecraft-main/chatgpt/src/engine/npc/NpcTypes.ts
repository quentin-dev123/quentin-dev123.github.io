import { Vector3 } from 'three';

export type NpcState = 'idle' | 'wander' | 'trade' | 'flee';

export type NpcProfession = 'merchant' | 'brewer';

export type NpcEntity = {
  id: number;
  position: Vector3;
  velocity: Vector3;
  state: NpcState;
  profession: NpcProfession;
  displayName: string;
  talkLine: string;
  walkTimer: number;
};
