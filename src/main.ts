import './style.css'
import { GameSelector } from './games';
import { GameLoader } from './engine';

window.addEventListener('load', async () => {

  await GameLoader.loadAll();
  new GameSelector();
});
