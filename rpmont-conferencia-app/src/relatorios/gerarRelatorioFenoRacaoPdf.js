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
  extraviosFiltrados = [],
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

  const adicionarRodape = () => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${pageCurrent} de ${pageCount}`, larguraPagina - 20, 200, {
      align: 'right',
    });
  };

  const verificarEspaco = (yAtual, espacoNecessario = 34) => {
    if (yAtual + espacoNecessario > 190) {
      doc.addPage();
      return 18;
    }

    return yAtual;
  };

  const adicionarTituloSecao = (titulo, descricao, y, cor = [31, 41, 55]) => {
    const yCorrigido = verificarEspaco(y, 26);

    doc.setFillColor(cor[0], cor[1], cor[2]);
    doc.roundedRect(14, yCorrigido, larguraPagina - 28, 10, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, 18, yCorrigido + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(descricao, 14, yCorrigido + 16);

    doc.setTextColor(0, 0, 0);

    return yCorrigido + 21;
  };

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
    `Entradas: ${formatarNumero(
      resumo.totalEntradaUnidades
    )} un. / ${formatarNumero(resumo.totalEntradaKg)} kg`,
    150,
    96
  );

  doc.text(
    `Saídas: ${formatarNumero(
      resumo.totalSaidaUnidades
    )} un. / ${formatarNumero(resumo.totalSaidaKg)} kg`,
    150,
    102
  );

  doc.text(
    `Extravios: ${formatarNumero(
      resumo.totalExtravioUnidades
    )} un. / ${formatarNumero(resumo.totalExtravioKg)} kg`,
    150,
    108
  );

  doc.text(
    `Saldo atual: ${formatarNumero(
      resumo.saldoAtualUnidades
    )} un. / ${formatarNumero(resumo.saldoAtualKg)} kg`,
    150,
    114
  );

  let posicaoY = 124;

  posicaoY = adicionarTituloSecao(
    '1. RESUMO POR PRODUTO',
    'Mostra separadamente Feno, Ração Adulto e Ração Potro, com saldo atual, saídas e extravios no período filtrado.',
    posicaoY,
    [223, 27, 36]
  );

  autoTable(doc, {
    startY: posicaoY,
    head: [
      [
        'Produto',
        'Saldo atual em unidades',
        'Saldo atual em kg',
        'Saída no período',
        'Extravio no período',
      ],
    ],
    body:
      resumoPorProduto.length === 0
        ? [['-', '-', '-', '-', '-']]
        : resumoPorProduto.map((produto) => [
            produto.nome,
            formatarNumero(produto.saldoUnidades),
            `${formatarNumero(produto.saldoKg)} kg`,
            `${formatarNumero(produto.saidaKg)} kg`,
            `${formatarNumero(produto.extravioKg)} kg`,
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
    didDrawPage: adicionarRodape,
  });

  posicaoY = doc.lastAutoTable.finalY + 10;

  posicaoY = adicionarTituloSecao(
    '2. ESTOQUE ATUAL',
    'Mostra o saldo existente no estoque neste momento, por produto e por lote. Este bloco não representa entrada nem saída, representa o saldo atual.',
    posicaoY,
    [31, 41, 55]
  );

  autoTable(doc, {
    startY: posicaoY,
    head: [['Produto', 'Lote', 'Data da entrada', 'Peso un.', 'Saldo un.', 'Saldo kg']],
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
    didDrawPage: adicionarRodape,
  });

  posicaoY = doc.lastAutoTable.finalY + 10;

  posicaoY = adicionarTituloSecao(
    '3. ENTRADAS NO PERÍODO',
    'Mostra os cadastros de estoque realizados dentro do período filtrado. Aqui entram os lotes cadastrados de Feno, Ração Adulto e Ração Potro.',
    posicaoY,
    [21, 128, 61]
  );

  autoTable(doc, {
    startY: posicaoY,
    head: [
      [
        'Data',
        'Produto',
        'Lote',
        'Fornecedor',
        'Quantidade cadastrada',
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
    didDrawPage: adicionarRodape,
  });

  posicaoY = doc.lastAutoTable.finalY + 10;

  posicaoY = adicionarTituloSecao(
    '4. SAÍDAS NO PERÍODO',
    'Mostra as retiradas normais para consumo/serviço registradas dentro do período filtrado. Este bloco não inclui extravios.',
    posicaoY,
    [180, 83, 9]
  );

  autoTable(doc, {
    startY: posicaoY,
    head: [
      [
        'Data',
        'Produto',
        'Serviço',
        'Lote',
        'Quantidade retirada',
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
    didDrawPage: adicionarRodape,
  });

  posicaoY = doc.lastAutoTable.finalY + 10;

  posicaoY = adicionarTituloSecao(
    '5. EXTRAVIOS NO PERÍODO',
    'Mostra perdas, danos, desvios ou baixas justificadas registradas dentro do período filtrado. Este bloco é separado das saídas normais.',
    posicaoY,
    [153, 27, 27]
  );

  autoTable(doc, {
    startY: posicaoY,
    head: [
      [
        'Data',
        'Produto',
        'Lote',
        'Quantidade extraviada',
        'Peso',
        'Responsável',
        'Justificativa',
      ],
    ],
    body:
      extraviosFiltrados.length === 0
        ? [['Nenhum extravio encontrado', '-', '-', '-', '-', '-', '-']]
        : extraviosFiltrados.map((extravio) => [
            formatarData(extravio.dataExtravio),
            extravio.nomeProduto || obterNomeProduto(extravio.tipoProduto),
            extravio.lote || '-',
            formatarNumero(extravio.quantidadeExtraviada),
            `${formatarNumero(extravio.pesoExtraviadoKg)} kg`,
            extravio.responsavel || '-',
            extravio.motivo || '-',
          ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [153, 27, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 30 },
      2: { cellWidth: 28 },
      3: { cellWidth: 34 },
      4: { cellWidth: 25 },
      5: { cellWidth: 35 },
      6: { cellWidth: 100 },
    },
    margin: {
      left: 14,
      right: 14,
    },
    didDrawPage: adicionarRodape,
  });

  const nomeArquivo = `relatorio-feno-racao-${unidade
    .replace(/\s+/g, '-')
    .toLowerCase()}-${dataAtual.replace(/\//g, '-')}.pdf`;

  doc.save(nomeArquivo);
};