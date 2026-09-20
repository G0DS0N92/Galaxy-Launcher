import { GalaxyAPI } from '../../preload/index';

declare global {
  interface Window {
    galaxy: GalaxyAPI;
  }
}
