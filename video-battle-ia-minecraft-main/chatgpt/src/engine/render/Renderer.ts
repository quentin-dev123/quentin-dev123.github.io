import {
  ACESFilmicToneMapping,
  AmbientLight,
  Clock,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';

export class Renderer {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly renderer: WebGLRenderer;
  readonly sunLight: DirectionalLight;
  readonly hemiLight: HemisphereLight;
  readonly ambientLight: AmbientLight;
  readonly cameraLight: PointLight;
  readonly clock: Clock;

  constructor(container: HTMLElement) {
    this.scene = new Scene();
    this.scene.background = new Color('#8ac8ff');
    this.scene.fog = new Fog('#8ac8ff', 32, 180);

    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(8, 32, 8);
    this.scene.add(this.camera);

    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setClearColor('#8ac8ff');
    container.appendChild(this.renderer.domElement);

    this.hemiLight = new HemisphereLight('#9ed5ff', '#335544', 0.62);
    this.scene.add(this.hemiLight);

    this.ambientLight = new AmbientLight('#9ab7c8', 0.32);
    this.scene.add(this.ambientLight);

    this.sunLight = new DirectionalLight('#fff6cf', 1.55);
    this.sunLight.position.set(40, 90, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.camera.left = -90;
    this.sunLight.shadow.camera.right = 90;
    this.sunLight.shadow.camera.top = 90;
    this.sunLight.shadow.camera.bottom = -90;
    this.sunLight.shadow.bias = -0.00015;
    this.scene.add(this.sunLight);

    this.cameraLight = new PointLight('#fff3dd', 0.22, 16, 2);
    this.cameraLight.position.set(0, 0, 0);
    this.camera.add(this.cameraLight);

    this.clock = new Clock();
    this.bindResize();
  }

  renderFrame(): void {
    this.renderer.render(this.scene, this.camera);
  }

  setSkyAndFog(color: Color): void {
    this.scene.background = color;
    if (this.scene.fog) {
      this.scene.fog.color.copy(color);
    }
  }

  setSunPosition(pos: Vector3): void {
    this.sunLight.position.copy(pos);
  }

  setFov(fov: number): void {
    this.camera.fov = Math.max(50, Math.min(120, fov));
    this.camera.updateProjectionMatrix();
  }

  private bindResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
}
