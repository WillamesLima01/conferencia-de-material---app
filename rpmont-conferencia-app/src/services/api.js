const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  if (response.status !== 204) {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    }
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message:
        data?.message ||
        'Não foi possível concluir a operação.',
      data,
    };
  }

  return data;
};

export default api;