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

const obterNumeroSerie = (material) =>
  material?.numeroSerie ??
  material?.NSerie ??
  '-';

const materialEstaConferido = (material) =>
  material?.conferido === true ||
  material?.conferido === 1 ||
  material?.Conferido === true ||
  material?.Conferido === 1;

const obterTexto = (valor, textoPadrao = '-') => {
  const texto = String(valor ?? '').trim();

  return texto || textoPadrao;
};

export const gerarRelatorioPatrimonioPdf = async ({
  usuario,
  filtros,
  materiaisFiltrados = [],
  resumo,
}) => {
  const doc = new jsPDF('l', 'mm', 'a4');

  const agora = new Date();

  const dataAtual = agora.toLocaleDateString('pt-BR');

  const horaAtual = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const unidade =
    usuario?.unidade ||
    usuario?.UNIDADE ||
    'RPMont';

  const nomeUsuario =
    usuario?.nomeExibicao ||
    usuario?.nome ||
    usuario?.NOME ||
    '-';

  const larguraPagina =
    doc.internal.pageSize.getWidth();

  const alturaPagina =
    doc.internal.pageSize.getHeight();

  const centroPagina =
    larguraPagina / 2;

  try {
    const brasaoBase64 =
      await carregarImagemBase64(brasaoRPMont);

    doc.addImage(
      brasaoBase64,
      'PNG',
      centroPagina - 15,
      8,
      30,
      30
    );
  } catch (error) {
    console.error(
      'Erro ao carregar o brasão no PDF:',
      error
    );
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  doc.text(
    'REGIMENTO DE POLÍCIA MONTADA – CEL. CALIXTO',
    centroPagina,
    45,
    {
      align: 'center',
    }
  );

  doc.setFontSize(15);

  doc.text(
    'INVENTÁRIO DE MATERIAIS PATRIMONIAIS',
    centroPagina,
    53,
    {
      align: 'center',
    }
  );

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(
    `Unidade: ${unidade}`,
    14,
    65
  );

  doc.text(
    `Emitido por: ${nomeUsuario}`,
    14,
    71
  );

  doc.text(
    `Data: ${dataAtual} às ${horaAtual}`,
    14,
    77
  );

  doc.setFont('helvetica', 'bold');

  doc.text(
    'Filtros aplicados:',
    14,
    89
  );

  doc.setFont('helvetica', 'normal');

  doc.text(
    `Nome: ${filtros?.nome || 'Todos'}`,
    14,
    96
  );

  doc.text(
    `Marca: ${filtros?.marca || 'Todas'}`,
    14,
    102
  );

  doc.text(
    `Descrição: ${filtros?.descricao || 'Todas'}`,
    14,
    108
  );

  doc.text(
    `Nº Série: ${
      filtros?.numeroSerie ||
      filtros?.nSerie ||
      'Todos'
    }`,
    14,
    114
  );

  doc.text(
    `Setor: ${filtros?.setor || 'Todos'}`,
    14,
    120
  );

  doc.text(
    `Conferência: ${filtros?.status || 'TODOS'}`,
    14,
    126
  );

  doc.text(
    `Situação: ${filtros?.situacao || 'TODOS'}`,
    14,
    132
  );

  doc.setFont('helvetica', 'bold');

  doc.text(
    'Resumo:',
    165,
    89
  );

  doc.setFont('helvetica', 'normal');

  doc.text(
    `Total encontrado: ${resumo?.total ?? 0}`,
    165,
    96
  );

  doc.text(
    `Conferidos: ${resumo?.totalConferidos ?? 0}`,
    165,
    102
  );

  doc.text(
    `Pendentes: ${resumo?.totalPendentes ?? 0}`,
    165,
    108
  );

  doc.text(
    `Ativos: ${resumo?.totalAtivos ?? 0}`,
    165,
    114
  );

  doc.text(
    `Inativos: ${resumo?.totalInativos ?? 0}`,
    165,
    120
  );

  autoTable(doc, {
    startY: 142,

    head: [
      [
        'Item',
        'Nº Série',
        'Nome',
        'Marca',
        'Descrição',
        'Observação',
        'Setor',
        'Unidade',
        'Cadastro',
        'Conferência',
        'Situação',
      ],
    ],

    body: materiaisFiltrados.map(
      (material, index) => [
        index + 1,

        obterNumeroSerie(material),

        obterTexto(
          material?.nome,
          'Não informado'
        ),

        obterTexto(
          material?.marca,
          'Não informada'
        ),

        obterTexto(
          material?.descricao,
          'Sem descrição'
        ),

        obterTexto(
          material?.observacao,
          'Sem observação'
        ),

        obterTexto(
          material?.setor,
          'Sem setor'
        ),

        obterTexto(
          material?.unidade,
          'Sem unidade'
        ),

        obterTexto(
          material?.dataCadastro,
          '-'
        ),

        materialEstaConferido(material)
          ? 'CONFERIDO'
          : 'PENDENTE',

        obterTexto(
          material?.situacao,
          'ATIVO'
        ),
      ]
    ),

    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      valign: 'middle',
      overflow: 'linebreak',
    },

    headStyles: {
      fillColor: [223, 27, 36],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },

    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },

    columnStyles: {
      0: {
        cellWidth: 10,
        halign: 'center',
      },

      1: {
        cellWidth: 22,
      },

      2: {
        cellWidth: 23,
      },

      3: {
        cellWidth: 20,
      },

      4: {
        cellWidth: 38,
      },

      5: {
        cellWidth: 40,
      },

      6: {
        cellWidth: 24,
      },

      7: {
        cellWidth: 24,
      },

      8: {
        cellWidth: 22,
        halign: 'center',
      },

      9: {
        cellWidth: 24,
        halign: 'center',
      },

      10: {
        cellWidth: 19,
        halign: 'center',
      },
    },

    margin: {
      left: 7,
      right: 7,
      bottom: 14,
    },

    didDrawPage: () => {
      const paginaAtual =
        doc.internal.getCurrentPageInfo().pageNumber;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      doc.text(
        `Página ${paginaAtual}`,
        larguraPagina - 12,
        alturaPagina - 7,
        {
          align: 'right',
        }
      );
    },
  });

  const nomeArquivo =
    `inventario-materiais-${unidade
      .replace(/\s+/g, '-')
      .toLowerCase()}-${dataAtual.replace(/\//g, '-')}.pdf`;

  doc.save(nomeArquivo);
};