import api from './api';

export const listarUsuarios = async () => {
  return api('/usuario', {
    method: 'GET',
  });
};

export const cadastrarUsuario = async (usuario) => {
  return api('/usuario', {
    method: 'POST',
    body: JSON.stringify(usuario),
  });
};

export const atualizarUsuario = async (id, usuario) => {
  return api(`/usuario/${id}`, {
    method: 'PUT',
    body: JSON.stringify(usuario),
  });
};

export const alterarStatusUsuario = async (
  id,
  statusAcesso
) => {
  return api(`/usuario/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      statusAcesso,
    }),
  });
};

export const alterarNivelUsuario = async (
  id,
  nivel
) => {
  return api(`/usuario/${id}/nivel`, {
    method: 'PATCH',
    body: JSON.stringify({
      nivel: Number(nivel),
    }),
  });
};

export const excluirUsuario = async (id) => {
  return api(`/usuario/${id}`, {
    method: 'DELETE',
  });
};

export const solicitarAcesso = async (usuario) => {
  return api('/usuario/solicitar-acesso', {
    method: 'POST',
    body: JSON.stringify(usuario),
  });
};