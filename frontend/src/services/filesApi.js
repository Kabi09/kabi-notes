import api from './api';

export const uploadFile = async (formData, onUploadProgress) => {
  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const deleteAttachment = async (noteId, attachmentId) => {
  const response = await api.delete(`/files/${noteId}/${attachmentId}`);
  return response.data;
};

export const fetchFileBlob = async (fileUrl, fileName) => {
  const response = await api.get('/files/preview-stream', {
    params: { url: fileUrl, name: fileName },
    responseType: 'blob',
  });
  return response.data;
};

export const downloadFileBlob = async (fileUrl, fileName) => {
  const response = await api.get('/files/download-stream', {
    params: { url: fileUrl, name: fileName },
    responseType: 'blob',
  });
  const blob = new Blob([response.data]);
  const linkUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = linkUrl;
  a.download = fileName || 'file';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(linkUrl);
};

