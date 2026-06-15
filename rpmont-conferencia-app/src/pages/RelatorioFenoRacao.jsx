import { useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FaArrowLeft,
  FaBoxesStacked,
  FaCalendarDays,
  FaChartColumn,
  FaFileLines,
  FaPrint,
  FaWheatAwn,
  FaFilePdf,
} from 'react-icons/fa6';
import { GiGrain } from 'react-icons/gi';

import '../styles/RelatorioFenoRacao.css';

const STORAGE_KEY_ENTRADAS = 'entradasAlimentacaoEquina';
const STORAGE_KEY_SAIDAS = 'saidasAlimentacaoEquina';

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
    valor: 'RACAO_ADULTO',
    nome: 'Ração Adulto',
  },
  {
    valor: 'RACAO_POTRO',
    nome: 'Ração Potro',
  },
];

const carregarStorage = (chave) => {
  const dadosSalvos = localStorage.getItem(chave);

  if (!dadosSalvos) return [];

  try {
    const dadosConvertidos = JSON.parse(dadosSalvos);

    return Array.isArray(dadosConvertidos) ? dadosConvertidos : [];
  } catch {
    return [];
  }
};

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

const formatarData = (valor) => {
  if (!valor) return '-';

  const [ano, mes, dia] = valor.split('-');

  if (!ano || !mes || !dia) return valor;

  return `${dia}/${mes}/${ano}`;
};

const obterNomeProduto = (tipo) => {
  if (tipo === 'FENO') return 'Feno';
  if (tipo === 'RACAO_ADULTO') return 'Ração Adulto';
  if (tipo === 'RACAO_POTRO') return 'Ração Potro';

  return tipo || '-';
};

const obterIconeProduto = (tipo) => {
  if (tipo === 'FENO') return <FaWheatAwn />;

  return <GiGrain />;
};

function RelatorioFenoRacao({ usuario, onVoltar }) {
  const relatorioRef = useRef(null);

  const [entradas] = useState(() => carregarStorage(STORAGE_KEY_ENTRADAS));
  const [saidas] = useState(() => carregarStorage(STORAGE_KEY_SAIDAS));

  const [dataInicial, setDataInicial] = useState(primeiroDiaDoMes());
  const [dataFinal, setDataFinal] = useState(dataHoje());
  const [produtoSelecionado, setProdutoSelecionado] = useState('TODOS');
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const unidadeUsuario = usuario?.unidade || usuario?.UNIDADE || 'RPMont';

  const filtrarPorPeriodoEProduto = (item, campoData) => {
    const dataItem = item?.[campoData];

    const dentroDoPeriodo =
      (!dataInicial || dataItem >= dataInicial) &&
      (!dataFinal || dataItem <= dataFinal);

    const produtoConfere =
      produtoSelecionado === 'TODOS' ||
      item?.tipoProduto === produtoSelecionado;

    return dentroDoPeriodo && produtoConfere;
  };

  const entradasFiltradas = useMemo(() => {
    return entradas
      .filter((entrada) => filtrarPorPeriodoEProduto(entrada, 'dataEntrada'))
      .sort((a, b) =>
        String(b.dataEntrada || '').localeCompare(String(a.dataEntrada || ''))
      );
  }, [entradas, dataInicial, dataFinal, produtoSelecionado]);

  const saidasFiltradas = useMemo(() => {
    return saidas
      .filter((saida) => filtrarPorPeriodoEProduto(saida, 'dataSaida'))
      .sort((a, b) =>
        String(b.dataSaida || '').localeCompare(String(a.dataSaida || ''))
      );
  }, [saidas, dataInicial, dataFinal, produtoSelecionado]);

  const estoqueAtualFiltrado = useMemo(() => {
    return entradas.filter((entrada) => {
      return (
        produtoSelecionado === 'TODOS' ||
        entrada?.tipoProduto === produtoSelecionado
      );
    });
  }, [entradas, produtoSelecionado]);

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
      saldoAtualUnidades,
      saldoAtualKg,
    };
  }, [entradasFiltradas, saidasFiltradas, estoqueAtualFiltrado]);

  const resumoPorProduto = useMemo(() => {
    const tipos = ['FENO', 'RACAO_ADULTO', 'RACAO_POTRO'];

    return tipos.map((tipo) => {
      const entradasDoProduto = entradas.filter(
        (entrada) => entrada.tipoProduto === tipo
      );

      const saidasDoProduto = saidasFiltradas.filter(
        (saida) => saida.tipoProduto === tipo
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

      return {
        tipo,
        nome: obterNomeProduto(tipo),
        saldoUnidades,
        saldoKg,
        saidaKg,
      };
    });
  }, [entradas, saidasFiltradas]);

  const imprimirRelatorio = () => {
    window.print();
  };

  const gerarPdfRelatorio = async () => {
    if (!relatorioRef.current || gerandoPdf) return;

    try {
      setGerandoPdf(true);

      const elemento = relatorioRef.current;

      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: elemento.scrollWidth,
      });

      const imagem = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');

      const larguraPagina = pdf.internal.pageSize.getWidth();
      const alturaPagina = pdf.internal.pageSize.getHeight();

      const margem = 8;
      const larguraImagem = larguraPagina - margem * 2;
      const alturaImagem = (canvas.height * larguraImagem) / canvas.width;

      let alturaRestante = alturaImagem;
      let posicaoY = margem;

      pdf.addImage(
        imagem,
        'PNG',
        margem,
        posicaoY,
        larguraImagem,
        alturaImagem
      );

      alturaRestante -= alturaPagina - margem * 2;

      while (alturaRestante > 0) {
        posicaoY = alturaRestante - alturaImagem + margem;
        pdf.addPage();

        pdf.addImage(
          imagem,
          'PNG',
          margem,
          posicaoY,
          larguraImagem,
          alturaImagem
        );

        alturaRestante -= alturaPagina - margem * 2;
      }

      const dataArquivo = new Date().toISOString().slice(0, 10);

      pdf.save(`relatorio-feno-racao-${dataArquivo}.pdf`);
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
            <p>{unidadeUsuario}</p>
          </div>
        </header>

        <section className="relatorio-alimentacao-apresentacao no-print">
          <div className="relatorio-alimentacao-apresentacao-icon">
            <FaFileLines />
          </div>

          <div>
            <span>Controle operacional</span>
            <h2>Entradas, saídas e saldo atual</h2>
            <p>
              Consulte o movimento de feno e ração por período e por tipo de
              produto.
            </p>
          </div>
        </section>

        <section className="relatorio-alimentacao-card no-print">
          <div className="relatorio-alimentacao-card-titulo">
            <FaCalendarDays />

            <div>
              <h2>Filtros do relatório</h2>
              <p>Selecione período e produto.</p>
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
                onChange={(event) => setProdutoSelecionado(event.target.value)}
              >
                {PRODUTOS.map((produto) => (
                  <option key={produto.valor} value={produto.valor}>
                    {produto.nome}
                  </option>
                ))}
              </select>
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
              disabled={gerandoPdf}
            >
              <FaFilePdf />
              {gerandoPdf ? 'Gerando PDF...' : 'Gerar PDF'}
            </button>
          </div>
        </section>

        <section
          className="relatorio-alimentacao-documento"
          ref={relatorioRef}
        >
          <div className="relatorio-alimentacao-documento-topo">
            <div>
              <span>Relatório</span>
              <h2>Feno e Ração</h2>
              <p>
                Período: {formatarData(dataInicial)} até{' '}
                {formatarData(dataFinal)}
              </p>
            </div>

            <strong>{unidadeUsuario}</strong>
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
                      período: {formatarNumero(produto.saidaKg)} kg
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
                Nenhum estoque encontrado.
              </div>
            ) : (
              <div className="relatorio-alimentacao-tabela-wrapper">
                <table className="relatorio-alimentacao-tabela">
                  <thead>
                    <tr>
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
                        <td>{obterNomeProduto(entrada.tipoProduto)}</td>
                        <td>{entrada.lote || '-'}</td>
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
                Nenhuma entrada encontrada no período.
              </div>
            ) : (
              <div className="relatorio-alimentacao-tabela-wrapper">
                <table className="relatorio-alimentacao-tabela">
                  <thead>
                    <tr>
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
                          <td>{formatarData(entrada.dataEntrada)}</td>
                          <td>{obterNomeProduto(entrada.tipoProduto)}</td>
                          <td>{entrada.lote || '-'}</td>
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
                Nenhuma saída encontrada no período.
              </div>
            ) : (
              <div className="relatorio-alimentacao-tabela-wrapper">
                <table className="relatorio-alimentacao-tabela">
                  <thead>
                    <tr>
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
                        <td>{formatarData(saida.dataSaida)}</td>
                        <td>
                          {saida.nomeProduto ||
                            obterNomeProduto(saida.tipoProduto)}
                        </td>
                        <td>{saida.servico || '-'}</td>
                        <td>{saida.lote || '-'}</td>
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
        </section>
      </section>
    </main>
  );
}

export default RelatorioFenoRacao;