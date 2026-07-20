import api from '../utils/api';

export const healthService = {
  // Cek status server dan database
  checkStatus: async () => {
    const response = await api.get('/api/health');
    return response.data;
  }
};
