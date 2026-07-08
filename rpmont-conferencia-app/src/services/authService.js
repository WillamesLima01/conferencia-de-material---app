import api from './api';

export const login = async (matricula, senha) => {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      matricula,
      senha,
    }),
  });
};