import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowLeft,
  FaBuilding,
  FaCircleCheck,
  FaEnvelope,
  FaLayerGroup,
  FaLock,
  FaPen,
  FaShieldHalved,
  FaTrash,
  FaUserGear,
} from 'react-icons/fa6';
import '../styles/AdminUsuarios.css';
import {
  alterarNivelUsuario,
  alterarStatusUsuario,
  atualizarUsuario,
  cadastrarUsuario,
  excluirUsuario,
  listarUsuarios,
} from '../services/usuarioService';

import {
  listarUnidadesAtivas,
} from '../services/unidadeService';

import {
  listarSetoresAtivos,
} from '../services/setorService';

const STATUS_ACESSO = {
  PENDENTE: 'PENDENTE',
  LIBERADO: 'LIBERADO',
  BLOQUEADO: 'BLOQUEADO',
};

const NIVEIS_USUARIO = {
  ADMIN_MASTER: '1',
  ADMIN: '2',
  USUARIO_COMUM: '3',
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

const emailValido = (valor) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(valor || '').trim()
  );
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

const obterIdUsuario = (usuario) => {
  return usuario?.ID || usuario?.id || 1;
};

const obterUnidadeUsuario = (usuario) => {
  return usuario?.UNIDADE || usuario?.unidade || '';
};

const obterEmailUsuario = (usuario) => {
  const emailUsuario = usuario?.EMAIL || usuario?.email || '';

  return emailUsuario.trim() || 'Não informado';
};

const obterNivelUsuario = (usuario) => {
  return Number(
    usuario?.NIVEL ??
      usuario?.nivel ??
      usuario?.nivelAcesso ??
      usuario?.NIVEL_ACESSO ??
      NIVEIS_USUARIO.USUARIO_COMUM
  );
};

const usuarioEhAdminMaster = (usuario) => {
  return (
    obterNivelUsuario(usuario) ===
    Number(NIVEIS_USUARIO.ADMIN_MASTER)
  );
};

const usuarioEhAdmin = (usuario) => {
  return (
    obterNivelUsuario(usuario) ===
    Number(NIVEIS_USUARIO.ADMIN)
  );
};

const usuarioEhUsuarioComum = (usuario) => {
  return (
    obterNivelUsuario(usuario) ===
    Number(NIVEIS_USUARIO.USUARIO_COMUM)
  );
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
  if (String(nivel) === NIVEIS_USUARIO.ADMIN_MASTER) {
    return 1;
  }

  if (String(nivel) === NIVEIS_USUARIO.ADMIN) {
    return 2;
  }

  return 3;
};


const normalizarLista = (resposta) => {
  if (Array.isArray(resposta)) {
    return resposta;
  }

  if (Array.isArray(resposta?.data)) {
    return resposta.data;
  }

  return [];
};

const obterValorUnidade = (unidade) => {
  return String(
    unidade?.sigla ??
      unidade?.nome ??
      ''
  ).trim();
};

const obterRotuloUnidade = (unidade) => {
  return String(
    unidade?.sigla ??
      unidade?.nome ??
      'Unidade'
  ).trim();
};

function AdminUsuarios({ usuario, onVoltar }) {
  const formularioUsuarioRef = useRef(null);

  const [unidades, setUnidades] = useState([]);
  const [setores, setSetores] = useState([]);

  const [
    carregandoLocalizacoes,
    setCarregandoLocalizacoes,
  ] = useState(true);

  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] =
    useState(true);

  const [matricula, setMatricula] = useState('');
  const [nome, setNome] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [postGrad, setPostGrad] = useState('');
  const [nivel, setNivel] = useState(
    NIVEIS_USUARIO.USUARIO_COMUM
  );
  const [unidadeSelecionada, setUnidadeSelecionada] =
    useState('');
  const [setorSelecionado, setSetorSelecionado] =
    useState('');

  const [usuarioEditando, setUsuarioEditando] =
    useState(null);

  const [mensagem, setMensagem] = useState('');

  const [modalExcluirAberto, setModalExcluirAberto] =
    useState(false);

  const [usuarioParaExcluir, setUsuarioParaExcluir] =
    useState(null);

  const [modalStatusAberto, setModalStatusAberto] =
    useState(false);

  const [usuarioParaStatus, setUsuarioParaStatus] =
    useState(null);

  const [statusSelecionado, setStatusSelecionado] =
    useState(STATUS_ACESSO.PENDENTE);

  const unidadeAdmin = obterUnidadeUsuario(usuario);

  const adminLogadoEhMaster =
    usuarioEhAdminMaster(usuario);

  const unidadeFormulario = adminLogadoEhMaster
    ? unidadeSelecionada
    : unidadeSelecionada || unidadeAdmin;

  useEffect(() => {
    let componenteAtivo = true;

    const carregarUnidadesESetores = async () => {
      try {
        setCarregandoLocalizacoes(true);

        const [
          respostaUnidades,
          respostaSetores,
        ] = await Promise.all([
          listarUnidadesAtivas(),
          listarSetoresAtivos(),
        ]);

        if (!componenteAtivo) {
          return;
        }

        const unidadesRecebidas =
          normalizarLista(respostaUnidades);

        const setoresRecebidos =
          normalizarLista(respostaSetores);

        setUnidades(
          unidadesRecebidas.sort((a, b) =>
            obterRotuloUnidade(a).localeCompare(
              obterRotuloUnidade(b),
              'pt-BR'
            )
          )
        );

        setSetores(
          setoresRecebidos.sort((a, b) =>
            String(a?.nome || '').localeCompare(
              String(b?.nome || ''),
              'pt-BR'
            )
          )
        );
      } catch (erro) {
        if (componenteAtivo) {
          setUnidades([]);
          setSetores([]);

          setMensagem(
            erro?.message ||
              'Não foi possível carregar as unidades e os setores.'
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoLocalizacoes(false);
        }
      }
    };

    carregarUnidadesESetores();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  useEffect(() => {
    const carregarUsuariosBackend = async () => {
      try {
        setCarregandoUsuarios(true);

        const dados = await listarUsuarios();

        setUsuarios(
          Array.isArray(dados) ? dados : []
        );
      } catch (erro) {
        setUsuarios([]);

        setMensagem(
          erro?.message ||
            'Não foi possível carregar os usuários.'
        );
      } finally {
        setCarregandoUsuarios(false);
      }
    };

    carregarUsuariosBackend();
  }, []);

  const unidadesDisponiveis = useMemo(() => {
    if (adminLogadoEhMaster) {
      return unidades;
    }

    const unidadeAdminNormalizada =
      normalizarTexto(unidadeAdmin);

    return unidades.filter((unidade) => {
      const nome = normalizarTexto(
        unidade?.nome
      );

      const sigla = normalizarTexto(
        unidade?.sigla
      );

      return (
        nome === unidadeAdminNormalizada ||
        sigla === unidadeAdminNormalizada
      );
    });
  }, [
    unidades,
    unidadeAdmin,
    adminLogadoEhMaster,
  ]);

  const setoresDaUnidade = useMemo(() => {
    if (!unidadeFormulario) {
      return [];
    }

    const unidadeNormalizada =
      normalizarTexto(unidadeFormulario);

    return setores.filter((setor) => {
      const unidadeNome =
        normalizarTexto(
          setor?.unidadeNome ??
            setor?.unidade?.nome ??
            setor?.nomeUnidade ??
            ''
        );

      const unidadeSigla =
        normalizarTexto(
          setor?.unidadeSigla ??
            setor?.unidade?.sigla ??
            setor?.UNIDADE ??
            ''
        );

      return (
        unidadeNome === unidadeNormalizada ||
        unidadeSigla === unidadeNormalizada
      );
    });
  }, [setores, unidadeFormulario]);

  const adminPodeVerUsuario = (usuarioAlvo) => {
    if (adminLogadoEhMaster) {
      return true;
    }

    const unidadeAlvo =
      obterUnidadeUsuario(usuarioAlvo);

    return (
      normalizarTexto(unidadeAdmin) ===
      normalizarTexto(unidadeAlvo)
    );
  };

  const adminPodeEditarUsuario = (usuarioAlvo) => {
    if (adminLogadoEhMaster) {
      return true;
    }

    if (!adminPodeVerUsuario(usuarioAlvo)) {
      return false;
    }

    return usuarioEhUsuarioComum(usuarioAlvo);
  };

  const adminPodeAlterarStatus = (usuarioAlvo) => {
    if (adminLogadoEhMaster) {
      return true;
    }

    if (!adminPodeVerUsuario(usuarioAlvo)) {
      return false;
    }

    return usuarioEhUsuarioComum(usuarioAlvo);
  };

  const adminPodeExcluirUsuario = () => {
    return adminLogadoEhMaster;
  };

  const usuariosVisiveis = useMemo(() => {
    return usuarios.filter((item) => {
      if (adminLogadoEhMaster) {
        return true;
      }

      const unidadeAlvo =
        obterUnidadeUsuario(item);

      return (
        normalizarTexto(unidadeAdmin) ===
        normalizarTexto(unidadeAlvo)
      );
    });
  }, [
    usuarios,
    adminLogadoEhMaster,
    unidadeAdmin,
  ]);

  const totalPendentes = useMemo(() => {
    return usuariosVisiveis.filter(
      (item) =>
        obterStatusUsuario(item) ===
        STATUS_ACESSO.PENDENTE
    ).length;
  }, [usuariosVisiveis]);

  const totalLiberados = useMemo(() => {
    return usuariosVisiveis.filter(
      (item) =>
        obterStatusUsuario(item) ===
          STATUS_ACESSO.LIBERADO &&
        Number(item.ATIVO ?? item.ativo ?? 1) === 1
    ).length;
  }, [usuariosVisiveis]);

  const totalBloqueados = useMemo(() => {
    return usuariosVisiveis.filter(
      (item) =>
        obterStatusUsuario(item) ===
          STATUS_ACESSO.BLOQUEADO ||
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

      const unidadeA = String(
        a.UNIDADE || a.unidade || ''
      ).localeCompare(
        String(b.UNIDADE || b.unidade || '')
      );

      if (
        adminLogadoEhMaster &&
        unidadeA !== 0
      ) {
        return unidadeA;
      }

      return String(
        a.NOME || a.nome || ''
      ).localeCompare(
        String(b.NOME || b.nome || '')
      );
    });
  }, [
    usuariosVisiveis,
    adminLogadoEhMaster,
  ]);

  const limparFormulario = () => {
    setMatricula('');
    setNome('');
    setNomeCompleto('');
    setEmail('');
    setSenha('');
    setPostGrad('');
    setNivel(NIVEIS_USUARIO.USUARIO_COMUM);

    setUnidadeSelecionada(
      adminLogadoEhMaster ? '' : unidadeAdmin
    );

    setSetorSelecionado('');
    setUsuarioEditando(null);
  };

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    setTimeout(() => {
      setMensagem('');
    }, 3500);
  };

  const obterNivelFinalParaSalvar = () => {
    if (adminLogadoEhMaster) {
      return nivel;
    }

    if (!usuarioEditando) {
      return NIVEIS_USUARIO.USUARIO_COMUM;
    }

    if (usuarioEhUsuarioComum(usuarioEditando)) {
      if (
        String(nivel) ===
        NIVEIS_USUARIO.ADMIN
      ) {
        return NIVEIS_USUARIO.ADMIN;
      }

      return NIVEIS_USUARIO.USUARIO_COMUM;
    }

    return NIVEIS_USUARIO.USUARIO_COMUM;
  };

  const handleSalvar = async (event) => {
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

    const nivelFinal = obterNivelFinalParaSalvar();

    if (
      usuarioEditando &&
      !adminPodeEditarUsuario(usuarioEditando)
    ) {
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
      mostrarMensagem(
        'A matrícula deve estar no formato 000.000-0.'
      );
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

    if (!emailTratado) {
      mostrarMensagem(
        'Informe o e-mail cadastrado do usuário.'
      );
      return;
    }

    if (!emailValido(emailTratado)) {
      mostrarMensagem('Informe um e-mail válido.');
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

    if (
      !adminLogadoEhMaster &&
      normalizarTexto(unidadeFinal) !==
        normalizarTexto(unidadeAdmin)
    ) {
      mostrarMensagem(
        'Administrador comum não pode cadastrar usuário em outra unidade.'
      );
      return;
    }

    if (
      !adminLogadoEhMaster &&
      String(nivelFinal) === NIVEIS_USUARIO.ADMIN_MASTER
    ) {
      mostrarMensagem(
        'Administrador comum não pode criar Admin Master.'
      );
      return;
    }

    const matriculaJaExiste = usuarios.some(
      (item) =>
        formatarMatricula(
          item.MATRICULA || item.matricula
        ) === matriculaTratada &&
        String(obterIdUsuario(item)) !==
          String(obterIdUsuario(usuarioEditando))
    );

    if (matriculaJaExiste) {
      mostrarMensagem(
        'Já existe usuário cadastrado com essa matrícula.'
      );
      return;
    }

    if (usuarioEditando) {
      const unidadeAnterior =
        usuarioEditando.UNIDADE ||
        usuarioEditando.unidade ||
        '';
    
      const nivelAnterior =
        obterNivelUsuario(usuarioEditando);
    
      const novoNivel =
        converterNivelParaSalvar(nivelFinal);
    
      try {
        let usuarioAtualizado = await atualizarUsuario(
          obterIdUsuario(usuarioEditando),
          {
            matricula: matriculaTratada,
            nome: nomeTratado,
            senha: senhaTratada,
            email: emailTratado,
            nivel: novoNivel,
            postGrad: postGradTratado,
            setor: setorSelecionado,
            nomeCompleto: nomeCompletoTratado,
            unidade: unidadeFinal,
            statusAcesso:
              obterStatusUsuario(usuarioEditando),
          }
        );
    
        if (nivelAnterior !== novoNivel) {
          usuarioAtualizado =
            await alterarNivelUsuario(
              obterIdUsuario(usuarioEditando),
              novoNivel
            );
        }
    
        setUsuarios((listaAtual) =>
          listaAtual.map((item) =>
            String(obterIdUsuario(item)) ===
            String(obterIdUsuario(usuarioAtualizado))
              ? usuarioAtualizado
              : item
          )
        );
    
        limparFormulario();
    
        if (
          adminLogadoEhMaster &&
          normalizarTexto(unidadeAnterior) !==
            normalizarTexto(unidadeFinal)
        ) {
          mostrarMensagem(
            `Usuário atualizado e transferido para ${unidadeFinal}.`
          );
    
          return;
        }
    
        if (nivelAnterior !== novoNivel) {
          mostrarMensagem(
            'Usuário atualizado e nível alterado com sucesso.'
          );
    
          return;
        }
    
        mostrarMensagem(
          'Usuário atualizado com sucesso.'
        );
      } catch (erro) {
        mostrarMensagem(
          erro?.message ||
            'Não foi possível atualizar o usuário.'
        );
      }
    
      return;
    }

    try {
      const usuarioCadastrado = await cadastrarUsuario({
        matricula: matriculaTratada,
        nome: nomeTratado,
        senha: senhaTratada,
        email: emailTratado,
        nivel: converterNivelParaSalvar(nivelFinal),
        postGrad: postGradTratado,
        setor: setorSelecionado,
        nomeCompleto: nomeCompletoTratado,
        unidade: unidadeFinal,
        statusAcesso: STATUS_ACESSO.LIBERADO,
      });

      setUsuarios((listaAtual) => [
        ...listaAtual,
        usuarioCadastrado,
      ]);

      limparFormulario();
      mostrarMensagem('Usuário cadastrado com sucesso.');
    } catch (erro) {
      mostrarMensagem(
        erro?.message ||
          'Não foi possível cadastrar o usuário.'
      );
    }
  };

  const handleEditar = (item) => {
    if (!adminPodeEditarUsuario(item)) {
      mostrarMensagem(
        'Acesso negado. Administrador comum só pode editar usuário comum da própria unidade.'
      );

      return;
    }

    setUsuarioEditando(item);

    setMatricula(
      formatarMatricula(
        item.MATRICULA ||
          item.matricula ||
          ''
      )
    );

    setNome(
      item.NOME ||
        item.nome ||
        ''
    );

    setNomeCompleto(
      item.NOMECOMPLETO ||
        item.nomeCompleto ||
        ''
    );

    setEmail(
      item.EMAIL ||
        item.email ||
        ''
    );

    setSenha('');

    setPostGrad(
      item.POSTGRAD ||
        item.postGrad ||
        ''
    );

    if (usuarioEhAdminMaster(item)) {
      setNivel(
        NIVEIS_USUARIO.ADMIN_MASTER
      );
    } else if (usuarioEhAdmin(item)) {
      setNivel(
        NIVEIS_USUARIO.ADMIN
      );
    } else {
      setNivel(
        NIVEIS_USUARIO.USUARIO_COMUM
      );
    }

    setUnidadeSelecionada(
      item.UNIDADE ||
        item.unidade ||
        ''
    );

    setSetorSelecionado(
      item.SETOR ||
        item.setor ||
        ''
    );

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        formularioUsuarioRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  };

  const handleExcluir = (item) => {
    if (!adminPodeExcluirUsuario(item)) {
      mostrarMensagem(
        'Acesso negado. Somente Admin Master pode excluir usuários.'
      );

      return;
    }

    setUsuarioParaExcluir(item);
    setModalExcluirAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!usuarioParaExcluir) {
      return;
    }
  
    if (
      !adminPodeExcluirUsuario(
        usuarioParaExcluir
      )
    ) {
      mostrarMensagem(
        'Acesso negado para excluir este usuário.'
      );
  
      cancelarExclusao();
  
      return;
    }
  
    try {
      const idUsuarioExcluir =
        obterIdUsuario(usuarioParaExcluir);
  
      await excluirUsuario(idUsuarioExcluir);
  
      setUsuarios((listaAtual) =>
        listaAtual.filter(
          (item) =>
            String(obterIdUsuario(item)) !==
            String(idUsuarioExcluir)
        )
      );
  
      limparFormulario();
  
      setModalExcluirAberto(false);
      setUsuarioParaExcluir(null);
  
      mostrarMensagem(
        'Usuário excluído com sucesso.'
      );
    } catch (erro) {
      mostrarMensagem(
        erro?.message ||
          'Não foi possível excluir o usuário.'
      );
    }
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

    setStatusSelecionado(
      obterStatusUsuario(item)
    );

    setModalStatusAberto(true);
  };

  const cancelarStatus = () => {
    setModalStatusAberto(false);
    setUsuarioParaStatus(null);

    setStatusSelecionado(
      STATUS_ACESSO.PENDENTE
    );
  };

  const confirmarStatus = async () => {
    if (!usuarioParaStatus) {
      return;
    }
  
    if (!adminPodeAlterarStatus(usuarioParaStatus)) {
      mostrarMensagem(
        'Você não tem permissão para alterar o status deste usuário.'
      );
  
      cancelarStatus();
  
      return;
    }
  
    const novoStatus = String(
      statusSelecionado || STATUS_ACESSO.PENDENTE
    )
      .trim()
      .toUpperCase();
  
    try {
      const usuarioAtualizado = await alterarStatusUsuario(
        obterIdUsuario(usuarioParaStatus),
        novoStatus
      );
  
      setUsuarios((listaAtual) =>
        listaAtual.map((item) =>
          String(obterIdUsuario(item)) ===
          String(obterIdUsuario(usuarioAtualizado))
            ? usuarioAtualizado
            : item
        )
      );
  
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
    } catch (erro) {
      mostrarMensagem(
        erro?.message ||
          'Não foi possível alterar o status do usuário.'
      );
    }
  };

  const obterClasseStatus = (status) => {
    const statusTratado = String(
      status || STATUS_ACESSO.LIBERADO
    ).toUpperCase();

    if (
      statusTratado ===
      STATUS_ACESSO.LIBERADO
    ) {
      return 'status-liberado';
    }

    if (
      statusTratado ===
      STATUS_ACESSO.BLOQUEADO
    ) {
      return 'status-bloqueado';
    }

    return 'status-pendente';
  };

  const obterTextoAtivo = (item) => {
    const status = obterStatusUsuario(item);

    const ativo = Number(
      item.ATIVO ??
        item.ativo ??
        1
    );

    if (
      status === STATUS_ACESSO.LIBERADO &&
      ativo === 1
    ) {
      return 'Acesso ativo';
    }

    if (
      status === STATUS_ACESSO.PENDENTE
    ) {
      return 'Aguardando liberação';
    }

    return 'Acesso inativo';
  };

  const campoNivelPodeSerAlterado =
    adminLogadoEhMaster ||
    (usuarioEditando &&
      usuarioEhUsuarioComum(usuarioEditando));

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
                : usuario?.unidade ||
                  usuario?.UNIDADE ||
                  'Gerenciamento de usuários'}
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
                : 'Você gerencia usuários comuns da sua unidade e pode elevar usuário comum para administrador.'}
            </p>
          </div>
        </section>

        {mensagem && (
          <div className="admin-usuarios-mensagem">
            {mensagem}
          </div>
        )}

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

            <small>
              Com acesso ativo ao sistema
            </small>
          </article>

          <article className="admin-usuarios-resumo-card bloqueado">
            <strong>{totalBloqueados}</strong>
            <span>Bloqueado(s)</span>

            <small>
              Sem acesso ao aplicativo
            </small>
          </article>
        </section>

        {totalPendentes > 0 && (
          <div className="admin-usuarios-alerta-pendentes">
            Existem {totalPendentes} usuário(s)
            aguardando liberação{' '}

            {adminLogadoEhMaster ? (
              <strong>
                em todas as unidades
              </strong>
            ) : (
              <>
                na unidade{' '}
                <strong>{unidadeAdmin}</strong>
              </>
            )}
            . Eles aparecem primeiro na lista.
          </div>
        )}

        <section
          ref={formularioUsuarioRef}
          className="admin-usuarios-card"
        >
          <h2>
            {usuarioEditando
              ? 'Editar Usuário'
              : 'Cadastrar Novo Usuário'}
          </h2>

          <form
            onSubmit={handleSalvar}
            className="admin-usuarios-form"
          >
            <div className="admin-usuarios-grid">
              <div className="admin-usuarios-form-group">
                <label htmlFor="matricula">
                  Matrícula
                </label>

                <input
                  id="matricula"
                  type="text"
                  value={matricula}
                  onChange={(event) => {
                    setMatricula(
                      formatarMatricula(
                        event.target.value
                      )
                    );
                  }}
                  placeholder="Ex: 000.000-0"
                  maxLength={9}
                  inputMode="numeric"
                />
              </div>

              <div className="admin-usuarios-form-group">
                <label htmlFor="postGrad">
                  Post/Grad
                </label>

                <input
                  id="postGrad"
                  type="text"
                  value={postGrad}
                  onChange={(event) =>
                    setPostGrad(
                      event.target.value
                    )
                  }
                  placeholder="Ex: SD"
                />
              </div>
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="nome">
                Nome de Guerra
              </label>

              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(event) =>
                  setNome(event.target.value)
                }
                placeholder="Ex: José"
              />
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="nomeCompleto">
                Nome Completo
              </label>

              <input
                id="nomeCompleto"
                type="text"
                value={nomeCompleto}
                onChange={(event) =>
                  setNomeCompleto(
                    event.target.value
                  )
                }
                placeholder="Ex: José da Silva"
              />
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="email">
                E-mail obrigatório
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Ex: usuario@email.com"
                required
              />
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="unidade">
                Unidade
              </label>

              <select
                id="unidade"
                value={unidadeFormulario}
                disabled={
                  !adminLogadoEhMaster ||
                  carregandoLocalizacoes
                }
                onChange={(event) => {
                  setUnidadeSelecionada(
                    event.target.value
                  );

                  setSetorSelecionado('');
                }}
              >
                <option value="">
                  {carregandoLocalizacoes
                    ? 'Carregando unidades...'
                    : adminLogadoEhMaster
                      ? 'Selecione uma unidade'
                      : unidadeAdmin ||
                        'Unidade do administrador'}
                </option>

                {unidadesDisponiveis.map(
                  (unidade) => {
                    const valor =
                      obterValorUnidade(unidade);

                    return (
                      <option
                        key={
                          unidade.id ??
                          valor
                        }
                        value={valor}
                      >
                        {obterRotuloUnidade(
                          unidade
                        )}
                      </option>
                    );
                  }
                )}
              </select>

              {!adminLogadoEhMaster && (
                <small className="admin-usuarios-status-texto">
                  Administrador comum não pode
                  trocar unidade de usuário.
                </small>
              )}
            </div>

            {adminLogadoEhMaster &&
              usuarioEditando && (
                <div className="admin-usuarios-alerta-pendentes">
                  Atenção: ao trocar a unidade
                  deste usuário, ele passará a
                  acessar somente os dados da
                  nova unidade.
                </div>
              )}

            <div className="admin-usuarios-form-group">
              <label htmlFor="setor">
                Setor/Função
              </label>

              <select
                id="setor"
                value={setorSelecionado}
                onChange={(event) =>
                  setSetorSelecionado(
                    event.target.value
                  )
                }
                disabled={
                  !unidadeFormulario ||
                  carregandoLocalizacoes
                }
              >
                <option value="">
                  {carregandoLocalizacoes
                    ? 'Carregando setores...'
                    : unidadeFormulario
                      ? 'Selecione um setor'
                      : 'Selecione uma unidade primeiro'}
                </option>

                {setoresDaUnidade.map(
                  (setor) => (
                    <option
                      key={setor.id}
                      value={setor.nome}
                    >
                      {setor.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="admin-usuarios-grid">
              <div className="admin-usuarios-form-group">
                <label htmlFor="nivel">
                  Nível
                </label>

                <select
                  id="nivel"
                  value={nivel}
                  disabled={
                    !campoNivelPodeSerAlterado
                  }
                  onChange={(event) =>
                    setNivel(
                      event.target.value
                    )
                  }
                >
                  {adminLogadoEhMaster && (
                    <option
                      value={
                        NIVEIS_USUARIO.ADMIN_MASTER
                      }
                    >
                      Admin Master
                    </option>
                  )}

                  {(adminLogadoEhMaster ||
                    (usuarioEditando &&
                      usuarioEhUsuarioComum(
                        usuarioEditando
                      ))) && (
                    <option
                      value={
                        NIVEIS_USUARIO.ADMIN
                      }
                    >
                      Administrador
                    </option>
                  )}

                  <option
                    value={
                      NIVEIS_USUARIO.USUARIO_COMUM
                    }
                  >
                    Usuário comum
                  </option>
                </select>

                {!adminLogadoEhMaster && (
                  <small className="admin-usuarios-status-texto">
                    Administrador comum pode elevar
                    usuário comum da própria unidade
                    para administrador, mas não pode
                    rebaixar outro administrador.
                  </small>
                )}
              </div>

              <div className="admin-usuarios-form-group">
                <label htmlFor="senha">
                  Senha
                </label>

                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(event) =>
                    setSenha(
                      event.target.value
                    )
                  }
                  placeholder={
                    usuarioEditando
                      ? 'Senha do usuário'
                      : 'Senha inicial'
                  }
                />
              </div>
            </div>

            <div className="admin-usuarios-botoes">
              <button
                type="submit"
                className="btn-salvar-usuario"
              >
                {usuarioEditando
                  ? 'Atualizar Usuário'
                  : 'Cadastrar Usuário'}
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
              <h2>
                Usuários Cadastrados
              </h2>

              <p>
                Total de{' '}
                {usuariosVisiveis.length}{' '}
                usuário(s){' '}

                {adminLogadoEhMaster
                  ? 'em todas as unidades'
                  : `na unidade ${unidadeAdmin}`}
              </p>
            </div>
          </div>

          {carregandoUsuarios ? (
            <div className="admin-usuarios-vazio">
              Carregando usuários...
            </div>
          ) : usuariosVisiveis.length === 0 ? (
            <div className="admin-usuarios-vazio">
              Nenhum usuário cadastrado.
            </div>
          ) : (
            <div className="admin-usuarios-lista">
              {usuariosOrdenados.map((item) => {
                const status =
                  obterStatusUsuario(item);

                const podeEditar =
                  adminPodeEditarUsuario(item);

                const podeAlterarStatus =
                  adminPodeAlterarStatus(item);

                const podeExcluir =
                  adminPodeExcluirUsuario(item);

                return (
                  <div
                    className="admin-usuarios-item"
                    key={obterIdUsuario(item)}
                  >
                    <div className="admin-usuarios-item-info">
                      <div className="admin-usuarios-item-icon">
                        <FaUserGear />
                      </div>

                      <div>
                        <h3>
                          {item.POSTGRAD ||
                            item.postGrad}{' '}

                          {item.NOME ||
                            item.nome}
                        </h3>

                        <p>
                          Matrícula:{' '}

                          {formatarMatricula(
                            item.MATRICULA ||
                              item.matricula
                          )}
                        </p>

                        <p>
                          <FaEnvelope />{' '}
                          {obterEmailUsuario(
                            item
                          )}
                        </p>

                        <p>
                          <FaBuilding />{' '}

                          {item.UNIDADE ||
                            item.unidade}
                        </p>

                        <p>
                          <FaLayerGroup />{' '}

                          {item.SETOR ||
                            item.setor}
                        </p>

                        <div className="admin-usuarios-badges">
                          <span>
                            {obterRotuloNivel(
                              item
                            )}
                          </span>

                          <strong
                            className={obterClasseStatus(
                              status
                            )}
                          >
                            {status}
                          </strong>
                        </div>

                        <small className="admin-usuarios-status-texto">
                          {obterTextoAtivo(
                            item
                          )}
                        </small>
                      </div>
                    </div>

                    <div className="admin-usuarios-item-acoes">
                      {podeEditar && (
                        <button
                          type="button"
                          className="btn-editar-usuario"
                          onClick={() =>
                            handleEditar(item)
                          }
                          title="Editar usuário"
                        >
                          <FaPen />
                        </button>
                      )}

                      {podeAlterarStatus && (
                        <button
                          type="button"
                          className="btn-status-usuario"
                          onClick={() =>
                            handleAbrirStatus(
                              item
                            )
                          }
                          title="Alterar status"
                        >
                          <FaShieldHalved />
                        </button>
                      )}

                      {podeExcluir && (
                        <button
                          type="button"
                          className="btn-excluir-usuario"
                          onClick={() =>
                            handleExcluir(item)
                          }
                          title="Excluir usuário"
                        >
                          <FaTrash />
                        </button>
                      )}

                      {!podeEditar &&
                        !podeAlterarStatus &&
                        !podeExcluir && (
                          <span
                            className="admin-usuarios-status-texto"
                            title="Ação restrita"
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
                  {usuarioParaStatus?.POSTGRAD ||
                    usuarioParaStatus?.postGrad}{' '}

                  {usuarioParaStatus?.NOME ||
                    usuarioParaStatus?.nome}
                </strong>
              </p>

              <p>
                Matrícula:{' '}

                <strong>
                  {formatarMatricula(
                    usuarioParaStatus?.MATRICULA ||
                      usuarioParaStatus?.matricula ||
                      ''
                  )}
                </strong>
              </p>

              <p>
                Unidade:{' '}

                <strong>
                  {usuarioParaStatus?.UNIDADE ||
                    usuarioParaStatus?.unidade}
                </strong>
              </p>

              {!adminPodeAlterarStatus(
                usuarioParaStatus
              ) && (
                <div className="admin-usuarios-alerta-status">
                  Você não tem permissão para
                  alterar o status deste usuário.
                </div>
              )}

              <div className="admin-usuarios-form-group">
                <label htmlFor="statusAcesso">
                  Status de acesso
                </label>

                <select
                  id="statusAcesso"
                  value={statusSelecionado}
                  disabled={
                    !adminPodeAlterarStatus(
                      usuarioParaStatus
                    )
                  }
                  onChange={(event) =>
                    setStatusSelecionado(
                      event.target.value
                    )
                  }
                >
                  <option
                    value={
                      STATUS_ACESSO.PENDENTE
                    }
                  >
                    Pendente
                  </option>

                  <option
                    value={
                      STATUS_ACESSO.LIBERADO
                    }
                  >
                    Liberado
                  </option>

                  <option
                    value={
                      STATUS_ACESSO.BLOQUEADO
                    }
                  >
                    Bloqueado
                  </option>
                </select>
              </div>

              <div className="admin-usuarios-modal-actions">
                <button
                  type="button"
                  className="admin-usuarios-modal-primary"
                  onClick={confirmarStatus}
                  disabled={
                    !adminPodeAlterarStatus(
                      usuarioParaStatus
                    )
                  }
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
                  {usuarioParaExcluir?.POSTGRAD ||
                    usuarioParaExcluir?.postGrad}{' '}

                  {usuarioParaExcluir?.NOME ||
                    usuarioParaExcluir?.nome}
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