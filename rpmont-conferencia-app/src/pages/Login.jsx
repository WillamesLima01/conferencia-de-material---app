import { useState } from 'react';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSignInAlt } from 'react-icons/fa';
import rpmontBrasao from '../assets/RPMONT.png';
import '../styles/Login.css';

const STORAGE_KEY_USUARIOS = 'usuarios';

function Login({ onLoginSuccess }) {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const formatarMatricula = (valor) => {
    const apenasNumeros = String(valor || '').replace(/\D/g, '').slice(0, 7);

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

  const carregarUsuariosCadastrados = () => {
    const usuariosSalvos = localStorage.getItem(STORAGE_KEY_USUARIOS);

    if (!usuariosSalvos) return [];

    try {
      return JSON.parse(usuariosSalvos);
    } catch {
      return [];
    }
  };

  const normalizarUsuario = (usuario) => {
    return {
      id: usuario.ID || usuario.id,
      matricula: usuario.MATRICULA || usuario.matricula,
      nome: usuario.NOME || usuario.nome,
      nomeCompleto: usuario.NOMECOMPLETO || usuario.nomeCompleto || '',
      postGrad: usuario.POSTGRAD || usuario.postGrad,
      unidade: usuario.UNIDADE || usuario.unidade,
      setor: usuario.SETOR || usuario.setor,
      nivel: usuario.NIVEL || usuario.nivel,
      senha: usuario.SENHA || usuario.senha,
      email: usuario.EMAIL || usuario.email || '',
      digital: usuario.DIGITAL || usuario.digital || null,
    };
  };

  const formatarNomeExibicao = (postGrad, nome) => {
    const postGradFormatado = postGrad?.toUpperCase() || '';
    const nomeFormatado = nome
      ? nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
      : '';

    return `${postGradFormatado} ${nomeFormatado}`.trim();
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
      setMensagem('Usuário não cadastrado. Procure o administrador do sistema.');
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

    if (senha === usuarioEncontrado.senha) {
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
          nivel: usuarioEncontrado.nivel,
          email: usuarioEncontrado.email,
          digital: usuarioEncontrado.digital,
        });
      }, 700);

      return;
    }

    setMensagem('Senha incorreta. Tente novamente.');
  };

  const nomeExibicao = usuarioEncontrado
    ? formatarNomeExibicao(usuarioEncontrado.postGrad, usuarioEncontrado.nome)
    : '';

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
          <img src={rpmontBrasao} alt="Brasão do RPMont" className="brasao" />

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
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label="Mostrar ou ocultar senha"
                >
                  {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                </button>
              </label>
            )}

            <button type="button" className="entrar-button" onClick={entrar}>
              <FaSignInAlt />
              <span>{usuarioEncontrado ? 'Entrar' : 'Continuar'}</span>
            </button>

            {mensagem && (
              <div
                className={
                  mensagem.includes('liberado')
                    ? 'mensagem mensagem-sucesso'
                    : 'mensagem mensagem-erro'
                }
              >
                {mensagem}
              </div>
            )}

            <p className="texto-apoio">
              Informe sua matrícula e senha para acessar.
            </p>
          </div>
        </div>

        <div className="decor-bottom"></div>
      </section>
    </main>
  );
}

export default Login;