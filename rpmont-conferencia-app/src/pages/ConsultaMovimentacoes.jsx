import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FaArrowLeft,
  FaArrowRight,
  FaBarcode,
  FaBoxesStacked,
  FaCalendarDays,
  FaFileLines,
  FaFilePdf,
  FaFilter,
  FaMagnifyingGlass,
  FaRotateLeft,
  FaUpRightAndDownLeftFromCenter,
  FaUser,
  FaXmark,
} from 'react-icons/fa6';

import { jsPDF } from 'jspdf';

import {
  listarMovimentacoesMaterial,
} from '../services/materialPatrimonialService';

import {
  listarSetoresAtivos,
} from '../services/setorService';

import {
  listarUnidadesAtivas,
} from '../services/unidadeService';

import '../styles/ConsultaMateriais.css';
import '../styles/ConsultaMovimentacoes.css';

function ConsultaMovimentacoes({
  usuario,
  onVoltar,
}) {
  const [dataInicial, setDataInicial] =
    useState('');

  const [dataFinal, setDataFinal] =
    useState('');

  const [
    tipoMovimentacao,
    setTipoMovimentacao,
  ] = useState('');

  const [numeroSerie, setNumeroSerie] =
    useState('');

  const [nome, setNome] =
    useState('');

  const [descricao, setDescricao] =
    useState('');

  const [setor, setSetor] =
    useState('');

  const [
    unidadeSelecionada,
    setUnidadeSelecionada,
  ] = useState('');

  const [unidades, setUnidades] =
    useState([]);

  const [setores, setSetores] =
    useState([]);

  const [
    carregandoLocalizacoes,
    setCarregandoLocalizacoes,
  ] = useState(true);

  const [
    erroLocalizacoes,
    setErroLocalizacoes,
  ] = useState('');

  const [
    numeroDocumento,
    setNumeroDocumento,
  ] = useState('');

  const [
    situacaoAnterior,
    setSituacaoAnterior,
  ] = useState('');

  const [
    situacaoNova,
    setSituacaoNova,
  ] = useState('');

  const [
    movimentacoes,
    setMovimentacoes,
  ] = useState([]);

  const [
    filtrosAplicados,
    setFiltrosAplicados,
  ] = useState({});

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [erroPdf, setErroPdf] =
    useState('');

  const [
    modalAmpliado,
    setModalAmpliado,
  ] = useState(false);

  const unidadeUsuario =
    usuario?.unidade ??
    usuario?.UNIDADE ??
    '';

  const nivelUsuario = Number(
    usuario?.nivel ??
      usuario?.NIVEL ??
      3
  );

  const usuarioEhAdminMaster =
    nivelUsuario === 1;

  const normalizarTexto = (valor) => {
    return String(valor ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/º/g, '')
      .replace(/\s+/g, '')
      .replace(/[^A-Z0-9]/g, '');
  };

  const normalizarLista = (resposta) => {
    if (Array.isArray(resposta)) {
      return resposta;
    }

    if (Array.isArray(resposta?.data)) {
      return resposta.data;
    }

    return [];
  };

  const obterValorUnidade = (unidade) => {
    return String(
      unidade?.sigla ??
        unidade?.nome ??
        ''
    ).trim();
  };

  const obterRotuloUnidade = (unidade) => {
    return String(
      unidade?.sigla ??
        unidade?.nome ??
        'Unidade'
    ).trim();
  };

  const unidadeFiltro = usuarioEhAdminMaster
    ? unidadeSelecionada
    : unidadeUsuario;

  const setoresDisponiveis = useMemo(() => {
    const unidadeBase = normalizarTexto(
      unidadeFiltro
    );

    return setores
      .filter((item) => {
        if (!unidadeBase) {
          return usuarioEhAdminMaster;
        }

        const unidadeNome = normalizarTexto(
          item?.unidadeNome ??
            item?.unidade?.nome ??
            ''
        );

        const unidadeSigla = normalizarTexto(
          item?.unidadeSigla ??
            item?.unidade?.sigla ??
            ''
        );

        return (
          unidadeNome === unidadeBase ||
          unidadeSigla === unidadeBase
        );
      })
      .sort((a, b) =>
        String(a?.nome || '').localeCompare(
          String(b?.nome || ''),
          'pt-BR'
        )
      );
  }, [
    setores,
    unidadeFiltro,
    usuarioEhAdminMaster,
  ]);

  const montarFiltros = () => {
    return {
      dataInicial,
      dataFinal,
      tipoMovimentacao,
      numeroSerie,
      nome,
      descricao,
      setor,
      unidade: unidadeFiltro,
      numeroDocumento,
      situacaoAnterior,
      situacaoNova,
    };
  };

  const consultarMovimentacoes = async (
    filtrosPersonalizados
  ) => {
    const filtrosDaConsulta =
      filtrosPersonalizados ??
      montarFiltros();

    try {
      setCarregando(true);
      setErro('');
      setErroPdf('');

      const resposta =
        await listarMovimentacoesMaterial(
          filtrosDaConsulta
        );

      const lista = Array.isArray(resposta)
        ? resposta
        : Array.isArray(resposta?.data)
          ? resposta.data
          : [];

      setMovimentacoes(lista);
      setFiltrosAplicados(
        filtrosDaConsulta
      );
    } catch (error) {
      console.error(
        'Erro ao consultar movimentações:',
        error
      );

      setMovimentacoes([]);

      setErro(
        error?.response?.data?.message ||
          error?.message ||
          'Não foi possível consultar as movimentações patrimoniais.'
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    let componenteAtivo = true;

    const carregarLocalizacoes = async () => {
      try {
        setCarregandoLocalizacoes(true);
        setErroLocalizacoes('');

        const [
          respostaUnidades,
          respostaSetores,
        ] = await Promise.all([
          listarUnidadesAtivas(),
          listarSetoresAtivos(),
        ]);

        if (!componenteAtivo) {
          return;
        }

        const unidadesRecebidas =
          normalizarLista(
            respostaUnidades
          );

        const setoresRecebidos =
          normalizarLista(
            respostaSetores
          );

        setUnidades(
          unidadesRecebidas.sort(
            (a, b) =>
              obterRotuloUnidade(
                a
              ).localeCompare(
                obterRotuloUnidade(b),
                'pt-BR'
              )
          )
        );

        setSetores(setoresRecebidos);

        if (!usuarioEhAdminMaster) {
          setUnidadeSelecionada(
            unidadeUsuario
          );
        }
      } catch (error) {
        console.error(
          'Erro ao carregar unidades e setores:',
          error
        );

        if (componenteAtivo) {
          setErroLocalizacoes(
            error?.message ||
              'Não foi possível carregar as unidades e os setores.'
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoLocalizacoes(
            false
          );
        }
      }
    };

    carregarLocalizacoes();

    return () => {
      componenteAtivo = false;
    };
  }, [
    usuarioEhAdminMaster,
    unidadeUsuario,
  ]);

  useEffect(() => {
    consultarMovimentacoes(
      usuarioEhAdminMaster
        ? {}
        : {
            unidade: unidadeUsuario,
          }
    );
  }, [
    usuarioEhAdminMaster,
    unidadeUsuario,
  ]);

  useEffect(() => {
    if (!modalAmpliado) {
      return undefined;
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    const fecharComEscape = (event) => {
      if (event.key === 'Escape') {
        setModalAmpliado(false);
      }
    };

    window.addEventListener(
      'keydown',
      fecharComEscape
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        'keydown',
        fecharComEscape
      );
    };
  }, [modalAmpliado]);

  const limparFiltros = () => {
    setDataInicial('');
    setDataFinal('');
    setTipoMovimentacao('');
    setNumeroSerie('');
    setNome('');
    setDescricao('');
    setSetor('');

    if (usuarioEhAdminMaster) {
      setUnidadeSelecionada('');
    }

    setNumeroDocumento('');
    setSituacaoAnterior('');
    setSituacaoNova('');
    setErro('');
    setErroPdf('');

    consultarMovimentacoes(
      usuarioEhAdminMaster
        ? {}
        : {
            unidade: unidadeUsuario,
          }
    );
  };

  const enviarFiltros = (event) => {
    event.preventDefault();

    consultarMovimentacoes();
  };

  const resumo = useMemo(() => {
    const totais = {
      total: movimentacoes.length,
      transferencias: 0,
      baixas: 0,
      descartes: 0,
      extravios: 0,
      furtos: 0,
      reativacoes: 0,
    };

    movimentacoes.forEach(
      (movimentacao) => {
        switch (
          movimentacao?.tipoMovimentacao
        ) {
          case 'TRANSFERENCIA_SETOR':
          case 'TRANSFERENCIA_UNIDADE':
            totais.transferencias += 1;
            break;

          case 'BAIXA':
            totais.baixas += 1;
            break;

          case 'DESCARTE':
            totais.descartes += 1;
            break;

          case 'EXTRAVIO':
            totais.extravios += 1;
            break;

          case 'FURTO':
            totais.furtos += 1;
            break;

          case 'REATIVACAO':
            totais.reativacoes += 1;
            break;

          default:
            break;
        }
      }
    );

    return totais;
  }, [movimentacoes]);

  const formatarData = (valor) => {
    if (!valor) {
      return 'Data não informada';
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return valor;
    }

    return new Intl.DateTimeFormat(
      'pt-BR',
      {
        dateStyle: 'short',
        timeStyle: 'short',
      }
    ).format(data);
  };

  const formatarDataFiltro = (valor) => {
    if (!valor) {
      return '';
    }

    const [ano, mes, dia] =
      String(valor).split('-');

    if (!ano || !mes || !dia) {
      return valor;
    }

    return `${dia}/${mes}/${ano}`;
  };

  const formatarTextoEnum = (valor) => {
    if (!valor) {
      return 'Não informado';
    }

    return String(valor)
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(
        /(^|\s)\S/g,
        (letra) =>
          letra.toUpperCase()
      );
  };

  const obterNomeMaterial = (
    movimentacao
  ) => {
    return (
      movimentacao?.nomeMaterial ||
      movimentacao?.descricaoMaterial ||
      'Material patrimonial'
    );
  };

  const obterClasseTipo = (
    tipo
  ) => {
    switch (tipo) {
      case 'BAIXA':
        return 'historico-baixa';

      case 'DESCARTE':
        return 'historico-descarte';

      case 'EXTRAVIO':
        return 'historico-extravio';

      case 'FURTO':
        return 'historico-furto';

      case 'REATIVACAO':
        return 'historico-reativacao';

      case 'TRANSFERENCIA_SETOR':
      case 'TRANSFERENCIA_UNIDADE':
        return 'historico-transferencia-setor';

      default:
        return '';
    }
  };

  const obterSetorMovimentacao = (
    movimentacao
  ) => {
    const origem =
      movimentacao?.setorOrigem ||
      'Não informado';

    const destino =
      movimentacao?.setorDestino;

    if (
      destino &&
      destino !== movimentacao?.setorOrigem
    ) {
      return `${origem} → ${destino}`;
    }

    return origem;
  };

  const filtrosAtivos = useMemo(() => {
    const filtros = [];

    if (filtrosAplicados.dataInicial) {
      filtros.push(
        `Data inicial: ${formatarDataFiltro(
          filtrosAplicados.dataInicial
        )}`
      );
    }

    if (filtrosAplicados.dataFinal) {
      filtros.push(
        `Data final: ${formatarDataFiltro(
          filtrosAplicados.dataFinal
        )}`
      );
    }

    if (
      filtrosAplicados.tipoMovimentacao
    ) {
      filtros.push(
        `Tipo: ${formatarTextoEnum(
          filtrosAplicados.tipoMovimentacao
        )}`
      );
    }

    if (filtrosAplicados.numeroSerie) {
      filtros.push(
        `Série: ${filtrosAplicados.numeroSerie}`
      );
    }

    if (filtrosAplicados.nome) {
      filtros.push(
        `Material: ${filtrosAplicados.nome}`
      );
    }

    if (filtrosAplicados.descricao) {
      filtros.push(
        `Descrição: ${filtrosAplicados.descricao}`
      );
    }

    if (filtrosAplicados.unidade) {
      filtros.push(
        `Unidade: ${filtrosAplicados.unidade}`
      );
    } else if (usuarioEhAdminMaster) {
      filtros.push(
        'Unidade: Todas as unidades'
      );
    }

    if (filtrosAplicados.setor) {
      filtros.push(
        `Setor: ${filtrosAplicados.setor}`
      );
    }

    if (
      filtrosAplicados.numeroDocumento
    ) {
      filtros.push(
        `Documento: ${filtrosAplicados.numeroDocumento}`
      );
    }

    if (
      filtrosAplicados.situacaoAnterior
    ) {
      filtros.push(
        `Situação anterior: ${formatarTextoEnum(
          filtrosAplicados.situacaoAnterior
        )}`
      );
    }

    if (filtrosAplicados.situacaoNova) {
      filtros.push(
        `Situação nova: ${formatarTextoEnum(
          filtrosAplicados.situacaoNova
        )}`
      );
    }

    return filtros;
  }, [
    filtrosAplicados,
    usuarioEhAdminMaster,
  ]);

  const gerarPdfMovimentacoes = () => {
    if (movimentacoes.length === 0) {
      setErroPdf(
        'Não existem movimentações filtradas para gerar o PDF.'
      );

      return;
    }

    try {
      setErroPdf('');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const margem = 14;
      const larguraPagina =
        pdf.internal.pageSize.getWidth();

      const alturaPagina =
        pdf.internal.pageSize.getHeight();

      const larguraUtil =
        larguraPagina - margem * 2;

      let y = margem;

      const verificarNovaPagina = (
        alturaNecessaria = 12
      ) => {
        if (
          y + alturaNecessaria >
          alturaPagina - margem
        ) {
          pdf.addPage();
          y = margem;
        }
      };

      const adicionarTexto = (
        texto,
        tamanho = 10,
        negrito = false,
        espacamento = 5
      ) => {
        pdf.setFont(
          'helvetica',
          negrito ? 'bold' : 'normal'
        );

        pdf.setFontSize(tamanho);

        const linhas = pdf.splitTextToSize(
          String(texto ?? ''),
          larguraUtil
        );

        verificarNovaPagina(
          linhas.length * espacamento + 2
        );

        pdf.text(linhas, margem, y);

        y +=
          linhas.length * espacamento;
      };

      pdf.setFont(
        'helvetica',
        'bold'
      );

      pdf.setFontSize(16);

      pdf.text(
        'Relatório de Movimentações Patrimoniais',
        margem,
        y
      );

      y += 8;

      adicionarTexto(
        `Unidade: ${
          filtrosAplicados.unidade ||
          (usuarioEhAdminMaster
            ? 'Todas as unidades'
            : unidadeUsuario ||
              'Não informada')
        }`,
        10,
        true
      );

      adicionarTexto(
        `Total de registros: ${movimentacoes.length}`,
        10,
        true
      );

      adicionarTexto(
        `Gerado em: ${new Intl.DateTimeFormat(
          'pt-BR',
          {
            dateStyle: 'short',
            timeStyle: 'short',
          }
        ).format(new Date())}`,
        9
      );

      if (filtrosAtivos.length > 0) {
        y += 2;

        adicionarTexto(
          'Filtros aplicados:',
          10,
          true
        );

        filtrosAtivos.forEach(
          (filtro) => {
            adicionarTexto(
              `• ${filtro}`,
              9,
              false,
              4.5
            );
          }
        );
      } else {
        adicionarTexto(
          'Filtros aplicados: nenhum filtro adicional.',
          9
        );
      }

      y += 3;

      movimentacoes.forEach(
        (movimentacao, indice) => {
          verificarNovaPagina(58);

          pdf.setDrawColor(190);
          pdf.line(
            margem,
            y,
            larguraPagina - margem,
            y
          );

          y += 5;

          adicionarTexto(
            `${indice + 1}. ${formatarTextoEnum(
              movimentacao.tipoMovimentacao
            )}`,
            11,
            true
          );

          adicionarTexto(
            `Data: ${formatarData(
              movimentacao.dataMovimentacao
            )}`,
            9
          );

          adicionarTexto(
            `Material: ${obterNomeMaterial(
              movimentacao
            )}`,
            9,
            true
          );

          adicionarTexto(
            `Número de série: ${
              movimentacao.numeroSerie ||
              'Não informado'
            }`,
            9
          );

          if (
            movimentacao.marcaMaterial
          ) {
            adicionarTexto(
              `Marca: ${movimentacao.marcaMaterial}`,
              9
            );
          }

          adicionarTexto(
            `Descrição: ${
              movimentacao.descricaoMaterial ||
              'Não informada'
            }`,
            9
          );

          adicionarTexto(
            `Situação: ${formatarTextoEnum(
              movimentacao.situacaoAnterior
            )} → ${formatarTextoEnum(
              movimentacao.situacaoNova
            )}`,
            9
          );

          adicionarTexto(
            `Setor: ${obterSetorMovimentacao(
              movimentacao
            )}`,
            9
          );

          adicionarTexto(
            `Responsável: ${
              movimentacao.nomeUsuario ||
              'Não informado'
            }`,
            9
          );

          adicionarTexto(
            `Matrícula: ${
              movimentacao.matriculaUsuario ||
              'Não informada'
            }`,
            9
          );

          adicionarTexto(
            `Documento: ${
              movimentacao.numeroDocumento ||
              'Não informado'
            }`,
            9
          );

          adicionarTexto(
            `Motivo: ${
              movimentacao.motivo ||
              'Não informado'
            }`,
            9
          );

          if (movimentacao.observacao) {
            adicionarTexto(
              `Observação: ${movimentacao.observacao}`,
              9
            );
          }

          y += 3;
        }
      );

      const totalPaginas =
        pdf.getNumberOfPages();

      for (
        let pagina = 1;
        pagina <= totalPaginas;
        pagina += 1
      ) {
        pdf.setPage(pagina);

        pdf.setFont(
          'helvetica',
          'normal'
        );

        pdf.setFontSize(8);

        pdf.text(
          `Página ${pagina} de ${totalPaginas}`,
          larguraPagina - margem,
          alturaPagina - 7,
          {
            align: 'right',
          }
        );
      }

      const dataArquivo =
        new Date()
          .toISOString()
          .slice(0, 10);

      pdf.save(
        `movimentacoes-patrimoniais-${dataArquivo}.pdf`
      );
    } catch (error) {
      console.error(
        'Erro ao gerar PDF de movimentações:',
        error
      );

      setErroPdf(
        'Não foi possível gerar o PDF das movimentações.'
      );
    }
  };

  const renderizarMovimentacao = (
    movimentacao,
    modoModal = false
  ) => {
    return (
      <article
        key={`${modoModal ? 'modal' : 'lista'}-${movimentacao.id}`}
        className={`historico-material-item ${obterClasseTipo(
          movimentacao.tipoMovimentacao
        )}`}
      >
        <div className="historico-material-item-topo">
          <div>
            <span className="historico-material-tipo">
              {formatarTextoEnum(
                movimentacao.tipoMovimentacao
              )}
            </span>

            <strong>
              {formatarData(
                movimentacao.dataMovimentacao
              )}
            </strong>
          </div>

          <strong>
            ID #{movimentacao.id}
          </strong>
        </div>

        <div className="movimentacao-material-resumo">
          <span>Material</span>

          <strong>
            {obterNomeMaterial(
              movimentacao
            )}
          </strong>

          <p>
            Série:{' '}
            {movimentacao.numeroSerie ||
              'Não informada'}
          </p>

          {movimentacao.marcaMaterial && (
            <p>
              Marca:{' '}
              {movimentacao.marcaMaterial}
            </p>
          )}

          <p>
            {movimentacao.descricaoMaterial ||
              'Sem descrição'}
          </p>
        </div>

        <div className="historico-material-transicao">
          <span>
            {formatarTextoEnum(
              movimentacao.situacaoAnterior
            )}
          </span>

          <FaArrowRight />

          <span>
            {formatarTextoEnum(
              movimentacao.situacaoNova
            )}
          </span>
        </div>

        <div className="historico-material-dados">
          <div>
            <FaBoxesStacked />

            <p>
              <span>Setor</span>

              <strong>
                {obterSetorMovimentacao(
                  movimentacao
                )}
              </strong>
            </p>
          </div>

          <div>
            <FaUser />

            <p>
              <span>Responsável</span>

              <strong>
                {movimentacao.nomeUsuario ||
                  'Não informado'}
              </strong>
            </p>
          </div>

          <div>
            <FaFileLines />

            <p>
              <span>Documento</span>

              <strong>
                {movimentacao.numeroDocumento ||
                  'Sem documento'}
              </strong>
            </p>
          </div>

          <div>
            <FaBarcode />

            <p>
              <span>Matrícula</span>

              <strong>
                {movimentacao.matriculaUsuario ||
                  'Não informada'}
              </strong>
            </p>
          </div>
        </div>

        <div className="historico-material-observacao">
          <span>Motivo</span>

          <p>
            {movimentacao.motivo ||
              'Não informado'}
          </p>
        </div>

        {movimentacao.observacao && (
          <div className="historico-material-observacao">
            <span>Observação</span>

            <p>
              {movimentacao.observacao}
            </p>
          </div>
        )}
      </article>
    );
  };

  return (
    <main className="consulta-page">
      <section className="consulta-phone">
        <header className="consulta-header">
          <button
            type="button"
            className="consulta-voltar"
            onClick={onVoltar}
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>
              Movimentações patrimoniais
            </span>

            <h1>
              Consulta de movimentações
            </h1>

            <p>
              {usuarioEhAdminMaster
                ? 'Abrangência: '
                : 'Unidade: '}

              {usuarioEhAdminMaster
                ? unidadeSelecionada ||
                  'Todas as unidades'
                : unidadeUsuario ||
                  'Não informada'}
            </p>
          </div>
        </header>

        <section className="consulta-resumo-grid">
          <div>
            <span>Total</span>
            <strong>{resumo.total}</strong>
          </div>

          <div>
            <span>Baixas</span>
            <strong>{resumo.baixas}</strong>
          </div>

          <div>
            <span>Descartes</span>
            <strong>{resumo.descartes}</strong>
          </div>

          <div>
            <span>Extravios</span>
            <strong>{resumo.extravios}</strong>
          </div>

          <div>
            <span>Furtos</span>
            <strong>{resumo.furtos}</strong>
          </div>
        </section>

        <section className="consulta-filtros-card">
          <div className="consulta-card-titulo">
            <FaFilter />

            <div>
              <h2>
                Filtrar movimentações
              </h2>

              <p>
                Consulte por período,
                tipo, material, setor,
                documento ou situação.
              </p>
            </div>
          </div>

          <form onSubmit={enviarFiltros}>
            <div className="consulta-select-grid">
              <label className="consulta-label">
                Data inicial

                <div className="consulta-input-icon">
                  <FaCalendarDays />

                  <input
                    type="date"
                    value={dataInicial}
                    onChange={(event) =>
                      setDataInicial(
                        event.target.value
                      )
                    }
                  />
                </div>
              </label>

              <label className="consulta-label">
                Data final

                <div className="consulta-input-icon">
                  <FaCalendarDays />

                  <input
                    type="date"
                    value={dataFinal}
                    onChange={(event) =>
                      setDataFinal(
                        event.target.value
                      )
                    }
                  />
                </div>
              </label>
            </div>

            <div className="consulta-select-grid">
              <label className="consulta-label">
                Unidade

                <select
                  value={
                    usuarioEhAdminMaster
                      ? unidadeSelecionada
                      : unidadeUsuario
                  }
                  onChange={(event) => {
                    setUnidadeSelecionada(
                      event.target.value
                    );

                    setSetor('');
                  }}
                  disabled={
                    !usuarioEhAdminMaster ||
                    carregandoLocalizacoes
                  }
                >
                  {usuarioEhAdminMaster && (
                    <option value="">
                      Todas as unidades
                    </option>
                  )}

                  {!usuarioEhAdminMaster && (
                    <option
                      value={unidadeUsuario}
                    >
                      {unidadeUsuario ||
                        'Unidade não informada'}
                    </option>
                  )}

                  {usuarioEhAdminMaster &&
                    unidades.map(
                      (unidade) => {
                        const valor =
                          obterValorUnidade(
                            unidade
                          );

                        return (
                          <option
                            key={
                              unidade.id ??
                              valor
                            }
                            value={valor}
                          >
                            {obterRotuloUnidade(
                              unidade
                            )}
                          </option>
                        );
                      }
                    )}
                </select>
              </label>

              <label className="consulta-label">
                Setor

                <select
                  value={setor}
                  onChange={(event) =>
                    setSetor(
                      event.target.value
                    )
                  }
                  disabled={
                    carregandoLocalizacoes ||
                    (usuarioEhAdminMaster &&
                      !unidadeSelecionada)
                  }
                >
                  <option value="">
                    {usuarioEhAdminMaster &&
                    !unidadeSelecionada
                      ? 'Selecione uma unidade'
                      : 'Todos os setores'}
                  </option>

                  {setoresDisponiveis.map(
                    (item) => (
                      <option
                        key={
                          item.id ??
                          item.nome
                        }
                        value={
                          item.nome ?? ''
                        }
                      >
                        {item.nome}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            {erroLocalizacoes && (
              <div
                className="movimentacao-material-erro"
                role="alert"
              >
                {erroLocalizacoes}
              </div>
            )}

            <label className="consulta-label">
              Tipo de movimentação

              <select
                value={tipoMovimentacao}
                onChange={(event) =>
                  setTipoMovimentacao(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Todos
                </option>

                <option value="TRANSFERENCIA_SETOR">
                  Transferência de setor
                </option>

                <option value="TRANSFERENCIA_UNIDADE">
                  Transferência de unidade
                </option>

                <option value="BAIXA">
                  Baixa
                </option>

                <option value="DESCARTE">
                  Descarte
                </option>

                <option value="EXTRAVIO">
                  Extravio
                </option>

                <option value="FURTO">
                  Furto
                </option>

                <option value="REATIVACAO">
                  Reativação
                </option>

                <option value="ENVIO_MANUTENCAO">
                  Envio para manutenção
                </option>

                <option value="RETORNO_MANUTENCAO">
                  Retorno da manutenção
                </option>
              </select>
            </label>

            <label className="consulta-label">
              Número de série

              <div className="consulta-input-icon">
                <FaBarcode />

                <input
                  type="text"
                  value={numeroSerie}
                  placeholder="Ex.: 00494550"
                  onChange={(event) =>
                    setNumeroSerie(
                      event.target.value
                    )
                  }
                />
              </div>
            </label>

            <label className="consulta-label">
              Nome do material

              <div className="consulta-input-icon">
                <FaMagnifyingGlass />

                <input
                  type="text"
                  value={nome}
                  placeholder="Ex.: computador, celular"
                  onChange={(event) =>
                    setNome(
                      event.target.value
                    )
                  }
                />
              </div>
            </label>

            <label className="consulta-label">
              Descrição

              <div className="consulta-input-icon">
                <FaBoxesStacked />

                <input
                  type="text"
                  value={descricao}
                  placeholder="Descrição do material"
                  onChange={(event) =>
                    setDescricao(
                      event.target.value
                    )
                  }
                />
              </div>
            </label>

            <label className="consulta-label">
              Número do documento

              <div className="consulta-input-icon">
                <FaFileLines />

                <input
                  type="text"
                  value={numeroDocumento}
                  placeholder="Ex.: BO-001/2026"
                  onChange={(event) =>
                    setNumeroDocumento(
                      event.target.value
                    )
                  }
                />
              </div>
            </label>

            <div className="consulta-select-grid">
              <label className="consulta-label">
                Situação anterior

                <select
                  value={situacaoAnterior}
                  onChange={(event) =>
                    setSituacaoAnterior(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Todas
                  </option>

                  <option value="ATIVO">
                    Ativo
                  </option>

                  <option value="INATIVO">
                    Inativo
                  </option>

                  <option value="BAIXADO">
                    Baixado
                  </option>

                  <option value="DESCARTADO">
                    Descartado
                  </option>

                  <option value="EXTRAVIADO">
                    Extraviado
                  </option>

                  <option value="FURTADO">
                    Furtado
                  </option>

                  <option value="EM_MANUTENCAO">
                    Em manutenção
                  </option>
                </select>
              </label>

              <label className="consulta-label">
                Situação nova

                <select
                  value={situacaoNova}
                  onChange={(event) =>
                    setSituacaoNova(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Todas
                  </option>

                  <option value="ATIVO">
                    Ativo
                  </option>

                  <option value="INATIVO">
                    Inativo
                  </option>

                  <option value="BAIXADO">
                    Baixado
                  </option>

                  <option value="DESCARTADO">
                    Descartado
                  </option>

                  <option value="EXTRAVIADO">
                    Extraviado
                  </option>

                  <option value="FURTADO">
                    Furtado
                  </option>

                  <option value="EM_MANUTENCAO">
                    Em manutenção
                  </option>
                </select>
              </label>
            </div>

            {erro && (
              <div
                className="movimentacao-material-erro"
                role="alert"
              >
                {erro}
              </div>
            )}

            <div className="consulta-movimentacoes-acoes">
              <button
                type="button"
                className="limpar-filtros-button"
                onClick={limparFiltros}
                disabled={carregando}
              >
                <FaRotateLeft />
                Limpar
              </button>

              <button
                type="submit"
                className="consulta-ver-todos-button"
                disabled={
                  carregando ||
                  carregandoLocalizacoes
                }
              >
                <FaMagnifyingGlass />

                {carregando
                  ? 'Consultando...'
                  : 'Consultar'}
              </button>

              <button
                type="button"
                className="consulta-ampliar-button"
                onClick={() =>
                  setModalAmpliado(true)
                }
                disabled={
                  carregando ||
                  movimentacoes.length === 0
                }
              >
                <FaUpRightAndDownLeftFromCenter />
                Ampliar
              </button>
            </div>
          </form>
        </section>

        <section className="consulta-setores-card">
          <div className="consulta-lista-topo">
            <h2>
              Resumo das movimentações
            </h2>

            <span>
              {resumo.total} registro(s)
            </span>
          </div>

          <div className="consulta-setores-lista">
            <div className="consulta-setor-item">
              <span>Transferências</span>
              <strong>
                {resumo.transferencias}
              </strong>
            </div>

            <div className="consulta-setor-item">
              <span>Reativações</span>
              <strong>
                {resumo.reativacoes}
              </strong>
            </div>
          </div>
        </section>

        <section className="consulta-resultados-card">
          <div className="consulta-lista-topo">
            <h2>
              Resultado da consulta
            </h2>

            <span>
              {movimentacoes.length}{' '}
              item(ns)
            </span>
          </div>

          <div className="consulta-resultados-scroll">
            {carregando && (
              <div className="consulta-vazio">
                Carregando movimentações...
              </div>
            )}

            {!carregando &&
              movimentacoes.map(
                (movimentacao) =>
                  renderizarMovimentacao(
                    movimentacao
                  )
              )}

            {!carregando &&
              movimentacoes.length === 0 &&
              !erro && (
                <div className="consulta-vazio">
                  Nenhuma movimentação foi
                  encontrada para os filtros
                  selecionados.
                </div>
              )}
          </div>
        </section>
      </section>

      {modalAmpliado && (
        <div
          className="consulta-movimentacoes-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setModalAmpliado(false);
            }
          }}
        >
          <section
            className="consulta-movimentacoes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-movimentacoes"
          >
            <header className="consulta-movimentacoes-modal-header">
              <div>
                <span>
                  Resultado filtrado
                </span>

                <h2 id="titulo-modal-movimentacoes">
                  Movimentações patrimoniais
                </h2>

                <p>
                  {movimentacoes.length}{' '}
                  registro(s) encontrado(s)
                </p>
              </div>

              <button
                type="button"
                className="consulta-movimentacoes-modal-x"
                onClick={() =>
                  setModalAmpliado(false)
                }
                aria-label="Fechar modal"
              >
                <FaXmark />
              </button>
            </header>

            {filtrosAtivos.length > 0 && (
              <div className="consulta-movimentacoes-filtros-aplicados">
                <strong>
                  Filtros aplicados
                </strong>

                <div>
                  {filtrosAtivos.map(
                    (filtro) => (
                      <span key={filtro}>
                        {filtro}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="consulta-movimentacoes-modal-lista">
              {movimentacoes.map(
                (movimentacao) =>
                  renderizarMovimentacao(
                    movimentacao,
                    true
                  )
              )}
            </div>

            {erroPdf && (
              <div
                className="movimentacao-material-erro consulta-movimentacoes-erro-pdf"
                role="alert"
              >
                {erroPdf}
              </div>
            )}

            <footer className="consulta-movimentacoes-modal-acoes">
              <button
                type="button"
                className="consulta-movimentacoes-modal-fechar"
                onClick={() =>
                  setModalAmpliado(false)
                }
              >
                <FaXmark />
                Fechar
              </button>

              <button
                type="button"
                className="consulta-movimentacoes-modal-pdf"
                onClick={
                  gerarPdfMovimentacoes
                }
                disabled={
                  movimentacoes.length === 0
                }
              >
                <FaFilePdf />
                PDF
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

export default ConsultaMovimentacoes;