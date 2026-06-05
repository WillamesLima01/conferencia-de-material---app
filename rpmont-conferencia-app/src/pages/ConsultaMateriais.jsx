import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FaArrowLeft,
  FaBarcode,
  FaBoxesStacked,
  FaCheck,
  FaFilePdf,
  FaFilter,
  FaMagnifyingGlass,
  FaRotateLeft,
} from 'react-icons/fa6';
import { setoresDaUnidade } from '../data/setores';
import '../styles/ConsultaMateriais.css';
import brasaoRPMont from '../assets/RPMONT.png';

function ConsultaMateriais({ usuario, materiais, onVoltar }) {
  const [descricao, setDescricao] = useState('');
  const [nSerie, setNSerie] = useState('');
  const [setor, setSetor] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [situacao, setSituacao] = useState('ATIVO');

  const materiaisFiltrados = useMemo(() => {
    return materiais.filter((material) => {
      const mesmaUnidade = material.unidade === usuario.unidade;

      const descricaoConfere = material.descricao
        ?.toLowerCase()
        .includes(descricao.toLowerCase().trim());

      const serieConfere = material.NSerie
        ?.toLowerCase()
        .includes(nSerie.toLowerCase().trim());

      const setorConfere = setor ? material.setor === setor : true;

      const statusConfere =
        status === 'TODOS'
          ? true
          : status === 'CONFERIDO'
            ? material.Conferido === 1
            : material.Conferido === 0;

      const situacaoConfere =
        situacao === 'TODOS' ? true : material.situacao === situacao;

      return (
        mesmaUnidade &&
        descricaoConfere &&
        serieConfere &&
        setorConfere &&
        statusConfere &&
        situacaoConfere
      );
    });
  }, [materiais, usuario.unidade, descricao, nSerie, setor, status, situacao]);

  const total = materiaisFiltrados.length;

  const totalConferidos = materiaisFiltrados.filter(
    (material) => material.Conferido === 1
  ).length;

  const totalPendentes = materiaisFiltrados.filter(
    (material) => material.Conferido === 0
  ).length;

  const totalAtivos = materiaisFiltrados.filter(
    (material) => material.situacao === 'ATIVO'
  ).length;

  const totalInativos = materiaisFiltrados.filter(
    (material) => material.situacao === 'INATIVO'
  ).length;

  const resumoPorSetor = useMemo(() => {
    const resumo = {};

    materiaisFiltrados.forEach((material) => {
      if (!resumo[material.setor]) {
        resumo[material.setor] = 0;
      }

      resumo[material.setor] += 1;
    });

    return Object.entries(resumo).sort((a, b) => a[0].localeCompare(b[0]));
  }, [materiaisFiltrados]);

  const limparFiltros = () => {
    setDescricao('');
    setNSerie('');
    setSetor('');
    setStatus('TODOS');
    setSituacao('ATIVO');
  };

const carregarImagemBase64 = (src) => {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.crossOrigin = 'anonymous';
    imagem.src = src;

    imagem.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imagem.width;
      canvas.height = imagem.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(imagem, 0, 0);

      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };

    imagem.onerror = reject;
  });
};

const gerarPDF = async () => {
  const doc = new jsPDF('l', 'mm', 'a4');

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const larguraPagina = doc.internal.pageSize.getWidth();
  const centroPagina = larguraPagina / 2;

  try {
    const brasaoBase64 = await carregarImagemBase64(brasaoRPMont);
    doc.addImage(brasaoBase64, 'PNG', centroPagina - 15, 8, 30, 30);
  } catch (error) {
    console.error('Erro ao carregar o brasão no PDF:', error);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('REGIMENTO DE POLÍCIA MONTADA – CEL. CALIXTO', centroPagina, 45, {
    align: 'center',
  });

  doc.setFontSize(15);
  doc.text('INVENTÁRIO DE MATERIAIS PATRIMONIAIS', centroPagina, 53, {
    align: 'center',
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Unidade: ${usuario.unidade}`, 14, 65);
  doc.text(`Emitido por: ${usuario.nomeExibicao || usuario.nome}`, 14, 71);
  doc.text(`Data: ${dataAtual} às ${horaAtual}`, 14, 77);

  doc.setFont('helvetica', 'bold');
  doc.text('Filtros aplicados:', 14, 89);

  doc.setFont('helvetica', 'normal');
  doc.text(`Descrição: ${descricao || 'Todos'}`, 14, 96);
  doc.text(`Nº Série: ${nSerie || 'Todos'}`, 14, 102);
  doc.text(`Setor: ${setor || 'Todos'}`, 14, 108);
  doc.text(`Conferência: ${status}`, 14, 114);
  doc.text(`Situação: ${situacao}`, 14, 120);

  doc.setFont('helvetica', 'bold');
  doc.text('Resumo:', 150, 89);

  doc.setFont('helvetica', 'normal');
  doc.text(`Total encontrado: ${total}`, 150, 96);
  doc.text(`Conferidos: ${totalConferidos}`, 150, 102);
  doc.text(`Pendentes: ${totalPendentes}`, 150, 108);
  doc.text(`Ativos: ${totalAtivos}`, 150, 114);
  doc.text(`Inativos: ${totalInativos}`, 150, 120);

  autoTable(doc, {
    startY: 130,
    head: [
      [
        'Item',
        'Nº Série',
        'Descrição',
        'Observação',
        'Setor',
        'Unidade',
        'Data Cadastro',
        'Conferência',
        'Situação',
      ],
    ],
    body: materiaisFiltrados.map((material, index) => [
      index + 1,
      material.NSerie || '-',
      material.descricao || '-',
      material.observacao || '-',
      material.setor || '-',
      material.unidade || '-',
      material.dataCadastro || '-',
      material.Conferido === 1 ? 'CONFERIDO' : 'PENDENTE',
      material.situacao || 'ATIVO',
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [223, 27, 36],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' }, // Item
      1: { cellWidth: 25 }, // Nº Série
      2: { cellWidth: 48 }, // Descrição
      3: { cellWidth: 55 }, // Observação
      4: { cellWidth: 30 }, // Setor
      5: { cellWidth: 28 }, // Unidade
      6: { cellWidth: 25 }, // Data Cadastro
      7: { cellWidth: 28 }, // Conferência
      8: { cellWidth: 22 }, // Situação
    },
    margin: {
      left: 8,
      right: 8,
    },
    didDrawPage: () => {
      const pageCount = doc.internal.getNumberOfPages();
      const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${pageCurrent} de ${pageCount}`,
        larguraPagina - 20,
        200,
        { align: 'right' }
      );
    },
  });

  const nomeArquivo = `inventario-materiais-${usuario.unidade
    .replace(/\s+/g, '-')
    .toLowerCase()}-${dataAtual.replace(/\//g, '-')}.pdf`;

  doc.save(nomeArquivo);
};

  return (
    <main className="consulta-page">
      <section className="consulta-phone">
        <header className="consulta-header">
          <button type="button" className="consulta-voltar" onClick={onVoltar}>
            <FaArrowLeft />
          </button>

          <div>
            <span>Consulta patrimonial</span>
            <h1>Filtros avançados</h1>
            <p>Unidade: {usuario.unidade}</p>
          </div>
        </header>

        <section className="consulta-resumo-grid">
          <div>
            <span>Total</span>
            <strong>{total}</strong>
          </div>

          <div>
            <span>Conferidos</span>
            <strong>{totalConferidos}</strong>
          </div>

          <div>
            <span>Pendentes</span>
            <strong>{totalPendentes}</strong>
          </div>

          <div>
            <span>Ativos</span>
            <strong>{totalAtivos}</strong>
          </div>

          <div>
            <span>Inativos</span>
            <strong>{totalInativos}</strong>
          </div>
        </section>

        <section className="consulta-filtros-card">
          <div className="consulta-card-titulo">
            <FaFilter />
            <div>
              <h2>Filtrar materiais</h2>
              <p>Busque por descrição, série, setor, status ou situação.</p>
            </div>
          </div>

          <label className="consulta-label">
            Descrição
            <div className="consulta-input-icon">
              <FaMagnifyingGlass />
              <input
                type="text"
                value={descricao}
                placeholder="Ex.: computador, notebook, ar-condicionado"
                onChange={(event) => setDescricao(event.target.value)}
              />
            </div>
          </label>

          <label className="consulta-label">
            Nº Série / Código
            <div className="consulta-input-icon">
              <FaBarcode />
              <input
                type="text"
                value={nSerie}
                placeholder="Ex.: 100005"
                onChange={(event) => setNSerie(event.target.value)}
              />
            </div>
          </label>

          <div className="consulta-select-grid">
            <label className="consulta-label">
              Setor
              <select
                value={setor}
                onChange={(event) => setSetor(event.target.value)}
              >
                <option value="">Todos</option>
                {setoresDaUnidade.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="consulta-label">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="CONFERIDO">Conferidos</option>
                <option value="PENDENTE">Pendentes</option>
              </select>
            </label>
          </div>

          <label className="consulta-label">
            Situação
            <select
              value={situacao}
              onChange={(event) => setSituacao(event.target.value)}
            >
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
              <option value="TODOS">Todos</option>
            </select>
          </label>

          <div className="consulta-acoes-filtros">
            <button
              type="button"
              className="limpar-filtros-button"
              onClick={limparFiltros}
            >
              <FaRotateLeft />
              Limpar filtros
            </button>

            <button
              type="button"
              className="gerar-pdf-button"
              onClick={gerarPDF}
              disabled={materiaisFiltrados.length === 0}
            >
              <FaFilePdf />
              Gerar PDF
            </button>
          </div>
        </section>

        <section className="consulta-setores-card">
          <div className="consulta-lista-topo">
            <h2>Resumo por setor</h2>
            <span>{resumoPorSetor.length} setor(es)</span>
          </div>

          {resumoPorSetor.length > 0 ? (
            <div className="consulta-setores-lista">
              {resumoPorSetor.map(([nomeSetor, quantidade]) => (
                <div key={nomeSetor} className="consulta-setor-item">
                  <span>{nomeSetor}</span>
                  <strong>{quantidade}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="consulta-vazio">Nenhum setor encontrado.</div>
          )}
        </section>

        <section className="consulta-resultados-card">
          <div className="consulta-lista-topo">
            <h2>Resultado da consulta</h2>
            <span>{total} item(ns)</span>
          </div>

          <div className="consulta-resultados-scroll">
            {materiaisFiltrados.map((material) => (
              <article
                key={material.ID}
                className={`consulta-material-card ${
                  material.situacao === 'INATIVO'
                    ? 'consulta-material-inativo'
                    : ''
                }`}
              >
                <div className="consulta-material-icon">
                  {material.Conferido === 1 ? <FaCheck /> : <FaBoxesStacked />}
                </div>

                <div className="consulta-material-info">
                  <strong>{material.NSerie}</strong>
                  <h3>{material.descricao}</h3>
                  <p>{material.observacao}</p>

                  <div className="consulta-material-tags">
                    <span>{material.setor}</span>
                    <span>{material.situacao}</span>
                    <span>
                      {material.Conferido === 1 ? 'CONFERIDO' : 'PENDENTE'}
                    </span>
                  </div>
                </div>
              </article>
            ))}

            {materiaisFiltrados.length === 0 && (
              <div className="consulta-vazio">
                Nenhum material encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default ConsultaMateriais;