import api from './api';

export const signupUser = async (data) => {
  const response = await api.post('/auth/signup', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getMeUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const forgotPasswordUser = async (data) => {
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
};

export const resetPasswordUser = async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};
