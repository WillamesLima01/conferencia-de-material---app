import api from './api';

const montarQueryString = (filtros = {}) => {
  const parametros = new URLSearchParams();

  Object.entries(filtros).forEach(
    ([chave, valor]) => {
      if (
        valor !== null &&
        valor !== undefined &&
        String(valor).trim() !== ''
      ) {
        parametros.append(
          chave,
          String(valor).trim()
        );
      }
    }
  );

  const queryString = parametros.toString();

  return queryString
    ? `?${queryString}`
    : '';
};

export const cadastrarEntradaFenoRacao = async (
  dados
) => {
  return api(
    '/feno-racao/estoque/entradas',
    {
      method: 'POST',
      body: JSON.stringify(dados),
    }
  );
};

export const listarEstoqueFenoRacao = async (
  filtros = {}
) => {
  return api(
    `/feno-racao/estoque${montarQueryString(
      filtros
    )}`
  );
};

export const listarMovimentacoesFenoRacao = async (
  filtros = {}
) => {
  return api(
    `/feno-racao/movimentacoes${montarQueryString(
      filtros
    )}`
  );
};

export const cancelarEntradaFenoRacao = async (
  loteId,
  motivo
) => {
  const idNormalizado = Number(loteId);

  const motivoNormalizado = String(
    motivo ?? ''
  ).trim();

  if (
    !Number.isInteger(idNormalizado) ||
    idNormalizado <= 0
  ) {
    throw new Error(
      'O lote informado para cancelamento é inválido.'
    );
  }

  if (!motivoNormalizado) {
    throw new Error(
      'O motivo do cancelamento é obrigatório.'
    );
  }

  const parametros = new URLSearchParams({
    motivo: motivoNormalizado,
  });

  return api(
    `/feno-racao/estoque/entradas/${idNormalizado}/cancelar?${parametros.toString()}`,
    {
      method: 'PATCH',
    }
  );
};