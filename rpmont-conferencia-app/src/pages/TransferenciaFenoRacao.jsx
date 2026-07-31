import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FaArrowLeft,
  FaBell,
  FaCircleCheck,
  FaClock,
  FaPaperPlane,
  FaRightLeft,
  FaTriangleExclamation,
  FaXmark,
} from 'react-icons/fa6';
import { GiGrain } from 'react-icons/gi';

import '../styles/TransferenciaFenoRacao.css';

import {
  listarNotificacoesFenoRacao,
  listarSolicitacoesEnviadas,
  listarSolicitacoesRecebidas,
  listarTransferencias,
  marcarNotificacaoComoLida,
} from '../services/fenoRacaoTransferenciaService';

const PRODUTOS = [
  {
    valor: 'FENO',
    nome: 'Feno',
    unidade: 'fardo',
    unidadePlural: 'fardos',
  },
  {
    valor: 'RACAO_ADULTO_PREMIUM',
    nome: 'Ração Adulto Premium',
    unidade: 'saco',
    unidadePlural: 'sacos',
  },
  {
    valor: 'RACAO_ADULTO_MANUTENCAO',
    nome: 'Ração Adulto Manutenção',
    unidade: 'saco',
    unidadePlural: 'sacos',
  },
  {
    valor: 'RACAO_POTRO_PREMIUM',
    nome: 'Ração Potro Premium',
    unidade: 'saco',
    unidadePlural: 'sacos',
  },
  {
    valor: 'RACAO_POTRO_MANUTENCAO',
    nome: 'Ração Potro Manutenção',
    unidade: 'saco',
    unidadePlural: 'sacos',
  },
];

const UNIDADES_EQUINAS = ['RPMONT', '3EPMONT'];

const NIVEIS_USUARIO = {
  ADMIN_MASTER: 1,
  ADMIN: 2,
  USUARIO_COMUM: 3,
};

const STORAGE_KEY_ENTRADAS =
  'entradasAlimentacaoEquina';

const STORAGE_KEY_SOLICITACOES =
  'solicitacoesTransferenciaAlimentacaoEquina';

const carregarStorage = (chave) => {
  const dadosSalvos = localStorage.getItem(chave);

  if (!dadosSalvos) {
    return [];
  }

  try {
    const dadosConvertidos =
      JSON.parse(dadosSalvos);

    return Array.isArray(dadosConvertidos)
      ? dadosConvertidos
      : [];
  } catch {
    return [];
  }
};

const salvarStorage = (chave, valor) => {
  localStorage.setItem(
    chave,
    JSON.stringify(valor)
  );
};

const gerarId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const dataAtual = () => new Date().toISOString().slice(0, 10);
const dataHoraAtual = () => new Date().toISOString();

const normalizarTexto = (valor) => {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/º/g, '')
    .replace(/°/g, '')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
};

const obterUnidadeOficial = (unidade) => {
  const unidadeNormalizada = normalizarTexto(unidade);

  if (unidadeNormalizada === '3EPMONT') return '3º EPMont';

  return 'RPMont';
};

const obterUnidadeUsuario = (usuario) => {
  return usuario?.unidade ?? usuario?.UNIDADE ?? '';
};

const obterNivelUsuario = (usuario) => {
  return Number(
    usuario?.nivel ??
      usuario?.NIVEL ??
      usuario?.nivelAcesso ??
      usuario?.NIVEL_ACESSO ??
      NIVEIS_USUARIO.USUARIO_COMUM
  );
};

const usuarioEhAdmin = (usuario) => {
  const nivel = obterNivelUsuario(usuario);

  return (
    nivel === NIVEIS_USUARIO.ADMIN_MASTER ||
    nivel === NIVEIS_USUARIO.ADMIN
  );
};

const usuarioEhUnidadeEquina = (usuario) => {
  const unidade = normalizarTexto(obterUnidadeUsuario(usuario));

  return UNIDADES_EQUINAS.includes(unidade);
};

const obterOutraUnidade = (unidade) => {
  const unidadeNormalizada = normalizarTexto(unidade);

  if (unidadeNormalizada === 'RPMONT') return '3º EPMont';

  return 'RPMont';
};

const obterIdUsuario = (usuario) => {
  return (
    usuario?.id ||
    usuario?.ID ||
    usuario?.matricula ||
    usuario?.MATRICULA ||
    usuario?.email ||
    usuario?.EMAIL ||
    1
  );
};

const obterNomeUsuario = (usuario) => {
  return (
    usuario?.nomeExibicao ||
    `${usuario?.postGrad || usuario?.POSTGRAD || ''} ${
      usuario?.nome || usuario?.NOME || ''
    }`.trim() ||
    'Usuário'
  );
};

const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatarDataHora = (valor) => {
  if (!valor) return '-';

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return '-';

  return data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

function TransferenciaFenoRacao({ usuario, onVoltar }) {
  const [entradas, setEntradas] = useState(() =>
    carregarStorage(STORAGE_KEY_ENTRADAS)
  );

  const [solicitacoes, setSolicitacoes] = useState(() =>
    carregarStorage(STORAGE_KEY_SOLICITACOES)
  );

  const [
    solicitacoesRecebidasApi,
    setSolicitacoesRecebidasApi,
  ] = useState([]);

  const [
    solicitacoesEnviadasApi,
    setSolicitacoesEnviadasApi,
  ] = useState([]);

  const [transferencias, setTransferencias] =
    useState([]);

  const [notificacoes, setNotificacoes] =
    useState([]);

  const [carregandoDados, setCarregandoDados] =
    useState(true);

  const [erroCarregamento, setErroCarregamento] =
    useState('');

  const [
    atualizandoNotificacaoId,
    setAtualizandoNotificacaoId,
  ] = useState(null);

  const [tipoProduto, setTipoProduto] = useState('');
  const [estoqueSolicitadoId, setEstoqueSolicitadoId] = useState('');
  const [quantidadeSolicitada, setQuantidadeSolicitada] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [mensagem, setMensagem] = useState('');

  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [estoqueAnaliseId, setEstoqueAnaliseId] = useState('');
  const [observacaoResposta, setObservacaoResposta] = useState('');

  const admin = usuarioEhAdmin(usuario);
  const unidadeEquina = usuarioEhUnidadeEquina(usuario);

  const unidadeUsuario = obterUnidadeOficial(obterUnidadeUsuario(usuario));
  const unidadeDestino = obterOutraUnidade(unidadeUsuario);

  const obterMensagemErro = (error) => {
    return (
      error?.data?.message ||
      error?.message ||
      'Não foi possível carregar os dados de transferência.'
    );
  };

  const carregarDadosTransferencia = useCallback(
    async (exibirCarregamento = true) => {
      try {
        if (exibirCarregamento) {
          setCarregandoDados(true);
        }

        setErroCarregamento('');

        const [
          recebidas,
          enviadas,
          transferenciasRecebidas,
          notificacoesRecebidas,
        ] = await Promise.all([
          listarSolicitacoesRecebidas(),
          listarSolicitacoesEnviadas(),
          listarTransferencias(),
          listarNotificacoesFenoRacao(),
        ]);

        setSolicitacoesRecebidasApi(
          Array.isArray(recebidas)
            ? recebidas
            : []
        );

        setSolicitacoesEnviadasApi(
          Array.isArray(enviadas)
            ? enviadas
            : []
        );

        setTransferencias(
          Array.isArray(transferenciasRecebidas)
            ? transferenciasRecebidas
            : []
        );

        setNotificacoes(
          Array.isArray(notificacoesRecebidas)
            ? notificacoesRecebidas
            : []
        );
      } catch (error) {
        console.error(
          'Erro ao carregar dados de transferência:',
          error
        );

        setErroCarregamento(
          obterMensagemErro(error)
        );
      } finally {
        if (exibirCarregamento) {
          setCarregandoDados(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    carregarDadosTransferencia();
  }, [carregarDadosTransferencia]);

  const produtoSelecionado = useMemo(() => {
    return PRODUTOS.find((produto) => produto.valor === tipoProduto) || null;
  }, [tipoProduto]);

  const estoquesDaUnidadeDestino = useMemo(() => {
    if (!tipoProduto) return [];

    return entradas
      .filter((entrada) => {
        const mesmaUnidadeDestino =
          normalizarTexto(entrada.unidade) === normalizarTexto(unidadeDestino);

        const mesmoProduto = entrada.tipoProduto === tipoProduto;
        const temSaldo = Number(entrada.quantidadeAtual || 0) > 0;

        return mesmaUnidadeDestino && mesmoProduto && temSaldo;
      })
      .sort((a, b) => {
        const pesoA = Number(a.pesoUnidadeKg || 0);
        const pesoB = Number(b.pesoUnidadeKg || 0);

        if (pesoA !== pesoB) return pesoA - pesoB;

        const dataA = new Date(a.dataEntrada || 0).getTime();
        const dataB = new Date(b.dataEntrada || 0).getTime();

        return dataA - dataB;
      });
  }, [entradas, tipoProduto, unidadeDestino]);

  const estoqueSolicitado = useMemo(() => {
    return (
      entradas.find(
        (entrada) => String(entrada.id) === String(estoqueSolicitadoId)
      ) || null
    );
  }, [entradas, estoqueSolicitadoId]);

  const solicitacoesRecebidas = useMemo(() => {
    return solicitacoesRecebidasApi;
  }, [solicitacoesRecebidasApi]);

  const solicitacoesEnviadas = useMemo(() => {
    return solicitacoesEnviadasApi;
  }, [solicitacoesEnviadasApi]);

  const notificacoesPendentes = useMemo(() => {
    return notificacoes.filter(
      (item) => !item.lida
    );
  }, [notificacoes]);

  const estoquesDisponiveisParaTransferir = useMemo(() => {
    if (!solicitacaoSelecionada) return [];

    return entradas.filter((entrada) => {
      const mesmaUnidade =
        normalizarTexto(entrada.unidade) === normalizarTexto(unidadeUsuario);

      const mesmoProduto =
        entrada.tipoProduto === solicitacaoSelecionada.tipoProduto;

      const mesmoPeso =
        Number(entrada.pesoUnidadeKg || 0) ===
        Number(solicitacaoSelecionada.pesoUnidadeKg || 0);

      const temSaldo = Number(entrada.quantidadeAtual || 0) > 0;

      return mesmaUnidade && mesmoProduto && mesmoPeso && temSaldo;
    });
  }, [entradas, solicitacaoSelecionada, unidadeUsuario]);

  const estoqueAnalise = useMemo(() => {
    return (
      entradas.find(
        (entrada) => String(entrada.id) === String(estoqueAnaliseId)
      ) || null
    );
  }, [entradas, estoqueAnaliseId]);

  const pesoUnidadeKg = Number(estoqueSolicitado?.pesoUnidadeKg || 0);
  const quantidadeDisponivel = Number(estoqueSolicitado?.quantidadeAtual || 0);
  const pesoDisponivelKg = quantidadeDisponivel * pesoUnidadeKg;

  const quantidadeSolicitadaNumerica = Number(quantidadeSolicitada);
  const pesoTotalSolicitadoKg =
    pesoUnidadeKg > 0 && quantidadeSolicitadaNumerica > 0
      ? pesoUnidadeKg * quantidadeSolicitadaNumerica
      : 0;

  const saldoAposSolicitacao =
    quantidadeDisponivel - quantidadeSolicitadaNumerica;

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    window.setTimeout(() => {
      setMensagem('');
    }, 3500);
  };

  const handleMarcarNotificacaoComoLida = async (
    notificacaoId
  ) => {
    try {
      setAtualizandoNotificacaoId(
        notificacaoId
      );

      await marcarNotificacaoComoLida(
        notificacaoId
      );

      setNotificacoes((listaAtual) =>
        listaAtual.map((notificacao) =>
          notificacao.id === notificacaoId
            ? {
                ...notificacao,
                lida: true,
                dataLeitura:
                  notificacao.dataLeitura ||
                  new Date().toISOString(),
              }
            : notificacao
        )
      );

      mostrarMensagem(
        'Notificação marcada como lida.'
      );
    } catch (error) {
      console.error(
        'Erro ao marcar notificação como lida:',
        error
      );

      mostrarMensagem(
        obterMensagemErro(error)
      );
    } finally {
      setAtualizandoNotificacaoId(null);
    }
  };

  const salvarEntradas = (novaLista) => {
    setEntradas(novaLista);
    salvarStorage(STORAGE_KEY_ENTRADAS, novaLista);
  };

  const salvarSolicitacoes = (novaLista) => {
    setSolicitacoes(novaLista);
    salvarStorage(STORAGE_KEY_SOLICITACOES, novaLista);
  };

  const salvarTransferencias = (novaLista) => {
    setTransferencias(novaLista);
  };

  const salvarNotificacoes = (novaLista) => {
    setNotificacoes(novaLista);
  };

  const limparFormulario = () => {
    setTipoProduto('');
    setEstoqueSolicitadoId('');
    setQuantidadeSolicitada('');
    setJustificativa('');
  };

  const abrirAnalise = (solicitacao) => {
    setSolicitacaoSelecionada(solicitacao);
    setEstoqueAnaliseId(String(solicitacao.entradaOrigemIdSolicitada || ''));
    setObservacaoResposta('');
  };

  const fecharAnalise = () => {
    setSolicitacaoSelecionada(null);
    setEstoqueAnaliseId('');
    setObservacaoResposta('');
  };

  const handleProdutoChange = (event) => {
    setTipoProduto(event.target.value);
    setEstoqueSolicitadoId('');
    setQuantidadeSolicitada('');
    setMensagem('');
  };

  const enviarSolicitacaoTransferencia = (event) => {
    event.preventDefault();

    if (!admin || !unidadeEquina) {
      mostrarMensagem(
        'Apenas administradores do RPMont e 3º EPMont podem solicitar transferência.'
      );
      return;
    }

    if (!produtoSelecionado) {
      mostrarMensagem('Selecione o produto.');
      return;
    }

    if (!estoqueSolicitado) {
      mostrarMensagem(
        `Selecione o estoque disponível na unidade ${unidadeDestino}.`
      );
      return;
    }

    if (
      !Number.isFinite(quantidadeSolicitadaNumerica) ||
      quantidadeSolicitadaNumerica <= 0
    ) {
      mostrarMensagem('Informe uma quantidade válida.');
      return;
    }

    if (!Number.isInteger(quantidadeSolicitadaNumerica)) {
      mostrarMensagem(
        `A quantidade de ${produtoSelecionado.unidadePlural} deve ser inteira.`
      );
      return;
    }

    if (quantidadeSolicitadaNumerica > quantidadeDisponivel) {
      mostrarMensagem(
        `A quantidade solicitada não pode ser maior que o saldo disponível: ${formatarNumero(
          quantidadeDisponivel
        )} ${produtoSelecionado.unidadePlural}.`
      );
      return;
    }

    if (!justificativa.trim()) {
      mostrarMensagem('Informe a justificativa da solicitação.');
      return;
    }

    const novaSolicitacao = {
      id: gerarId(),
      unidadeSolicitante: unidadeUsuario,
      unidadeOrigem: unidadeDestino,

      entradaOrigemIdSolicitada: estoqueSolicitado.id,
      loteOrigemSolicitado: estoqueSolicitado.lote || '',
      fornecedorOrigem: estoqueSolicitado.fornecedor || '',

      tipoProduto: produtoSelecionado.valor,
      nomeProduto: produtoSelecionado.nome,
      quantidadeSolicitada: quantidadeSolicitadaNumerica,
      unidadeControle: produtoSelecionado.unidade.toUpperCase(),
      unidadeControlePlural: produtoSelecionado.unidadePlural,
      pesoUnidadeKg,
      pesoTotalSolicitadoKg,

      quantidadeDisponivelNoPedido: quantidadeDisponivel,
      pesoDisponivelNoPedido: pesoDisponivelKg,
      saldoPrevistoOrigem: saldoAposSolicitacao,

      justificativa: justificativa.trim(),
      status: 'PENDENTE',
      solicitadoPorId: obterIdUsuario(usuario),
      solicitadoPorNome: obterNomeUsuario(usuario),
      dataSolicitacao: dataHoraAtual(),
      respondidoPorId: null,
      respondidoPorNome: '',
      dataResposta: null,
      observacaoResposta: '',
      transferenciaId: null,
    };

    const novaNotificacao = {
      id: gerarId(),
      unidadeDestino,
      titulo: 'Nova solicitação de transferência',
      mensagem: `${unidadeUsuario} solicitou ${quantidadeSolicitadaNumerica} ${produtoSelecionado.unidadePlural} de ${produtoSelecionado.nome} de ${formatarNumero(pesoUnidadeKg)} kg.`,
      tipo: 'TRANSFERENCIA_ALIMENTACAO',
      lida: false,
      referenciaId: novaSolicitacao.id,
      dataCriacao: dataHoraAtual(),
    };

    salvarSolicitacoes([novaSolicitacao, ...solicitacoes]);
    salvarNotificacoes([novaNotificacao, ...notificacoes]);

    limparFormulario();
    mostrarMensagem('Solicitação de transferência enviada com sucesso.');
  };

  const negarSolicitacao = () => {
    if (!solicitacaoSelecionada) return;

    if (!observacaoResposta.trim()) {
      mostrarMensagem('Informe o motivo da negativa.');
      return;
    }

    const solicitacoesAtualizadas = solicitacoes.map((item) =>
      item.id === solicitacaoSelecionada.id
        ? {
            ...item,
            status: 'NEGADA',
            respondidoPorId: obterIdUsuario(usuario),
            respondidoPorNome: obterNomeUsuario(usuario),
            dataResposta: dataHoraAtual(),
            observacaoResposta: observacaoResposta.trim(),
          }
        : item
    );

    const novaNotificacao = {
      id: gerarId(),
      unidadeDestino: solicitacaoSelecionada.unidadeSolicitante,
      titulo: 'Transferência negada',
      mensagem: `${unidadeUsuario} negou a solicitação de ${solicitacaoSelecionada.nomeProduto} de ${formatarNumero(solicitacaoSelecionada.pesoUnidadeKg)} kg.`,
      tipo: 'RESPOSTA_TRANSFERENCIA_ALIMENTACAO',
      lida: false,
      referenciaId: solicitacaoSelecionada.id,
      dataCriacao: dataHoraAtual(),
    };

    const notificacoesAtualizadas = notificacoes.map((notificacao) =>
      notificacao.referenciaId === solicitacaoSelecionada.id
        ? {
            ...notificacao,
            lida: true,
          }
        : notificacao
    );

    salvarSolicitacoes(solicitacoesAtualizadas);
    salvarNotificacoes([novaNotificacao, ...notificacoesAtualizadas]);

    fecharAnalise();
    mostrarMensagem('Solicitação negada com sucesso.');
  };

  const aprovarTransferencia = () => {
    if (!solicitacaoSelecionada) return;

    if (!estoqueAnalise) {
      mostrarMensagem('Selecione o estoque/lote que será transferido.');
      return;
    }

    const quantidadeTransferida = Number(
      solicitacaoSelecionada.quantidadeSolicitada || 0
    );

    const saldoDisponivel = Number(estoqueAnalise.quantidadeAtual || 0);

    if (quantidadeTransferida > saldoDisponivel) {
      mostrarMensagem(
        `Estoque insuficiente. Disponível: ${formatarNumero(
          saldoDisponivel
        )} ${solicitacaoSelecionada.unidadeControlePlural}.`
      );
      return;
    }

    const transferenciaId = gerarId();
    const novaEntradaId = gerarId();

    const entradasAtualizadas = entradas.map((entrada) => {
      if (String(entrada.id) !== String(estoqueAnalise.id)) {
        return entrada;
      }

      const novoSaldo =
        Number(entrada.quantidadeAtual || 0) - quantidadeTransferida;

      return {
        ...entrada,
        quantidadeAtual: novoSaldo,
        pesoAtualKg: novoSaldo * Number(entrada.pesoUnidadeKg || 0),
        dataModificacao: dataHoraAtual(),
        userModificador: obterIdUsuario(usuario),
      };
    });

    const novaEntradaDestino = {
      ...estoqueAnalise,
      id: novaEntradaId,
      lote: estoqueAnalise.lote
        ? `${estoqueAnalise.lote}-TRANSF`
        : `TRANSF-${dataAtual()}`,
      unidade: solicitacaoSelecionada.unidadeSolicitante,
      quantidadeEntrada: quantidadeTransferida,
      quantidadeInicial: quantidadeTransferida,
      quantidade: quantidadeTransferida,
      quantidadeAtual: quantidadeTransferida,
      pesoTotalKg:
        quantidadeTransferida * Number(estoqueAnalise.pesoUnidadeKg || 0),
      pesoAtualKg:
        quantidadeTransferida * Number(estoqueAnalise.pesoUnidadeKg || 0),
      fornecedor: `Transferência ${unidadeUsuario}`,
      origemTransferenciaId: transferenciaId,
      dataEntrada: dataAtual(),
      dataCadastro: dataHoraAtual(),
      dataModificacao: dataHoraAtual(),
      userModificador: obterIdUsuario(usuario),
    };

    const novaTransferencia = {
      id: transferenciaId,
      solicitacaoId: solicitacaoSelecionada.id,
      unidadeOrigem: unidadeUsuario,
      unidadeDestino: solicitacaoSelecionada.unidadeSolicitante,
      entradaOrigemId: estoqueAnalise.id,
      entradaDestinoId: novaEntradaId,
      tipoProduto: solicitacaoSelecionada.tipoProduto,
      nomeProduto: solicitacaoSelecionada.nomeProduto,
      quantidadeTransferida,
      unidadeControlePlural: solicitacaoSelecionada.unidadeControlePlural,
      pesoUnidadeKg: Number(estoqueAnalise.pesoUnidadeKg || 0),
      pesoTotalKg:
        quantidadeTransferida * Number(estoqueAnalise.pesoUnidadeKg || 0),
      loteOrigem: estoqueAnalise.lote || '',
      aprovadoPorId: obterIdUsuario(usuario),
      aprovadoPorNome: obterNomeUsuario(usuario),
      dataTransferencia: dataHoraAtual(),
      observacao: observacaoResposta.trim(),
    };

    const solicitacoesAtualizadas = solicitacoes.map((item) =>
      item.id === solicitacaoSelecionada.id
        ? {
            ...item,
            status: 'TRANSFERIDA',
            respondidoPorId: obterIdUsuario(usuario),
            respondidoPorNome: obterNomeUsuario(usuario),
            dataResposta: dataHoraAtual(),
            observacaoResposta: observacaoResposta.trim(),
            transferenciaId,
          }
        : item
    );

    const novaNotificacao = {
      id: gerarId(),
      unidadeDestino: solicitacaoSelecionada.unidadeSolicitante,
      titulo: 'Transferência aprovada',
      mensagem: `${unidadeUsuario} transferiu ${quantidadeTransferida} ${solicitacaoSelecionada.unidadeControle === 'FARDO'
                    ? 'fardos'
                    : 'sacos'} de ${solicitacaoSelecionada.nomeProduto} de ${formatarNumero(solicitacaoSelecionada.pesoUnidadeKg)} kg.`,
      tipo: 'RESPOSTA_TRANSFERENCIA_ALIMENTACAO',
      lida: false,
      referenciaId: solicitacaoSelecionada.id,
      dataCriacao: dataHoraAtual(),
    };

    const notificacoesAtualizadas = notificacoes.map((notificacao) =>
      notificacao.referenciaId === solicitacaoSelecionada.id
        ? {
            ...notificacao,
            lida: true,
          }
        : notificacao
    );

    salvarEntradas([novaEntradaDestino, ...entradasAtualizadas]);
    salvarTransferencias([novaTransferencia, ...transferencias]);
    salvarSolicitacoes(solicitacoesAtualizadas);
    salvarNotificacoes([novaNotificacao, ...notificacoesAtualizadas]);

    fecharAnalise();
    mostrarMensagem('Transferência aprovada e estoque movimentado com sucesso.');
  };

  if (!admin || !unidadeEquina) {
    return (
      <main className="transferencia-alimentacao-page">
        <section className="transferencia-alimentacao-phone">
          <header className="transferencia-alimentacao-header">
            <button
              type="button"
              className="transferencia-alimentacao-voltar"
              onClick={onVoltar}
            >
              <FaArrowLeft />
            </button>

            <div>
              <span>Acesso restrito</span>
              <h1>Transferência</h1>
              <p>{obterUnidadeUsuario(usuario)}</p>
            </div>
          </header>

          <section className="transferencia-alimentacao-card">
            <div className="transferencia-alimentacao-vazio">
              <FaTriangleExclamation />

              <h2>Acesso negado</h2>

              <p>
                Transferência de Feno e Ração é permitida somente para
                administradores do RPMont e 3º EPMont.
              </p>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="transferencia-alimentacao-page">
      <section className="transferencia-alimentacao-phone">
        <header className="transferencia-alimentacao-header">
          <button
            type="button"
            className="transferencia-alimentacao-voltar"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Alimentação equina</span>
            <h1>Transferência</h1>
            <p>{unidadeUsuario}</p>
          </div>

          <div className="transferencia-alimentacao-sino">
            <FaBell />

            {notificacoesPendentes.length > 0 && (
              <strong>{notificacoesPendentes.length}</strong>
            )}
          </div>
        </header>

        {mensagem && (
          <div className="transferencia-alimentacao-mensagem">
            {mensagem}
          </div>
        )}

        {carregandoDados && (
          <div className="transferencia-alimentacao-mensagem">
            Carregando solicitações, transferências e notificações...
          </div>
        )}

        {erroCarregamento && (
          <div className="transferencia-alimentacao-mensagem">
            <span>{erroCarregamento}</span>

            <button
              type="button"
              onClick={() =>
                carregarDadosTransferencia()
              }
            >
              Tentar novamente
            </button>
          </div>
        )}

        <section className="transferencia-alimentacao-card">
          <div className="transferencia-alimentacao-lista-header">
            <div>
              <span>Central de avisos</span>
              <h2>Notificações</h2>
            </div>

            <strong>
              {notificacoesPendentes.length}
            </strong>
          </div>

          {notificacoes.length === 0 ? (
            <div className="transferencia-alimentacao-vazio">
              <FaBell />
              <p>Nenhuma notificação encontrada.</p>
            </div>
          ) : (
            <div className="transferencia-alimentacao-lista">
              {notificacoes.map((item) => (
                <article
                  key={item.id}
                  className={`transferencia-alimentacao-item ${
                    item.lida
                      ? 'status-transferida'
                      : 'status-pendente'
                  }`}
                >
                  <div className="transferencia-alimentacao-item-icon">
                    <FaBell />
                  </div>

                  <div className="transferencia-alimentacao-item-info">
                    <span>
                      {item.lida
                        ? 'LIDA'
                        : 'NÃO LIDA'}
                    </span>

                    <h3>{item.titulo}</h3>

                    <p>{item.mensagem}</p>

                    {item.solicitacaoId && (
                      <p>
                        Solicitação:{' '}
                        <strong>
                          nº {item.solicitacaoId}
                        </strong>
                      </p>
                    )}

                    <small>
                      {formatarDataHora(
                        item.dataCriacao
                      )}
                    </small>
                  </div>

                  {!item.lida && (
                    <button
                      type="button"
                      className="transferencia-alimentacao-analisar"
                      disabled={
                        atualizandoNotificacaoId ===
                        item.id
                      }
                      onClick={() =>
                        handleMarcarNotificacaoComoLida(
                          item.id
                        )
                      }
                    >
                      {atualizandoNotificacaoId ===
                      item.id
                        ? 'Salvando...'
                        : 'Marcar como lida'}
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="transferencia-alimentacao-card destaque">
          <div className="transferencia-alimentacao-card-titulo">
            <FaPaperPlane />

            <div>
              <h2>Nova solicitação</h2>
              <p>
                Consulte o estoque do <strong>{unidadeDestino}</strong> antes de
                solicitar.
              </p>
            </div>
          </div>

          <form
            className="transferencia-alimentacao-form"
            onSubmit={enviarSolicitacaoTransferencia}
          >
            <div className="transferencia-alimentacao-form-group">
              <label htmlFor="produtoTransferencia">Produto</label>

              <select
                id="produtoTransferencia"
                value={tipoProduto}
                onChange={handleProdutoChange}
              >
                <option value="">Selecione o produto</option>

                {PRODUTOS.map((produto) => (
                  <option key={produto.valor} value={produto.valor}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="transferencia-alimentacao-form-group">
              <label htmlFor="estoqueTransferencia">
                Peso e estoque disponível no {unidadeDestino}
              </label>

              <select
                id="estoqueTransferencia"
                value={estoqueSolicitadoId}
                disabled={!tipoProduto}
                onChange={(event) => {
                  setEstoqueSolicitadoId(event.target.value);
                  setQuantidadeSolicitada('');
                  setMensagem('');
                }}
              >
                <option value="">
                  {!tipoProduto
                    ? 'Selecione o produto primeiro'
                    : estoquesDaUnidadeDestino.length === 0
                      ? `Nenhum estoque disponível no ${unidadeDestino}`
                      : 'Selecione o estoque'}
                </option>

                {estoquesDaUnidadeDestino.map((entrada) => (
                  <option key={entrada.id} value={entrada.id}>
                    {formatarNumero(entrada.pesoUnidadeKg)} kg —{' '}
                    {formatarNumero(entrada.quantidadeAtual)}{' '}
                    {produtoSelecionado?.unidadePlural}
                    {entrada.lote ? ` — Lote ${entrada.lote}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {estoqueSolicitado && (
              <div className="transferencia-alimentacao-estoque-info">
                <div>
                  <span>Peso por unidade</span>
                  <strong>{formatarNumero(pesoUnidadeKg)} kg</strong>
                </div>

                <div>
                  <span>Saldo disponível no {unidadeDestino}</span>
                  <strong>
                    {formatarNumero(quantidadeDisponivel)}{' '}
                    {produtoSelecionado?.unidadePlural}
                  </strong>
                </div>

                <div>
                  <span>Peso disponível</span>
                  <strong>{formatarNumero(pesoDisponivelKg)} kg</strong>
                </div>
              </div>
            )}

            <div className="transferencia-alimentacao-form-group">
              <label htmlFor="quantidadeTransferencia">
                Quantidade solicitada de{' '}
                {produtoSelecionado?.unidadePlural || 'unidades'}
              </label>

              <input
                id="quantidadeTransferencia"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={quantidadeSolicitada}
                placeholder={
                  produtoSelecionado
                    ? `Ex.: 30 ${produtoSelecionado.unidadePlural}`
                    : 'Informe a quantidade'
                }
                disabled={!estoqueSolicitado}
                onChange={(event) => {
                  setQuantidadeSolicitada(event.target.value);
                  setMensagem('');
                }}
              />
            </div>

            <div className="transferencia-alimentacao-resumo">
              <div>
                <span>Quantidade solicitada</span>
                <strong>
                  {quantidadeSolicitadaNumerica > 0
                    ? `${formatarNumero(quantidadeSolicitadaNumerica)} ${
                        produtoSelecionado?.unidadePlural || 'unidades'
                      }`
                    : '0'}
                </strong>
              </div>

              <div>
                <span>Peso total solicitado</span>
                <strong>{formatarNumero(pesoTotalSolicitadoKg)} kg</strong>
              </div>

              <div className="transferencia-alimentacao-resumo-total">
                <span>Saldo previsto no {unidadeDestino}</span>
                <strong
                  className={
                    saldoAposSolicitacao < 0 ? 'saldo-insuficiente' : ''
                  }
                >
                  {formatarNumero(Math.max(saldoAposSolicitacao, 0))}{' '}
                  {produtoSelecionado?.unidadePlural || 'unidades'}
                </strong>
              </div>
            </div>

            <div className="transferencia-alimentacao-form-group">
              <label htmlFor="justificativaTransferencia">Justificativa</label>

              <textarea
                id="justificativaTransferencia"
                value={justificativa}
                placeholder="Explique o motivo da solicitação"
                onChange={(event) => {
                  setJustificativa(event.target.value);
                  setMensagem('');
                }}
              />
            </div>

            <button type="submit" className="transferencia-alimentacao-enviar">
              <FaPaperPlane />
              Enviar solicitação
            </button>
          </form>
        </section>

        <section className="transferencia-alimentacao-card">
          <div className="transferencia-alimentacao-lista-header">
            <div>
              <span>Recebidas</span>
              <h2>Solicitações para analisar</h2>
            </div>

            <strong>{solicitacoesRecebidas.length}</strong>
          </div>

          {solicitacoesRecebidas.length === 0 ? (
            <div className="transferencia-alimentacao-vazio">
              <FaClock />
              <p>Nenhuma solicitação recebida.</p>
            </div>
          ) : (
            <div className="transferencia-alimentacao-lista">
              {solicitacoesRecebidas.map((item) => (
                <article
                  key={item.id}
                  className={`transferencia-alimentacao-item status-${item.status.toLowerCase()}`}
                >
                  <div className="transferencia-alimentacao-item-icon">
                    <GiGrain />
                  </div>

                  <div className="transferencia-alimentacao-item-info">
                    <span>{item.status}</span>
                    <h3>{item.nomeProduto}</h3>

                    <p>
                      {item.unidadeSolicitante} solicitou{' '}
                      <strong>
                        {formatarNumero(item.quantidadeSolicitada)}{' '}
                        {item.unidadeControle === 'FARDO'
                          ? 'fardos'
                          : 'sacos'} de{' '}
                        {formatarNumero(item.pesoUnidadeKg)} kg
                      </strong>
                    </p>

                    <p>
                      Estoque solicitado:{' '}
                      <strong>
                        {item.codigoLote
                          ? `Lote ${item.codigoLote}`
                          : 'Sem lote informado'}
                      </strong>
                    </p>

                    <p>
                      Peso total:{' '}
                      <strong>
                        {formatarNumero(item.pesoTotalSolicitadoKg)} kg
                      </strong>
                    </p>

                    <p>{item.justificativa}</p>

                    <small>{formatarDataHora(item.dataSolicitacao)}</small>
                  </div>

                  {item.status === 'PENDENTE' && (
                    <button
                      type="button"
                      className="transferencia-alimentacao-analisar"
                      onClick={() => abrirAnalise(item)}
                    >
                      Analisar
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="transferencia-alimentacao-card">
          <div className="transferencia-alimentacao-lista-header">
            <div>
              <span>Enviadas</span>
              <h2>Minhas solicitações</h2>
            </div>

            <strong>{solicitacoesEnviadas.length}</strong>
          </div>

          {solicitacoesEnviadas.length === 0 ? (
            <div className="transferencia-alimentacao-vazio">
              <FaClock />
              <p>Nenhuma solicitação enviada.</p>
            </div>
          ) : (
            <div className="transferencia-alimentacao-lista">
              {solicitacoesEnviadas.map((item) => (
                <article
                  key={item.id}
                  className={`transferencia-alimentacao-item status-${item.status.toLowerCase()}`}
                >
                  <div className="transferencia-alimentacao-item-icon">
                    <FaRightLeft />
                  </div>

                  <div className="transferencia-alimentacao-item-info">
                    <span>{item.status}</span>
                    <h3>{item.nomeProduto}</h3>

                    <p>
                      Para <strong>{item.unidadeOrigem}</strong>
                    </p>

                    <p>
                      Quantidade:{' '}
                      <strong>
                        {formatarNumero(item.quantidadeSolicitada)}{' '}
                        {item.unidadeControle === 'FARDO'
                          ? 'fardos'
                          : 'sacos'} de{' '}
                        {formatarNumero(item.pesoUnidadeKg)} kg
                      </strong>
                    </p>

                    <p>
                      Peso total:{' '}
                      <strong>
                        {formatarNumero(item.pesoTotalSolicitadoKg)} kg
                      </strong>
                    </p>

                    {item.observacaoResposta && (
                      <p>
                        Resposta: <strong>{item.observacaoResposta}</strong>
                      </p>
                    )}

                    <small>{formatarDataHora(item.dataSolicitacao)}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="transferencia-alimentacao-card">
          <div className="transferencia-alimentacao-lista-header">
            <div>
              <span>Histórico</span>
              <h2>Transferências realizadas</h2>
            </div>

            <strong>{transferencias.length}</strong>
          </div>

          {transferencias.length === 0 ? (
            <div className="transferencia-alimentacao-vazio">
              <FaClock />
              <p>Nenhuma transferência registrada.</p>
            </div>
          ) : (
            <div className="transferencia-alimentacao-lista">
              {transferencias.map((item) => (
                <article
                  key={item.id}
                  className="transferencia-alimentacao-item status-transferida"
                >
                  <div className="transferencia-alimentacao-item-icon">
                    <FaRightLeft />
                  </div>

                  <div className="transferencia-alimentacao-item-info">
                    <span>{item.situacao}</span>
                    <h3>{item.nomeProduto}</h3>

                    <p>
                      {item.unidadeOrigem} → {item.unidadeDestino}
                    </p>

                    <p>
                      Quantidade:{' '}
                      <strong>
                        {formatarNumero(item.quantidadeTransferida)}{' '}
                        {item.unidadeControle === 'FARDO'
                          ? 'fardos'
                          : 'sacos'} de{' '}
                        {formatarNumero(item.pesoUnidadeKg)} kg
                      </strong>
                    </p>

                    <p>
                      Peso total:{' '}
                      <strong>{formatarNumero(item.pesoTotalKg)} kg</strong>
                    </p>

                    <small>{formatarDataHora(item.dataTransferencia)}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {solicitacaoSelecionada && (
          <div className="transferencia-alimentacao-modal-overlay">
            <div className="transferencia-alimentacao-modal">
              <h2>Analisar transferência</h2>

              <p>
                <strong>{solicitacaoSelecionada.unidadeSolicitante}</strong>{' '}
                solicitou{' '}
                <strong>
                  {formatarNumero(solicitacaoSelecionada.quantidadeSolicitada)}{' '}
                  {solicitacaoSelecionada.unidadeControle === 'FARDO'
                    ? 'fardos'
                    : 'sacos'} de{' '}
                  {formatarNumero(solicitacaoSelecionada.pesoUnidadeKg)} kg
                </strong>{' '}
                de <strong>{solicitacaoSelecionada.nomeProduto}</strong>.
              </p>

              <div className="transferencia-alimentacao-modal-resumo">
                <span>Estoque visto no momento do pedido</span>
                <strong>
                  {formatarNumero(
                    solicitacaoSelecionada.quantidadeDisponivelNoPedido
                  )}{' '}
                  {solicitacaoSelecionada.unidadeControle === 'FARDO'
                    ? 'fardos'
                    : 'sacos'} disponíveis
                </strong>

                <span>Peso total solicitado</span>
                <strong>
                  {formatarNumero(solicitacaoSelecionada.pesoTotalSolicitadoKg)}{' '}
                  kg
                </strong>

                <span>Justificativa</span>
                <strong>{solicitacaoSelecionada.justificativa}</strong>
              </div>

              <label className="transferencia-alimentacao-modal-label">
                Estoque/lote para transferência

                <select
                  value={estoqueAnaliseId}
                  onChange={(event) => {
                    setEstoqueAnaliseId(event.target.value);
                    setMensagem('');
                  }}
                >
                  <option value="">Selecione o estoque</option>

                  {estoquesDisponiveisParaTransferir.map((entrada) => (
                    <option key={entrada.id} value={entrada.id}>
                      {formatarNumero(entrada.pesoUnidadeKg)} kg —{' '}
                      {formatarNumero(entrada.quantidadeAtual)} disponíveis
                      {entrada.lote ? ` — Lote ${entrada.lote}` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="transferencia-alimentacao-modal-label">
                Observação / motivo da negativa

                <textarea
                  value={observacaoResposta}
                  placeholder="Obrigatório se for negar"
                  onChange={(event) => setObservacaoResposta(event.target.value)}
                />
              </label>

              <div className="transferencia-alimentacao-modal-actions">
                <button
                  type="button"
                  className="transferencia-alimentacao-aprovar"
                  onClick={aprovarTransferencia}
                >
                  <FaCircleCheck />
                  Aprovar e transferir
                </button>

                <button
                  type="button"
                  className="transferencia-alimentacao-negar"
                  onClick={negarSolicitacao}
                >
                  <FaXmark />
                  Negar
                </button>

                <button
                  type="button"
                  className="transferencia-alimentacao-fechar"
                  onClick={fecharAnalise}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default TransferenciaFenoRacao;