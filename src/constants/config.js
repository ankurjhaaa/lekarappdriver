/**
 * Driver App Configuration
 * HOST = your computer's LAN IP (same Wi-Fi network required)
 */
const HOST = '192.168.29.128';

export const CONFIG = {
  API_BASE_URL: `http://${HOST}:8000/api/v1`,
  REVERB_KEY: 'gadiwala-key',
  REVERB_HOST: HOST,
  REVERB_PORT: 6001,
  REVERB_SCHEME: 'http',
  GOOGLE_MAPS_API_KEY: 'AIzaSyAUTN27SDgS8mbpMMF4IgQ55UL81Vokx3Q',
  APP_NAME: 'Lekar Driver',
  APP_VERSION: '1.0.0',
  LOCATION_UPDATE_INTERVAL: 8000,
};
