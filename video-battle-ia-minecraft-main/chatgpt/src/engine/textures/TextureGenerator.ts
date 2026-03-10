import {
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  NearestFilter,
  SRGBColorSpace,
  Texture,
} from 'three';
import { BlockId } from '../world/BlockTypes';

type TileCoord = { col: number; row: number };

export class TextureGenerator {
  readonly atlasTexture: CanvasTexture;
  private readonly tileSize = 32;
  private readonly atlasCols = 8;
  private readonly atlasRows = 8;
  private readonly tileMap = new Map<string, TileCoord>();
  private readonly tileTextures = new Map<string, Texture>();
  private readonly blockMaterialCache = new Map<BlockId, MeshStandardMaterial | MeshStandardMaterial[]>();
  private readonly breakCrackTextures: CanvasTexture[] = [];

  constructor() {
    const canvas = document.createElement('canvas');
    canvas.width = this.tileSize * this.atlasCols;
    canvas.height = this.tileSize * this.atlasRows;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Impossible de creer le contexte 2D pour les textures.');
    }

    this.registerAndPaintTiles(ctx);

    this.atlasTexture = new CanvasTexture(canvas);
    this.atlasTexture.colorSpace = SRGBColorSpace;
    this.atlasTexture.magFilter = NearestFilter;
    this.atlasTexture.minFilter = NearestFilter;
    this.atlasTexture.wrapS = ClampToEdgeWrapping;
    this.atlasTexture.wrapT = ClampToEdgeWrapping;
    this.atlasTexture.generateMipmaps = false;
    this.atlasTexture.needsUpdate = true;
  }

  getMaterialsForBlock(block: BlockId): MeshStandardMaterial | MeshStandardMaterial[] {
    const cached = this.blockMaterialCache.get(block);
    if (cached) {
      return cached;
    }

    const rough = 0.92;
    const metal = 0.02;

    const createMaterial = (
      tileName: string,
      transparent = false,
      side: typeof DoubleSide | undefined = undefined,
      opacity = 1,
    ): MeshStandardMaterial =>
      new MeshStandardMaterial({
        map: this.getTileTexture(tileName),
        roughness: rough,
        metalness: metal,
        flatShading: true,
        color: new Color('#ffffff'),
        transparent,
        opacity,
        alphaTest: transparent ? 0.5 : 0,
        side,
      });

    let material: MeshStandardMaterial | MeshStandardMaterial[];
    switch (block) {
      case BlockId.Grass:
        material = [
          createMaterial('grassSide'),
          createMaterial('grassSide'),
          createMaterial('grassTop'),
          createMaterial('dirt'),
          createMaterial('grassSide'),
          createMaterial('grassSide'),
        ];
        break;
      case BlockId.Dirt:
        material = createMaterial('dirt');
        break;
      case BlockId.Stone:
        material = createMaterial('stone');
        break;
      case BlockId.Wood:
        material = [
          createMaterial('woodSide'),
          createMaterial('woodSide'),
          createMaterial('woodTop'),
          createMaterial('woodTop'),
          createMaterial('woodSide'),
          createMaterial('woodSide'),
        ];
        break;
      case BlockId.Leaves:
        material = createMaterial('leaves', true, DoubleSide);
        break;
      case BlockId.Sand:
        material = createMaterial('sand');
        break;
      case BlockId.Gravel:
        material = createMaterial('gravel');
        break;
      case BlockId.Water:
        material = createMaterial('water', true, DoubleSide, 0.78);
        break;
      case BlockId.WaterFlow1:
      case BlockId.WaterFlow2:
      case BlockId.WaterFlow3:
      case BlockId.WaterFlow4:
      case BlockId.WaterFlow5:
      case BlockId.WaterFlow6:
      case BlockId.WaterFlow7:
        material = createMaterial('water', true, DoubleSide, 0.78);
        break;
      case BlockId.Snow:
        material = createMaterial('snow');
        break;
      case BlockId.Mud:
        material = createMaterial('mud');
        break;
      case BlockId.Clay:
        material = createMaterial('clay');
        break;
      case BlockId.Podzol:
        material = [
          createMaterial('podzolSide'),
          createMaterial('podzolSide'),
          createMaterial('podzolTop'),
          createMaterial('dirt'),
          createMaterial('podzolSide'),
          createMaterial('podzolSide'),
        ];
        break;
      case BlockId.TallGrass:
        material = createMaterial('tallGrass', true, DoubleSide);
        break;
      case BlockId.FlowerRed:
        material = createMaterial('flowerRed', true, DoubleSide);
        break;
      case BlockId.FlowerYellow:
        material = createMaterial('flowerYellow', true, DoubleSide);
        break;
      case BlockId.Glowshroom:
        material = createMaterial('glowshroom', true, DoubleSide);
        break;
      case BlockId.CandyBlock:
        material = createMaterial('candy');
        break;
      case BlockId.PackedBrick:
        material = createMaterial('packedBrick');
        break;
      default:
        material = createMaterial('stone');
        break;
    }

    this.blockMaterialCache.set(block, material);
    return material;
  }

  getBreakCrackTexture(stage: number): Texture {
    const clampedStage = Math.max(0, Math.min(9, stage));
    if (this.breakCrackTextures.length === 0) {
      for (let index = 0; index < 10; index += 1) {
        this.breakCrackTextures.push(this.createBreakCrackTexture(index));
      }
    }
    return this.breakCrackTextures[clampedStage];
  }

  private registerAndPaintTiles(ctx: CanvasRenderingContext2D): void {
    this.paintGrassTopTile(ctx, 'grassTop', 0, 0);
    this.paintGrassSideTile(ctx, 'grassSide', 1, 0);
    this.paintTile(ctx, 'dirt', 2, 0, '#7b5435', '#644229', '#916341');
    this.paintTile(ctx, 'stone', 3, 0, '#8c9398', '#737a81', '#a8afb4');
    this.paintLogSideTile(ctx, 'woodSide', 0, 1);
    this.paintLogTopTile(ctx, 'woodTop', 1, 1);
    this.paintLeavesTile(ctx, 'leaves', 2, 1);
    this.paintTile(ctx, 'sand', 3, 1, '#ccb47e', '#b59c66', '#e0c891');
    this.paintTile(ctx, 'gravel', 4, 1, '#9b9996', '#7e7c79', '#bbb8b3');
    this.paintWaterTile(ctx, 'water', 5, 1);
    this.paintTile(ctx, 'snow', 6, 1, '#eef4ff', '#d7deeb', '#ffffff');
    this.paintTallGrassTile(ctx, 'tallGrass', 7, 1);
    this.paintFlowerTile(ctx, 'flowerRed', 0, 2, '#d63f3f', '#ff6767');
    this.paintFlowerTile(ctx, 'flowerYellow', 1, 2, '#e4c43f', '#ffe071');
    this.paintTile(ctx, 'mud', 2, 2, '#624834', '#4f3828', '#7b5a42');
    this.paintTile(ctx, 'clay', 3, 2, '#9f9891', '#878078', '#bab4ad');
    this.paintPodzolTopTile(ctx, 'podzolTop', 4, 2);
    this.paintPodzolSideTile(ctx, 'podzolSide', 5, 2);
    this.paintGlowshroomTile(ctx, 'glowshroom', 6, 2);
    this.paintCandyTile(ctx, 'candy', 7, 2);
    this.paintPackedBrickTile(ctx, 'packedBrick', 0, 3);
  }

  private paintTile(
    ctx: CanvasRenderingContext2D,
    name: string,
    col: number,
    row: number,
    base: string,
    dark: string,
    light: string,
  ): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;

    ctx.fillStyle = base;
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);

    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const h = this.hash(name, x, y);
        const noise = (h % 100) / 100;
        if (noise > 0.86) {
          ctx.fillStyle = light;
          ctx.fillRect(startX + x, startY + y, 1, 1);
        } else if (noise < 0.14) {
          ctx.fillStyle = dark;
          ctx.fillRect(startX + x, startY + y, 1, 1);
        }
      }
    }

    // Petit contour interne pour un style pixel-art low poly plus net.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX + 0.5, startY + 0.5, this.tileSize - 1, this.tileSize - 1);
  }

  private paintGrassTopTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;

    ctx.fillStyle = '#7ebc4f';
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);

    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const h = this.hash(name, x, y) % 100;
        if (h > 84) ctx.fillStyle = '#8fcd5f';
        else if (h < 18) ctx.fillStyle = '#659b3f';
        else continue;
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintGrassSideTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    const grassBand = 8;

    // Base terre.
    ctx.fillStyle = '#7b5435';
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);

    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const h = this.hash(`${name}-dirt`, x, y) % 100;
        if (h > 85) ctx.fillStyle = '#916341';
        else if (h < 15) ctx.fillStyle = '#644229';
        else continue;
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }

    // Bande herbe en haut avec transition irreguliere "minecraft-like".
    for (let y = 0; y < grassBand; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const drip = this.hash(`${name}-drip`, x, y) % 100;
        const shouldPaint = y < grassBand - 2 || drip > 38;
        if (!shouldPaint) continue;

        const h = this.hash(`${name}-grass`, x, y) % 100;
        if (h > 82) ctx.fillStyle = '#95d864';
        else if (h < 16) ctx.fillStyle = '#5e963b';
        else ctx.fillStyle = '#7fbe50';
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintLogSideTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;

    ctx.fillStyle = '#8a623b';
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);

    // Stries verticales d'ecorce.
    for (let x = 0; x < this.tileSize; x += 1) {
      const band = this.hash(`${name}-band`, x, 0) % 100;
      let color = '#7a5332';
      if (band > 78) color = '#9b7248';
      else if (band < 22) color = '#664628';

      for (let y = 0; y < this.tileSize; y += 1) {
        const jitter = this.hash(`${name}-jitter`, x, y) % 100;
        if (jitter < 8) continue;
        ctx.fillStyle = color;
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintLogTopTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    const center = (this.tileSize - 1) / 2;

    ctx.fillStyle = '#9f784d';
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);

    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ring = Math.floor(dist / 2) % 2;
        const h = this.hash(`${name}-ring`, x, y) % 100;

        if (ring === 0) ctx.fillStyle = h > 85 ? '#b78a5a' : '#a57b50';
        else ctx.fillStyle = h < 15 ? '#7e5c3a' : '#8e6943';
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintLeavesTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;

    // Transparence complete d'abord pour garantir des trous nets.
    ctx.clearRect(startX, startY, this.tileSize, this.tileSize);

    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const h = this.hash(name, x, y) % 100;
        if (h < 22) {
          // Trou transparent.
          continue;
        }
        if (h > 86) ctx.fillStyle = '#68af62';
        else if (h < 38) ctx.fillStyle = '#3f7c3a';
        else ctx.fillStyle = '#4f9349';
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintWaterTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    ctx.clearRect(startX, startY, this.tileSize, this.tileSize);
    ctx.fillStyle = 'rgba(52, 122, 214, 0.78)';
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);
    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const h = this.hash(name, x, y) % 100;
        if (h > 84) ctx.fillStyle = 'rgba(102, 168, 244, 0.8)';
        else if (h < 14) ctx.fillStyle = 'rgba(34, 92, 178, 0.82)';
        else continue;
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintTallGrassTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    ctx.clearRect(startX, startY, this.tileSize, this.tileSize);
    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const normalized = y / this.tileSize;
        if (normalized < 0.15) continue;
        const h = this.hash(name, x, y) % 100;
        if (h < 45 + normalized * 22) continue;
        if (h > 88) ctx.fillStyle = '#84c960';
        else if (h < 60) ctx.fillStyle = '#4d8a39';
        else ctx.fillStyle = '#68aa48';
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintFlowerTile(
    ctx: CanvasRenderingContext2D,
    name: string,
    col: number,
    row: number,
    petalBase: string,
    petalLight: string,
  ): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    ctx.clearRect(startX, startY, this.tileSize, this.tileSize);

    for (let y = 10; y < this.tileSize; y += 1) {
      for (let x = 14; x <= 17; x += 1) {
        const h = this.hash(`${name}-stem`, x, y) % 100;
        if (h < 15) continue;
        ctx.fillStyle = h > 80 ? '#79c160' : '#4f9442';
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }

    const petals = [
      { x: 12, y: 8 },
      { x: 20, y: 8 },
      { x: 16, y: 4 },
      { x: 16, y: 10 },
    ];
    for (const petal of petals) {
      for (let py = -3; py <= 3; py += 1) {
        for (let px = -3; px <= 3; px += 1) {
          if (Math.abs(px) + Math.abs(py) > 4) continue;
          const x = petal.x + px;
          const y = petal.y + py;
          const h = this.hash(`${name}-petal`, x, y) % 100;
          ctx.fillStyle = h > 78 ? petalLight : petalBase;
          ctx.fillRect(startX + x, startY + y, 1, 1);
        }
      }
    }

    for (let y = 5; y <= 9; y += 1) {
      for (let x = 14; x <= 18; x += 1) {
        if (Math.abs(x - 16) + Math.abs(y - 7) > 2) continue;
        ctx.fillStyle = '#f2dc7a';
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintPodzolTopTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    ctx.fillStyle = '#6b4f34';
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);
    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const h = this.hash(name, x, y) % 100;
        if (h > 84) ctx.fillStyle = '#846346';
        else if (h < 14) ctx.fillStyle = '#523a27';
        else if (h > 56 && h < 62) ctx.fillStyle = '#4f7d3f';
        else continue;
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintPodzolSideTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    ctx.fillStyle = '#7b5435';
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);
    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const h = this.hash(`${name}-d`, x, y) % 100;
        if (h > 84) ctx.fillStyle = '#926343';
        else if (h < 14) ctx.fillStyle = '#644229';
        else continue;
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const h = this.hash(`${name}-m`, x, y) % 100;
        if (h < 34) continue;
        ctx.fillStyle = h > 78 ? '#658f49' : '#4f7b3b';
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintGlowshroomTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    ctx.clearRect(startX, startY, this.tileSize, this.tileSize);
    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const cx = x - 16;
        const cy = y - 16;
        const dist = Math.sqrt(cx * cx + cy * cy);
        if (dist > 15) continue;
        const h = this.hash(name, x, y) % 100;
        if (h < 20) continue;
        if (dist < 6) ctx.fillStyle = '#d8f8ff';
        else if (dist < 11) ctx.fillStyle = '#7be2d6';
        else ctx.fillStyle = '#3f9f95';
        ctx.fillRect(startX + x, startY + y, 1, 1);
      }
    }
  }

  private paintCandyTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    ctx.fillStyle = '#ce6ad2';
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);
    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const stripe = ((x + y) % 8) < 4;
        ctx.fillStyle = stripe ? '#f6a5ef' : '#ae4eb2';
        if (this.hash(name, x, y) % 100 > 58) {
          ctx.fillRect(startX + x, startY + y, 1, 1);
        }
      }
    }
  }

  private paintPackedBrickTile(ctx: CanvasRenderingContext2D, name: string, col: number, row: number): void {
    this.tileMap.set(name, { col, row });
    const startX = col * this.tileSize;
    const startY = row * this.tileSize;
    ctx.fillStyle = '#8f6b59';
    ctx.fillRect(startX, startY, this.tileSize, this.tileSize);
    for (let y = 0; y < this.tileSize; y += 8) {
      const offset = (y / 8) % 2 === 0 ? 0 : 4;
      for (let x = offset; x < this.tileSize; x += 8) {
        ctx.strokeStyle = '#5f4235';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX + x + 0.5, startY + y + 0.5, 7, 7);
      }
    }
    for (let y = 0; y < this.tileSize; y += 1) {
      for (let x = 0; x < this.tileSize; x += 1) {
        const h = this.hash(`${name}-grain`, x, y) % 100;
        if (h > 87) {
          ctx.fillStyle = '#a57e6a';
          ctx.fillRect(startX + x, startY + y, 1, 1);
        }
      }
    }
  }

  private getTileTexture(name: string): Texture {
    const existing = this.tileTextures.get(name);
    if (existing) {
      return existing;
    }

    const coord = this.tileMap.get(name);
    if (!coord) {
      throw new Error(`Tile inconnue: ${name}`);
    }

    const tx = this.atlasTexture.clone();
    tx.colorSpace = SRGBColorSpace;
    tx.wrapS = ClampToEdgeWrapping;
    tx.wrapT = ClampToEdgeWrapping;
    tx.magFilter = NearestFilter;
    tx.minFilter = NearestFilter;
    tx.generateMipmaps = false;
    const atlasWidth = this.tileSize * this.atlasCols;
    const atlasHeight = this.tileSize * this.atlasRows;
    const padU = 0.5 / atlasWidth;
    const padV = 0.5 / atlasHeight;
    const u0 = coord.col / this.atlasCols + padU;
    const v0 = 1 - (coord.row + 1) / this.atlasRows + padV;
    const u1 = (coord.col + 1) / this.atlasCols - padU;
    const v1 = 1 - coord.row / this.atlasRows - padV;
    tx.repeat.set(Math.max(0.00001, u1 - u0), Math.max(0.00001, v1 - v0));
    tx.offset.set(u0, v0);
    tx.needsUpdate = true;
    this.tileTextures.set(name, tx);
    return tx;
  }

  private createBreakCrackTexture(stage: number): CanvasTexture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Impossible de creer le contexte 2D pour la texture de brisure.');
    }

    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const segmentCount = 7 + stage * 3;
    const maxAlpha = Math.min(0.9, 0.28 + stage * 0.06);
    const branchChance = Math.min(0.8, 0.2 + stage * 0.06);

    for (let i = 0; i < segmentCount; i += 1) {
      const seed = `crack-${stage}-${i}`;
      const startX = this.hash(seed, 7, 13) % size;
      const startY = this.hash(seed, 19, 29) % size;
      const angle = ((this.hash(seed, 37, 43) % 6283) / 1000) * Math.PI * 0.5;
      const length = 7 + (this.hash(seed, 53, 59) % (9 + stage * 2));
      const endX = Math.max(0, Math.min(size - 1, Math.round(startX + Math.cos(angle) * length)));
      const endY = Math.max(0, Math.min(size - 1, Math.round(startY + Math.sin(angle) * length)));

      const alpha = 0.25 + ((this.hash(seed, 71, 89) % 100) / 100) * (maxAlpha - 0.25);
      ctx.strokeStyle = `rgba(18, 20, 24, ${alpha.toFixed(3)})`;
      ctx.lineWidth = stage >= 7 && i % 3 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      const branchRoll = (this.hash(seed, 97, 101) % 100) / 100;
      if (branchRoll > branchChance) {
        continue;
      }
      const midX = Math.round((startX + endX) * 0.5);
      const midY = Math.round((startY + endY) * 0.5);
      const branchAngle = angle + (((this.hash(seed, 107, 109) % 2) === 0 ? -1 : 1) * Math.PI) / 3;
      const branchLength = Math.max(4, Math.round(length * 0.45));
      const branchEndX = Math.max(0, Math.min(size - 1, Math.round(midX + Math.cos(branchAngle) * branchLength)));
      const branchEndY = Math.max(0, Math.min(size - 1, Math.round(midY + Math.sin(branchAngle) * branchLength)));

      ctx.strokeStyle = `rgba(18, 20, 24, ${(alpha * 0.9).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(branchEndX, branchEndY);
      ctx.stroke();
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  private hash(seed: string, x: number, y: number): number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= x + 374761393;
    h = Math.imul(h, 668265263);
    h ^= y + 1274126177;
    h = Math.imul(h, 2246822519);
    return Math.abs(h);
  }
}
