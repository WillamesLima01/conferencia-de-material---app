import api from './api';

const montarQueryString = (filtros = {}) => {
  const parametros = new URLSearchParams();

  Object.entries(filtros).forEach(([chave, valor]) => {
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
  });

  const queryString = parametros.toString();

  return queryString
    ? `?${queryString}`
    : '';
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
  if (
    transferenciaId === null ||
    transferenciaId === undefined ||
    Number(transferenciaId) <= 0
  ) {
    throw new Error(
      'O ID da transferência deve ser maior que zero.'
    );
  }

  return api(
    `/feno-racao/transferencias/${transferenciaId}`
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
  if (
    notificacaoId === null ||
    notificacaoId === undefined ||
    Number(notificacaoId) <= 0
  ) {
    throw new Error(
      'O ID da notificação deve ser maior que zero.'
    );
  }

  return api(
    `/feno-racao/notificacoes/${notificacaoId}/marcar-lida`,
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

  return api(
    '/feno-racao/transferencias/solicitacoes',
    {
      method: 'POST',
      body: JSON.stringify(dados),
    }
  );
};

export const buscarSolicitacaoTransferenciaPorId =
  async (solicitacaoId) => {
    if (
      solicitacaoId === null ||
      solicitacaoId === undefined ||
      Number(solicitacaoId) <= 0
    ) {
      throw new Error(
        'O ID da solicitação deve ser maior que zero.'
      );
    }

    return api(
      `/feno-racao/transferencias/solicitacoes/${solicitacaoId}`
    );
  };

export const listarSolicitacoesRecebidas = async (
  status = ''
) => {
  const parametros = new URLSearchParams();

  if (
    String(status || '').trim()
  ) {
    parametros.append(
      'status',
      String(status).trim()
    );
  }

  const queryString = parametros.toString();

  return api(
    `/feno-racao/transferencias/solicitacoes/recebidas${
      queryString
        ? `?${queryString}`
        : ''
    }`
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
  if (
    solicitacaoId === null ||
    solicitacaoId === undefined ||
    Number(solicitacaoId) <= 0
  ) {
    throw new Error(
      'O ID da solicitação deve ser maior que zero.'
    );
  }

  const observacao = String(
    observacaoResposta ?? ''
  ).trim();

  if (!observacao) {
    throw new Error(
      'Informe o motivo da negativa.'
    );
  }

  const parametros = new URLSearchParams({
    observacaoResposta: observacao,
  });

  return api(
    `/feno-racao/transferencias/solicitacoes/${solicitacaoId}/negar?${parametros.toString()}`,
    {
      method: 'PATCH',
    }
  );
};

export const aprovarSolicitacaoTransferencia = async (
  solicitacaoId,
  dados
) => {
  if (
    solicitacaoId === null ||
    solicitacaoId === undefined ||
    Number(solicitacaoId) <= 0
  ) {
    throw new Error(
      'O ID da solicitação deve ser maior que zero.'
    );
  }

  if (
    !dados ||
    typeof dados !== 'object'
  ) {
    throw new Error(
      'Os dados da aprovação são obrigatórios.'
    );
  }

  return api(
    `/feno-racao/transferencias/solicitacoes/${solicitacaoId}/aprovar`,
    {
      method: 'PATCH',
      body: JSON.stringify(dados),
    }
  );
};