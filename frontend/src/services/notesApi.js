import api from './api';

export const fetchNotes = async (params = {}) => {
  const response = await api.get('/notes', { params });
  return response.data;
};

export const fetchNoteById = async (id) => {
  const response = await api.get(`/notes/${id}`);
  return response.data;
};

export const createNote = async (data) => {
  const response = await api.post('/notes', data);
  return response.data;
};

export const updateNote = async (id, data) => {
  const response = await api.patch(`/notes/${id}`, data);
  return response.data;
};

export const togglePinNote = async (id) => {
  const response = await api.patch(`/notes/${id}/pin`);
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}`);
  return response.data;
};
