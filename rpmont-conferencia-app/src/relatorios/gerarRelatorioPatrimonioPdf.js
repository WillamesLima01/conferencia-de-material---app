import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import brasaoRPMont from '../assets/RPMONT.png';

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

export const gerarRelatorioPatrimonioPdf = async ({
  usuario,
  filtros,
  materiaisFiltrados,
  resumo,
}) => {
  const doc = new jsPDF('l', 'mm', 'a4');

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const unidade = usuario?.unidade || usuario?.UNIDADE || 'RPMont';
  const nomeUsuario =
    usuario?.nomeExibicao || usuario?.nome || usuario?.NOME || '-';

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
  doc.text(`Unidade: ${unidade}`, 14, 65);
  doc.text(`Emitido por: ${nomeUsuario}`, 14, 71);
  doc.text(`Data: ${dataAtual} às ${horaAtual}`, 14, 77);

  doc.setFont('helvetica', 'bold');
  doc.text('Filtros aplicados:', 14, 89);

  doc.setFont('helvetica', 'normal');
  doc.text(`Descrição: ${filtros.descricao || 'Todos'}`, 14, 96);
  doc.text(`Nº Série: ${filtros.nSerie || 'Todos'}`, 14, 102);
  doc.text(`Setor: ${filtros.setor || 'Todos'}`, 14, 108);
  doc.text(`Conferência: ${filtros.status || 'TODOS'}`, 14, 114);
  doc.text(`Situação: ${filtros.situacao || 'TODOS'}`, 14, 120);

  doc.setFont('helvetica', 'bold');
  doc.text('Resumo:', 150, 89);

  doc.setFont('helvetica', 'normal');
  doc.text(`Total encontrado: ${resumo.total}`, 150, 96);
  doc.text(`Conferidos: ${resumo.totalConferidos}`, 150, 102);
  doc.text(`Pendentes: ${resumo.totalPendentes}`, 150, 108);
  doc.text(`Ativos: ${resumo.totalAtivos}`, 150, 114);
  doc.text(`Inativos: ${resumo.totalInativos}`, 150, 120);

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
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 48 },
      3: { cellWidth: 55 },
      4: { cellWidth: 30 },
      5: { cellWidth: 28 },
      6: { cellWidth: 25 },
      7: { cellWidth: 28 },
      8: { cellWidth: 22 },
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
      doc.text(`Página ${pageCurrent} de ${pageCount}`, larguraPagina - 20, 200, {
        align: 'right',
      });
    },
  });

  const nomeArquivo = `inventario-materiais-${unidade
    .replace(/\s+/g, '-')
    .toLowerCase()}-${dataAtual.replace(/\//g, '-')}.pdf`;

  doc.save(nomeArquivo);
};