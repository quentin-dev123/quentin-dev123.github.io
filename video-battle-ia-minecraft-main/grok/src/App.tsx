import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// Types pour le monde voxel
interface Block {
  x: number
  y: number
  z: number
  type: 'grass' | 'dirt' | 'stone' | 'wood' | 'leaves' | 'air'
}

interface Player {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  onGround: boolean
  selectedBlock: 'stone' | 'dirt' | 'wood'
}

// Générateur de bruit simple pour le terrain
class SimpleNoise {
  private seed: number

  constructor(seed: number = 12345) {
    this.seed = seed
  }

  noise2D(x: number, y: number): number {
    const n = Math.sin(x * 0.01 + this.seed) * Math.cos(y * 0.01 + this.seed) * 0.5 + 0.5
    return Math.sin(n * Math.PI) * 0.5 + 0.5
  }

  fractalNoise2D(x: number, y: number, octaves: number = 4): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x * frequency, y * frequency) * amplitude
      maxValue += amplitude
      amplitude *= 0.5
      frequency *= 2
    }

    return value / maxValue
  }
}

// Générateur de textures Minecraft-like
class MinecraftTextureGenerator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private textures: Map<string, THREE.Texture> = new Map()

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 16
    this.canvas.height = 16
    this.ctx = this.canvas.getContext('2d')!
  }

  generateBlockTexture(type: string): THREE.Texture {
    if (this.textures.has(type)) {
      return this.textures.get(type)!
    }

    this.ctx.clearRect(0, 0, 16, 16)

    switch (type) {
      case 'grass':
        this.generateGrassTexture()
        break
      case 'dirt':
        this.generateDirtTexture()
        break
      case 'stone':
        this.generateStoneTexture()
        break
      case 'wood':
        this.generateWoodTexture()
        break
      case 'leaves':
        this.generateLeavesTexture()
        break
      default:
        this.generateDefaultTexture()
    }

    const texture = new THREE.Texture(this.canvas)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    texture.needsUpdate = true

    this.textures.set(type, texture)
    return texture
  }

  private generateGrassTexture() {
    // Base verte
    this.ctx.fillStyle = '#8FBC8F'
    this.ctx.fillRect(0, 0, 16, 16)

    // Motif d'herbe détaillé
    this.ctx.fillStyle = '#228B22'
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * 16
      const y = Math.random() * 16
      const size = Math.random() * 2 + 1
      this.ctx.fillRect(x, y, size, size)
    }

    // Quelques fleurs
    this.ctx.fillStyle = '#FFFF00'
    this.ctx.fillRect(3, 3, 1, 1)
    this.ctx.fillRect(12, 8, 1, 1)
    this.ctx.fillStyle = '#FF69B4'
    this.ctx.fillRect(7, 12, 1, 1)
  }

  private generateDirtTexture() {
    // Base marron
    this.ctx.fillStyle = '#8B4513'
    this.ctx.fillRect(0, 0, 16, 16)

    // Variations naturelles
    this.ctx.fillStyle = '#A0522D'
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 16
      const y = Math.random() * 16
      const size = Math.random() * 3 + 1
      this.ctx.fillRect(x, y, size, size)
    }

    // Petits détails
    this.ctx.fillStyle = '#654321'
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * 16
      const y = Math.random() * 16
      this.ctx.fillRect(x, y, 1, 1)
    }
  }

  private generateStoneTexture() {
    // Base grise
    this.ctx.fillStyle = '#696969'
    this.ctx.fillRect(0, 0, 16, 16)

    // Craquelures réalistes
    this.ctx.fillStyle = '#2F2F2F'
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 16
      const y = Math.random() * 16
      const size = Math.random() * 2 + 1
      this.ctx.fillRect(x, y, size, size)
    }

    // Points brillants
    this.ctx.fillStyle = '#D3D3D3'
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * 16
      const y = Math.random() * 16
      this.ctx.fillRect(x, y, 1, 1)
    }
  }

  private generateWoodTexture() {
    // Base marron
    this.ctx.fillStyle = '#8B4513'
    this.ctx.fillRect(0, 0, 16, 16)

    // Anneaux de croissance
    this.ctx.fillStyle = '#654321'
    for (let y = 0; y < 16; y += 2) {
      this.ctx.fillRect(0, y, 16, 1)
    }

    // Nœuds plus réalistes
    this.ctx.fillStyle = '#654321'
    this.ctx.fillRect(4, 4, 3, 3)
    this.ctx.fillRect(9, 11, 3, 3)
    this.ctx.fillRect(2, 13, 2, 2)
  }

  private generateLeavesTexture() {
    // Base verte transparente
    this.ctx.fillStyle = 'rgba(34, 139, 34, 0.9)'
    this.ctx.fillRect(0, 0, 16, 16)

    // Motif de feuilles détaillé
    this.ctx.fillStyle = '#228B22'
    for (let i = 0; i < 35; i++) {
      const x = Math.random() * 16
      const y = Math.random() * 16
      const size = Math.random() * 2 + 1
      this.ctx.fillRect(x, y, size, size)
    }

    // Quelques trous transparents
    this.ctx.clearRect(5, 5, 2, 2)
    this.ctx.clearRect(11, 8, 1, 1)
  }

  private generateDefaultTexture() {
    this.ctx.fillStyle = '#FF00FF'
    this.ctx.fillRect(0, 0, 16, 16)
  }
}

// Moteur voxel Minecraft complet
function MinecraftWorld() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const animationIdRef = useRef<number>()
  const textureGeneratorRef = useRef<MinecraftTextureGenerator>()
  const worldRef = useRef<Map<string, Block>>(new Map())

  // État du joueur
  const playerRef = useRef<Player>({
    position: new THREE.Vector3(0, 25, 0),
    velocity: new THREE.Vector3(),
    rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
    onGround: false,
    selectedBlock: 'stone'
  })

  // États React
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [worldGenerated, setWorldGenerated] = useState(false)

  useEffect(() => {
    if (!mountRef.current) return

    console.log('🚀 Initialisation Minecraft World Avancé')

    // Générateur de bruit et textures
    const noiseGenerator = new SimpleNoise(12345)
    const textureGenerator = new MinecraftTextureGenerator()
    textureGeneratorRef.current = textureGenerator

    // Scène
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB)
    scene.fog = new THREE.Fog(0x87CEEB, 100, 300)
    sceneRef.current = scene

    // Caméra FPS
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.copy(playerRef.current.position)
    camera.rotation.copy(playerRef.current.rotation)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Éclairage dynamique
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2)
    sunLight.position.set(100, 100, 50)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.1
    sunLight.shadow.camera.far = 400
    sunLight.shadow.camera.left = -100
    sunLight.shadow.camera.right = 100
    sunLight.shadow.camera.top = 100
    sunLight.shadow.camera.bottom = -100
    scene.add(sunLight)

    // Générer le monde
    generateWorld(scene, noiseGenerator, textureGenerator)

    // Variables de contrôle
    const keysPressed = new Set<string>()
    const mouseSensitivity = 0.002
    const moveSpeed = 4.0
    const sprintMultiplier = 2.0
    const jumpForce = 8.0
    const gravity = -25.0

    // Gestion des événements
    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0 || event.button === 2) {
        handleBlockInteraction(event.button)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      keysPressed.add(event.code)

      // Changer de bloc sélectionné
      if (event.code === 'Digit1') playerRef.current.selectedBlock = 'stone'
      if (event.code === 'Digit2') playerRef.current.selectedBlock = 'dirt'
      if (event.code === 'Digit3') playerRef.current.selectedBlock = 'wood'
    }

    const onKeyUp = (event: KeyboardEvent) => {
      keysPressed.delete(event.code)
    }

    // Gestion du pointer lock pour FPS
    const onPointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null)
    }

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement) {
        const player = playerRef.current
        player.rotation.y -= event.movementX * mouseSensitivity
        player.rotation.x -= event.movementY * mouseSensitivity
        player.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, player.rotation.x))

        camera.rotation.copy(player.rotation)
      }
    }

    // Activer le pointer lock au clic
    const onCanvasClick = () => {
      if (!document.pointerLockElement) {
        mountRef.current?.requestPointerLock()
      }
    }

    // Ajouter les event listeners
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('pointerlockchange', onPointerLockChange)

    if (mountRef.current) {
      mountRef.current.addEventListener('click', onCanvasClick)
    }

    // Fonctions de génération du monde
    function generateWorld(scene: THREE.Scene, noise: SimpleNoise, textureGen: MinecraftTextureGenerator) {
      console.log('🏗️ Génération du monde Minecraft...')

      const worldSize = 64 // Monde de 64x64 blocs
      const blockGeometry = new THREE.BoxGeometry(1, 1, 1)

      for (let x = -worldSize/2; x < worldSize/2; x++) {
        for (let z = -worldSize/2; z < worldSize/2; z++) {
          // Génération de hauteur procédurale avancée
          const baseHeight = Math.floor(
            noise.fractalNoise2D(x * 0.02, z * 0.02, 4) * 12 + // Terrain principal
            noise.fractalNoise2D(x * 0.1, z * 0.1, 2) * 6 + // Détails
            20 // Niveau de base
          )

          const height = Math.min(baseHeight, 40)

          for (let y = 0; y <= height; y++) {
            let blockType: Block['type'] = 'stone'

            if (y > height - 4) {
              blockType = 'dirt'
            }
            if (y === height) {
              blockType = Math.random() > 0.15 ? 'grass' : 'dirt'
            }

            // Ajouter des minerais
            if (y < height - 4 && y > 5 && Math.random() < 0.01) {
              blockType = Math.random() > 0.5 ? 'stone' : 'dirt'
            }

            // Générer des arbres
            if (blockType === 'grass' && Math.random() < 0.005) {
              generateTree(scene, textureGen, blockGeometry, x, height, z)
            } else if (blockType !== 'air') {
              addBlock(scene, textureGen, blockGeometry, x, y, z, blockType)
            }
          }
        }
      }

      // Sol étendu
      const groundGeometry = new THREE.PlaneGeometry(worldSize * 2, worldSize * 2)
      const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x90EE90,
        transparent: true,
        opacity: 0.8
      })
      const ground = new THREE.Mesh(groundGeometry, groundMaterial)
      ground.rotation.x = -Math.PI / 2
      ground.position.y = -0.5
      ground.receiveShadow = true
      scene.add(ground)

      setWorldGenerated(true)
      console.log(`✅ Monde généré: ${worldRef.current.size} blocs`)
    }

    function generateTree(scene: THREE.Scene, textureGen: MinecraftTextureGenerator, geometry: THREE.BoxGeometry, x: number, y: number, z: number) {
      // Tronc
      for (let h = 1; h <= 5; h++) {
        addBlock(scene, textureGen, geometry, x, y + h, z, 'wood')
      }

      // Feuillage en couches
      for (let dy = 3; dy <= 5; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) + Math.abs(dz) + (dy - 3) <= 3) {
              const leafX = x + dx
              const leafY = y + dy
              const leafZ = z + dz

              if (!worldRef.current.has(`${leafX},${leafY},${leafZ}`)) {
                addBlock(scene, textureGen, geometry, leafX, leafY, leafZ, 'leaves')
              }
            }
          }
        }
      }
    }

    function addBlock(scene: THREE.Scene, textureGen: MinecraftTextureGenerator, geometry: THREE.BoxGeometry, x: number, y: number, z: number, type: Block['type']) {
      const material = new THREE.MeshLambertMaterial({ map: textureGen.generateBlockTexture(type) })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, y, z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { blockType: type, position: { x, y, z } }
      scene.add(mesh)

      worldRef.current.set(`${x},${y},${z}`, { x, y, z, type })
    }

    function handleBlockInteraction(button: number) {
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

      const intersects = raycaster.intersectObjects(scene.children)

      for (const intersect of intersects) {
        const mesh = intersect.object as THREE.Mesh
        if (mesh.userData.blockType && mesh.userData.position) {
          const pos = mesh.userData.position

          if (button === 0) {
            // Casser
            scene.remove(mesh)
            worldRef.current.delete(`${pos.x},${pos.y},${pos.z}`)
            console.log(`🔨 Bloc cassé: ${pos.x}, ${pos.y}, ${pos.z}`)
          } else if (button === 2) {
            // Placer
            const normal = intersect.face?.normal
            if (normal) {
              const newPos = {
                x: pos.x + normal.x,
                y: pos.y + normal.y,
                z: pos.z + normal.z
              }

              const key = `${newPos.x},${newPos.y},${newPos.z}`
              if (!worldRef.current.has(key)) {
                const blockGeometry = new THREE.BoxGeometry(1, 1, 1)
                addBlock(scene, textureGenerator, blockGeometry, newPos.x, newPos.y, newPos.z, playerRef.current.selectedBlock)
                console.log(`➕ Bloc placé: ${newPos.x}, ${newPos.y}, ${newPos.z}`)
              }
            }
          }
          break
        }
      }
    }

    // Fonction de physique du joueur
    function updatePlayer(deltaTime: number) {
      const player = playerRef.current

      // Mouvement horizontal
      const moveVector = new THREE.Vector3()
      const speed = keysPressed.has('ShiftLeft') ? moveSpeed * sprintMultiplier : moveSpeed

      if (keysPressed.has('KeyW')) moveVector.z -= 1
      if (keysPressed.has('KeyS')) moveVector.z += 1
      if (keysPressed.has('KeyA')) moveVector.x -= 1
      if (keysPressed.has('KeyD')) moveVector.x += 1

      if (moveVector.length() > 0) {
        moveVector.normalize().multiplyScalar(speed * deltaTime)

        // Applique la rotation du joueur
        const direction = new THREE.Vector3()
        camera.getWorldDirection(direction)
        direction.y = 0
        direction.normalize()

        const right = new THREE.Vector3().crossVectors(direction, camera.up).normalize()

        const horizontalMovement = new THREE.Vector3()
          .addScaledVector(direction, -moveVector.z)
          .addScaledVector(right, moveVector.x)

        // Vérifier les collisions
        const newX = player.position.x + horizontalMovement.x
        const newZ = player.position.z + horizontalMovement.z

        if (!checkCollision(newX, player.position.y, player.position.z)) {
          player.position.x = newX
        }
        if (!checkCollision(player.position.x, player.position.y, newZ)) {
          player.position.z = newZ
        }
      }

      // Saut
      if (keysPressed.has('Space') && player.onGround) {
        player.velocity.y = jumpForce
        player.onGround = false
      }

      // Gravité
      player.velocity.y += gravity * deltaTime

      // Mouvement vertical
      const newY = player.position.y + player.velocity.y * deltaTime

      if (checkCollision(player.position.x, newY, player.position.z)) {
        if (player.velocity.y < 0) {
          player.onGround = true
          player.position.y = Math.floor(newY) + 1.8
        }
        player.velocity.y = 0
      } else {
        player.position.y = newY
        player.onGround = false
      }

      // Limiter la vitesse de chute
      player.velocity.y = Math.max(player.velocity.y, -25)

      // Mettre à jour la caméra
      camera.position.copy(player.position)
      camera.rotation.copy(player.rotation)
    }

    function checkCollision(x: number, y: number, z: number): boolean {
      const playerHeight = 1.8
      const playerWidth = 0.6

      for (let dx = -playerWidth/2; dx <= playerWidth/2; dx += playerWidth/4) {
        for (let dy = 0; dy <= playerHeight; dy += playerHeight/4) {
          for (let dz = -playerWidth/2; dz <= playerWidth/2; dz += playerWidth/4) {
            const checkX = Math.floor(x + dx)
            const checkY = Math.floor(y + dy)
            const checkZ = Math.floor(z + dz)

            if (worldRef.current.has(`${checkX},${checkY},${checkZ}`)) {
              return true
            }
          }
        }
      }
      return false
    }

    // Boucle de jeu
    let lastTime = 0
    const animate = (currentTime: number) => {
      animationIdRef.current = requestAnimationFrame(animate)

      const deltaTime = Math.min((currentTime - lastTime) / 1000, 1/30)
      lastTime = currentTime

      updatePlayer(deltaTime)
      renderer.render(scene, camera)
    }
    animate(0)

    console.log('✅ Minecraft World Avancé initialisé')

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)

      if (mountRef.current) {
        mountRef.current.removeEventListener('click', onCanvasClick)
        if (renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement)
        }
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: '#000',
        cursor: isPointerLocked ? 'none' : 'default'
      }}
    >
      {/* Crosshair */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '6px',
        height: '6px',
        backgroundColor: 'white',
        border: '1px solid black',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: isPointerLocked ? 1 : 0.5
      }} />

      {/* Instructions complètes */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'white',
        fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.9)',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '480px',
        fontSize: '14px',
        lineHeight: '1.5',
        border: '2px solid #4CAF50'
      }}>
        <div style={{ fontSize: '22px', marginBottom: '15px', color: '#4CAF50' }}>🎮 MINECRAFT VOXEL WORLD</div>

        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#FFD700' }}>🌍 MONDE:</strong> Terrain procédural 64x64 avec collines, arbres et textures Minecraft
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#FFD700' }}>🎯 CONTRÔLES FPS:</strong><br/>
          • Clic pour activer le mode FPS<br/>
          • Souris pour regarder autour<br/>
          • WASD pour se déplacer<br/>
          • Shift pour sprinter<br/>
          • Espace pour sauter (gravité !)<br/>
          • Échap pour quitter FPS
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#FFD700' }}>🔨 BLOCS:</strong><br/>
          • Clic gauche: Casser<br/>
          • Clic droit: Placer<br/>
          • 1/2/3: Changer de bloc<br/>
          • Bloc sélectionné: <span style={{ color: '#FF5722' }}>{playerRef.current.selectedBlock.toUpperCase()}</span>
        </div>

        <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(76, 175, 80, 0.2)', borderRadius: '5px' }}>
          <strong>✅ Fonctionnalités:</strong> Génération procédurale, physique réaliste, textures pixel art, interactions complètes
        </div>
      </div>

      {/* Infos de debug */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        color: 'white',
        fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.9)',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '13px',
        minWidth: '200px'
      }}>
        <div style={{ color: '#4CAF50', marginBottom: '8px' }}>📊 STATISTIQUES</div>
        <div>Mode: {isPointerLocked ? '🎯 FPS ACTIF' : '👁️ LIBRE'}</div>
        <div>Monde: {worldGenerated ? '✅ Généré' : '⏳ Chargement...'}</div>
        <div>Blocs: {worldRef.current.size.toLocaleString()}</div>
        <div>Position:</div>
        <div style={{ fontSize: '11px', marginLeft: '10px' }}>
          X: {playerRef.current.position.x.toFixed(1)}<br/>
          Y: {playerRef.current.position.y.toFixed(1)}<br/>
          Z: {playerRef.current.position.z.toFixed(1)}
        </div>
        <div>Sol: {playerRef.current.onGround ? '✅' : '❌'}</div>
      </div>

      {/* Indicateur de chargement */}
      {!worldGenerated && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '24px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.9)',
          padding: '30px',
          borderRadius: '15px',
          border: '3px solid #4CAF50'
        }}>
          <div>🏗️ Génération du monde Minecraft...</div>
          <div style={{ fontSize: '16px', marginTop: '10px', color: '#FFD700' }}>
            Création du terrain procédural avec textures
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  console.log('🚀 App démarrée - Minecraft Complet')

  return <MinecraftWorld />
}

export default App