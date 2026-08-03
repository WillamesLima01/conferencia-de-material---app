import { useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBoxesStacked,
  FaCalendarDays,
  FaHorse,
  FaPlus,
  FaTrashCan,
  FaTriangleExclamation,
  FaWheatAwn,
  FaXmark,
} from 'react-icons/fa6';

import { GiGrain } from 'react-icons/gi';

import '../styles/CadastroFenoRacao.css';

const STORAGE_KEY_ENTRADAS = 'entradasAlimentacaoEquina';

const NIVEIS_USUARIO = {
  ADMIN_MASTER: 1,
  ADMIN: 2,
  USUARIO_COMUM: 3,
};

const PRODUTOS = [
  {
    valor: 'FENO',
    nome: 'Feno',
    unidade: 'fardo',
    unidadePlural: 'fardos',
  },
  {
    valor: 'RACAO_ADULTO_PREMIUM',
    nome: 'Ração Adulto Premium',
    unidade: 'saco',
    unidadePlural: 'sacos',
  },
  {
    valor: 'RACAO_ADULTO_MANUTENCAO',
    nome: 'Ração Adulto Manutenção',
    unidade: 'saco',
    unidadePlural: 'sacos',
  },
  {
    valor: 'RACAO_POTRO_PREMIUM',
    nome: 'Ração Potro Premium',
    unidade: 'saco',
    unidadePlural: 'sacos',
  },
  {
    valor: 'RACAO_POTRO_MANUTENCAO',
    nome: 'Ração Potro Manutenção',
    unidade: 'saco',
    unidadePlural: 'sacos',
  },
];

const gerarId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const dataHoje = () => {
  return new Date().toISOString().slice(0, 10);
};

const carregarEntradas = () => {
  const dadosSalvos = localStorage.getItem(STORAGE_KEY_ENTRADAS);

  if (!dadosSalvos) return [];

  try {
    const dadosConvertidos = JSON.parse(dadosSalvos);

    return Array.isArray(dadosConvertidos) ? dadosConvertidos : [];
  } catch {
    return [];
  }
};

const normalizarTexto = (valor) => {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/º/g, '')
    .replace(/°/g, '')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
};

const obterUnidadeUsuario = (usuario) => {
  return usuario?.unidade ?? usuario?.UNIDADE ?? 'RPMont';
};

const obterNivelUsuario = (usuario) => {
  return Number(
    usuario?.nivel ??
      usuario?.NIVEL ??
      usuario?.nivelAcesso ??
      usuario?.NIVEL_ACESSO ??
      NIVEIS_USUARIO.USUARIO_COMUM
  );
};

const usuarioEhAdminMaster = (usuario) => {
  return obterNivelUsuario(usuario) === NIVEIS_USUARIO.ADMIN_MASTER;
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

function CadastroFenoRacao({ usuario, onVoltar }) {
  const [entradas, setEntradas] = useState(carregarEntradas);

  const [tipoProduto, setTipoProduto] = useState('');
  const [pesoSelecionado, setPesoSelecionado] = useState('');
  const [novoPeso, setNovoPeso] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [dataEntrada, setDataEntrada] = useState(dataHoje());
  const [fornecedor, setFornecedor] = useState('');
  const [lote, setLote] = useState('');
  const [validade, setValidade] = useState('');

  const [responsavel, setResponsavel] = useState(
    usuario?.nomeExibicao ||
      `${usuario?.postGrad || usuario?.POSTGRAD || ''} ${
        usuario?.nome || usuario?.NOME || ''
      }`.trim()
  );

  const [observacao, setObservacao] = useState('');

  const [mensagem, setMensagem] = useState('');
  const [entradaParaExcluir, setEntradaParaExcluir] = useState(null);
  const [entradaCadastrada, setEntradaCadastrada] = useState(null);

  const unidadeUsuario = obterUnidadeUsuario(usuario);
  const adminMaster = usuarioEhAdminMaster(usuario);

  const entradasVisiveis = useMemo(() => {
    if (adminMaster) return entradas;

    return entradas.filter(
      (entrada) =>
        normalizarTexto(entrada.unidade) === normalizarTexto(unidadeUsuario)
    );
  }, [entradas, adminMaster, unidadeUsuario]);

  const produtoSelecionado = useMemo(() => {
    return PRODUTOS.find((produto) => produto.valor === tipoProduto) || null;
  }, [tipoProduto]);

  const pesosCadastrados = useMemo(() => {
    if (!tipoProduto) return [];

    const pesos = entradasVisiveis
      .filter((entrada) => entrada.tipoProduto === tipoProduto)
      .map((entrada) => Number(entrada.pesoUnidadeKg))
      .filter((peso) => Number.isFinite(peso) && peso > 0);

    return [...new Set(pesos)].sort((a, b) => a - b);
  }, [entradasVisiveis, tipoProduto]);

  const usandoNovoPeso = pesoSelecionado === 'NOVO';

  const pesoUtilizado = usandoNovoPeso
    ? Number(novoPeso)
    : Number(pesoSelecionado);

  const quantidadeNumerica = Number(quantidade);

  const pesoTotalKg =
    pesoUtilizado > 0 && quantidadeNumerica > 0
      ? pesoUtilizado * quantidadeNumerica
      : 0;

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    window.setTimeout(() => {
      setMensagem('');
    }, 3000);
  };

  const salvarNovaEntrada = (novaEntrada) => {
    setEntradas((entradasAtuais) => {
      const entradasAtualizadas = [novaEntrada, ...entradasAtuais];

      localStorage.setItem(
        STORAGE_KEY_ENTRADAS,
        JSON.stringify(entradasAtualizadas)
      );

      return entradasAtualizadas;
    });
  };

  const excluirEntrada = (idEntrada) => {
    const entradaEncontrada = entradas.find(
      (entrada) => entrada.id === idEntrada
    );

    if (!entradaEncontrada) return;

    if (
      !adminMaster &&
      normalizarTexto(entradaEncontrada.unidade) !==
        normalizarTexto(unidadeUsuario)
    ) {
      mostrarMensagem(
        'Acesso negado. Você só pode excluir entradas da sua unidade.'
      );
      setEntradaParaExcluir(null);
      return;
    }

    setEntradas((entradasAtuais) => {
      const entradasAtualizadas = entradasAtuais.filter(
        (entrada) => entrada.id !== idEntrada
      );

      localStorage.setItem(
        STORAGE_KEY_ENTRADAS,
        JSON.stringify(entradasAtualizadas)
      );

      return entradasAtualizadas;
    });
  };

  const limparFormulario = () => {
    setTipoProduto('');
    setPesoSelecionado('');
    setNovoPeso('');
    setQuantidade('');
    setDataEntrada(dataHoje());
    setFornecedor('');
    setLote('');
    setValidade('');
    setObservacao('');
  };

  const handleProdutoChange = (event) => {
    setTipoProduto(event.target.value);
    setPesoSelecionado('');
    setNovoPeso('');
    setQuantidade('');
    setMensagem('');
  };

  const handleSalvar = (event) => {
    event.preventDefault();

    if (!produtoSelecionado) {
      mostrarMensagem('Selecione o produto.');
      return;
    }

    if (!pesoSelecionado) {
      mostrarMensagem('Selecione ou cadastre o peso por unidade.');
      return;
    }

    if (!Number.isFinite(pesoUtilizado) || pesoUtilizado <= 0) {
      mostrarMensagem('Informe um peso válido.');
      return;
    }

    if (!Number.isFinite(quantidadeNumerica) || quantidadeNumerica <= 0) {
      mostrarMensagem('Informe uma quantidade válida.');
      return;
    }

    if (!Number.isInteger(quantidadeNumerica)) {
      mostrarMensagem(
        `A quantidade de ${produtoSelecionado.unidadePlural} deve ser inteira.`
      );
      return;
    }

    if (!dataEntrada) {
      mostrarMensagem('Informe a data da entrada.');
      return;
    }

    const loteTratado = lote.trim();

    const novaEntrada = {
      id: gerarId(),
      tipoProduto: produtoSelecionado.valor,
      nomeProduto: produtoSelecionado.nome,
      unidadeControle: produtoSelecionado.unidade.toUpperCase(),
      pesoUnidadeKg: pesoUtilizado,

      quantidadeEntrada: quantidadeNumerica,
      quantidadeInicial: quantidadeNumerica,
      quantidade: quantidadeNumerica,
      quantidadeAtual: quantidadeNumerica,

      pesoTotalKg,
      dataEntrada,
      fornecedor: fornecedor.trim(),
      lote: loteTratado,
      validade,
      responsavel: responsavel.trim(),
      observacao: observacao.trim(),
      unidade: unidadeUsuario,
      dataCadastro: new Date().toISOString(),
      userModificador: usuario?.id || usuario?.ID || 1,
    };

    salvarNovaEntrada(novaEntrada);
    limparFormulario();
    setEntradaCadastrada(novaEntrada);
  };

  const confirmarExclusao = () => {
    if (!entradaParaExcluir) return;

    excluirEntrada(entradaParaExcluir.id);
    setEntradaParaExcluir(null);

    mostrarMensagem('Entrada excluída com sucesso.');
  };

  const renderizarIconeProduto = (tipo) => {
    if (tipo === 'FENO') {
      return <FaWheatAwn />;
    }

    return <GiGrain />;
  };

  const obterClasseIconeProduto = (tipo) => {
    if (tipo === 'FENO') {
      return 'icone-feno';
    }
  
    if (
      tipo === 'RACAO_POTRO_PREMIUM' ||
      tipo === 'RACAO_POTRO_MANUTENCAO'
    ) {
      return 'icone-racao-potro';
    }
  
    return 'icone-racao-adulto';
  };

  const obterUnidadeProduto = (entrada) => {
    const produto = PRODUTOS.find((item) => item.valor === entrada.tipoProduto);

    return produto?.unidadePlural || 'unidades';
  };

  return (
    <main className="cadastro-alimentacao-page">
      <section className="cadastro-alimentacao-phone">
        <header className="cadastro-alimentacao-header">
          <button
            type="button"
            className="cadastro-alimentacao-voltar"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Alimentação equina</span>
            <h1>Feno e Ração</h1>

            <p>
              {adminMaster
                ? 'Admin Master - Todas as unidades'
                : unidadeUsuario || 'Controle de estoque'}
            </p>
          </div>
        </header>

        <section className="cadastro-alimentacao-apresentacao">
          <div className="cadastro-alimentacao-apresentacao-icon">
            <FaHorse />
          </div>

          <div>
            <span>Entrada de estoque</span>
            <h2>Cadastrar Feno e Ração</h2>

            <p>
              {adminMaster
                ? 'Registre entradas e visualize os estoques de todas as unidades.'
                : `Registre e acompanhe somente as entradas da unidade ${unidadeUsuario}.`}
            </p>
          </div>
        </section>

        {mensagem && (
          <div className="cadastro-alimentacao-mensagem">{mensagem}</div>
        )}

        <section className="cadastro-alimentacao-card">
          <div className="cadastro-alimentacao-card-titulo">
            <FaPlus />

            <div>
              <h2>Nova entrada</h2>
              <p>
                Informe os dados recebidos no estoque da unidade{' '}
                <strong>{unidadeUsuario}</strong>.
              </p>
            </div>
          </div>

          <form className="cadastro-alimentacao-form" onSubmit={handleSalvar}>
            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="tipoProduto">Produto</label>

              <select
                id="tipoProduto"
                value={tipoProduto}
                onChange={handleProdutoChange}
              >
                <option value="">Selecione o produto</option>

                {PRODUTOS.map((produto) => (
                  <option key={produto.valor} value={produto.valor}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="pesoUnidade">
                Peso por {produtoSelecionado?.unidade || 'unidade'}
              </label>

              <select
                id="pesoUnidade"
                value={pesoSelecionado}
                onChange={(event) => {
                  setPesoSelecionado(event.target.value);
                  setNovoPeso('');
                  setMensagem('');
                }}
                disabled={!tipoProduto}
              >
                <option value="">
                  {tipoProduto
                    ? 'Selecione o peso'
                    : 'Selecione o produto primeiro'}
                </option>

                {pesosCadastrados.map((peso) => (
                  <option key={peso} value={peso}>
                    {formatarNumero(peso)} kg
                  </option>
                ))}

                <option value="NOVO">+ Cadastrar novo peso</option>
              </select>
            </div>

            {usandoNovoPeso && (
              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="novoPeso">Novo peso em quilogramas</label>

                <div className="cadastro-alimentacao-input-unidade">
                  <input
                    id="novoPeso"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={novoPeso}
                    placeholder="Ex.: 10"
                    onChange={(event) => {
                      setNovoPeso(event.target.value);
                      setMensagem('');
                    }}
                  />

                  <span>kg</span>
                </div>
              </div>
            )}

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="quantidade">
                Quantidade de {produtoSelecionado?.unidadePlural || 'unidades'}
              </label>

              <input
                id="quantidade"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={quantidade}
                placeholder={
                  produtoSelecionado
                    ? `Ex.: 350 ${produtoSelecionado.unidadePlural}`
                    : 'Informe a quantidade'
                }
                onChange={(event) => {
                  setQuantidade(event.target.value);
                  setMensagem('');
                }}
                disabled={!tipoProduto}
              />
            </div>

            <div className="cadastro-alimentacao-resumo">
              <div>
                <span>Peso por unidade</span>

                <strong>
                  {pesoUtilizado > 0
                    ? `${formatarNumero(pesoUtilizado)} kg`
                    : '0 kg'}
                </strong>
              </div>

              <div>
                <span>Quantidade</span>

                <strong>
                  {quantidadeNumerica > 0
                    ? `${formatarNumero(quantidadeNumerica)} ${
                        produtoSelecionado?.unidadePlural || 'unidades'
                      }`
                    : '0'}
                </strong>
              </div>

              <div className="cadastro-alimentacao-resumo-total">
                <span>Peso total recebido</span>

                <strong>{formatarNumero(pesoTotalKg)} kg</strong>
              </div>
            </div>

            <div className="cadastro-alimentacao-grid">
              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="dataEntrada">Data da entrada</label>

                <input
                  id="dataEntrada"
                  type="date"
                  value={dataEntrada}
                  onChange={(event) => setDataEntrada(event.target.value)}
                />
              </div>

              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="validade">Validade</label>

                <input
                  id="validade"
                  type="date"
                  value={validade}
                  onChange={(event) => setValidade(event.target.value)}
                />
              </div>
            </div>

            <div className="cadastro-alimentacao-grid">
              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="fornecedor">Fornecedor</label>

                <input
                  id="fornecedor"
                  type="text"
                  value={fornecedor}
                  placeholder="Nome do fornecedor"
                  onChange={(event) => setFornecedor(event.target.value)}
                />
              </div>

              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="lote">Lote</label>

                <input
                  id="lote"
                  type="text"
                  value={lote}
                  placeholder="Ex.: Lote 001, NF 1234 ou entrega 16/06"
                  onChange={(event) => setLote(event.target.value)}
                />

                <small className="cadastro-alimentacao-ajuda">
                  O lote identifica a entrada recebida no estoque. Ele ajuda a
                  separar feno de 10 kg, 12 kg, 20 kg ou sacos de ração
                  recebidos em datas diferentes, evitando mistura de saldos e
                  facilitando saídas, extravios e conferência no relatório.
                </small>
              </div>
            </div>

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="responsavel">Responsável</label>

              <input
                id="responsavel"
                type="text"
                value={responsavel}
                placeholder="Responsável pelo recebimento"
                onChange={(event) => setResponsavel(event.target.value)}
              />
            </div>

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="observacao">Observação</label>

              <textarea
                id="observacao"
                value={observacao}
                placeholder="Informações adicionais sobre a entrada"
                onChange={(event) => setObservacao(event.target.value)}
              />
            </div>

            <button type="submit" className="cadastro-alimentacao-salvar">
              <FaPlus />
              Cadastrar entrada
            </button>
          </form>
        </section>

        <section className="cadastro-alimentacao-card">
          <div className="cadastro-alimentacao-lista-header">
            <div>
              <span>Estoque registrado</span>

              <h2>
                {adminMaster
                  ? 'Entradas cadastradas em todas as unidades'
                  : `Entradas cadastradas - ${unidadeUsuario}`}
              </h2>
            </div>

            <strong>{entradasVisiveis.length}</strong>
          </div>

          {entradasVisiveis.length === 0 ? (
            <div className="cadastro-alimentacao-vazio">
              <FaBoxesStacked />
              <p>Nenhuma entrada cadastrada para esta unidade.</p>
            </div>
          ) : (
            <div className="cadastro-alimentacao-lista">
              {entradasVisiveis.map((entrada) => {
                const produto = PRODUTOS.find(
                  (item) => item.valor === entrada.tipoProduto
                );

                const quantidadeExibida =
                  entrada.quantidadeEntrada ||
                  entrada.quantidadeInicial ||
                  entrada.quantidade ||
                  0;

                const pesoTotalExibido =
                  entrada.pesoTotalKg ||
                  Number(quantidadeExibida || 0) *
                    Number(entrada.pesoUnidadeKg || 0);

                return (
                  <article
                    key={entrada.id}
                    className="cadastro-alimentacao-item"
                  >
                    <div
                      className={`cadastro-alimentacao-item-icon ${obterClasseIconeProduto(
                        entrada.tipoProduto
                      )}`}
                    >
                      {renderizarIconeProduto(entrada.tipoProduto)}
                    </div>

                    <div className="cadastro-alimentacao-item-info">
                      <span>{entrada.nomeProduto}</span>

                      <h3>
                        {formatarNumero(quantidadeExibida)}{' '}
                        {produto?.unidadePlural || 'unidades'} de{' '}
                        {formatarNumero(entrada.pesoUnidadeKg)} kg
                      </h3>

                      <p>
                        Peso total:{' '}
                        <strong>{formatarNumero(pesoTotalExibido)} kg</strong>
                      </p>

                      <div className="cadastro-alimentacao-item-detalhes">
                        <span>
                          <FaCalendarDays />
                          {formatarData(entrada.dataEntrada)}
                        </span>

                        {entrada.lote && <span>Lote: {entrada.lote}</span>}

                        {entrada.unidade && <span>{entrada.unidade}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cadastro-alimentacao-excluir"
                      onClick={() => setEntradaParaExcluir(entrada)}
                      aria-label={`Excluir entrada de ${entrada.nomeProduto}`}
                    >
                      <FaTrashCan />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {entradaCadastrada && (
          <div className="cadastro-alimentacao-modal-overlay">
            <div className="cadastro-alimentacao-modal">
              <div className="cadastro-alimentacao-modal-icon">
                <FaBoxesStacked />
              </div>

              <h2>Entrada cadastrada com sucesso!</h2>

              <p>
                O registro de <strong>{entradaCadastrada.nomeProduto}</strong>{' '}
                foi lançado no estoque da unidade{' '}
                <strong>{entradaCadastrada.unidade}</strong>.
              </p>

              <div className="cadastro-alimentacao-modal-resumo">
                <span>Produto</span>
                <strong>{entradaCadastrada.nomeProduto}</strong>

                <span>Unidade</span>
                <strong>{entradaCadastrada.unidade || '-'}</strong>

                <span>Data da entrada</span>
                <strong>{formatarData(entradaCadastrada.dataEntrada)}</strong>

                <span>Quantidade cadastrada</span>
                <strong>
                  {formatarNumero(
                    entradaCadastrada.quantidadeEntrada ||
                      entradaCadastrada.quantidadeInicial ||
                      entradaCadastrada.quantidade ||
                      0
                  )}{' '}
                  {obterUnidadeProduto(entradaCadastrada)}
                </strong>

                <span>Peso por unidade</span>
                <strong>
                  {formatarNumero(entradaCadastrada.pesoUnidadeKg)} kg
                </strong>

                <span>Peso total recebido</span>
                <strong>{formatarNumero(entradaCadastrada.pesoTotalKg)} kg</strong>

                <span>Lote</span>
                <strong>{entradaCadastrada.lote || '-'}</strong>

                <span>Fornecedor</span>
                <strong>{entradaCadastrada.fornecedor || '-'}</strong>

                <span>Validade</span>
                <strong>{formatarData(entradaCadastrada.validade)}</strong>

                <span>Responsável</span>
                <strong>{entradaCadastrada.responsavel || '-'}</strong>
              </div>

              <div className="cadastro-alimentacao-modal-actions">
                <button
                  type="button"
                  className="cadastro-alimentacao-confirmar-exclusao"
                  onClick={() => setEntradaCadastrada(null)}
                >
                  <FaPlus />
                  Cadastrar nova entrada
                </button>

                <button
                  type="button"
                  className="cadastro-alimentacao-cancelar-exclusao"
                  onClick={() => setEntradaCadastrada(null)}
                >
                  <FaXmark />
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {entradaParaExcluir && (
          <div className="cadastro-alimentacao-modal-overlay">
            <div className="cadastro-alimentacao-modal">
              <div className="cadastro-alimentacao-modal-icon">
                <FaTriangleExclamation />
              </div>

              <h2>Excluir entrada?</h2>

              <p>
                Deseja excluir o registro de{' '}
                <strong>{entradaParaExcluir.nomeProduto}</strong>?
              </p>

              <div className="cadastro-alimentacao-modal-resumo">
                <span>Unidade</span>

                <strong>{entradaParaExcluir.unidade || '-'}</strong>

                <span>Quantidade</span>

                <strong>
                  {formatarNumero(
                    entradaParaExcluir.quantidadeEntrada ||
                      entradaParaExcluir.quantidadeInicial ||
                      entradaParaExcluir.quantidade ||
                      0
                  )}{' '}
                  {obterUnidadeProduto(entradaParaExcluir)}
                </strong>

                <span>Peso por unidade</span>

                <strong>
                  {formatarNumero(entradaParaExcluir.pesoUnidadeKg)} kg
                </strong>

                <span>Peso total</span>

                <strong>
                  {formatarNumero(
                    entradaParaExcluir.pesoTotalKg ||
                      Number(
                        entradaParaExcluir.quantidadeEntrada ||
                          entradaParaExcluir.quantidadeInicial ||
                          entradaParaExcluir.quantidade ||
                          0
                      ) * Number(entradaParaExcluir.pesoUnidadeKg || 0)
                  )}{' '}
                  kg
                </strong>
              </div>

              <div className="cadastro-alimentacao-modal-actions">
                <button
                  type="button"
                  className="cadastro-alimentacao-confirmar-exclusao"
                  onClick={confirmarExclusao}
                >
                  <FaTrashCan />
                  Sim, excluir
                </button>

                <button
                  type="button"
                  className="cadastro-alimentacao-cancelar-exclusao"
                  onClick={() => setEntradaParaExcluir(null)}
                >
                  <FaXmark />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default CadastroFenoRacao;