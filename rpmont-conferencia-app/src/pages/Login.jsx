import { useState } from 'react';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
  FaUserPlus,
} from 'react-icons/fa';
import rpmontBrasao from '../assets/RPMONT.png';
import '../styles/Login.css';

const STORAGE_KEY_USUARIOS = 'usuarios';

const criarUsuariosIniciais = () => {
  const agora = new Date();

  return [
    {
      ID: 1,
      MATRICULA: '525.709-3',
      NOME: 'willames',
      SENHA: '123456',
      EMAIL: '',
      NIVEL: 1,
      POSTGRAD: 'CB',
      SETOR: 'P4',
      NOMECOMPLETO: 'Willames Pereira',
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
      NIVEL: 1,
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

  const normalizarStatusAcesso = (valor) => {
    return String(valor || 'LIBERADO')
      .trim()
      .toUpperCase();
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
        usuariosAtualizados[indiceUsuarioExistente] = {
          ...usuarioInicial,
          ...usuariosAtualizados[indiceUsuarioExistente],
          STATUSACESSO:
            usuariosAtualizados[indiceUsuarioExistente].STATUSACESSO ||
            usuariosAtualizados[indiceUsuarioExistente].statusAcesso ||
            usuarioInicial.STATUSACESSO,
          ATIVO:
            usuariosAtualizados[indiceUsuarioExistente].ATIVO ??
            usuariosAtualizados[indiceUsuarioExistente].ativo ??
            usuarioInicial.ATIVO,
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
    return {
      id: usuario.ID ?? usuario.id,
      matricula: usuario.MATRICULA ?? usuario.matricula ?? '',
      nome: usuario.NOME ?? usuario.nome ?? '',
      nomeCompleto: usuario.NOMECOMPLETO ?? usuario.nomeCompleto ?? '',
      postGrad: usuario.POSTGRAD ?? usuario.postGrad ?? '',
      unidade: usuario.UNIDADE ?? usuario.unidade ?? '',
      setor: usuario.SETOR ?? usuario.setor ?? '',
      nivel: usuario.NIVEL ?? usuario.nivel ?? 2,
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
      onLoginSuccess({
        id: usuarioEncontrado.id,
        matricula: formatarMatricula(usuarioEncontrado.matricula),
        nome: usuarioEncontrado.nome,
        nomeCompleto: usuarioEncontrado.nomeCompleto,
        postGrad: usuarioEncontrado.postGrad,
        nomeExibicao,
        unidade: usuarioEncontrado.unidade,
        setor: usuarioEncontrado.setor,
        nivel: Number(usuarioEncontrado.nivel),
        email: usuarioEncontrado.email,
        digital: usuarioEncontrado.digital,
        statusAcesso: usuarioEncontrado.statusAcesso,
        ativo: Number(usuarioEncontrado.ativo),
      });
    }, 700);
  };

  const abrirSolicitacaoAcesso = () => {
    if (typeof onSolicitarAcesso === 'function') {
      onSolicitarAcesso();
      return;
    }

    setMensagem('A tela de cadastro ainda não foi configurada.');
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
              <label className="input-box">
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
      </section>
    </main>
  );
}

export default Login;