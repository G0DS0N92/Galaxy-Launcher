import { GalaxyAPI } from '../../preload/types';

declare global {
  interface Window {
    galaxy: GalaxyAPI;
  }
}
