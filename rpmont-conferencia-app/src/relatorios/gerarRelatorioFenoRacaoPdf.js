import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Capacitor } from '@capacitor/core';
import {
  Filesystem,
  Directory,
} from '@capacitor/filesystem';
import { FileViewer } from '@capacitor/file-viewer';
import { Share } from '@capacitor/share';

import brasaoRPMont from '../assets/RPMont.png';

const ACAO_PDF = {
  ABRIR: 'ABRIR',
  COMPARTILHAR: 'COMPARTILHAR',
};

const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatarData = (valor) => {
  if (!valor) return '-';

  const texto = String(valor).trim();

  const apenasData = texto.split('T')[0];

  const [ano, mes, dia] = apenasData.split('-');

  if (!ano || !mes || !dia) {
    return texto;
  }

  return `${dia}/${mes}/${ano}`;
};

const obterNomeProduto = (tipo) => {
  if (tipo === 'FENO') {
    return 'Feno';
  }

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

const obterUnidadeRegistro = (registro) => {
  return (
    registro?.unidade ||
    registro?.UNIDADE ||
    registro?.Unidade ||
    '-'
  );
};

const obterUnidadeOrigemTransferencia = (transferencia) => {
  return (
    transferencia?.unidadeOrigem ||
    transferencia?.UNIDADE_ORIGEM ||
    transferencia?.origem ||
    transferencia?.unidadeSaida ||
    transferencia?.unidadeSolicitada ||
    '-'
  );
};

const obterUnidadeDestinoTransferencia = (transferencia) => {
  return (
    transferencia?.unidadeDestino ||
    transferencia?.UNIDADE_DESTINO ||
    transferencia?.destino ||
    transferencia?.unidadeEntrada ||
    transferencia?.unidadeSolicitante ||
    '-'
  );
};

const obterDataTransferencia = (transferencia) => {
  return (
    transferencia?.dataAprovacao ||
    transferencia?.dataTransferencia ||
    transferencia?.dataSolicitacao ||
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
    transferencia?.pesoTotalKg ??
      transferencia?.pesoTransferidoKg ??
      transferencia?.pesoSolicitadoKg ??
      0
  );

  if (pesoTotalSalvo > 0) {
    return pesoTotalSalvo;
  }

  return (
    obterQuantidadeTransferencia(transferencia) *
    obterPesoUnidadeTransferencia(transferencia)
  );
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

      const contexto = canvas.getContext('2d');

      if (!contexto) {
        reject(
          new Error(
            'Não foi possível criar o contexto para carregar o brasão.'
          )
        );

        return;
      }

      contexto.drawImage(imagem, 0, 0);

      const dataURL = canvas.toDataURL('image/png');

      resolve(dataURL);
    };

    imagem.onerror = () => {
      reject(
        new Error(
          'Não foi possível carregar o brasão para o relatório.'
        )
      );
    };
  });
};

const salvarAbrirOuCompartilharPdf = async (
  doc,
  nomeArquivo,
  acao = ACAO_PDF.ABRIR
) => {
  if (!Capacitor.isNativePlatform()) {
    doc.save(nomeArquivo);
    return;
  }

  const pdfDataUri = doc.output('datauristring');

  const pdfBase64 = pdfDataUri.split(',')[1];

  if (!pdfBase64) {
    throw new Error(
      'Não foi possível gerar os dados do PDF.'
    );
  }

  await Filesystem.writeFile({
    path: nomeArquivo,
    data: pdfBase64,
    directory: Directory.Cache,
    recursive: true,
  });

  const arquivo = await Filesystem.getUri({
    path: nomeArquivo,
    directory: Directory.Cache,
  });

  const uriArquivo = arquivo?.uri;

  if (!uriArquivo) {
    throw new Error(
      'Não foi possível obter o endereço do PDF gerado.'
    );
  }

  console.log(
    'PDF gerado no dispositivo:',
    uriArquivo
  );

  if (acao === ACAO_PDF.COMPARTILHAR) {
    const podeCompartilhar =
      await Share.canShare();

    if (!podeCompartilhar?.value) {
      throw new Error(
        'O compartilhamento não está disponível neste dispositivo.'
      );
    }

    await Share.share({
      title: 'Relatório de Feno e Ração',
      text: 'Relatório de Feno e Ração.',
      files: [uriArquivo],
      dialogTitle: 'Compartilhar relatório',
    });

    return;
  }

  await FileViewer.openDocumentFromLocalPath({
    path: uriArquivo,
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
  transferenciasFiltradas = [],
  acao = ACAO_PDF.ABRIR,
}) => {
  const doc = new jsPDF('l', 'mm', 'a4');

  const dataAtual =
    new Date().toLocaleDateString('pt-BR');

  const horaAtual =
    new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const unidadeUsuario =
    usuario?.unidade ||
    usuario?.UNIDADE ||
    'RPMont';

  const unidadeRelatorio =
    filtros?.unidadeNome ||
    filtros?.unidadeSelecionada ||
    unidadeUsuario;

  const relatorioGeral =
    Boolean(filtros?.relatorioGeral) ||
    filtros?.unidadeSelecionada === 'GERAL';

  const nomeUsuario =
    usuario?.nomeExibicao ||
    usuario?.nome ||
    usuario?.NOME ||
    '-';

  const larguraPagina =
    doc.internal.pageSize.getWidth();

  const centroPagina =
    larguraPagina / 2;

  const adicionarRodapes = () => {
    const quantidadePaginas =
      doc.internal.getNumberOfPages();

    for (
      let pagina = 1;
      pagina <= quantidadePaginas;
      pagina += 1
    ) {
      doc.setPage(pagina);

      doc.setFontSize(8);

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setTextColor(
        0,
        0,
        0
      );

      doc.text(
        `Página ${pagina} de ${quantidadePaginas}`,
        larguraPagina - 20,
        200,
        {
          align: 'right',
        }
      );
    }
  };

  const verificarEspaco = (
    posicaoAtual,
    espacoNecessario = 34
  ) => {
    if (
      posicaoAtual +
        espacoNecessario >
      190
    ) {
      doc.addPage();

      return 18;
    }

    return posicaoAtual;
  };

  const adicionarTituloSecao = (
    titulo,
    descricao,
    posicao,
    cor = [31, 41, 55]
  ) => {
    const posicaoCorrigida =
      verificarEspaco(
        posicao,
        26
      );

    doc.setFillColor(
      cor[0],
      cor[1],
      cor[2]
    );

    doc.roundedRect(
      14,
      posicaoCorrigida,
      larguraPagina - 28,
      10,
      2,
      2,
      'F'
    );

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(10);
    doc.setTextColor(
      255,
      255,
      255
    );

    doc.text(
      titulo,
      18,
      posicaoCorrigida + 6.5
    );

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(8);
    doc.setTextColor(
      71,
      85,
      105
    );

    const descricaoQuebrada =
      doc.splitTextToSize(
        descricao,
        larguraPagina - 28
      );

    doc.text(
      descricaoQuebrada,
      14,
      posicaoCorrigida + 16
    );

    doc.setTextColor(
      0,
      0,
      0
    );

    return (
      posicaoCorrigida + 21
    );
  };

  try {
    const brasaoBase64 =
      await carregarImagemBase64(
        brasaoRPMont
      );

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

  doc.setFont(
    'helvetica',
    'bold'
  );

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
    'RELATÓRIO DE FENO E RAÇÃO',
    centroPagina,
    53,
    {
      align: 'center',
    }
  );

  doc.setFontSize(10);

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.text(
    `Unidade do relatório: ${unidadeRelatorio}`,
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

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.text(
    'Filtros aplicados:',
    14,
    89
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.text(
    `Período: ${formatarData(
      filtros?.dataInicial
    )} até ${formatarData(
      filtros?.dataFinal
    )}`,
    14,
    96
  );

  doc.text(
    `Produto: ${
      filtros?.produtoNome ||
      'Todos os produtos'
    }`,
    14,
    102
  );

  doc.text(
    `Peso por unidade: ${
      filtros?.pesoNome ||
      'Todos os pesos'
    }`,
    14,
    108
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.text(
    'Resumo geral:',
    150,
    89
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.text(
    `Entradas: ${formatarNumero(
      resumo?.totalEntradaUnidades
    )} un. / ${formatarNumero(
      resumo?.totalEntradaKg
    )} kg`,
    150,
    96
  );

  doc.text(
    `Saídas: ${formatarNumero(
      resumo?.totalSaidaUnidades
    )} un. / ${formatarNumero(
      resumo?.totalSaidaKg
    )} kg`,
    150,
    102
  );

  doc.text(
    `Extravios: ${formatarNumero(
      resumo?.totalExtravioUnidades
    )} un. / ${formatarNumero(
      resumo?.totalExtravioKg
    )} kg`,
    150,
    108
  );

  if (relatorioGeral) {
    doc.text(
      `Transferências aprovadas: ${formatarNumero(
        resumo?.totalTransferenciaGeralUnidades
      )} un. / ${formatarNumero(
        resumo?.totalTransferenciaGeralKg
      )} kg`,
      150,
      114
    );

    doc.text(
      `Saldo atual: ${formatarNumero(
        resumo?.saldoAtualUnidades
      )} un. / ${formatarNumero(
        resumo?.saldoAtualKg
      )} kg`,
      150,
      120
    );
  } else {
    doc.text(
      `Transferências recebidas: ${formatarNumero(
        resumo?.totalTransferenciaRecebidaUnidades
      )} un. / ${formatarNumero(
        resumo?.totalTransferenciaRecebidaKg
      )} kg`,
      150,
      114
    );

    doc.text(
      `Transferências enviadas: ${formatarNumero(
        resumo?.totalTransferenciaEnviadaUnidades
      )} un. / ${formatarNumero(
        resumo?.totalTransferenciaEnviadaKg
      )} kg`,
      150,
      120
    );

    doc.text(
      `Saldo atual: ${formatarNumero(
        resumo?.saldoAtualUnidades
      )} un. / ${formatarNumero(
        resumo?.saldoAtualKg
      )} kg`,
      150,
      126
    );
  }

  let posicaoY =
    relatorioGeral
      ? 130
      : 136;

  posicaoY =
    adicionarTituloSecao(
      '1. RESUMO POR PRODUTO',
      'Mostra separadamente Feno, Ração Adulto Premium, Ração Adulto Manutenção, Ração Potro Premium e Ração Potro Manutenção, com saldo atual, saídas, extravios e transferências no período filtrado.',
      posicaoY,
      [223, 27, 36]
    );

  autoTable(doc, {
    startY: posicaoY,

    head: relatorioGeral
      ? [
          [
            'Produto',
            'Saldo atual em unidades',
            'Saldo atual em kg',
            'Saída no período',
            'Extravio no período',
            'Transferido',
          ],
        ]
      : [
          [
            'Produto',
            'Saldo atual em unidades',
            'Saldo atual em kg',
            'Saída no período',
            'Extravio no período',
            'Recebido',
            'Enviado',
          ],
        ],

    body:
      !Array.isArray(
        resumoPorProduto
      ) ||
      resumoPorProduto.length === 0
        ? relatorioGeral
          ? [
              [
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
          : [
              [
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
        : resumoPorProduto.map(
            (produto) => {
              if (
                relatorioGeral
              ) {
                return [
                  produto.nome,
                  formatarNumero(
                    produto.saldoUnidades
                  ),
                  `${formatarNumero(
                    produto.saldoKg
                  )} kg`,
                  `${formatarNumero(
                    produto.saidaKg
                  )} kg`,
                  `${formatarNumero(
                    produto.extravioKg
                  )} kg`,
                  `${formatarNumero(
                    produto.transferenciaGeralKg
                  )} kg`,
                ];
              }

              return [
                produto.nome,
                formatarNumero(
                  produto.saldoUnidades
                ),
                `${formatarNumero(
                  produto.saldoKg
                )} kg`,
                `${formatarNumero(
                  produto.saidaKg
                )} kg`,
                `${formatarNumero(
                  produto.extravioKg
                )} kg`,
                `${formatarNumero(
                  produto.transferenciaRecebidaKg
                )} kg`,
                `${formatarNumero(
                  produto.transferenciaEnviadaKg
                )} kg`,
              ];
            }
          ),

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },

    headStyles: {
      fillColor: [
        223,
        27,
        36,
      ],
      textColor: [
        255,
        255,
        255,
      ],
      fontStyle: 'bold',
    },

    alternateRowStyles: {
      fillColor: [
        245,
        245,
        245,
      ],
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  posicaoY =
    doc.lastAutoTable.finalY +
    10;

  posicaoY =
    adicionarTituloSecao(
      '2. ESTOQUE ATUAL',
      'Mostra o saldo existente no estoque neste momento, por produto e por lote. Este bloco não representa entrada nem saída, representa o saldo atual.',
      posicaoY,
      [31, 41, 55]
    );

  autoTable(doc, {
    startY: posicaoY,

    head: relatorioGeral
      ? [
          [
            'Unidade',
            'Produto',
            'Lote',
            'Data da entrada',
            'Peso un.',
            'Saldo un.',
            'Saldo kg',
          ],
        ]
      : [
          [
            'Produto',
            'Lote',
            'Data da entrada',
            'Peso un.',
            'Saldo un.',
            'Saldo kg',
          ],
        ],

    body:
      !Array.isArray(
        estoqueAtualFiltrado
      ) ||
      estoqueAtualFiltrado
        .length === 0
        ? relatorioGeral
          ? [
              [
                'Nenhum estoque encontrado',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
          : [
              [
                'Nenhum estoque encontrado',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
        : estoqueAtualFiltrado.map(
            (entrada) => {
              const linha = [
                obterNomeProduto(
                  entrada.tipoProduto
                ),
                entrada.lote ||
                  entrada.codigoLote ||
                  '-',
                formatarData(
                  entrada.dataEntrada
                ),
                `${formatarNumero(
                  entrada.pesoUnidadeKg
                )} kg`,
                formatarNumero(
                  entrada.quantidadeAtual
                ),
                `${formatarNumero(
                  Number(
                    entrada.quantidadeAtual ||
                      0
                  ) *
                    Number(
                      entrada.pesoUnidadeKg ||
                        0
                    )
                )} kg`,
              ];

              if (
                relatorioGeral
              ) {
                return [
                  obterUnidadeRegistro(
                    entrada
                  ),
                  ...linha,
                ];
              }

              return linha;
            }
          ),

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },

    headStyles: {
      fillColor: [
        31,
        41,
        55,
      ],
      textColor: [
        255,
        255,
        255,
      ],
      fontStyle: 'bold',
    },

    alternateRowStyles: {
      fillColor: [
        245,
        245,
        245,
      ],
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  posicaoY =
    doc.lastAutoTable.finalY +
    10;

  posicaoY =
    adicionarTituloSecao(
      '3. ENTRADAS NO PERÍODO',
      'Mostra os cadastros de estoque realizados dentro do período filtrado. Aqui entram os lotes cadastrados de Feno, Ração Adulto Premium, Ração Adulto Manutenção, Ração Potro Premium e Ração Potro Manutenção.',
      posicaoY,
      [21, 128, 61]
    );

  autoTable(doc, {
    startY: posicaoY,

    head: relatorioGeral
      ? [
          [
            'Unidade',
            'Data',
            'Produto',
            'Lote',
            'Fornecedor',
            'Quantidade cadastrada',
            'Peso un.',
            'Peso total',
          ],
        ]
      : [
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
      !Array.isArray(
        entradasFiltradas
      ) ||
      entradasFiltradas.length ===
        0
        ? relatorioGeral
          ? [
              [
                'Nenhuma entrada encontrada',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
          : [
              [
                'Nenhuma entrada encontrada',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
        : entradasFiltradas.map(
            (entrada) => {
              const quantidade =
                Number(
                  entrada.quantidadeInicial ??
                    entrada.quantidade ??
                    0
                );

              const linha = [
                formatarData(
                  entrada.dataEntrada
                ),
                obterNomeProduto(
                  entrada.tipoProduto
                ),
                entrada.lote ||
                  entrada.codigoLote ||
                  '-',
                entrada.fornecedor ||
                  '-',
                formatarNumero(
                  quantidade
                ),
                `${formatarNumero(
                  entrada.pesoUnidadeKg
                )} kg`,
                `${formatarNumero(
                  quantidade *
                    Number(
                      entrada.pesoUnidadeKg ||
                        0
                    )
                )} kg`,
              ];

              if (
                relatorioGeral
              ) {
                return [
                  obterUnidadeRegistro(
                    entrada
                  ),
                  ...linha,
                ];
              }

              return linha;
            }
          ),

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },

    headStyles: {
      fillColor: [
        21,
        128,
        61,
      ],
      textColor: [
        255,
        255,
        255,
      ],
      fontStyle: 'bold',
    },

    alternateRowStyles: {
      fillColor: [
        245,
        245,
        245,
      ],
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  posicaoY =
    doc.lastAutoTable.finalY +
    10;

  posicaoY =
    adicionarTituloSecao(
      '4. SAÍDAS NO PERÍODO',
      'Mostra as retiradas normais para consumo ou serviço registradas dentro do período filtrado. Este bloco não inclui extravios nem transferências.',
      posicaoY,
      [180, 83, 9]
    );

  autoTable(doc, {
    startY: posicaoY,

    head: relatorioGeral
      ? [
          [
            'Unidade',
            'Data',
            'Produto',
            'Serviço',
            'Lote',
            'Quantidade retirada',
            'Peso liberado',
            'Responsável',
          ],
        ]
      : [
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
      !Array.isArray(
        saidasFiltradas
      ) ||
      saidasFiltradas.length === 0
        ? relatorioGeral
          ? [
              [
                'Nenhuma saída encontrada',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
          : [
              [
                'Nenhuma saída encontrada',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
        : saidasFiltradas.map(
            (saida) => {
              const linha = [
                formatarData(
                  saida.dataSaida ||
                    saida.dataOperacao
                ),
                saida.nomeProduto ||
                  obterNomeProduto(
                    saida.tipoProduto
                  ),
                saida.servico ||
                  '-',
                saida.lote ||
                  saida.codigoLote ||
                  '-',
                formatarNumero(
                  saida.quantidadeRetirada ??
                    saida.quantidadeUnidades
                ),
                `${formatarNumero(
                  saida.pesoLiberadoKg ??
                    saida.pesoMovimentadoKg
                )} kg`,
                saida.responsavel ||
                  '-',
              ];

              if (
                relatorioGeral
              ) {
                return [
                  obterUnidadeRegistro(
                    saida
                  ),
                  ...linha,
                ];
              }

              return linha;
            }
          ),

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },

    headStyles: {
      fillColor: [
        180,
        83,
        9,
      ],
      textColor: [
        255,
        255,
        255,
      ],
      fontStyle: 'bold',
    },

    alternateRowStyles: {
      fillColor: [
        245,
        245,
        245,
      ],
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  posicaoY =
    doc.lastAutoTable.finalY +
    10;

  posicaoY =
    adicionarTituloSecao(
      '5. TRANSFERÊNCIAS NO PERÍODO',
      'Mostra as transferências aprovadas entre unidades. Para relatório por unidade, identifica o que foi recebido e o que foi enviado.',
      posicaoY,
      [37, 99, 235]
    );

  autoTable(doc, {
    startY: posicaoY,

    head: [
      [
        'Data',
        'Produto',
        'Origem',
        'Destino',
        'Lote',
        'Quantidade',
        'Peso un.',
        'Peso total',
        'Situação',
      ],
    ],

    body:
      !Array.isArray(
        transferenciasFiltradas
      ) ||
      transferenciasFiltradas
        .length === 0
        ? [
            [
              'Nenhuma transferência aprovada encontrada',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
            ],
          ]
        : transferenciasFiltradas.map(
            (transferencia) => [
              formatarData(
                obterDataTransferencia(
                  transferencia
                )
              ),

              transferencia.nomeProduto ||
                obterNomeProduto(
                  transferencia.tipoProduto
                ),

              obterUnidadeOrigemTransferencia(
                transferencia
              ),

              obterUnidadeDestinoTransferencia(
                transferencia
              ),

              transferencia.lote ||
                transferencia.codigoLoteOrigem ||
                '-',

              formatarNumero(
                obterQuantidadeTransferencia(
                  transferencia
                )
              ),

              `${formatarNumero(
                obterPesoUnidadeTransferencia(
                  transferencia
                )
              )} kg`,

              `${formatarNumero(
                obterPesoTotalTransferencia(
                  transferencia
                )
              )} kg`,

              transferencia.status ||
                transferencia.situacao ||
                '-',
            ]
          ),

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },

    headStyles: {
      fillColor: [
        37,
        99,
        235,
      ],
      textColor: [
        255,
        255,
        255,
      ],
      fontStyle: 'bold',
    },

    alternateRowStyles: {
      fillColor: [
        245,
        245,
        245,
      ],
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  posicaoY =
    doc.lastAutoTable.finalY +
    10;

  if (!relatorioGeral) {
    posicaoY =
      adicionarTituloSecao(
        '6. RESUMO DAS TRANSFERÊNCIAS DA UNIDADE',
        'Separa as transferências recebidas e enviadas pela unidade selecionada no período filtrado.',
        posicaoY,
        [30, 64, 175]
      );

    autoTable(doc, {
      startY: posicaoY,

      head: [
        [
          'Tipo',
          'Quantidade total',
          'Peso total',
        ],
      ],

      body: [
        [
          'Recebidas',
          formatarNumero(
            resumo?.totalTransferenciaRecebidaUnidades
          ),
          `${formatarNumero(
            resumo?.totalTransferenciaRecebidaKg
          )} kg`,
        ],
        [
          'Enviadas',
          formatarNumero(
            resumo?.totalTransferenciaEnviadaUnidades
          ),
          `${formatarNumero(
            resumo?.totalTransferenciaEnviadaKg
          )} kg`,
        ],
      ],

      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle',
      },

      headStyles: {
        fillColor: [
          30,
          64,
          175,
        ],
        textColor: [
          255,
          255,
          255,
        ],
        fontStyle: 'bold',
      },

      alternateRowStyles: {
        fillColor: [
          245,
          245,
          245,
        ],
      },

      margin: {
        left: 14,
        right: 14,
      },
    });

    posicaoY =
      doc.lastAutoTable.finalY +
      10;
  }

  posicaoY =
    adicionarTituloSecao(
      relatorioGeral
        ? '6. EXTRAVIOS NO PERÍODO'
        : '7. EXTRAVIOS NO PERÍODO',
      'Mostra perdas, danos, desvios ou baixas justificadas registradas dentro do período filtrado. Este bloco é separado das saídas normais.',
      posicaoY,
      [153, 27, 27]
    );

  autoTable(doc, {
    startY: posicaoY,

    head: relatorioGeral
      ? [
          [
            'Unidade',
            'Data',
            'Produto',
            'Lote',
            'Quantidade extraviada',
            'Peso',
            'Responsável',
            'Justificativa',
          ],
        ]
      : [
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
      !Array.isArray(
        extraviosFiltrados
      ) ||
      extraviosFiltrados.length ===
        0
        ? relatorioGeral
          ? [
              [
                'Nenhum extravio encontrado',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
          : [
              [
                'Nenhum extravio encontrado',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
              ],
            ]
        : extraviosFiltrados.map(
            (extravio) => {
              const linha = [
                formatarData(
                  extravio.dataExtravio ||
                    extravio.dataOperacao
                ),

                extravio.nomeProduto ||
                  obterNomeProduto(
                    extravio.tipoProduto
                  ),

                extravio.lote ||
                  extravio.codigoLote ||
                  '-',

                formatarNumero(
                  extravio.quantidadeExtraviada ??
                    extravio.quantidadeUnidades
                ),

                `${formatarNumero(
                  extravio.pesoExtraviadoKg ??
                    extravio.pesoMovimentadoKg
                )} kg`,

                extravio.responsavel ||
                  '-',

                extravio.motivo ||
                  '-',
              ];

              if (
                relatorioGeral
              ) {
                return [
                  obterUnidadeRegistro(
                    extravio
                  ),
                  ...linha,
                ];
              }

              return linha;
            }
          ),

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },

    headStyles: {
      fillColor: [
        153,
        27,
        27,
      ],
      textColor: [
        255,
        255,
        255,
      ],
      fontStyle: 'bold',
    },

    alternateRowStyles: {
      fillColor: [
        245,
        245,
        245,
      ],
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  adicionarRodapes();

  const unidadeArquivo =
    String(
      unidadeRelatorio ||
        unidadeUsuario
    )
      .replace(
        /[^\wÀ-ÿ\s-]/g,
        ''
      )
      .replace(
        /\s+/g,
        '-'
      )
      .toLowerCase();

  const nomeArquivo =
    `relatorio-feno-racao-${unidadeArquivo}-${dataAtual.replace(
      /\//g,
      '-'
    )}.pdf`;

  await salvarAbrirOuCompartilharPdf(
    doc,
    nomeArquivo,
    acao
  );
};

export const ACAO_RELATORIO_PDF = ACAO_PDF;