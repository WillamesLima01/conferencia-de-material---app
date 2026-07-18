import api from './api';

const BASE_URL = '/unidades';

export const listarUnidades = async () => {
  return api(BASE_URL, {
    method: 'GET',
  });
};

export const listarUnidadesAtivas = async () => {
  return api(`${BASE_URL}/ativas`, {
    method: 'GET',
  });
};

export const cadastrarUnidade = async (dados) => {
  return api(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
};

export const atualizarUnidade = async (id, dados) => {
  return api(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
};

export const inativarUnidade = async (id) => {
  return api(`${BASE_URL}/${id}/inativar`, {
    method: 'PATCH',
  });
};

export const reativarUnidade = async (id) => {
  return api(`${BASE_URL}/${id}/reativar`, {
    method: 'PATCH',
  });
};