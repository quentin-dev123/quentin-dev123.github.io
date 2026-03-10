// Types simples pour le voxel engine
export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Block {
  x: number
  y: number
  z: number
  type: 'grass' | 'dirt' | 'stone' | 'air'
}