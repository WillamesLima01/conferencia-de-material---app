import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  FaArrowLeft,
  FaBoxesStacked,
  FaCalendarDays,
  FaCircleCheck,
  FaClockRotateLeft,
  FaFloppyDisk,
  FaTriangleExclamation,
  FaXmark,
} from 'react-icons/fa6';

import {
  ajustarExtravioFenoRacao,
  cancelarExtravioFenoRacao,
  confirmarExtravioFenoRacao,
  listarEstoqueFenoRacao,
  listarMovimentacoesFenoRacao,
  registrarExtravioFenoRacao,
} from '../services/fenoRacaoEstoqueService';

import '../styles/ExtravioFenoRacao.css';

const PRODUTOS = [
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

const NIVEL_ADMIN_MASTER = 1;
const NIVEL_ADMIN = 2;

const UNIDADES_EQUINAS = [
  'RPMONT',
  '3EPMONT',
];

const DATA_INICIAL_PENDENCIAS =
  '2000-01-01';

const dataHoje = () => {
  const agora = new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const dia =
    String(
      agora.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${ano}-${mes}-${dia}`;
};

const normalizarTexto = (
  valor
) =>
  String(
    valor ?? ''
  )
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /º/g,
      ''
    )
    .replace(
      /°/g,
      ''
    )
    .replace(
      /\s+/g,
      ''
    )
    .replace(
      /[^A-Z0-9]/g,
      ''
    );

const formatarNumero = (
  valor
) =>
  new Intl.NumberFormat(
    'pt-BR',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(
      valor || 0
    )
  );

const formatarData = (
  valor
) => {
  if (!valor) {
    return '-';
  }

  const dataSemHorario =
    String(valor).split(
      'T'
    )[0];

  const [
    ano,
    mes,
    dia,
  ] =
    dataSemHorario.split(
      '-'
    );

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return String(
      valor
    );
  }

  return `${dia}/${mes}/${ano}`;
};

const obterNomeProduto = (
  tipo
) =>
  PRODUTOS.find(
    (produto) =>
      produto.valor === tipo
  )?.nome ||
  tipo ||
  '-';

const obterStatusAnalise = (
  situacao
) => {
  switch (situacao) {
    case 'PENDENTE_ANALISE':
      return {
        texto: 'Pendente',
        classe: 'pendente',
      };

    case 'CONFIRMADO':
      return {
        texto: 'Confirmado',
        classe: 'confirmado',
      };

    case 'AJUSTADO':
      return {
        texto: 'Ajustado',
        classe: 'ajustado',
      };

    case 'CANCELADO':
      return {
        texto: 'Cancelado',
        classe: 'cancelado',
      };

    default:
      return null;
  }
};

const extrairLista = (
  resposta
) => {
  if (
    Array.isArray(
      resposta
    )
  ) {
    return resposta;
  }

  if (
    Array.isArray(
      resposta?.content
    )
  ) {
    return resposta.content;
  }

  if (
    Array.isArray(
      resposta?.data
    )
  ) {
    return resposta.data;
  }

  if (
    Array.isArray(
      resposta?.dados
    )
  ) {
    return resposta.dados;
  }

  if (
    Array.isArray(
      resposta?.itens
    )
  ) {
    return resposta.itens;
  }

  return [];
};

const obterMensagemErro = (
  erro,
  padrao
) => {
  const dados =
    erro?.response?.data ??
    erro?.data ??
    erro?.body ??
    null;

  if (
    typeof dados ===
      'string' &&
    dados.trim()
  ) {
    return dados.trim();
  }

  const mensagem =
    dados?.message ??
    dados?.mensagem ??
    dados?.error ??
    erro?.message ??
    erro?.mensagem;

  if (
    typeof mensagem ===
      'string' &&
    mensagem.trim()
  ) {
    return mensagem.trim();
  }

  if (
    dados?.fields &&
    typeof dados.fields ===
      'object'
  ) {
    const mensagens =
      Object.values(
        dados.fields
      )
        .flat()
        .filter(Boolean)
        .map(
          (valor) =>
            String(
              valor
            ).trim()
        )
        .filter(Boolean);

    if (
      mensagens.length >
      0
    ) {
      return mensagens.join(
        ' '
      );
    }
  }

  return padrao;
};

function ExtravioFenoRacao({
  usuario,
  onVoltar,
}) {
  const mensagemRef =
    useRef(null);

  const unidadeUsuario =
    usuario?.unidade ||
    usuario?.UNIDADE ||
    '';

  const nivelUsuario =
    Number(
      usuario?.nivel ??
        usuario?.NIVEL ??
        usuario?.nivelAcesso ??
        usuario?.NIVELACESSO ??
        0
    );

  const usuarioPodeAnalisar =
    nivelUsuario ===
      NIVEL_ADMIN_MASTER ||
    nivelUsuario ===
      NIVEL_ADMIN;

  const [
    estoque,
    setEstoque,
  ] = useState([]);

  const [
    extravios,
    setExtravios,
  ] = useState([]);

  const [
    extraviosPendentes,
    setExtraviosPendentes,
  ] = useState([]);

  const [
    tipoProduto,
    setTipoProduto,
  ] = useState(
    'FENO'
  );

  const [
    entradaId,
    setEntradaId,
  ] = useState('');

  const [
    dataExtravio,
    setDataExtravio,
  ] = useState(
    dataHoje()
  );

  const [
    quantidadeExtraviada,
    setQuantidadeExtraviada,
  ] = useState('');

  const [
    motivo,
    setMotivo,
  ] = useState('');

  const [
    responsavel,
    setResponsavel,
  ] = useState(
    usuario?.nomeExibicao ||
      usuario?.nome ||
      usuario?.NOME ||
      ''
  );

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    carregandoDados,
    setCarregandoDados,
  ] = useState(true);

  const [
    mensagemSucesso,
    setMensagemSucesso,
  ] = useState('');

  const [
    mensagemErro,
    setMensagemErro,
  ] = useState('');

  /*
   * ==========================================
   * ANÁLISE ADMINISTRATIVA
   * ==========================================
   */

  const [
    painelAnaliseAberto,
    setPainelAnaliseAberto,
  ] = useState(false);

  const [
    modalAnaliseAberto,
    setModalAnaliseAberto,
  ] = useState(false);

  const [
    tipoAnalise,
    setTipoAnalise,
  ] = useState('');

  const [
    extravioSelecionado,
    setExtravioSelecionado,
  ] = useState(null);

  const [
    quantidadeConfirmada,
    setQuantidadeConfirmada,
  ] = useState('');

  const [
    motivoAnalise,
    setMotivoAnalise,
  ] = useState('');

  const [
    analisando,
    setAnalisando,
  ] = useState(false);

  /*
   * ==========================================
   * MENSAGENS
   * ==========================================
   */

  const rolarParaMensagem =
    useCallback(() => {
      window.setTimeout(
        () => {
          mensagemRef.current
            ?.scrollIntoView({
              behavior:
                'smooth',

              block:
                'center',
            });
        },
        80
      );
    }, []);

  const exibirErro =
    useCallback(
      (mensagem) => {
        setMensagemSucesso(
          ''
        );

        setMensagemErro(
          mensagem
        );

        rolarParaMensagem();
      },
      [
        rolarParaMensagem,
      ]
    );

  /*
   * ==========================================
   * CARREGAMENTO
   * ==========================================
   */

  const carregarDados =
    useCallback(
      async () => {
        if (
          !unidadeUsuario
        ) {
          setEstoque(
            []
          );

          setExtravios(
            []
          );

          setExtraviosPendentes(
            []
          );

          exibirErro(
            'A unidade do usuário não foi identificada.'
          );

          return;
        }

        setCarregandoDados(
          true
        );

        try {
          const hoje =
            dataHoje();

          /*
           * ======================================
           * ESTOQUE
           * ======================================
           */

          const promessaEstoque =
            listarEstoqueFenoRacao({
              unidade:
                unidadeUsuario,

              situacao:
                'ATIVO',
            });

          /*
           * ======================================
           * HISTÓRICO DE HOJE
           * ======================================
           */

          const promessaHistorico =
            listarMovimentacoesFenoRacao({
              dataInicial:
                hoje,

              dataFinal:
                hoje,

              tipoMovimentacao:
                'EXTRAVIO',

              unidade:
                unidadeUsuario,
            });

          /*
           * ======================================
           * PENDÊNCIAS ADMINISTRATIVAS
           * ======================================
           */

          let promessaPendencias =
            Promise.resolve(
              []
            );

          if (
            usuarioPodeAnalisar
          ) {
            if (
              nivelUsuario ===
              NIVEL_ADMIN_MASTER
            ) {
              promessaPendencias =
                Promise.all(
                  UNIDADES_EQUINAS.map(
                    (
                      unidade
                    ) =>
                      listarMovimentacoesFenoRacao(
                        {
                          dataInicial:
                            DATA_INICIAL_PENDENCIAS,

                          dataFinal:
                            hoje,

                          tipoMovimentacao:
                            'EXTRAVIO',

                          unidade,
                        }
                      )
                  )
                );
            } else {
              promessaPendencias =
                Promise.all([
                  listarMovimentacoesFenoRacao(
                    {
                      dataInicial:
                        DATA_INICIAL_PENDENCIAS,

                      dataFinal:
                        hoje,

                      tipoMovimentacao:
                        'EXTRAVIO',

                      unidade:
                        unidadeUsuario,
                    }
                  ),
                ]);
            }
          }

          const [
            respostaEstoque,
            respostaHistorico,
            respostasPendencias,
          ] =
            await Promise.all([
              promessaEstoque,
              promessaHistorico,
              promessaPendencias,
            ]);

          /*
           * ======================================
           * ESTOQUE
           * ======================================
           */

          setEstoque(
            extrairLista(
              respostaEstoque
            )
          );

          /*
           * ======================================
           * HISTÓRICO DO DIA
           * ======================================
           */

          setExtravios(
            extrairLista(
              respostaHistorico
            )
          );

          /*
           * ======================================
           * PENDÊNCIAS
           * ======================================
           */

          const listaPendencias =
            respostasPendencias
              .flatMap(
                (
                  resposta
                ) =>
                  extrairLista(
                    resposta
                  )
              )
              .filter(
                (
                  extravio
                ) =>
                  extravio
                    ?.situacaoAnaliseExtravio ===
                  'PENDENTE_ANALISE'
              );

          /*
           * Evita duplicidade.
           */
          const pendenciasSemDuplicidade =
            Array.from(
              new Map(
                listaPendencias.map(
                  (
                    extravio
                  ) => [
                    String(
                      extravio.id
                    ),
                    extravio,
                  ]
                )
              ).values()
            );

          /*
           * Mais antigos primeiro.
           */
          pendenciasSemDuplicidade.sort(
            (
              a,
              b
            ) => {
              const dataA =
                String(
                  a?.dataOperacao ??
                    a?.dataCadastro ??
                    ''
                );

              const dataB =
                String(
                  b?.dataOperacao ??
                    b?.dataCadastro ??
                    ''
                );

              return dataA.localeCompare(
                dataB
              );
            }
          );

          setExtraviosPendentes(
            pendenciasSemDuplicidade
          );

          setMensagemErro(
            ''
          );
        } catch (erro) {
          setEstoque(
            []
          );

          setExtravios(
            []
          );

          setExtraviosPendentes(
            []
          );

          exibirErro(
            obterMensagemErro(
              erro,
              'Não foi possível carregar os dados de extravio.'
            )
          );
        } finally {
          setCarregandoDados(
            false
          );
        }
      },
      [
        unidadeUsuario,
        usuarioPodeAnalisar,
        nivelUsuario,
        exibirErro,
      ]
    );

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void carregarDados();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    carregarDados,
  ]);

  /*
   * ==========================================
   * ESTOQUE
   * ==========================================
   */

  const produtosDisponiveis =
    useMemo(() => {
      const tiposComEstoque =
        new Set(
          estoque
            .filter(
              (item) =>
                Number(
                  item?.quantidadeAtual ||
                    0
                ) > 0
            )
            .map(
              (item) =>
                item?.tipoProduto
            )
            .filter(Boolean)
        );

      const filtrados =
        PRODUTOS.filter(
          (produto) =>
            tiposComEstoque.has(
              produto.valor
            )
        );

      return filtrados.length >
        0
        ? filtrados
        : PRODUTOS;
    }, [
      estoque,
    ]);

  const estoqueDisponivel =
    useMemo(() => {
      return estoque
        .filter(
          (entrada) => {
            const mesmaUnidade =
              normalizarTexto(
                entrada?.unidade
              ) ===
              normalizarTexto(
                unidadeUsuario
              );

            const mesmoProduto =
              entrada?.tipoProduto ===
              tipoProduto;

            const ativo =
              !entrada?.situacao ||
              normalizarTexto(
                entrada?.situacao
              ) ===
                'ATIVO';

            const temSaldo =
              Number(
                entrada?.quantidadeAtual ||
                  0
              ) > 0;

            return (
              mesmaUnidade &&
              mesmoProduto &&
              ativo &&
              temSaldo
            );
          }
        )
        .sort(
          (
            a,
            b
          ) => {
            const dataA =
              String(
                a?.dataEntrada ||
                  ''
              );

            const dataB =
              String(
                b?.dataEntrada ||
                  ''
              );

            if (
              dataA !==
              dataB
            ) {
              return dataA.localeCompare(
                dataB
              );
            }

            return String(
              a?.validade ||
                ''
            ).localeCompare(
              String(
                b?.validade ||
                  ''
              )
            );
          }
        );
    }, [
      estoque,
      tipoProduto,
      unidadeUsuario,
    ]);

  const entradaSelecionada =
    useMemo(() => {
      return (
        estoqueDisponivel.find(
          (
            entrada
          ) =>
            String(
              entrada?.id
            ) ===
            String(
              entradaId
            )
        ) ||
        null
      );
    }, [
      estoqueDisponivel,
      entradaId,
    ]);

  const quantidadeNumerica =
    Number(
      quantidadeExtraviada
    );

  const pesoExtraviadoKg =
    useMemo(() => {
      if (
        !entradaSelecionada
      ) {
        return 0;
      }

      return (
        Number(
          quantidadeExtraviada ||
            0
        ) *
        Number(
          entradaSelecionada
            ?.pesoUnidadeKg ||
            0
        )
      );
    }, [
      entradaSelecionada,
      quantidadeExtraviada,
    ]);

  /*
   * ==========================================
   * REGISTRO
   * ==========================================
   */

  const limparFormulario =
    () => {
      setEntradaId(
        ''
      );

      setQuantidadeExtraviada(
        ''
      );

      setMotivo(
        ''
      );
    };

  const salvarExtravio =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        salvando
      ) {
        return;
      }

      setMensagemErro(
        ''
      );

      setMensagemSucesso(
        ''
      );

      if (
        !dataExtravio
      ) {
        exibirErro(
          'Informe a data do extravio.'
        );

        return;
      }

      if (
        !entradaSelecionada
      ) {
        exibirErro(
          'Selecione um lote disponível.'
        );

        return;
      }

      if (
        !Number.isInteger(
          quantidadeNumerica
        ) ||
        quantidadeNumerica <=
          0
      ) {
        exibirErro(
          'A quantidade extraviada deve ser um número inteiro maior que zero.'
        );

        return;
      }

      const quantidadeAtual =
        Number(
          entradaSelecionada
            ?.quantidadeAtual ||
            0
        );

      if (
        quantidadeNumerica >
        quantidadeAtual
      ) {
        exibirErro(
          `A quantidade extraviada não pode ser maior que o saldo atual do lote (${formatarNumero(
            quantidadeAtual
          )} un.).`
        );

        return;
      }

      const motivoNormalizado =
        motivo.trim();

      if (
        !motivoNormalizado
      ) {
        exibirErro(
          'Informe a justificativa do extravio.'
        );

        return;
      }

      if (
        motivoNormalizado.length >
        250
      ) {
        exibirErro(
          'A justificativa deve possuir no máximo 250 caracteres.'
        );

        return;
      }

      const responsavelNormalizado =
        responsavel.trim();

      if (
        !responsavelNormalizado
      ) {
        exibirErro(
          'Informe o responsável pelo registro.'
        );

        return;
      }

      const loteId =
        Number(
          entradaSelecionada.id
        );

      if (
        !Number.isInteger(
          loteId
        ) ||
        loteId <=
          0
      ) {
        exibirErro(
          'O lote selecionado é inválido.'
        );

        return;
      }

      const payload = {
        loteId,

        quantidadeExtraviada:
          quantidadeNumerica,

        dataExtravio,

        motivo:
          motivoNormalizado,

        responsavel:
          responsavelNormalizado,

        numeroDocumento:
          null,

        observacao:
          null,
      };

      setSalvando(
        true
      );

      try {
        const resposta =
          await registrarExtravioFenoRacao(
            payload
          );

        const quantidadeRetornada =
          resposta
            ?.quantidadeUnidades ??
          resposta
            ?.quantidadeExtraviada ??
          quantidadeNumerica;

        const pesoRetornado =
          resposta
            ?.pesoMovimentadoKg ??
          resposta
            ?.pesoExtraviadoKg ??
          pesoExtraviadoKg;

        const loteRetornado =
          resposta?.codigoLote ??
          entradaSelecionada
            ?.codigoLote ??
          entradaSelecionada
            ?.lote ??
          '-';

        limparFormulario();

        const aguardandoAnalise =
          resposta
            ?.situacaoAnaliseExtravio ===
          'PENDENTE_ANALISE';

        setMensagemSucesso(
          aguardandoAnalise
            ? `Extravio registrado com sucesso. Foram baixadas ${formatarNumero(
                quantidadeRetornada
              )} unidade(s) / ${formatarNumero(
                pesoRetornado
              )} kg do lote ${loteRetornado}. A operação está aguardando análise do administrador.`
            : `Extravio registrado com sucesso. Foram baixadas ${formatarNumero(
                quantidadeRetornada
              )} unidade(s) / ${formatarNumero(
                pesoRetornado
              )} kg do lote ${loteRetornado}.`
        );

        await carregarDados();

        rolarParaMensagem();
      } catch (erro) {
        exibirErro(
          obterMensagemErro(
            erro,
            'Não foi possível registrar o extravio. Verifique os dados e tente novamente.'
          )
        );
      } finally {
        setSalvando(
          false
        );
      }
    };

  /*
   * ==========================================
   * PAINEL "ANALISAR"
   * ==========================================
   */

  const abrirPainelAnalise =
    (
      extravio
    ) => {
      if (
        !usuarioPodeAnalisar
      ) {
        return;
      }

      setExtravioSelecionado(
        extravio
      );

      setTipoAnalise(
        ''
      );

      setQuantidadeConfirmada(
        ''
      );

      setMotivoAnalise(
        ''
      );

      setMensagemErro(
        ''
      );

      setMensagemSucesso(
        ''
      );

      setPainelAnaliseAberto(
        true
      );
    };

  const fecharPainelAnalise =
    () => {
      if (
        analisando
      ) {
        return;
      }

      setPainelAnaliseAberto(
        false
      );

      setExtravioSelecionado(
        null
      );

      setTipoAnalise(
        ''
      );

      setQuantidadeConfirmada(
        ''
      );

      setMotivoAnalise(
        ''
      );
    };

  /*
   * ==========================================
   * MODAL ADMINISTRATIVO
   * ==========================================
   */

  const abrirModalAnalise =
    (
      tipo,
      extravio
    ) => {
      setTipoAnalise(
        tipo
      );

      setExtravioSelecionado(
        extravio
      );

      setQuantidadeConfirmada(
        ''
      );

      setMotivoAnalise(
        ''
      );

      setMensagemErro(
        ''
      );

      setMensagemSucesso(
        ''
      );

      setModalAnaliseAberto(
        true
      );
    };

  const selecionarTipoAnalise =
    (
      tipo
    ) => {
      const extravio =
        extravioSelecionado;

      if (
        !extravio
      ) {
        return;
      }

      setPainelAnaliseAberto(
        false
      );

      abrirModalAnalise(
        tipo,
        extravio
      );
    };

  const fecharModalAnalise =
    () => {
      if (
        analisando
      ) {
        return;
      }

      setModalAnaliseAberto(
        false
      );

      setTipoAnalise(
        ''
      );

      setExtravioSelecionado(
        null
      );

      setQuantidadeConfirmada(
        ''
      );

      setMotivoAnalise(
        ''
      );
    };

  const quantidadeOriginalAnalise =
    Number(
      extravioSelecionado
        ?.quantidadeUnidades ??
        extravioSelecionado
          ?.quantidadeExtraviada ??
        0
    );

  const quantidadeConfirmadaNumerica =
    Number(
      quantidadeConfirmada
    );

  const quantidadeDevolvidaCalculada =
    tipoAnalise ===
      'AJUSTAR' &&
    Number.isInteger(
      quantidadeConfirmadaNumerica
    ) &&
    quantidadeConfirmadaNumerica >
      0 &&
    quantidadeConfirmadaNumerica <
      quantidadeOriginalAnalise
      ? quantidadeOriginalAnalise -
        quantidadeConfirmadaNumerica
      : tipoAnalise ===
          'CANCELAR'
        ? quantidadeOriginalAnalise
        : 0;

  /*
   * ==========================================
   * EXECUTAR ANÁLISE
   * ==========================================
   */

  const executarAnalise =
    async () => {
      if (
        !usuarioPodeAnalisar ||
        !extravioSelecionado ||
        analisando
      ) {
        return;
      }

      const movimentacaoId =
        Number(
          extravioSelecionado
            ?.id
        );

      if (
        !Number.isInteger(
          movimentacaoId
        ) ||
        movimentacaoId <=
          0
      ) {
        exibirErro(
          'O extravio selecionado é inválido.'
        );

        return;
      }

      if (
        extravioSelecionado
          ?.situacaoAnaliseExtravio !==
        'PENDENTE_ANALISE'
      ) {
        setModalAnaliseAberto(
          false
        );

        setExtravioSelecionado(
          null
        );

        exibirErro(
          'Este extravio já foi analisado.'
        );

        return;
      }

      const motivoNormalizado =
        motivoAnalise.trim();

      if (
        tipoAnalise ===
        'AJUSTAR'
      ) {
        if (
          !Number.isInteger(
            quantidadeConfirmadaNumerica
          ) ||
          quantidadeConfirmadaNumerica <=
            0
        ) {
          exibirErro(
            'Informe uma quantidade confirmada maior que zero.'
          );

          return;
        }

        if (
          quantidadeConfirmadaNumerica >=
          quantidadeOriginalAnalise
        ) {
          exibirErro(
            'No ajuste, a quantidade confirmada deve ser menor que a quantidade originalmente informada.'
          );

          return;
        }

        if (
          !motivoNormalizado
        ) {
          exibirErro(
            'Informe o motivo do ajuste.'
          );

          return;
        }
      }

      if (
        tipoAnalise ===
          'CANCELAR' &&
        !motivoNormalizado
      ) {
        exibirErro(
          'Informe o motivo do cancelamento.'
        );

        return;
      }

      if (
        motivoNormalizado.length >
        250
      ) {
        exibirErro(
          'O motivo da análise deve possuir no máximo 250 caracteres.'
        );

        return;
      }

      setAnalisando(
        true
      );

      try {
        if (
          tipoAnalise ===
          'CONFIRMAR'
        ) {
          await confirmarExtravioFenoRacao(
            movimentacaoId
          );

          setMensagemSucesso(
            'Extravio confirmado com sucesso. A ocorrência foi concluída sem alteração adicional no estoque.'
          );
        }

        if (
          tipoAnalise ===
          'AJUSTAR'
        ) {
          await ajustarExtravioFenoRacao(
            movimentacaoId,
            {
              quantidadeConfirmada:
                quantidadeConfirmadaNumerica,

              motivo:
                motivoNormalizado,
            }
          );

          setMensagemSucesso(
            `Extravio ajustado com sucesso. Foram confirmadas ${formatarNumero(
              quantidadeConfirmadaNumerica
            )} unidade(s) e devolvidas ${formatarNumero(
              quantidadeDevolvidaCalculada
            )} unidade(s) ao estoque.`
          );
        }

        if (
          tipoAnalise ===
          'CANCELAR'
        ) {
          await cancelarExtravioFenoRacao(
            movimentacaoId,
            {
              motivo:
                motivoNormalizado,
            }
          );

          setMensagemSucesso(
            `Extravio cancelado com sucesso. Foram devolvidas ${formatarNumero(
              quantidadeOriginalAnalise
            )} unidade(s) ao estoque.`
          );
        }

        setModalAnaliseAberto(
          false
        );

        setPainelAnaliseAberto(
          false
        );

        setTipoAnalise(
          ''
        );

        setExtravioSelecionado(
          null
        );

        setQuantidadeConfirmada(
          ''
        );

        setMotivoAnalise(
          ''
        );

        await carregarDados();

        rolarParaMensagem();
      } catch (erro) {
        exibirErro(
          obterMensagemErro(
            erro,
            'Não foi possível concluir a análise do extravio.'
          )
        );
      } finally {
        setAnalisando(
          false
        );
      }
    };

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <main className="extravio-alimentacao-page">
      <section className="extravio-alimentacao-phone">
        <header className="extravio-alimentacao-header">
          <button
            type="button"
            className="extravio-alimentacao-voltar"
            onClick={onVoltar}
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>
              Alimentação equina
            </span>

            <h1>
              Extravio de Feno e Ração
            </h1>

            <p>
              {unidadeUsuario ||
                'Controle de estoque'}
            </p>
          </div>
        </header>

        <section className="extravio-alimentacao-alerta">
          <div className="extravio-alimentacao-alerta-icon">
            <FaTriangleExclamation />
          </div>

          <div>
            <span>
              Registro de perda
            </span>

            <h2>
              Informe o extravio com justificativa
            </h2>

            <p>
              O lançamento de extravio
              baixa o saldo real do lote
              no banco de dados e fica
              separado das saídas normais
              de consumo.
            </p>
          </div>
        </section>

        {/*
         * ========================================
         * EXTRAVIOS PENDENTES PARA ADMIN
         * ========================================
         */}

        {usuarioPodeAnalisar && (
          <section className="extravio-alimentacao-pendencias">
            <div className="extravio-alimentacao-pendencias-topo">
              <div>
                <span>
                  Pendentes
                </span>

                <h2>
                  Extravios para analisar
                </h2>
              </div>

              <strong>
                {
                  extraviosPendentes.length
                }
              </strong>
            </div>

            {carregandoDados ? (
              <div className="extravio-alimentacao-pendencias-vazio">
                Carregando pendências...
              </div>
            ) : extraviosPendentes.length ===
              0 ? (
              <div className="extravio-alimentacao-pendencias-vazio">
                <FaCircleCheck />

                <div>
                  <strong>
                    Nenhum extravio pendente
                  </strong>

                  <p>
                    Não existem extravios
                    aguardando análise
                    administrativa.
                  </p>
                </div>
              </div>
            ) : (
              <div className="extravio-alimentacao-pendencias-lista">
                {extraviosPendentes.map(
                  (
                    extravio
                  ) => {
                    const quantidade =
                      extravio
                        ?.quantidadeUnidades ??
                      extravio
                        ?.quantidadeExtraviada ??
                      0;

                    const peso =
                      extravio
                        ?.pesoMovimentadoKg ??
                      extravio
                        ?.pesoExtraviadoKg ??
                      0;

                    const lote =
                      extravio
                        ?.codigoLote ??
                      extravio
                        ?.lote ??
                      '-';

                    const data =
                      extravio
                        ?.dataOperacao ??
                      extravio
                        ?.dataExtravio;

                    const unidade =
                      extravio
                        ?.unidadeOrigem ??
                      '-';

                    return (
                      <article
                        key={
                          extravio.id
                        }
                        className="extravio-alimentacao-pendencia-item"
                      >
                        <div className="extravio-alimentacao-pendencia-status">
                          <FaTriangleExclamation />

                          <span>
                            Pendente
                          </span>
                        </div>

                        <h3>
                          {extravio
                            ?.nomeProduto ||
                            obterNomeProduto(
                              extravio
                                ?.tipoProduto
                            )}
                        </h3>

                        <div className="extravio-alimentacao-pendencia-dados">
                          <p>
                            <strong>
                              Unidade:
                            </strong>{' '}
                            {
                              unidade
                            }
                          </p>

                          <p>
                            <strong>
                              Lote:
                            </strong>{' '}
                            {
                              lote
                            }
                          </p>

                          <p>
                            <strong>
                              Quantidade:
                            </strong>{' '}
                            {formatarNumero(
                              quantidade
                            )}{' '}
                            un.
                          </p>

                          <p>
                            <strong>
                              Peso:
                            </strong>{' '}
                            {formatarNumero(
                              peso
                            )}{' '}
                            kg
                          </p>

                          <p>
                            <strong>
                              Data:
                            </strong>{' '}
                            {formatarData(
                              data
                            )}
                          </p>

                          <p>
                            <strong>
                              Responsável:
                            </strong>{' '}
                            {extravio
                              ?.responsavel ??
                              '-'}
                          </p>
                        </div>

                        <div className="extravio-alimentacao-pendencia-motivo">
                          <strong>
                            Justificativa
                          </strong>

                          <p>
                            {extravio
                              ?.motivo ??
                              '-'}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="extravio-alimentacao-analisar"
                          onClick={() =>
                            abrirPainelAnalise(
                              extravio
                            )
                          }
                        >
                          Analisar
                        </button>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/*
         * ========================================
         * FORMULÁRIO DE REGISTRO
         * ========================================
         */}

        <section className="extravio-alimentacao-card">
          <div className="extravio-alimentacao-card-titulo">
            <FaBoxesStacked />

            <div>
              <h2>
                Dados do extravio
              </h2>

              <p>
                Selecione o lote, informe
                quantidade e justificativa.
              </p>
            </div>
          </div>

          <form
            onSubmit={
              salvarExtravio
            }
          >
            <div className="extravio-alimentacao-grid">
              <div className="extravio-alimentacao-form-group">
                <label htmlFor="dataExtravio">
                  <FaCalendarDays />

                  Data do extravio
                </label>

                <input
                  id="dataExtravio"
                  type="date"
                  value={
                    dataExtravio
                  }
                  onChange={(
                    event
                  ) =>
                    setDataExtravio(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    salvando ||
                    carregandoDados
                  }
                />
              </div>

              <div className="extravio-alimentacao-form-group">
                <label htmlFor="tipoProduto">
                  Produto
                </label>

                <select
                  id="tipoProduto"
                  value={
                    tipoProduto
                  }
                  onChange={(
                    event
                  ) => {
                    setTipoProduto(
                      event.target
                        .value
                    );

                    setEntradaId(
                      ''
                    );

                    setQuantidadeExtraviada(
                      ''
                    );

                    setMensagemErro(
                      ''
                    );

                    setMensagemSucesso(
                      ''
                    );
                  }}
                  disabled={
                    salvando ||
                    carregandoDados
                  }
                >
                  {produtosDisponiveis.map(
                    (
                      produto
                    ) => (
                      <option
                        key={
                          produto.valor
                        }
                        value={
                          produto.valor
                        }
                      >
                        {
                          produto.nome
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="extravio-alimentacao-form-group">
              <label htmlFor="entradaId">
                Lote disponível
              </label>

              <select
                id="entradaId"
                value={
                  entradaId
                }
                onChange={(
                  event
                ) => {
                  setEntradaId(
                    event.target
                      .value
                  );

                  setQuantidadeExtraviada(
                    ''
                  );

                  setMensagemErro(
                    ''
                  );

                  setMensagemSucesso(
                    ''
                  );
                }}
                disabled={
                  salvando ||
                  carregandoDados
                }
              >
                <option value="">
                  {carregandoDados
                    ? 'Carregando lotes...'
                    : estoqueDisponivel.length ===
                        0
                      ? 'Nenhum lote disponível'
                      : 'Selecione um lote'}
                </option>

                {estoqueDisponivel.map(
                  (
                    entrada
                  ) => {
                    const codigoLote =
                      entrada
                        ?.codigoLote ??
                      entrada
                        ?.lote ??
                      'Sem lote';

                    return (
                      <option
                        key={
                          entrada.id
                        }
                        value={
                          entrada.id
                        }
                      >
                        {
                          codigoLote
                        }{' '}
                        · entrada{' '}
                        {formatarData(
                          entrada.dataEntrada
                        )}{' '}
                        · saldo{' '}
                        {formatarNumero(
                          entrada.quantidadeAtual
                        )}{' '}
                        un. ·{' '}
                        {formatarNumero(
                          Number(
                            entrada.quantidadeAtual ||
                              0
                          ) *
                            Number(
                              entrada.pesoUnidadeKg ||
                                0
                            )
                        )}{' '}
                        kg
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            {entradaSelecionada && (
              <section className="extravio-alimentacao-lote-card">
                <span>
                  Lote selecionado
                </span>

                <strong>
                  {entradaSelecionada
                    ?.codigoLote ??
                    entradaSelecionada
                      ?.lote ??
                    'Sem lote'}
                </strong>

                <div>
                  <p>
                    <b>
                      Produto:
                    </b>{' '}
                    {entradaSelecionada
                      ?.nomeProduto ||
                      obterNomeProduto(
                        entradaSelecionada
                          ?.tipoProduto
                      )}
                  </p>

                  <p>
                    <b>
                      Data de entrada:
                    </b>{' '}
                    {formatarData(
                      entradaSelecionada
                        ?.dataEntrada
                    )}
                  </p>

                  <p>
                    <b>
                      Peso unitário:
                    </b>{' '}
                    {formatarNumero(
                      entradaSelecionada
                        ?.pesoUnidadeKg
                    )}{' '}
                    kg
                  </p>

                  <p>
                    <b>
                      Saldo atual:
                    </b>{' '}
                    {formatarNumero(
                      entradaSelecionada
                        ?.quantidadeAtual
                    )}{' '}
                    un. /{' '}
                    {formatarNumero(
                      Number(
                        entradaSelecionada
                          ?.quantidadeAtual ||
                          0
                      ) *
                        Number(
                          entradaSelecionada
                            ?.pesoUnidadeKg ||
                            0
                        )
                    )}{' '}
                    kg
                  </p>
                </div>
              </section>
            )}

            <div className="extravio-alimentacao-grid">
              <div className="extravio-alimentacao-form-group">
                <label htmlFor="quantidadeExtraviada">
                  Quantidade extraviada
                </label>

                <input
                  id="quantidadeExtraviada"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={
                    quantidadeExtraviada
                  }
                  placeholder="Ex.: 2"
                  onChange={(
                    event
                  ) => {
                    setQuantidadeExtraviada(
                      event.target
                        .value
                    );

                    setMensagemErro(
                      ''
                    );

                    setMensagemSucesso(
                      ''
                    );
                  }}
                  disabled={
                    !entradaSelecionada ||
                    salvando
                  }
                />
              </div>

              <div className="extravio-alimentacao-form-group">
                <label>
                  Peso extraviado
                </label>

                <input
                  type="text"
                  value={`${formatarNumero(
                    pesoExtraviadoKg
                  )} kg`}
                  disabled
                />
              </div>
            </div>

            <div className="extravio-alimentacao-form-group">
              <label htmlFor="responsavel">
                Responsável pelo registro
              </label>

              <input
                id="responsavel"
                type="text"
                maxLength={150}
                value={
                  responsavel
                }
                placeholder="Ex.: Sd Silva"
                onChange={(
                  event
                ) => {
                  setResponsavel(
                    event.target
                      .value
                  );

                  setMensagemErro(
                    ''
                  );

                  setMensagemSucesso(
                    ''
                  );
                }}
                disabled={
                  salvando
                }
              />
            </div>

            <div className="extravio-alimentacao-form-group">
              <label htmlFor="motivo">
                Justificativa do extravio
              </label>

              <textarea
                id="motivo"
                value={
                  motivo
                }
                maxLength={
                  250
                }
                rows={
                  4
                }
                placeholder="Ex.: Fardos molhados pela chuva durante armazenamento."
                onChange={(
                  event
                ) => {
                  setMotivo(
                    event.target
                      .value
                  );

                  setMensagemErro(
                    ''
                  );

                  setMensagemSucesso(
                    ''
                  );
                }}
                disabled={
                  salvando
                }
              />
            </div>

            <button
              type="submit"
              className="extravio-alimentacao-salvar"
              disabled={
                salvando ||
                carregandoDados
              }
            >
              <FaFloppyDisk />

              {salvando
                ? 'Registrando...'
                : 'Registrar extravio'}
            </button>

            <div
              ref={
                mensagemRef
              }
            >
              {mensagemErro && (
                <div className="extravio-alimentacao-feedback erro">
                  <FaTriangleExclamation />

                  <span>
                    {
                      mensagemErro
                    }
                  </span>
                </div>
              )}

              {mensagemSucesso && (
                <div className="extravio-alimentacao-feedback sucesso">
                  <FaCircleCheck />

                  <span>
                    {
                      mensagemSucesso
                    }
                  </span>
                </div>
              )}
            </div>
          </form>

          {/*
           * ======================================
           * HISTÓRICO DE HOJE
           * ======================================
           */}

          {extravios.length >
            0 && (
            <section className="extravio-alimentacao-historico">
              <div className="extravio-alimentacao-historico-topo">
                <div>
                  <span>
                    <FaClockRotateLeft />

                    Histórico
                  </span>

                  <h2>
                    Extravios registrados hoje
                  </h2>
                </div>

                <strong>
                  {
                    extravios.length
                  }{' '}
                  registro(s)
                </strong>
              </div>

              <div className="extravio-alimentacao-historico-lista">
                {extravios
                  .slice(
                    0,
                    5
                  )
                  .map(
                    (
                      extravio
                    ) => {
                      const data =
                        extravio
                          ?.dataOperacao ??
                        extravio
                          ?.dataExtravio;

                      const lote =
                        extravio
                          ?.codigoLote ??
                        extravio
                          ?.lote ??
                        '-';

                      const quantidade =
                        extravio
                          ?.quantidadeUnidades ??
                        extravio
                          ?.quantidadeExtraviada ??
                        0;

                      const peso =
                        extravio
                          ?.pesoMovimentadoKg ??
                        extravio
                          ?.pesoExtraviadoKg ??
                        0;

                      const statusAnalise =
                        obterStatusAnalise(
                          extravio
                            ?.situacaoAnaliseExtravio
                        );

                      const quantidadeConfirmadaRegistro =
                        extravio
                          ?.quantidadeConfirmada;

                      const quantidadeDevolvida =
                        extravio
                          ?.quantidadeDevolvida;

                      const pendente =
                        extravio
                          ?.situacaoAnaliseExtravio ===
                        'PENDENTE_ANALISE';

                      return (
                        <article
                          key={
                            extravio
                              ?.id ??
                            `${lote}-${data}-${quantidade}`
                          }
                          className="extravio-alimentacao-historico-item"
                        >
                          <div className="extravio-alimentacao-historico-conteudo">
                            <strong>
                              {extravio
                                ?.nomeProduto ||
                                obterNomeProduto(
                                  extravio
                                    ?.tipoProduto
                                )}
                            </strong>

                            <p>
                              {formatarData(
                                data
                              )}{' '}
                              · Lote{' '}
                              {
                                lote
                              }
                            </p>

                            <p>
                              {extravio
                                ?.motivo ??
                                extravio
                                  ?.observacao ??
                                '-'}
                            </p>

                            <small>
                              Responsável:{' '}
                              {extravio
                                ?.responsavel ??
                                extravio
                                  ?.responsavelRegistro ??
                                '-'}
                            </small>

                            <div className="extravio-alimentacao-resumo-status">
                              {statusAnalise && (
                                <div
                                  className={`extravio-alimentacao-status-analise ${statusAnalise.classe}`}
                                >
                                  <strong>
                                    Status:
                                  </strong>{' '}
                                  {
                                    statusAnalise.texto
                                  }
                                </div>
                              )}

                              <span className="extravio-alimentacao-quantidade-resumo">
                                {formatarNumero(
                                  quantidade
                                )}{' '}
                                un. /{' '}
                                {formatarNumero(
                                  peso
                                )}{' '}
                                kg
                              </span>
                            </div>

                            {extravio
                              ?.situacaoAnaliseExtravio ===
                              'AJUSTADO' && (
                              <div className="extravio-alimentacao-detalhes-analise">
                                <span>
                                  Informado:{' '}
                                  <b>
                                    {formatarNumero(
                                      quantidade
                                    )}{' '}
                                    un.
                                  </b>
                                </span>

                                <span>
                                  Confirmado:{' '}
                                  <b>
                                    {formatarNumero(
                                      quantidadeConfirmadaRegistro
                                    )}{' '}
                                    un.
                                  </b>
                                </span>

                                <span>
                                  Devolvido ao estoque:{' '}
                                  <b>
                                    {formatarNumero(
                                      quantidadeDevolvida
                                    )}{' '}
                                    un.
                                  </b>
                                </span>
                              </div>
                            )}

                            {extravio
                              ?.situacaoAnaliseExtravio ===
                              'CANCELADO' && (
                              <div className="extravio-alimentacao-detalhes-analise">
                                <span>
                                  Informado:{' '}
                                  <b>
                                    {formatarNumero(
                                      quantidade
                                    )}{' '}
                                    un.
                                  </b>
                                </span>

                                <span>
                                  Confirmado:{' '}
                                  <b>
                                    0 un.
                                  </b>
                                </span>

                                <span>
                                  Devolvido ao estoque:{' '}
                                  <b>
                                    {formatarNumero(
                                      quantidadeDevolvida
                                    )}{' '}
                                    un.
                                  </b>
                                </span>
                              </div>
                            )}

                            {extravio
                              ?.motivoAnalise && (
                              <div className="extravio-alimentacao-motivo-analise">
                                <strong>
                                  Análise administrativa
                                </strong>

                                <p>
                                  {
                                    extravio.motivoAnalise
                                  }
                                </p>
                              </div>
                            )}

                            {usuarioPodeAnalisar &&
                              pendente && (
                                <div className="extravio-alimentacao-acoes-analise">
                                  <button
                                    type="button"
                                    className="confirmar"
                                    onClick={() =>
                                      abrirPainelAnalise(
                                        extravio
                                      )
                                    }
                                  >
                                    Analisar
                                  </button>
                                </div>
                              )}
                          </div>
                        </article>
                      );
                    }
                  )}
              </div>
            </section>
          )}
        </section>
      </section>

      {/*
       * ==========================================
       * MODAL DE ESCOLHA DA ANÁLISE
       * ==========================================
       */}

      {painelAnaliseAberto &&
        extravioSelecionado && (
          <div
            className="extravio-alimentacao-modal-overlay"
            role="presentation"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                fecharPainelAnalise();
              }
            }}
          >
            <section
              className="extravio-alimentacao-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-painel-analise"
            >
              <div className="extravio-alimentacao-modal-topo">
                <div>
                  <span>
                    Análise administrativa
                  </span>

                  <h2 id="titulo-painel-analise">
                    Analisar extravio
                  </h2>
                </div>

                <button
                  type="button"
                  className="extravio-alimentacao-modal-fechar"
                  onClick={
                    fecharPainelAnalise
                  }
                  disabled={
                    analisando
                  }
                  aria-label="Fechar"
                >
                  <FaXmark />
                </button>
              </div>

              <div className="extravio-alimentacao-modal-resumo">
                <div>
                  <span>
                    Produto
                  </span>

                  <strong>
                    {extravioSelecionado
                      ?.nomeProduto ||
                      obterNomeProduto(
                        extravioSelecionado
                          ?.tipoProduto
                      )}
                  </strong>
                </div>

                <div>
                  <span>
                    Lote
                  </span>

                  <strong>
                    {extravioSelecionado
                      ?.codigoLote ??
                      extravioSelecionado
                        ?.lote ??
                      '-'}
                  </strong>
                </div>

                <div>
                  <span>
                    Quantidade
                  </span>

                  <strong>
                    {formatarNumero(
                      extravioSelecionado
                        ?.quantidadeUnidades ??
                        extravioSelecionado
                          ?.quantidadeExtraviada ??
                        0
                    )}{' '}
                    un.
                  </strong>
                </div>
              </div>

              <div className="extravio-alimentacao-escolha-analise">
                <p>
                  Escolha como deseja
                  concluir esta
                  ocorrência.
                </p>

                <button
                  type="button"
                  className="confirmar"
                  onClick={() =>
                    selecionarTipoAnalise(
                      'CONFIRMAR'
                    )
                  }
                >
                  Confirmar extravio
                </button>

                <button
                  type="button"
                  className="ajustar"
                  onClick={() =>
                    selecionarTipoAnalise(
                      'AJUSTAR'
                    )
                  }
                >
                  Ajustar quantidade
                </button>

                <button
                  type="button"
                  className="cancelar"
                  onClick={() =>
                    selecionarTipoAnalise(
                      'CANCELAR'
                    )
                  }
                >
                  Cancelar extravio
                </button>
              </div>
            </section>
          </div>
        )}

      {/*
       * ==========================================
       * MODAL DE CONFIRMAÇÃO / AJUSTE / CANCELAMENTO
       * ==========================================
       */}

      {modalAnaliseAberto &&
        extravioSelecionado && (
          <div
            className="extravio-alimentacao-modal-overlay"
            role="presentation"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                fecharModalAnalise();
              }
            }}
          >
            <section
              className="extravio-alimentacao-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-modal-analise"
            >
              <div className="extravio-alimentacao-modal-topo">
                <div>
                  <span>
                    Análise administrativa
                  </span>

                  <h2 id="titulo-modal-analise">
                    {tipoAnalise ===
                    'CONFIRMAR'
                      ? 'Confirmar extravio'
                      : tipoAnalise ===
                          'AJUSTAR'
                        ? 'Ajustar extravio'
                        : 'Cancelar extravio'}
                  </h2>
                </div>

                <button
                  type="button"
                  className="extravio-alimentacao-modal-fechar"
                  onClick={
                    fecharModalAnalise
                  }
                  disabled={
                    analisando
                  }
                  aria-label="Fechar"
                >
                  <FaXmark />
                </button>
              </div>

              <div className="extravio-alimentacao-modal-resumo">
                <div>
                  <span>
                    Produto
                  </span>

                  <strong>
                    {extravioSelecionado
                      ?.nomeProduto ||
                      obterNomeProduto(
                        extravioSelecionado
                          ?.tipoProduto
                      )}
                  </strong>
                </div>

                <div>
                  <span>
                    Lote
                  </span>

                  <strong>
                    {extravioSelecionado
                      ?.codigoLote ??
                      extravioSelecionado
                        ?.lote ??
                      '-'}
                  </strong>
                </div>

                <div>
                  <span>
                    Quantidade informada
                  </span>

                  <strong>
                    {formatarNumero(
                      quantidadeOriginalAnalise
                    )}{' '}
                    un.
                  </strong>
                </div>
              </div>

              {tipoAnalise ===
                'CONFIRMAR' && (
                <div className="extravio-alimentacao-modal-aviso confirmar">
                  <FaCircleCheck />

                  <p>
                    A quantidade
                    informada será
                    confirmada
                    integralmente. O
                    estoque não sofrerá
                    nova alteração.
                  </p>
                </div>
              )}

              {tipoAnalise ===
                'AJUSTAR' && (
                <>
                  <div className="extravio-alimentacao-form-group">
                    <label htmlFor="quantidadeConfirmadaAnalise">
                      Quantidade realmente extraviada
                    </label>

                    <input
                      id="quantidadeConfirmadaAnalise"
                      type="number"
                      min="1"
                      max={Math.max(
                        quantidadeOriginalAnalise -
                          1,
                        1
                      )}
                      step="1"
                      inputMode="numeric"
                      value={
                        quantidadeConfirmada
                      }
                      onChange={(
                        event
                      ) =>
                        setQuantidadeConfirmada(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        analisando
                      }
                    />
                  </div>

                  <div className="extravio-alimentacao-calculo-ajuste">
                    <span>
                      Quantidade informada

                      <strong>
                        {formatarNumero(
                          quantidadeOriginalAnalise
                        )}{' '}
                        un.
                      </strong>
                    </span>

                    <span>
                      Quantidade confirmada

                      <strong>
                        {formatarNumero(
                          quantidadeConfirmadaNumerica
                        )}{' '}
                        un.
                      </strong>
                    </span>

                    <span>
                      Devolução automática ao estoque

                      <strong>
                        {formatarNumero(
                          quantidadeDevolvidaCalculada
                        )}{' '}
                        un.
                      </strong>
                    </span>
                  </div>
                </>
              )}

              {tipoAnalise ===
                'CANCELAR' && (
                <div className="extravio-alimentacao-modal-aviso cancelar">
                  <FaTriangleExclamation />

                  <p>
                    O extravio será
                    cancelado e as{' '}
                    <strong>
                      {formatarNumero(
                        quantidadeOriginalAnalise
                      )}{' '}
                      unidade(s)
                    </strong>{' '}
                    serão devolvidas
                    integralmente ao
                    estoque.
                  </p>
                </div>
              )}

              {(tipoAnalise ===
                'AJUSTAR' ||
                tipoAnalise ===
                  'CANCELAR') && (
                <div className="extravio-alimentacao-form-group">
                  <label htmlFor="motivoAnalise">
                    Motivo da análise
                  </label>

                  <textarea
                    id="motivoAnalise"
                    rows={4}
                    maxLength={250}
                    value={
                      motivoAnalise
                    }
                    placeholder={
                      tipoAnalise ===
                      'AJUSTAR'
                        ? 'Informe por que a quantidade foi ajustada.'
                        : 'Informe por que o extravio está sendo cancelado.'
                    }
                    onChange={(
                      event
                    ) =>
                      setMotivoAnalise(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      analisando
                    }
                  />
                </div>
              )}

              <div className="extravio-alimentacao-modal-acoes">
                <button
                  type="button"
                  className="secundario"
                  onClick={
                    fecharModalAnalise
                  }
                  disabled={
                    analisando
                  }
                >
                  Voltar
                </button>

                <button
                  type="button"
                  className={`principal ${tipoAnalise.toLowerCase()}`}
                  onClick={
                    executarAnalise
                  }
                  disabled={
                    analisando
                  }
                >
                  {analisando
                    ? 'Processando...'
                    : tipoAnalise ===
                        'CONFIRMAR'
                      ? 'Confirmar extravio'
                      : tipoAnalise ===
                          'AJUSTAR'
                        ? 'Salvar ajuste'
                        : 'Cancelar extravio'}
                </button>
              </div>
            </section>
          </div>
        )}
    </main>
  );
}

export default ExtravioFenoRacao;