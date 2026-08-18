import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  FaArrowLeft,
  FaBoxesStacked,
  FaCalendarDays,
  FaCircleCheck,
  FaClockRotateLeft,
  FaFloppyDisk,
  FaTriangleExclamation,
} from 'react-icons/fa6';

import {
  listarEstoqueFenoRacao,
  listarMovimentacoesFenoRacao,
  registrarExtravioFenoRacao,
} from '../services/fenoRacaoEstoqueService';

import '../styles/ExtravioFenoRacao.css';

const PRODUTOS = [
  { valor: 'FENO', nome: 'Feno' },
  {
    valor: 'RACAO_ADULTO_PREMIUM',
    nome: 'Ração Adulto Premium',
  },
  {
    valor: 'RACAO_ADULTO_MANUTENCAO',
    nome: 'Ração Adulto Manutenção',
  },
  {
    valor: 'RACAO_POTRO_PREMIUM',
    nome: 'Ração Potro Premium',
  },
  {
    valor: 'RACAO_POTRO_MANUTENCAO',
    nome: 'Ração Potro Manutenção',
  },
];

const dataHoje = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const normalizarTexto = (valor) =>
  String(valor ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/º/g, '')
    .replace(/°/g, '')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');

const formatarNumero = (valor) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));

const formatarData = (valor) => {
  if (!valor) return '-';

  const dataSemHorario = String(valor).split('T')[0];
  const [ano, mes, dia] = dataSemHorario.split('-');

  if (!ano || !mes || !dia) {
    return String(valor);
  }

  return `${dia}/${mes}/${ano}`;
};

const obterNomeProduto = (tipo) =>
  PRODUTOS.find((produto) => produto.valor === tipo)?.nome ||
  tipo ||
  '-';

const obterStatusAnalise = (situacao) => {
  switch (situacao) {
    case 'PENDENTE_ANALISE':
      return {
        texto: 'Pendente',
        classe: 'pendente',
      };

    case 'CONFIRMADO':
      return {
        texto: 'Confirmado',
        classe: 'confirmado',
      };

    case 'AJUSTADO':
      return {
        texto: 'Ajustado',
        classe: 'ajustado',
      };

    case 'CANCELADO':
      return {
        texto: 'Cancelado',
        classe: 'cancelado',
      };

    default:
      return null;
  }
};

const extrairLista = (resposta) => {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta?.content)) return resposta.content;
  if (Array.isArray(resposta?.data)) return resposta.data;
  if (Array.isArray(resposta?.dados)) return resposta.dados;
  if (Array.isArray(resposta?.itens)) return resposta.itens;
  return [];
};

const obterMensagemErro = (erro, padrao) => {
  const dados =
    erro?.response?.data ??
    erro?.data ??
    erro?.body ??
    null;

  if (typeof dados === 'string' && dados.trim()) {
    return dados.trim();
  }

  const mensagem =
    dados?.message ??
    dados?.mensagem ??
    dados?.error ??
    erro?.message ??
    erro?.mensagem;

  if (typeof mensagem === 'string' && mensagem.trim()) {
    return mensagem.trim();
  }

  if (dados?.fields && typeof dados.fields === 'object') {
    const mensagens = Object.values(dados.fields)
      .flat()
      .filter(Boolean)
      .map((valor) => String(valor).trim())
      .filter(Boolean);

    if (mensagens.length > 0) {
      return mensagens.join(' ');
    }
  }

  return padrao;
};

function ExtravioFenoRacao({ usuario, onVoltar }) {
  const mensagemRef = useRef(null);

  const unidadeUsuario =
    usuario?.unidade ||
    usuario?.UNIDADE ||
    '';

  const [estoque, setEstoque] = useState([]);
  const [extravios, setExtravios] = useState([]);
  const [tipoProduto, setTipoProduto] = useState('FENO');
  const [entradaId, setEntradaId] = useState('');
  const [dataExtravio, setDataExtravio] = useState(dataHoje());
  const [quantidadeExtraviada, setQuantidadeExtraviada] = useState('');
  const [motivo, setMotivo] = useState('');

  const [responsavel, setResponsavel] = useState(
    usuario?.nomeExibicao ||
      usuario?.nome ||
      usuario?.NOME ||
      ''
  );

  const [salvando, setSalvando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const rolarParaMensagem = useCallback(() => {
    window.setTimeout(() => {
      mensagemRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 80);
  }, []);

  const exibirErro = useCallback(
    (mensagem) => {
      setMensagemSucesso('');
      setMensagemErro(mensagem);
      rolarParaMensagem();
    },
    [rolarParaMensagem]
  );

  const carregarDados = useCallback(async () => {
    if (!unidadeUsuario) {
      setEstoque([]);
      setExtravios([]);
      exibirErro('A unidade do usuário não foi identificada.');
      return;
    }

    setCarregandoDados(true);

    try {
      const hoje = dataHoje();

      const [respostaEstoque, respostaExtravios] =
        await Promise.all([
          listarEstoqueFenoRacao({
            unidade: unidadeUsuario,
            situacao: 'ATIVO',
          }),

          listarMovimentacoesFenoRacao({
            dataInicial: hoje,
            dataFinal: hoje,
            tipoMovimentacao: 'EXTRAVIO',
            unidade: unidadeUsuario,
          }),
        ]);

      setEstoque(extrairLista(respostaEstoque));
      setExtravios(extrairLista(respostaExtravios));
      setMensagemErro('');
    } catch (erro) {
      setEstoque([]);
      setExtravios([]);

      exibirErro(
        obterMensagemErro(
          erro,
          'Não foi possível carregar os dados de extravio.'
        )
      );
    } finally {
      setCarregandoDados(false);
    }
  }, [unidadeUsuario, exibirErro]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarDados();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [carregarDados]);

  const produtosDisponiveis = useMemo(() => {
    const tiposComEstoque = new Set(
      estoque
        .filter(
          (item) => Number(item?.quantidadeAtual || 0) > 0
        )
        .map((item) => item?.tipoProduto)
        .filter(Boolean)
    );

    const filtrados = PRODUTOS.filter((produto) =>
      tiposComEstoque.has(produto.valor)
    );

    return filtrados.length > 0 ? filtrados : PRODUTOS;
  }, [estoque]);

  const estoqueDisponivel = useMemo(() => {
    return estoque
      .filter((entrada) => {
        const mesmaUnidade =
          normalizarTexto(entrada?.unidade) ===
          normalizarTexto(unidadeUsuario);

        const mesmoProduto =
          entrada?.tipoProduto === tipoProduto;

        const ativo =
          !entrada?.situacao ||
          normalizarTexto(entrada?.situacao) === 'ATIVO';

        const temSaldo =
          Number(entrada?.quantidadeAtual || 0) > 0;

        return (
          mesmaUnidade &&
          mesmoProduto &&
          ativo &&
          temSaldo
        );
      })
      .sort((a, b) => {
        const dataA = String(a?.dataEntrada || '');
        const dataB = String(b?.dataEntrada || '');

        if (dataA !== dataB) {
          return dataA.localeCompare(dataB);
        }

        return String(a?.validade || '').localeCompare(
          String(b?.validade || '')
        );
      });
  }, [estoque, tipoProduto, unidadeUsuario]);

  const entradaSelecionada = useMemo(() => {
    return (
      estoqueDisponivel.find(
        (entrada) =>
          String(entrada?.id) === String(entradaId)
      ) || null
    );
  }, [estoqueDisponivel, entradaId]);

  const quantidadeNumerica = Number(quantidadeExtraviada);

  const pesoExtraviadoKg = useMemo(() => {
    if (!entradaSelecionada) return 0;

    return (
      Number(quantidadeExtraviada || 0) *
      Number(entradaSelecionada?.pesoUnidadeKg || 0)
    );
  }, [entradaSelecionada, quantidadeExtraviada]);

  const limparFormulario = () => {
    setEntradaId('');
    setQuantidadeExtraviada('');
    setMotivo('');
  };

  const salvarExtravio = async (event) => {
    event.preventDefault();

    if (salvando) return;

    setMensagemErro('');
    setMensagemSucesso('');

    if (!dataExtravio) {
      exibirErro('Informe a data do extravio.');
      return;
    }

    if (!entradaSelecionada) {
      exibirErro('Selecione um lote disponível.');
      return;
    }

    if (
      !Number.isInteger(quantidadeNumerica) ||
      quantidadeNumerica <= 0
    ) {
      exibirErro(
        'A quantidade extraviada deve ser um número inteiro maior que zero.'
      );
      return;
    }

    const quantidadeAtual = Number(
      entradaSelecionada?.quantidadeAtual || 0
    );

    if (quantidadeNumerica > quantidadeAtual) {
      exibirErro(
        `A quantidade extraviada não pode ser maior que o saldo atual do lote (${formatarNumero(
          quantidadeAtual
        )} un.).`
      );
      return;
    }

    const motivoNormalizado = motivo.trim();

    if (!motivoNormalizado) {
      exibirErro('Informe a justificativa do extravio.');
      return;
    }

    if (motivoNormalizado.length > 250) {
      exibirErro(
        'A justificativa deve possuir no máximo 250 caracteres.'
      );
      return;
    }

    const responsavelNormalizado = responsavel.trim();

    if (!responsavelNormalizado) {
      exibirErro('Informe o responsável pelo registro.');
      return;
    }

    const loteId = Number(entradaSelecionada.id);

    if (!Number.isInteger(loteId) || loteId <= 0) {
      exibirErro('O lote selecionado é inválido.');
      return;
    }

    const payload = {
      loteId,
      quantidadeExtraviada: quantidadeNumerica,
      dataExtravio,
      motivo: motivoNormalizado,
      responsavel: responsavelNormalizado,
      numeroDocumento: null,
      observacao: null,
    };

    setSalvando(true);

    try {
      const resposta =
        await registrarExtravioFenoRacao(payload);

      const quantidadeRetornada =
        resposta?.quantidadeUnidades ??
        resposta?.quantidadeExtraviada ??
        quantidadeNumerica;

      const pesoRetornado =
        resposta?.pesoMovimentadoKg ??
        resposta?.pesoExtraviadoKg ??
        pesoExtraviadoKg;

      const loteRetornado =
        resposta?.codigoLote ??
        entradaSelecionada?.codigoLote ??
        entradaSelecionada?.lote ??
        '-';

      limparFormulario();

      const aguardandoAnalise =
        resposta?.situacaoAnaliseExtravio ===
        'PENDENTE_ANALISE';

      setMensagemSucesso(
        aguardandoAnalise
          ? `Extravio registrado com sucesso. Foram baixadas ${formatarNumero(
              quantidadeRetornada
            )} unidade(s) / ${formatarNumero(
              pesoRetornado
            )} kg do lote ${loteRetornado}. A operação está aguardando análise do administrador.`
          : `Extravio registrado com sucesso. Foram baixadas ${formatarNumero(
              quantidadeRetornada
            )} unidade(s) / ${formatarNumero(
              pesoRetornado
            )} kg do lote ${loteRetornado}.`
      );

      await carregarDados();
      rolarParaMensagem();
    } catch (erro) {
      exibirErro(
        obterMensagemErro(
          erro,
          'Não foi possível registrar o extravio. Verifique os dados e tente novamente.'
        )
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="extravio-alimentacao-page">
      <section className="extravio-alimentacao-phone">
        <header className="extravio-alimentacao-header">
          <button
            type="button"
            className="extravio-alimentacao-voltar"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Alimentação equina</span>
            <h1>Extravio de Feno e Ração</h1>
            <p>{unidadeUsuario || 'Controle de estoque'}</p>
          </div>
        </header>

        <section className="extravio-alimentacao-alerta">
          <div className="extravio-alimentacao-alerta-icon">
            <FaTriangleExclamation />
          </div>

          <div>
            <span>Registro de perda</span>
            <h2>Informe o extravio com justificativa</h2>
            <p>
              O lançamento de extravio baixa o saldo real do lote no banco de
              dados e fica separado das saídas normais de consumo.
            </p>
          </div>
        </section>

        <section className="extravio-alimentacao-card">
          <div className="extravio-alimentacao-card-titulo">
            <FaBoxesStacked />

            <div>
              <h2>Dados do extravio</h2>
              <p>Selecione o lote, informe quantidade e justificativa.</p>
            </div>
          </div>

          <form onSubmit={salvarExtravio}>
            <div className="extravio-alimentacao-grid">
              <div className="extravio-alimentacao-form-group">
                <label htmlFor="dataExtravio">
                  <FaCalendarDays />
                  Data do extravio
                </label>

                <input
                  id="dataExtravio"
                  type="date"
                  value={dataExtravio}
                  onChange={(event) =>
                    setDataExtravio(event.target.value)
                  }
                  disabled={salvando || carregandoDados}
                />
              </div>

              <div className="extravio-alimentacao-form-group">
                <label htmlFor="tipoProduto">Produto</label>

                <select
                  id="tipoProduto"
                  value={tipoProduto}
                  onChange={(event) => {
                    setTipoProduto(event.target.value);
                    setEntradaId('');
                    setQuantidadeExtraviada('');
                    setMensagemErro('');
                    setMensagemSucesso('');
                  }}
                  disabled={salvando || carregandoDados}
                >
                  {produtosDisponiveis.map((produto) => (
                    <option
                      key={produto.valor}
                      value={produto.valor}
                    >
                      {produto.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="extravio-alimentacao-form-group">
              <label htmlFor="entradaId">Lote disponível</label>

              <select
                id="entradaId"
                value={entradaId}
                onChange={(event) => {
                  setEntradaId(event.target.value);
                  setQuantidadeExtraviada('');
                  setMensagemErro('');
                  setMensagemSucesso('');
                }}
                disabled={salvando || carregandoDados}
              >
                <option value="">
                  {carregandoDados
                    ? 'Carregando lotes...'
                    : estoqueDisponivel.length === 0
                      ? 'Nenhum lote disponível'
                      : 'Selecione um lote'}
                </option>

                {estoqueDisponivel.map((entrada) => {
                  const codigoLote =
                    entrada?.codigoLote ??
                    entrada?.lote ??
                    'Sem lote';

                  return (
                    <option
                      key={entrada.id}
                      value={entrada.id}
                    >
                      {codigoLote} · entrada{' '}
                      {formatarData(entrada.dataEntrada)} · saldo{' '}
                      {formatarNumero(entrada.quantidadeAtual)} un. ·{' '}
                      {formatarNumero(
                        Number(entrada.quantidadeAtual || 0) *
                          Number(entrada.pesoUnidadeKg || 0)
                      )}{' '}
                      kg
                    </option>
                  );
                })}
              </select>
            </div>

            {entradaSelecionada && (
              <section className="extravio-alimentacao-lote-card">
                <span>Lote selecionado</span>

                <strong>
                  {entradaSelecionada?.codigoLote ??
                    entradaSelecionada?.lote ??
                    'Sem lote'}
                </strong>

                <div>
                  <p>
                    <b>Produto:</b>{' '}
                    {entradaSelecionada?.nomeProduto ||
                      obterNomeProduto(
                        entradaSelecionada?.tipoProduto
                      )}
                  </p>

                  <p>
                    <b>Data de entrada:</b>{' '}
                    {formatarData(
                      entradaSelecionada?.dataEntrada
                    )}
                  </p>

                  <p>
                    <b>Peso unitário:</b>{' '}
                    {formatarNumero(
                      entradaSelecionada?.pesoUnidadeKg
                    )}{' '}
                    kg
                  </p>

                  <p>
                    <b>Saldo atual:</b>{' '}
                    {formatarNumero(
                      entradaSelecionada?.quantidadeAtual
                    )}{' '}
                    un. /{' '}
                    {formatarNumero(
                      Number(
                        entradaSelecionada?.quantidadeAtual || 0
                      ) *
                        Number(
                          entradaSelecionada?.pesoUnidadeKg || 0
                        )
                    )}{' '}
                    kg
                  </p>
                </div>
              </section>
            )}

            <div className="extravio-alimentacao-grid">
              <div className="extravio-alimentacao-form-group">
                <label htmlFor="quantidadeExtraviada">
                  Quantidade extraviada
                </label>

                <input
                  id="quantidadeExtraviada"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={quantidadeExtraviada}
                  placeholder="Ex.: 2"
                  onChange={(event) => {
                    setQuantidadeExtraviada(event.target.value);
                    setMensagemErro('');
                    setMensagemSucesso('');
                  }}
                  disabled={!entradaSelecionada || salvando}
                />
              </div>

              <div className="extravio-alimentacao-form-group">
                <label>Peso extraviado</label>

                <input
                  type="text"
                  value={`${formatarNumero(pesoExtraviadoKg)} kg`}
                  disabled
                />
              </div>
            </div>

            <div className="extravio-alimentacao-form-group">
              <label htmlFor="responsavel">
                Responsável pelo registro
              </label>

              <input
                id="responsavel"
                type="text"
                maxLength={150}
                value={responsavel}
                placeholder="Ex.: Sd Silva"
                onChange={(event) => {
                  setResponsavel(event.target.value);
                  setMensagemErro('');
                  setMensagemSucesso('');
                }}
                disabled={salvando}
              />
            </div>

            <div className="extravio-alimentacao-form-group">
              <label htmlFor="motivo">
                Justificativa do extravio
              </label>

              <textarea
                id="motivo"
                value={motivo}
                maxLength={250}
                rows={4}
                placeholder="Ex.: Fardos molhados pela chuva durante armazenamento."
                onChange={(event) => {
                  setMotivo(event.target.value);
                  setMensagemErro('');
                  setMensagemSucesso('');
                }}
                disabled={salvando}
              />
            </div>

            <button
              type="submit"
              className="extravio-alimentacao-salvar"
              disabled={salvando || carregandoDados}
            >
              <FaFloppyDisk />
              {salvando ? 'Registrando...' : 'Registrar extravio'}
            </button>

            <div ref={mensagemRef}>
              {mensagemErro && (
                <div className="extravio-alimentacao-feedback erro">
                  <FaTriangleExclamation />
                  <span>{mensagemErro}</span>
                </div>
              )}

              {mensagemSucesso && (
                <div className="extravio-alimentacao-feedback sucesso">
                  <FaCircleCheck />
                  <span>{mensagemSucesso}</span>
                </div>
              )}
            </div>
          </form>

          {extravios.length > 0 && (
            <section className="extravio-alimentacao-historico">
              <div className="extravio-alimentacao-historico-topo">
                <div>
                  <span>
                    <FaClockRotateLeft />
                    Histórico
                  </span>

                  <h2>Extravios registrados hoje</h2>
                </div>

                <strong>
                  {extravios.length} registro(s)
                </strong>
              </div>

              <div className="extravio-alimentacao-historico-lista">
                {extravios.slice(0, 5).map((extravio) => {
                  const data =
                    extravio?.dataOperacao ??
                    extravio?.dataExtravio;

                  const lote =
                    extravio?.codigoLote ??
                    extravio?.lote ??
                    '-';

                  const quantidade =
                    extravio?.quantidadeUnidades ??
                    extravio?.quantidadeExtraviada ??
                    0;

                  const peso =
                    extravio?.pesoMovimentadoKg ??
                    extravio?.pesoExtraviadoKg ??
                    0;

                  const statusAnalise = obterStatusAnalise(
                    extravio?.situacaoAnaliseExtravio
                  );

                  const quantidadeConfirmada =
                    extravio?.quantidadeConfirmada;

                  const quantidadeDevolvida =
                    extravio?.quantidadeDevolvida;

                  return (
                    <article
                      key={
                        extravio?.id ??
                        `${lote}-${data}-${quantidade}`
                      }
                      className="extravio-alimentacao-historico-item"
                    >
                      <div>
                        <strong>
                          {extravio?.nomeProduto ||
                            obterNomeProduto(
                              extravio?.tipoProduto
                            )}
                        </strong>

                        <p>
                          {formatarData(data)} · Lote {lote}
                        </p>

                        <p>
                          {extravio?.motivo ??
                            extravio?.observacao ??
                            '-'}
                        </p>

                        <small>
                          Responsável:{' '}
                          {extravio?.responsavel ??
                            extravio?.responsavelRegistro ??
                            '-'}
                        </small>

                        {statusAnalise && (
                          <div
                            className={`extravio-alimentacao-status-analise ${statusAnalise.classe}`}
                          >
                            <strong>Status:</strong>{' '}
                            {statusAnalise.texto}
                          </div>
                        )}

                        {extravio?.situacaoAnaliseExtravio ===
                          'AJUSTADO' && (
                          <div className="extravio-alimentacao-detalhes-analise">
                            <span>
                              Informado:{' '}
                              <b>
                                {formatarNumero(
                                  quantidade
                                )}{' '}
                                un.
                              </b>
                            </span>

                            <span>
                              Confirmado:{' '}
                              <b>
                                {formatarNumero(
                                  quantidadeConfirmada
                                )}{' '}
                                un.
                              </b>
                            </span>

                            <span>
                              Devolvido ao estoque:{' '}
                              <b>
                                {formatarNumero(
                                  quantidadeDevolvida
                                )}{' '}
                                un.
                              </b>
                            </span>
                          </div>
                        )}

                        {extravio?.situacaoAnaliseExtravio ===
                          'CANCELADO' && (
                          <div className="extravio-alimentacao-detalhes-analise">
                            <span>
                              Informado:{' '}
                              <b>
                                {formatarNumero(
                                  quantidade
                                )}{' '}
                                un.
                              </b>
                            </span>

                            <span>
                              Confirmado:{' '}
                              <b>0 un.</b>
                            </span>

                            <span>
                              Devolvido ao estoque:{' '}
                              <b>
                                {formatarNumero(
                                  quantidadeDevolvida
                                )}{' '}
                                un.
                              </b>
                            </span>
                          </div>
                        )}
                      </div>

                      <span>
                        {formatarNumero(quantidade)} un. /{' '}
                        {formatarNumero(peso)} kg
                      </span>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

export default ExtravioFenoRacao;