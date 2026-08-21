import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBoxesStacked,
  FaCalendarDays,
  FaChartColumn,
  FaFileLines,
  FaPrint,
  FaTriangleExclamation,
  FaWheatAwn,
  FaFilePdf,
} from 'react-icons/fa6';
import { GiGrain } from 'react-icons/gi';

import { gerarRelatorioFenoRacaoPdf } from '../relatorios/gerarRelatorioFenoRacaoPdf';
import {
  listarEstoqueFenoRacao,
  listarMovimentacoesFenoRacao,
} from '../services/fenoRacaoEstoqueService';
import { listarTransferencias } from '../services/fenoRacaoTransferenciaService';
import { listarUnidades } from '../services/unidadeService';

import '../styles/RelatorioFenoRacao.css';


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

const dataHoje = () => new Date().toISOString().slice(0, 10);

const primeiroDiaDoMes = () => {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');

  return `${ano}-${mes}-01`;
};

const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const obterDataSemHorario = (valor) => {
  if (!valor) return '';

  return String(valor).split('T')[0];
};

const formatarData = (valor) => {
  const dataSemHorario = obterDataSemHorario(valor);

  if (!dataSemHorario) return '-';

  const [ano, mes, dia] = dataSemHorario.split('-');

  if (!ano || !mes || !dia) return String(valor);

  return `${dia}/${mes}/${ano}`;
};

const extrairListaResposta = (resposta) => {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta?.content)) return resposta.content;
  if (Array.isArray(resposta?.dados)) return resposta.dados;
  if (Array.isArray(resposta?.itens)) return resposta.itens;

  return [];
};

const extrairUnidadesAtivasResposta = (resposta) => {
  const dadosPossiveis = [
    resposta,
    resposta?.data,
    resposta?.content,
    resposta?.dados,
    resposta?.itens,
  ];

  const unidadesRecebidas =
    dadosPossiveis.find(Array.isArray) || [];

  return unidadesRecebidas.filter((unidade) => {
    const ativoInformado =
      unidade?.ativo ??
      unidade?.ATIVO;

    const situacao = String(
      unidade?.situacao ??
      unidade?.status ??
      ''
    )
      .trim()
      .toUpperCase();

    return (
      ativoInformado === undefined ||
      ativoInformado === null ||
      ativoInformado === true ||
      Number(ativoInformado) === 1 ||
      situacao === 'ATIVO'
    );
  });
};

const obterMensagemErro = (erro) => {
  return (
    erro?.message ||
    erro?.response?.data?.message ||
    'Não foi possível carregar os dados do relatório.'
  );
};

const normalizarMovimentacao = (movimentacao) => {
  const quantidade = Number(
    movimentacao?.quantidadeUnidades ??
      movimentacao?.quantidade ??
      0
  );

  const pesoMovimentado = Number(
    movimentacao?.pesoMovimentadoKg ??
      movimentacao?.pesoTotalKg ??
      quantidade * Number(movimentacao?.pesoUnidadeKg ?? 0)
  );

  const unidade =
    movimentacao?.unidade ||
    movimentacao?.unidadeOrigem ||
    movimentacao?.unidadeDestino ||
    '';

  const codigoLote =
    movimentacao?.codigoLote ||
    movimentacao?.lote ||
    '';

  const dataOperacao =
    movimentacao?.dataOperacao ||
    movimentacao?.dataCadastro ||
    '';

  return {
    ...movimentacao,
    unidade,
    lote: codigoLote,
    codigoLote,
    dataSaida: movimentacao?.dataSaida || dataOperacao,
    dataExtravio: movimentacao?.dataExtravio || dataOperacao,
    quantidadeRetirada:
      movimentacao?.quantidadeRetirada ?? quantidade,
    pesoLiberadoKg:
      movimentacao?.pesoLiberadoKg ?? pesoMovimentado,
    quantidadeExtraviada:
      movimentacao?.quantidadeExtraviada ?? quantidade,
    pesoExtraviadoKg:
      movimentacao?.pesoExtraviadoKg ?? pesoMovimentado,
    responsavel:
      movimentacao?.responsavel ||
      movimentacao?.usuarioCadastroNome ||
      movimentacao?.nomeUsuario ||
      '-',
    motivo:
      movimentacao?.motivo ||
      movimentacao?.observacao ||
      '-',
  };
};

const obterNomeProduto = (tipo) => {
  if (tipo === 'FENO') return 'Feno';

  if (tipo === 'RACAO_ADULTO_PREMIUM') {
    return 'Ração Adulto Premium';
  }

  if (tipo === 'RACAO_ADULTO_MANUTENCAO') {
    return 'Ração Adulto Manutenção';
  }

  if (tipo === 'RACAO_POTRO_PREMIUM') {
    return 'Ração Potro Premium';
  }

  if (tipo === 'RACAO_POTRO_MANUTENCAO') {
    return 'Ração Potro Manutenção';
  }

  return tipo || '-';
};

const obterIconeProduto = (tipo) => {
  if (tipo === 'FENO') return <FaWheatAwn />;

  return <GiGrain />;
};

const normalizarTexto = (valor) => {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/º/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
};

const normalizarUnidade = (valor) => {
  return normalizarTexto(valor)
    .replace(/\s+/g, '');
};

const obterUnidadeUsuario = (usuario) => {
  return usuario?.unidade || usuario?.UNIDADE || usuario?.Unidade || 'RPMont';
};

const obterNivelUsuario = (usuario) => {
  const nivel =
    usuario?.nivel ??
    usuario?.NIVEL ??
    usuario?.Nivel ??
    usuario?.nivelAcesso ??
    usuario?.NIVEL_ACESSO ??
    NIVEIS_USUARIO.USUARIO_COMUM;

  return Number(nivel);
};

const unidadesSaoIguais = (unidadeA, unidadeB) => {
  return normalizarUnidade(unidadeA) === normalizarUnidade(unidadeB);
};

const obterUnidadeRegistro = (registro) => {
  return registro?.unidade || registro?.UNIDADE || registro?.Unidade || '';
};

const obterPesoUnidadeRegistro = (registro) => {
  const pesoDireto = Number(
    registro?.pesoUnidadeKg ??
      registro?.pesoPorUnidade ??
      registro?.pesoUnitarioKg ??
      0
  );

  if (pesoDireto > 0) return pesoDireto;

  const quantidadeSaida = Number(registro?.quantidadeRetirada || 0);
  const pesoLiberado = Number(registro?.pesoLiberadoKg || 0);

  if (quantidadeSaida > 0 && pesoLiberado > 0) {
    return pesoLiberado / quantidadeSaida;
  }

  const quantidadeExtraviada = Number(registro?.quantidadeExtraviada || 0);
  const pesoExtraviado = Number(registro?.pesoExtraviadoKg || 0);

  if (quantidadeExtraviada > 0 && pesoExtraviado > 0) {
    return pesoExtraviado / quantidadeExtraviada;
  }

  return 0;
};

const obterUnidadeOrigemTransferencia = (transferencia) => {
  return (
    transferencia?.unidadeOrigem ||
    transferencia?.UNIDADE_ORIGEM ||
    transferencia?.origem ||
    transferencia?.unidadeSaida ||
    transferencia?.unidadeSolicitada ||
    ''
  );
};

const obterUnidadeDestinoTransferencia = (transferencia) => {
  return (
    transferencia?.unidadeDestino ||
    transferencia?.UNIDADE_DESTINO ||
    transferencia?.destino ||
    transferencia?.unidadeEntrada ||
    transferencia?.unidadeSolicitante ||
    ''
  );
};

const obterDataTransferencia = (transferencia) => {
  return (
    transferencia?.dataAprovacao ||
    transferencia?.dataTransferencia ||
    transferencia?.dataSolicitacao ||
    transferencia?.dataCadastro ||
    transferencia?.data ||
    ''
  );
};

const obterQuantidadeTransferencia = (transferencia) => {
  return Number(
    transferencia?.quantidadeTransferida ??
      transferencia?.quantidadeAprovada ??
      transferencia?.quantidadeSolicitada ??
      transferencia?.quantidade ??
      0
  );
};

const obterPesoUnidadeTransferencia = (transferencia) => {
  return Number(
    transferencia?.pesoUnidadeKg ??
      transferencia?.pesoPorUnidade ??
      transferencia?.pesoUnitarioKg ??
      0
  );
};

const obterPesoTotalTransferencia = (transferencia) => {
  const pesoTotalSalvo = Number(
    transferencia?.pesoTotalTransferidoKg ??
      transferencia?.pesoTotalKg ??
      transferencia?.pesoTransferidoKg ??
      transferencia?.pesoTotalAprovadoKg ??
      transferencia?.pesoSolicitadoKg ??
      0
  );

  if (pesoTotalSalvo > 0) return pesoTotalSalvo;

  return (
    obterQuantidadeTransferencia(transferencia) *
    obterPesoUnidadeTransferencia(transferencia)
  );
};

const obterLoteTransferencia = (transferencia) => {
  const itens = Array.isArray(transferencia?.itens)
    ? transferencia.itens
    : Array.isArray(transferencia?.etapas)
      ? transferencia.etapas
      : [];

  const lotesDosItens = itens
    .map(
      (item) =>
        item?.codigoLoteOrigem ||
        item?.codigoLote ||
        item?.lote ||
        ''
    )
    .filter(Boolean);

  if (lotesDosItens.length > 0) {
    return [...new Set(lotesDosItens)].join(', ');
  }

  return (
    transferencia?.codigoLoteOrigem ||
    transferencia?.codigoLote ||
    transferencia?.lote ||
    '-'
  );
};

const transferenciaEstaAprovada = (transferencia) => {
  const status = normalizarTexto(
    transferencia?.status || transferencia?.situacao || ''
  );

  return (
    status === 'APROVADA' ||
    status === 'APROVADO' ||
    status === 'CONCLUIDA' ||
    status === 'CONCLUIDO' ||
    status === 'TRANSFERIDA'
  );
};


function RelatorioFenoRacao({ usuario, onVoltar }) {
  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [extravios, setExtravios] = useState([]);
  const [transferencias, setTransferencias] = useState([]);
  const [unidadesCadastradas, setUnidadesCadastradas] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');

  const unidadeUsuario = obterUnidadeUsuario(usuario);
  const nivelUsuario = obterNivelUsuario(usuario);

  const usuarioAdminMaster =
    nivelUsuario === NIVEIS_USUARIO.ADMIN_MASTER;

  const podeSelecionarUnidadeRelatorio = usuarioAdminMaster;

  const [dataInicial, setDataInicial] = useState(primeiroDiaDoMes());
  const [dataFinal, setDataFinal] = useState(dataHoje());
  const [produtoSelecionado, setProdutoSelecionado] = useState('TODOS');
  const [pesoSelecionado, setPesoSelecionado] = useState('TODOS');
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(() => {
    return podeSelecionarUnidadeRelatorio ? 'GERAL' : unidadeUsuario;
  });
  const [gerandoPdf, setGerandoPdf] = useState(false);

  useEffect(() => {
    let componenteAtivo = true;

    const carregarDadosBackend = async () => {
      try {
        setCarregandoDados(true);
        setErroCarregamento('');

        const [
          respostaEstoque,
          respostaMovimentacoes,
          respostaTransferencias,
          respostaUnidades,
        ] = await Promise.all([
          listarEstoqueFenoRacao(),
          listarMovimentacoesFenoRacao({
            dataInicial,
            dataFinal,
          }),
          listarTransferencias(),
          listarUnidades(),
        ]);

        if (!componenteAtivo) return;

        const estoque = extrairListaResposta(respostaEstoque);
        const movimentacoes = extrairListaResposta(
          respostaMovimentacoes
        ).map(normalizarMovimentacao);
        const transferenciasCarregadas = extrairListaResposta(
          respostaTransferencias
        );
        const unidadesAtivas =
          extrairUnidadesAtivasResposta(respostaUnidades);

        setUnidadesCadastradas(unidadesAtivas);
        setEntradas(estoque);
        setSaidas(
          movimentacoes.filter(
            (item) =>
              normalizarTexto(item?.tipoMovimentacao) === 'SAIDA'
          )
        );
        setExtravios(
          movimentacoes.filter(
            (item) =>
              normalizarTexto(item?.tipoMovimentacao) === 'EXTRAVIO'
          )
        );
        setTransferencias(transferenciasCarregadas);
      } catch (error) {
        if (!componenteAtivo) return;

        console.error(
          'Erro ao carregar relatório de feno e ração:',
          error
        );
        setErroCarregamento(obterMensagemErro(error));
      } finally {
        if (componenteAtivo) {
          setCarregandoDados(false);
        }
      }
    };

    carregarDadosBackend();

    return () => {
      componenteAtivo = false;
    };
  }, [
    dataInicial,
    dataFinal,
  ]);

  const produtoAtual = PRODUTOS.find(
    (produto) => produto.valor === produtoSelecionado
  );

  const unidadesDisponiveis = useMemo(() => {
    const chavesComDados = new Set(
      [
        ...entradas.map(obterUnidadeRegistro),
        ...saidas.map(obterUnidadeRegistro),
        ...extravios.map(obterUnidadeRegistro),
        ...transferencias.map(obterUnidadeOrigemTransferencia),
        ...transferencias.map(obterUnidadeDestinoTransferencia),
        unidadeUsuario,
      ]
        .filter(Boolean)
        .map(normalizarUnidade)
    );

    const unidadesOficiais = unidadesCadastradas
      .map((unidade) => {
        const valorOficial = String(
          unidade?.sigla ??
          unidade?.nome ??
          unidade?.unidade ??
          unidade?.descricao ??
          ''
        ).trim();

        if (!valorOficial) return null;

        return {
          chave: normalizarUnidade(valorOficial),
          valor: valorOficial,
        };
      })
      .filter(Boolean)
      .filter((unidade) => chavesComDados.has(unidade.chave));

    const mapa = new Map();

    unidadesOficiais.forEach((unidade) => {
      if (!mapa.has(unidade.chave)) {
        mapa.set(unidade.chave, unidade.valor);
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      String(a).localeCompare(String(b), 'pt-BR')
    );
  }, [
    entradas,
    saidas,
    extravios,
    transferencias,
    unidadeUsuario,
    unidadesCadastradas,
  ]);

  const unidadeRelatorio = podeSelecionarUnidadeRelatorio
    ? unidadeSelecionada
    : unidadeUsuario;

  const relatorioGeral = unidadeRelatorio === 'GERAL';

  const nomeUnidadeRelatorio = relatorioGeral ? 'Geral' : unidadeRelatorio;

  const filtrarPorUnidade = useCallback(
    (item) => {
      if (relatorioGeral) return true;

      const unidadeRegistro = obterUnidadeRegistro(item);

      return unidadesSaoIguais(unidadeRegistro, unidadeRelatorio);
    },
    [relatorioGeral, unidadeRelatorio]
  );

  const filtrarTransferenciaPorUnidade = useCallback(
    (transferencia) => {
      if (relatorioGeral) return true;

      const origem = obterUnidadeOrigemTransferencia(transferencia);
      const destino = obterUnidadeDestinoTransferencia(transferencia);

      return (
        unidadesSaoIguais(origem, unidadeRelatorio) ||
        unidadesSaoIguais(destino, unidadeRelatorio)
      );
    },
    [relatorioGeral, unidadeRelatorio]
  );

  const pesosDisponiveis = useMemo(() => {
    const registrosComuns = [...entradas, ...saidas, ...extravios]
      .filter((item) => {
        const produtoConfere =
          produtoSelecionado === 'TODOS' ||
          item?.tipoProduto === produtoSelecionado;

        return produtoConfere && filtrarPorUnidade(item);
      })
      .map(obterPesoUnidadeRegistro);

    const pesosTransferencias = transferencias
      .filter((transferencia) => {
        const produtoConfere =
          produtoSelecionado === 'TODOS' ||
          transferencia?.tipoProduto === produtoSelecionado;

        return (
          produtoConfere &&
          transferenciaEstaAprovada(transferencia) &&
          filtrarTransferenciaPorUnidade(transferencia)
        );
      })
      .map(obterPesoUnidadeTransferencia);

    const pesos = [...registrosComuns, ...pesosTransferencias].filter(
      (peso) => Number.isFinite(peso) && peso > 0
    );

    return [...new Set(pesos)].sort((a, b) => a - b);
  }, [
    entradas,
    saidas,
    extravios,
    transferencias,
    produtoSelecionado,
    filtrarPorUnidade,
    filtrarTransferenciaPorUnidade,
  ]);

  const filtrarPorPeso = useCallback(
    (item) => {
      if (pesoSelecionado === 'TODOS') return true;

      const pesoItem = obterPesoUnidadeRegistro(item);

      return Number(pesoItem) === Number(pesoSelecionado);
    },
    [pesoSelecionado]
  );

  const filtrarTransferenciaPorPeso = useCallback(
    (transferencia) => {
      if (pesoSelecionado === 'TODOS') return true;

      const pesoTransferencia = obterPesoUnidadeTransferencia(transferencia);

      return Number(pesoTransferencia) === Number(pesoSelecionado);
    },
    [pesoSelecionado]
  );

  const filtrarPorPeriodoProdutoUnidadeEPeso = useCallback(
    (item, campoData) => {
      const dataItem = obterDataSemHorario(item?.[campoData]);

      const dentroDoPeriodo =
        (!dataInicial || dataItem >= dataInicial) &&
        (!dataFinal || dataItem <= dataFinal);

      const produtoConfere =
        produtoSelecionado === 'TODOS' ||
        item?.tipoProduto === produtoSelecionado;

      return (
        dentroDoPeriodo &&
        produtoConfere &&
        filtrarPorUnidade(item) &&
        filtrarPorPeso(item)
      );
    },
    [
      dataInicial,
      dataFinal,
      produtoSelecionado,
      filtrarPorUnidade,
      filtrarPorPeso,
    ]
  );

  const filtrarTransferenciaPorPeriodoProdutoUnidadeEPeso = useCallback(
    (transferencia) => {
      const dataTransferencia = obterDataSemHorario(
        obterDataTransferencia(transferencia)
      );

      const dentroDoPeriodo =
        (!dataInicial || dataTransferencia >= dataInicial) &&
        (!dataFinal || dataTransferencia <= dataFinal);

      const produtoConfere =
        produtoSelecionado === 'TODOS' ||
        transferencia?.tipoProduto === produtoSelecionado;

      return (
        transferenciaEstaAprovada(transferencia) &&
        dentroDoPeriodo &&
        produtoConfere &&
        filtrarTransferenciaPorUnidade(transferencia) &&
        filtrarTransferenciaPorPeso(transferencia)
      );
    },
    [
      dataInicial,
      dataFinal,
      produtoSelecionado,
      filtrarTransferenciaPorUnidade,
      filtrarTransferenciaPorPeso,
    ]
  );

  const entradasFiltradas = useMemo(() => {
    return entradas
      .filter((entrada) =>
        filtrarPorPeriodoProdutoUnidadeEPeso(entrada, 'dataEntrada')
      )
      .sort((a, b) =>
        String(b.dataEntrada || '').localeCompare(String(a.dataEntrada || ''))
      );
  }, [
    entradas,
    filtrarPorPeriodoProdutoUnidadeEPeso,
  ]);

  const saidasFiltradas = useMemo(() => {
    return saidas
      .filter((saida) =>
        filtrarPorPeriodoProdutoUnidadeEPeso(saida, 'dataSaida')
      )
      .sort((a, b) =>
        String(b.dataSaida || '').localeCompare(String(a.dataSaida || ''))
      );
  }, [
    saidas,
    filtrarPorPeriodoProdutoUnidadeEPeso,
  ]);

  const extraviosFiltrados = useMemo(() => {
    return extravios
      .filter((extravio) =>
        filtrarPorPeriodoProdutoUnidadeEPeso(extravio, 'dataExtravio')
      )
      .sort((a, b) =>
        String(b.dataExtravio || '').localeCompare(
          String(a.dataExtravio || '')
        )
      );
  }, [
    extravios,
    filtrarPorPeriodoProdutoUnidadeEPeso,
  ]);

  const transferenciasFiltradas = useMemo(() => {
    return transferencias
      .filter(filtrarTransferenciaPorPeriodoProdutoUnidadeEPeso)
      .sort((a, b) =>
        String(obterDataTransferencia(b)).localeCompare(
          String(obterDataTransferencia(a))
        )
      );
  }, [
    transferencias,
    filtrarTransferenciaPorPeriodoProdutoUnidadeEPeso,
  ]);

  const transferenciasRecebidas = useMemo(() => {
    if (relatorioGeral) return [];

    return transferenciasFiltradas.filter((transferencia) =>
      unidadesSaoIguais(
        obterUnidadeDestinoTransferencia(transferencia),
        unidadeRelatorio
      )
    );
  }, [transferenciasFiltradas, unidadeRelatorio, relatorioGeral]);

  const transferenciasEnviadas = useMemo(() => {
    if (relatorioGeral) return [];

    return transferenciasFiltradas.filter((transferencia) =>
      unidadesSaoIguais(
        obterUnidadeOrigemTransferencia(transferencia),
        unidadeRelatorio
      )
    );
  }, [transferenciasFiltradas, unidadeRelatorio, relatorioGeral]);

  const estoqueAtualFiltrado = useMemo(() => {
    return entradas.filter((entrada) => {
      const produtoConfere =
        produtoSelecionado === 'TODOS' ||
        entrada?.tipoProduto === produtoSelecionado;

      return (
        produtoConfere &&
        filtrarPorUnidade(entrada) &&
        filtrarPorPeso(entrada)
      );
    });
  }, [
    entradas,
    produtoSelecionado,
    filtrarPorUnidade,
    filtrarPorPeso,
  ]);

  const resumo = useMemo(() => {
    const totalEntradaUnidades = entradasFiltradas.reduce(
      (total, entrada) =>
        total + Number(entrada.quantidadeInicial || entrada.quantidade || 0),
      0
    );

    const totalEntradaKg = entradasFiltradas.reduce((total, entrada) => {
      const quantidade = Number(
        entrada.quantidadeInicial || entrada.quantidade || 0
      );
      const pesoUnidade = Number(entrada.pesoUnidadeKg || 0);

      return total + quantidade * pesoUnidade;
    }, 0);

    const totalSaidaUnidades = saidasFiltradas.reduce(
      (total, saida) => total + Number(saida.quantidadeRetirada || 0),
      0
    );

    const totalSaidaKg = saidasFiltradas.reduce(
      (total, saida) => total + Number(saida.pesoLiberadoKg || 0),
      0
    );

    const totalExtravioUnidades = extraviosFiltrados.reduce(
      (total, extravio) => total + Number(extravio.quantidadeExtraviada || 0),
      0
    );

    const totalExtravioKg = extraviosFiltrados.reduce(
      (total, extravio) => total + Number(extravio.pesoExtraviadoKg || 0),
      0
    );

    const totalTransferenciaGeralUnidades = transferenciasFiltradas.reduce(
      (total, transferencia) =>
        total + obterQuantidadeTransferencia(transferencia),
      0
    );

    const totalTransferenciaGeralKg = transferenciasFiltradas.reduce(
      (total, transferencia) =>
        total + obterPesoTotalTransferencia(transferencia),
      0
    );

    const totalTransferenciaRecebidaUnidades = transferenciasRecebidas.reduce(
      (total, transferencia) =>
        total + obterQuantidadeTransferencia(transferencia),
      0
    );

    const totalTransferenciaRecebidaKg = transferenciasRecebidas.reduce(
      (total, transferencia) =>
        total + obterPesoTotalTransferencia(transferencia),
      0
    );

    const totalTransferenciaEnviadaUnidades = transferenciasEnviadas.reduce(
      (total, transferencia) =>
        total + obterQuantidadeTransferencia(transferencia),
      0
    );

    const totalTransferenciaEnviadaKg = transferenciasEnviadas.reduce(
      (total, transferencia) =>
        total + obterPesoTotalTransferencia(transferencia),
      0
    );

    const saldoAtualUnidades = estoqueAtualFiltrado.reduce(
      (total, entrada) => total + Number(entrada.quantidadeAtual || 0),
      0
    );

    const saldoAtualKg = estoqueAtualFiltrado.reduce((total, entrada) => {
      const quantidadeAtual = Number(entrada.quantidadeAtual || 0);
      const pesoUnidade = Number(entrada.pesoUnidadeKg || 0);

      return total + quantidadeAtual * pesoUnidade;
    }, 0);

    return {
      totalEntradaUnidades,
      totalEntradaKg,
      totalSaidaUnidades,
      totalSaidaKg,
      totalExtravioUnidades,
      totalExtravioKg,
      totalTransferenciaGeralUnidades,
      totalTransferenciaGeralKg,
      totalTransferenciaRecebidaUnidades,
      totalTransferenciaRecebidaKg,
      totalTransferenciaEnviadaUnidades,
      totalTransferenciaEnviadaKg,
      saldoAtualUnidades,
      saldoAtualKg,
    };
  }, [
    entradasFiltradas,
    saidasFiltradas,
    extraviosFiltrados,
    estoqueAtualFiltrado,
    transferenciasFiltradas,
    transferenciasRecebidas,
    transferenciasEnviadas,
  ]);

  const resumoPorProduto = useMemo(() => {
    const tipos = [
      'FENO',
      'RACAO_ADULTO_PREMIUM',
      'RACAO_ADULTO_MANUTENCAO',
      'RACAO_POTRO_PREMIUM',
      'RACAO_POTRO_MANUTENCAO',
    ];

    return tipos.map((tipo) => {
      const entradasDoProduto = entradas.filter((entrada) => {
        return (
          entrada.tipoProduto === tipo &&
          filtrarPorUnidade(entrada) &&
          filtrarPorPeso(entrada)
        );
      });

      const saidasDoProduto = saidasFiltradas.filter(
        (saida) => saida.tipoProduto === tipo
      );

      const extraviosDoProduto = extraviosFiltrados.filter(
        (extravio) => extravio.tipoProduto === tipo
      );

      const transferenciasDoProduto = transferenciasFiltradas.filter(
        (transferencia) => transferencia.tipoProduto === tipo
      );

      const transferenciasRecebidasDoProduto = transferenciasRecebidas.filter(
        (transferencia) => transferencia.tipoProduto === tipo
      );

      const transferenciasEnviadasDoProduto = transferenciasEnviadas.filter(
        (transferencia) => transferencia.tipoProduto === tipo
      );

      const saldoUnidades = entradasDoProduto.reduce(
        (total, entrada) => total + Number(entrada.quantidadeAtual || 0),
        0
      );

      const saldoKg = entradasDoProduto.reduce((total, entrada) => {
        return (
          total +
          Number(entrada.quantidadeAtual || 0) *
            Number(entrada.pesoUnidadeKg || 0)
        );
      }, 0);

      const saidaKg = saidasDoProduto.reduce(
        (total, saida) => total + Number(saida.pesoLiberadoKg || 0),
        0
      );

      const extravioKg = extraviosDoProduto.reduce(
        (total, extravio) => total + Number(extravio.pesoExtraviadoKg || 0),
        0
      );

      const transferenciaGeralKg = transferenciasDoProduto.reduce(
        (total, transferencia) =>
          total + obterPesoTotalTransferencia(transferencia),
        0
      );

      const transferenciaRecebidaKg = transferenciasRecebidasDoProduto.reduce(
        (total, transferencia) =>
          total + obterPesoTotalTransferencia(transferencia),
        0
      );

      const transferenciaEnviadaKg = transferenciasEnviadasDoProduto.reduce(
        (total, transferencia) =>
          total + obterPesoTotalTransferencia(transferencia),
        0
      );

      return {
        tipo,
        nome: obterNomeProduto(tipo),
        saldoUnidades,
        saldoKg,
        saidaKg,
        extravioKg,
        transferenciaGeralKg,
        transferenciaRecebidaKg,
        transferenciaEnviadaKg,
      };
    });
  }, [
    entradas,
    saidasFiltradas,
    extraviosFiltrados,
    transferenciasFiltradas,
    transferenciasRecebidas,
    transferenciasEnviadas,
    filtrarPorUnidade,
    filtrarPorPeso,
  ]);

  const nomePesoRelatorio =
    pesoSelecionado === 'TODOS'
      ? 'Todos os pesos'
      : `${formatarNumero(pesoSelecionado)} kg`;

  const imprimirRelatorio = () => {
    window.print();
  };

  const gerarPdfRelatorio = async () => {
    if (gerandoPdf) return;

    try {
      setGerandoPdf(true);

      await gerarRelatorioFenoRacaoPdf({
        usuario,
        filtros: {
          dataInicial,
          dataFinal,
          produtoSelecionado,
          produtoNome: produtoAtual?.nome || 'Todos os produtos',
          pesoSelecionado,
          pesoNome: nomePesoRelatorio,
          unidadeSelecionada: unidadeRelatorio,
          unidadeNome: nomeUnidadeRelatorio,
          relatorioGeral,
        },
        resumo,
        resumoPorProduto,
        estoqueAtualFiltrado,
        entradasFiltradas,
        saidasFiltradas,
        extraviosFiltrados,
        transferenciasFiltradas,
        transferenciasRecebidas,
        transferenciasEnviadas,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      window.alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <main className="relatorio-alimentacao-page">
      <section className="relatorio-alimentacao-phone">
        <header className="relatorio-alimentacao-header">
          <button
            type="button"
            className="relatorio-alimentacao-voltar no-print"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Alimentação equina</span>
            <h1>Relatório de Feno e Ração</h1>
            <p>{nomeUnidadeRelatorio}</p>
          </div>
        </header>

        <section className="relatorio-alimentacao-apresentacao no-print">
          <div className="relatorio-alimentacao-apresentacao-icon">
            <FaFileLines />
          </div>

          <div>
            <span>Controle operacional</span>
            <h2>Entradas, saídas, extravios, transferências e saldo atual</h2>
            <p>
              Consulte o movimento de feno e ração por período, produto, peso e
              unidade autorizada.
            </p>
          </div>
        </section>

        <section className="relatorio-alimentacao-card no-print">
          <div className="relatorio-alimentacao-card-titulo">
            <FaCalendarDays />

            <div>
              <h2>Filtros do relatório</h2>
              <p>Selecione período, produto, peso e unidade autorizada.</p>
            </div>
          </div>

          <div className="relatorio-alimentacao-filtros">
            <div className="relatorio-alimentacao-form-group">
              <label htmlFor="dataInicial">Data inicial</label>

              <input
                id="dataInicial"
                type="date"
                value={dataInicial}
                onChange={(event) => setDataInicial(event.target.value)}
              />
            </div>

            <div className="relatorio-alimentacao-form-group">
              <label htmlFor="dataFinal">Data final</label>

              <input
                id="dataFinal"
                type="date"
                value={dataFinal}
                onChange={(event) => setDataFinal(event.target.value)}
              />
            </div>

            <div className="relatorio-alimentacao-form-group">
              <label htmlFor="produto">Produto</label>

              <select
                id="produto"
                value={produtoSelecionado}
                onChange={(event) => {
                  setProdutoSelecionado(event.target.value);
                  setPesoSelecionado('TODOS');
                }}
              >
                {PRODUTOS.map((produto) => (
                  <option key={produto.valor} value={produto.valor}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="relatorio-alimentacao-form-group">
              <label htmlFor="peso">Peso por unidade</label>

              <select
                id="peso"
                value={pesoSelecionado}
                onChange={(event) => setPesoSelecionado(event.target.value)}
              >
                <option value="TODOS">Todos os pesos</option>

                {pesosDisponiveis.map((peso) => (
                  <option key={peso} value={peso}>
                    {formatarNumero(peso)} kg
                  </option>
                ))}
              </select>
            </div>

            <div className="relatorio-alimentacao-form-group">
              <label htmlFor="unidade">Unidade</label>

              {podeSelecionarUnidadeRelatorio ? (
                <select
                  id="unidade"
                  value={unidadeSelecionada}
                  onChange={(event) => {
                    setUnidadeSelecionada(event.target.value);
                    setPesoSelecionado('TODOS');
                  }}
                >
                  <option value="GERAL">Geral</option>

                  {unidadesDisponiveis.map((unidade) => (
                    <option key={unidade} value={unidade}>
                      {unidade}
                    </option>
                  ))}
                </select>
              ) : (
                <input id="unidade" type="text" value={unidadeUsuario} readOnly />
              )}
            </div>
          </div>

          <div className="relatorio-alimentacao-botoes">
            <button
              type="button"
              className="relatorio-alimentacao-imprimir"
              onClick={imprimirRelatorio}
            >
              <FaPrint />
              Imprimir relatório
            </button>

            <button
              type="button"
              className="relatorio-alimentacao-pdf"
              onClick={gerarPdfRelatorio}
              disabled={gerandoPdf || carregandoDados || Boolean(erroCarregamento)}
            >
              <FaFilePdf />
              {gerandoPdf ? 'Gerando PDF...' : 'Gerar PDF'}
            </button>
          </div>
        </section>

        <section className="relatorio-alimentacao-documento">
          {carregandoDados && (
            <div className="relatorio-alimentacao-vazio">
              Carregando dados do banco de dados...
            </div>
          )}

          {!carregandoDados && erroCarregamento && (
            <div className="relatorio-alimentacao-vazio">
              {erroCarregamento}
            </div>
          )}

          <div className="relatorio-alimentacao-documento-topo">
            <div>
              <span>Relatório</span>
              <h2>Feno e Ração</h2>
              <p>
                Período: {formatarData(dataInicial)} até{' '}
                {formatarData(dataFinal)}
              </p>
              <p>Produto: {produtoAtual?.nome || 'Todos os produtos'}</p>
              <p>Peso por unidade: {nomePesoRelatorio}</p>
            </div>

            <strong>{nomeUnidadeRelatorio}</strong>
          </div>

          <section className="relatorio-alimentacao-resumo-grid">
            <article>
              <span>Entradas no período</span>
              <strong>{formatarNumero(resumo.totalEntradaUnidades)}</strong>
              <p>{formatarNumero(resumo.totalEntradaKg)} kg</p>
            </article>

            <article>
              <span>Saídas no período</span>
              <strong>{formatarNumero(resumo.totalSaidaUnidades)}</strong>
              <p>{formatarNumero(resumo.totalSaidaKg)} kg</p>
            </article>

            <article>
              <span>Extravios no período</span>
              <strong>{formatarNumero(resumo.totalExtravioUnidades)}</strong>
              <p>{formatarNumero(resumo.totalExtravioKg)} kg</p>
            </article>

            {relatorioGeral ? (
              <article>
                <span>Transferências aprovadas</span>
                <strong>
                  {formatarNumero(resumo.totalTransferenciaGeralUnidades)}
                </strong>
                <p>{formatarNumero(resumo.totalTransferenciaGeralKg)} kg</p>
              </article>
            ) : (
              <>
                <article>
                  <span>Transferências recebidas</span>
                  <strong>
                    {formatarNumero(
                      resumo.totalTransferenciaRecebidaUnidades
                    )}
                  </strong>
                  <p>
                    {formatarNumero(resumo.totalTransferenciaRecebidaKg)} kg
                  </p>
                </article>

                <article>
                  <span>Transferências enviadas</span>
                  <strong>
                    {formatarNumero(resumo.totalTransferenciaEnviadaUnidades)}
                  </strong>
                  <p>
                    {formatarNumero(resumo.totalTransferenciaEnviadaKg)} kg
                  </p>
                </article>
              </>
            )}

            <article>
              <span>Saldo atual</span>
              <strong>{formatarNumero(resumo.saldoAtualUnidades)}</strong>
              <p>{formatarNumero(resumo.saldoAtualKg)} kg</p>
            </article>
          </section>

          <section className="relatorio-alimentacao-card-interno">
            <div className="relatorio-alimentacao-section-title">
              <FaChartColumn />
              <h3>Resumo por produto</h3>
            </div>

            <div className="relatorio-alimentacao-produtos-grid">
              {resumoPorProduto.map((produto) => (
                <article key={produto.tipo}>
                  <div className="relatorio-alimentacao-produto-icon">
                    {obterIconeProduto(produto.tipo)}
                  </div>

                  <div>
                    <span>{produto.nome}</span>
                    <strong>
                      {formatarNumero(produto.saldoUnidades)} un.
                    </strong>
                    <p>
                      Saldo: {formatarNumero(produto.saldoKg)} kg · Saída no
                      período: {formatarNumero(produto.saidaKg)} kg · Extravio:{' '}
                      {formatarNumero(produto.extravioKg)} kg
                      {relatorioGeral
                        ? ` · Transferido: ${formatarNumero(
                            produto.transferenciaGeralKg
                          )} kg`
                        : ` · Recebido: ${formatarNumero(
                            produto.transferenciaRecebidaKg
                          )} kg · Enviado: ${formatarNumero(
                            produto.transferenciaEnviadaKg
                          )} kg`}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="relatorio-alimentacao-card-interno">
            <div className="relatorio-alimentacao-section-title">
              <FaBoxesStacked />
              <h3>Estoque atual</h3>
            </div>

            {estoqueAtualFiltrado.length === 0 ? (
              <div className="relatorio-alimentacao-vazio">
                Nenhum estoque encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="relatorio-alimentacao-tabela-wrapper">
                <table className="relatorio-alimentacao-tabela">
                  <thead>
                    <tr>
                      {relatorioGeral && <th>Unidade</th>}
                      <th>Produto</th>
                      <th>Lote</th>
                      <th>Entrada</th>
                      <th>Peso un.</th>
                      <th>Saldo un.</th>
                      <th>Saldo kg</th>
                    </tr>
                  </thead>

                  <tbody>
                    {estoqueAtualFiltrado.map((entrada) => (
                      <tr key={entrada.id}>
                        {relatorioGeral && (
                          <td>{obterUnidadeRegistro(entrada) || '-'}</td>
                        )}
                        <td>{obterNomeProduto(entrada.tipoProduto)}</td>
                        <td>{entrada.codigoLote || entrada.lote || '-'}</td>
                        <td>{formatarData(entrada.dataEntrada)}</td>
                        <td>{formatarNumero(entrada.pesoUnidadeKg)} kg</td>
                        <td>{formatarNumero(entrada.quantidadeAtual)}</td>
                        <td>
                          {formatarNumero(
                            Number(entrada.quantidadeAtual || 0) *
                              Number(entrada.pesoUnidadeKg || 0)
                          )}{' '}
                          kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="relatorio-alimentacao-card-interno">
            <div className="relatorio-alimentacao-section-title">
              <FaWheatAwn />
              <h3>Entradas no período</h3>
            </div>

            {entradasFiltradas.length === 0 ? (
              <div className="relatorio-alimentacao-vazio">
                Nenhuma entrada encontrada no período para os filtros
                selecionados.
              </div>
            ) : (
              <div className="relatorio-alimentacao-tabela-wrapper">
                <table className="relatorio-alimentacao-tabela">
                  <thead>
                    <tr>
                      {relatorioGeral && <th>Unidade</th>}
                      <th>Data</th>
                      <th>Produto</th>
                      <th>Lote</th>
                      <th>Fornecedor</th>
                      <th>Quantidade</th>
                      <th>Peso un.</th>
                      <th>Peso total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {entradasFiltradas.map((entrada) => {
                      const quantidade = Number(
                        entrada.quantidadeInicial || entrada.quantidade || 0
                      );

                      return (
                        <tr key={entrada.id}>
                          {relatorioGeral && (
                            <td>{obterUnidadeRegistro(entrada) || '-'}</td>
                          )}
                          <td>{formatarData(entrada.dataEntrada)}</td>
                          <td>{obterNomeProduto(entrada.tipoProduto)}</td>
                          <td>{entrada.codigoLote || entrada.lote || '-'}</td>
                          <td>{entrada.fornecedor || '-'}</td>
                          <td>{formatarNumero(quantidade)}</td>
                          <td>{formatarNumero(entrada.pesoUnidadeKg)} kg</td>
                          <td>
                            {formatarNumero(
                              quantidade *
                                Number(entrada.pesoUnidadeKg || 0)
                            )}{' '}
                            kg
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="relatorio-alimentacao-card-interno">
            <div className="relatorio-alimentacao-section-title">
              <GiGrain />
              <h3>Saídas no período</h3>
            </div>

            {saidasFiltradas.length === 0 ? (
              <div className="relatorio-alimentacao-vazio">
                Nenhuma saída encontrada no período para os filtros
                selecionados.
              </div>
            ) : (
              <div className="relatorio-alimentacao-tabela-wrapper">
                <table className="relatorio-alimentacao-tabela">
                  <thead>
                    <tr>
                      {relatorioGeral && <th>Unidade</th>}
                      <th>Data</th>
                      <th>Produto</th>
                      <th>Serviço</th>
                      <th>Lote</th>
                      <th>Retirada</th>
                      <th>Peso liberado</th>
                      <th>Responsável</th>
                    </tr>
                  </thead>

                  <tbody>
                    {saidasFiltradas.map((saida) => (
                      <tr key={saida.id}>
                        {relatorioGeral && (
                          <td>{obterUnidadeRegistro(saida) || '-'}</td>
                        )}
                        <td>{formatarData(saida.dataSaida)}</td>
                        <td>
                          {saida.nomeProduto ||
                            obterNomeProduto(saida.tipoProduto)}
                        </td>
                        <td>{saida.servico || '-'}</td>
                        <td>{saida.codigoLote || saida.lote || '-'}</td>
                        <td>{formatarNumero(saida.quantidadeRetirada)}</td>
                        <td>{formatarNumero(saida.pesoLiberadoKg)} kg</td>
                        <td>{saida.responsavel || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="relatorio-alimentacao-card-interno">
            <div className="relatorio-alimentacao-section-title">
              <FaBoxesStacked />
              <h3>Transferências no período</h3>
            </div>

            {transferenciasFiltradas.length === 0 ? (
              <div className="relatorio-alimentacao-vazio">
                Nenhuma transferência aprovada encontrada no período para os
                filtros selecionados.
              </div>
            ) : (
              <div className="relatorio-alimentacao-tabela-wrapper">
                <table className="relatorio-alimentacao-tabela">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Produto</th>
                      <th>Origem</th>
                      <th>Destino</th>
                      <th>Lote</th>
                      <th>Quantidade</th>
                      <th>Peso un.</th>
                      <th>Peso total</th>
                      <th>Situação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transferenciasFiltradas.map((transferencia, index) => (
                      <tr key={transferencia.id || index}>
                        <td>
                          {formatarData(obterDataTransferencia(transferencia))}
                        </td>
                        <td>
                          {transferencia.nomeProduto ||
                            obterNomeProduto(transferencia.tipoProduto)}
                        </td>
                        <td>
                          {obterUnidadeOrigemTransferencia(transferencia) ||
                            '-'}
                        </td>
                        <td>
                          {obterUnidadeDestinoTransferencia(transferencia) ||
                            '-'}
                        </td>
                        <td>{obterLoteTransferencia(transferencia)}</td>
                        <td>
                          {formatarNumero(
                            obterQuantidadeTransferencia(transferencia)
                          )}
                        </td>
                        <td>
                          {formatarNumero(
                            obterPesoUnidadeTransferencia(transferencia)
                          )}{' '}
                          kg
                        </td>
                        <td>
                          {formatarNumero(
                            obterPesoTotalTransferencia(transferencia)
                          )}{' '}
                          kg
                        </td>
                        <td>
                          {transferencia.status ||
                            transferencia.situacao ||
                            '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="relatorio-alimentacao-card-interno">
            <div className="relatorio-alimentacao-section-title relatorio-alimentacao-section-title-extravio">
              <FaTriangleExclamation />
              <h3>Extravios no período</h3>
            </div>

            {extraviosFiltrados.length === 0 ? (
              <div className="relatorio-alimentacao-vazio">
                Nenhum extravio encontrado no período para os filtros
                selecionados.
              </div>
            ) : (
              <div className="relatorio-alimentacao-tabela-wrapper">
                <table className="relatorio-alimentacao-tabela">
                  <thead>
                    <tr>
                      {relatorioGeral && <th>Unidade</th>}
                      <th>Data</th>
                      <th>Produto</th>
                      <th>Lote</th>
                      <th>Quantidade</th>
                      <th>Peso</th>
                      <th>Responsável</th>
                      <th>Justificativa</th>
                    </tr>
                  </thead>

                  <tbody>
                    {extraviosFiltrados.map((extravio) => (
                      <tr key={extravio.id}>
                        {relatorioGeral && (
                          <td>{obterUnidadeRegistro(extravio) || '-'}</td>
                        )}
                        <td>{formatarData(extravio.dataExtravio)}</td>
                        <td>
                          {extravio.nomeProduto ||
                            obterNomeProduto(extravio.tipoProduto)}
                        </td>
                        <td>{extravio.codigoLote || extravio.lote || '-'}</td>
                        <td>{formatarNumero(extravio.quantidadeExtraviada)}</td>
                        <td>{formatarNumero(extravio.pesoExtraviadoKg)} kg</td>
                        <td>{extravio.responsavel || '-'}</td>
                        <td>{extravio.motivo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

export default RelatorioFenoRacao;