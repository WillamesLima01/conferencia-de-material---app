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
import LoadingAmpulheta from '../components/LoadingAmpulheta';

import '../styles/TransferenciaFenoRacao.css';

import {
  listarProdutosFenoRacao,
} from '../services/produtoFenoRacaoService';

import {
  listarUnidadesAtivas,
} from '../services/unidadeService';

import {
  aprovarSolicitacaoTransferencia,
  consultarResumoEstoqueTransferencia,
  criarSolicitacaoTransferencia,
  listarNotificacoesFenoRacao,
  listarSolicitacoesEnviadas,
  listarSolicitacoesRecebidas,
  listarTransferencias,
  marcarNotificacaoComoLida,
  negarSolicitacaoTransferencia,
} from '../services/fenoRacaoTransferenciaService';

const NIVEIS_USUARIO = {
  ADMIN_MASTER: 1,
  ADMIN: 2,
  USUARIO_COMUM: 3,
};

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

const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatarDataHora = (valor) => {
  if (!valor) return '-';

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return '-';
  }

  return data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const obterUnidadePlural = (
  unidadeControle,
  quantidade = 2
) => {
  const plural = Number(quantidade) !== 1;

  if (unidadeControle === 'FARDO') {
    return plural ? 'fardos' : 'fardo';
  }

  if (unidadeControle === 'SACO') {
    return plural ? 'sacos' : 'saco';
  }

  return plural ? 'unidades' : 'unidade';
};

const obterNomeProduto = (produto) => {
  return (
    produto?.nomeProduto ||
    produto?.nome ||
    produto?.tipoProduto ||
    'Produto'
  );
};

const obterEtapas = (item) => {
  return Array.isArray(item?.etapas)
    ? item.etapas
    : [];
};

function TransferenciaFenoRacao({
  usuario,
  onVoltar,
}) {
  const [produtos, setProdutos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [unidadeOrigem, setUnidadeOrigem] =
    useState('');
  const [resumoEstoque, setResumoEstoque] =
    useState([]);
  const [
    carregandoResumoEstoque,
    setCarregandoResumoEstoque,
  ] = useState(false);

  const [produtoId, setProdutoId] = useState('');
  const [
    quantidadeSolicitada,
    setQuantidadeSolicitada,
  ] = useState('');
  const [justificativa, setJustificativa] =
    useState('');

  const [
    solicitacoesRecebidas,
    setSolicitacoesRecebidas,
  ] = useState([]);

  const [
    solicitacoesEnviadas,
    setSolicitacoesEnviadas,
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

  const [
    solicitacaoSelecionada,
    setSolicitacaoSelecionada,
  ] = useState(null);

  const [
    observacaoResposta,
    setObservacaoResposta,
  ] = useState('');

  const [mensagem, setMensagem] =
    useState('');

  const [
    mensagemSolicitacao,
    setMensagemSolicitacao,
  ] = useState('');

  const [enviandoSolicitacao, setEnviandoSolicitacao] =
    useState(false);

  const [processandoResposta, setProcessandoResposta] =
    useState(false);

  const admin = usuarioEhAdmin(usuario);

  const unidadeUsuario =
    obterUnidadeUsuario(usuario).trim();

  const unidadesDisponiveis = useMemo(() => {
    return unidades.filter((unidade) => {
      const identificador =
        unidade?.sigla ||
        unidade?.nome ||
        '';

      return (
        Boolean(unidade?.ativo ?? true) &&
        normalizarTexto(identificador) !==
          normalizarTexto(unidadeUsuario)
      );
    });
  }, [unidades, unidadeUsuario]);

  const produtosComEstoque = useMemo(() => {
    const saldoPorProduto = new Map(
      resumoEstoque.map((item) => [
        String(item.produtoId),
        item,
      ])
    );

    return produtos.map((produto) => {
      const resumo =
        saldoPorProduto.get(
          String(produto.id)
        ) || {};

      return {
        ...produto,
        quantidadeDisponivel: Number(
          resumo.quantidadeDisponivel || 0
        ),
        pesoTotalDisponivelKg: Number(
          resumo.pesoTotalDisponivelKg || 0
        ),
        quantidadeLotes: Number(
          resumo.quantidadeLotes || 0
        ),
        unidadeEstoque:
          resumo.unidade || unidadeOrigem,
      };
    });
  }, [produtos, resumoEstoque, unidadeOrigem]);

  const produtoSelecionado = useMemo(() => {
    return (
      produtosComEstoque.find(
        (produto) =>
          String(produto.id) ===
          String(produtoId)
      ) || null
    );
  }, [produtosComEstoque, produtoId]);

  const quantidadeSolicitadaNumerica = Number(
    quantidadeSolicitada
  );

  const pesoUnidadeKg = Number(
    produtoSelecionado?.pesoUnidadeKg || 0
  );

  const pesoTotalSolicitadoKg =
    quantidadeSolicitadaNumerica > 0
      ? quantidadeSolicitadaNumerica *
        pesoUnidadeKg
      : 0;

  const quantidadeDisponivel = Number(
    produtoSelecionado?.quantidadeDisponivel || 0
  );

  const estoqueInsuficiente =
    Boolean(produtoSelecionado) &&
    quantidadeSolicitadaNumerica > 0 &&
    quantidadeSolicitadaNumerica >
      quantidadeDisponivel;

  const notificacoesPendentes = useMemo(() => {
    return notificacoes.filter(
      (item) => !item.lida
    );
  }, [notificacoes]);

  const obterMensagemErro = useCallback(
    (error) => {
      return (
        error?.data?.message ||
        error?.message ||
        'Não foi possível concluir a operação.'
      );
    },
    []
  );

  const mostrarMensagem = useCallback(
    (texto) => {
      setMensagem(texto);

      window.setTimeout(() => {
        setMensagem('');
      }, 4000);
    },
    []
  );

  const mostrarMensagemSolicitacao = useCallback(
    (texto) => {
      setMensagemSolicitacao(texto);

      window.setTimeout(() => {
        setMensagemSolicitacao('');
      }, 7000);
    },
    []
  );

  const carregarDadosTransferencia = useCallback(
    async (exibirCarregamento = true) => {
      try {
        if (exibirCarregamento) {
          setCarregandoDados(true);
        }

        setErroCarregamento('');

        const [
          produtosRecebidos,
          unidadesRecebidas,
          recebidas,
          enviadas,
          transferenciasRecebidas,
          notificacoesRecebidas,
        ] = await Promise.all([
          listarProdutosFenoRacao(),
          listarUnidadesAtivas(),
          listarSolicitacoesRecebidas(),
          listarSolicitacoesEnviadas(),
          listarTransferencias(),
          listarNotificacoesFenoRacao(),
        ]);

        setProdutos(
          Array.isArray(produtosRecebidos)
            ? produtosRecebidos
            : []
        );

        setUnidades(
          Array.isArray(unidadesRecebidas)
            ? unidadesRecebidas
            : []
        );

        setSolicitacoesRecebidas(
          Array.isArray(recebidas)
            ? recebidas
            : []
        );

        setSolicitacoesEnviadas(
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
    [obterMensagemErro]
  );

  useEffect(() => {
    let componenteAtivo = true;

    Promise.all([
      listarProdutosFenoRacao(),
      listarUnidadesAtivas(),
      listarSolicitacoesRecebidas(),
      listarSolicitacoesEnviadas(),
      listarTransferencias(),
      listarNotificacoesFenoRacao(),
    ])
      .then(
        ([
          produtosRecebidos,
          unidadesRecebidas,
          recebidas,
          enviadas,
          transferenciasRecebidas,
          notificacoesRecebidas,
        ]) => {
          if (!componenteAtivo) {
            return;
          }

          setProdutos(
            Array.isArray(produtosRecebidos)
              ? produtosRecebidos
              : []
          );

          setUnidades(
            Array.isArray(unidadesRecebidas)
              ? unidadesRecebidas
              : []
          );

          setSolicitacoesRecebidas(
            Array.isArray(recebidas)
              ? recebidas
              : []
          );

          setSolicitacoesEnviadas(
            Array.isArray(enviadas)
              ? enviadas
              : []
          );

          setTransferencias(
            Array.isArray(
              transferenciasRecebidas
            )
              ? transferenciasRecebidas
              : []
          );

          setNotificacoes(
            Array.isArray(
              notificacoesRecebidas
            )
              ? notificacoesRecebidas
              : []
          );

          setErroCarregamento('');
        }
      )
      .catch((error) => {
        if (!componenteAtivo) {
          return;
        }

        console.error(
          'Erro ao carregar dados de transferência:',
          error
        );

        setErroCarregamento(
          obterMensagemErro(error)
        );
      })
      .finally(() => {
        if (componenteAtivo) {
          setCarregandoDados(false);
        }
      });

    return () => {
      componenteAtivo = false;
    };
  }, [obterMensagemErro]);

  const carregarResumoEstoque = useCallback(
    async (unidade) => {
      if (!unidade) {
        setResumoEstoque([]);
        return;
      }

      try {
        setCarregandoResumoEstoque(true);
        setMensagemSolicitacao('');

        const resumo =
          await consultarResumoEstoqueTransferencia(
            unidade
          );

        setResumoEstoque(
          Array.isArray(resumo)
            ? resumo
            : []
        );
      } catch (error) {
        console.error(
          'Erro ao consultar estoque da unidade:',
          error
        );

        setResumoEstoque([]);
        mostrarMensagemSolicitacao(
          obterMensagemErro(error)
        );
      } finally {
        setCarregandoResumoEstoque(false);
      }
    },
    [
      mostrarMensagemSolicitacao,
      obterMensagemErro,
    ]
  );


  const limparFormulario = () => {
    setProdutoId('');
    setQuantidadeSolicitada('');
    setJustificativa('');
    setMensagemSolicitacao('');
  };

  const abrirAnalise = (solicitacao) => {
    setSolicitacaoSelecionada(solicitacao);
    setObservacaoResposta('');
  };

  const fecharAnalise = () => {
    if (processandoResposta) return;

    setSolicitacaoSelecionada(null);
    setObservacaoResposta('');
  };

  const handleMarcarNotificacaoComoLida =
    async (notificacaoId) => {
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

  const enviarSolicitacaoTransferencia =
    async (event) => {
      event.preventDefault();

      if (!admin) {
        mostrarMensagemSolicitacao(
          'Apenas administradores podem solicitar transferência.'
        );
        return;
      }

      if (!unidadeOrigem) {
        mostrarMensagemSolicitacao(
          'Selecione a unidade de origem.'
        );
        return;
      }

      if (!produtoSelecionado) {
        mostrarMensagemSolicitacao(
          'Selecione o produto.'
        );
        return;
      }

      if (
        !Number.isInteger(
          quantidadeSolicitadaNumerica
        ) ||
        quantidadeSolicitadaNumerica <= 0
      ) {
        mostrarMensagemSolicitacao(
          'Informe uma quantidade inteira maior que zero.'
        );
        return;
      }

      if (estoqueInsuficiente) {
        mostrarMensagemSolicitacao(
          `Estoque insuficiente. Disponível: ${formatarNumero(
            quantidadeDisponivel
          )} ${obterUnidadePlural(
            produtoSelecionado.unidadeControle,
            quantidadeDisponivel
          )}.`
        );
        return;
      }

      if (!justificativa.trim()) {
        mostrarMensagemSolicitacao(
          'Informe a justificativa da solicitação.'
        );
        return;
      }

      try {
        setEnviandoSolicitacao(true);

        const solicitacaoCriada =
          await criarSolicitacaoTransferencia({
            produtoId: Number(
              produtoSelecionado.id
            ),
            unidadeOrigem,
            quantidadeSolicitada:
              quantidadeSolicitadaNumerica,
            justificativa:
              justificativa.trim(),
          });

        limparFormulario();

        await carregarDadosTransferencia(false);
        await carregarResumoEstoque(
          unidadeOrigem
        );

        const quantidadeEtapas =
          obterEtapas(
            solicitacaoCriada
          ).length;

        mostrarMensagemSolicitacao(
          quantidadeEtapas > 1
            ? `Solicitação enviada com sucesso e planejada em ${quantidadeEtapas} etapas.`
            : 'Solicitação enviada com sucesso.'
        );
      } catch (error) {
        console.error(
          'Erro ao criar solicitação:',
          error
        );

        const mensagemErro =
          obterMensagemErro(error);

        mostrarMensagemSolicitacao(
          mensagemErro
        );
      } finally {
        setEnviandoSolicitacao(false);
      }
    };

  const negarSolicitacao =
    async () => {
      if (!solicitacaoSelecionada) return;

      const observacao =
        observacaoResposta.trim();

      if (!observacao) {
        mostrarMensagem(
          'Informe o motivo da negativa.'
        );
        return;
      }

      try {
        setProcessandoResposta(true);

        await negarSolicitacaoTransferencia(
          solicitacaoSelecionada.id,
          observacao
        );

        fecharAnalise();
        await carregarDadosTransferencia(false);

        mostrarMensagem(
          'Solicitação negada com sucesso.'
        );
      } catch (error) {
        console.error(
          'Erro ao negar solicitação:',
          error
        );

        mostrarMensagem(
          obterMensagemErro(error)
        );
      } finally {
        setProcessandoResposta(false);
        setSolicitacaoSelecionada(null);
        setObservacaoResposta('');
      }
    };

  const aprovarTransferencia =
    async () => {
      if (!solicitacaoSelecionada) return;

      try {
        setProcessandoResposta(true);

        await aprovarSolicitacaoTransferencia(
          solicitacaoSelecionada.id,
          observacaoResposta.trim()
        );

        await carregarDadosTransferencia(false);

        mostrarMensagem(
          'Transferência aprovada e estoque movimentado com sucesso.'
        );
      } catch (error) {
        console.error(
          'Erro ao aprovar solicitação:',
          error
        );

        mostrarMensagem(
          obterMensagemErro(error)
        );
      } finally {
        setProcessandoResposta(false);
        setSolicitacaoSelecionada(null);
        setObservacaoResposta('');
      }
    };

  if (!admin) {
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
                administradores.
              </p>
            </div>
          </section>
        </section>
      </main>
    );
  }

  const renderizarEtapasSolicitacao = (item) => {
    const etapas = obterEtapas(item);

    if (etapas.length === 0) {
      return null;
    }

    return (
      <div className="transferencia-alimentacao-etapas">
        <strong>
          Planejamento automático:
        </strong>

        {etapas.map((etapa) => (
          <div
            key={etapa.id}
            className="transferencia-alimentacao-etapa"
          >
            <span>
              Etapa {etapa.ordemAtendimento}
            </span>

            <p>
              Lote{' '}
              <strong>
                {etapa.codigoLoteOrigem ||
                  etapa.loteOrigemId}
              </strong>
            </p>

            <p>
              Quantidade prevista:{' '}
              <strong>
                {formatarNumero(
                  etapa.quantidadePrevista
                )}{' '}
                {obterUnidadePlural(
                  item.unidadeControle,
                  etapa.quantidadePrevista
                )}
              </strong>
            </p>

            {etapa.validade && (
              <p>
                Validade:{' '}
                <strong>{etapa.validade}</strong>
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderizarEtapasTransferencia = (item) => {
    const etapas = obterEtapas(item);

    if (etapas.length === 0) {
      return null;
    }

    return (
      <div className="transferencia-alimentacao-etapas">
        <strong>
          Etapas da transferência:
        </strong>

        {etapas.map((etapa) => (
          <div
            key={etapa.id}
            className="transferencia-alimentacao-etapa"
          >
            <span>
              Etapa {etapa.ordemAtendimento}
            </span>

            <p>
              Origem:{' '}
              <strong>
                {etapa.codigoLoteOrigem ||
                  etapa.loteOrigemId}
              </strong>
            </p>

            <p>
              Destino:{' '}
              <strong>
                {etapa.codigoLoteDestino ||
                  etapa.loteDestinoId}
              </strong>
            </p>

            <p>
              Quantidade:{' '}
              <strong>
                {formatarNumero(
                  etapa.quantidadeAprovada
                )}{' '}
                {obterUnidadePlural(
                  item.unidadeControle,
                  etapa.quantidadeAprovada
                )}
              </strong>
            </p>

            <p>
              Saldo da origem:{' '}
              <strong>
                {formatarNumero(
                  etapa.saldoAnteriorOrigem
                )}{' '}
                →{' '}
                {formatarNumero(
                  etapa.saldoPosteriorOrigem
                )}
              </strong>
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="transferencia-alimentacao-page">
      {carregandoDados && (
        <LoadingAmpulheta texto="Carregando dados da transferência..." />
      )}

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
              <strong>
                {notificacoesPendentes.length}
              </strong>
            )}
          </div>
        </header>

        {mensagem && (
          <div className="transferencia-alimentacao-mensagem">
            {mensagem}
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
                Selecione a unidade de origem e o sistema
                distribuirá os lotes automaticamente por FEFO/FIFO.
              </p>
            </div>
          </div>

          <form
            className="transferencia-alimentacao-form"
            onSubmit={
              enviarSolicitacaoTransferencia
            }
          >
            <div className="transferencia-alimentacao-form-group">
              <label htmlFor="unidadeOrigemTransferencia">
                Unidade de origem
              </label>

              <select
                id="unidadeOrigemTransferencia"
                value={unidadeOrigem}
                onChange={(event) => {
                  const novaUnidade =
                    event.target.value;

                  setUnidadeOrigem(
                    novaUnidade
                  );

                  setProdutoId('');
                  setQuantidadeSolicitada('');
                  setResumoEstoque([]);
                  setMensagemSolicitacao('');

                  if (novaUnidade) {
                    carregarResumoEstoque(
                      novaUnidade
                    );
                  }
                }}
              >
                <option value="">
                  Selecione a unidade
                </option>

                {unidadesDisponiveis.map(
                  (unidade) => {
                    const valor =
                      unidade.sigla ||
                      unidade.nome;

                    return (
                      <option
                        key={unidade.id}
                        value={valor}
                      >
                        {unidade.nome}
                        {unidade.sigla &&
                          unidade.sigla !==
                            unidade.nome &&
                          ` (${unidade.sigla})`}
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            <div className="transferencia-alimentacao-form-group">
              <label htmlFor="produtoTransferencia">
                Produto
              </label>

              <select
                id="produtoTransferencia"
                value={produtoId}
                disabled={
                  !unidadeOrigem ||
                  carregandoResumoEstoque
                }
                onChange={(event) => {
                  setProdutoId(
                    event.target.value
                  );
                  setQuantidadeSolicitada('');
                  setMensagemSolicitacao('');
                }}
              >
                <option value="">
                  {carregandoResumoEstoque
                    ? 'Consultando estoque...'
                    : unidadeOrigem
                      ? 'Selecione o produto'
                      : 'Selecione primeiro a unidade'}
                </option>

                {produtosComEstoque.map((produto) => (
                  <option
                    key={produto.id}
                    value={produto.id}
                  >
                    {obterNomeProduto(produto)}
                    {' — '}
                    {formatarNumero(
                      produto.pesoUnidadeKg
                    )}{' '}
                    kg
                    {' — '}
                    {formatarNumero(
                      produto.quantidadeDisponivel
                    )}{' '}
                    {obterUnidadePlural(
                      produto.unidadeControle,
                      produto.quantidadeDisponivel
                    )}{' '}
                    disponíveis
                  </option>
                ))}
              </select>
            </div>

            {produtoSelecionado && (
              <div className="transferencia-alimentacao-estoque-info">
                <div>
                  <span>Tipo</span>
                  <strong>
                    {produtoSelecionado.tipoProduto}
                  </strong>
                </div>

                <div>
                  <span>Unidade de controle</span>
                  <strong>
                    {produtoSelecionado.unidadeControle}
                  </strong>
                </div>

                <div>
                  <span>Peso por unidade</span>
                  <strong>
                    {formatarNumero(
                      produtoSelecionado.pesoUnidadeKg
                    )}{' '}
                    kg
                  </strong>
                </div>

                <div>
                  <span>Disponível</span>
                  <strong>
                    {formatarNumero(
                      produtoSelecionado.quantidadeDisponivel
                    )}{' '}
                    {obterUnidadePlural(
                      produtoSelecionado.unidadeControle,
                      produtoSelecionado.quantidadeDisponivel
                    )}
                  </strong>
                </div>

                <div>
                  <span>Peso disponível</span>
                  <strong>
                    {formatarNumero(
                      produtoSelecionado.pesoTotalDisponivelKg
                    )}{' '}
                    kg
                  </strong>
                </div>

                <div>
                  <span>Lotes elegíveis</span>
                  <strong>
                    {formatarNumero(
                      produtoSelecionado.quantidadeLotes
                    )}
                  </strong>
                </div>
              </div>
            )}

            <div className="transferencia-alimentacao-form-group">
              <label htmlFor="quantidadeTransferencia">
                Quantidade solicitada
              </label>

              <input
                id="quantidadeTransferencia"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={quantidadeSolicitada}
                placeholder="Informe a quantidade"
                disabled={!produtoSelecionado}
                onChange={(event) => {
                  setQuantidadeSolicitada(
                    event.target.value
                  );
                  setMensagemSolicitacao('');
                }}
              />
            </div>

            {estoqueInsuficiente && (
              <div
                className="transferencia-alimentacao-mensagem"
                role="alert"
              >
                <FaTriangleExclamation />
                <span>
                  Estoque insuficiente. Disponível:{' '}
                  <strong>
                    {formatarNumero(
                      quantidadeDisponivel
                    )}{' '}
                    {obterUnidadePlural(
                      produtoSelecionado.unidadeControle,
                      quantidadeDisponivel
                    )}
                  </strong>
                  .
                </span>
              </div>
            )}

            <div className="transferencia-alimentacao-resumo">
              <div>
                <span>Quantidade solicitada</span>
                <strong>
                  {quantidadeSolicitadaNumerica > 0
                    ? `${formatarNumero(
                        quantidadeSolicitadaNumerica
                      )} ${obterUnidadePlural(
                        produtoSelecionado?.unidadeControle,
                        quantidadeSolicitadaNumerica
                      )}`
                    : '0'}
                </strong>
              </div>

              <div>
                <span>Peso total solicitado</span>
                <strong>
                  {formatarNumero(
                    pesoTotalSolicitadoKg
                  )}{' '}
                  kg
                </strong>
              </div>

              <div className="transferencia-alimentacao-resumo-total">
                <span>Unidade de origem</span>
                <strong>{unidadeOrigem}</strong>
              </div>
            </div>

            <div className="transferencia-alimentacao-form-group">
              <label htmlFor="justificativaTransferencia">
                Justificativa
              </label>

              <textarea
                id="justificativaTransferencia"
                value={justificativa}
                maxLength={500}
                placeholder="Explique o motivo da solicitação"
                onChange={(event) => {
                  setJustificativa(
                    event.target.value
                  );
                  setMensagemSolicitacao('');
                }}
              />
            </div>

            {mensagemSolicitacao && (
              <div
                className="transferencia-alimentacao-mensagem"
                role="alert"
                aria-live="assertive"
              >
                <FaTriangleExclamation />
                <span>{mensagemSolicitacao}</span>
              </div>
            )}

            <button
              type="submit"
              className="transferencia-alimentacao-enviar"
              disabled={
                enviandoSolicitacao ||
                !unidadeOrigem ||
                !produtoSelecionado ||
                estoqueInsuficiente
              }
            >
              <FaPaperPlane />
              {enviandoSolicitacao
                ? 'Enviando...'
                : 'Enviar solicitação'}
            </button>
          </form>
        </section>

        <section className="transferencia-alimentacao-card">
          <div className="transferencia-alimentacao-lista-header">
            <div>
              <span>Recebidas</span>
              <h2>Solicitações para analisar</h2>
            </div>

            <strong>
              {solicitacoesRecebidas.length}
            </strong>
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
                  className={`transferencia-alimentacao-item status-${String(
                    item.status
                  ).toLowerCase()}`}
                >
                  <div className="transferencia-alimentacao-item-icon">
                    <GiGrain />
                  </div>

                  <div className="transferencia-alimentacao-item-info">
                    <span>{item.status}</span>
                    <h3>{item.nomeProduto}</h3>

                    <p>
                      {item.unidadeSolicitante}{' '}
                      solicitou{' '}
                      <strong>
                        {formatarNumero(
                          item.quantidadeSolicitada
                        )}{' '}
                        {obterUnidadePlural(
                          item.unidadeControle,
                          item.quantidadeSolicitada
                        )}{' '}
                        de{' '}
                        {formatarNumero(
                          item.pesoUnidadeKg
                        )}{' '}
                        kg
                      </strong>
                    </p>

                    <p>
                      Peso total:{' '}
                      <strong>
                        {formatarNumero(
                          item.pesoTotalSolicitadoKg
                        )}{' '}
                        kg
                      </strong>
                    </p>

                    <p>{item.justificativa}</p>

                    {renderizarEtapasSolicitacao(
                      item
                    )}

                    <small>
                      {formatarDataHora(
                        item.dataSolicitacao
                      )}
                    </small>
                  </div>

                  {item.status === 'PENDENTE' && (
                    <button
                      type="button"
                      className="transferencia-alimentacao-analisar"
                      onClick={() =>
                        abrirAnalise(item)
                      }
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

            <strong>
              {solicitacoesEnviadas.length}
            </strong>
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
                  className={`transferencia-alimentacao-item status-${String(
                    item.status
                  ).toLowerCase()}`}
                >
                  <div className="transferencia-alimentacao-item-icon">
                    <FaRightLeft />
                  </div>

                  <div className="transferencia-alimentacao-item-info">
                    <span>{item.status}</span>
                    <h3>{item.nomeProduto}</h3>

                    <p>
                      Origem:{' '}
                      <strong>
                        {item.unidadeOrigem}
                      </strong>
                    </p>

                    <p>
                      Quantidade:{' '}
                      <strong>
                        {formatarNumero(
                          item.quantidadeSolicitada
                        )}{' '}
                        {obterUnidadePlural(
                          item.unidadeControle,
                          item.quantidadeSolicitada
                        )}
                      </strong>
                    </p>

                    {renderizarEtapasSolicitacao(
                      item
                    )}

                    {item.observacaoResposta && (
                      <p>
                        Resposta:{' '}
                        <strong>
                          {item.observacaoResposta}
                        </strong>
                      </p>
                    )}

                    <small>
                      {formatarDataHora(
                        item.dataSolicitacao
                      )}
                    </small>
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

            <strong>
              {transferencias.length}
            </strong>
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
                      {item.unidadeOrigem} →{' '}
                      {item.unidadeDestino}
                    </p>

                    <p>
                      Quantidade:{' '}
                      <strong>
                        {formatarNumero(
                          item.quantidadeTransferida
                        )}{' '}
                        {obterUnidadePlural(
                          item.unidadeControle,
                          item.quantidadeTransferida
                        )}{' '}
                        de{' '}
                        {formatarNumero(
                          item.pesoUnidadeKg
                        )}{' '}
                        kg
                      </strong>
                    </p>

                    <p>
                      Peso total:{' '}
                      <strong>
                        {formatarNumero(
                          item.pesoTotalKg
                        )}{' '}
                        kg
                      </strong>
                    </p>

                    {renderizarEtapasTransferencia(
                      item
                    )}

                    <small>
                      {formatarDataHora(
                        item.dataTransferencia
                      )}
                    </small>
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
                <strong>
                  {
                    solicitacaoSelecionada.unidadeSolicitante
                  }
                </strong>{' '}
                solicitou{' '}
                <strong>
                  {formatarNumero(
                    solicitacaoSelecionada.quantidadeSolicitada
                  )}{' '}
                  {obterUnidadePlural(
                    solicitacaoSelecionada.unidadeControle,
                    solicitacaoSelecionada.quantidadeSolicitada
                  )}{' '}
                  de{' '}
                  {formatarNumero(
                    solicitacaoSelecionada.pesoUnidadeKg
                  )}{' '}
                  kg
                </strong>{' '}
                de{' '}
                <strong>
                  {
                    solicitacaoSelecionada.nomeProduto
                  }
                </strong>
                .
              </p>

              <div className="transferencia-alimentacao-modal-resumo">
                <span>
                  Estoque visto no momento do pedido
                </span>

                <strong>
                  {formatarNumero(
                    solicitacaoSelecionada.quantidadeDisponivelNoPedido
                  )}{' '}
                  {obterUnidadePlural(
                    solicitacaoSelecionada.unidadeControle,
                    solicitacaoSelecionada.quantidadeDisponivelNoPedido
                  )}
                </strong>

                <span>Peso total solicitado</span>

                <strong>
                  {formatarNumero(
                    solicitacaoSelecionada.pesoTotalSolicitadoKg
                  )}{' '}
                  kg
                </strong>

                <span>Justificativa</span>

                <strong>
                  {
                    solicitacaoSelecionada.justificativa
                  }
                </strong>
              </div>

              {renderizarEtapasSolicitacao(
                solicitacaoSelecionada
              )}

              <label className="transferencia-alimentacao-modal-label">
                Observação da aprovação ou motivo da negativa

                <textarea
                  value={observacaoResposta}
                  maxLength={500}
                  placeholder="Obrigatório para negar. Opcional para aprovar."
                  onChange={(event) =>
                    setObservacaoResposta(
                      event.target.value
                    )
                  }
                />
              </label>

              <div className="transferencia-alimentacao-modal-actions">
                <button
                  type="button"
                  className="transferencia-alimentacao-aprovar"
                  disabled={processandoResposta}
                  onClick={aprovarTransferencia}
                >
                  <FaCircleCheck />
                  {processandoResposta
                    ? 'Processando...'
                    : 'Aprovar e transferir'}
                </button>

                <button
                  type="button"
                  className="transferencia-alimentacao-negar"
                  disabled={processandoResposta}
                  onClick={negarSolicitacao}
                >
                  <FaXmark />
                  Negar
                </button>

                <button
                  type="button"
                  className="transferencia-alimentacao-fechar"
                  disabled={processandoResposta}
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