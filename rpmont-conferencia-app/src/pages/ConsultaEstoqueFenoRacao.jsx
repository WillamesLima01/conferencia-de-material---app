import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FaArrowLeft,
  FaArrowsRotate,
  FaFilter,
  FaMagnifyingGlass,
  FaTriangleExclamation,
  FaWheatAwn,
} from 'react-icons/fa6';

import { GiGrain } from 'react-icons/gi';

import {
  listarEstoqueFenoRacao,
} from '../services/fenoRacaoEstoqueService';

import {
  listarUnidadesAtivas,
} from '../services/unidadeService';

import '../styles/ConsultaEstoqueFenoRacao.css';

const NIVEIS_USUARIO = {
  ADMIN_MASTER: 1,
  ADMIN: 2,
  USUARIO_COMUM: 3,
};

const PRODUTOS = [
  {
    valor: 'TODOS',
    nome: 'Todos os produtos',
  },
  {
    valor: 'FENO',
    nome: 'Feno',
  },
  {
    valor: 'RACAO_ADULTO_PREMIUM',
    nome: 'Ração Adulto Premium',
  },
  {
    valor: 'RACAO_ADULTO_MANUTENCAO',
    nome: 'Ração Adulto Manutenção',
  },
  {
    valor: 'RACAO_POTRO_PREMIUM',
    nome: 'Ração Potro Premium',
  },
  {
    valor: 'RACAO_POTRO_MANUTENCAO',
    nome: 'Ração Potro Manutenção',
  },
];

const SITUACOES = [
  {
    valor: 'TODAS',
    nome: 'Todos os registros',
  },
  {
    valor: 'ATIVO',
    nome: 'Registros ativos',
  },
  {
    valor: 'INATIVO',
    nome: 'Registros inativos',
  },
  {
    valor: 'ESGOTADO',
    nome: 'Registros esgotados',
  },
  {
    valor: 'CANCELADO',
    nome: 'Registros cancelados',
  },
];

const normalizarTexto = (valor) => {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/º/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
};

const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatarData = (valor) => {
  if (!valor) {
    return '-';
  }

  const dataSemHorario = String(valor).split('T')[0];
  const [ano, mes, dia] = dataSemHorario.split('-');

  if (!ano || !mes || !dia) {
    return String(valor);
  }

  return `${dia}/${mes}/${ano}`;
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

const obterUnidadeUsuario = (usuario) => {
  return (
    usuario?.unidade ||
    usuario?.UNIDADE ||
    usuario?.Unidade ||
    ''
  );
};

const obterNomeProduto = (item) => {
  if (item?.nomeProduto) {
    return item.nomeProduto;
  }

  const produto = PRODUTOS.find(
    (opcao) =>
      opcao.valor === item?.tipoProduto
  );

  return (
    produto?.nome ||
    item?.tipoProduto ||
    '-'
  );
};

const obterCodigoLote = (item) => {
  return (
    item?.codigoLote ||
    item?.lote ||
    '-'
  );
};

const obterSituacao = (item) => {
  const situacaoInformada = normalizarTexto(
    item?.situacao
  );

  if (situacaoInformada) {
    return situacaoInformada;
  }

  return Number(item?.quantidadeAtual || 0) > 0
    ? 'ATIVO'
    : 'ESGOTADO';
};

const obterMensagemErro = (error) => {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    'Não foi possível consultar o estoque.'
  );
};

const obterUnidadesDaResposta = (
  resposta,
  unidadeUsuario
) => {
  const dadosPossiveis = [
    resposta,
    resposta?.data,
    resposta?.content,
    resposta?.dados,
  ];

  const unidadesRecebidas =
    dadosPossiveis.find(Array.isArray) || [];

  const mapa = new Map();

  unidadesRecebidas.forEach((unidade) => {
    const nomeUnidade = String(
      unidade?.sigla ??
        unidade?.nome ??
        unidade?.unidade ??
        unidade?.descricao ??
        ''
    ).trim();

    if (!nomeUnidade) {
      return;
    }

    const situacao = normalizarTexto(
      unidade?.situacao ??
        unidade?.status ??
        ''
    );

    const ativoInformado =
      unidade?.ativo ??
      unidade?.ATIVO;

    const unidadeAtiva =
      ativoInformado === undefined ||
      ativoInformado === null ||
      ativoInformado === true ||
      Number(ativoInformado) === 1 ||
      situacao === 'ATIVO';

    if (!unidadeAtiva) {
      return;
    }

    const chave = normalizarTexto(
      nomeUnidade
    );

    if (!mapa.has(chave)) {
      mapa.set(chave, nomeUnidade);
    }
  });

  const unidadeUsuarioNormalizada =
    String(unidadeUsuario || '').trim();

  if (unidadeUsuarioNormalizada) {
    const chaveUsuario = normalizarTexto(
      unidadeUsuarioNormalizada
    );

    if (!mapa.has(chaveUsuario)) {
      mapa.set(
        chaveUsuario,
        unidadeUsuarioNormalizada
      );
    }
  }

  return Array.from(mapa.values()).sort(
    (a, b) =>
      String(a).localeCompare(String(b))
  );
};

const obterEstoqueDaResposta = (resposta) => {
  if (Array.isArray(resposta)) {
    return resposta;
  }

  if (Array.isArray(resposta?.content)) {
    return resposta.content;
  }

  if (Array.isArray(resposta?.data)) {
    return resposta.data;
  }

  if (Array.isArray(resposta?.dados)) {
    return resposta.dados;
  }

  return [];
};

const ordenarRegistros = (registros) => {
  return [...registros].sort((a, b) => {
    const dataA = String(
      a?.dataEntrada || ''
    );

    const dataB = String(
      b?.dataEntrada || ''
    );

    if (dataA !== dataB) {
      return dataB.localeCompare(dataA);
    }

    return obterCodigoLote(a).localeCompare(
      obterCodigoLote(b)
    );
  });
};

function ConsultaEstoqueFenoRacao({
  usuario,
  onVoltar,
}) {
  const nivelUsuario =
    obterNivelUsuario(usuario);

  const unidadeUsuario =
    obterUnidadeUsuario(usuario);

  const podeSelecionarUnidade =
    nivelUsuario ===
      NIVEIS_USUARIO.ADMIN_MASTER ||
    nivelUsuario === NIVEIS_USUARIO.ADMIN;

  const [
    unidadeSelecionada,
    setUnidadeSelecionada,
  ] = useState(() => {
    return unidadeUsuario;
  });

  const [
    produtoSelecionado,
    setProdutoSelecionado,
  ] = useState('TODOS');

  const [
    situacaoSelecionada,
    setSituacaoSelecionada,
  ] = useState('TODAS');

  const [
    lotePesquisado,
    setLotePesquisado,
  ] = useState('');

  const [
    dataInicial,
    setDataInicial,
  ] = useState('');

  const [
    dataFinal,
    setDataFinal,
  ] = useState('');

  const [estoque, setEstoque] =
    useState([]);

  const [
    unidades,
    setUnidades,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [erro, setErro] =
    useState('');

  const carregarDados =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro('');

        const [
          respostaEstoque,
          respostaUnidades,
        ] = await Promise.all([
          listarEstoqueFenoRacao(),
          listarUnidadesAtivas(),
        ]);

        setEstoque(
          ordenarRegistros(
            obterEstoqueDaResposta(
              respostaEstoque
            )
          )
        );

        setUnidades(
          obterUnidadesDaResposta(
            respostaUnidades,
            unidadeUsuario
          )
        );
      } catch (error) {
        console.error(
          'Erro ao consultar estoque:',
          error
        );

        setErro(
          obterMensagemErro(error)
        );

        setEstoque([]);
        setUnidades([]);
      } finally {
        setCarregando(false);
      }
    }, [unidadeUsuario]);

  useEffect(() => {
    let componenteAtivo = true;

    Promise.all([
      listarEstoqueFenoRacao(),
      listarUnidadesAtivas(),
    ])
      .then(
        ([
          respostaEstoque,
          respostaUnidades,
        ]) => {
          if (!componenteAtivo) {
            return;
          }

          setEstoque(
            ordenarRegistros(
              obterEstoqueDaResposta(
                respostaEstoque
              )
            )
          );

          setUnidades(
            obterUnidadesDaResposta(
              respostaUnidades,
              unidadeUsuario
            )
          );

          setErro('');
        }
      )
      .catch((error) => {
        if (!componenteAtivo) {
          return;
        }

        console.error(
          'Erro ao consultar estoque:',
          error
        );

        setErro(
          obterMensagemErro(error)
        );

        setEstoque([]);
        setUnidades([]);
      })
      .finally(() => {
        if (componenteAtivo) {
          setCarregando(false);
        }
      });

    return () => {
      componenteAtivo = false;
    };
  }, [unidadeUsuario]);

  const unidadeFoiInformada =
    !podeSelecionarUnidade ||
    Boolean(unidadeSelecionada);

  const estoqueFiltrado =
    useMemo(() => {
      if (!unidadeFoiInformada) {
        return [];
      }

      return estoque.filter((item) => {
        const unidadeItem =
          normalizarTexto(
            item?.unidade
          );

        const unidadeFiltro =
          normalizarTexto(
            podeSelecionarUnidade
              ? unidadeSelecionada
              : unidadeUsuario
          );

        const produtoConfere =
          produtoSelecionado ===
            'TODOS' ||
          item?.tipoProduto ===
            produtoSelecionado;

        const situacaoItem =
          obterSituacao(item);

        const situacaoConfere =
          situacaoSelecionada ===
            'TODAS' ||
          situacaoItem ===
            situacaoSelecionada;

        const loteConfere =
          !lotePesquisado.trim() ||
          normalizarTexto(
            obterCodigoLote(item)
          ).includes(
            normalizarTexto(
              lotePesquisado
            )
          );

        const dataEntrada = String(
          item?.dataEntrada || ''
        ).split('T')[0];

        const periodoConfere =
          (!dataInicial ||
            dataEntrada >= dataInicial) &&
          (!dataFinal ||
            dataEntrada <= dataFinal);

        return (
          unidadeItem ===
            unidadeFiltro &&
          produtoConfere &&
          situacaoConfere &&
          loteConfere &&
          periodoConfere
        );
      });
    }, [
      estoque,
      unidadeFoiInformada,
      podeSelecionarUnidade,
      unidadeSelecionada,
      unidadeUsuario,
      produtoSelecionado,
      situacaoSelecionada,
      lotePesquisado,
      dataInicial,
      dataFinal,
    ]);

  const resumo = useMemo(() => {
    return estoqueFiltrado.reduce(
      (acumulador, item) => {
        const situacao =
          obterSituacao(item);

        const quantidadeAtual =
          Number(
            item?.quantidadeAtual || 0
          );

        const pesoUnidade =
          Number(
            item?.pesoUnidadeKg || 0
          );

        acumulador.total += 1;

        if (situacao === 'ATIVO') {
          acumulador.ativos += 1;
        }

        if (situacao === 'INATIVO') {
          acumulador.inativos += 1;
        }

        if (situacao === 'ESGOTADO') {
          acumulador.esgotados += 1;
        }

        if (situacao === 'CANCELADO') {
          acumulador.cancelados += 1;
        }

        acumulador.quantidadeAtual +=
          quantidadeAtual;

        acumulador.pesoAtual +=
          quantidadeAtual *
          pesoUnidade;

        return acumulador;
      },
      {
        total: 0,
        ativos: 0,
        inativos: 0,
        esgotados: 0,
        cancelados: 0,
        quantidadeAtual: 0,
        pesoAtual: 0,
      }
    );
  }, [estoqueFiltrado]);

  const limparFiltros = () => {
    setProdutoSelecionado('TODOS');
    setSituacaoSelecionada('TODAS');
    setLotePesquisado('');
    setDataInicial('');
    setDataFinal('');

    setUnidadeSelecionada(
      unidadeUsuario
    );
  };

  return (
    <main className="consulta-estoque-fr-page">
      <section className="consulta-estoque-fr-phone">
        <header className="consulta-estoque-fr-header">
          <button
            type="button"
            className="consulta-estoque-fr-voltar"
            onClick={onVoltar}
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Alimentação equina</span>
            <h1>Consultar Estoque</h1>
            <p>
              Estoque de feno e ração
            </p>
          </div>

          <button
            type="button"
            className="consulta-estoque-fr-atualizar"
            onClick={carregarDados}
            disabled={carregando}
            aria-label="Atualizar estoque"
          >
            <FaArrowsRotate />
          </button>
        </header>

        <section className="consulta-estoque-fr-filtros-card">
          <div className="consulta-estoque-fr-section-title">
            <FaFilter />

            <div>
              <h2>Filtros da consulta</h2>
              <p>
                Todos os registros serão exibidos
                conforme os filtros selecionados.
              </p>
            </div>
          </div>

          <div className="consulta-estoque-fr-filtros">
            <div className="consulta-estoque-fr-form-group">
              <label htmlFor="estoqueUnidade">
                {podeSelecionarUnidade
                  ? 'Informe a unidade requerida'
                  : 'Unidade consultada'}
              </label>

              {podeSelecionarUnidade ? (
                <select
                  id="estoqueUnidade"
                  value={unidadeSelecionada}
                  onChange={(event) =>
                    setUnidadeSelecionada(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Selecione uma unidade
                  </option>

                  {unidades.map((unidade) => (
                    <option
                      key={unidade}
                      value={unidade}
                    >
                      {unidade}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="estoqueUnidade"
                  type="text"
                  value={unidadeUsuario}
                  readOnly
                />
              )}
            </div>

            <div className="consulta-estoque-fr-form-group">
              <label htmlFor="estoqueProduto">
                Produto
              </label>

              <select
                id="estoqueProduto"
                value={produtoSelecionado}
                onChange={(event) =>
                  setProdutoSelecionado(
                    event.target.value
                  )
                }
              >
                {PRODUTOS.map((produto) => (
                  <option
                    key={produto.valor}
                    value={produto.valor}
                  >
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="consulta-estoque-fr-form-group">
              <label htmlFor="estoqueSituacao">
                Situação do registro
              </label>

              <select
                id="estoqueSituacao"
                value={situacaoSelecionada}
                onChange={(event) =>
                  setSituacaoSelecionada(
                    event.target.value
                  )
                }
              >
                {SITUACOES.map((situacao) => (
                  <option
                    key={situacao.valor}
                    value={situacao.valor}
                  >
                    {situacao.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="consulta-estoque-fr-form-group">
              <label htmlFor="estoqueLote">
                Código do lote
              </label>

              <div className="consulta-estoque-fr-input-icon">
                <FaMagnifyingGlass />

                <input
                  id="estoqueLote"
                  type="text"
                  value={lotePesquisado}
                  onChange={(event) =>
                    setLotePesquisado(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: L-0001"
                />
              </div>
            </div>

            <div className="consulta-estoque-fr-form-group">
              <label htmlFor="estoqueDataInicial">
                Entrada inicial
              </label>

              <input
                id="estoqueDataInicial"
                type="date"
                value={dataInicial}
                onChange={(event) =>
                  setDataInicial(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="consulta-estoque-fr-form-group">
              <label htmlFor="estoqueDataFinal">
                Entrada final
              </label>

              <input
                id="estoqueDataFinal"
                type="date"
                value={dataFinal}
                onChange={(event) =>
                  setDataFinal(
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <button
            type="button"
            className="consulta-estoque-fr-limpar"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>

          {podeSelecionarUnidade &&
            unidadeSelecionada &&
            normalizarTexto(
              unidadeSelecionada
            ) !==
              normalizarTexto(
                unidadeUsuario
              ) && (
              <div className="consulta-estoque-fr-aviso-consulta">
                Consulta somente para planejamento de
                transferência. As alterações de estoque
                permanecem restritas à unidade responsável.
              </div>
            )}
        </section>

        {erro && (
          <section className="consulta-estoque-fr-erro">
            <FaTriangleExclamation />

            <div>
              <strong>
                Não foi possível carregar o estoque
              </strong>
              <p>{erro}</p>
            </div>
          </section>
        )}

        {!unidadeFoiInformada ? (
          <section className="consulta-estoque-fr-listagem">
            <div className="consulta-estoque-fr-vazio">
              Informe a unidade requerida para
              consultar o estoque de feno e ração.
            </div>
          </section>
        ) : (
          <>
            <section className="consulta-estoque-fr-resumo">
              <article>
                <span>Registros</span>
                <strong>
                  {resumo.total}
                </strong>
              </article>

              <article>
                <span>Ativos</span>
                <strong>
                  {resumo.ativos}
                </strong>
              </article>

              <article>
                <span>Inativos</span>
                <strong>
                  {resumo.inativos}
                </strong>
              </article>

              <article>
                <span>Esgotados</span>
                <strong>
                  {resumo.esgotados}
                </strong>
              </article>

              <article>
                <span>Cancelados</span>
                <strong>
                  {resumo.cancelados}
                </strong>
              </article>

              <article>
                <span>Saldo</span>
                <strong>
                  {formatarNumero(
                    resumo.quantidadeAtual
                  )}
                </strong>
              </article>

              <article>
                <span>Peso atual</span>
                <strong>
                  {formatarNumero(
                    resumo.pesoAtual
                  )}{' '}
                  kg
                </strong>
              </article>
            </section>

            <section className="consulta-estoque-fr-listagem">
              <div className="consulta-estoque-fr-lista-topo">
                <div>
                  <span>Estoque registrado</span>
                  <h2>
                    Todos os registros filtrados
                  </h2>
                </div>

                <strong>
                  {estoqueFiltrado.length}
                </strong>
              </div>

              {carregando ? (
                <div className="consulta-estoque-fr-vazio">
                  Carregando estoque...
                </div>
              ) : estoqueFiltrado.length === 0 ? (
                <div className="consulta-estoque-fr-vazio">
                  Nenhum registro encontrado para
                  os filtros selecionados.
                </div>
              ) : (
                <div className="consulta-estoque-fr-lista">
                  {estoqueFiltrado.map((item) => {
                    const situacao =
                      obterSituacao(item);

                    const quantidadeAtual =
                      Number(
                        item?.quantidadeAtual || 0
                      );

                    const pesoUnidade =
                      Number(
                        item?.pesoUnidadeKg || 0
                      );

                    const pesoAtual =
                      quantidadeAtual *
                      pesoUnidade;

                    return (
                      <article
                        key={
                          item?.id ||
                          item?.loteId ||
                          `${obterCodigoLote(item)}-${item?.unidade}`
                        }
                        className={`consulta-estoque-fr-item consulta-estoque-fr-item-${situacao.toLowerCase()}`}
                      >
                        <div className="consulta-estoque-fr-item-icon">
                          {item?.tipoProduto ===
                          'FENO' ? (
                            <FaWheatAwn />
                          ) : (
                            <GiGrain />
                          )}
                        </div>

                        <div className="consulta-estoque-fr-item-info">
                          <span>
                            {obterNomeProduto(item)}
                          </span>

                          <h3>
                            {formatarNumero(
                              quantidadeAtual
                            )}{' '}
                            {item?.unidadeControle ||
                              'unidades'}{' '}
                            disponíveis de{' '}
                            {formatarNumero(
                              pesoUnidade
                            )}{' '}
                            kg
                          </h3>

                          <p>
                            Quantidade inicial:{' '}
                            <strong>
                              {formatarNumero(
                                item?.quantidadeInicial
                              )}
                            </strong>
                            {' · '}
                            Peso atual:{' '}
                            <strong>
                              {formatarNumero(
                                pesoAtual
                              )}{' '}
                              kg
                            </strong>
                          </p>

                          <div className="consulta-estoque-fr-tags">
                            <span>
                              {situacao}
                            </span>

                            <span>
                              Lote:{' '}
                              {obterCodigoLote(item)}
                            </span>

                            <span>
                              Entrada:{' '}
                              {formatarData(
                                item?.dataEntrada
                              )}
                            </span>

                            <span>
                              Validade:{' '}
                              {formatarData(
                                item?.validade
                              )}
                            </span>

                            <span>
                              {item?.unidade || '-'}
                            </span>
                          </div>

                          <details className="consulta-estoque-fr-detalhes">
                            <summary>
                              Ver detalhes
                            </summary>

                            <div>
                              <p>
                                <strong>
                                  Fornecedor:
                                </strong>{' '}
                                {item?.fornecedor || '-'}
                              </p>

                              <p>
                                <strong>
                                  Documento:
                                </strong>{' '}
                                {item?.numeroDocumento ||
                                  '-'}
                              </p>

                              <p>
                                <strong>
                                  Responsável:
                                </strong>{' '}
                                {item?.responsavelRecebimento ||
                                  item?.responsavel ||
                                  '-'}
                              </p>

                              <p>
                                <strong>
                                  Observação:
                                </strong>{' '}
                                {item?.observacao || '-'}
                              </p>
                            </div>
                          </details>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default ConsultaEstoqueFenoRacao;