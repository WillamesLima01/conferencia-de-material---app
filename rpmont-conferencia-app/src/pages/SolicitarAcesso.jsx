import { useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaCircleCheck,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaIdCard,
  FaLock,
  FaShieldHalved,
  FaUser,
  FaUserPlus,
} from 'react-icons/fa6';

import '../styles/SolicitarAcesso.css';
import { solicitarAcesso } from '../services/usuarioService';

const STORAGE_KEY_UNIDADES = 'unidades';
const STORAGE_KEY_SETORES = 'setores';

const POSTOS_GRADUACOES = [
  'Cel',
  'Ten Cel',
  'Maj',
  'Cap',
  '1 Ten',
  '2 Ten',
  'Asp',
  'Sub Ten',
  '1 Sgt',
  '2 Sgt',
  '3 Sgt',
  'Cb',
  'Sd',
];

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

const obterNomeUnidade = (unidade) => {
  return (
    unidade?.nome ||
    unidade?.nomeUnidade ||
    unidade?.unidade ||
    unidade?.UNIDADE ||
    unidade?.descricao ||
    ''
  );
};

const obterNomeSetor = (setor) => {
  return (
    setor?.nome ||
    setor?.nomeSetor ||
    setor?.setor ||
    setor?.SETOR ||
    setor?.descricao ||
    ''
  );
};

function SolicitarAcesso({ onVoltar }) {
  const [matricula, setMatricula] = useState('');
  const [nome, setNome] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [postGrad, setPostGrad] = useState('');
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [mensagem, setMensagem] = useState('');
  const [solicitacaoEnviada, setSolicitacaoEnviada] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const unidadesCadastradas = useMemo(() => {
    const unidades = carregarStorage(STORAGE_KEY_UNIDADES);

    if (unidades.length > 0) {
      return unidades;
    }

    return [
      {
        id: 'rpmont',
        nome: 'RPMont',
      },
    ];
  }, []);

  const setoresCadastrados = useMemo(() => {
    return carregarStorage(STORAGE_KEY_SETORES);
  }, []);

  const setoresDaUnidade = useMemo(() => {
    if (!unidadeSelecionada) return [];

    const setoresFiltrados = setoresCadastrados.filter((setor) => {
      const unidadeDoSetor =
        setor?.unidadeNome ||
        setor?.unidade ||
        setor?.UNIDADE ||
        setor?.nomeUnidade ||
        '';

      return (
        normalizarTexto(unidadeDoSetor) ===
        normalizarTexto(unidadeSelecionada)
      );
    });

    if (setoresFiltrados.length > 0) {
      return setoresFiltrados;
    }

    return [
      {
        id: 'p4',
        nome: 'P4',
      },
      {
        id: 'baia',
        nome: 'Baia',
      },
      {
        id: 'comando',
        nome: 'Comando',
      },
    ];
  }, [setoresCadastrados, unidadeSelecionada]);

  const limparFormulario = () => {
    setMatricula('');
    setNome('');
    setNomeCompleto('');
    setEmail('');
    setPostGrad('');
    setUnidadeSelecionada('');
    setSetorSelecionado('');
    setSenha('');
    setConfirmarSenha('');
    setMostrarSenha(false);
    setMostrarConfirmarSenha(false);
  };

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    window.setTimeout(() => {
      setMensagem('');
    }, 4000);
  };

  const validarFormulario = () => {
    const matriculaTratada = formatarMatricula(matricula);
    const matriculaNormalizada = normalizarMatricula(matriculaTratada);
    const nomeTratado = nome.trim();
    const nomeCompletoTratado = nomeCompleto.trim();
    const emailTratado = email.trim();
    const postGradTratado = postGrad.trim();
    const senhaTratada = senha.trim();
    const confirmarSenhaTratada = confirmarSenha.trim();

    if (matriculaNormalizada.length !== 7) {
      mostrarMensagem('Informe uma matrícula válida com 7 números.');
      return null;
    }

    if (!nomeTratado) {
      mostrarMensagem('Informe o nome de guerra.');
      return null;
    }

    if (!nomeCompletoTratado) {
      mostrarMensagem('Informe o nome completo.');
      return null;
    }

    if (!emailTratado) {
      mostrarMensagem('Informe o e-mail cadastrado do usuário.');
      return null;
    }

    if (!emailValido(emailTratado)) {
      mostrarMensagem('Informe um e-mail válido.');
      return null;
    }

    if (!postGradTratado) {
      mostrarMensagem('Selecione o posto/graduação.');
      return null;
    }

    if (!unidadeSelecionada) {
      mostrarMensagem('Selecione a unidade.');
      return null;
    }

    if (!setorSelecionado) {
      mostrarMensagem('Selecione o setor.');
      return null;
    }

    if (!senhaTratada) {
      mostrarMensagem('Informe a senha.');
      return null;
    }

    if (senhaTratada.length < 6) {
      mostrarMensagem('A senha deve ter pelo menos 6 caracteres.');
      return null;
    }

    if (senhaTratada !== confirmarSenhaTratada) {
      mostrarMensagem('A senha e a confirmação de senha não conferem.');
      return null;
    }

    return {
      matricula: matriculaTratada,
      nome: nomeTratado,
      nomeCompleto: nomeCompletoTratado,
      email: emailTratado,
      postGrad: postGradTratado,
      unidade: unidadeSelecionada,
      setor: setorSelecionado,
      senha: senhaTratada,
    };
  };

  const handleSalvar = async (event) => {
    event.preventDefault();

    const dadosValidados = validarFormulario();

    if (!dadosValidados) return;

    try {
      setEnviando(true);
      setMensagem('');

      await solicitarAcesso(dadosValidados);

      limparFormulario();
      setSolicitacaoEnviada(true);

      window.setTimeout(() => {
        const telaCadastro = document.querySelector(
          '.solicitar-acesso-phone'
        );

        if (telaCadastro) {
          telaCadastro.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }
      }, 100);
    } catch (erro) {
      mostrarMensagem(
        erro?.message ||
          'Não foi possível enviar a solicitação de acesso.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="solicitar-acesso-page">
      <section className="solicitar-acesso-phone">
        <header className="solicitar-acesso-header">
          <button
            type="button"
            className="solicitar-acesso-voltar"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Cadastro de usuário</span>
            <h1>Cadastrar-se</h1>
            <p>Preencha seus dados para solicitar liberação de acesso.</p>
          </div>
        </header>

        {solicitacaoEnviada ? (
          <section className="solicitar-acesso-sucesso">
            <FaCircleCheck />

            <h2>Solicitação enviada</h2>

            <p>
              Solicitação de acesso enviada ao administrador com sucesso!
              Aguarde a liberação para entrar no aplicativo.
            </p>

            <button type="button" onClick={onVoltar}>
              Voltar para o login
            </button>
          </section>
        ) : (
          <>
            <section className="solicitar-acesso-apresentacao">
              <div className="solicitar-acesso-apresentacao-icon">
                <FaShieldHalved />
              </div>

              <div>
                <span>Novo usuário</span>
                <h2>Cadastro inicial</h2>

                <p>
                  O cadastro ficará pendente até ser conferido e liberado por
                  um administrador do sistema.
                </p>
              </div>
            </section>

            {mensagem && (
              <div className="solicitar-acesso-mensagem">{mensagem}</div>
            )}

            <form className="solicitar-acesso-card" onSubmit={handleSalvar}>
              <div className="solicitar-acesso-form-group">
                <label htmlFor="matricula">Matrícula</label>

                <div className="solicitar-acesso-input-icon">
                  <FaIdCard />

                  <input
                    id="matricula"
                    type="text"
                    value={matricula}
                    placeholder="000.000-0"
                    inputMode="numeric"
                    maxLength={9}
                    disabled={enviando}
                    onChange={(event) => {
                      setMatricula(formatarMatricula(event.target.value));
                    }}
                  />
                </div>
              </div>

              <div className="solicitar-acesso-form-group">
                <label htmlFor="nome">Nome de guerra</label>

                <div className="solicitar-acesso-input-icon">
                  <FaUser />

                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    placeholder="Ex.: Silva"
                    disabled={enviando}
                    onChange={(event) => setNome(event.target.value)}
                  />
                </div>
              </div>

              <div className="solicitar-acesso-form-group">
                <label htmlFor="nomeCompleto">Nome completo</label>

                <div className="solicitar-acesso-input-icon">
                  <FaUser />

                  <input
                    id="nomeCompleto"
                    type="text"
                    value={nomeCompleto}
                    placeholder="Digite o nome completo"
                    disabled={enviando}
                    onChange={(event) => setNomeCompleto(event.target.value)}
                  />
                </div>
              </div>

              <div className="solicitar-acesso-form-group">
                <label htmlFor="email">E-mail obrigatório</label>

                <div className="solicitar-acesso-input-icon">
                  <FaEnvelope />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    placeholder="email@exemplo.com"
                    disabled={enviando}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="solicitar-acesso-form-group">
                <label htmlFor="postGrad">Post/Grad</label>

                <select
                  id="postGrad"
                  value={postGrad}
                  disabled={enviando}
                  onChange={(event) => setPostGrad(event.target.value)}
                >
                  <option value="">Selecione o Post/Grad</option>

                  {POSTOS_GRADUACOES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="solicitar-acesso-grid">
                <div className="solicitar-acesso-form-group">
                  <label htmlFor="unidade">Unidade</label>

                  <select
                    id="unidade"
                    value={unidadeSelecionada}
                    disabled={enviando}
                    onChange={(event) => {
                      setUnidadeSelecionada(event.target.value);
                      setSetorSelecionado('');
                    }}
                  >
                    <option value="">Selecione a unidade</option>

                    {unidadesCadastradas.map((unidade) => {
                      const nomeUnidade = obterNomeUnidade(unidade);

                      return (
                        <option
                          key={unidade.id || nomeUnidade}
                          value={nomeUnidade}
                        >
                          {nomeUnidade}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="solicitar-acesso-form-group">
                  <label htmlFor="setor">Setor</label>

                  <select
                    id="setor"
                    value={setorSelecionado}
                    disabled={!unidadeSelecionada || enviando}
                    onChange={(event) => setSetorSelecionado(event.target.value)}
                  >
                    <option value="">
                      {unidadeSelecionada
                        ? 'Selecione o setor'
                        : 'Selecione a unidade primeiro'}
                    </option>

                    {setoresDaUnidade.map((setor) => {
                      const nomeSetor = obterNomeSetor(setor);

                      return (
                        <option key={setor.id || nomeSetor} value={nomeSetor}>
                          {nomeSetor}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="solicitar-acesso-grid">
                <div className="solicitar-acesso-form-group">
                  <label htmlFor="senha">Senha</label>

                  <div className="solicitar-acesso-input-icon">
                    <FaLock />

                    <input
                      id="senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      placeholder="Mínimo 6 caracteres"
                      disabled={enviando}
                      onChange={(event) => setSenha(event.target.value)}
                    />

                    <button
                      type="button"
                      className="solicitar-acesso-eye"
                      disabled={enviando}
                      onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                      aria-label="Mostrar ou ocultar senha"
                    >
                      {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="solicitar-acesso-form-group">
                  <label htmlFor="confirmarSenha">Confirmar senha</label>

                  <div className="solicitar-acesso-input-icon">
                    <FaLock />

                    <input
                      id="confirmarSenha"
                      type={mostrarConfirmarSenha ? 'text' : 'password'}
                      value={confirmarSenha}
                      placeholder="Repita a senha"
                      disabled={enviando}
                      onChange={(event) =>
                        setConfirmarSenha(event.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="solicitar-acesso-eye"
                      disabled={enviando}
                      onClick={() =>
                        setMostrarConfirmarSenha((valorAtual) => !valorAtual)
                      }
                      aria-label="Mostrar ou ocultar confirmação de senha"
                    >
                      {mostrarConfirmarSenha ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="solicitar-acesso-aviso">
                <strong>Importante</strong>

                <span>
                  O cadastro será enviado como usuário comum e ficará pendente.
                  O administrador da sua unidade deverá conferir os dados e
                  liberar o acesso.
                </span>
              </div>

              <button
                type="submit"
                className="solicitar-acesso-salvar"
                disabled={enviando}
              >
                <FaUserPlus />
                {enviando ? 'Enviando...' : 'Enviar cadastro'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default SolicitarAcesso;
