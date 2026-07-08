import { useState } from 'react';

import {
  FaArrowLeft,
  FaEnvelope,
  FaPaperPlane,
  FaShieldAlt,
} from 'react-icons/fa';

import rpmontBrasao from '../assets/RPMONT.png';

import '../styles/RecuperarSenha.css';

function RecuperarSenha({ onVoltar }) {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const validarEmail = (emailInformado) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailValido.test(emailInformado);
  };

  const solicitarRecuperacao = async (event) => {
    event.preventDefault();

    const emailTratado = String(email || '')
      .trim()
      .toLowerCase();

    if (!emailTratado) {
      setTipoMensagem('erro');
      setMensagem('Informe o e-mail cadastrado.');

      return;
    }

    if (!validarEmail(emailTratado)) {
      setTipoMensagem('erro');
      setMensagem('Informe um endereço de e-mail válido.');

      return;
    }

    try {
      setCarregando(true);
      setMensagem('');
      setTipoMensagem('');

      /*
       * =========================================
       * INTEGRAÇÃO FUTURA COM O BACKEND
       * =========================================
       *
       * Exemplo:
       *
       * await solicitarRecuperacaoSenha({
       *   email: emailTratado,
       * });
       *
       * Endpoint planejado:
       *
       * POST /auth/recuperar-senha/solicitar
       *
       */

      setTipoMensagem('sucesso');

      setMensagem(
        'Se o e-mail informado estiver cadastrado, você receberá as instruções para recuperar sua senha.'
      );
    } catch (erro) {
      setTipoMensagem('erro');

      setMensagem(
        erro?.message ||
          'Não foi possível solicitar a recuperação de senha.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="recuperar-page">
      <section className="recuperar-container">
        <header className="recuperar-header">
          <button
            type="button"
            className="recuperar-voltar"
            onClick={onVoltar}
            aria-label="Voltar para o login"
          >
            <FaArrowLeft />
          </button>

          <div className="recuperar-header-texto">
            <span>ACESSO AO SISTEMA</span>

            <strong>Recuperação de senha</strong>
          </div>

          <div className="recuperar-header-icone">
            <FaShieldAlt />
          </div>
        </header>

        <div className="recuperar-conteudo">
          <img
            src={rpmontBrasao}
            alt="Brasão do RPMont"
            className="recuperar-brasao"
          />

          <div className="recuperar-titulo">
            <h1>Esqueceu sua senha?</h1>

            <p>
              Informe o e-mail cadastrado na sua conta para
              iniciar o processo de recuperação de acesso.
            </p>
          </div>

          <form
            className="recuperar-form"
            onSubmit={solicitarRecuperacao}
          >
            <div className="recuperar-campo-area">
              <label htmlFor="email">
                E-mail cadastrado
              </label>

              <div className="recuperar-input-box">
                <FaEnvelope />

                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setMensagem('');
                    setTipoMensagem('');
                  }}
                  placeholder="seuemail@exemplo.com"
                  maxLength={120}
                  autoComplete="email"
                  disabled={carregando}
                />
              </div>
            </div>

            <div className="recuperar-aviso">
              <FaShieldAlt />

              <div>
                <strong>
                  Recuperação segura
                </strong>

                <span>
                  As instruções de recuperação serão enviadas
                  somente para o e-mail cadastrado na conta.
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="recuperar-enviar"
              disabled={carregando}
            >
              <FaPaperPlane />

              <span>
                {carregando
                  ? 'Enviando...'
                  : 'Solicitar recuperação'}
              </span>
            </button>

            {mensagem && (
              <div
                className={`recuperar-mensagem ${tipoMensagem}`}
              >
                {mensagem}
              </div>
            )}
          </form>

          <div className="recuperar-suporte">
            <span>
              Não consegue recuperar o acesso?
            </span>

            <strong>
              Procure o administrador responsável pela sua
              unidade.
            </strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RecuperarSenha;