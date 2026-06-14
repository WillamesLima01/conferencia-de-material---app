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

const PRODUTOS = [
  {
    valor: 'FENO',
    nome: 'Feno',
    unidade: 'fardo',
    unidadePlural: 'fardos',
  },
  {
    valor: 'RACAO_ADULTO',
    nome: 'Ração Adulto',
    unidade: 'saco',
    unidadePlural: 'sacos',
  },
  {
    valor: 'RACAO_POTRO',
    nome: 'Ração Potro',
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

    return Array.isArray(dadosConvertidos)
      ? dadosConvertidos
      : [];
  } catch {
    return [];
  }
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
      `${usuario?.postGrad || ''} ${usuario?.nome || ''}`.trim()
  );

  const [observacao, setObservacao] = useState('');

  const [mensagem, setMensagem] = useState('');
  const [entradaParaExcluir, setEntradaParaExcluir] = useState(null);

  const produtoSelecionado = useMemo(() => {
    return (
      PRODUTOS.find(
        (produto) => produto.valor === tipoProduto
      ) || null
    );
  }, [tipoProduto]);

  const pesosCadastrados = useMemo(() => {
    if (!tipoProduto) return [];

    const pesos = entradas
      .filter(
        (entrada) => entrada.tipoProduto === tipoProduto
      )
      .map((entrada) => Number(entrada.pesoUnidadeKg))
      .filter(
        (peso) => Number.isFinite(peso) && peso > 0
      );

    return [...new Set(pesos)].sort((a, b) => a - b);
  }, [entradas, tipoProduto]);

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
      const entradasAtualizadas = [
        novaEntrada,
        ...entradasAtuais,
      ];

      localStorage.setItem(
        STORAGE_KEY_ENTRADAS,
        JSON.stringify(entradasAtualizadas)
      );

      return entradasAtualizadas;
    });
  };

  const excluirEntrada = (idEntrada) => {
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
      mostrarMensagem(
        'Selecione ou cadastre o peso por unidade.'
      );
      return;
    }

    if (
      !Number.isFinite(pesoUtilizado) ||
      pesoUtilizado <= 0
    ) {
      mostrarMensagem('Informe um peso válido.');
      return;
    }

    if (
      !Number.isFinite(quantidadeNumerica) ||
      quantidadeNumerica <= 0
    ) {
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

    const novaEntrada = {
      id: gerarId(),
      tipoProduto: produtoSelecionado.valor,
      nomeProduto: produtoSelecionado.nome,
      unidadeControle:
        produtoSelecionado.unidade.toUpperCase(),
      pesoUnidadeKg: pesoUtilizado,
      quantidadeEntrada: quantidadeNumerica,
      quantidadeAtual: quantidadeNumerica,
      pesoTotalKg,
      dataEntrada,
      fornecedor: fornecedor.trim(),
      lote: lote.trim(),
      validade,
      responsavel: responsavel.trim(),
      observacao: observacao.trim(),
      unidade:
        usuario?.unidade ||
        usuario?.UNIDADE ||
        'RPMont',
      dataCadastro: new Date().toISOString(),
      userModificador:
        usuario?.id || usuario?.ID || 1,
    };

    salvarNovaEntrada(novaEntrada);
    limparFormulario();

    mostrarMensagem(
      `${produtoSelecionado.nome} cadastrado com sucesso.`
    );
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

    if (tipo === 'RACAO_POTRO') {
      return 'icone-racao-potro';
    }

    return 'icone-racao-adulto';
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
              {usuario?.unidade ||
                usuario?.UNIDADE ||
                'Controle de estoque'}
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
              Registre cada entrada de acordo com o
              produto, peso e quantidade recebida.
            </p>
          </div>
        </section>

        {mensagem && (
          <div className="cadastro-alimentacao-mensagem">
            {mensagem}
          </div>
        )}

        <section className="cadastro-alimentacao-card">
          <div className="cadastro-alimentacao-card-titulo">
            <FaPlus />

            <div>
              <h2>Nova entrada</h2>
              <p>Informe os dados recebidos no estoque.</p>
            </div>
          </div>

          <form
            className="cadastro-alimentacao-form"
            onSubmit={handleSalvar}
          >
            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="tipoProduto">Produto</label>

              <select
                id="tipoProduto"
                value={tipoProduto}
                onChange={handleProdutoChange}
              >
                <option value="">
                  Selecione o produto
                </option>

                {PRODUTOS.map((produto) => (
                  <option
                    key={produto.valor}
                    value={produto.valor}
                  >
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="pesoUnidade">
                Peso por{' '}
                {produtoSelecionado?.unidade ||
                  'unidade'}
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

                <option value="NOVO">
                  + Cadastrar novo peso
                </option>
              </select>
            </div>

            {usandoNovoPeso && (
              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="novoPeso">
                  Novo peso em quilogramas
                </label>

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
                Quantidade de{' '}
                {produtoSelecionado?.unidadePlural ||
                  'unidades'}
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
                    ? `${formatarNumero(
                        pesoUtilizado
                      )} kg`
                    : '0 kg'}
                </strong>
              </div>

              <div>
                <span>Quantidade</span>

                <strong>
                  {quantidadeNumerica > 0
                    ? `${formatarNumero(
                        quantidadeNumerica
                      )} ${
                        produtoSelecionado?.unidadePlural ||
                        'unidades'
                      }`
                    : '0'}
                </strong>
              </div>

              <div className="cadastro-alimentacao-resumo-total">
                <span>Peso total recebido</span>

                <strong>
                  {formatarNumero(pesoTotalKg)} kg
                </strong>
              </div>
            </div>

            <div className="cadastro-alimentacao-grid">
              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="dataEntrada">
                  Data da entrada
                </label>

                <input
                  id="dataEntrada"
                  type="date"
                  value={dataEntrada}
                  onChange={(event) =>
                    setDataEntrada(event.target.value)
                  }
                />
              </div>

              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="validade">
                  Validade
                </label>

                <input
                  id="validade"
                  type="date"
                  value={validade}
                  onChange={(event) =>
                    setValidade(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="cadastro-alimentacao-grid">
              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="fornecedor">
                  Fornecedor
                </label>

                <input
                  id="fornecedor"
                  type="text"
                  value={fornecedor}
                  placeholder="Nome do fornecedor"
                  onChange={(event) =>
                    setFornecedor(event.target.value)
                  }
                />
              </div>

              <div className="cadastro-alimentacao-form-group">
                <label htmlFor="lote">Lote</label>

                <input
                  id="lote"
                  type="text"
                  value={lote}
                  placeholder="Número do lote"
                  onChange={(event) =>
                    setLote(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="responsavel">
                Responsável
              </label>

              <input
                id="responsavel"
                type="text"
                value={responsavel}
                placeholder="Responsável pelo recebimento"
                onChange={(event) =>
                  setResponsavel(event.target.value)
                }
              />
            </div>

            <div className="cadastro-alimentacao-form-group">
              <label htmlFor="observacao">
                Observação
              </label>

              <textarea
                id="observacao"
                value={observacao}
                placeholder="Informações adicionais sobre a entrada"
                onChange={(event) =>
                  setObservacao(event.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="cadastro-alimentacao-salvar"
            >
              <FaPlus />
              Cadastrar entrada
            </button>
          </form>
        </section>

        <section className="cadastro-alimentacao-card">
          <div className="cadastro-alimentacao-lista-header">
            <div>
              <span>Estoque registrado</span>
              <h2>Entradas cadastradas</h2>
            </div>

            <strong>{entradas.length}</strong>
          </div>

          {entradas.length === 0 ? (
            <div className="cadastro-alimentacao-vazio">
              <FaBoxesStacked />
              <p>Nenhuma entrada cadastrada.</p>
            </div>
          ) : (
            <div className="cadastro-alimentacao-lista">
              {entradas.map((entrada) => {
                const produto = PRODUTOS.find(
                  (item) =>
                    item.valor === entrada.tipoProduto
                );

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
                      {renderizarIconeProduto(
                        entrada.tipoProduto
                      )}
                    </div>

                    <div className="cadastro-alimentacao-item-info">
                      <span>{entrada.nomeProduto}</span>

                      <h3>
                        {formatarNumero(
                          entrada.quantidadeEntrada
                        )}{' '}
                        {produto?.unidadePlural ||
                          'unidades'}{' '}
                        de{' '}
                        {formatarNumero(
                          entrada.pesoUnidadeKg
                        )}{' '}
                        kg
                      </h3>

                      <p>
                        Peso total:{' '}
                        <strong>
                          {formatarNumero(
                            entrada.pesoTotalKg
                          )}{' '}
                          kg
                        </strong>
                      </p>

                      <div className="cadastro-alimentacao-item-detalhes">
                        <span>
                          <FaCalendarDays />
                          {formatarData(
                            entrada.dataEntrada
                          )}
                        </span>

                        {entrada.lote && (
                          <span>
                            Lote: {entrada.lote}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cadastro-alimentacao-excluir"
                      onClick={() =>
                        setEntradaParaExcluir(entrada)
                      }
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

        {entradaParaExcluir && (
          <div className="cadastro-alimentacao-modal-overlay">
            <div className="cadastro-alimentacao-modal">
              <div className="cadastro-alimentacao-modal-icon">
                <FaTriangleExclamation />
              </div>

              <h2>Excluir entrada?</h2>

              <p>
                Deseja excluir o registro de{' '}
                <strong>
                  {entradaParaExcluir.nomeProduto}
                </strong>
                ?
              </p>

              <div className="cadastro-alimentacao-modal-resumo">
                <span>Quantidade</span>

                <strong>
                  {formatarNumero(
                    entradaParaExcluir.quantidadeEntrada
                  )}{' '}
                  unidades
                </strong>

                <span>Peso por unidade</span>

                <strong>
                  {formatarNumero(
                    entradaParaExcluir.pesoUnidadeKg
                  )}{' '}
                  kg
                </strong>

                <span>Peso total</span>

                <strong>
                  {formatarNumero(
                    entradaParaExcluir.pesoTotalKg
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
                  onClick={() =>
                    setEntradaParaExcluir(null)
                  }
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