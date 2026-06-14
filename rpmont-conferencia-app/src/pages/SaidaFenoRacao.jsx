import { useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBoxesStacked,
  FaCalendarDays,
  FaHorse,
  FaMinus,
  FaTrashCan,
  FaTriangleExclamation,
  FaWheatAwn,
  FaXmark,
} from 'react-icons/fa6';
import { GiGrain } from 'react-icons/gi';

import '../styles/SaidaFenoRacao.css';

const STORAGE_KEY_ENTRADAS = 'entradasAlimentacaoEquina';
const STORAGE_KEY_SAIDAS = 'saidasAlimentacaoEquina';

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

const dataHoje = () => new Date().toISOString().slice(0, 10);

const carregarStorage = (chave) => {
  const dadosSalvos = localStorage.getItem(chave);

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

function SaidaFenoRacao({ usuario, onVoltar }) {
  const [entradas, setEntradas] = useState(() =>
    carregarStorage(STORAGE_KEY_ENTRADAS)
  );

  const [saidas, setSaidas] = useState(() =>
    carregarStorage(STORAGE_KEY_SAIDAS)
  );

  const [tipoProduto, setTipoProduto] = useState('');
  const [estoqueSelecionadoId, setEstoqueSelecionadoId] = useState('');
  const [quantidadeNecessariaKg, setQuantidadeNecessariaKg] = useState('');
  const [dataSaida, setDataSaida] = useState(dataHoje());
  const [servico, setServico] = useState('Serviço de 24 horas');

  const [responsavel, setResponsavel] = useState(
    usuario?.nomeExibicao ||
      `${usuario?.postGrad || ''} ${usuario?.nome || ''}`.trim()
  );

  const [observacao, setObservacao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [saidaParaExcluir, setSaidaParaExcluir] = useState(null);

  const produtoSelecionado = useMemo(() => {
    return (
      PRODUTOS.find((produto) => produto.valor === tipoProduto) ||
      null
    );
  }, [tipoProduto]);

  const estoquesDoProduto = useMemo(() => {
    if (!tipoProduto) return [];

    return entradas
      .filter(
        (entrada) =>
          entrada.tipoProduto === tipoProduto &&
          Number(entrada.quantidadeAtual) > 0
      )
      .sort((a, b) => {
        const dataA = new Date(a.dataEntrada || 0).getTime();
        const dataB = new Date(b.dataEntrada || 0).getTime();

        return dataA - dataB;
      });
  }, [entradas, tipoProduto]);

  const estoqueSelecionado = useMemo(() => {
    return (
      entradas.find(
        (entrada) => String(entrada.id) === estoqueSelecionadoId
      ) || null
    );
  }, [entradas, estoqueSelecionadoId]);

  const pesoUnidadeKg = Number(
    estoqueSelecionado?.pesoUnidadeKg || 0
  );

  const quantidadeDisponivel = Number(
    estoqueSelecionado?.quantidadeAtual || 0
  );

  const quantidadeNecessariaNumerica = Number(
    quantidadeNecessariaKg
  );

  const unidadesCalculadas =
    pesoUnidadeKg > 0 && quantidadeNecessariaNumerica > 0
      ? Math.ceil(
          quantidadeNecessariaNumerica / pesoUnidadeKg
        )
      : 0;

  const pesoLiberadoKg = unidadesCalculadas * pesoUnidadeKg;

  const sobraCalculadaKg =
    pesoLiberadoKg > quantidadeNecessariaNumerica
      ? pesoLiberadoKg - quantidadeNecessariaNumerica
      : 0;

  const saldoAposSaida =
    quantidadeDisponivel - unidadesCalculadas;

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    window.setTimeout(() => {
      setMensagem('');
    }, 3500);
  };

  const salvarEntradas = (novaLista) => {
    setEntradas(novaLista);

    localStorage.setItem(
      STORAGE_KEY_ENTRADAS,
      JSON.stringify(novaLista)
    );
  };

  const salvarSaidas = (novaLista) => {
    setSaidas(novaLista);

    localStorage.setItem(
      STORAGE_KEY_SAIDAS,
      JSON.stringify(novaLista)
    );
  };

  const limparFormulario = () => {
    setTipoProduto('');
    setEstoqueSelecionadoId('');
    setQuantidadeNecessariaKg('');
    setDataSaida(dataHoje());
    setServico('Serviço de 24 horas');
    setObservacao('');
  };

  const handleProdutoChange = (event) => {
    setTipoProduto(event.target.value);
    setEstoqueSelecionadoId('');
    setQuantidadeNecessariaKg('');
    setMensagem('');
  };

  const handleRegistrarSaida = (event) => {
    event.preventDefault();

    if (!produtoSelecionado) {
      mostrarMensagem('Selecione o produto.');
      return;
    }

    if (!estoqueSelecionado) {
      mostrarMensagem('Selecione o estoque que será utilizado.');
      return;
    }

    if (
      !Number.isFinite(quantidadeNecessariaNumerica) ||
      quantidadeNecessariaNumerica <= 0
    ) {
      mostrarMensagem(
        'Informe a quantidade necessária em quilogramas.'
      );
      return;
    }

    if (unidadesCalculadas <= 0) {
      mostrarMensagem('Não foi possível calcular a saída.');
      return;
    }

    if (unidadesCalculadas > quantidadeDisponivel) {
      mostrarMensagem(
        `Estoque insuficiente. Disponível: ${quantidadeDisponivel} ${
          produtoSelecionado.unidadePlural
        }.`
      );
      return;
    }

    if (!dataSaida) {
      mostrarMensagem('Informe a data da saída.');
      return;
    }

    if (!responsavel.trim()) {
      mostrarMensagem('Informe o responsável pela retirada.');
      return;
    }

    const novaSaida = {
      id: gerarId(),
      entradaId: estoqueSelecionado.id,
      tipoProduto: produtoSelecionado.valor,
      nomeProduto: produtoSelecionado.nome,
      unidadeControle:
        produtoSelecionado.unidade.toUpperCase(),
      pesoUnidadeKg,
      quantidadeRetirada: unidadesCalculadas,
      quantidadeNecessariaKg:
        quantidadeNecessariaNumerica,
      pesoLiberadoKg,
      sobraCalculadaKg,
      saldoAnterior: quantidadeDisponivel,
      saldoPosterior: saldoAposSaida,
      dataSaida,
      servico: servico.trim(),
      lote: estoqueSelecionado.lote || '',
      fornecedor: estoqueSelecionado.fornecedor || '',
      responsavel: responsavel.trim(),
      observacao: observacao.trim(),
      unidade:
        usuario?.unidade ||
        usuario?.UNIDADE ||
        estoqueSelecionado.unidade ||
        'RPMont',
      dataCadastro: new Date().toISOString(),
      userModificador:
        usuario?.id || usuario?.ID || 1,
    };

    const entradasAtualizadas = entradas.map((entrada) =>
      entrada.id === estoqueSelecionado.id
        ? {
            ...entrada,
            quantidadeAtual:
              Number(entrada.quantidadeAtual) -
              unidadesCalculadas,
            pesoAtualKg:
              (Number(entrada.quantidadeAtual) -
                unidadesCalculadas) *
              Number(entrada.pesoUnidadeKg),
            dataModificacao: new Date().toISOString(),
            userModificador:
              usuario?.id || usuario?.ID || 1,
          }
        : entrada
    );

    salvarEntradas(entradasAtualizadas);
    salvarSaidas([novaSaida, ...saidas]);

    limparFormulario();

    mostrarMensagem(
      `${unidadesCalculadas} ${
        produtoSelecionado.unidadePlural
      } de ${produtoSelecionado.nome} retirado(s) com sucesso.`
    );
  };

  const confirmarExclusaoSaida = () => {
    if (!saidaParaExcluir) return;

    const entradasAtualizadas = entradas.map((entrada) =>
      entrada.id === saidaParaExcluir.entradaId
        ? {
            ...entrada,
            quantidadeAtual:
              Number(entrada.quantidadeAtual) +
              Number(saidaParaExcluir.quantidadeRetirada),
            pesoAtualKg:
              (Number(entrada.quantidadeAtual) +
                Number(
                  saidaParaExcluir.quantidadeRetirada
                )) *
              Number(entrada.pesoUnidadeKg),
            dataModificacao: new Date().toISOString(),
          }
        : entrada
    );

    const saidasAtualizadas = saidas.filter(
      (saida) => saida.id !== saidaParaExcluir.id
    );

    salvarEntradas(entradasAtualizadas);
    salvarSaidas(saidasAtualizadas);

    setSaidaParaExcluir(null);

    mostrarMensagem(
      'Saída cancelada e quantidade devolvida ao estoque.'
    );
  };

  const renderizarIconeProduto = (tipo) => {
    if (tipo === 'FENO') {
      return <FaWheatAwn />;
    }

    return <GiGrain />;
  };

  const obterClasseProduto = (tipo) => {
    if (tipo === 'FENO') return 'saida-icone-feno';

    if (tipo === 'RACAO_POTRO') {
      return 'saida-icone-racao-potro';
    }

    return 'saida-icone-racao-adulto';
  };

  return (
    <main className="saida-alimentacao-page">
      <section className="saida-alimentacao-phone">
        <header className="saida-alimentacao-header">
          <button
            type="button"
            className="saida-alimentacao-voltar"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Alimentação equina</span>
            <h1>Saída de Feno e Ração</h1>
            <p>
              {usuario?.unidade ||
                usuario?.UNIDADE ||
                'Controle de estoque'}
            </p>
          </div>
        </header>

        <section className="saida-alimentacao-apresentacao">
          <div className="saida-alimentacao-apresentacao-icon">
            <FaHorse />
          </div>

          <div>
            <span>Serviço operacional</span>
            <h2>Retirada para serviço</h2>
            <p>
              Calcule e registre a quantidade necessária para o
              serviço de 24 horas.
            </p>
          </div>
        </section>

        {mensagem && (
          <div className="saida-alimentacao-mensagem">
            {mensagem}
          </div>
        )}

        <section className="saida-alimentacao-card">
          <div className="saida-alimentacao-card-titulo">
            <FaMinus />

            <div>
              <h2>Nova saída</h2>
              <p>Selecione o produto e o estoque utilizado.</p>
            </div>
          </div>

          <form
            className="saida-alimentacao-form"
            onSubmit={handleRegistrarSaida}
          >
            <div className="saida-alimentacao-form-group">
              <label htmlFor="saidaProduto">Produto</label>

              <select
                id="saidaProduto"
                value={tipoProduto}
                onChange={handleProdutoChange}
              >
                <option value="">Selecione o produto</option>

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

            <div className="saida-alimentacao-form-group">
              <label htmlFor="saidaEstoque">
                Peso e estoque disponível
              </label>

              <select
                id="saidaEstoque"
                value={estoqueSelecionadoId}
                disabled={!tipoProduto}
                onChange={(event) => {
                  setEstoqueSelecionadoId(
                    event.target.value
                  );
                  setQuantidadeNecessariaKg('');
                  setMensagem('');
                }}
              >
                <option value="">
                  {!tipoProduto
                    ? 'Selecione o produto primeiro'
                    : estoquesDoProduto.length === 0
                      ? 'Nenhum estoque disponível'
                      : 'Selecione o estoque'}
                </option>

                {estoquesDoProduto.map((entrada) => (
                  <option
                    key={entrada.id}
                    value={entrada.id}
                  >
                    {formatarNumero(
                      entrada.pesoUnidadeKg
                    )}{' '}
                    kg — {entrada.quantidadeAtual}{' '}
                    {produtoSelecionado?.unidadePlural}
                    {entrada.lote
                      ? ` — Lote ${entrada.lote}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {estoqueSelecionado && (
              <div className="saida-alimentacao-estoque-info">
                <div>
                  <span>Peso por unidade</span>
                  <strong>
                    {formatarNumero(pesoUnidadeKg)} kg
                  </strong>
                </div>

                <div>
                  <span>Saldo disponível</span>
                  <strong>
                    {formatarNumero(
                      quantidadeDisponivel
                    )}{' '}
                    {produtoSelecionado?.unidadePlural}
                  </strong>
                </div>

                <div>
                  <span>Peso disponível</span>
                  <strong>
                    {formatarNumero(
                      quantidadeDisponivel *
                        pesoUnidadeKg
                    )}{' '}
                    kg
                  </strong>
                </div>
              </div>
            )}

            <div className="saida-alimentacao-form-group">
              <label htmlFor="quantidadeNecessariaKg">
                Quantidade necessária para o serviço
              </label>

              <div className="saida-alimentacao-input-unidade">
                <input
                  id="quantidadeNecessariaKg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={quantidadeNecessariaKg}
                  disabled={!estoqueSelecionado}
                  placeholder="Ex.: 250"
                  onChange={(event) => {
                    setQuantidadeNecessariaKg(
                      event.target.value
                    );
                    setMensagem('');
                  }}
                />

                <span>kg</span>
              </div>
            </div>

            <div className="saida-alimentacao-calculo">
              <div>
                <span>Quantidade necessária</span>
                <strong>
                  {formatarNumero(
                    quantidadeNecessariaNumerica
                  )}{' '}
                  kg
                </strong>
              </div>

              <div>
                <span>
                  {produtoSelecionado?.unidadePlural ||
                    'Unidades'}{' '}
                  calculados
                </span>

                <strong>
                  {formatarNumero(unidadesCalculadas)}
                </strong>
              </div>

              <div>
                <span>Peso liberado</span>
                <strong>
                  {formatarNumero(pesoLiberadoKg)} kg
                </strong>
              </div>

              <div>
                <span>Sobra calculada</span>
                <strong>
                  {formatarNumero(sobraCalculadaKg)} kg
                </strong>
              </div>

              <div className="saida-alimentacao-calculo-saldo">
                <span>Saldo após a retirada</span>

                <strong
                  className={
                    saldoAposSaida < 0
                      ? 'saldo-insuficiente'
                      : ''
                  }
                >
                  {formatarNumero(
                    Math.max(saldoAposSaida, 0)
                  )}{' '}
                  {produtoSelecionado?.unidadePlural ||
                    'unidades'}
                </strong>
              </div>
            </div>

            <div className="saida-alimentacao-grid">
              <div className="saida-alimentacao-form-group">
                <label htmlFor="dataSaida">
                  Data da saída
                </label>

                <input
                  id="dataSaida"
                  type="date"
                  value={dataSaida}
                  onChange={(event) =>
                    setDataSaida(event.target.value)
                  }
                />
              </div>

              <div className="saida-alimentacao-form-group">
                <label htmlFor="servico">
                  Serviço
                </label>

                <input
                  id="servico"
                  type="text"
                  value={servico}
                  onChange={(event) =>
                    setServico(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="saida-alimentacao-form-group">
              <label htmlFor="responsavelSaida">
                Responsável pela retirada
              </label>

              <input
                id="responsavelSaida"
                type="text"
                value={responsavel}
                onChange={(event) =>
                  setResponsavel(event.target.value)
                }
              />
            </div>

            <div className="saida-alimentacao-form-group">
              <label htmlFor="observacaoSaida">
                Observação
              </label>

              <textarea
                id="observacaoSaida"
                value={observacao}
                placeholder="Informações adicionais sobre a retirada"
                onChange={(event) =>
                  setObservacao(event.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="saida-alimentacao-salvar"
            >
              <FaMinus />
              Registrar saída
            </button>
          </form>
        </section>

        <section className="saida-alimentacao-card">
          <div className="saida-alimentacao-lista-header">
            <div>
              <span>Movimentações</span>
              <h2>Saídas registradas</h2>
            </div>

            <strong>{saidas.length}</strong>
          </div>

          {saidas.length === 0 ? (
            <div className="saida-alimentacao-vazio">
              <FaBoxesStacked />
              <p>Nenhuma saída registrada.</p>
            </div>
          ) : (
            <div className="saida-alimentacao-lista">
              {saidas.map((saida) => {
                const produto = PRODUTOS.find(
                  (item) =>
                    item.valor === saida.tipoProduto
                );

                return (
                  <article
                    key={saida.id}
                    className="saida-alimentacao-item"
                  >
                    <div
                      className={`saida-alimentacao-item-icon ${obterClasseProduto(
                        saida.tipoProduto
                      )}`}
                    >
                      {renderizarIconeProduto(
                        saida.tipoProduto
                      )}
                    </div>

                    <div className="saida-alimentacao-item-info">
                      <span>{saida.nomeProduto}</span>

                      <h3>
                        {formatarNumero(
                          saida.quantidadeRetirada
                        )}{' '}
                        {produto?.unidadePlural ||
                          'unidades'}{' '}
                        de{' '}
                        {formatarNumero(
                          saida.pesoUnidadeKg
                        )}{' '}
                        kg
                      </h3>

                      <p>
                        Necessário:{' '}
                        <strong>
                          {formatarNumero(
                            saida.quantidadeNecessariaKg
                          )}{' '}
                          kg
                        </strong>
                      </p>

                      <p>
                        Liberado:{' '}
                        <strong>
                          {formatarNumero(
                            saida.pesoLiberadoKg
                          )}{' '}
                          kg
                        </strong>
                      </p>

                      <div className="saida-alimentacao-item-detalhes">
                        <span>
                          <FaCalendarDays />
                          {formatarData(saida.dataSaida)}
                        </span>

                        {saida.lote && (
                          <span>Lote: {saida.lote}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="saida-alimentacao-excluir"
                      onClick={() =>
                        setSaidaParaExcluir(saida)
                      }
                      aria-label="Cancelar saída"
                    >
                      <FaTrashCan />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {saidaParaExcluir && (
          <div className="saida-alimentacao-modal-overlay">
            <div className="saida-alimentacao-modal">
              <div className="saida-alimentacao-modal-icon">
                <FaTriangleExclamation />
              </div>

              <h2>Cancelar saída?</h2>

              <p>
                A quantidade retirada será devolvida ao estoque de{' '}
                <strong>
                  {saidaParaExcluir.nomeProduto}
                </strong>
                .
              </p>

              <div className="saida-alimentacao-modal-resumo">
                <span>Quantidade retirada</span>
                <strong>
                  {formatarNumero(
                    saidaParaExcluir.quantidadeRetirada
                  )}{' '}
                  unidades
                </strong>

                <span>Peso por unidade</span>
                <strong>
                  {formatarNumero(
                    saidaParaExcluir.pesoUnidadeKg
                  )}{' '}
                  kg
                </strong>

                <span>Peso liberado</span>
                <strong>
                  {formatarNumero(
                    saidaParaExcluir.pesoLiberadoKg
                  )}{' '}
                  kg
                </strong>
              </div>

              <div className="saida-alimentacao-modal-actions">
                <button
                  type="button"
                  className="saida-alimentacao-confirmar-exclusao"
                  onClick={confirmarExclusaoSaida}
                >
                  <FaTrashCan />
                  Cancelar saída
                </button>

                <button
                  type="button"
                  className="saida-alimentacao-cancelar-exclusao"
                  onClick={() =>
                    setSaidaParaExcluir(null)
                  }
                >
                  <FaXmark />
                  Manter registro
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default SaidaFenoRacao;