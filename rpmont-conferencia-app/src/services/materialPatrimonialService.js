import api from './api';

const BASE_URL = '/material-patrimonial';
const MOVIMENTACAO_BASE_URL =
  '/movimentacao-material';

export async function listarMateriais() {
  return api(BASE_URL, {
    method: 'GET',
  });
}

export async function buscarMaterialPorId(id) {
  validarIdMaterial(id);

  return api(`${BASE_URL}/${id}`, {
    method: 'GET',
  });
}

export async function buscarMaterialPorNumeroSerie(
  numeroSerie
) {
  const numeroSerieTratado = String(
    numeroSerie ?? ''
  ).trim();

  if (!numeroSerieTratado) {
    throw new Error(
      'O número de série é obrigatório.'
    );
  }

  return api(
    `${BASE_URL}/numero-serie/${encodeURIComponent(
      numeroSerieTratado
    )}`,
    {
      method: 'GET',
    }
  );
}

export async function cadastrarMaterial(dados) {
  const payload = montarPayloadMaterial(dados);

  return api(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function atualizarMaterial(
  id,
  dados
) {
  validarIdMaterial(id);

  const payload = montarPayloadMaterial(dados);

  return api(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function conferirMaterial(id) {
  validarIdMaterial(id);

  return api(`${BASE_URL}/${id}/conferir`, {
    method: 'PATCH',
  });
}

export async function zerarConferencia(
  dados = {}
) {
  const senhaTratada = String(
    dados?.senha ?? ''
  ).trim();

  const tipoTratado = String(
    dados?.tipo ?? ''
  )
    .trim()
    .toUpperCase();

  const setorTratado = String(
    dados?.setor ?? ''
  ).trim();

  if (!senhaTratada) {
    throw new Error(
      'A senha do administrador é obrigatória.'
    );
  }

  if (
    tipoTratado !== 'TODOS' &&
    tipoTratado !== 'SETOR'
  ) {
    throw new Error(
      'O tipo de zeramento é inválido.'
    );
  }

  if (
    tipoTratado === 'SETOR' &&
    !setorTratado
  ) {
    throw new Error(
      'O setor é obrigatório para o zeramento por setor.'
    );
  }

  const payload = {
    senha: senhaTratada,
    tipo: tipoTratado,

    setor:
      tipoTratado === 'SETOR'
        ? setorTratado
        : null,
  };

  return api(
    `${BASE_URL}/zerar-conferencia`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function transferirEConferirMaterial(
  id,
  novoSetor,
  unidade
) {
  validarIdMaterial(id);

  const novoSetorTratado = String(
    novoSetor ?? ''
  ).trim();

  const unidadeTratada = String(
    unidade ?? ''
  ).trim();

  if (!novoSetorTratado) {
    throw new Error(
      'O novo setor é obrigatório.'
    );
  }

  if (!unidadeTratada) {
    throw new Error(
      'A unidade é obrigatória.'
    );
  }

  return api(
    `${BASE_URL}/${id}/transferir-e-conferir`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        novoSetor: novoSetorTratado,
        unidade: unidadeTratada,
      }),
    }
  );
}

export async function baixarMaterial(
  id,
  dados
) {
  validarIdMaterial(id);

  const payload = montarPayloadMovimentacao(
    dados,
    'O motivo da baixa é obrigatório.',
    'O número do documento da baixa é obrigatório.'
  );

  return api(`${BASE_URL}/${id}/baixar`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function descartarMaterial(
  id,
  dados
) {
  validarIdMaterial(id);

  const payload = montarPayloadMovimentacao(
    dados,
    'O motivo do descarte é obrigatório.',
    'O número do documento do descarte é obrigatório.'
  );

  return api(`${BASE_URL}/${id}/descartar`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function extraviarMaterial(
  id,
  dados
) {
  validarIdMaterial(id);

  const payload = montarPayloadMovimentacao(
    dados,
    'O motivo do extravio é obrigatório.',
    'O número do documento do extravio é obrigatório.'
  );

  return api(`${BASE_URL}/${id}/extraviar`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function registrarFurtoMaterial(
  id,
  dados
) {
  validarIdMaterial(id);

  const payload = montarPayloadMovimentacao(
    dados,
    'O motivo do registro de furto é obrigatório.',
    'O número do boletim de ocorrência é obrigatório.'
  );

  return api(
    `${BASE_URL}/${id}/registrar-furto`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function reativarMaterial(
  id,
  dados
) {
  validarIdMaterial(id);

  const payload = montarPayloadMovimentacao(
    dados,
    'O motivo da reativação é obrigatório.',
    'O número do documento da reativação é obrigatório.'
  );

  return api(`${BASE_URL}/${id}/reativar`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function inativarMaterial(id) {
  validarIdMaterial(id);

  return api(`${BASE_URL}/${id}/inativar`, {
    method: 'PATCH',
  });
}

export async function listarHistoricoMaterial(
  id
) {
  validarIdMaterial(id);

  return api(
    `${MOVIMENTACAO_BASE_URL}/material/${id}`,
    {
      method: 'GET',
    }
  );
}

export async function listarMovimentacoesMaterial(
  filtros = {}
) {
  validarPeriodoMovimentacao(
    filtros?.dataInicial,
    filtros?.dataFinal
  );

  const parametros = new URLSearchParams();

  adicionarParametro(
    parametros,
    'dataInicial',
    filtros?.dataInicial
  );

  adicionarParametro(
    parametros,
    'dataFinal',
    filtros?.dataFinal
  );

  adicionarParametro(
    parametros,
    'tipoMovimentacao',
    filtros?.tipoMovimentacao
  );

  adicionarParametro(
    parametros,
    'materialId',
    filtros?.materialId
  );

  adicionarParametro(
    parametros,
    'numeroSerie',
    filtros?.numeroSerie
  );

  adicionarParametro(
    parametros,
    'nome',
    filtros?.nome
  );

  adicionarParametro(
    parametros,
    'marca',
    filtros?.marca
  );

  adicionarParametro(
    parametros,
    'descricao',
    filtros?.descricao
  );

  adicionarParametro(
    parametros,
    'setor',
    filtros?.setor
  );

  adicionarParametro(
    parametros,
    'unidade',
    filtros?.unidade
  );

  adicionarParametro(
    parametros,
    'numeroDocumento',
    filtros?.numeroDocumento
  );

  adicionarParametro(
    parametros,
    'usuarioId',
    filtros?.usuarioId
  );

  adicionarParametro(
    parametros,
    'situacaoAnterior',
    filtros?.situacaoAnterior
  );

  adicionarParametro(
    parametros,
    'situacaoNova',
    filtros?.situacaoNova
  );

  const queryString = parametros.toString();

  const url = queryString
    ? `${MOVIMENTACAO_BASE_URL}?${queryString}`
    : MOVIMENTACAO_BASE_URL;

  return api(url, {
    method: 'GET',
  });
}

function montarPayloadMaterial(dados) {
  return {
    numeroSerie: String(
      dados?.numeroSerie ?? ''
    ).trim(),

    nome: normalizarCampoOpcional(
      dados?.nome
    ),

    marca: normalizarCampoOpcional(
      dados?.marca
    ),

    descricao: String(
      dados?.descricao ?? ''
    ).trim(),

    observacao: normalizarCampoOpcional(
      dados?.observacao
    ),

    setor: String(
      dados?.setor ?? ''
    ).trim(),

    conferido: Boolean(
      dados?.conferido
    ),
  };
}

function montarPayloadMovimentacao(
  dados,
  mensagemMotivo,
  mensagemDocumento
) {
  const motivo = String(
    dados?.motivo ?? ''
  ).trim();

  const numeroDocumento = String(
    dados?.numeroDocumento ?? ''
  ).trim();

  if (!motivo) {
    throw new Error(
      mensagemMotivo
    );
  }

  if (!numeroDocumento) {
    throw new Error(
      mensagemDocumento
    );
  }

  return {
    motivo,
    numeroDocumento,

    observacao: normalizarCampoOpcional(
      dados?.observacao
    ),
  };
}

function validarIdMaterial(id) {
  if (
    id === null ||
    id === undefined ||
    String(id).trim() === ''
  ) {
    throw new Error(
      'O ID do material é obrigatório.'
    );
  }
}

function validarPeriodoMovimentacao(
  dataInicial,
  dataFinal
) {
  const inicio = normalizarCampoOpcional(
    dataInicial
  );

  const fim = normalizarCampoOpcional(
    dataFinal
  );

  if (!inicio || !fim) {
    return;
  }

  if (inicio > fim) {
    throw new Error(
      'A data inicial não pode ser posterior à data final.'
    );
  }
}

function adicionarParametro(
  parametros,
  nome,
  valor
) {
  const valorTratado =
    normalizarCampoOpcional(valor);

  if (valorTratado !== null) {
    parametros.append(
      nome,
      valorTratado
    );
  }
}

function normalizarCampoOpcional(valor) {
  const valorTratado = String(
    valor ?? ''
  ).trim();

  return valorTratado || null;
}