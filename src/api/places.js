import api from './client';

export const placesAPI = {
  directions: (fromLat, fromLng, toLat, toLng) =>
    api.get('/places/directions', { params: { origin_lat: fromLat, origin_lng: fromLng, destination_lat: toLat, destination_lng: toLng } }),
};
