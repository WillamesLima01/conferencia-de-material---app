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

export const registrarSaidaFenoRacao = async (
  dados
) => {
  return api(
    '/feno-racao/movimentacoes/saidas',
    {
      method: 'POST',
      body: JSON.stringify(dados),
    }
  );
};

export const registrarExtravioFenoRacao = async (
  dados
) => {
  return api(
    '/feno-racao/movimentacoes/extravios',
    {
      method: 'POST',
      body: JSON.stringify(dados),
    }
  );
};

/*
 * ==========================================
 * ANÁLISE ADMINISTRATIVA DE EXTRAVIO
 * ==========================================
 */

export const confirmarExtravioFenoRacao = async (
  movimentacaoId
) => {
  const idNormalizado = Number(
    movimentacaoId
  );

  if (
    !Number.isInteger(idNormalizado) ||
    idNormalizado <= 0
  ) {
    throw new Error(
      'O extravio informado para confirmação é inválido.'
    );
  }

  return api(
    `/feno-racao/movimentacoes/${idNormalizado}/extravio/confirmar`,
    {
      method: 'PATCH',
    }
  );
};

export const ajustarExtravioFenoRacao = async (
  movimentacaoId,
  dados
) => {
  const idNormalizado = Number(
    movimentacaoId
  );

  if (
    !Number.isInteger(idNormalizado) ||
    idNormalizado <= 0
  ) {
    throw new Error(
      'O extravio informado para ajuste é inválido.'
    );
  }

  const quantidadeConfirmada = Number(
    dados?.quantidadeConfirmada
  );

  const motivo = String(
    dados?.motivo ?? ''
  ).trim();

  if (
    !Number.isInteger(quantidadeConfirmada) ||
    quantidadeConfirmada <= 0
  ) {
    throw new Error(
      'A quantidade confirmada deve ser um número inteiro maior que zero.'
    );
  }

  if (!motivo) {
    throw new Error(
      'O motivo do ajuste é obrigatório.'
    );
  }

  return api(
    `/feno-racao/movimentacoes/${idNormalizado}/extravio/ajustar`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        quantidadeConfirmada,
        motivo,
      }),
    }
  );
};

export const cancelarExtravioFenoRacao = async (
  movimentacaoId,
  dados
) => {
  const idNormalizado = Number(
    movimentacaoId
  );

  if (
    !Number.isInteger(idNormalizado) ||
    idNormalizado <= 0
  ) {
    throw new Error(
      'O extravio informado para cancelamento é inválido.'
    );
  }

  const motivo = String(
    dados?.motivo ?? ''
  ).trim();

  if (!motivo) {
    throw new Error(
      'O motivo do cancelamento é obrigatório.'
    );
  }

  return api(
    `/feno-racao/movimentacoes/${idNormalizado}/extravio/cancelar`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        motivo,
      }),
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
  const idNormalizado = Number(
    loteId
  );

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