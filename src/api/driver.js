import api from './client';

export const authAPI = {
  loginEmail: (email) => api.post('/auth/captain/login-email', { email }),
  loginPassword: (data) => api.post('/auth/captain/login-password', data),
  verifyOtp: (data) => api.post('/auth/captain/verify-otp', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const driverAPI = {
  getStatus: () => api.get('/driver/status'),
  toggleOnline: () => api.post('/driver/toggle-online'),
  updateLocation: (lat, lng, heading = 0) => api.post('/driver/location', { lat, lng, heading }),
  rideAction: (action, booking_id, extra) => api.post('/driver/ride-action', { action, booking_id, ...extra }),
  getEarnings: () => api.get('/driver/earnings'),
  getRideHistory: (page = 1) => api.get('/driver/ride-history', { params: { page } }),
  getProfile: () => api.get('/driver/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  // Chat
  getMessages: (bookingId) => api.get(`/rides/${bookingId}/chat`),
  sendMessage: (bookingId, message) => api.post(`/rides/${bookingId}/chat`, { message }),
};
