import { Color, MathUtils, Vector3 } from 'three';
import { Renderer } from '../render/Renderer';

export class DayNightCycle {
  private readonly renderer: Renderer;
  private time = 45;
  private readonly dayDurationSeconds = 900;
  private readonly sunVector = new Vector3();
  private readonly dayColor = new Color('#88c6ff');
  private readonly duskColor = new Color('#ffb07c');
  private readonly nightColor = new Color('#0e1832');
  private readonly skyMix = new Color();
  private daylight = 1;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  update(deltaSeconds: number): void {
    this.time += deltaSeconds;
    const t = (this.time % this.dayDurationSeconds) / this.dayDurationSeconds;
    const sunAngle = t * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);

    this.sunVector.set(Math.cos(sunAngle) * 90, 45 + sunHeight * 70, Math.sin(sunAngle) * 90);
    this.renderer.setSunPosition(this.sunVector);

    const daylight = MathUtils.clamp((sunHeight + 0.12) * 1.15, 0, 1);
    this.daylight = daylight;
    const duskFactor = 1 - Math.abs(sunHeight * 1.6);
    const duskWeight = MathUtils.clamp(duskFactor, 0, 1) * 0.65;

    this.renderer.sunLight.intensity = 0.08 + daylight * 1.3;
    this.renderer.hemiLight.intensity = 0.14 + daylight * 0.5;
    this.renderer.ambientLight.intensity = 0.08 + daylight * 0.26;

    this.skyMix.copy(this.nightColor).lerp(this.dayColor, daylight);
    this.skyMix.lerp(this.duskColor, duskWeight * (1 - daylight * 0.45));
    this.renderer.setSkyAndFog(this.skyMix);
  }

  getDaylight(): number {
    return this.daylight;
  }

  getTimeRatio(): number {
    return (this.time % this.dayDurationSeconds) / this.dayDurationSeconds;
  }

  getPhase(): 'day' | 'dusk' | 'night' {
    if (this.daylight > 0.42) {
      return 'day';
    }
    if (this.daylight > 0.18) {
      return 'dusk';
    }
    return 'night';
  }
}
