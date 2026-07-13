import api from './api';


/*
 * =========================================
 * LOGIN
 * =========================================
 */

export const login = async (
  matricula,
  senha
) => {
  return api('/auth/login', {
    method: 'POST',

    body: JSON.stringify({
      matricula,
      senha,
    }),
  });
};


/*
 * =========================================
 * SOLICITAR RECUPERAÇÃO DE SENHA
 * =========================================
 */

export const solicitarRecuperacaoSenha = async (
  email
) => {
  return api(
    '/auth/recuperar-senha/solicitar',
    {
      method: 'POST',

      body: JSON.stringify({
        email,
      }),
    }
  );
};


/*
 * =========================================
 * VALIDAR CÓDIGO DE RECUPERAÇÃO
 * =========================================
 */

export const validarCodigoRecuperacao = async (
  email,
  codigo
) => {
  return api(
    '/auth/recuperar-senha/validar',
    {
      method: 'POST',

      body: JSON.stringify({
        email,
        codigo,
      }),
    }
  );
};


/*
 * =========================================
 * REDEFINIR SENHA
 * =========================================
 */

export const redefinirSenha = async ({
  email,
  codigo,
  novaSenha,
  confirmarSenha,
}) => {
  return api(
    '/auth/recuperar-senha/redefinir',
    {
      method: 'POST',

      body: JSON.stringify({
        email,
        codigo,
        novaSenha,
        confirmarSenha,
      }),
    }
  );
};