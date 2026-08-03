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

const validarId = (id, nome) => {
  const valor = Number(id);

  if (
    !Number.isInteger(valor) ||
    valor <= 0
  ) {
    throw new Error(
      `O ID ${nome} deve ser maior que zero.`
    );
  }

  return valor;
};

// ======================================================
// RESUMO DE ESTOQUE PARA TRANSFERÊNCIA
// ======================================================

export const consultarResumoEstoqueTransferencia =
  async (unidade) => {
    const unidadeNormalizada = String(
      unidade ?? ''
    ).trim();

    if (!unidadeNormalizada) {
      throw new Error(
        'A unidade de origem é obrigatória.'
      );
    }

    return api(
      `/feno-racao/estoque/resumo-transferencia${montarQueryString({
        unidade: unidadeNormalizada,
      })}`
    );
  };

// ======================================================
// TRANSFERÊNCIAS CONCLUÍDAS
// ======================================================

export const listarTransferencias = async (
  filtros = {}
) => {
  return api(
    `/feno-racao/transferencias${montarQueryString(
      filtros
    )}`
  );
};

export const listarTransferenciasEnviadas = async (
  filtros = {}
) => {
  return api(
    `/feno-racao/transferencias/enviadas${montarQueryString(
      filtros
    )}`
  );
};

export const listarTransferenciasRecebidas = async (
  filtros = {}
) => {
  return api(
    `/feno-racao/transferencias/recebidas${montarQueryString(
      filtros
    )}`
  );
};

export const buscarTransferenciaPorId = async (
  transferenciaId
) => {
  const id = validarId(
    transferenciaId,
    'da transferência'
  );

  return api(
    `/feno-racao/transferencias/${id}`
  );
};

// ======================================================
// NOTIFICAÇÕES
// ======================================================

export const listarNotificacoesFenoRacao =
  async () => {
    return api(
      '/feno-racao/notificacoes'
    );
  };

export const listarNotificacoesNaoLidas =
  async () => {
    return api(
      '/feno-racao/notificacoes/nao-lidas'
    );
  };

export const contarNotificacoesNaoLidas =
  async () => {
    return api(
      '/feno-racao/notificacoes/nao-lidas/quantidade'
    );
  };

export const marcarNotificacaoComoLida = async (
  notificacaoId
) => {
  const id = validarId(
    notificacaoId,
    'da notificação'
  );

  return api(
    `/feno-racao/notificacoes/${id}/marcar-lida`,
    {
      method: 'PATCH',
    }
  );
};

// ======================================================
// SOLICITAÇÕES DE TRANSFERÊNCIA
// ======================================================

export const criarSolicitacaoTransferencia = async (
  dados
) => {
  if (
    !dados ||
    typeof dados !== 'object'
  ) {
    throw new Error(
      'Os dados da solicitação são obrigatórios.'
    );
  }

  const produtoId = Number(
    dados.produtoId
  );

  const unidadeOrigem = String(
    dados.unidadeOrigem ?? ''
  ).trim();

  const quantidadeSolicitada = Number(
    dados.quantidadeSolicitada
  );

  const justificativa = String(
    dados.justificativa ?? ''
  ).trim();

  if (
    !Number.isInteger(produtoId) ||
    produtoId <= 0
  ) {
    throw new Error(
      'Selecione um produto válido.'
    );
  }

  if (!unidadeOrigem) {
    throw new Error(
      'A unidade de origem é obrigatória.'
    );
  }

  if (
    !Number.isInteger(
      quantidadeSolicitada
    ) ||
    quantidadeSolicitada <= 0
  ) {
    throw new Error(
      'A quantidade solicitada deve ser um número inteiro maior que zero.'
    );
  }

  if (!justificativa) {
    throw new Error(
      'A justificativa é obrigatória.'
    );
  }

  if (justificativa.length > 500) {
    throw new Error(
      'A justificativa deve possuir no máximo 500 caracteres.'
    );
  }

  return api(
    '/feno-racao/transferencias/solicitacoes',
    {
      method: 'POST',
      body: JSON.stringify({
        produtoId,
        unidadeOrigem,
        quantidadeSolicitada,
        justificativa,
      }),
    }
  );
};

export const buscarSolicitacaoTransferenciaPorId =
  async (solicitacaoId) => {
    const id = validarId(
      solicitacaoId,
      'da solicitação'
    );

    return api(
      `/feno-racao/transferencias/solicitacoes/${id}`
    );
  };

export const listarSolicitacoesRecebidas = async (
  status = ''
) => {
  const query = montarQueryString({
    status,
  });

  return api(
    `/feno-racao/transferencias/solicitacoes/recebidas${query}`
  );
};

export const listarSolicitacoesEnviadas =
  async () => {
    return api(
      '/feno-racao/transferencias/solicitacoes/enviadas'
    );
  };

export const negarSolicitacaoTransferencia = async (
  solicitacaoId,
  observacaoResposta
) => {
  const id = validarId(
    solicitacaoId,
    'da solicitação'
  );

  const observacao = String(
    observacaoResposta ?? ''
  ).trim();

  if (!observacao) {
    throw new Error(
      'Informe o motivo da negativa.'
    );
  }

  if (observacao.length > 500) {
    throw new Error(
      'O motivo da negativa deve possuir no máximo 500 caracteres.'
    );
  }

  const parametros = new URLSearchParams({
    observacaoResposta: observacao,
  });

  return api(
    `/feno-racao/transferencias/solicitacoes/${id}/negar?${parametros.toString()}`,
    {
      method: 'PATCH',
    }
  );
};

export const aprovarSolicitacaoTransferencia = async (
  solicitacaoId,
  observacao = ''
) => {
  const id = validarId(
    solicitacaoId,
    'da solicitação'
  );

  const observacaoNormalizada = String(
    observacao ?? ''
  ).trim();

  if (
    observacaoNormalizada.length > 500
  ) {
    throw new Error(
      'A observação deve possuir no máximo 500 caracteres.'
    );
  }

  return api(
    `/feno-racao/transferencias/solicitacoes/${id}/aprovar`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        observacao:
          observacaoNormalizada || null,
      }),
    }
  );
};