import { useState } from 'react';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
  FaUserPlus,
  FaEnvelope,
  FaKey,
  FaTimes,
} from 'react-icons/fa';
import rpmontBrasao from '../assets/RPMONT.png';
import '../styles/Login.css';

const STORAGE_KEY_USUARIOS = 'usuarios';

const NIVEIS_USUARIO = {
  ADMIN_MASTER: 1,
  ADMIN: 2,
  USUARIO_COMUM: 3,
};

const criarUsuariosIniciais = () => {
  const agora = new Date();

  return [
    {
      ID: 1,
      MATRICULA: '525.709-3',
      NOME: 'willames',
      SENHA: '123456',
      EMAIL: 'illaap@hotmail.com',
      NIVEL: NIVEIS_USUARIO.ADMIN_MASTER,
      POSTGRAD: 'CB',
      SETOR: 'P4',
      NOMECOMPLETO: 'Willames Pereira de Lima',
      UNIDADE: 'RPMont',
      STATUSACESSO: 'LIBERADO',
      ATIVO: 1,
      DATASOLICITACAO: agora.toISOString(),
      DATALIBERACAO: agora.toISOString(),
      LIBERADOPOR: 1,
      DATACADASTRO: agora.toISOString().slice(0, 10),
      DATAMODIFICACAO: agora.toISOString(),
      userModificador: 1,
      DIGITAL: null,
    },
    {
      ID: 2,
      MATRICULA: '530.381-8',
      NOME: 'Nascimento',
      SENHA: '123456',
      EMAIL: '',
      NIVEL: NIVEIS_USUARIO.ADMIN,
      POSTGRAD: '1Ten',
      SETOR: 'P4',
      NOMECOMPLETO: 'Nome completo do militar',
      UNIDADE: 'RPMont',
      STATUSACESSO: 'LIBERADO',
      ATIVO: 1,
      DATASOLICITACAO: agora.toISOString(),
      DATALIBERACAO: agora.toISOString(),
      LIBERADOPOR: 1,
      DATACADASTRO: agora.toISOString().slice(0, 10),
      DATAMODIFICACAO: agora.toISOString(),
      userModificador: 1,
      DIGITAL: null,
    },
  ];
};

function Login({ onLoginSuccess, onSolicitarAcesso }) {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState('');
  const [recuperacaoSucesso, setRecuperacaoSucesso] = useState(false);

  const formatarMatricula = (valor) => {
    const apenasNumeros = String(valor || '')
      .replace(/\D/g, '')
      .slice(0, 7);

    if (apenasNumeros.length <= 3) {
      return apenasNumeros;
    }

    if (apenasNumeros.length <= 6) {
      return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3)}`;
    }

    return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(
      3,
      6
    )}-${apenasNumeros.slice(6)}`;
  };

  const normalizarMatricula = (valor) => {
    return String(valor || '').replace(/\D/g, '');
  };

  const normalizarEmail = (valor) => {
    return String(valor || '').trim().toLowerCase();
  };

  const normalizarStatusAcesso = (valor) => {
    return String(valor || 'LIBERADO').trim().toUpperCase();
  };

  const gerarSenhaSeisDigitos = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
  };

  const carregarUsuariosCadastrados = () => {
    const usuariosIniciais = criarUsuariosIniciais();
    const usuariosSalvos = localStorage.getItem(STORAGE_KEY_USUARIOS);

    let usuariosAtuais = [];

    if (usuariosSalvos) {
      try {
        const dadosConvertidos = JSON.parse(usuariosSalvos);

        if (Array.isArray(dadosConvertidos)) {
          usuariosAtuais = dadosConvertidos;
        }
      } catch {
        usuariosAtuais = [];
      }
    }

    const usuariosAtualizados = [...usuariosAtuais];

    usuariosIniciais.forEach((usuarioInicial) => {
      const matriculaInicial = normalizarMatricula(usuarioInicial.MATRICULA);

      const indiceUsuarioExistente = usuariosAtualizados.findIndex(
        (usuarioAtual) =>
          normalizarMatricula(
            usuarioAtual.MATRICULA || usuarioAtual.matricula
          ) === matriculaInicial
      );

      if (indiceUsuarioExistente >= 0) {
        const usuarioExistente = usuariosAtualizados[indiceUsuarioExistente];

        const matriculaExistente = normalizarMatricula(
          usuarioExistente.MATRICULA || usuarioExistente.matricula
        );

        const usuarioWillamesTeste = matriculaExistente === '5257093';

        usuariosAtualizados[indiceUsuarioExistente] = {
          ...usuarioExistente,

          ID: usuarioExistente.ID ?? usuarioInicial.ID,
          MATRICULA: usuarioExistente.MATRICULA ?? usuarioInicial.MATRICULA,
          NOME: usuarioExistente.NOME ?? usuarioInicial.NOME,
          SENHA: usuarioExistente.SENHA ?? usuarioInicial.SENHA,
          EMAIL: usuarioExistente.EMAIL ?? usuarioInicial.EMAIL,
          POSTGRAD: usuarioExistente.POSTGRAD ?? usuarioInicial.POSTGRAD,
          SETOR: usuarioWillamesTeste
            ? 'P4'
            : usuarioExistente.SETOR ?? usuarioInicial.SETOR,
          NOMECOMPLETO:
            usuarioExistente.NOMECOMPLETO ?? usuarioInicial.NOMECOMPLETO,
          UNIDADE: usuarioWillamesTeste
            ? 'RPMont'
            : usuarioExistente.UNIDADE ?? usuarioInicial.UNIDADE,

          NIVEL: usuarioWillamesTeste
            ? NIVEIS_USUARIO.ADMIN_MASTER
            : usuarioExistente.NIVEL ?? usuarioInicial.NIVEL,

          STATUSACESSO:
            usuarioExistente.STATUSACESSO ||
            usuarioExistente.statusAcesso ||
            usuarioInicial.STATUSACESSO,

          ATIVO:
            usuarioExistente.ATIVO ??
            usuarioExistente.ativo ??
            usuarioInicial.ATIVO,

          DATASOLICITACAO:
            usuarioExistente.DATASOLICITACAO ?? usuarioInicial.DATASOLICITACAO,
          DATALIBERACAO:
            usuarioExistente.DATALIBERACAO ?? usuarioInicial.DATALIBERACAO,
          LIBERADOPOR:
            usuarioExistente.LIBERADOPOR ?? usuarioInicial.LIBERADOPOR,
          DATACADASTRO:
            usuarioExistente.DATACADASTRO ?? usuarioInicial.DATACADASTRO,
          DATAMODIFICACAO:
            usuarioExistente.DATAMODIFICACAO ??
            usuarioInicial.DATAMODIFICACAO,
          userModificador:
            usuarioExistente.userModificador ?? usuarioInicial.userModificador,
          DIGITAL: usuarioExistente.DIGITAL ?? usuarioInicial.DIGITAL,
        };
      } else {
        usuariosAtualizados.push(usuarioInicial);
      }
    });

    localStorage.setItem(
      STORAGE_KEY_USUARIOS,
      JSON.stringify(usuariosAtualizados)
    );

    return usuariosAtualizados;
  };

  const normalizarUsuario = (usuario) => {
    const matriculaUsuario = usuario.MATRICULA ?? usuario.matricula ?? '';
    const matriculaLimpa = normalizarMatricula(matriculaUsuario);
    const usuarioWillamesTeste = matriculaLimpa === '5257093';

    return {
      id: usuario.ID ?? usuario.id,
      matricula: matriculaUsuario,
      nome: usuario.NOME ?? usuario.nome ?? '',
      nomeCompleto: usuario.NOMECOMPLETO ?? usuario.nomeCompleto ?? '',
      postGrad: usuario.POSTGRAD ?? usuario.postGrad ?? '',
      unidade: usuarioWillamesTeste
        ? 'RPMont'
        : usuario.UNIDADE ?? usuario.unidade ?? '',
      setor: usuarioWillamesTeste ? 'P4' : usuario.SETOR ?? usuario.setor ?? '',
      nivel: usuarioWillamesTeste
        ? NIVEIS_USUARIO.ADMIN_MASTER
        : Number(usuario.NIVEL ?? usuario.nivel ?? NIVEIS_USUARIO.USUARIO_COMUM),
      senha: usuario.SENHA ?? usuario.senha ?? '',
      email: usuario.EMAIL ?? usuario.email ?? '',
      digital: usuario.DIGITAL ?? usuario.digital ?? null,
      statusAcesso:
        usuario.STATUSACESSO ?? usuario.statusAcesso ?? 'LIBERADO',
      ativo: usuario.ATIVO ?? usuario.ativo ?? 1,
      dataSolicitacao:
        usuario.DATASOLICITACAO ?? usuario.dataSolicitacao ?? null,
      dataLiberacao:
        usuario.DATALIBERACAO ?? usuario.dataLiberacao ?? null,
      liberadoPor: usuario.LIBERADOPOR ?? usuario.liberadoPor ?? null,
    };
  };

  const formatarNomeExibicao = (postGrad, nome) => {
    const postGradFormatado = String(postGrad || '').toUpperCase();
    const nomeTexto = String(nome || '').trim();

    const nomeFormatado = nomeTexto
      ? nomeTexto.charAt(0).toUpperCase() + nomeTexto.slice(1).toLowerCase()
      : '';

    return `${postGradFormatado} ${nomeFormatado}`.trim();
  };

  const usuarioEstaLiberado = (usuario) => {
    const status = normalizarStatusAcesso(usuario?.statusAcesso);
    const ativo = Number(usuario?.ativo);

    if (status === 'PENDENTE') {
      setMensagem(
        'Seu acesso ainda está aguardando liberação do administrador.'
      );
      return false;
    }

    if (status === 'BLOQUEADO' || ativo !== 1) {
      setMensagem(
        'Seu acesso está bloqueado. Procure o administrador do sistema.'
      );
      return false;
    }

    if (status !== 'LIBERADO') {
      setMensagem(
        'Seu acesso não está liberado. Procure o administrador do sistema.'
      );
      return false;
    }

    return true;
  };

  const handleMatriculaChange = (event) => {
    setMatricula(formatarMatricula(event.target.value));
    setSenha('');
    setMensagem('');
    setUsuarioEncontrado(null);
  };

  const verificarMatricula = () => {
    const matriculaNormalizada = normalizarMatricula(matricula);

    if (matriculaNormalizada.length !== 7) {
      setMensagem('Informe uma matrícula válida.');
      setUsuarioEncontrado(null);
      return;
    }

    const usuariosCadastrados = carregarUsuariosCadastrados();

    const usuarioLocalizado = usuariosCadastrados
      .map(normalizarUsuario)
      .find(
        (item) =>
          normalizarMatricula(item.matricula) === matriculaNormalizada
      );

    if (!usuarioLocalizado) {
      setUsuarioEncontrado(null);
      setMensagem(
        'Usuário não cadastrado. Toque em Cadastre-se ou procure o administrador do sistema.'
      );
      return;
    }

    console.log('USUÁRIO LOCALIZADO NO LOGIN:', usuarioLocalizado);

    setUsuarioEncontrado(usuarioLocalizado);
    setMensagem('');
  };

  const entrar = () => {
    if (!usuarioEncontrado) {
      verificarMatricula();
      return;
    }

    if (!senha.trim()) {
      setMensagem('Informe sua senha.');
      return;
    }

    if (senha !== String(usuarioEncontrado.senha || '')) {
      setMensagem('Senha incorreta. Tente novamente.');
      return;
    }

    if (!usuarioEstaLiberado(usuarioEncontrado)) {
      return;
    }

    const nomeExibicao = formatarNomeExibicao(
      usuarioEncontrado.postGrad,
      usuarioEncontrado.nome
    );

    setMensagem('Acesso liberado.');

    setTimeout(() => {
      const usuarioParaLogin = {
        id: usuarioEncontrado.id,
        ID: usuarioEncontrado.id,

        matricula: formatarMatricula(usuarioEncontrado.matricula),
        MATRICULA: formatarMatricula(usuarioEncontrado.matricula),

        nome: usuarioEncontrado.nome,
        NOME: usuarioEncontrado.nome,

        nomeCompleto: usuarioEncontrado.nomeCompleto,
        NOMECOMPLETO: usuarioEncontrado.nomeCompleto,

        postGrad: usuarioEncontrado.postGrad,
        POSTGRAD: usuarioEncontrado.postGrad,

        nomeExibicao,

        unidade: usuarioEncontrado.unidade,
        UNIDADE: usuarioEncontrado.unidade,

        setor: usuarioEncontrado.setor,
        SETOR: usuarioEncontrado.setor,

        nivel: Number(usuarioEncontrado.nivel),
        NIVEL: Number(usuarioEncontrado.nivel),

        email: usuarioEncontrado.email,
        EMAIL: usuarioEncontrado.email,

        digital: usuarioEncontrado.digital,
        DIGITAL: usuarioEncontrado.digital,

        statusAcesso: usuarioEncontrado.statusAcesso,
        STATUSACESSO: usuarioEncontrado.statusAcesso,

        ativo: Number(usuarioEncontrado.ativo),
        ATIVO: Number(usuarioEncontrado.ativo),
      };

      console.log('USUÁRIO ENVIADO PARA O APP:', usuarioParaLogin);

      onLoginSuccess(usuarioParaLogin);
    }, 700);
  };

  const abrirSolicitacaoAcesso = () => {
    if (typeof onSolicitarAcesso === 'function') {
      onSolicitarAcesso();
      return;
    }

    setMensagem('A tela de cadastro ainda não foi configurada.');
  };

  const abrirModalRecuperacaoSenha = () => {
    setModalSenhaAberto(true);
    setEmailRecuperacao('');
    setMensagemRecuperacao('');
    setRecuperacaoSucesso(false);
    setMensagem('');
  };

  const fecharModalRecuperacaoSenha = () => {
    setModalSenhaAberto(false);
    setEmailRecuperacao('');
    setMensagemRecuperacao('');
    setRecuperacaoSucesso(false);
  };

  const enviarNovaSenha = () => {
    const emailTratado = normalizarEmail(emailRecuperacao);

    if (!emailTratado) {
      setRecuperacaoSucesso(false);
      setMensagemRecuperacao('Informe o e-mail cadastrado no sistema.');
      return;
    }

    const usuariosCadastrados = carregarUsuariosCadastrados();

    const indiceUsuario = usuariosCadastrados.findIndex(
      (item) => normalizarEmail(item.EMAIL || item.email) === emailTratado
    );

    if (indiceUsuario < 0) {
      setRecuperacaoSucesso(false);
      setMensagemRecuperacao(
        'E-mail não encontrado no sistema. Verifique o e-mail informado ou procure o administrador.'
      );
      return;
    }

    const novaSenha = gerarSenhaSeisDigitos();
    const agora = new Date().toISOString();

    const usuariosAtualizados = usuariosCadastrados.map((item, index) => {
      if (index !== indiceUsuario) return item;

      return {
        ...item,
        SENHA: novaSenha,
        senha: novaSenha,
        DATAMODIFICACAO: agora,
        dataModificacao: agora,
      };
    });

    localStorage.setItem(
      STORAGE_KEY_USUARIOS,
      JSON.stringify(usuariosAtualizados)
    );

    const usuarioAtualizado = normalizarUsuario(usuariosAtualizados[indiceUsuario]);

    if (
      usuarioEncontrado &&
      normalizarEmail(usuarioEncontrado.email) === emailTratado
    ) {
      setUsuarioEncontrado(usuarioAtualizado);
      setSenha('');
    }

    console.log('NOVA SENHA GERADA PARA TESTE:', novaSenha);

    setRecuperacaoSucesso(true);
    setMensagemRecuperacao(
      `Senha redefinida com sucesso. Senha temporária para teste: ${novaSenha}`
    );
  };

  const nomeExibicao = usuarioEncontrado
    ? formatarNomeExibicao(
        usuarioEncontrado.postGrad,
        usuarioEncontrado.nome
      )
    : '';

  const mensagemEhSucesso = mensagem.includes('liberado');

  return (
    <main className="login-page">
      <section className="phone-frame">
        <div className="phone-status-bar">
          <span>9:41</span>

          <div className="status-icons">
            <span className="signal-icon"></span>
            <span className="wifi-icon"></span>
            <span className="battery-icon"></span>
          </div>
        </div>

        <div className="decor-top"></div>

        <div className="login-content">
          <img
            src={rpmontBrasao}
            alt="Brasão do RPMont"
            className="brasao"
          />

          <div className="titulo-area">
            <h1>REGIMENTO DE</h1>
            <h2>POLÍCIA MONTADA</h2>
            <h3>Cel. Calixto</h3>

            <div className="separator">
              <span></span>
              <strong>★</strong>
              <span></span>
            </div>

            <p>Conferência de Material Patrimonial</p>
          </div>

          {usuarioEncontrado && (
            <div className="boas-vindas">
              <strong>Seja bem-vindo, {nomeExibicao}</strong>
              <span>Unidade: {usuarioEncontrado.unidade}</span>
            </div>
          )}

          <div className="form-area">
            <label className="input-box">
              <FaUser className="input-icon" />

              <input
                type="text"
                placeholder="Matrícula"
                value={matricula}
                onChange={handleMatriculaChange}
                onBlur={verificarMatricula}
                inputMode="numeric"
                maxLength={9}
              />
            </label>

            {usuarioEncontrado && (
              <div className="senha-login-area">
                <label className="input-box input-box-senha">
                  <FaLock className="input-icon" />

                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Senha"
                    value={senha}
                    onChange={(event) => {
                      setSenha(event.target.value);
                      setMensagem('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        entrar();
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                    aria-label="Mostrar ou ocultar senha"
                  >
                    {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </label>

                <button
                  type="button"
                  className="esqueci-senha-button"
                  onClick={abrirModalRecuperacaoSenha}
                >
                  <FaKey />
                  <span>Esqueci minha senha?</span>
                </button>
              </div>
            )}

            <button
              type="button"
              className="entrar-button"
              onClick={entrar}
            >
              <FaSignInAlt />

              <span>{usuarioEncontrado ? 'Entrar' : 'Continuar'}</span>
            </button>

            <div className="cadastro-login-area">
              <div className="cadastro-login-divisor">
                <span></span>
                <strong>Novo usuário?</strong>
                <span></span>
              </div>

              <button
                type="button"
                className="solicitar-acesso-button"
                onClick={abrirSolicitacaoAcesso}
              >
                <FaUserPlus />

                <span>Cadastre-se</span>
              </button>
            </div>

            {mensagem && (
              <div
                className={
                  mensagemEhSucesso
                    ? 'mensagem mensagem-sucesso'
                    : 'mensagem mensagem-erro'
                }
              >
                {mensagem}
              </div>
            )}

            <p className="texto-apoio">
              Informe sua matrícula e senha para acessar. Caso ainda não tenha cadastro,
              toque em Cadastre-se e aguarde a liberação do administrador.
            </p>
          </div>
        </div>

        <div className="decor-bottom"></div>

        {modalSenhaAberto && (
          <div className="recuperar-senha-overlay">
            <div className="recuperar-senha-modal">
              <button
                type="button"
                className="recuperar-senha-fechar"
                onClick={fecharModalRecuperacaoSenha}
                aria-label="Fechar recuperação de senha"
              >
                <FaTimes />
              </button>

              <div className="recuperar-senha-icon">
                <FaKey />
              </div>

              <h2>Esqueci minha senha</h2>

              <p>
                Informe o e-mail cadastrado no sistema para receber uma nova
                senha de acesso.
              </p>

              <label className="input-box recuperar-senha-input">
                <FaEnvelope className="input-icon" />

                <input
                  type="email"
                  placeholder="E-mail cadastrado"
                  value={emailRecuperacao}
                  onChange={(event) => {
                    setEmailRecuperacao(event.target.value);
                    setMensagemRecuperacao('');
                    setRecuperacaoSucesso(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      enviarNovaSenha();
                    }
                  }}
                />
              </label>

              <button
                type="button"
                className="recuperar-senha-enviar"
                onClick={enviarNovaSenha}
              >
                <FaEnvelope />
                <span>Enviar nova senha</span>
              </button>

              {mensagemRecuperacao && (
                <span
                  className={
                    recuperacaoSucesso
                      ? 'recuperar-senha-mensagem sucesso'
                      : 'recuperar-senha-mensagem erro'
                  }
                >
                  {mensagemRecuperacao}
                </span>
              )}

              <small>
                Ambiente de teste: a senha temporária será exibida na tela. No backend,
                ela será enviada automaticamente para o e-mail cadastrado.
              </small>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Login;