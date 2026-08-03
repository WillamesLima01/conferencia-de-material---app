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

export const listarProdutosFenoRacao = async (
  filtros = {}
) => {
  return api(
    `/feno-racao/produtos${montarQueryString(
      filtros
    )}`
  );
};

export const buscarProdutoFenoRacaoPorId = async (
  produtoId
) => {
  const id = Number(produtoId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      'O ID do produto deve ser maior que zero.'
    );
  }

  return api(
    `/feno-racao/produtos/${id}`
  );
};