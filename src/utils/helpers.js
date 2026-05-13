export function formatCurrency(amount) {
  return `₹${parseFloat(amount || 0).toFixed(0)}`;
}
export function formatDistance(km) {
  if (!km) return '--';
  return km < 1 ? `${Math.round(km * 1000)}m` : `${parseFloat(km).toFixed(1)} km`;
}
export function formatDuration(min) {
  if (!min) return '--';
  return min < 60 ? `${Math.round(min)} min` : `${Math.floor(min / 60)}h ${Math.round(min % 60)}m`;
}

export function decodePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}
