import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import brasaoRPMont from '../assets/RPMont.png';

const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatarData = (valor) => {
  if (!valor) return '-';

  const [ano, mes, dia] = String(valor).split('-');

  if (!ano || !mes || !dia) return valor;

  return `${dia}/${mes}/${ano}`;
};

const obterNomeProduto = (tipo) => {
  if (tipo === 'FENO') return 'Feno';
  if (tipo === 'RACAO_ADULTO') return 'Ração Adulto';
  if (tipo === 'RACAO_POTRO') return 'Ração Potro';

  return tipo || '-';
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

export const gerarRelatorioFenoRacaoPdf = async ({
  usuario,
  filtros,
  resumo,
  resumoPorProduto,
  estoqueAtualFiltrado,
  entradasFiltradas,
  saidasFiltradas,
}) => {
  const doc = new jsPDF('l', 'mm', 'a4');

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const unidade = usuario?.unidade || usuario?.UNIDADE || 'RPMont';
  const nomeUsuario = usuario?.nomeExibicao || usuario?.nome || usuario?.NOME || '-';

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
  doc.text('RELATÓRIO DE FENO E RAÇÃO', centroPagina, 53, {
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
  doc.text(
    `Período: ${formatarData(filtros.dataInicial)} até ${formatarData(
      filtros.dataFinal
    )}`,
    14,
    96
  );
  doc.text(`Produto: ${filtros.produtoNome || 'Todos os produtos'}`, 14, 102);

  doc.setFont('helvetica', 'bold');
  doc.text('Resumo geral:', 150, 89);

  doc.setFont('helvetica', 'normal');
  doc.text(
    `Entradas: ${formatarNumero(resumo.totalEntradaUnidades)} un. / ${formatarNumero(
      resumo.totalEntradaKg
    )} kg`,
    150,
    96
  );
  doc.text(
    `Saídas: ${formatarNumero(resumo.totalSaidaUnidades)} un. / ${formatarNumero(
      resumo.totalSaidaKg
    )} kg`,
    150,
    102
  );
  doc.text(
    `Saldo atual: ${formatarNumero(resumo.saldoAtualUnidades)} un. / ${formatarNumero(
      resumo.saldoAtualKg
    )} kg`,
    150,
    108
  );

  autoTable(doc, {
    startY: 120,
    head: [['Produto', 'Saldo unidades', 'Saldo kg', 'Saída no período']],
    body:
      resumoPorProduto.length === 0
        ? [['-', '-', '-', '-']]
        : resumoPorProduto.map((produto) => [
            produto.nome,
            formatarNumero(produto.saldoUnidades),
            `${formatarNumero(produto.saldoKg)} kg`,
            `${formatarNumero(produto.saidaKg)} kg`,
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
    margin: {
      left: 14,
      right: 14,
    },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Produto', 'Lote', 'Entrada', 'Peso un.', 'Saldo un.', 'Saldo kg']],
    body:
      estoqueAtualFiltrado.length === 0
        ? [['Nenhum estoque encontrado', '-', '-', '-', '-', '-']]
        : estoqueAtualFiltrado.map((entrada) => [
            obterNomeProduto(entrada.tipoProduto),
            entrada.lote || '-',
            formatarData(entrada.dataEntrada),
            `${formatarNumero(entrada.pesoUnidadeKg)} kg`,
            formatarNumero(entrada.quantidadeAtual),
            `${formatarNumero(
              Number(entrada.quantidadeAtual || 0) *
                Number(entrada.pesoUnidadeKg || 0)
            )} kg`,
          ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: {
      left: 14,
      right: 14,
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

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [
      [
        'Data',
        'Produto',
        'Lote',
        'Fornecedor',
        'Quantidade',
        'Peso un.',
        'Peso total',
      ],
    ],
    body:
      entradasFiltradas.length === 0
        ? [['Nenhuma entrada encontrada', '-', '-', '-', '-', '-', '-']]
        : entradasFiltradas.map((entrada) => {
            const quantidade = Number(
              entrada.quantidadeInicial || entrada.quantidade || 0
            );

            return [
              formatarData(entrada.dataEntrada),
              obterNomeProduto(entrada.tipoProduto),
              entrada.lote || '-',
              entrada.fornecedor || '-',
              formatarNumero(quantidade),
              `${formatarNumero(entrada.pesoUnidadeKg)} kg`,
              `${formatarNumero(
                quantidade * Number(entrada.pesoUnidadeKg || 0)
              )} kg`,
            ];
          }),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [21, 128, 61],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: {
      left: 14,
      right: 14,
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

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [
      [
        'Data',
        'Produto',
        'Serviço',
        'Lote',
        'Retirada',
        'Peso liberado',
        'Responsável',
      ],
    ],
    body:
      saidasFiltradas.length === 0
        ? [['Nenhuma saída encontrada', '-', '-', '-', '-', '-', '-']]
        : saidasFiltradas.map((saida) => [
            formatarData(saida.dataSaida),
            saida.nomeProduto || obterNomeProduto(saida.tipoProduto),
            saida.servico || '-',
            saida.lote || '-',
            formatarNumero(saida.quantidadeRetirada),
            `${formatarNumero(saida.pesoLiberadoKg)} kg`,
            saida.responsavel || '-',
          ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [180, 83, 9],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: {
      left: 14,
      right: 14,
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

  const nomeArquivo = `relatorio-feno-racao-${unidade
    .replace(/\s+/g, '-')
    .toLowerCase()}-${dataAtual.replace(/\//g, '-')}.pdf`;

  doc.save(nomeArquivo);
};