import * as PusherRaw from 'pusher-js/react-native';
const getPusher = () => {
  if (typeof PusherRaw === 'function') return PusherRaw;
  if (PusherRaw && typeof PusherRaw.default === 'function') return PusherRaw.default;
  if (PusherRaw && typeof PusherRaw.Pusher === 'function') return PusherRaw.Pusher;
  if (typeof PusherRaw === 'object') {
    for (const key in PusherRaw) if (typeof PusherRaw[key] === 'function') return PusherRaw[key];
  }
  return null;
};
const Pusher = getPusher();
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

let pusherInstance = null;

export const initWebSocket = async () => {
  if (pusherInstance) return pusherInstance;
  const token = await AsyncStorage.getItem('driver_auth_token');
  if (!token) return null;

  pusherInstance = new Pusher(CONFIG.REVERB_KEY, {
    cluster: 'mt1',
    wsHost: CONFIG.REVERB_HOST,
    wsPort: CONFIG.REVERB_PORT,
    wssPort: CONFIG.REVERB_PORT,
    forceTLS: CONFIG.REVERB_SCHEME === 'https',
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${CONFIG.API_BASE_URL}/broadcasting/auth`,
    auth: { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
  });

  pusherInstance.connection.bind('connected', () => console.log('[WS] Driver connected'));
  pusherInstance.connection.bind('error', (err) => console.warn('[WS] Error:', err));
  return pusherInstance;
};

/** Subscribe to driver channel for ride requests */
export const subscribeToDriver = (driverId, onRequest) => {
  if (!pusherInstance) return null;
  const channel = pusherInstance.subscribe(`private-driver.${driverId}`);
  channel.bind('DriverRequestReceived', (data) => {
    console.log('[WS] New ride request:', data);
    onRequest(data);
  });
  return channel;
};

/** Subscribe to booking channel for ride updates */
export const subscribeToBooking = (bookingId, onUpdate) => {
  if (!pusherInstance) return null;
  const channel = pusherInstance.subscribe(`private-booking.${bookingId}`);
  channel.bind('BookingUpdated', onUpdate);
  return channel;
};

export const unsubscribe = (channelName) => {
  if (pusherInstance) pusherInstance.unsubscribe(channelName);
};

export const disconnectWebSocket = () => {
  if (pusherInstance) { pusherInstance.disconnect(); pusherInstance = null; }
};
