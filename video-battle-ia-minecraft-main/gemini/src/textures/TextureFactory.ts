import * as THREE from 'three';

export type TextureType = 
  'grass' | 'dirt' | 'stone' | 'wood' | 'leaves' | 'grass_top' | 'grass_side' | 'wood_top' | 'wood_side' |
  'sand' | 'water' | 
  'log_acacia' | 'log_acacia_top' | 'leaves_acacia' |
  'log_spruce' | 'log_spruce_top' | 'leaves_spruce' |
  'log_jungle' | 'log_jungle_top' | 'leaves_jungle' |
  'cactus_side' | 'cactus_top' |
  'snow' | 'ice' | 'grass_snow_side' |
  // New Flora
  'flower_red' | 'flower_yellow' | 'tall_grass' | 'dead_bush' |
  'mushroom_brown' | 'mushroom_red' | 'vines' | 'lilypad' |
  'red_sand' | 'podzol_top' | 'podzol_side' |
  // Phase 3 Blocks
  'gravel' | 'clay' | 'sandstone_side' | 'sandstone_top' |
  'cobblestone' | 'mossy_cobblestone' | 
  'log_birch' | 'log_birch_top' | 'leaves_birch' |
  'sugar_cane' | 'bedrock' |
  'ore_coal' | 'ore_iron' | 'ore_gold' | 'ore_diamond';

const TEXTURE_SIZE = 16;

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  return canvas;
};

const getContext = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2d context');
  return ctx;
};

// Helper: Fill rect with color string
const fill = (ctx: CanvasRenderingContext2D, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
};

// Helper: Draw a single pixel
const pixel = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
};

// Deterministic Random
let _seed = 1337; 
const resetRandom = () => { _seed = 1337; };
const random = () => {
    const x = Math.sin(_seed++) * 10000;
    return x - Math.floor(x);
};

// Helper: Draw noise with optional size
const drawNoise = (ctx: CanvasRenderingContext2D, density: number, colors: string[], size = 1) => {
    for (let x = 0; x < TEXTURE_SIZE; x+=size) {
        for (let y = 0; y < TEXTURE_SIZE; y+=size) {
            if (random() < density) {
                const color = colors[Math.floor(random() * colors.length)];
                ctx.fillStyle = color;
                ctx.fillRect(x, y, size, size);
            }
        }
    }
};

// CACHE: Store the dirt pattern canvas so we can clone it exactly
let dirtCanvasCache: HTMLCanvasElement | null = null;

// Helper: Generate or retrieve the base dirt pattern
const getDirtPattern = (colors: string[]) => {
    if (dirtCanvasCache) return dirtCanvasCache;
    
    const canvas = createCanvas();
    const ctx = getContext(canvas);
    
    resetRandom();
    fill(ctx, colors[1]);
    drawNoise(ctx, 0.5, colors);
    
    dirtCanvasCache = canvas;
    return canvas;
}

export const getTextureCanvas = (type: TextureType): HTMLCanvasElement => {
  const canvas = createCanvas();
  const ctx = getContext(canvas);

  // Minecraft-ish Palettes (Refined)
  const dirtColors = ['#9b6d46', '#875d3b', '#70492d', '#593a23'];
  const stoneColors = ['#919191', '#7d7d7d', '#636363', '#575757'];
  const grassTopColors = ['#83b541', '#72a334', '#5a8c26'];
  const woodColors = ['#785834', '#664a2b', '#523a20'];
  const leavesColors = ['#2e7d14', '#266610', '#1e520c'];
  
  // Wood Variants
  const acaciaLogColors = ['#6b655d', '#615b54', '#57514a'];
  const acaciaLeavesColors = ['#77ab2f', '#6da328', '#639c21'];
  
  const spruceLogColors = ['#3b2611', '#33210e', '#2b1c0b'];
  const spruceLeavesColors = ['#3d613c', '#355434', '#2d472c'];
  
  const jungleLogColors = ['#57451d', '#4f3e1a', '#473817'];
  const jungleLeavesColors = ['#1f8f17', '#1a8213', '#15750f'];

  const birchLogColors = ['#e3e1d5', '#d6d4c5', '#c7c5b6'];
  const birchLeavesColors = ['#6ba847', '#5a9138', '#4a7d2b'];
  
  // Ores
  const coalColors = ['#333333', '#262626'];
  const ironColors = ['#d1bda1', '#bda892'];
  const goldColors = ['#fcee4b', '#e6d62e'];
  const diamondColors = ['#4bede4', '#2dbdb5'];

  // Other
  const gravelColors = ['#9e9e9e', '#8a8a8a', '#757575'];
  const clayColors = ['#aeb5d1', '#9ca3bf', '#8a91ad'];
  const sandstoneColors = ['#dbd2a4', '#d1c793', '#c4ba85'];
  const cobbleColors = ['#757575', '#636363', '#525252'];
  const bedrockColors = ['#333333', '#222222', '#111111'];
  const podzolColors = ['#5e4425', '#4d361c', '#3d2914'];
  const cactusColors = ['#527d26', '#497022', '#3f631e'];

  // Flora
  const flowerRedColors = ['#cf2525', '#b01e1e'];
  const flowerYellowColors = ['#e6d933', '#c9c122'];
  const snowColors = ['#ffffff', '#fcfcfc', '#f0f0f0'];
  const iceColors = ['#7daeff', '#73a3f5', '#6999eb'];

  resetRandom(); // Reset for consistency

  switch (type) {
    case 'dirt':
      ctx.drawImage(getDirtPattern(dirtColors), 0, 0);
      break;

    case 'stone':
      fill(ctx, stoneColors[1]);
      drawNoise(ctx, 0.4, stoneColors);
      break;

    case 'cobblestone':
    case 'mossy_cobblestone':
      fill(ctx, cobbleColors[1]);
      // Draw outlines of "stones"
      for(let i=0; i<8; i++) {
          const x = Math.floor(random() * 12);
          const y = Math.floor(random() * 12);
          const w = 3 + Math.floor(random()*3);
          const h = 3 + Math.floor(random()*3);
          ctx.fillStyle = cobbleColors[0];
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = cobbleColors[2];
          ctx.fillRect(x+1, y+1, w-2, h-2);
      }
      if (type === 'mossy_cobblestone') {
          drawNoise(ctx, 0.3, ['#4a6e2e', '#3b5c22']);
      }
      break;

    case 'bedrock':
        fill(ctx, bedrockColors[1]);
        drawNoise(ctx, 0.8, bedrockColors);
        break;

    case 'gravel':
        fill(ctx, gravelColors[1]);
        drawNoise(ctx, 0.6, gravelColors);
        break;

    case 'clay':
        fill(ctx, clayColors[1]);
        drawNoise(ctx, 0.2, clayColors);
        break;

    case 'sand':
        fill(ctx, '#d6cf9c');
        drawNoise(ctx, 0.3, ['#e3dbb0', '#c9c291']);
        break;
        
    case 'red_sand':
        fill(ctx, '#c25a20');
        drawNoise(ctx, 0.3, ['#d16a30', '#a34818']);
        break;

    case 'sandstone_top':
        fill(ctx, sandstoneColors[1]);
        break;
    
    case 'sandstone_side':
        fill(ctx, sandstoneColors[1]);
        ctx.fillStyle = sandstoneColors[2];
        ctx.fillRect(0, 4, 16, 1);
        ctx.fillRect(0, 10, 16, 1);
        break;

    case 'grass_top':
    case 'grass': 
      fill(ctx, grassTopColors[1]);
      drawNoise(ctx, 0.5, grassTopColors);
      break;

    case 'grass_side':
      ctx.drawImage(getDirtPattern(dirtColors), 0, 0);
      ctx.fillStyle = grassTopColors[1];
      ctx.fillRect(0, 0, 16, 3);
      drawNoise(ctx, 0.5, grassTopColors);
      for(let x=0; x<16; x++) {
          if (random() > 0.5) {
              const h = 1 + Math.floor(random() * 3);
              ctx.fillRect(x, 3, 1, h);
          }
      }
      break;
      
    case 'grass_snow_side':
      ctx.drawImage(getDirtPattern(dirtColors), 0, 0);
      ctx.fillStyle = snowColors[0];
      ctx.fillRect(0, 0, 16, 4);
      for(let x=0; x<16; x++) {
          if (random() > 0.5) {
              const h = 1 + Math.floor(random() * 3);
              ctx.fillRect(x, 4, 1, h);
          }
      }
      break;

    case 'podzol_top':
        fill(ctx, podzolColors[1]);
        drawNoise(ctx, 0.6, podzolColors);
        break;

    case 'podzol_side':
        ctx.drawImage(getDirtPattern(dirtColors), 0, 0);
        ctx.fillStyle = podzolColors[1];
        ctx.fillRect(0,0,16,2);
        break;

    case 'wood_side':
    case 'wood':
      fill(ctx, woodColors[1]);
      for(let x=0; x<16; x++) {
          if (x % 2 === 0) continue;
          for(let y=0; y<16; y++) {
              if (random() > 0.2) {
                  pixel(ctx, x, y, woodColors[2]);
              }
          }
      }
      break;
      
    case 'wood_top':
      fill(ctx, '#a5885e');
      for(let r=1; r<7; r+=2) {
          ctx.beginPath();
          ctx.arc(8, 8, r, 0, Math.PI*2);
          ctx.strokeStyle = '#876e4c';
          ctx.stroke();
      }
      break;

    case 'log_acacia':
        fill(ctx, acaciaLogColors[1]);
        drawNoise(ctx, 0.2, acaciaLogColors);
        // Diagonal streaks
        for(let i=0; i<10; i++) {
            const x = Math.floor(random()*16);
            const y = Math.floor(random()*16);
            ctx.fillStyle = acaciaLogColors[2];
            ctx.fillRect(x, y, 1, 4);
        }
        break;
    
    case 'log_acacia_top':
        fill(ctx, acaciaLogColors[1]);
        break;

    case 'log_spruce':
        fill(ctx, spruceLogColors[1]);
        for(let x=0; x<16; x+=2) {
            for(let y=0; y<16; y++) {
                if(random()>0.3) pixel(ctx, x, y, spruceLogColors[2]);
            }
        }
        break;

    case 'log_spruce_top':
        fill(ctx, spruceLogColors[1]);
        break;
    
    case 'log_jungle':
        fill(ctx, jungleLogColors[1]);
        for(let y=0; y<16; y++) {
             if(random()>0.7) {
                 ctx.fillStyle = jungleLogColors[2];
                 ctx.fillRect(0, y, 16, 1);
             }
        }
        break;
        
    case 'log_jungle_top':
        fill(ctx, jungleLogColors[1]);
        break;

    case 'log_birch':
        fill(ctx, birchLogColors[0]);
        for(let i=0; i<10; i++) {
            const x = Math.floor(random() * 16);
            const y = Math.floor(random() * 16);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x, y, 2, 1);
        }
        break;
        
    case 'log_birch_top':
        fill(ctx, birchLogColors[1]);
        for(let r=1; r<7; r+=2) {
          ctx.beginPath();
          ctx.arc(8, 8, r, 0, Math.PI*2);
          ctx.strokeStyle = birchLogColors[2];
          ctx.stroke();
        }
        break;

    case 'leaves':
    case 'leaves_birch':
    case 'leaves_spruce':
    case 'leaves_jungle':
    case 'leaves_acacia': {
        let leafCol = leavesColors;
        if (type === 'leaves_birch') leafCol = birchLeavesColors;
        else if (type === 'leaves_spruce') leafCol = spruceLeavesColors;
        else if (type === 'leaves_jungle') leafCol = jungleLeavesColors;
        else if (type === 'leaves_acacia') leafCol = acaciaLeavesColors;
        
        fill(ctx, leafCol[1]);
        drawNoise(ctx, 0.6, leafCol);
        for(let i=0; i<20; i++) {
            const x = Math.floor(random()*16);
            const y = Math.floor(random()*16);
            ctx.fillStyle = leafCol[2];
            ctx.fillRect(x, y, 2, 2);
        }
        break;
    }

    case 'cactus_side':
        fill(ctx, cactusColors[1]);
        for(let x=0; x<16; x+=4) {
            ctx.fillStyle = cactusColors[2];
            ctx.fillRect(x, 0, 1, 16);
        }
        break;
        
    case 'cactus_top':
        fill(ctx, cactusColors[1]);
        break;

    case 'water':
        fill(ctx, '#3f76e4'); 
        ctx.fillStyle = '#5283ea';
        for(let i=0; i<10; i++) {
            const x = Math.floor(random() * 14);
            const y = Math.floor(random() * 16);
            ctx.fillRect(x, y, 2, 1);
        }
        break;

    case 'ore_coal':
        fill(ctx, stoneColors[1]);
        drawNoise(ctx, 0.4, stoneColors);
        for(let i=0; i<6; i++) {
            const x = Math.floor(random() * 14);
            const y = Math.floor(random() * 14);
            ctx.fillStyle = coalColors[0];
            ctx.fillRect(x, y, 2, 2);
        }
        break;
    
    case 'ore_iron':
        fill(ctx, stoneColors[1]);
        drawNoise(ctx, 0.4, stoneColors);
        for(let i=0; i<6; i++) {
            const x = Math.floor(random() * 14);
            const y = Math.floor(random() * 14);
            ctx.fillStyle = ironColors[0];
            ctx.fillRect(x, y, 2, 2);
        }
        break;

    case 'ore_gold':
        fill(ctx, stoneColors[1]);
        drawNoise(ctx, 0.4, stoneColors);
        for(let i=0; i<5; i++) {
            const x = Math.floor(random() * 14);
            const y = Math.floor(random() * 14);
            ctx.fillStyle = goldColors[0];
            ctx.fillRect(x, y, 2, 2);
        }
        break;

    case 'ore_diamond':
        fill(ctx, stoneColors[1]);
        drawNoise(ctx, 0.4, stoneColors);
        for(let i=0; i<4; i++) {
            const x = Math.floor(random() * 14);
            const y = Math.floor(random() * 14);
            ctx.fillStyle = diamondColors[0];
            ctx.fillRect(x, y, 2, 2);
        }
        break;

    // Flora
    case 'flower_red':
        ctx.clearRect(0,0,16,16);
        ctx.fillStyle = '#2d801e'; 
        ctx.fillRect(7, 8, 2, 8);
        ctx.fillStyle = flowerRedColors[0];
        ctx.fillRect(5, 4, 6, 5); 
        ctx.fillStyle = flowerYellowColors[0];
        ctx.fillRect(7, 6, 2, 2); 
        break;

    case 'flower_yellow':
        ctx.clearRect(0,0,16,16);
        ctx.fillStyle = '#2d801e'; 
        ctx.fillRect(7, 10, 2, 6);
        ctx.fillStyle = flowerYellowColors[0];
        ctx.fillRect(6, 6, 4, 4); 
        break;

    case 'tall_grass':
        ctx.clearRect(0,0,16,16);
        ctx.fillStyle = '#2d801e';
        ctx.fillRect(2, 6, 1, 10);
        ctx.fillRect(6, 4, 1, 12);
        ctx.fillRect(10, 8, 1, 8);
        ctx.fillRect(13, 10, 1, 6);
        ctx.fillRect(3, 5, 1, 1);
        ctx.fillRect(7, 3, 1, 1);
        break;
        
    case 'dead_bush':
        ctx.clearRect(0,0,16,16);
        ctx.fillStyle = '#6b5123';
        ctx.fillRect(7, 12, 2, 4); 
        ctx.fillRect(4, 8, 8, 1); 
        ctx.fillRect(4, 6, 1, 2);
        ctx.fillRect(11, 7, 1, 3);
        break;

    case 'sugar_cane':
        ctx.fillStyle = '#9bbd4c';
        ctx.fillRect(0,0,16,16);
        ctx.fillStyle = '#8fad43';
        ctx.fillRect(4,0,2,16);
        ctx.fillRect(10,0,2,16);
        break;

    case 'mushroom_brown':
        ctx.clearRect(0,0,16,16);
        ctx.fillStyle = '#947249';
        ctx.fillRect(5, 8, 6, 2);
        ctx.fillRect(6, 7, 4, 1);
        ctx.fillStyle = '#ccc6ba';
        ctx.fillRect(7, 10, 2, 6);
        break;

    case 'mushroom_red':
        ctx.clearRect(0,0,16,16);
        ctx.fillStyle = '#d43535';
        ctx.fillRect(5, 8, 6, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6, 8, 1, 1);
        ctx.fillRect(9, 9, 1, 1);
        ctx.fillStyle = '#ccc6ba';
        ctx.fillRect(7, 11, 2, 5);
        break;

    case 'vines':
        ctx.clearRect(0,0,TEXTURE_SIZE,TEXTURE_SIZE);
        ctx.fillStyle = '#2d801e';
        for(let i=0; i<20; i++) {
            const x = Math.floor(random() * TEXTURE_SIZE);
            const y = Math.floor(random() * TEXTURE_SIZE);
            pixel(ctx, x, y, '#2d801e');
        }
        break;

    case 'lilypad':
        ctx.clearRect(0,0,TEXTURE_SIZE,TEXTURE_SIZE);
        ctx.fillStyle = '#1e7516';
        ctx.fillRect(2, 2, 12, 12); 
        ctx.clearRect(10, 2, 4, 4); 
        break;

    case 'snow': fill(ctx, snowColors[0]); break;
    case 'ice': fill(ctx, iceColors[1]); break;
    
    default:
        // Fallback to simple noise
        fill(ctx, '#ff00ff');
        break;
  }
  return canvas;
};

export const createTexture = (type: TextureType): THREE.CanvasTexture => {
  const canvas = getTextureCanvas(type);
  const texture = new THREE.CanvasTexture(canvas);

  texture.magFilter = THREE.NearestFilter; 
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace; 
  
  return texture;
};
