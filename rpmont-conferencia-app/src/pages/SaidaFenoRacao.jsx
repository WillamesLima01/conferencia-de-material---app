import { useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBoxesStacked,
  FaCalendarDays,
  FaCircleCheck,
  FaHorse,
  FaMinus,
  FaPenToSquare,
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

    return Array.isArray(dadosConvertidos) ? dadosConvertidos : [];
  } catch {
    return [];
  }
};

const normalizarValor = (valor) => {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
};

const obterNivelUsuario = (usuario) => {
  return normalizarValor(
    usuario?.nivelAcesso ||
      usuario?.perfil ||
      usuario?.role ||
      usuario?.tipo ||
      usuario?.NIVEL_ACESSO ||
      usuario?.PERFIL ||
      usuario?.ROLE ||
      usuario?.TIPO ||
      usuario?.nivel ||
      usuario?.NIVEL
  );
};

const usuarioEhAdmin = (usuario) => {
  const nivel = obterNivelUsuario(usuario);

  return ['ADMIN', 'ADMINP4', 'ADMINMASTER', 'MASTER', '1'].includes(nivel);
};

const obterIdentificadorUsuario = (usuario) => {
  return String(
    usuario?.id ||
      usuario?.ID ||
      usuario?.matricula ||
      usuario?.MATRICULA ||
      usuario?.email ||
      usuario?.EMAIL ||
      ''
  );
};

const saidaFoiDoUsuario = (saida, usuario) => {
  const idUsuario = obterIdentificadorUsuario(usuario);

  const idSaida = String(
    saida?.usuarioId ||
      saida?.userModificador ||
      saida?.userId ||
      saida?.usuarioCadastroId ||
      saida?.matricula ||
      ''
  );

  return Boolean(idUsuario && idSaida && idUsuario === idSaida);
};

const saidaEhDaDataAtual = (saida) => {
  return saida?.dataSaida === dataHoje();
};

const usuarioPodeEditarSaida = (saida, usuario) => {
  if (usuarioEhAdmin(usuario)) return true;

  return saidaFoiDoUsuario(saida, usuario) && saidaEhDaDataAtual(saida);
};

const usuarioPodeCancelarSaida = (usuario) => {
  return usuarioEhAdmin(usuario);
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
  const [saidaEmEdicao, setSaidaEmEdicao] = useState(null);

  const [modalSucessoAberto, setModalSucessoAberto] = useState(false);
  const [saidaConfirmada, setSaidaConfirmada] = useState(null);
  const [tipoConfirmacao, setTipoConfirmacao] = useState('REGISTRO');

  const usuarioAdmin = usuarioEhAdmin(usuario);

  const produtoSelecionado = useMemo(() => {
    return PRODUTOS.find((produto) => produto.valor === tipoProduto) || null;
  }, [tipoProduto]);

  const estoquesDoProduto = useMemo(() => {
    if (!tipoProduto) return [];

    return entradas
      .filter((entrada) => {
        const quantidadeAtual = Number(entrada.quantidadeAtual || 0);

        const ehMesmoEstoqueDaEdicao =
          saidaEmEdicao &&
          String(entrada.id) === String(saidaEmEdicao.entradaId);

        return (
          entrada.tipoProduto === tipoProduto &&
          (quantidadeAtual > 0 || ehMesmoEstoqueDaEdicao)
        );
      })
      .sort((a, b) => {
        const dataA = new Date(a.dataEntrada || 0).getTime();
        const dataB = new Date(b.dataEntrada || 0).getTime();

        return dataA - dataB;
      });
  }, [entradas, tipoProduto, saidaEmEdicao]);

  const estoqueSelecionado = useMemo(() => {
    return (
      entradas.find(
        (entrada) => String(entrada.id) === String(estoqueSelecionadoId)
      ) || null
    );
  }, [entradas, estoqueSelecionadoId]);

  const pesoUnidadeKg = Number(estoqueSelecionado?.pesoUnidadeKg || 0);

  const quantidadeDisponivelReal = Number(
    estoqueSelecionado?.quantidadeAtual || 0
  );

  const quantidadeDisponivel =
    saidaEmEdicao &&
    String(saidaEmEdicao.entradaId) === String(estoqueSelecionadoId)
      ? quantidadeDisponivelReal + Number(saidaEmEdicao.quantidadeRetirada || 0)
      : quantidadeDisponivelReal;

  const quantidadeNecessariaNumerica = Number(quantidadeNecessariaKg);

  const unidadesCalculadas =
    pesoUnidadeKg > 0 && quantidadeNecessariaNumerica > 0
      ? Math.ceil(quantidadeNecessariaNumerica / pesoUnidadeKg)
      : 0;

  const pesoLiberadoKg = unidadesCalculadas * pesoUnidadeKg;

  const sobraCalculadaKg =
    pesoLiberadoKg > quantidadeNecessariaNumerica
      ? pesoLiberadoKg - quantidadeNecessariaNumerica
      : 0;

  const saldoAposSaida = quantidadeDisponivel - unidadesCalculadas;

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    window.setTimeout(() => {
      setMensagem('');
    }, 3500);
  };

  const salvarEntradas = (novaLista) => {
    setEntradas(novaLista);

    localStorage.setItem(STORAGE_KEY_ENTRADAS, JSON.stringify(novaLista));
  };

  const salvarSaidas = (novaLista) => {
    setSaidas(novaLista);

    localStorage.setItem(STORAGE_KEY_SAIDAS, JSON.stringify(novaLista));
  };

  const limparFormulario = () => {
    setTipoProduto('');
    setEstoqueSelecionadoId('');
    setQuantidadeNecessariaKg('');
    setDataSaida(dataHoje());
    setServico('Serviço de 24 horas');
    setObservacao('');
    setSaidaEmEdicao(null);
  };

  const fecharModalSucesso = () => {
    setModalSucessoAberto(false);
    setSaidaConfirmada(null);
    setTipoConfirmacao('REGISTRO');
  };

  const cancelarEdicao = () => {
    limparFormulario();
    mostrarMensagem('Edição cancelada.');
  };

  const handleProdutoChange = (event) => {
    setTipoProduto(event.target.value);
    setEstoqueSelecionadoId('');
    setQuantidadeNecessariaKg('');
    setMensagem('');
  };

  const iniciarEdicaoSaida = (saida) => {
    if (!usuarioPodeEditarSaida(saida, usuario)) {
      mostrarMensagem(
        'Você só pode editar saídas registradas por você na data atual.'
      );
      return;
    }

    setSaidaEmEdicao(saida);
    setTipoProduto(saida.tipoProduto || '');
    setEstoqueSelecionadoId(String(saida.entradaId || ''));
    setQuantidadeNecessariaKg(String(saida.quantidadeNecessariaKg || ''));
    setDataSaida(saida.dataSaida || dataHoje());
    setServico(saida.servico || 'Serviço de 24 horas');
    setResponsavel(saida.responsavel || responsavel);
    setObservacao(saida.observacao || '');
    setMensagem('Modo de edição ativado. Ajuste os dados e salve novamente.');
  };

  const montarSaida = () => {
    const usuarioId =
      usuario?.id ||
      usuario?.ID ||
      usuario?.matricula ||
      usuario?.MATRICULA ||
      usuario?.email ||
      usuario?.EMAIL ||
      null;

    return {
      id: saidaEmEdicao?.id || gerarId(),
      entradaId: estoqueSelecionado.id,
      tipoProduto: produtoSelecionado.valor,
      nomeProduto: produtoSelecionado.nome,
      unidadeControle: produtoSelecionado.unidade.toUpperCase(),
      pesoUnidadeKg,
      quantidadeRetirada: unidadesCalculadas,
      quantidadeNecessariaKg: quantidadeNecessariaNumerica,
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
        usuario?.unidade || usuario?.UNIDADE || estoqueSelecionado.unidade || 'RPMont',

      usuarioId,
      usuarioNome: usuario?.nomeExibicao || usuario?.nome || usuario?.NOME || '',
      usuarioSetor: usuario?.setor || usuario?.SETOR || '',

      dataCadastro: saidaEmEdicao?.dataCadastro || new Date().toISOString(),
      dataRegistro: saidaEmEdicao?.dataRegistro || new Date().toISOString(),
      dataModificacao: saidaEmEdicao ? new Date().toISOString() : null,
      userModificador: usuarioId || 1,
    };
  };

  const atualizarEstoqueAoRegistrar = (novaSaida) => {
    if (!saidaEmEdicao) {
      return entradas.map((entrada) =>
        entrada.id === estoqueSelecionado.id
          ? {
              ...entrada,
              quantidadeAtual:
                Number(entrada.quantidadeAtual || 0) - unidadesCalculadas,
              pesoAtualKg:
                (Number(entrada.quantidadeAtual || 0) - unidadesCalculadas) *
                Number(entrada.pesoUnidadeKg || 0),
              dataModificacao: new Date().toISOString(),
              userModificador: usuario?.id || usuario?.ID || 1,
            }
          : entrada
      );
    }

    return entradas.map((entrada) => {
      let quantidadeAtual = Number(entrada.quantidadeAtual || 0);

      if (String(entrada.id) === String(saidaEmEdicao.entradaId)) {
        quantidadeAtual += Number(saidaEmEdicao.quantidadeRetirada || 0);
      }

      if (String(entrada.id) === String(novaSaida.entradaId)) {
        quantidadeAtual -= Number(novaSaida.quantidadeRetirada || 0);
      }

      return {
        ...entrada,
        quantidadeAtual,
        pesoAtualKg: quantidadeAtual * Number(entrada.pesoUnidadeKg || 0),
        dataModificacao: new Date().toISOString(),
        userModificador: usuario?.id || usuario?.ID || 1,
      };
    });
  };

  const handleRegistrarSaida = (event) => {
    event.preventDefault();

    if (saidaEmEdicao && !usuarioPodeEditarSaida(saidaEmEdicao, usuario)) {
      mostrarMensagem(
        'Você só pode editar saídas registradas por você na data atual.'
      );
      return;
    }

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
      mostrarMensagem('Informe a quantidade necessária em quilogramas.');
      return;
    }

    if (unidadesCalculadas <= 0) {
      mostrarMensagem('Não foi possível calcular a saída.');
      return;
    }

    if (unidadesCalculadas > quantidadeDisponivel) {
      mostrarMensagem(
        `Estoque insuficiente. Disponível: ${formatarNumero(
          quantidadeDisponivel
        )} ${produtoSelecionado.unidadePlural}.`
      );
      return;
    }

    if (!dataSaida) {
      mostrarMensagem('Informe a data da saída.');
      return;
    }

    if (!usuarioAdmin && dataSaida !== dataHoje()) {
      mostrarMensagem(
        'Usuário comum só pode registrar ou editar saída da data atual.'
      );
      return;
    }

    if (!responsavel.trim()) {
      mostrarMensagem('Informe o responsável pela retirada.');
      return;
    }

    const estavaEditando = Boolean(saidaEmEdicao);
    const novaSaida = montarSaida();
    const entradasAtualizadas = atualizarEstoqueAoRegistrar(novaSaida);

    const saidasAtualizadas = saidaEmEdicao
      ? saidas.map((saida) =>
          saida.id === saidaEmEdicao.id ? novaSaida : saida
        )
      : [novaSaida, ...saidas];

    salvarEntradas(entradasAtualizadas);
    salvarSaidas(saidasAtualizadas);

    limparFormulario();

    setSaidaConfirmada(novaSaida);
    setTipoConfirmacao(estavaEditando ? 'EDICAO' : 'REGISTRO');
    setModalSucessoAberto(true);
    setMensagem('');
  };

  const confirmarExclusaoSaida = () => {
    if (!saidaParaExcluir) return;

    if (!usuarioPodeCancelarSaida(usuario)) {
      setSaidaParaExcluir(null);
      mostrarMensagem('Usuário comum não tem permissão para cancelar saída.');
      return;
    }

    const entradasAtualizadas = entradas.map((entrada) =>
      entrada.id === saidaParaExcluir.entradaId
        ? {
            ...entrada,
            quantidadeAtual:
              Number(entrada.quantidadeAtual || 0) +
              Number(saidaParaExcluir.quantidadeRetirada || 0),
            pesoAtualKg:
              (Number(entrada.quantidadeAtual || 0) +
                Number(saidaParaExcluir.quantidadeRetirada || 0)) *
              Number(entrada.pesoUnidadeKg || 0),
            dataModificacao: new Date().toISOString(),
            userModificador: usuario?.id || usuario?.ID || 1,
          }
        : entrada
    );

    const saidasAtualizadas = saidas.filter(
      (saida) => saida.id !== saidaParaExcluir.id
    );

    salvarEntradas(entradasAtualizadas);
    salvarSaidas(saidasAtualizadas);

    setSaidaParaExcluir(null);

    mostrarMensagem('Saída cancelada e quantidade devolvida ao estoque.');
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
              Usuário comum da Baia só pode editar a própria saída do dia
              atual. Após 00h, a edição fica bloqueada.
            </p>
          </div>
        </section>

        {mensagem && (
          <div className="saida-alimentacao-mensagem">{mensagem}</div>
        )}

        <section className="saida-alimentacao-card">
          <div className="saida-alimentacao-card-titulo">
            <FaMinus />

            <div>
              <h2>{saidaEmEdicao ? 'Editar saída' : 'Nova saída'}</h2>
              <p>
                {saidaEmEdicao
                  ? 'Altere os dados permitidos e salve novamente.'
                  : 'Selecione o produto e o estoque utilizado.'}
              </p>
            </div>
          </div>

          {saidaEmEdicao && (
            <div className="saida-alimentacao-edicao-alerta">
              <strong>Modo de edição ativo</strong>
              <span>
                Você está editando uma saída registrada em{' '}
                {formatarData(saidaEmEdicao.dataSaida)}.
              </span>

              <button type="button" onClick={cancelarEdicao}>
                <FaXmark />
                Cancelar edição
              </button>
            </div>
          )}

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
                  <option key={produto.valor} value={produto.valor}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="saida-alimentacao-form-group">
              <label htmlFor="saidaEstoque">Peso e estoque disponível</label>

              <select
                id="saidaEstoque"
                value={estoqueSelecionadoId}
                disabled={!tipoProduto}
                onChange={(event) => {
                  setEstoqueSelecionadoId(event.target.value);
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

                {estoquesDoProduto.map((entrada) => {
                  const ehMesmoEstoqueDaEdicao =
                    saidaEmEdicao &&
                    String(entrada.id) === String(saidaEmEdicao.entradaId);

                  const saldoExibido = ehMesmoEstoqueDaEdicao
                    ? Number(entrada.quantidadeAtual || 0) +
                      Number(saidaEmEdicao.quantidadeRetirada || 0)
                    : Number(entrada.quantidadeAtual || 0);

                  return (
                    <option key={entrada.id} value={entrada.id}>
                      {formatarNumero(entrada.pesoUnidadeKg)} kg —{' '}
                      {formatarNumero(saldoExibido)}{' '}
                      {produtoSelecionado?.unidadePlural}
                      {entrada.lote ? ` — Lote ${entrada.lote}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {estoqueSelecionado && (
              <div className="saida-alimentacao-estoque-info">
                <div>
                  <span>Peso por unidade</span>
                  <strong>{formatarNumero(pesoUnidadeKg)} kg</strong>
                </div>

                <div>
                  <span>Saldo disponível</span>
                  <strong>
                    {formatarNumero(quantidadeDisponivel)}{' '}
                    {produtoSelecionado?.unidadePlural}
                  </strong>
                </div>

                <div>
                  <span>Peso disponível</span>
                  <strong>
                    {formatarNumero(quantidadeDisponivel * pesoUnidadeKg)} kg
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
                    setQuantidadeNecessariaKg(event.target.value);
                    setMensagem('');
                  }}
                />

                <span>kg</span>
              </div>
            </div>

            <div className="saida-alimentacao-calculo">
              <div>
                <span>Quantidade necessária</span>
                <strong>{formatarNumero(quantidadeNecessariaNumerica)} kg</strong>
              </div>

              <div>
                <span>
                  {produtoSelecionado?.unidadePlural || 'Unidades'} calculados
                </span>

                <strong>{formatarNumero(unidadesCalculadas)}</strong>
              </div>

              <div>
                <span>Peso liberado</span>
                <strong>{formatarNumero(pesoLiberadoKg)} kg</strong>
              </div>

              <div>
                <span>Sobra calculada</span>
                <strong>{formatarNumero(sobraCalculadaKg)} kg</strong>
              </div>

              <div className="saida-alimentacao-calculo-saldo">
                <span>Saldo após a retirada</span>

                <strong
                  className={saldoAposSaida < 0 ? 'saldo-insuficiente' : ''}
                >
                  {formatarNumero(Math.max(saldoAposSaida, 0))}{' '}
                  {produtoSelecionado?.unidadePlural || 'unidades'}
                </strong>
              </div>
            </div>

            <div className="saida-alimentacao-grid">
              <div className="saida-alimentacao-form-group">
                <label htmlFor="dataSaida">Data da saída</label>

                <input
                  id="dataSaida"
                  type="date"
                  value={dataSaida}
                  disabled={!usuarioAdmin}
                  onChange={(event) => setDataSaida(event.target.value)}
                />
              </div>

              <div className="saida-alimentacao-form-group">
                <label htmlFor="servico">Serviço</label>

                <input
                  id="servico"
                  type="text"
                  value={servico}
                  onChange={(event) => setServico(event.target.value)}
                />
              </div>
            </div>

            <div className="saida-alimentacao-form-group">
              <label htmlFor="responsavelSaida">Responsável pela retirada</label>

              <input
                id="responsavelSaida"
                type="text"
                value={responsavel}
                onChange={(event) => setResponsavel(event.target.value)}
              />
            </div>

            <div className="saida-alimentacao-form-group">
              <label htmlFor="observacaoSaida">Observação</label>

              <textarea
                id="observacaoSaida"
                value={observacao}
                placeholder="Informações adicionais sobre a retirada"
                onChange={(event) => setObservacao(event.target.value)}
              />
            </div>

            <button type="submit" className="saida-alimentacao-salvar">
              <FaMinus />
              {saidaEmEdicao ? 'Salvar alteração da saída' : 'Registrar saída'}
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
                  (item) => item.valor === saida.tipoProduto
                );

                const podeEditar = usuarioPodeEditarSaida(saida, usuario);
                const podeCancelar = usuarioPodeCancelarSaida(usuario);

                return (
                  <article key={saida.id} className="saida-alimentacao-item">
                    <div
                      className={`saida-alimentacao-item-icon ${obterClasseProduto(
                        saida.tipoProduto
                      )}`}
                    >
                      {renderizarIconeProduto(saida.tipoProduto)}
                    </div>

                    <div className="saida-alimentacao-item-info">
                      <span>{saida.nomeProduto}</span>

                      <h3>
                        {formatarNumero(saida.quantidadeRetirada)}{' '}
                        {produto?.unidadePlural || 'unidades'} de{' '}
                        {formatarNumero(saida.pesoUnidadeKg)} kg
                      </h3>

                      <p>
                        Necessário:{' '}
                        <strong>
                          {formatarNumero(saida.quantidadeNecessariaKg)} kg
                        </strong>
                      </p>

                      <p>
                        Liberado:{' '}
                        <strong>{formatarNumero(saida.pesoLiberadoKg)} kg</strong>
                      </p>

                      <p>
                        Responsável:{' '}
                        <strong>
                          {saida.responsavel || saida.usuarioNome || '-'}
                        </strong>
                      </p>

                      <div className="saida-alimentacao-item-detalhes">
                        <span>
                          <FaCalendarDays />
                          {formatarData(saida.dataSaida)}
                        </span>

                        {saida.lote && <span>Lote: {saida.lote}</span>}
                      </div>
                    </div>

                    <div className="saida-alimentacao-item-acoes">
                      {podeEditar && (
                        <button
                          type="button"
                          className="saida-alimentacao-editar"
                          onClick={() => iniciarEdicaoSaida(saida)}
                          aria-label="Editar saída"
                        >
                          <FaPenToSquare />
                        </button>
                      )}

                      {podeCancelar && (
                        <button
                          type="button"
                          className="saida-alimentacao-excluir"
                          onClick={() => setSaidaParaExcluir(saida)}
                          aria-label="Cancelar saída"
                        >
                          <FaTrashCan />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {modalSucessoAberto && saidaConfirmada && (
          <div className="saida-alimentacao-modal-overlay">
            <div className="saida-alimentacao-modal">
              <div className="saida-alimentacao-modal-icon sucesso">
                <FaCircleCheck />
              </div>

              <h2>
                {tipoConfirmacao === 'EDICAO'
                  ? 'Saída atualizada com sucesso!'
                  : 'Saída registrada com sucesso!'}
              </h2>

              <p>
                {tipoConfirmacao === 'EDICAO'
                  ? 'As alterações foram salvas no sistema.'
                  : 'A retirada foi salva no sistema. Confira o resumo abaixo.'}
              </p>

              <div className="saida-alimentacao-modal-resumo sucesso">
                <span>Produto</span>
                <strong>{saidaConfirmada.nomeProduto}</strong>

                <span>Lote</span>
                <strong>{saidaConfirmada.lote || '-'}</strong>

                <span>Quantidade retirada</span>
                <strong>
                  {formatarNumero(saidaConfirmada.quantidadeRetirada)}{' '}
                  {PRODUTOS.find(
                    (produto) => produto.valor === saidaConfirmada.tipoProduto
                  )?.unidadePlural || 'unidades'}
                </strong>

                <span>Peso liberado</span>
                <strong>{formatarNumero(saidaConfirmada.pesoLiberadoKg)} kg</strong>

                <span>Responsável</span>
                <strong>
                  {saidaConfirmada.responsavel ||
                    saidaConfirmada.usuarioNome ||
                    '-'}
                </strong>

                <span>Data</span>
                <strong>{formatarData(saidaConfirmada.dataSaida)}</strong>
              </div>

              <div className="saida-alimentacao-modal-actions">
                <button
                  type="button"
                  className="saida-alimentacao-confirmar-sucesso"
                  onClick={fecharModalSucesso}
                >
                  <FaCircleCheck />
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}

        {saidaParaExcluir && (
          <div className="saida-alimentacao-modal-overlay">
            <div className="saida-alimentacao-modal">
              <div className="saida-alimentacao-modal-icon">
                <FaTriangleExclamation />
              </div>

              <h2>Cancelar saída?</h2>

              <p>
                A quantidade retirada será devolvida ao estoque de{' '}
                <strong>{saidaParaExcluir.nomeProduto}</strong>.
              </p>

              <div className="saida-alimentacao-modal-resumo">
                <span>Quantidade retirada</span>
                <strong>
                  {formatarNumero(saidaParaExcluir.quantidadeRetirada)} unidades
                </strong>

                <span>Peso por unidade</span>
                <strong>{formatarNumero(saidaParaExcluir.pesoUnidadeKg)} kg</strong>

                <span>Peso liberado</span>
                <strong>{formatarNumero(saidaParaExcluir.pesoLiberadoKg)} kg</strong>
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
                  onClick={() => setSaidaParaExcluir(null)}
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