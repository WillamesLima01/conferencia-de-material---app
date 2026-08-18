import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FaArrowLeft,
  FaBoxesStacked,
  FaCalendarDays,
  FaCircleCheck,
  FaHorse,
  FaMinus,
  FaWheatAwn,
} from 'react-icons/fa6';

import { GiGrain } from 'react-icons/gi';

import {
  listarEstoqueFenoRacao,
  listarMovimentacoesFenoRacao,
  registrarSaidaFenoRacao,
} from '../services/fenoRacaoEstoqueService';

import {
  listarProdutosFenoRacao,
} from '../services/produtoFenoRacaoService';

import '../styles/SaidaFenoRacao.css';

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

const dataHoje = () => {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, '0');

  const dia = String(
    agora.getDate()
  ).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
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
  return (
    usuario?.unidade ??
    usuario?.UNIDADE ??
    ''
  );
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

  const dataSemHorario =
    String(valor).split('T')[0];

  const [ano, mes, dia] =
    dataSemHorario.split('-');

  if (!ano || !mes || !dia) {
    return String(valor);
  }

  return `${dia}/${mes}/${ano}`;
};

const obterMensagemErro = (
  erro,
  mensagemPadrao
) => {
  const dados =
    erro?.response?.data ??
    erro?.data ??
    erro?.body ??
    null;

  if (
    typeof dados === 'string' &&
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
    typeof mensagem === 'string' &&
    mensagem.trim()
  ) {
    return mensagem.trim();
  }

  if (
    dados?.fields &&
    typeof dados.fields === 'object'
  ) {
    const mensagensCampos =
      Object.values(dados.fields)
        .flat()
        .filter(Boolean)
        .map((valor) =>
          String(valor).trim()
        )
        .filter(Boolean);

    if (mensagensCampos.length > 0) {
      return mensagensCampos.join(' ');
    }
  }

  return mensagemPadrao;
};

const extrairLista = (resposta) => {
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

  if (Array.isArray(resposta?.itens)) {
    return resposta.itens;
  }

  return [];
};

function SaidaFenoRacao({
  usuario,
  onVoltar,
}) {
  const unidadeUsuario =
    obterUnidadeUsuario(usuario);

  const [
    produtosCadastrados,
    setProdutosCadastrados,
  ] = useState([]);

  const [estoque, setEstoque] =
    useState([]);

  const [saidas, setSaidas] =
    useState([]);

  const [tipoProduto, setTipoProduto] =
    useState('');

  const [
    estoqueSelecionadoId,
    setEstoqueSelecionadoId,
  ] = useState('');

  const [
    quantidadeNecessariaKg,
    setQuantidadeNecessariaKg,
  ] = useState('');

  const [dataSaida, setDataSaida] =
    useState(dataHoje());

  const [servico, setServico] =
    useState('Serviço de 24 horas');

  const [responsavel, setResponsavel] =
    useState(
      usuario?.nomeExibicao ||
        `${
          usuario?.postGrad ||
          usuario?.POSTGRAD ||
          ''
        } ${
          usuario?.nome ||
          usuario?.NOME ||
          ''
        }`.trim()
    );

  const [observacao, setObservacao] =
    useState('');

  const [mensagem, setMensagem] =
    useState('');

  const [
    carregandoDados,
    setCarregandoDados,
  ] = useState(true);

  const [
    registrandoSaida,
    setRegistrandoSaida,
  ] = useState(false);

  const [
    modalSucessoAberto,
    setModalSucessoAberto,
  ] = useState(false);

  const [
    saidaConfirmada,
    setSaidaConfirmada,
  ] = useState(null);

  const mostrarMensagem = useCallback(
    (texto) => {
      setMensagem(texto);

      window.setTimeout(() => {
        setMensagem('');
      }, 4000);
    },
    []
  );

  const carregarDados = useCallback(
    async () => {
      if (!unidadeUsuario) {
        setEstoque([]);
        setSaidas([]);

        mostrarMensagem(
          'A unidade do usuário não foi identificada.'
        );

        return;
      }

      setCarregandoDados(true);

      try {
        const hoje = dataHoje();

        const [
          respostaProdutos,
          respostaEstoque,
          respostaSaidas,
        ] = await Promise.all([
          listarProdutosFenoRacao({
            situacao: 'ATIVO',
          }),

          listarEstoqueFenoRacao({
            unidade: unidadeUsuario,
            situacao: 'ATIVO',
          }),

          listarMovimentacoesFenoRacao({
            dataInicial: hoje,
            dataFinal: hoje,
            tipoMovimentacao: 'SAIDA',
            unidade: unidadeUsuario,
          }),
        ]);

        setProdutosCadastrados(
          extrairLista(respostaProdutos)
        );

        setEstoque(
          extrairLista(respostaEstoque)
        );

        setSaidas(
          extrairLista(respostaSaidas)
        );
      } catch (erro) {
        setProdutosCadastrados([]);
        setEstoque([]);
        setSaidas([]);

        mostrarMensagem(
          obterMensagemErro(
            erro,
            'Não foi possível carregar os dados de saída de Feno e Ração.'
          )
        );
      } finally {
        setCarregandoDados(false);
      }
    },
    [
      unidadeUsuario,
      mostrarMensagem,
    ]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarDados();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [carregarDados]);

  const tiposProdutosDisponiveis =
    useMemo(() => {
      const tiposCadastrados =
        new Set(
          produtosCadastrados
            .map(
              (produto) =>
                produto?.tipoProduto
            )
            .filter(Boolean)
        );

      const tiposComEstoque =
        new Set(
          estoque
            .filter(
              (item) =>
                Number(
                  item?.quantidadeAtual || 0
                ) > 0
            )
            .map(
              (item) =>
                item?.tipoProduto
            )
            .filter(Boolean)
        );

      return PRODUTOS.filter(
        (produto) =>
          tiposCadastrados.has(
            produto.valor
          ) ||
          tiposComEstoque.has(
            produto.valor
          )
      );
    }, [
      produtosCadastrados,
      estoque,
    ]);

  const produtoSelecionado =
    useMemo(() => {
      return (
        PRODUTOS.find(
          (produto) =>
            produto.valor ===
            tipoProduto
        ) || null
      );
    }, [tipoProduto]);

  const estoquesDoProduto =
    useMemo(() => {
      if (!tipoProduto) {
        return [];
      }

      return estoque
        .filter((entrada) => {
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

          const loteAtivo =
            !entrada?.situacao ||
            normalizarTexto(
              entrada?.situacao
            ) === 'ATIVO';

          const temSaldo =
            Number(
              entrada?.quantidadeAtual ||
              0
            ) > 0;

          return (
            mesmaUnidade &&
            mesmoProduto &&
            loteAtivo &&
            temSaldo
          );
        })
        .sort((a, b) => {
          const dataA =
            String(
              a?.dataEntrada || ''
            );

          const dataB =
            String(
              b?.dataEntrada || ''
            );

          if (dataA !== dataB) {
            return dataA.localeCompare(
              dataB
            );
          }

          return String(
            a?.validade || ''
          ).localeCompare(
            String(
              b?.validade || ''
            )
          );
        });
    }, [
      estoque,
      tipoProduto,
      unidadeUsuario,
    ]);

  const estoqueSelecionado =
    useMemo(() => {
      return (
        estoque.find(
          (entrada) =>
            String(entrada?.id) ===
            String(
              estoqueSelecionadoId
            )
        ) || null
      );
    }, [
      estoque,
      estoqueSelecionadoId,
    ]);

  const pesoUnidadeKg =
    Number(
      estoqueSelecionado
        ?.pesoUnidadeKg || 0
    );

  const quantidadeDisponivel =
    Number(
      estoqueSelecionado
        ?.quantidadeAtual || 0
    );

  const quantidadeNecessariaNumerica =
    Number(
      quantidadeNecessariaKg
    );

  const unidadesCalculadas =
    pesoUnidadeKg > 0 &&
    quantidadeNecessariaNumerica > 0
      ? Math.ceil(
          quantidadeNecessariaNumerica /
          pesoUnidadeKg
        )
      : 0;

  const pesoLiberadoKg =
    unidadesCalculadas *
    pesoUnidadeKg;

  const sobraCalculadaKg =
    pesoLiberadoKg >
    quantidadeNecessariaNumerica
      ? pesoLiberadoKg -
        quantidadeNecessariaNumerica
      : 0;

  const saldoAposSaida =
    quantidadeDisponivel -
    unidadesCalculadas;

  const limparFormulario = () => {
    setTipoProduto('');
    setEstoqueSelecionadoId('');
    setQuantidadeNecessariaKg('');
    setDataSaida(dataHoje());
    setServico(
      'Serviço de 24 horas'
    );
    setObservacao('');
  };

  const handleProdutoChange = (
    event
  ) => {
    setTipoProduto(
      event.target.value
    );

    setEstoqueSelecionadoId('');
    setQuantidadeNecessariaKg('');
    setMensagem('');
  };

  const handleRegistrarSaida =
    async (event) => {
      event.preventDefault();

      if (registrandoSaida) {
        return;
      }

      if (!produtoSelecionado) {
        mostrarMensagem(
          'Selecione o produto.'
        );
        return;
      }

      if (!estoqueSelecionado) {
        mostrarMensagem(
          'Selecione o estoque que será utilizado.'
        );
        return;
      }

      if (
        !Number.isFinite(
          quantidadeNecessariaNumerica
        ) ||
        quantidadeNecessariaNumerica <=
          0
      ) {
        mostrarMensagem(
          'Informe a quantidade necessária em quilogramas.'
        );
        return;
      }

      if (
        unidadesCalculadas >
        quantidadeDisponivel
      ) {
        mostrarMensagem(
          `Estoque insuficiente. Disponível: ${formatarNumero(
            quantidadeDisponivel
          )} ${
            produtoSelecionado
              .unidadePlural
          }.`
        );
        return;
      }

      if (!dataSaida) {
        mostrarMensagem(
          'Informe a data da saída.'
        );
        return;
      }

      if (!servico.trim()) {
        mostrarMensagem(
          'Informe o serviço.'
        );
        return;
      }

      if (!responsavel.trim()) {
        mostrarMensagem(
          'Informe o responsável pela retirada.'
        );
        return;
      }

      const loteId =
        Number(
          estoqueSelecionado.id
        );

      if (
        !Number.isInteger(loteId) ||
        loteId <= 0
      ) {
        mostrarMensagem(
          'O lote selecionado é inválido.'
        );
        return;
      }

      const payload = {
        loteId,
        quantidadeNecessariaKg:
          quantidadeNecessariaNumerica,
        dataSaida,
        servico:
          servico.trim(),
        responsavel:
          responsavel.trim(),
        numeroDocumento: null,
        observacao:
          observacao.trim() || null,
      };

      setRegistrandoSaida(true);
      setMensagem('');

      try {
        const resposta =
          await registrarSaidaFenoRacao(
            payload
          );

        setSaidaConfirmada(
          resposta
        );

        setModalSucessoAberto(
          true
        );

        limparFormulario();

        await carregarDados();
      } catch (erro) {
        mostrarMensagem(
          obterMensagemErro(
            erro,
            'Não foi possível registrar a saída.'
          )
        );
      } finally {
        setRegistrandoSaida(false);
      }
    };

  const renderizarIconeProduto = (
    tipo
  ) => {
    if (tipo === 'FENO') {
      return <FaWheatAwn />;
    }

    return <GiGrain />;
  };

  const obterClasseProduto = (
    tipo
  ) => {
    if (tipo === 'FENO') {
      return 'saida-icone-feno';
    }

    if (
      tipo ===
        'RACAO_POTRO_PREMIUM' ||
      tipo ===
        'RACAO_POTRO_MANUTENCAO'
    ) {
      return 'saida-icone-racao-potro';
    }

    return 'saida-icone-racao-adulto';
  };

  return (
    <main className="saida-alimentacao-page">
      <section className="saida-alimentacao-phone">
        <header className="saida-alimentacao-header">
          <button
            type="button"
            className="saida-alimentacao-voltar"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>
              Alimentação equina
            </span>

            <h1>
              Saída de Feno e Ração
            </h1>

            <p>
              {unidadeUsuario ||
                'Controle de estoque'}
            </p>
          </div>
        </header>

        <section className="saida-alimentacao-apresentacao">
          <div className="saida-alimentacao-apresentacao-icon">
            <FaHorse />
          </div>

          <div>
            <span>
              Serviço operacional
            </span>

            <h2>
              Retirada para serviço
            </h2>

            <p>
              A saída é registrada no
              estoque real da unidade e
              atualiza o saldo no banco de
              dados.
            </p>
          </div>
        </section>

        {mensagem && (
          <div className="saida-alimentacao-mensagem">
            {mensagem}
          </div>
        )}

        <section className="saida-alimentacao-card">
          <div className="saida-alimentacao-card-titulo">
            <FaMinus />

            <div>
              <h2>Nova saída</h2>

              <p>
                Selecione o produto e o
                lote disponível no estoque.
              </p>
            </div>
          </div>

          <form
            className="saida-alimentacao-form"
            onSubmit={
              handleRegistrarSaida
            }
          >
            <div className="saida-alimentacao-form-group">
              <label htmlFor="saidaProduto">
                Produto
              </label>

              <select
                id="saidaProduto"
                value={tipoProduto}
                onChange={
                  handleProdutoChange
                }
                disabled={
                  carregandoDados ||
                  registrandoSaida
                }
              >
                <option value="">
                  Selecione o produto
                </option>

                {tiposProdutosDisponiveis.map(
                  (produto) => (
                    <option
                      key={
                        produto.valor
                      }
                      value={
                        produto.valor
                      }
                    >
                      {produto.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="saida-alimentacao-form-group">
              <label htmlFor="saidaEstoque">
                Peso e estoque disponível
              </label>

              <select
                id="saidaEstoque"
                value={
                  estoqueSelecionadoId
                }
                disabled={
                  !tipoProduto ||
                  carregandoDados ||
                  registrandoSaida
                }
                onChange={(event) => {
                  setEstoqueSelecionadoId(
                    event.target.value
                  );

                  setQuantidadeNecessariaKg(
                    ''
                  );

                  setMensagem('');
                }}
              >
                <option value="">
                  {!tipoProduto
                    ? 'Selecione o produto primeiro'
                    : estoquesDoProduto.length ===
                        0
                      ? 'Nenhum estoque disponível'
                      : 'Selecione o estoque'}
                </option>

                {estoquesDoProduto.map(
                  (entrada) => (
                    <option
                      key={
                        entrada.id
                      }
                      value={
                        entrada.id
                      }
                    >
                      {formatarNumero(
                        entrada.pesoUnidadeKg
                      )}{' '}
                      kg —{' '}
                      {formatarNumero(
                        entrada.quantidadeAtual
                      )}{' '}
                      {
                        produtoSelecionado
                          ?.unidadePlural
                      }
                      {entrada.codigoLote
                        ? ` — Lote ${entrada.codigoLote}`
                        : ''}
                    </option>
                  )
                )}
              </select>
            </div>

            {estoqueSelecionado && (
              <div className="saida-alimentacao-estoque-info">
                <div>
                  <span>
                    Peso por unidade
                  </span>

                  <strong>
                    {formatarNumero(
                      pesoUnidadeKg
                    )}{' '}
                    kg
                  </strong>
                </div>

                <div>
                  <span>
                    Saldo disponível
                  </span>

                  <strong>
                    {formatarNumero(
                      quantidadeDisponivel
                    )}{' '}
                    {
                      produtoSelecionado
                        ?.unidadePlural
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Peso disponível
                  </span>

                  <strong>
                    {formatarNumero(
                      quantidadeDisponivel *
                        pesoUnidadeKg
                    )}{' '}
                    kg
                  </strong>
                </div>
              </div>
            )}

            <div className="saida-alimentacao-form-group">
              <label htmlFor="quantidadeNecessariaKg">
                Quantidade necessária
                para o serviço
              </label>

              <div className="saida-alimentacao-input-unidade">
                <input
                  id="quantidadeNecessariaKg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={
                    quantidadeNecessariaKg
                  }
                  disabled={
                    !estoqueSelecionado ||
                    registrandoSaida
                  }
                  placeholder="Ex.: 250"
                  onChange={(event) => {
                    setQuantidadeNecessariaKg(
                      event.target.value
                    );

                    setMensagem('');
                  }}
                />

                <span>kg</span>
              </div>
            </div>

            <div className="saida-alimentacao-calculo">
              <div>
                <span>
                  Quantidade necessária
                </span>

                <strong>
                  {formatarNumero(
                    quantidadeNecessariaNumerica
                  )}{' '}
                  kg
                </strong>
              </div>

              <div>
                <span>
                  {produtoSelecionado
                    ?.unidadePlural ||
                    'Unidades'}{' '}
                  calculados
                </span>

                <strong>
                  {formatarNumero(
                    unidadesCalculadas
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Peso liberado
                </span>

                <strong>
                  {formatarNumero(
                    pesoLiberadoKg
                  )}{' '}
                  kg
                </strong>
              </div>

              <div>
                <span>
                  Sobra calculada
                </span>

                <strong>
                  {formatarNumero(
                    sobraCalculadaKg
                  )}{' '}
                  kg
                </strong>
              </div>

              <div className="saida-alimentacao-calculo-saldo">
                <span>
                  Saldo após a retirada
                </span>

                <strong
                  className={
                    saldoAposSaida < 0
                      ? 'saldo-insuficiente'
                      : ''
                  }
                >
                  {formatarNumero(
                    Math.max(
                      saldoAposSaida,
                      0
                    )
                  )}{' '}
                  {produtoSelecionado
                    ?.unidadePlural ||
                    'unidades'}
                </strong>
              </div>
            </div>

            <div className="saida-alimentacao-grid">
              <div className="saida-alimentacao-form-group">
                <label htmlFor="dataSaida">
                  Data da saída
                </label>

                <input
                  id="dataSaida"
                  type="date"
                  value={dataSaida}
                  onChange={(event) =>
                    setDataSaida(
                      event.target.value
                    )
                  }
                  disabled={
                    registrandoSaida
                  }
                />
              </div>

              <div className="saida-alimentacao-form-group">
                <label htmlFor="servico">
                  Serviço
                </label>

                <input
                  id="servico"
                  type="text"
                  maxLength={150}
                  value={servico}
                  onChange={(event) =>
                    setServico(
                      event.target.value
                    )
                  }
                  disabled={
                    registrandoSaida
                  }
                />
              </div>
            </div>

            <div className="saida-alimentacao-form-group">
              <label htmlFor="responsavelSaida">
                Responsável pela retirada
              </label>

              <input
                id="responsavelSaida"
                type="text"
                maxLength={150}
                value={responsavel}
                onChange={(event) =>
                  setResponsavel(
                    event.target.value
                  )
                }
                disabled={
                  registrandoSaida
                }
              />
            </div>

            <div className="saida-alimentacao-form-group">
              <label htmlFor="observacaoSaida">
                Observação
              </label>

              <textarea
                id="observacaoSaida"
                maxLength={500}
                value={observacao}
                placeholder="Informações adicionais sobre a retirada"
                onChange={(event) =>
                  setObservacao(
                    event.target.value
                  )
                }
                disabled={
                  registrandoSaida
                }
              />
            </div>

            <button
              type="submit"
              className="saida-alimentacao-salvar"
              disabled={
                registrandoSaida ||
                carregandoDados
              }
            >
              <FaMinus />

              {registrandoSaida
                ? 'Registrando...'
                : 'Registrar saída'}
            </button>
          </form>
        </section>

        <section className="saida-alimentacao-card">
          <div className="saida-alimentacao-lista-header">
            <div>
              <span>
                Movimentações
              </span>

              <h2>
                Saídas registradas hoje
              </h2>
            </div>

            <strong>
              {saidas.length}
            </strong>
          </div>

          {carregandoDados ? (
            <div className="saida-alimentacao-vazio">
              <FaBoxesStacked />
              <p>
                Carregando saídas...
              </p>
            </div>
          ) : saidas.length === 0 ? (
            <div className="saida-alimentacao-vazio">
              <FaBoxesStacked />
              <p>
                Nenhuma saída registrada
                hoje.
              </p>
            </div>
          ) : (
            <div className="saida-alimentacao-lista">
              {saidas.map((saida) => {
                const tipo =
                  saida?.tipoProduto;

                const produto =
                  PRODUTOS.find(
                    (item) =>
                      item.valor === tipo
                  );

                const quantidade =
                  saida?.quantidadeUnidades ??
                  saida?.quantidadeRetirada ??
                  0;

                const peso =
                  saida?.pesoUnidadeKg ??
                  0;

                const data =
                  saida?.dataOperacao ??
                  saida?.dataSaida;

                const lote =
                  saida?.codigoLote ??
                  saida?.lote ??
                  '-';

                return (
                  <article
                    key={
                      saida?.id ??
                      `${tipo}-${lote}-${data}`
                    }
                    className="saida-alimentacao-item"
                  >
                    <div
                      className={`saida-alimentacao-item-icon ${obterClasseProduto(
                        tipo
                      )}`}
                    >
                      {renderizarIconeProduto(
                        tipo
                      )}
                    </div>

                    <div className="saida-alimentacao-item-info">
                      <span>
                        {saida?.nomeProduto ||
                          produto?.nome ||
                          tipo ||
                          'Produto'}
                      </span>

                      <h3>
                        {formatarNumero(
                          quantidade
                        )}{' '}
                        {produto
                          ?.unidadePlural ||
                          'unidades'}{' '}
                        de{' '}
                        {formatarNumero(
                          peso
                        )}{' '}
                        kg
                      </h3>

                      <p>
                        Necessário:{' '}
                        <strong>
                          {formatarNumero(
                            saida?.quantidadeSolicitadaKg ??
                              saida?.quantidadeNecessariaKg ??
                              0
                          )}{' '}
                          kg
                        </strong>
                      </p>

                      <p>
                        Liberado:{' '}
                        <strong>
                          {formatarNumero(
                            saida?.pesoMovimentadoKg ??
                              saida?.pesoLiberadoKg ??
                              0
                          )}{' '}
                          kg
                        </strong>
                      </p>

                      <div className="saida-alimentacao-item-detalhes">
                        <span>
                          <FaCalendarDays />
                          {formatarData(
                            data
                          )}
                        </span>

                        <span>
                          Lote: {lote}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {modalSucessoAberto &&
          saidaConfirmada && (
            <div className="saida-alimentacao-modal-overlay">
              <div className="saida-alimentacao-modal">
                <div className="saida-alimentacao-modal-icon sucesso">
                  <FaCircleCheck />
                </div>

                <h2>
                  Saída registrada com
                  sucesso!
                </h2>

                <p>
                  A retirada foi registrada
                  no banco de dados e o
                  estoque foi atualizado.
                </p>

                <div className="saida-alimentacao-modal-resumo sucesso">
                  <span>
                    Produto
                  </span>

                  <strong>
                    {saidaConfirmada
                      ?.nomeProduto ||
                      produtoSelecionado
                        ?.nome ||
                      '-'}
                  </strong>

                  <span>
                    Lote
                  </span>

                  <strong>
                    {saidaConfirmada
                      ?.codigoLote ||
                      estoqueSelecionado
                        ?.codigoLote ||
                      '-'}
                  </strong>

                  <span>
                    Quantidade retirada
                  </span>

                  <strong>
                    {formatarNumero(
                      saidaConfirmada
                        ?.quantidadeUnidades ??
                        unidadesCalculadas
                    )}{' '}
                    {produtoSelecionado
                      ?.unidadePlural ||
                      'unidades'}
                  </strong>

                  <span>
                    Peso movimentado
                  </span>

                  <strong>
                    {formatarNumero(
                      saidaConfirmada
                        ?.pesoMovimentadoKg ??
                        pesoLiberadoKg
                    )}{' '}
                    kg
                  </strong>
                </div>

                <div className="saida-alimentacao-modal-actions">
                  <button
                    type="button"
                    className="saida-alimentacao-confirmar-sucesso"
                    onClick={() => {
                      setModalSucessoAberto(
                        false
                      );

                      setSaidaConfirmada(
                        null
                      );
                    }}
                  >
                    <FaCircleCheck />
                    Entendi
                  </button>
                </div>
              </div>
            </div>
          )}
      </section>
    </main>
  );
}

export default SaidaFenoRacao;