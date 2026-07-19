import api from './api';

const BASE_URL = '/material-patrimonial';

export async function listarMateriais() {
  return api(BASE_URL, {
    method: 'GET',
  });
}

export async function buscarMaterialPorId(id) {
  if (id === null || id === undefined) {
    throw new Error('O ID do material é obrigatório.');
  }

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
  if (id === null || id === undefined) {
    throw new Error('O ID do material é obrigatório.');
  }

  const payload = montarPayloadMaterial(dados);

  return api(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function conferirMaterial(id) {
  if (id === null || id === undefined) {
    throw new Error('O ID do material é obrigatório.');
  }

  return api(`${BASE_URL}/${id}/conferir`, {
    method: 'PATCH',
  });
}

export async function transferirEConferirMaterial(
  id,
  novoSetor,
  unidade
) {
  if (id === null || id === undefined) {
    throw new Error('O ID do material é obrigatório.');
  }

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

export async function inativarMaterial(id) {
  if (id === null || id === undefined) {
    throw new Error('O ID do material é obrigatório.');
  }

  return api(`${BASE_URL}/${id}/inativar`, {
    method: 'PATCH',
  });
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

function normalizarCampoOpcional(valor) {
  const valorTratado = String(valor ?? '').trim();

  return valorTratado || null;
}