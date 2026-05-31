import { useState } from 'react';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSignInAlt } from 'react-icons/fa';
import rpmontBrasao from '../assets/RPMONT.png';
import '../styles/Login.css';

function Login({ onLoginSuccess }) {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const formatarMatricula = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, '').slice(0, 7);

    if (apenasNumeros.length <= 3) {
      return apenasNumeros;
    }

    if (apenasNumeros.length <= 6) {
      return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3)}`;
    }

    return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}-${apenasNumeros.slice(6)}`;
  };

  const normalizarMatricula = (valor) => {
    return valor.replace(/\D/g, '');
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

    /*
      Simulação inicial.
      Depois vamos trocar essa parte por consulta real na API/MySQL.
    */
    const usuariosTeste = [
      {
        id: 4,
        matricula: '525.709-3',
        nome: 'willames',
        postGrad: 'cb',
        unidade: 'RPMont',
        setor: 'P4',
        nivel: 1,
        senha: '123456',
      },
      {
        id: 30,
        matricula: '123.456-7',
        nome: 'campina',
        postGrad: '2º Ten',
        unidade: '3º EPMont',
        setor: 'Corregedoria',
        nivel: 4,
        senha: '123456',
      },
      {
        id: 33,
        matricula: '520.381-3',
        nome: 'Charles',
        postGrad: 'ST',
        unidade: 'RPMont',
        setor: 'P4',
        nivel: 1,
        senha: '123456',
      },
    ];

    const usuario = usuariosTeste.find(
      (item) => normalizarMatricula(item.matricula) === matriculaNormalizada
    );

    if (!usuario) {
      setUsuarioEncontrado(null);
      setMensagem('Usuário não cadastrado. Procure o administrador do sistema.');
      return;
    }

    setUsuarioEncontrado(usuario);
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

    /*
      Simulação inicial.
      Depois vamos validar essa senha no backend.
    */
    if (senha === usuarioEncontrado.senha) {
      setMensagem('Acesso liberado.');

      setTimeout(() => {
        onLoginSuccess({
          id: usuarioEncontrado.id,
          matricula: usuarioEncontrado.matricula,
          nome: usuarioEncontrado.nome,
          postGrad: usuarioEncontrado.postGrad,
          nomeExibicao,
          unidade: usuarioEncontrado.unidade,
          setor: usuarioEncontrado.setor,
          nivel: usuarioEncontrado.nivel,
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