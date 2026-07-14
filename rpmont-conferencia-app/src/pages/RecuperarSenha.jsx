import { useEffect, useRef, useState } from 'react';

import {
  FaArrowLeft,
  FaCheckCircle,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaLock,
  FaPaperPlane,
  FaShieldAlt,
} from 'react-icons/fa';

import rpmontBrasao from '../assets/RPMONT.png';

import {
  redefinirSenha,
  solicitarRecuperacaoSenha,
  validarCodigoRecuperacao,
} from '../services/authService';

import '../styles/RecuperarSenha.css';


function RecuperarSenha({
  onVoltar,
}) {
  /*
   * =========================================
   * ESTADOS
   * =========================================
   */

  const [etapa, setEtapa] =
    useState(() => {
      const etapaSalva =
        sessionStorage.getItem(
          'recuperacaoSenhaEtapa'
        );

      const etapaConvertida =
        Number(etapaSalva);

      return [1, 2, 3, 4].includes(
        etapaConvertida
      )
        ? etapaConvertida
        : 1;
    });

  const [email, setEmail] =
    useState(() => {
      return (
        sessionStorage.getItem(
          'recuperacaoSenhaEmail'
        ) || ''
      );
    });

  const [codigo, setCodigo] =
    useState(() => {
      return (
        sessionStorage.getItem(
          'recuperacaoSenhaCodigo'
        ) || ''
      );
    });

  const [novaSenha, setNovaSenha] =
    useState('');

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState('');

  const [
    mostrarNovaSenha,
    setMostrarNovaSenha,
  ] = useState(false);

  const [
    mostrarConfirmacao,
    setMostrarConfirmacao,
  ] = useState(false);

  const [mensagem, setMensagem] =
    useState('');

  const [
    tipoMensagem,
    setTipoMensagem,
  ] = useState('');

  const [
    carregando,
    setCarregando,
  ] = useState(false);


  const camposCodigoRef =
    useRef([]);


  /*
   * =========================================
   * PERSISTÊNCIA TEMPORÁRIA DO FLUXO
   * =========================================
   */

  useEffect(() => {
    sessionStorage.setItem(
      'recuperacaoSenhaEtapa',
      String(etapa)
    );
  }, [etapa]);


  useEffect(() => {
    if (email) {
      sessionStorage.setItem(
        'recuperacaoSenhaEmail',
        email
      );

      return;
    }

    sessionStorage.removeItem(
      'recuperacaoSenhaEmail'
    );
  }, [email]);


  useEffect(() => {
    if (codigo) {
      sessionStorage.setItem(
        'recuperacaoSenhaCodigo',
        codigo
      );

      return;
    }

    sessionStorage.removeItem(
      'recuperacaoSenhaCodigo'
    );
  }, [codigo]);


  const limparFluxoRecuperacao = () => {
    sessionStorage.removeItem(
      'recuperacaoSenhaEtapa'
    );

    sessionStorage.removeItem(
      'recuperacaoSenhaEmail'
    );

    sessionStorage.removeItem(
      'recuperacaoSenhaCodigo'
    );

    sessionStorage.removeItem(
      'recuperacaoSenhaEmAndamento'
    );
  };


  /*
   * =========================================
   * FUNÇÕES AUXILIARES
   * =========================================
   */

  const limparMensagem = () => {
    setMensagem('');
    setTipoMensagem('');
  };


  const exibirErro = (
    texto
  ) => {
    setTipoMensagem('erro');
    setMensagem(texto);
  };


  const exibirSucesso = (
    texto
  ) => {
    setTipoMensagem('sucesso');
    setMensagem(texto);
  };


  const normalizarEmail = (
    emailInformado
  ) => {
    return String(
      emailInformado || ''
    )
      .trim()
      .toLowerCase();
  };


  const validarEmail = (
    emailInformado
  ) => {
    const formatoEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(
      emailInformado
    );
  };


  const obterMensagemErro = (
    erro,
    mensagemPadrao
  ) => {
    return (
      erro?.message ||
      erro?.mensagem ||
      mensagemPadrao
    );
  };


  /*
   * =========================================
   * CAMPO OTP - CÓDIGO DE 6 DÍGITOS
   * =========================================
   */

  const obterDigitosCodigo = () => {
    return Array.from(
      { length: 6 },
      (_, indice) =>
        String(codigo || '')[indice] || ''
    );
  };


  const focarCampoCodigo = (
    indice
  ) => {
    camposCodigoRef.current[
      indice
    ]?.focus();
  };


  const alterarDigitoCodigo = (
    indice,
    valorInformado
  ) => {
    const numeros =
      String(valorInformado || '')
        .replace(/\D/g, '');

    if (!numeros) {
      const digitos =
        obterDigitosCodigo();

      digitos[indice] = '';

      setCodigo(
        digitos.join('')
      );

      limparMensagem();

      return;
    }

    const digitos =
      obterDigitosCodigo();

    let proximoIndice =
      indice;

    numeros
      .slice(0, 6 - indice)
      .split('')
      .forEach((numero) => {
        digitos[proximoIndice] =
          numero;

        proximoIndice += 1;
      });

    setCodigo(
      digitos.join('')
    );

    limparMensagem();

    if (proximoIndice < 6) {
      focarCampoCodigo(
        proximoIndice
      );
    } else {
      focarCampoCodigo(5);
    }
  };


  const tratarTeclaCodigo = (
    event,
    indice
  ) => {
    if (
      event.key === 'Backspace'
    ) {
      const digitos =
        obterDigitosCodigo();

      if (digitos[indice]) {
        digitos[indice] = '';

        setCodigo(
          digitos.join('')
        );

        limparMensagem();

        return;
      }

      if (indice > 0) {
        event.preventDefault();

        digitos[indice - 1] = '';

        setCodigo(
          digitos.join('')
        );

        limparMensagem();

        focarCampoCodigo(
          indice - 1
        );
      }

      return;
    }

    if (
      event.key === 'ArrowLeft' &&
      indice > 0
    ) {
      event.preventDefault();

      focarCampoCodigo(
        indice - 1
      );

      return;
    }

    if (
      event.key === 'ArrowRight' &&
      indice < 5
    ) {
      event.preventDefault();

      focarCampoCodigo(
        indice + 1
      );
    }
  };


  const colarCodigo = (
    event
  ) => {
    event.preventDefault();

    const codigoColado =
      event.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 6);

    if (!codigoColado) {
      return;
    }

    setCodigo(
      codigoColado
    );

    limparMensagem();

    focarCampoCodigo(
      Math.min(
        codigoColado.length,
        6
      ) - 1
    );
  };


  /*
   * =========================================
   * ETAPA 1
   * SOLICITAR CÓDIGO
   * =========================================
   */

  const solicitarRecuperacao = async (
    event
  ) => {
    event.preventDefault();

    const emailTratado =
      normalizarEmail(email);


    if (!emailTratado) {
      exibirErro(
        'Informe o e-mail cadastrado.'
      );

      return;
    }


    if (
      !validarEmail(
        emailTratado
      )
    ) {
      exibirErro(
        'Informe um endereço de e-mail válido.'
      );

      return;
    }


    try {
      setCarregando(true);
      limparMensagem();

      const resposta =
        await solicitarRecuperacaoSenha(
          emailTratado
        );

      setEmail(emailTratado);

      sessionStorage.setItem(
        'recuperacaoSenhaEmail',
        emailTratado
      );

      sessionStorage.setItem(
        'recuperacaoSenhaEtapa',
        '2'
      );

      setEtapa(2);

      exibirSucesso(
        resposta?.mensagem ||
        'Código enviado. Verifique o e-mail cadastrado.'
      );
    } catch (erro) {
      console.error(
        'Erro ao solicitar recuperação:',
        erro
      );


      if (
        erro?.status === 429
      ) {
        exibirErro(
          'Aguarde um pouco antes de solicitar um novo código.'
        );

        return;
      }


      exibirErro(
        obterMensagemErro(
          erro,
          'Não foi possível solicitar a recuperação de senha.'
        )
      );
    } finally {
      setCarregando(false);
    }
  };


  /*
   * =========================================
   * ETAPA 2
   * VALIDAR CÓDIGO
   * =========================================
   */

  const validarCodigo = async (
    event
  ) => {
    event.preventDefault();

    const codigoTratado =
      String(codigo || '')
        .replace(/\D/g, '')
        .slice(0, 6);


    if (!codigoTratado) {
      exibirErro(
        'Informe o código recebido por e-mail.'
      );

      return;
    }


    if (
      codigoTratado.length !== 6
    ) {
      exibirErro(
        'O código deve possuir 6 dígitos.'
      );

      return;
    }


    try {
      setCarregando(true);
      limparMensagem();

      const resposta =
        await validarCodigoRecuperacao(
          email,
          codigoTratado
        );

      setCodigo(codigoTratado);

      sessionStorage.setItem(
        'recuperacaoSenhaCodigo',
        codigoTratado
      );

      sessionStorage.setItem(
        'recuperacaoSenhaEtapa',
        '3'
      );

      setEtapa(3);

      exibirSucesso(
        resposta?.mensagem ||
        'Código validado com sucesso.'
      );
    } catch (erro) {
      console.error(
        'Erro ao validar código:',
        erro
      );


      exibirErro(
        obterMensagemErro(
          erro,
          'Código inválido ou expirado.'
        )
      );
    } finally {
      setCarregando(false);
    }
  };


  /*
   * =========================================
   * ETAPA 3
   * REDEFINIR SENHA
   * =========================================
   */

  const concluirRedefinicao = async (
    event
  ) => {
    event.preventDefault();


    if (
      !novaSenha ||
      novaSenha.trim() === ''
    ) {
      exibirErro(
        'Informe a nova senha.'
      );

      return;
    }


    if (
      novaSenha.length < 4
    ) {
      exibirErro(
        'A nova senha deve possuir no mínimo 4 caracteres.'
      );

      return;
    }


    if (!confirmarSenha) {
      exibirErro(
        'Confirme a nova senha.'
      );

      return;
    }


    if (
      novaSenha !==
      confirmarSenha
    ) {
      exibirErro(
        'A nova senha e a confirmação não conferem.'
      );

      return;
    }


    try {
      setCarregando(true);
      limparMensagem();

      const resposta =
        await redefinirSenha({
          email,
          codigo,
          novaSenha,
          confirmarSenha,
        });

      limparFluxoRecuperacao();

      setEtapa(4);

      exibirSucesso(
        resposta?.mensagem ||
        'Senha redefinida com sucesso.'
      );
    } catch (erro) {
      console.error(
        'Erro ao redefinir senha:',
        erro
      );


      exibirErro(
        obterMensagemErro(
          erro,
          'Não foi possível redefinir a senha.'
        )
      );
    } finally {
      setCarregando(false);
    }
  };


  /*
   * =========================================
   * SOLICITAR NOVO CÓDIGO
   * =========================================
   */

  const reenviarCodigo = async () => {
    try {
      setCarregando(true);
      limparMensagem();

      const resposta =
        await solicitarRecuperacaoSenha(
          email
        );

      setCodigo('');

      sessionStorage.removeItem(
        'recuperacaoSenhaCodigo'
      );

      focarCampoCodigo(0);

      exibirSucesso(
        resposta?.mensagem ||
        'Um novo código foi enviado para o e-mail cadastrado.'
      );
    } catch (erro) {
      console.error(
        'Erro ao reenviar código:',
        erro
      );


      if (
        erro?.status === 429
      ) {
        exibirErro(
          'Aguarde um pouco antes de solicitar um novo código.'
        );

        return;
      }


      exibirErro(
        obterMensagemErro(
          erro,
          'Não foi possível reenviar o código.'
        )
      );
    } finally {
      setCarregando(false);
    }
  };


  /*
   * =========================================
   * VOLTAR ETAPA
   * =========================================
   */

  const voltarEtapa = () => {
    limparMensagem();


    if (etapa === 1) {
      limparFluxoRecuperacao();
      onVoltar?.();
      return;
    }


    if (etapa === 2) {
      sessionStorage.setItem(
        'recuperacaoSenhaEtapa',
        '1'
      );

      sessionStorage.removeItem(
        'recuperacaoSenhaCodigo'
      );

      setEtapa(1);
      setCodigo('');
      return;
    }


    if (etapa === 3) {
      sessionStorage.setItem(
        'recuperacaoSenhaEtapa',
        '2'
      );

      setEtapa(2);
      setNovaSenha('');
      setConfirmarSenha('');
      return;
    }


    limparFluxoRecuperacao();
    onVoltar?.();
  };


  /*
   * =========================================
   * TÍTULO DA ETAPA
   * =========================================
   */

  const obterTitulo = () => {
    if (etapa === 1) {
      return 'Esqueceu sua senha?';
    }

    if (etapa === 2) {
      return 'Informe o código';
    }

    if (etapa === 3) {
      return 'Crie uma nova senha';
    }

    return 'Senha redefinida';
  };


  const obterDescricao = () => {
    if (etapa === 1) {
      return (
        <>
          Informe o e-mail cadastrado
          na sua conta para iniciar o
          processo de recuperação.
        </>
      );
    }

    if (etapa === 2) {
      return (
        <>
          Digite o código de 6 dígitos
          enviado para o seu e-mail.
        </>
      );
    }

    if (etapa === 3) {
      return (
        <>
          Informe e confirme a nova
          senha de acesso ao sistema.
        </>
      );
    }

    return (
      <>
        Sua senha foi alterada.
        Você já pode acessar o sistema.
      </>
    );
  };


  /*
   * =========================================
   * RENDERIZAÇÃO
   * =========================================
   */

  return (
    <main className="recuperar-page">

      <section className="recuperar-container">

        <header className="recuperar-header">

          <button
            type="button"
            className="recuperar-voltar"
            onClick={voltarEtapa}
            aria-label="Voltar"
            disabled={carregando}
          >
            <FaArrowLeft />
          </button>


          <div className="recuperar-header-texto">

            <span>
              SISTEMA INTEGRADO DE GESTÃO INTERNA
            </span>

            <strong>
              Recuperação de senha
            </strong>

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

            <h1>
              {obterTitulo()}
            </h1>

            <p>
              {obterDescricao()}
            </p>

          </div>


          <div className="recuperar-etapas">

            <span
              className={
                etapa >= 1
                  ? 'ativa'
                  : ''
              }
            >
              1
            </span>

            <div
              className={
                etapa >= 2
                  ? 'ativa'
                  : ''
              }
            />

            <span
              className={
                etapa >= 2
                  ? 'ativa'
                  : ''
              }
            >
              2
            </span>

            <div
              className={
                etapa >= 3
                  ? 'ativa'
                  : ''
              }
            />

            <span
              className={
                etapa >= 3
                  ? 'ativa'
                  : ''
              }
            >
              3
            </span>

          </div>


          {etapa === 1 && (

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
                      setEmail(
                        event.target.value
                      );

                      limparMensagem();
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
                    O código será enviado
                    somente para o e-mail
                    cadastrado na conta.
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
                    : 'Enviar código'}
                </span>

              </button>

            </form>

          )}


          {etapa === 2 && (

            <form
              className="recuperar-form"
              onSubmit={validarCodigo}
            >

              <div className="recuperar-campo-area">

                <label id="codigo-label">
                  Código de recuperação
                </label>


                <div className="recuperar-codigo-area">

                  <div className="recuperar-codigo-icone">
                    <FaKey />
                  </div>


                  <div
                    className="recuperar-codigo-campos"
                    role="group"
                    aria-labelledby="codigo-label"
                    onPaste={colarCodigo}
                  >
                    {obterDigitosCodigo().map(
                      (
                        digito,
                        indice
                      ) => (
                        <input
                          key={indice}
                          ref={(elemento) => {
                            camposCodigoRef.current[
                              indice
                            ] = elemento;
                          }}
                          id={
                            indice === 0
                              ? 'codigo'
                              : undefined
                          }
                          className={
                            digito
                              ? 'preenchido'
                              : ''
                          }
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={digito}
                          maxLength={1}
                          autoComplete={
                            indice === 0
                              ? 'one-time-code'
                              : 'off'
                          }
                          aria-label={
                            `Dígito ${indice + 1} do código`
                          }
                          disabled={carregando}
                          onFocus={(event) =>
                            event.target.select()
                          }
                          onChange={(event) =>
                            alterarDigitoCodigo(
                              indice,
                              event.target.value
                            )
                          }
                          onKeyDown={(event) =>
                            tratarTeclaCodigo(
                              event,
                              indice
                            )
                          }
                        />
                      )
                    )}
                  </div>

                </div>

              </div>


              <div className="recuperar-email-enviado">

                <span>
                  Código enviado para:
                </span>

                <strong>
                  {email}
                </strong>

              </div>


              <button
                type="submit"
                className="recuperar-enviar"
                disabled={carregando}
              >

                <FaCheckCircle />


                <span>
                  {carregando
                    ? 'Validando...'
                    : 'Validar código'}
                </span>

              </button>


              <button
                type="button"
                className="recuperar-secundario"
                onClick={reenviarCodigo}
                disabled={carregando}
              >
                Reenviar código
              </button>

            </form>

          )}


          {etapa === 3 && (

            <form
              className="recuperar-form"
              onSubmit={concluirRedefinicao}
            >

              <div className="recuperar-campo-area">

                <label htmlFor="novaSenha">
                  Nova senha
                </label>


                <div className="recuperar-input-box">

                  <FaLock />


                  <input
                    id="novaSenha"
                    type={
                      mostrarNovaSenha
                        ? 'text'
                        : 'password'
                    }

                    value={novaSenha}

                    onChange={(event) => {
                      setNovaSenha(
                        event.target.value
                      );

                      limparMensagem();
                    }}

                    placeholder="Digite a nova senha"
                    minLength={4}
                    maxLength={100}
                    autoComplete="new-password"
                    disabled={carregando}
                  />


                  <button
                    type="button"
                    className="recuperar-ver-senha"

                    onClick={() =>
                      setMostrarNovaSenha(
                        (valorAtual) =>
                          !valorAtual
                      )
                    }

                    aria-label={
                      mostrarNovaSenha
                        ? 'Ocultar senha'
                        : 'Mostrar senha'
                    }
                  >
                    {mostrarNovaSenha
                      ? <FaEyeSlash />
                      : <FaEye />}
                  </button>

                </div>

              </div>


              <div className="recuperar-campo-area">

                <label htmlFor="confirmarSenha">
                  Confirmar nova senha
                </label>


                <div className="recuperar-input-box">

                  <FaLock />


                  <input
                    id="confirmarSenha"
                    type={
                      mostrarConfirmacao
                        ? 'text'
                        : 'password'
                    }

                    value={confirmarSenha}

                    onChange={(event) => {
                      setConfirmarSenha(
                        event.target.value
                      );

                      limparMensagem();
                    }}

                    placeholder="Confirme a nova senha"
                    minLength={4}
                    maxLength={100}
                    autoComplete="new-password"
                    disabled={carregando}
                  />


                  <button
                    type="button"
                    className="recuperar-ver-senha"

                    onClick={() =>
                      setMostrarConfirmacao(
                        (valorAtual) =>
                          !valorAtual
                      )
                    }

                    aria-label={
                      mostrarConfirmacao
                        ? 'Ocultar confirmação'
                        : 'Mostrar confirmação'
                    }
                  >
                    {mostrarConfirmacao
                      ? <FaEyeSlash />
                      : <FaEye />}
                  </button>

                </div>

              </div>


              <button
                type="submit"
                className="recuperar-enviar"
                disabled={carregando}
              >

                <FaCheckCircle />


                <span>
                  {carregando
                    ? 'Redefinindo...'
                    : 'Redefinir senha'}
                </span>

              </button>

            </form>

          )}


          {etapa === 4 && (

            <div className="recuperar-concluido">

              <div className="recuperar-concluido-icone">
                <FaCheckCircle />
              </div>


              <strong>
                Senha alterada com sucesso
              </strong>


              <p>
                Utilize sua matrícula e a
                nova senha para entrar no
                Sistema Integrado de Gestão
                Interna RPMont.
              </p>


              <button
                type="button"
                className="recuperar-enviar"
                onClick={() => {
                  limparFluxoRecuperacao();
                  onVoltar?.();
                }}
              >
                Voltar para o login
              </button>

            </div>

          )}


          {mensagem && (

            <div
              className={
                `recuperar-mensagem ${tipoMensagem}`
              }
            >
              {mensagem}
            </div>

          )}


          {etapa !== 4 && (

            <div className="recuperar-suporte">

              <span>
                Não consegue recuperar o
                acesso?
              </span>

              <strong>
                Procure o administrador
                responsável pela sua unidade.
              </strong>

            </div>

          )}

        </div>

      </section>

    </main>
  );
}


export default RecuperarSenha;