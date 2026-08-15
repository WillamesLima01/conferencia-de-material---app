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
  FaHorse,
  FaPlus,
  FaTrashCan,
  FaTriangleExclamation,
  FaWheatAwn,
  FaXmark,
} from 'react-icons/fa6';

import { GiGrain } from 'react-icons/gi';

import ModalMensagem from '../components/ModalMensagem';

import {
  cadastrarEntradaFenoRacao,
  cancelarEntradaFenoRacao,
  listarEstoqueFenoRacao,
} from '../services/fenoRacaoEstoqueService';

import {
  listarProdutosFenoRacao,
} from '../services/produtoFenoRacaoService';

import '../styles/CadastroFenoRacao.css';

const NIVEIS_USUARIO = {
  ADMIN_MASTER: 1,
  ADMIN: 2,
  USUARIO_COMUM: 3,
};

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

const obterNivelUsuario = (usuario) => {
  return Number(
    usuario?.nivel ??
      usuario?.NIVEL ??
      usuario?.nivelAcesso ??
      usuario?.NIVEL_ACESSO ??
      NIVEIS_USUARIO.USUARIO_COMUM
  );
};

const usuarioEhAdminMaster = (usuario) => {
  return (
    obterNivelUsuario(usuario) ===
    NIVEIS_USUARIO.ADMIN_MASTER
  );
};

const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatarData = (valor) => {
  if (!valor) return '-';

  const dataSemHorario = String(valor).split('T')[0];
  const [ano, mes, dia] = dataSemHorario.split('-');

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
    erro?.erro ??
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
    const mensagensCampos = Object.values(
      dados.fields
    )
      .flat()
      .filter(Boolean)
      .map((valor) => String(valor).trim())
      .filter(Boolean);

    if (mensagensCampos.length > 0) {
      return mensagensCampos.join(' ');
    }
  }

  return mensagemPadrao;
};


const extrairListaEstoque = (resposta) => {
  if (Array.isArray(resposta)) {
    return resposta;
  }

  if (Array.isArray(resposta?.content)) {
    return resposta.content;
  }

  if (Array.isArray(resposta?.dados)) {
    return resposta.dados;
  }

  if (Array.isArray(resposta?.itens)) {
    return resposta.itens;
  }

  return [];
};

const extrairListaProdutos = (resposta) => {
  if (Array.isArray(resposta)) {
    return resposta;
  }

  if (Array.isArray(resposta?.content)) {
    return resposta.content;
  }

  if (Array.isArray(resposta?.dados)) {
    return resposta.dados;
  }

  if (Array.isArray(resposta?.itens)) {
    return resposta.itens;
  }

  return [];
};

function CadastroFenoRacao({
  usuario,
  onVoltar,
}) {
  const [entradas, setEntradas] = useState([]);

  const [modalMensagem, setModalMensagem] =
    useState({
      aberto: false,
      tipo: 'erro',
      titulo: '',
      mensagem: '',
    });

  const [
    produtosCadastrados,
    setProdutosCadastrados,
  ] = useState([]);

  const [tipoProduto, setTipoProduto] =
    useState('');

  const [
    pesoSelecionado,
    setPesoSelecionado,
  ] = useState('');

  const [novoPeso, setNovoPeso] =
    useState('');

  const [quantidade, setQuantidade] =
    useState('');

  const [dataEntrada, setDataEntrada] =
    useState(dataHoje());

  const [fornecedor, setFornecedor] =
    useState('');

  const [lote, setLote] = useState('');

  const [validade, setValidade] =
    useState('');

  const [
    numeroDocumento,
    setNumeroDocumento,
  ] = useState('');

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
    carregandoEstoque,
    setCarregandoEstoque,
  ] = useState(true);

  const [
    salvandoEntrada,
    setSalvandoEntrada,
  ] = useState(false);

  const [
    cancelandoEntrada,
    setCancelandoEntrada,
  ] = useState(false);

  const [
    entradaParaExcluir,
    setEntradaParaExcluir,
  ] = useState(null);

  const [
    motivoCancelamento,
    setMotivoCancelamento,
  ] = useState('');

  const [
    entradaCadastrada,
    setEntradaCadastrada,
  ] = useState(null);

  const unidadeUsuario =
    obterUnidadeUsuario(usuario);

  const adminMaster =
    usuarioEhAdminMaster(usuario);

  const nivelUsuario =
    obterNivelUsuario(usuario);

  const usuarioEhAdmin =
    nivelUsuario ===
    NIVEIS_USUARIO.ADMIN;

  const podeAlterarEstoque =
    adminMaster ||
    usuarioEhAdmin;

  const abrirModalMensagem = ({
    tipo = 'erro',
    titulo,
    mensagem,
  }) => {
    setModalMensagem({
      aberto: true,
      tipo,
      titulo,
      mensagem,
    });
  };

  const fecharModalMensagem = () => {
    setModalMensagem((estadoAtual) => ({
      ...estadoAtual,
      aberto: false,
    }));
  };

  const mostrarMensagem = useCallback(
    (texto) => {
      setMensagem(texto);

      window.setTimeout(() => {
        setMensagem('');
      }, 4000);
    },
    []
  );

  const carregarEstoque = useCallback(
    async () => {
      setCarregandoEstoque(true);

      try {
        const resposta =
          await listarEstoqueFenoRacao();

        const lista =
          extrairListaEstoque(resposta);

        setEntradas(lista);
      } catch (erro) {
        setEntradas([]);

        mostrarMensagem(
          obterMensagemErro(
            erro,
            'Não foi possível carregar o estoque.'
          )
        );
      } finally {
        setCarregandoEstoque(false);
      }
    },
    [mostrarMensagem]
  );

  useEffect(() => {
    let componenteAtivo = true;

    const carregarDadosIniciais = async () => {
      try {
        const [
          respostaEstoque,
          respostaProdutos,
        ] = await Promise.all([
          listarEstoqueFenoRacao(),
          listarProdutosFenoRacao({
            situacao: 'ATIVO',
          }),
        ]);

        if (!componenteAtivo) {
          return;
        }

        setEntradas(
          extrairListaEstoque(
            respostaEstoque
          )
        );

        setProdutosCadastrados(
          extrairListaProdutos(
            respostaProdutos
          )
        );
      } catch (erro) {
        if (!componenteAtivo) {
          return;
        }

        setEntradas([]);
        setProdutosCadastrados([]);

        mostrarMensagem(
          obterMensagemErro(
            erro,
            'Não foi possível carregar os dados de Feno e Ração.'
          )
        );
      } finally {
        if (componenteAtivo) {
          setCarregandoEstoque(false);
        }
      }
    };

    void carregarDadosIniciais();

    return () => {
      componenteAtivo = false;
    };
  }, [mostrarMensagem]);

  const entradasVisiveis = useMemo(() => {
    if (adminMaster) {
      return entradas;
    }

    return entradas.filter((entrada) => {
      return (
        normalizarTexto(entrada.unidade) ===
        normalizarTexto(unidadeUsuario)
      );
    });
  }, [
    entradas,
    adminMaster,
    unidadeUsuario,
  ]);

  const produtoSelecionado = useMemo(() => {
    return (
      PRODUTOS.find(
        (produto) =>
          produto.valor === tipoProduto
      ) || null
    );
  }, [tipoProduto]);

  const pesosCadastrados = useMemo(() => {
    if (!tipoProduto) {
      return [];
    }

    const pesos = produtosCadastrados
      .filter((produto) => {
        const mesmoTipo =
          produto.tipoProduto ===
          tipoProduto;

        const produtoAtivo =
          !produto.situacao ||
          normalizarTexto(
            produto.situacao
          ) === 'ATIVO';

        return (
          mesmoTipo &&
          produtoAtivo
        );
      })
      .map((produto) =>
        Number(
          produto.pesoUnidadeKg
        )
      )
      .filter(
        (peso) =>
          Number.isFinite(peso) &&
          peso > 0
      );

    return [...new Set(pesos)].sort(
      (a, b) => a - b
    );
  }, [
    produtosCadastrados,
    tipoProduto,
  ]);

  const usandoNovoPeso =
    pesoSelecionado === 'NOVO';

  const pesoUtilizado = usandoNovoPeso
    ? Number(novoPeso)
    : Number(pesoSelecionado);

  const quantidadeNumerica =
    Number(quantidade);

  const pesoTotalKg =
    pesoUtilizado > 0 &&
    quantidadeNumerica > 0
      ? pesoUtilizado *
        quantidadeNumerica
      : 0;

  const limparFormulario = () => {
    setTipoProduto('');
    setPesoSelecionado('');
    setNovoPeso('');
    setQuantidade('');
    setDataEntrada(dataHoje());
    setFornecedor('');
    setLote('');
    setValidade('');
    setNumeroDocumento('');
    setObservacao('');
  };

  const handleProdutoChange = (
    event
  ) => {
    const novoTipoProduto =
      event.target.value;

    const pesosDoProduto =
      produtosCadastrados
        .filter((produto) => {
          const mesmoTipo =
            produto.tipoProduto ===
            novoTipoProduto;

          const produtoAtivo =
            !produto.situacao ||
            normalizarTexto(
              produto.situacao
            ) === 'ATIVO';

          return (
            mesmoTipo &&
            produtoAtivo
          );
        })
        .map((produto) =>
          Number(
            produto.pesoUnidadeKg
          )
        )
        .filter(
          (peso) =>
            Number.isFinite(peso) &&
            peso > 0
        );

    const pesosUnicos = [
      ...new Set(pesosDoProduto),
    ].sort((a, b) => a - b);

    setTipoProduto(
      novoTipoProduto
    );

    setPesoSelecionado(
      pesosUnicos.length === 1
        ? String(pesosUnicos[0])
        : ''
    );

    setNovoPeso('');
    setQuantidade('');
    setMensagem('');
  };

  const handleSalvar = async (
    event
  ) => {
    event.preventDefault();

    if (!podeAlterarEstoque) {
      mostrarMensagem(
        'Acesso negado. Apenas administradores podem cadastrar entradas de estoque.'
      );

      return;
}

    if (salvandoEntrada) {
      return;
    }

    if (!produtoSelecionado) {
      mostrarMensagem(
        'Selecione o produto.'
      );
      return;
    }

    if (!pesoSelecionado) {
      mostrarMensagem(
        'Selecione ou cadastre o peso por unidade.'
      );
      return;
    }

    if (
      !Number.isFinite(pesoUtilizado) ||
      pesoUtilizado <= 0
    ) {
      mostrarMensagem(
        'Informe um peso válido.'
      );
      return;
    }

    if (
      !Number.isFinite(
        quantidadeNumerica
      ) ||
      quantidadeNumerica <= 0
    ) {
      mostrarMensagem(
        'Informe uma quantidade válida.'
      );
      return;
    }

    if (
      !Number.isInteger(
        quantidadeNumerica
      )
    ) {
      mostrarMensagem(
        `A quantidade de ${produtoSelecionado.unidadePlural} deve ser inteira.`
      );
      return;
    }

    if (!dataEntrada) {
      mostrarMensagem(
        'Informe a data da entrada.'
      );
      return;
    }

    if (!responsavel.trim()) {
      mostrarMensagem(
        'Informe o responsável pelo recebimento.'
      );
      return;
    }

    if (!unidadeUsuario) {
      mostrarMensagem(
        'A unidade do usuário não foi identificada.'
      );
      return;
    }

    const payload = {
      tipoProduto:
        produtoSelecionado.valor,

      pesoUnidadeKg:
        pesoUtilizado,

      quantidadeInicial:
        quantidadeNumerica,

      dataEntrada,

      codigoLote:
        lote.trim() || null,

      fornecedor:
        fornecedor.trim() || null,

      validade:
        validade || null,

      numeroDocumento:
        numeroDocumento.trim() || null,

      responsavelRecebimento:
        responsavel.trim(),

      observacao:
        observacao.trim() || null,

      unidade:
        unidadeUsuario,
    };

    setSalvandoEntrada(true);
    setMensagem('');

    try {
      const resposta =
        await cadastrarEntradaFenoRacao(
          payload
        );

      const entradaSalva = {
        ...payload,
        ...resposta,

        nomeProduto:
          resposta?.nomeProduto ||
          produtoSelecionado.nome,

        tipoProduto:
          resposta?.tipoProduto ||
          payload.tipoProduto,

        pesoUnidadeKg:
          resposta?.pesoUnidadeKg ??
          payload.pesoUnidadeKg,

        quantidadeInicial:
          resposta?.quantidadeInicial ??
          payload.quantidadeInicial,

        quantidadeAtual:
          resposta?.quantidadeAtual ??
          payload.quantidadeInicial,

        pesoTotalKg:
          resposta?.pesoTotalKg ??
          pesoTotalKg,

        codigoLote:
          resposta?.codigoLote ??
          payload.codigoLote,

        responsavelRecebimento:
          resposta?.responsavelRecebimento ??
          payload.responsavelRecebimento,

        unidade:
          resposta?.unidade ??
          payload.unidade,
      };

      setEntradaCadastrada(
        entradaSalva
      );

      limparFormulario();

      await carregarEstoque();
    } catch (erro) {
      const mensagemErro =
        obterMensagemErro(
          erro,
          'Não foi possível cadastrar a entrada.'
        );

      abrirModalMensagem({
        tipo: 'erro',
        titulo: 'Cadastro não realizado',
        mensagem: mensagemErro,
      });
    } finally {
      setSalvandoEntrada(false);
    }
  };

  const abrirCancelamento = (
    entrada
  ) => {
    if (!podeAlterarEstoque) {
      mostrarMensagem(
        'Acesso negado. Apenas administradores podem cancelar entradas.'
      );

      return;
    }

    if (
      !adminMaster &&
      normalizarTexto(
        entrada.unidade
      ) !==
        normalizarTexto(
          unidadeUsuario
        )
    ) {
      mostrarMensagem(
        'Acesso negado. Você só pode cancelar entradas da sua unidade.'
      );

      return;
    }

    setEntradaParaExcluir(entrada);
    setMotivoCancelamento('');
  };

  const confirmarExclusao =
    async () => {
      if (
        !entradaParaExcluir ||
        cancelandoEntrada
      ) {
        return;
      }

      const loteId =
        entradaParaExcluir.id ??
        entradaParaExcluir.loteId;

      if (
        !Number.isInteger(
          Number(loteId)
        ) ||
        Number(loteId) <= 0
      ) {
        mostrarMensagem(
          'O identificador do lote é inválido.'
        );
        return;
      }

      const motivoTratado =
        motivoCancelamento.trim();

      if (!motivoTratado) {
        mostrarMensagem(
          'Informe o motivo do cancelamento.'
        );
        return;
      }

      setCancelandoEntrada(true);

      try {
        await cancelarEntradaFenoRacao(
          Number(loteId),
          motivoTratado
        );

        setEntradaParaExcluir(null);
        setMotivoCancelamento('');

        mostrarMensagem(
          'Entrada cancelada com sucesso.'
        );

        await carregarEstoque();
      } catch (erro) {
        mostrarMensagem(
          obterMensagemErro(
            erro,
            'Não foi possível cancelar a entrada.'
          )
        );
      } finally {
        setCancelandoEntrada(false);
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

  const obterClasseIconeProduto = (
    tipo
  ) => {
    if (tipo === 'FENO') {
      return 'icone-feno';
    }

    if (
      tipo ===
        'RACAO_POTRO_PREMIUM' ||
      tipo ===
        'RACAO_POTRO_MANUTENCAO'
    ) {
      return 'icone-racao-potro';
    }

    return 'icone-racao-adulto';
  };

  const obterProdutoPorTipo = (
    tipo
  ) => {
    return PRODUTOS.find(
      (produto) =>
        produto.valor === tipo
    );
  };

  const obterNomeProduto = (
    entrada
  ) => {
    return (
      entrada.nomeProduto ||
      obterProdutoPorTipo(
        entrada.tipoProduto
      )?.nome ||
      entrada.tipoProduto ||
      'Produto'
    );
  };

  const obterUnidadeProduto = (
    entrada
  ) => {
    const produto =
      obterProdutoPorTipo(
        entrada.tipoProduto
      );

    return (
      produto?.unidadePlural ||
      'unidades'
    );
  };

  const obterQuantidadeInicial = (
    entrada
  ) => {
    return Number(
      entrada.quantidadeInicial ??
        entrada.quantidadeEntrada ??
        entrada.quantidade ??
        0
    );
  };

  const obterQuantidadeAtual = (
    entrada
  ) => {
    return Number(
      entrada.quantidadeAtual ??
        entrada.saldoAtual ??
        entrada.quantidadeInicial ??
        entrada.quantidadeEntrada ??
        entrada.quantidade ??
        0
    );
  };

  const obterCodigoLote = (
    entrada
  ) => {
    return (
      entrada.codigoLote ||
      entrada.lote ||
      ''
    );
  };

  const entradaEstaCancelada = (
    entrada
  ) => {
    return (
      normalizarTexto(
        entrada.situacao
      ) === 'CANCELADO'
    );
  };

  return (
    <main className="cadastro-alimentacao-page">
      <section className="cadastro-alimentacao-phone">
        <header className="cadastro-alimentacao-header">
          <button
            type="button"
            className="cadastro-alimentacao-voltar"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>
              Alimentação equina
            </span>

            <h1>Feno e Ração</h1>

            <p>
              {adminMaster
                ? 'Admin Master - Todas as unidades'
                : unidadeUsuario ||
                  'Controle de estoque'}
            </p>
          </div>
        </header>

        <section className="cadastro-alimentacao-apresentacao">
          <div className="cadastro-alimentacao-apresentacao-icon">
            <FaHorse />
          </div>

          <div>
            <span>
              Entrada de estoque
            </span>

            <h2>
              Cadastrar Feno e Ração
            </h2>

            <p>
              {adminMaster
                ? 'Registre entradas e visualize os estoques de todas as unidades.'
                : `Registre e acompanhe somente as entradas da unidade ${unidadeUsuario}.`}
            </p>
          </div>
        </section>

        {mensagem && (
          <div className="cadastro-alimentacao-mensagem">
            {mensagem}
          </div>
        )}

        <section className="cadastro-alimentacao-card">
          <div className="cadastro-alimentacao-card-titulo">
            <FaPlus />

            <div>
              <h2>Nova entrada</h2>

              <p>
                Informe os dados recebidos
                no estoque da unidade{' '}
                <strong>
                  {unidadeUsuario}
                </strong>
                .
              </p>
            </div>
          </div>

          <form
            className="cadastro-alimentacao-form"
            onSubmit={handleSalvar}
          >
            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="tipoProduto">
                Produto
              </label>

              <select
                id="tipoProduto"
                value={tipoProduto}
                onChange={
                  handleProdutoChange
                }
                disabled={
                  salvandoEntrada
                }
              >
                <option value="">
                  Selecione o produto
                </option>

                {PRODUTOS.map(
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

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="pesoUnidade">
                Peso por{' '}
                {produtoSelecionado?.unidade ||
                  'unidade'}
              </label>

              <select
                id="pesoUnidade"
                value={
                  pesoSelecionado
                }
                onChange={(event) => {
                  setPesoSelecionado(
                    event.target.value
                  );

                  setNovoPeso('');
                  setMensagem('');
                }}
                disabled={
                  !tipoProduto ||
                  salvandoEntrada
                }
              >
                <option value="">
                  {tipoProduto
                    ? pesosCadastrados.length > 0
                      ? 'Selecione o peso'
                      : 'Nenhum peso cadastrado'
                    : 'Selecione o produto primeiro'}
                </option>

                {pesosCadastrados.map(
                  (peso) => (
                    <option
                      key={peso}
                      value={peso}
                    >
                      {formatarNumero(
                        peso
                      )}{' '}
                      kg
                    </option>
                  )
                )}

                <option value="NOVO">
                  + Cadastrar novo peso
                </option>
              </select>
            </div>

            {usandoNovoPeso && (
              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="novoPeso">
                  Novo peso em
                  quilogramas
                </label>

                <div className="cadastro-alimentacao-input-unidade">
                  <input
                    id="novoPeso"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={novoPeso}
                    placeholder="Ex.: 10"
                    disabled={
                      salvandoEntrada
                    }
                    onChange={(
                      event
                    ) => {
                      setNovoPeso(
                        event.target
                          .value
                      );

                      setMensagem('');
                    }}
                  />

                  <span>kg</span>
                </div>
              </div>
            )}

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="quantidade">
                Quantidade de{' '}
                {produtoSelecionado?.unidadePlural ||
                  'unidades'}
              </label>

              <input
                id="quantidade"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={quantidade}
                placeholder={
                  produtoSelecionado
                    ? `Ex.: 350 ${produtoSelecionado.unidadePlural}`
                    : 'Informe a quantidade'
                }
                disabled={
                  !tipoProduto ||
                  salvandoEntrada
                }
                onChange={(event) => {
                  setQuantidade(
                    event.target.value
                  );

                  setMensagem('');
                }}
              />
            </div>

            <div className="cadastro-alimentacao-resumo">
              <div>
                <span>
                  Peso por unidade
                </span>

                <strong>
                  {pesoUtilizado > 0
                    ? `${formatarNumero(
                        pesoUtilizado
                      )} kg`
                    : '0 kg'}
                </strong>
              </div>

              <div>
                <span>
                  Quantidade
                </span>

                <strong>
                  {quantidadeNumerica > 0
                    ? `${formatarNumero(
                        quantidadeNumerica
                      )} ${
                        produtoSelecionado?.unidadePlural ||
                        'unidades'
                      }`
                    : '0'}
                </strong>
              </div>

              <div className="cadastro-alimentacao-resumo-total">
                <span>
                  Peso total recebido
                </span>

                <strong>
                  {formatarNumero(
                    pesoTotalKg
                  )}{' '}
                  kg
                </strong>
              </div>
            </div>

            <div className="cadastro-alimentacao-grid">
              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="dataEntrada">
                  Data da entrada
                </label>

                <input
                  id="dataEntrada"
                  type="date"
                  value={dataEntrada}
                  disabled={
                    salvandoEntrada
                  }
                  onChange={(event) =>
                    setDataEntrada(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="validade">
                  Validade
                </label>

                <input
                  id="validade"
                  type="date"
                  value={validade}
                  disabled={
                    salvandoEntrada
                  }
                  onChange={(event) =>
                    setValidade(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="cadastro-alimentacao-grid">
              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="fornecedor">
                  Fornecedor
                </label>

                <input
                  id="fornecedor"
                  type="text"
                  maxLength={150}
                  value={fornecedor}
                  placeholder="Nome do fornecedor"
                  disabled={
                    salvandoEntrada
                  }
                  onChange={(event) =>
                    setFornecedor(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="numeroDocumento">
                  Número do documento
                </label>

                <input
                  id="numeroDocumento"
                  type="text"
                  maxLength={100}
                  value={
                    numeroDocumento
                  }
                  placeholder="Ex.: NF-1234"
                  disabled={
                    salvandoEntrada
                  }
                  onChange={(event) =>
                    setNumeroDocumento(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="lote">
                Lote
              </label>

              <input
                id="lote"
                type="text"
                maxLength={100}
                value={lote}
                placeholder="Ex.: RAP-2026-001"
                disabled={
                  salvandoEntrada
                }
                onChange={(event) =>
                  setLote(
                    event.target.value
                  )
                }
              />

              <small className="cadastro-alimentacao-ajuda">
                O lote identifica a
                entrada recebida no
                estoque e mantém os
                saldos separados por
                produto, peso, validade
                e data de recebimento.
              </small>
            </div>

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="responsavel">
                Responsável
              </label>

              <input
                id="responsavel"
                type="text"
                maxLength={150}
                value={responsavel}
                placeholder="Responsável pelo recebimento"
                disabled={
                  salvandoEntrada
                }
                onChange={(event) =>
                  setResponsavel(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="observacao">
                Observação
              </label>

              <textarea
                id="observacao"
                maxLength={500}
                value={observacao}
                placeholder="Informações adicionais sobre a entrada"
                disabled={
                  salvandoEntrada
                }
                onChange={(event) =>
                  setObservacao(
                    event.target.value
                  )
                }
              />
            </div>

            <button
              type="submit"
              className="cadastro-alimentacao-salvar"
              disabled={
                salvandoEntrada
              }
            >
              <FaPlus />

              {salvandoEntrada
                ? 'Cadastrando...'
                : 'Cadastrar entrada'}
            </button>
          </form>
        </section>

        <section className="cadastro-alimentacao-card">
          <div className="cadastro-alimentacao-lista-header">
            <div>
              <span>
                Estoque registrado
              </span>

              <h2>
                {adminMaster
                  ? 'Lotes cadastrados em todas as unidades'
                  : `Lotes cadastrados - ${unidadeUsuario}`}
              </h2>
            </div>

            <strong>
              {entradasVisiveis.length}
            </strong>
          </div>

          {carregandoEstoque ? (
            <div className="cadastro-alimentacao-vazio">
              <FaBoxesStacked />

              <p>
                Carregando estoque...
              </p>
            </div>
          ) : entradasVisiveis.length ===
            0 ? (
            <div className="cadastro-alimentacao-vazio">
              <FaBoxesStacked />

              <p>
                Nenhuma entrada
                cadastrada para esta
                unidade.
              </p>
            </div>
          ) : (
            <div className="cadastro-alimentacao-lista">
              {entradasVisiveis.map(
                (entrada) => {
                  const produto =
                    obterProdutoPorTipo(
                      entrada.tipoProduto
                    );

                  const quantidadeInicial =
                    obterQuantidadeInicial(
                      entrada
                    );

                  const quantidadeAtual =
                    obterQuantidadeAtual(
                      entrada
                    );

                  const pesoTotalAtual =
                    quantidadeAtual *
                    Number(
                      entrada.pesoUnidadeKg ||
                        0
                    );

                  const cancelada =
                    entradaEstaCancelada(
                      entrada
                    );

                  return (
                    <article
                      key={
                        entrada.id ??
                        entrada.loteId ??
                        `${entrada.tipoProduto}-${obterCodigoLote(
                          entrada
                        )}-${entrada.dataEntrada}`
                      }
                      className="cadastro-alimentacao-item"
                    >
                      <div
                        className={`cadastro-alimentacao-item-icon ${obterClasseIconeProduto(
                          entrada.tipoProduto
                        )}`}
                      >
                        {renderizarIconeProduto(
                          entrada.tipoProduto
                        )}
                      </div>

                      <div className="cadastro-alimentacao-item-info">
                        <span>
                          {obterNomeProduto(
                            entrada
                          )}
                        </span>

                        <h3>
                          {formatarNumero(
                            quantidadeAtual
                          )}{' '}
                          {produto?.unidadePlural ||
                            'unidades'}{' '}
                          disponíveis de{' '}
                          {formatarNumero(
                            entrada.pesoUnidadeKg
                          )}{' '}
                          kg
                        </h3>

                        <p>
                          Quantidade
                          inicial:{' '}
                          <strong>
                            {formatarNumero(
                              quantidadeInicial
                            )}
                          </strong>
                        </p>

                        <p>
                          Peso atual:{' '}
                          <strong>
                            {formatarNumero(
                              pesoTotalAtual
                            )}{' '}
                            kg
                          </strong>
                        </p>

                        {entrada.situacao && (
                          <p>
                            Situação:{' '}
                            <strong>
                              {
                                entrada.situacao
                              }
                            </strong>
                          </p>
                        )}

                        <div className="cadastro-alimentacao-item-detalhes">
                          <span>
                            <FaCalendarDays />

                            {formatarData(
                              entrada.dataEntrada
                            )}
                          </span>

                          {obterCodigoLote(
                            entrada
                          ) && (
                            <span>
                              Lote:{' '}
                              {obterCodigoLote(
                                entrada
                              )}
                            </span>
                          )}

                          {entrada.validade && (
                            <span>
                              Validade:{' '}
                              {formatarData(
                                entrada.validade
                              )}
                            </span>
                          )}

                          {entrada.unidade && (
                            <span>
                              {
                                entrada.unidade
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {!cancelada && (
                        <button
                          type="button"
                          className="cadastro-alimentacao-excluir"
                          onClick={() =>
                            abrirCancelamento(
                              entrada
                            )
                          }
                          aria-label={`Cancelar entrada de ${obterNomeProduto(
                            entrada
                          )}`}
                        >
                          <FaTrashCan />
                        </button>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {entradaCadastrada && (
          <div className="cadastro-alimentacao-modal-overlay">
            <div className="cadastro-alimentacao-modal">
              <div className="cadastro-alimentacao-modal-icon">
                <FaBoxesStacked />
              </div>

              <h2>
                Entrada cadastrada com
                sucesso!
              </h2>

              <p>
                O registro de{' '}
                <strong>
                  {obterNomeProduto(
                    entradaCadastrada
                  )}
                </strong>{' '}
                foi lançado no estoque
                da unidade{' '}
                <strong>
                  {
                    entradaCadastrada.unidade
                  }
                </strong>
                .
              </p>

              <div className="cadastro-alimentacao-modal-resumo">
                <span>Produto</span>

                <strong>
                  {obterNomeProduto(
                    entradaCadastrada
                  )}
                </strong>

                <span>Unidade</span>

                <strong>
                  {entradaCadastrada.unidade ||
                    '-'}
                </strong>

                <span>
                  Data da entrada
                </span>

                <strong>
                  {formatarData(
                    entradaCadastrada.dataEntrada
                  )}
                </strong>

                <span>
                  Quantidade cadastrada
                </span>

                <strong>
                  {formatarNumero(
                    obterQuantidadeInicial(
                      entradaCadastrada
                    )
                  )}{' '}
                  {obterUnidadeProduto(
                    entradaCadastrada
                  )}
                </strong>

                <span>
                  Peso por unidade
                </span>

                <strong>
                  {formatarNumero(
                    entradaCadastrada.pesoUnidadeKg
                  )}{' '}
                  kg
                </strong>

                <span>
                  Peso total recebido
                </span>

                <strong>
                  {formatarNumero(
                    Number(
                      entradaCadastrada.pesoUnidadeKg ||
                        0
                    ) *
                      obterQuantidadeInicial(
                        entradaCadastrada
                      )
                  )}{' '}
                  kg
                </strong>

                <span>Lote</span>

                <strong>
                  {obterCodigoLote(
                    entradaCadastrada
                  ) || '-'}
                </strong>

                <span>
                  Fornecedor
                </span>

                <strong>
                  {entradaCadastrada.fornecedor ||
                    '-'}
                </strong>

                <span>
                  Documento
                </span>

                <strong>
                  {entradaCadastrada.numeroDocumento ||
                    '-'}
                </strong>

                <span>Validade</span>

                <strong>
                  {formatarData(
                    entradaCadastrada.validade
                  )}
                </strong>

                <span>
                  Responsável
                </span>

                <strong>
                  {entradaCadastrada.responsavelRecebimento ||
                    '-'}
                </strong>
              </div>

              <div className="cadastro-alimentacao-modal-actions">
                <button
                  type="button"
                  className="cadastro-alimentacao-confirmar-exclusao"
                  onClick={() =>
                    setEntradaCadastrada(
                      null
                    )
                  }
                >
                  <FaPlus />
                  Cadastrar nova entrada
                </button>

                <button
                  type="button"
                  className="cadastro-alimentacao-cancelar-exclusao"
                  onClick={() =>
                    setEntradaCadastrada(
                      null
                    )
                  }
                >
                  <FaXmark />
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {entradaParaExcluir && (
          <div className="cadastro-alimentacao-modal-overlay">
            <div className="cadastro-alimentacao-modal">
              <div className="cadastro-alimentacao-modal-icon">
                <FaTriangleExclamation />
              </div>

              <h2>
                Cancelar entrada?
              </h2>

              <p>
                Deseja cancelar o lote de{' '}
                <strong>
                  {obterNomeProduto(
                    entradaParaExcluir
                  )}
                </strong>
                ?
              </p>

              <div className="cadastro-alimentacao-modal-resumo">
                <span>Unidade</span>

                <strong>
                  {entradaParaExcluir.unidade ||
                    '-'}
                </strong>

                <span>Lote</span>

                <strong>
                  {obterCodigoLote(
                    entradaParaExcluir
                  ) || '-'}
                </strong>

                <span>
                  Quantidade atual
                </span>

                <strong>
                  {formatarNumero(
                    obterQuantidadeAtual(
                      entradaParaExcluir
                    )
                  )}{' '}
                  {obterUnidadeProduto(
                    entradaParaExcluir
                  )}
                </strong>

                <span>
                  Peso por unidade
                </span>

                <strong>
                  {formatarNumero(
                    entradaParaExcluir.pesoUnidadeKg
                  )}{' '}
                  kg
                </strong>
              </div>

              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="motivoCancelamento">
                  Motivo do cancelamento
                </label>

                <textarea
                  id="motivoCancelamento"
                  value={
                    motivoCancelamento
                  }
                  maxLength={500}
                  placeholder="Informe por que esta entrada está sendo cancelada"
                  disabled={
                    cancelandoEntrada
                  }
                  onChange={(event) =>
                    setMotivoCancelamento(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="cadastro-alimentacao-modal-actions">
                <button
                  type="button"
                  className="cadastro-alimentacao-confirmar-exclusao"
                  disabled={
                    cancelandoEntrada
                  }
                  onClick={
                    confirmarExclusao
                  }
                >
                  <FaTrashCan />

                  {cancelandoEntrada
                    ? 'Cancelando...'
                    : 'Sim, cancelar entrada'}
                </button>

                <button
                  type="button"
                  className="cadastro-alimentacao-cancelar-exclusao"
                  disabled={
                    cancelandoEntrada
                  }
                  onClick={() => {
                    setEntradaParaExcluir(
                      null
                    );

                    setMotivoCancelamento(
                      ''
                    );
                  }}
                >
                  <FaXmark />
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}
        <ModalMensagem
          aberto={modalMensagem.aberto}
          tipo={modalMensagem.tipo}
          titulo={modalMensagem.titulo}
          mensagem={modalMensagem.mensagem}
          onFechar={fecharModalMensagem}
        />
      </section>
    </main>
  );
}

export default CadastroFenoRacao;