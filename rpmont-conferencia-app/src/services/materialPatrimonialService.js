import api from './api';

const BASE_URL = '/material-patrimonial';
const MOVIMENTACAO_BASE_URL = '/movimentacao-material';

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

export async function buscarMaterialPorNumeroSerie(numeroSerie) {
  const numeroSerieTratado = String(numeroSerie ?? '').trim();

  if (!numeroSerieTratado) {
    throw new Error('O número de série é obrigatório.');
  }

  return api(
    `${BASE_URL}/numero-serie/${encodeURIComponent(numeroSerieTratado)}`,
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

export async function atualizarMaterial(id, dados) {
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

export async function transferirEConferirMaterial(
  id,
  novoSetor,
  unidade
) {
  validarIdMaterial(id);

  const novoSetorTratado = String(novoSetor ?? '').trim();
  const unidadeTratada = String(unidade ?? '').trim();

  if (!novoSetorTratado) {
    throw new Error('O novo setor é obrigatório.');
  }

  if (!unidadeTratada) {
    throw new Error('A unidade é obrigatória.');
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

export async function baixarMaterial(id, dados) {
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

export async function descartarMaterial(id, dados) {
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

export async function extraviarMaterial(id, dados) {
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

export async function registrarFurtoMaterial(id, dados) {
  validarIdMaterial(id);

  const payload = montarPayloadMovimentacao(
    dados,
    'O motivo do registro de furto é obrigatório.',
    'O número do boletim de ocorrência é obrigatório.'
  );

  return api(`${BASE_URL}/${id}/registrar-furto`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function reativarMaterial(id, dados) {
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

export async function listarHistoricoMaterial(id) {
  validarIdMaterial(id);

  return api(
    `${MOVIMENTACAO_BASE_URL}/material/${id}`,
    {
      method: 'GET',
    }
  );
}

function montarPayloadMaterial(dados) {
  return {
    numeroSerie: String(dados?.numeroSerie ?? '').trim(),
    nome: normalizarCampoOpcional(dados?.nome),
    marca: normalizarCampoOpcional(dados?.marca),
    descricao: String(dados?.descricao ?? '').trim(),
    observacao: normalizarCampoOpcional(dados?.observacao),
    setor: String(dados?.setor ?? '').trim(),
    conferido: Boolean(dados?.conferido),
  };
}

function montarPayloadMovimentacao(
  dados,
  mensagemMotivo,
  mensagemDocumento
) {
  const motivo = String(dados?.motivo ?? '').trim();
  const numeroDocumento = String(
    dados?.numeroDocumento ?? ''
  ).trim();

  if (!motivo) {
    throw new Error(mensagemMotivo);
  }

  if (!numeroDocumento) {
    throw new Error(mensagemDocumento);
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
  if (id === null || id === undefined) {
    throw new Error(
      'O ID do material é obrigatório.'
    );
  }
}

function normalizarCampoOpcional(valor) {
  const valorTratado = String(valor ?? '').trim();

  return valorTratado || null;
}