import { create } from 'zustand';

const useDriverStore = create((set) => ({
  driverStatus: 'offline',  // online, offline, busy
  walletBalance: 0,
  currentBooking: null,
  rideRequest: null,        // incoming ride request popup data
  requestTimeout: 20,
  currentLocation: null,

  setDriverStatus: (status) => set({ driverStatus: status }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  setRideRequest: (request) => set({ rideRequest: request }),
  setRequestTimeout: (timeout) => set({ requestTimeout: timeout }),
  setCurrentLocation: (location) => set({ currentLocation: location }),

  clearBooking: () => set({ currentBooking: null, rideRequest: null }),
}));

export default useDriverStore;
