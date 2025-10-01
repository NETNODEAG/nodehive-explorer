import { create } from 'zustand';

const useConnectionStore = create((set) => ({
  config: {
    baseUrl: 'https://demo.nodehive.app',
    language: '',
    timeout: 30000,
    debug: true,
    retryEnabled: true,
    retryAttempts: 3,
    authToken: '',
    useAuth: false,
    username: '',
    password: ''
  },
  setConfig: (config) => set({ config }),
  updateConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),
}));

export default useConnectionStore;