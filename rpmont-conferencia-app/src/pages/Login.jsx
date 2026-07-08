import { useState } from 'react';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
  FaUserPlus,
  FaKey,
} from 'react-icons/fa';

import rpmontBrasao from '../assets/RPMONT.png';
import { login } from '../services/authService';
import '../styles/Login.css';

function Login({
  onLoginSuccess,
  onSolicitarAcesso,
  onRecuperarSenha,
}) {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

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

  const formatarNomeExibicao = (postGrad, nome) => {
    const postGradFormatado = String(postGrad || '').toUpperCase();

    const nomeTexto = String(nome || '').trim();

    const nomeFormatado = nomeTexto
      ? nomeTexto.charAt(0).toUpperCase() +
        nomeTexto.slice(1).toLowerCase()
      : '';

    return `${postGradFormatado} ${nomeFormatado}`.trim();
  };

  const handleMatriculaChange = (event) => {
    setMatricula(formatarMatricula(event.target.value));
    setMensagem('');
  };

  const entrar = async () => {
    const matriculaNormalizada = normalizarMatricula(matricula);

    if (matriculaNormalizada.length !== 7) {
      setMensagem('Informe uma matrícula válida.');
      return;
    }

    if (!senha.trim()) {
      setMensagem('Informe sua senha.');
      return;
    }

    try {
      setCarregando(true);
      setMensagem('');

      const dados = await login(matricula, senha);

      const nomeExibicao = formatarNomeExibicao(
        dados.postGrad,
        dados.nome
      );

      const usuarioParaLogin = {
        id: dados.id,
        ID: dados.id,

        matricula: dados.matricula,
        MATRICULA: dados.matricula,

        nome: dados.nome,
        NOME: dados.nome,

        nomeCompleto: dados.nomeCompleto,
        NOMECOMPLETO: dados.nomeCompleto,

        postGrad: dados.postGrad,
        POSTGRAD: dados.postGrad,

        nomeExibicao,

        unidade: dados.unidade,
        UNIDADE: dados.unidade,

        setor: dados.setor,
        SETOR: dados.setor,

        nivel: Number(dados.nivel),
        NIVEL: Number(dados.nivel),

        email: dados.email,
        EMAIL: dados.email,

        statusAcesso: dados.statusAcesso,
        STATUSACESSO: dados.statusAcesso,

        ativo: Number(dados.ativo),
        ATIVO: Number(dados.ativo),
      };

      localStorage.setItem('token', dados.token);

      localStorage.setItem(
        'usuarioLogado',
        JSON.stringify(usuarioParaLogin)
      );

      setMensagem('Acesso liberado.');

      setTimeout(() => {
        onLoginSuccess(usuarioParaLogin);
      }, 700);
    } catch (erro) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioLogado');

      if (erro?.status === 401) {
        setMensagem('Matrícula ou senha incorreta.');
        return;
      }

      if (erro?.status === 403) {
        setMensagem(
          erro.message ||
            'Seu acesso não está liberado. Procure o administrador do sistema.'
        );

        return;
      }

      setMensagem(
        erro?.message ||
          'Não foi possível conectar ao servidor.'
      );
    } finally {
      setCarregando(false);
    }
  };

  const abrirSolicitacaoAcesso = () => {
    if (typeof onSolicitarAcesso === 'function') {
      onSolicitarAcesso();
      return;
    }

    setMensagem(
      'A tela de cadastro ainda não foi configurada.'
    );
  };

  const abrirRecuperacaoSenha = () => {
    if (typeof onRecuperarSenha === 'function') {
      onRecuperarSenha();
      return;
    }

    setMensagem(
      'A tela de recuperação de senha ainda não foi configurada.'
    );
  };

  const mensagemEhSucesso =
    mensagem === 'Acesso liberado.';

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

          <div className="form-area">
            <label className="input-box">
              <FaUser className="input-icon" />

              <input
                type="text"
                placeholder="Matrícula"
                value={matricula}
                onChange={handleMatriculaChange}
                inputMode="numeric"
                maxLength={9}
                autoComplete="username"
                disabled={carregando}
              />
            </label>

            <div className="senha-login-area">
              <label className="input-box input-box-senha">
                <FaLock className="input-icon" />

                <input
                  type={
                    mostrarSenha
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Senha"
                  value={senha}
                  onChange={(event) => {
                    setSenha(event.target.value);
                    setMensagem('');
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !carregando
                    ) {
                      entrar();
                    }
                  }}
                  autoComplete="current-password"
                  disabled={carregando}
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() =>
                    setMostrarSenha(
                      (valorAtual) => !valorAtual
                    )
                  }
                  aria-label={
                    mostrarSenha
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
                  }
                  disabled={carregando}
                >
                  {mostrarSenha ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </label>

              <button
                type="button"
                className="esqueci-senha-button"
                onClick={abrirRecuperacaoSenha}
                disabled={carregando}
              >
                <FaKey />

                <span>Esqueci minha senha?</span>
              </button>
            </div>

            <button
              type="button"
              className="entrar-button"
              onClick={entrar}
              disabled={carregando}
            >
              <FaSignInAlt />

              <span>
                {carregando
                  ? 'Entrando...'
                  : 'Entrar'}
              </span>
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
                disabled={carregando}
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
              Informe sua matrícula e senha para acessar.
              Caso ainda não tenha cadastro, toque em
              Cadastre-se e aguarde a liberação do
              administrador.
            </p>
          </div>
        </div>

        <div className="decor-bottom"></div>
      </section>
    </main>
  );
}

export default Login;