import brasaoRPMont from '../assets/RPMont.png';

export const NOME_REGIMENTO = 'REGIMENTO DE POLÍCIA MONTADA - CEL. CALIXTO';

export const adicionarCabecalhoRelatorio = (pdf, titulo) => {
  const larguraPagina = pdf.internal.pageSize.getWidth();

  try {
    pdf.addImage(
      brasaoRPMont,
      'PNG',
      larguraPagina / 2 - 12,
      8,
      24,
      24
    );
  } catch {
    // Se o brasão não carregar, o relatório continua sendo gerado.
  }

  pdf.setTextColor(20, 20, 20);
  pdf.setFont('helvetica', 'bold');

  pdf.setFontSize(11);
  pdf.text(NOME_REGIMENTO, larguraPagina / 2, 39, {
    align: 'center',
  });

  pdf.setFontSize(13);
  pdf.text(titulo, larguraPagina / 2, 48, {
    align: 'center',
  });

  pdf.setDrawColor(160, 160, 160);
  pdf.line(14, 54, larguraPagina - 14, 54);
};

export const adicionarRodapeRelatorio = (pdf) => {
  const totalPaginas = pdf.internal.getNumberOfPages();
  const larguraPagina = pdf.internal.pageSize.getWidth();
  const alturaPagina = pdf.internal.pageSize.getHeight();

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    pdf.setPage(pagina);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(90);

    pdf.text(
      `Página ${pagina} de ${totalPaginas}`,
      larguraPagina / 2,
      alturaPagina - 8,
      { align: 'center' }
    );
  }
};

export const formatarNumeroRelatorio = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
};

export const formatarDataRelatorio = (valor) => {
  if (!valor) return '-';

  const [ano, mes, dia] = String(valor).split('-');

  if (!ano || !mes || !dia) return valor;

  return `${dia}/${mes}/${ano}`;
};

export const obterNomeProdutoRelatorio = (
  tipo
) => {
  switch (tipo) {
    case 'FENO':
      return 'Feno';

    case 'RACAO_ADULTO_PREMIUM':
      return 'Ração Adulto Premium';

    case 'RACAO_ADULTO_MANUTENCAO':
      return 'Ração Adulto Manutenção';

    case 'RACAO_POTRO_PREMIUM':
      return 'Ração Potro Premium';

    case 'RACAO_POTRO_MANUTENCAO':
      return 'Ração Potro Manutenção';

    default:
      return tipo || '-';
  }
};