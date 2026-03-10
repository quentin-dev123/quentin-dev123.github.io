import './style.css';
import { Engine } from './engine/core/Engine';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Element #app introuvable');
}

app.innerHTML = `
  <div id="game-root">
    <div id="hud-root" class="hud-root">
      <div id="crosshair" class="crosshair"></div>
      <div id="damage-flash" class="damage-flash"></div>
      <div id="status-bars" class="status-bars"></div>
      <div id="hotbar" class="hotbar"></div>
      <div id="interaction-hint" class="interaction-hint hidden"></div>
      <div id="hud-notifications" class="hud-notifications"></div>
    </div>
    <div id="inventory-overlay" class="overlay hidden"></div>
    <div id="pause-overlay" class="overlay hidden"></div>
    <div id="options-overlay" class="overlay hidden"></div>
    <div id="dialogue-overlay" class="overlay hidden"></div>
    <div id="trading-overlay" class="overlay hidden"></div>
  </div>
`;

const gameRoot = document.querySelector<HTMLElement>('#game-root');
if (!gameRoot) {
  throw new Error('Container de jeu introuvable');
}

const engine = new Engine(gameRoot);
engine.start();
