const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

const TEMPO_LIMITE_MS = 10000;

const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const controller = new AbortController();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let timeoutId;

  const requisicao = fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    signal: controller.signal,
  });

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();

      reject(
        new Error(
          'O servidor demorou para responder. Verifique se o backend está ativo e tente novamente.'
        )
      );
    }, TEMPO_LIMITE_MS);
  });

  try {
    const response = await Promise.race([
      requisicao,
      timeout,
    ]);

    let data = null;

    if (response.status !== 204) {
      const contentType =
        response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      }
    }

    if (!response.ok) {
      const erroHttp = new Error(
        data?.message ||
          'Não foi possível concluir a operação.'
      );

      erroHttp.status = response.status;
      erroHttp.data = data;

      throw erroHttp;
    }

    return data;
  } catch (error) {
    const mensagemErro = String(
      error?.message ?? ''
    ).toLowerCase();

    if (
      mensagemErro.includes(
        'o servidor demorou para responder'
      )
    ) {
      throw error;
    }

    if (error?.name === 'AbortError') {
      throw new Error(
        'O servidor demorou para responder. Verifique se o backend está ativo e tente novamente.',
        { cause: error }
      );
    }

    if (
      error instanceof TypeError ||
      mensagemErro.includes('failed to fetch') ||
      mensagemErro.includes('network error') ||
      mensagemErro.includes('load failed')
    ) {
      throw new Error(
        'Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está ativo.',
        { cause: error }
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export default api;