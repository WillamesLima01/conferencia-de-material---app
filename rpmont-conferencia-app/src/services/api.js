const API_URL = String(
  import.meta.env.VITE_API_URL ||
    'http://localhost:8080'
)
  .trim()
  .replace(/\/+$/, '');

const TEMPO_LIMITE_MS = 10000;

const criarHeaders = (
  options,
  token
) => {
  const headers = new Headers(
    options?.headers || {}
  );

  const possuiBody =
    options?.body !== undefined &&
    options?.body !== null;

  const bodyEhFormData =
    typeof FormData !== 'undefined' &&
    options?.body instanceof FormData;

  if (
    possuiBody &&
    !bodyEhFormData &&
    !headers.has('Content-Type')
  ) {
    headers.set(
      'Content-Type',
      'application/json'
    );
  }

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  return headers;
};

const lerResposta = async (
  response
) => {
  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    return response.json();
  }

  const texto =
    await response.text();

  return texto || null;
};

const criarErroHttp = (
  response,
  data
) => {
  const mensagem =
    typeof data === 'object'
      ? data?.message
      : data;

  const erro = new Error(
    mensagem ||
      'Não foi possível concluir a operação.'
  );

  erro.status = response.status;
  erro.data = data;

  return erro;
};

const api = async (
  endpoint,
  options = {}
) => {
  const token =
    localStorage.getItem('token');

  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(() => {
      controller.abort();
    }, TEMPO_LIMITE_MS);

  try {
    const headers =
      criarHeaders(
        options,
        token
      );

    const response =
      await fetch(
        `${API_URL}${endpoint}`,
        {
          ...options,
          headers,
          signal:
            controller.signal,
        }
      );

    const data =
      await lerResposta(
        response
      );

    if (!response.ok) {
      throw criarErroHttp(
        response,
        data
      );
    }

    return data;
  } catch (error) {
    if (
      error?.status
    ) {
      throw error;
    }

    if (
      error?.name ===
      'AbortError'
    ) {
      throw new Error(
        'O servidor demorou para responder. Verifique sua conexão e tente novamente.',
        {
          cause: error,
        }
      );
    }

    const mensagemErro =
      String(
        error?.message || ''
      ).toLowerCase();

    const erroDeRede =
      error instanceof TypeError ||
      mensagemErro.includes(
        'failed to fetch'
      ) ||
      mensagemErro.includes(
        'network error'
      ) ||
      mensagemErro.includes(
        'load failed'
      );

    if (erroDeRede) {
      throw new Error(
        'Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está disponível.',
        {
          cause: error,
        }
      );
    }

    throw error;
  } finally {
    clearTimeout(
      timeoutId
    );
  }
};

export default api;