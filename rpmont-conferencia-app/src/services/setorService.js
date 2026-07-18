import api from './api';

const BASE_URL = '/setores';

export const listarSetores = async () => {
  return api(BASE_URL, {
    method: 'GET',
  });
};

export const listarSetoresAtivos = async () => {
  return api(`${BASE_URL}/ativos`, {
    method: 'GET',
  });
};

export const listarSetoresPorUnidade = async (unidadeId) => {
  return api(`${BASE_URL}/unidade/${unidadeId}`, {
    method: 'GET',
  });
};

export const listarSetoresAtivosPorUnidade = async (unidadeId) => {
  return api(`${BASE_URL}/unidade/${unidadeId}/ativos`, {
    method: 'GET',
  });
};

export const buscarSetorPorId = async (id) => {
  return api(`${BASE_URL}/${id}`, {
    method: 'GET',
  });
};

export const cadastrarSetor = async (dados) => {
  return api(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
};

export const atualizarSetor = async (id, dados) => {
  return api(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
};

export const inativarSetor = async (id) => {
  return api(`${BASE_URL}/${id}/inativar`, {
    method: 'PATCH',
  });
};

export const reativarSetor = async (id) => {
  return api(`${BASE_URL}/${id}/reativar`, {
    method: 'PATCH',
  });
};