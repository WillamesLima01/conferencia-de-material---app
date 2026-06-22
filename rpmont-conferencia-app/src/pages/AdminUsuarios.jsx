import { useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBuilding,
  FaCircleCheck,
  FaLayerGroup,
  FaLock,
  FaPen,
  FaShieldHalved,
  FaTrash,
  FaUserGear,
} from 'react-icons/fa6';
import '../styles/AdminUsuarios.css';

const STORAGE_KEY_UNIDADES = 'unidades';
const STORAGE_KEY_SETORES = 'setores';
const STORAGE_KEY_USUARIOS = 'usuarios';

const STATUS_ACESSO = {
  PENDENTE: 'PENDENTE',
  LIBERADO: 'LIBERADO',
  BLOQUEADO: 'BLOQUEADO',
};

const NIVEIS_USUARIO = {
  ADMIN_MASTER: '0',
  ADMIN: '1',
  USUARIO_COMUM: '2',
};

const gerarId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return String(Date.now() + Math.random());
};

const dataAtual = () => {
  return new Date().toISOString().slice(0, 10);
};

const dataHoraAtual = () => {
  return new Date().toISOString();
};

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

const limparNumeros = (valor) => {
  return String(valor || '').replace(/\D/g, '');
};

const formatarMatricula = (valor) => {
  const somenteNumeros = limparNumeros(valor).slice(0, 7);

  if (somenteNumeros.length <= 3) {
    return somenteNumeros;
  }

  if (somenteNumeros.length <= 6) {
    return `${somenteNumeros.slice(0, 3)}.${somenteNumeros.slice(3)}`;
  }

  return `${somenteNumeros.slice(0, 3)}.${somenteNumeros.slice(
    3,
    6
  )}-${somenteNumeros.slice(6, 7)}`;
};

const matriculaValida = (valor) => {
  return /^\d{3}\.\d{3}-\d{1}$/.test(valor);
};

const normalizarTexto = (valor) => {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

const normalizarNivel = (valor) => {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
};

const obterIdUsuario = (usuario) => {
  return usuario?.ID || usuario?.id || 1;
};

const obterUnidadeUsuario = (usuario) => {
  return usuario?.UNIDADE || usuario?.unidade || '';
};

const obterNivelUsuario = (usuario) => {
  return normalizarNivel(
    usuario?.NIVEL ||
      usuario?.nivel ||
      usuario?.nivelAcesso ||
      usuario?.NIVEL_ACESSO ||
      usuario?.perfil ||
      usuario?.PERFIL ||
      usuario?.role ||
      usuario?.ROLE ||
      usuario?.tipo ||
      usuario?.TIPO
  );
};

const usuarioEhAdminMaster = (usuario) => {
  const nivel = obterNivelUsuario(usuario);

  return ['0', 'ADMINMASTER', 'MASTER'].includes(nivel);
};

const usuarioEhAdmin = (usuario) => {
  const nivel = obterNivelUsuario(usuario);

  return ['1', 'ADMIN', 'ADMINP4'].includes(nivel);
};

const usuarioEhUsuarioComum = (usuario) => {
  return !usuarioEhAdminMaster(usuario) && !usuarioEhAdmin(usuario);
};

const obterStatusUsuario = (usuario) => {
  return String(
    usuario?.STATUSACESSO ||
      usuario?.statusAcesso ||
      STATUS_ACESSO.LIBERADO
  )
    .trim()
    .toUpperCase();
};

const usuarioAtivoPorStatus = (status) => {
  return status === STATUS_ACESSO.LIBERADO ? 1 : 0;
};

const obterRotuloNivel = (usuario) => {
  if (usuarioEhAdminMaster(usuario)) return 'Admin Master';
  if (usuarioEhAdmin(usuario)) return 'Administrador';
  return 'Usuário comum';
};

const converterNivelParaSalvar = (nivel) => {
  if (String(nivel) === NIVEIS_USUARIO.ADMIN_MASTER) return 0;
  if (String(nivel) === NIVEIS_USUARIO.ADMIN) return 1;
  return 2;
};

function AdminUsuarios({ usuario, onVoltar }) {
  const [unidades] = useState(() => carregarStorage(STORAGE_KEY_UNIDADES));
  const [setores] = useState(() => carregarStorage(STORAGE_KEY_SETORES));
  const [usuarios, setUsuarios] = useState(() =>
    carregarStorage(STORAGE_KEY_USUARIOS)
  );

  const [matricula, setMatricula] = useState('');
  const [nome, setNome] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [postGrad, setPostGrad] = useState('');
  const [nivel, setNivel] = useState(NIVEIS_USUARIO.USUARIO_COMUM);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('');

  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);

  const [modalStatusAberto, setModalStatusAberto] = useState(false);
  const [usuarioParaStatus, setUsuarioParaStatus] = useState(null);
  const [statusSelecionado, setStatusSelecionado] = useState(
    STATUS_ACESSO.PENDENTE
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
  }, [usuarios]);

  const unidadeAdmin = obterUnidadeUsuario(usuario);
  const adminLogadoEhMaster = usuarioEhAdminMaster(usuario);

  const unidadesDisponiveis = useMemo(() => {
    if (adminLogadoEhMaster) return unidades;

    return unidades.filter(
      (unidade) =>
        normalizarTexto(unidade.nome) === normalizarTexto(unidadeAdmin)
    );
  }, [unidades, unidadeAdmin, adminLogadoEhMaster]);

  const setoresDaUnidade = useMemo(() => {
    if (!unidadeSelecionada) return [];

    return setores.filter((setor) => setor.unidadeNome === unidadeSelecionada);
  }, [setores, unidadeSelecionada]);

  const adminPodeVerUsuario = (usuarioAlvo) => {
    if (adminLogadoEhMaster) return true;

    const unidadeAlvo = obterUnidadeUsuario(usuarioAlvo);

    return normalizarTexto(unidadeAdmin) === normalizarTexto(unidadeAlvo);
  };

  const adminPodeEditarUsuario = (usuarioAlvo) => {
    if (adminLogadoEhMaster) return true;

    if (!adminPodeVerUsuario(usuarioAlvo)) return false;

    return usuarioEhUsuarioComum(usuarioAlvo);
  };

  const adminPodeAlterarStatus = (usuarioAlvo) => {
    if (adminLogadoEhMaster) return true;

    if (!adminPodeVerUsuario(usuarioAlvo)) return false;

    return usuarioEhUsuarioComum(usuarioAlvo);
  };

  const adminPodeExcluirUsuario = (usuarioAlvo) => {
    if (adminLogadoEhMaster) return true;

    if (!adminPodeVerUsuario(usuarioAlvo)) return false;

    return usuarioEhUsuarioComum(usuarioAlvo);
  };

  const usuariosVisiveis = useMemo(() => {
    return usuarios.filter((item) => adminPodeVerUsuario(item));
  }, [usuarios, adminLogadoEhMaster, unidadeAdmin]);

  const totalPendentes = useMemo(() => {
    return usuariosVisiveis.filter(
      (item) => obterStatusUsuario(item) === STATUS_ACESSO.PENDENTE
    ).length;
  }, [usuariosVisiveis]);

  const totalLiberados = useMemo(() => {
    return usuariosVisiveis.filter(
      (item) =>
        obterStatusUsuario(item) === STATUS_ACESSO.LIBERADO &&
        Number(item.ATIVO ?? item.ativo ?? 1) === 1
    ).length;
  }, [usuariosVisiveis]);

  const totalBloqueados = useMemo(() => {
    return usuariosVisiveis.filter(
      (item) =>
        obterStatusUsuario(item) === STATUS_ACESSO.BLOQUEADO ||
        Number(item.ATIVO ?? item.ativo ?? 1) !== 1
    ).length;
  }, [usuariosVisiveis]);

  const usuariosOrdenados = useMemo(() => {
    return [...usuariosVisiveis].sort((a, b) => {
      const statusA = obterStatusUsuario(a);
      const statusB = obterStatusUsuario(b);

      if (
        statusA === STATUS_ACESSO.PENDENTE &&
        statusB !== STATUS_ACESSO.PENDENTE
      ) {
        return -1;
      }

      if (
        statusA !== STATUS_ACESSO.PENDENTE &&
        statusB === STATUS_ACESSO.PENDENTE
      ) {
        return 1;
      }

      const unidadeA = String(a.UNIDADE || '').localeCompare(
        String(b.UNIDADE || '')
      );

      if (adminLogadoEhMaster && unidadeA !== 0) return unidadeA;

      return String(a.NOME || '').localeCompare(String(b.NOME || ''));
    });
  }, [usuariosVisiveis, adminLogadoEhMaster]);

  const limparFormulario = () => {
    setMatricula('');
    setNome('');
    setNomeCompleto('');
    setEmail('');
    setSenha('');
    setPostGrad('');
    setNivel(NIVEIS_USUARIO.USUARIO_COMUM);
    setUnidadeSelecionada(adminLogadoEhMaster ? '' : unidadeAdmin);
    setSetorSelecionado('');
    setUsuarioEditando(null);
  };

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    setTimeout(() => {
      setMensagem('');
    }, 3500);
  };

  const handleSalvar = (event) => {
    event.preventDefault();

    const matriculaTratada = formatarMatricula(matricula);
    const nomeTratado = nome.trim();
    const nomeCompletoTratado = nomeCompleto.trim();
    const emailTratado = email.trim();
    const senhaTratada = senha.trim();
    const postGradTratado = postGrad.trim();

    const unidadeFinal = adminLogadoEhMaster
      ? unidadeSelecionada
      : unidadeAdmin;

    const nivelFinal = adminLogadoEhMaster
      ? nivel
      : NIVEIS_USUARIO.USUARIO_COMUM;

    if (usuarioEditando && !adminPodeEditarUsuario(usuarioEditando)) {
      mostrarMensagem(
        'Acesso negado. Administrador comum só pode editar usuário comum da própria unidade.'
      );
      return;
    }

    if (!matriculaTratada) {
      mostrarMensagem('Informe a matrícula.');
      return;
    }

    if (!matriculaValida(matriculaTratada)) {
      mostrarMensagem('A matrícula deve estar no formato 000.000-0.');
      return;
    }

    if (!nomeTratado) {
      mostrarMensagem('Informe o nome de guerra.');
      return;
    }

    if (!nomeCompletoTratado) {
      mostrarMensagem('Informe o nome completo.');
      return;
    }

    if (!postGradTratado) {
      mostrarMensagem('Informe o posto/graduação.');
      return;
    }

    if (!unidadeFinal) {
      mostrarMensagem('Selecione a unidade.');
      return;
    }

    if (!setorSelecionado) {
      mostrarMensagem('Selecione o setor.');
      return;
    }

    if (!usuarioEditando && !senhaTratada) {
      mostrarMensagem('Informe a senha inicial.');
      return;
    }

    if (!adminLogadoEhMaster && normalizarTexto(unidadeFinal) !== normalizarTexto(unidadeAdmin)) {
      mostrarMensagem('Administrador comum não pode cadastrar usuário em outra unidade.');
      return;
    }

    const matriculaJaExiste = usuarios.some(
      (item) =>
        formatarMatricula(item.MATRICULA) === matriculaTratada &&
        item.ID !== usuarioEditando?.ID
    );

    if (matriculaJaExiste) {
      mostrarMensagem('Já existe usuário cadastrado com essa matrícula.');
      return;
    }

    if (usuarioEditando) {
      const unidadeAnterior = usuarioEditando.UNIDADE || '';

      const usuariosAtualizados = usuarios.map((item) =>
        item.ID === usuarioEditando.ID
          ? {
              ...item,
              MATRICULA: matriculaTratada,
              NOME: nomeTratado,
              NOMECOMPLETO: nomeCompletoTratado,
              EMAIL: emailTratado,
              SENHA: senhaTratada || item.SENHA,
              NIVEL: converterNivelParaSalvar(nivelFinal),
              POSTGRAD: postGradTratado,
              SETOR: setorSelecionado,
              UNIDADE: unidadeFinal,
              DATAMODIFICACAO: dataHoraAtual(),
              userModificador: obterIdUsuario(usuario),
              HISTORICO_UNIDADE:
                adminLogadoEhMaster &&
                normalizarTexto(unidadeAnterior) !== normalizarTexto(unidadeFinal)
                  ? [
                      ...(Array.isArray(item.HISTORICO_UNIDADE)
                        ? item.HISTORICO_UNIDADE
                        : []),
                      {
                        unidadeAnterior,
                        unidadeNova: unidadeFinal,
                        alteradoPor: obterIdUsuario(usuario),
                        alteradoPorNome:
                          usuario?.nomeExibicao ||
                          usuario?.NOME ||
                          usuario?.nome ||
                          'Admin Master',
                        dataAlteracao: dataHoraAtual(),
                      },
                    ]
                  : item.HISTORICO_UNIDADE || [],
            }
          : item
      );

      setUsuarios(usuariosAtualizados);
      limparFormulario();

      if (
        adminLogadoEhMaster &&
        normalizarTexto(unidadeAnterior) !== normalizarTexto(unidadeFinal)
      ) {
        mostrarMensagem(
          `Usuário atualizado e transferido para ${unidadeFinal}. Ele passará a acessar somente os dados da nova unidade.`
        );
        return;
      }

      mostrarMensagem('Usuário atualizado com sucesso.');
      return;
    }

    const novoUsuario = {
      ID: gerarId(),
      MATRICULA: matriculaTratada,
      NOME: nomeTratado,
      SENHA: senhaTratada,
      EMAIL: emailTratado,
      NIVEL: converterNivelParaSalvar(nivelFinal),
      POSTGRAD: postGradTratado,
      SETOR: setorSelecionado,
      NOMECOMPLETO: nomeCompletoTratado,
      UNIDADE: unidadeFinal,

      STATUSACESSO: STATUS_ACESSO.LIBERADO,
      ATIVO: 1,
      DATASOLICITACAO: dataHoraAtual(),
      DATALIBERACAO: dataHoraAtual(),
      LIBERADOPOR: obterIdUsuario(usuario),

      DATACADASTRO: dataAtual(),
      DATAMODIFICACAO: dataHoraAtual(),
      userModificador: obterIdUsuario(usuario),
      DIGITAL: null,
      HISTORICO_UNIDADE: [],
    };

    setUsuarios((listaAtual) => [...listaAtual, novoUsuario]);
    limparFormulario();
    mostrarMensagem('Usuário cadastrado com sucesso.');
  };

  const handleEditar = (item) => {
    if (!adminPodeEditarUsuario(item)) {
      mostrarMensagem(
        'Acesso negado. Administrador comum só pode editar usuário comum da própria unidade.'
      );
      return;
    }

    setUsuarioEditando(item);
    setMatricula(formatarMatricula(item.MATRICULA || ''));
    setNome(item.NOME || '');
    setNomeCompleto(item.NOMECOMPLETO || '');
    setEmail(item.EMAIL || '');
    setSenha('');
    setPostGrad(item.POSTGRAD || '');

    if (usuarioEhAdminMaster(item)) {
      setNivel(NIVEIS_USUARIO.ADMIN_MASTER);
    } else if (usuarioEhAdmin(item)) {
      setNivel(NIVEIS_USUARIO.ADMIN);
    } else {
      setNivel(NIVEIS_USUARIO.USUARIO_COMUM);
    }

    setUnidadeSelecionada(item.UNIDADE || '');
    setSetorSelecionado(item.SETOR || '');
  };

  const handleExcluir = (item) => {
    if (!adminPodeExcluirUsuario(item)) {
      mostrarMensagem(
        'Acesso negado. Administrador comum só pode excluir usuário comum da própria unidade.'
      );
      return;
    }

    setUsuarioParaExcluir(item);
    setModalExcluirAberto(true);
  };

  const confirmarExclusao = () => {
    if (!usuarioParaExcluir) return;

    if (!adminPodeExcluirUsuario(usuarioParaExcluir)) {
      mostrarMensagem('Acesso negado para excluir este usuário.');
      cancelarExclusao();
      return;
    }

    const usuariosAtualizados = usuarios.filter(
      (item) => item.ID !== usuarioParaExcluir.ID
    );

    setUsuarios(usuariosAtualizados);
    limparFormulario();
    setModalExcluirAberto(false);
    setUsuarioParaExcluir(null);
    mostrarMensagem('Usuário excluído com sucesso.');
  };

  const cancelarExclusao = () => {
    setModalExcluirAberto(false);
    setUsuarioParaExcluir(null);
  };

  const handleAbrirStatus = (item) => {
    if (!adminPodeAlterarStatus(item)) {
      mostrarMensagem(
        'Acesso negado. Administrador comum só pode alterar status de usuário comum da própria unidade.'
      );
      return;
    }

    setUsuarioParaStatus(item);
    setStatusSelecionado(obterStatusUsuario(item));
    setModalStatusAberto(true);
  };

  const cancelarStatus = () => {
    setModalStatusAberto(false);
    setUsuarioParaStatus(null);
    setStatusSelecionado(STATUS_ACESSO.PENDENTE);
  };

  const confirmarStatus = () => {
    if (!usuarioParaStatus) return;

    if (!adminPodeAlterarStatus(usuarioParaStatus)) {
      mostrarMensagem('Você não tem permissão para alterar o status deste usuário.');
      cancelarStatus();
      return;
    }

    const novoStatus = String(statusSelecionado || STATUS_ACESSO.PENDENTE)
      .trim()
      .toUpperCase();

    const usuariosAtualizados = usuarios.map((item) => {
      if (item.ID !== usuarioParaStatus.ID) {
        return item;
      }

      const acessoLiberado = novoStatus === STATUS_ACESSO.LIBERADO;

      return {
        ...item,
        STATUSACESSO: novoStatus,
        ATIVO: usuarioAtivoPorStatus(novoStatus),
        DATALIBERACAO: acessoLiberado
          ? dataHoraAtual()
          : item.DATALIBERACAO || null,
        LIBERADOPOR: acessoLiberado
          ? obterIdUsuario(usuario)
          : item.LIBERADOPOR || null,
        DATAMODIFICACAO: dataHoraAtual(),
        userModificador: obterIdUsuario(usuario),
      };
    });

    setUsuarios(usuariosAtualizados);
    cancelarStatus();

    if (novoStatus === STATUS_ACESSO.LIBERADO) {
      mostrarMensagem('Acesso liberado com sucesso.');
      return;
    }

    if (novoStatus === STATUS_ACESSO.BLOQUEADO) {
      mostrarMensagem('Acesso bloqueado com sucesso.');
      return;
    }

    mostrarMensagem('Status atualizado para pendente.');
  };

  const obterClasseStatus = (status) => {
    const statusTratado = String(status || STATUS_ACESSO.LIBERADO).toUpperCase();

    if (statusTratado === STATUS_ACESSO.LIBERADO) {
      return 'status-liberado';
    }

    if (statusTratado === STATUS_ACESSO.BLOQUEADO) {
      return 'status-bloqueado';
    }

    return 'status-pendente';
  };

  const obterTextoAtivo = (item) => {
    const status = obterStatusUsuario(item);
    const ativo = Number(item.ATIVO ?? item.ativo ?? 1);

    if (status === STATUS_ACESSO.LIBERADO && ativo === 1) {
      return 'Acesso ativo';
    }

    if (status === STATUS_ACESSO.PENDENTE) {
      return 'Aguardando liberação';
    }

    return 'Acesso inativo';
  };

  return (
    <main className="admin-usuarios-page">
      <section className="admin-usuarios-phone">
        <header className="admin-usuarios-header">
          <button
            type="button"
            className="admin-usuarios-voltar-button"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Área administrativa</span>
            <h1>Usuários</h1>
            <p>
              {adminLogadoEhMaster
                ? 'Admin Master - Todas as unidades'
                : usuario?.unidade || usuario?.UNIDADE || 'Gerenciamento de usuários'}
            </p>
          </div>
        </header>

        <section className="admin-usuarios-boas-vindas">
          <div className="admin-usuarios-boas-vindas-icon">
            <FaUserGear />
          </div>

          <div>
            <span>Cadastro administrativo</span>
            <h2>Gerenciar Usuários</h2>
            <p>
              {adminLogadoEhMaster
                ? 'Você pode gerenciar usuários de todas as unidades, inclusive transferir militar de unidade.'
                : 'Você gerencia somente usuários comuns da sua própria unidade.'}
            </p>
          </div>
        </section>

        {mensagem && <div className="admin-usuarios-mensagem">{mensagem}</div>}

        <section className="admin-usuarios-resumo-status">
          <article
            className={
              totalPendentes > 0
                ? 'admin-usuarios-resumo-card destaque'
                : 'admin-usuarios-resumo-card'
            }
          >
            <strong>{totalPendentes}</strong>
            <span>Pendente(s)</span>
            <small>
              {adminLogadoEhMaster
                ? 'Aguardando liberação em todas as unidades'
                : 'Aguardando liberação na sua unidade'}
            </small>
          </article>

          <article className="admin-usuarios-resumo-card liberado">
            <strong>{totalLiberados}</strong>
            <span>Liberado(s)</span>
            <small>Com acesso ativo ao sistema</small>
          </article>

          <article className="admin-usuarios-resumo-card bloqueado">
            <strong>{totalBloqueados}</strong>
            <span>Bloqueado(s)</span>
            <small>Sem acesso ao aplicativo</small>
          </article>
        </section>

        {totalPendentes > 0 && (
          <div className="admin-usuarios-alerta-pendentes">
            Existem {totalPendentes} usuário(s) aguardando liberação{' '}
            {adminLogadoEhMaster ? (
              <strong>em todas as unidades</strong>
            ) : (
              <>
                na unidade <strong>{unidadeAdmin}</strong>
              </>
            )}
            . Eles aparecem primeiro na lista.
          </div>
        )}

        <section className="admin-usuarios-card">
          <h2>{usuarioEditando ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</h2>

          <form onSubmit={handleSalvar} className="admin-usuarios-form">
            <div className="admin-usuarios-grid">
              <div className="admin-usuarios-form-group">
                <label htmlFor="matricula">Matrícula</label>

                <input
                  id="matricula"
                  type="text"
                  value={matricula}
                  onChange={(event) => {
                    const matriculaFormatada = formatarMatricula(
                      event.target.value
                    );
                    setMatricula(matriculaFormatada);
                  }}
                  placeholder="Ex: 525.709-3"
                  maxLength={9}
                  inputMode="numeric"
                />
              </div>

              <div className="admin-usuarios-form-group">
                <label htmlFor="postGrad">Post/Grad</label>

                <input
                  id="postGrad"
                  type="text"
                  value={postGrad}
                  onChange={(event) => setPostGrad(event.target.value)}
                  placeholder="Ex: SD"
                />
              </div>
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="nome">Nome de Guerra</label>

              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: Lima"
              />
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="nomeCompleto">Nome Completo</label>

              <input
                id="nomeCompleto"
                type="text"
                value={nomeCompleto}
                onChange={(event) => setNomeCompleto(event.target.value)}
                placeholder="Ex: Willames Pereira Lima"
              />
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Ex: usuario@email.com"
              />
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="unidade">Unidade</label>

              <select
                id="unidade"
                value={unidadeSelecionada}
                disabled={!adminLogadoEhMaster}
                onChange={(event) => {
                  setUnidadeSelecionada(event.target.value);
                  setSetorSelecionado('');
                }}
              >
                <option value="">
                  {adminLogadoEhMaster
                    ? 'Selecione uma unidade'
                    : unidadeAdmin || 'Unidade do administrador'}
                </option>

                {unidadesDisponiveis.map((unidade) => (
                  <option key={unidade.id} value={unidade.nome}>
                    {unidade.nome}
                  </option>
                ))}
              </select>

              {!adminLogadoEhMaster && (
                <small className="admin-usuarios-status-texto">
                  Administrador comum não pode trocar unidade de usuário.
                </small>
              )}
            </div>

            {adminLogadoEhMaster && usuarioEditando && (
              <div className="admin-usuarios-alerta-pendentes">
                Atenção: ao trocar a unidade deste usuário, ele passará a
                acessar somente os dados da nova unidade.
              </div>
            )}

            <div className="admin-usuarios-form-group">
              <label htmlFor="setor">Setor</label>

              <select
                id="setor"
                value={setorSelecionado}
                onChange={(event) => setSetorSelecionado(event.target.value)}
                disabled={!unidadeSelecionada}
              >
                <option value="">
                  {unidadeSelecionada
                    ? 'Selecione um setor'
                    : 'Selecione uma unidade primeiro'}
                </option>

                {setoresDaUnidade.map((setor) => (
                  <option key={setor.id} value={setor.nome}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-usuarios-grid">
              <div className="admin-usuarios-form-group">
                <label htmlFor="nivel">Nível</label>

                <select
                  id="nivel"
                  value={nivel}
                  disabled={!adminLogadoEhMaster}
                  onChange={(event) => setNivel(event.target.value)}
                >
                  {adminLogadoEhMaster && (
                    <option value={NIVEIS_USUARIO.ADMIN_MASTER}>
                      Admin Master
                    </option>
                  )}

                  {adminLogadoEhMaster && (
                    <option value={NIVEIS_USUARIO.ADMIN}>Administrador</option>
                  )}

                  <option value={NIVEIS_USUARIO.USUARIO_COMUM}>
                    Usuário comum
                  </option>
                </select>

                {!adminLogadoEhMaster && (
                  <small className="admin-usuarios-status-texto">
                    Administrador comum só cadastra ou edita usuário comum.
                  </small>
                )}
              </div>

              <div className="admin-usuarios-form-group">
                <label htmlFor="senha">Senha</label>

                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder={
                    usuarioEditando ? 'Manter senha atual' : 'Senha inicial'
                  }
                />
              </div>
            </div>

            <div className="admin-usuarios-botoes">
              <button type="submit" className="btn-salvar-usuario">
                {usuarioEditando ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
              </button>

              {usuarioEditando && (
                <button
                  type="button"
                  className="btn-cancelar-usuario"
                  onClick={limparFormulario}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-usuarios-card">
          <div className="admin-usuarios-lista-header">
            <div>
              <h2>Usuários Cadastrados</h2>
              <p>
                Total de {usuariosVisiveis.length} usuário(s){' '}
                {adminLogadoEhMaster
                  ? 'em todas as unidades'
                  : `na unidade ${unidadeAdmin}`}
              </p>
            </div>
          </div>

          {usuariosVisiveis.length === 0 ? (
            <div className="admin-usuarios-vazio">Nenhum usuário cadastrado.</div>
          ) : (
            <div className="admin-usuarios-lista">
              {usuariosOrdenados.map((item) => {
                const status = obterStatusUsuario(item);
                const podeEditar = adminPodeEditarUsuario(item);
                const podeAlterarStatus = adminPodeAlterarStatus(item);
                const podeExcluir = adminPodeExcluirUsuario(item);

                return (
                  <div className="admin-usuarios-item" key={item.ID}>
                    <div className="admin-usuarios-item-info">
                      <div className="admin-usuarios-item-icon">
                        <FaUserGear />
                      </div>

                      <div>
                        <h3>
                          {item.POSTGRAD} {item.NOME}
                        </h3>

                        <p>Matrícula: {formatarMatricula(item.MATRICULA)}</p>

                        <p>
                          <FaBuilding /> {item.UNIDADE}
                        </p>

                        <p>
                          <FaLayerGroup /> {item.SETOR}
                        </p>

                        <div className="admin-usuarios-badges">
                          <span>{obterRotuloNivel(item)}</span>

                          <strong className={obterClasseStatus(status)}>
                            {status}
                          </strong>
                        </div>

                        <small className="admin-usuarios-status-texto">
                          {obterTextoAtivo(item)}
                        </small>
                      </div>
                    </div>

                    <div className="admin-usuarios-item-acoes">
                      {podeEditar && (
                        <button
                          type="button"
                          className="btn-editar-usuario"
                          onClick={() => handleEditar(item)}
                          title="Editar usuário"
                        >
                          <FaPen />
                        </button>
                      )}

                      {podeAlterarStatus && (
                        <button
                          type="button"
                          className="btn-status-usuario"
                          onClick={() => handleAbrirStatus(item)}
                          title="Alterar status"
                        >
                          <FaShieldHalved />
                        </button>
                      )}

                      {podeExcluir && (
                        <button
                          type="button"
                          className="btn-excluir-usuario"
                          onClick={() => handleExcluir(item)}
                          title="Excluir usuário"
                        >
                          <FaTrash />
                        </button>
                      )}

                      {!podeEditar && !podeAlterarStatus && !podeExcluir && (
                        <span
                          className="admin-usuarios-status-texto"
                          title="Ação restrita ao Admin Master"
                        >
                          Restrito
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {modalStatusAberto && (
          <div className="admin-usuarios-modal-overlay">
            <div className="admin-usuarios-modal-card">
              <div className="admin-usuarios-modal-icon status">
                <FaLock />
              </div>

              <h2>Alterar status</h2>

              <p>
                Usuário:{' '}
                <strong>
                  {usuarioParaStatus?.POSTGRAD} {usuarioParaStatus?.NOME}
                </strong>
              </p>

              <p>
                Matrícula:{' '}
                <strong>
                  {formatarMatricula(usuarioParaStatus?.MATRICULA || '')}
                </strong>
              </p>

              <p>
                Unidade: <strong>{usuarioParaStatus?.UNIDADE}</strong>
              </p>

              {!adminPodeAlterarStatus(usuarioParaStatus) && (
                <div className="admin-usuarios-alerta-status">
                  Você não tem permissão para alterar o status deste usuário.
                </div>
              )}

              <div className="admin-usuarios-form-group">
                <label htmlFor="statusAcesso">Status de acesso</label>

                <select
                  id="statusAcesso"
                  value={statusSelecionado}
                  disabled={!adminPodeAlterarStatus(usuarioParaStatus)}
                  onChange={(event) => setStatusSelecionado(event.target.value)}
                >
                  <option value={STATUS_ACESSO.PENDENTE}>Pendente</option>
                  <option value={STATUS_ACESSO.LIBERADO}>Liberado</option>
                  <option value={STATUS_ACESSO.BLOQUEADO}>Bloqueado</option>
                </select>
              </div>

              <div className="admin-usuarios-modal-actions">
                <button
                  type="button"
                  className="admin-usuarios-modal-primary"
                  onClick={confirmarStatus}
                  disabled={!adminPodeAlterarStatus(usuarioParaStatus)}
                >
                  <FaCircleCheck />
                  Salvar status
                </button>

                <button
                  type="button"
                  className="admin-usuarios-modal-secondary"
                  onClick={cancelarStatus}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalExcluirAberto && (
          <div className="admin-usuarios-modal-overlay">
            <div className="admin-usuarios-modal-card">
              <div className="admin-usuarios-modal-icon excluir">
                <FaTrash />
              </div>

              <h2>Excluir usuário?</h2>

              <p>
                Deseja realmente excluir o usuário{' '}
                <strong>
                  {usuarioParaExcluir?.POSTGRAD} {usuarioParaExcluir?.NOME}
                </strong>
                ?
              </p>

              <div className="admin-usuarios-modal-actions">
                <button
                  type="button"
                  className="admin-usuarios-modal-primary"
                  onClick={confirmarExclusao}
                >
                  Sim, excluir
                </button>

                <button
                  type="button"
                  className="admin-usuarios-modal-secondary"
                  onClick={cancelarExclusao}
                >
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

export default AdminUsuarios;