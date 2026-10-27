import './style.css'
import { GameSelector } from './games/game-selector';
import { GameLoader } from './engine';

window.addEventListener('load', async () => {

  await GameLoader.loadAll();
  new GameSelector();
});
