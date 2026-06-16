import { useMemo, useRef, useState } from 'react';
import {
  FaArrowLeft,
  FaBoxesStacked,
  FaCalendarDays,
  FaCircleCheck,
  FaClockRotateLeft,
  FaFloppyDisk,
  FaTriangleExclamation,
} from 'react-icons/fa6';

import '../styles/ExtravioFenoRacao.css';

const STORAGE_KEY_ENTRADAS = 'entradasAlimentacaoEquina';
const STORAGE_KEY_EXTRAVIOS = 'extraviosAlimentacaoEquina';

const PRODUTOS = [
  {
    valor: 'FENO',
    nome: 'Feno',
  },
  {
    valor: 'RACAO_ADULTO',
    nome: 'Ração Adulto',
  },
  {
    valor: 'RACAO_POTRO',
    nome: 'Ração Potro',
  },
];

const carregarStorage = (chave) => {
  const dadosSalvos = localStorage.getItem(chave);

  if (!dadosSalvos) return [];

  try {
    const dadosConvertidos = JSON.parse(dadosSalvos);

    return Array.isArray(dadosConvertidos) ? dadosConvertidos : [];
  } catch {
    return [];
  }
};

const salvarStorage = (chave, dados) => {
  localStorage.setItem(chave, JSON.stringify(dados));
};

const gerarId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const dataHoje = () => new Date().toISOString().slice(0, 10);

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

function ExtravioFenoRacao({ usuario, onVoltar }) {
  const mensagemRef = useRef(null);

  const [entradas, setEntradas] = useState(() =>
    carregarStorage(STORAGE_KEY_ENTRADAS)
  );

  const [extravios, setExtravios] = useState(() =>
    carregarStorage(STORAGE_KEY_EXTRAVIOS)
  );

  const [tipoProduto, setTipoProduto] = useState('FENO');
  const [entradaId, setEntradaId] = useState('');
  const [dataExtravio, setDataExtravio] = useState(dataHoje());
  const [quantidadeExtraviada, setQuantidadeExtraviada] = useState('');
  const [motivo, setMotivo] = useState('');
  const [responsavel, setResponsavel] = useState(
    usuario?.nomeExibicao || usuario?.nome || usuario?.NOME || ''
  );
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const unidadeUsuario = usuario?.unidade || usuario?.UNIDADE || 'RPMont';

  const estoqueDisponivel = useMemo(() => {
    return entradas
      .filter((entrada) => {
        return (
          entrada.tipoProduto === tipoProduto &&
          Number(entrada.quantidadeAtual || 0) > 0
        );
      })
      .sort((a, b) =>
        String(a.dataEntrada || '').localeCompare(String(b.dataEntrada || ''))
      );
  }, [entradas, tipoProduto]);

  const entradaSelecionada = useMemo(() => {
    return estoqueDisponivel.find(
      (entrada) => String(entrada.id) === String(entradaId)
    );
  }, [estoqueDisponivel, entradaId]);

  const pesoExtraviadoKg = useMemo(() => {
    if (!entradaSelecionada) return 0;

    return (
      Number(quantidadeExtraviada || 0) *
      Number(entradaSelecionada.pesoUnidadeKg || 0)
    );
  }, [entradaSelecionada, quantidadeExtraviada]);

  const rolarParaMensagem = () => {
    setTimeout(() => {
      mensagemRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 80);
  };

  const limparFormulario = () => {
    setEntradaId('');
    setQuantidadeExtraviada('');
    setMotivo('');
  };

  const exibirErro = (mensagem) => {
    setMensagemSucesso('');
    setMensagemErro(mensagem);
    rolarParaMensagem();
  };

  const salvarExtravio = (event) => {
    event.preventDefault();

    if (salvando) return;

    setMensagemErro('');
    setMensagemSucesso('');

    try {
      if (!dataExtravio) {
        exibirErro('Informe a data do extravio.');
        return;
      }

      if (!entradaSelecionada) {
        exibirErro('Selecione um lote disponível.');
        return;
      }

      const quantidade = Number(quantidadeExtraviada || 0);
      const quantidadeAtual = Number(entradaSelecionada.quantidadeAtual || 0);

      if (quantidade <= 0) {
        exibirErro('Informe uma quantidade extraviada maior que zero.');
        return;
      }

      if (quantidade > quantidadeAtual) {
        exibirErro(
          `A quantidade extraviada não pode ser maior que o saldo atual do lote (${formatarNumero(
            quantidadeAtual
          )} un.).`
        );
        return;
      }

      if (!motivo.trim()) {
        exibirErro('Informe a justificativa do extravio.');
        return;
      }

      if (!responsavel.trim()) {
        exibirErro('Informe o responsável pelo registro.');
        return;
      }

      setSalvando(true);

      const entradasAtualizadas = entradas.map((entrada) => {
        if (String(entrada.id) !== String(entradaSelecionada.id)) {
          return entrada;
        }

        return {
          ...entrada,
          quantidadeAtual: quantidadeAtual - quantidade,
          dataModificacao: new Date().toISOString(),
          usuarioModificador: usuario?.id || usuario?.ID || null,
        };
      });

      const novoExtravio = {
        id: gerarId(),
        entradaId: entradaSelecionada.id,
        dataExtravio,
        tipoProduto,
        nomeProduto: obterNomeProduto(tipoProduto),
        lote: entradaSelecionada.lote || '-',
        dataEntrada: entradaSelecionada.dataEntrada || '',
        pesoUnidadeKg: Number(entradaSelecionada.pesoUnidadeKg || 0),
        quantidadeExtraviada: quantidade,
        pesoExtraviadoKg,
        motivo: motivo.trim(),
        responsavel: responsavel.trim(),
        unidade: unidadeUsuario,
        usuarioId: usuario?.id || usuario?.ID || null,
        usuarioNome:
          usuario?.nomeExibicao || usuario?.nome || usuario?.NOME || '',
        dataRegistro: new Date().toISOString(),
      };

      const extraviosAtualizados = [novoExtravio, ...extravios];

      salvarStorage(STORAGE_KEY_ENTRADAS, entradasAtualizadas);
      salvarStorage(STORAGE_KEY_EXTRAVIOS, extraviosAtualizados);

      setEntradas(entradasAtualizadas);
      setExtravios(extraviosAtualizados);

      limparFormulario();

      setMensagemErro('');
      setMensagemSucesso(
        `Extravio registrado com sucesso. Foram baixados ${formatarNumero(
          quantidade
        )} un. / ${formatarNumero(pesoExtraviadoKg)} kg do lote ${
          entradaSelecionada.lote || 'sem lote'
        }.`
      );

      rolarParaMensagem();
    } catch (error) {
      console.error('Erro ao registrar extravio:', error);

      exibirErro(
        'Não foi possível registrar o extravio. Verifique os dados e tente novamente.'
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
            <p>{unidadeUsuario}</p>
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
              O lançamento de extravio baixa o saldo do lote selecionado e fica
              separado das saídas normais de consumo.
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
                  onChange={(event) => setDataExtravio(event.target.value)}
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
                    setMensagemErro('');
                    setMensagemSucesso('');
                  }}
                >
                  {PRODUTOS.map((produto) => (
                    <option key={produto.valor} value={produto.valor}>
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
                  setMensagemErro('');
                  setMensagemSucesso('');
                }}
              >
                <option value="">Selecione um lote</option>

                {estoqueDisponivel.map((entrada) => (
                  <option key={entrada.id} value={entrada.id}>
                    {entrada.lote || 'Sem lote'} · entrada{' '}
                    {formatarData(entrada.dataEntrada)} · saldo{' '}
                    {formatarNumero(entrada.quantidadeAtual)} un. ·{' '}
                    {formatarNumero(
                      Number(entrada.quantidadeAtual || 0) *
                        Number(entrada.pesoUnidadeKg || 0)
                    )}{' '}
                    kg
                  </option>
                ))}
              </select>
            </div>

            {entradaSelecionada && (
              <section className="extravio-alimentacao-lote-card">
                <span>Lote selecionado</span>
                <strong>{entradaSelecionada.lote || 'Sem lote'}</strong>

                <div>
                  <p>
                    <b>Produto:</b>{' '}
                    {obterNomeProduto(entradaSelecionada.tipoProduto)}
                  </p>

                  <p>
                    <b>Data de entrada:</b>{' '}
                    {formatarData(entradaSelecionada.dataEntrada)}
                  </p>

                  <p>
                    <b>Peso unitário:</b>{' '}
                    {formatarNumero(entradaSelecionada.pesoUnidadeKg)} kg
                  </p>

                  <p>
                    <b>Saldo atual:</b>{' '}
                    {formatarNumero(entradaSelecionada.quantidadeAtual)} un. /{' '}
                    {formatarNumero(
                      Number(entradaSelecionada.quantidadeAtual || 0) *
                        Number(entradaSelecionada.pesoUnidadeKg || 0)
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
                  min="0"
                  step="0.01"
                  value={quantidadeExtraviada}
                  placeholder="Ex.: 2"
                  onChange={(event) => {
                    setQuantidadeExtraviada(event.target.value);
                    setMensagemErro('');
                    setMensagemSucesso('');
                  }}
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
              <label htmlFor="responsavel">Responsável pelo registro</label>

              <input
                id="responsavel"
                type="text"
                value={responsavel}
                placeholder="Ex.: Sd Silva"
                onChange={(event) => {
                  setResponsavel(event.target.value);
                  setMensagemErro('');
                  setMensagemSucesso('');
                }}
              />
            </div>

            <div className="extravio-alimentacao-form-group">
              <label htmlFor="motivo">Justificativa do extravio</label>

              <textarea
                id="motivo"
                value={motivo}
                rows={4}
                placeholder="Ex.: Fardos molhados pela chuva durante armazenamento."
                onChange={(event) => {
                  setMotivo(event.target.value);
                  setMensagemErro('');
                  setMensagemSucesso('');
                }}
              />
            </div>

            <button
              type="submit"
              className="extravio-alimentacao-salvar"
              disabled={salvando}
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
                  <h2>Últimos extravios registrados</h2>
                </div>

                <strong>{extravios.length} registro(s)</strong>
              </div>

              <div className="extravio-alimentacao-historico-lista">
                {extravios.slice(0, 5).map((extravio) => (
                  <article
                    key={extravio.id}
                    className="extravio-alimentacao-historico-item"
                  >
                    <div>
                      <strong>{extravio.nomeProduto}</strong>

                      <p>
                        {formatarData(extravio.dataExtravio)} · Lote{' '}
                        {extravio.lote}
                      </p>

                      <p>{extravio.motivo}</p>

                      <small>Responsável: {extravio.responsavel}</small>
                    </div>

                    <span>
                      {formatarNumero(extravio.quantidadeExtraviada)} un. /{' '}
                      {formatarNumero(extravio.pesoExtraviadoKg)} kg
                    </span>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

export default ExtravioFenoRacao;