import './style.css'
import { GameSelector } from './games';
import { SceneManager } from './engine';

window.addEventListener('load', async () => {

  SceneManager.register('menu', () => new GameSelector());
  await SceneManager.goTo('menu');
});
