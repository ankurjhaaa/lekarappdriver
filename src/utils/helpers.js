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
