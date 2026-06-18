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

const STORAGE_KEY_USUARIOS = 'usuarios';
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

const gerarId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const dataHoje = () => {
  return new Date().toISOString().slice(0, 10);
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

const salvarStorage = (chave, dados) => {
  localStorage.setItem(chave, JSON.stringify(dados));
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
  const [matriculaBloqueada, setMatriculaBloqueada] = useState(false);

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
      const unidadeDoSetor = String(
        setor?.unidadeNome ||
          setor?.unidade ||
          setor?.UNIDADE ||
          setor?.nomeUnidade ||
          ''
      )
        .trim()
        .toLowerCase();

      return unidadeDoSetor === unidadeSelecionada.trim().toLowerCase();
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
    setMatriculaBloqueada(false);
  };

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    window.setTimeout(() => {
      setMensagem('');
    }, 4000);
  };

  const matriculaJaExiste = (usuarios, matriculaTratada) => {
    const matriculaNovaNormalizada = normalizarMatricula(matriculaTratada);

    return usuarios.some((usuario) => {
      const matriculaUsuario = usuario.MATRICULA || usuario.matricula || '';

      return normalizarMatricula(matriculaUsuario) === matriculaNovaNormalizada;
    });
  };

  const emailJaExiste = (usuarios, emailTratado) => {
    if (!emailTratado) return false;

    return usuarios.some((usuario) => {
      const emailUsuario = String(usuario.EMAIL || usuario.email || '')
        .trim()
        .toLowerCase();

      return emailUsuario && emailUsuario === emailTratado.toLowerCase();
    });
  };

  const verificarMatriculaCadastrada = (valorMatricula) => {
    const matriculaTratada = formatarMatricula(valorMatricula);
    const matriculaNormalizada = normalizarMatricula(matriculaTratada);

    if (!matriculaNormalizada) {
      setMatriculaBloqueada(false);
      setMensagem('');
      return;
    }

    if (matriculaNormalizada.length < 7) {
      setMatriculaBloqueada(false);
      setMensagem('');
      return;
    }

    const usuariosCadastrados = carregarStorage(STORAGE_KEY_USUARIOS);
    const jaExiste = matriculaJaExiste(usuariosCadastrados, matriculaTratada);

    if (jaExiste) {
      setMatriculaBloqueada(true);
      setMensagem('Matrícula já cadastrada no banco de dados.');
      return;
    }

    setMatriculaBloqueada(false);
    setMensagem('');
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

    if (matriculaBloqueada) {
      setMensagem('Matrícula já cadastrada no banco de dados.');
      return null;
    }

    const usuariosCadastrados = carregarStorage(STORAGE_KEY_USUARIOS);

    if (matriculaJaExiste(usuariosCadastrados, matriculaTratada)) {
      setMatriculaBloqueada(true);
      setMensagem('Matrícula já cadastrada no banco de dados.');
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
      mostrarMensagem('Informe o e-mail.');
      return null;
    }

    if (!emailTratado.includes('@') || !emailTratado.includes('.')) {
      mostrarMensagem('Informe um e-mail válido.');
      return null;
    }

    if (emailJaExiste(usuariosCadastrados, emailTratado)) {
      mostrarMensagem('Já existe cadastro ou solicitação com este e-mail.');
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
      matriculaTratada,
      nomeTratado,
      nomeCompletoTratado,
      emailTratado,
      postGradTratado,
      senhaTratada,
    };
  };

  const handleSalvar = (event) => {
    event.preventDefault();

    const dadosValidados = validarFormulario();

    if (!dadosValidados) return;

    const usuariosCadastrados = carregarStorage(STORAGE_KEY_USUARIOS);
    const agora = new Date().toISOString();

    const novoUsuarioSolicitado = {
      ID: gerarId(),

      MATRICULA: dadosValidados.matriculaTratada,
      NOME: dadosValidados.nomeTratado,
      NOMECOMPLETO: dadosValidados.nomeCompletoTratado,
      EMAIL: dadosValidados.emailTratado,
      POSTGRAD: dadosValidados.postGradTratado,
      UNIDADE: unidadeSelecionada,
      SETOR: setorSelecionado,
      SENHA: dadosValidados.senhaTratada,

      NIVEL: 2,
      STATUSACESSO: 'PENDENTE',
      ATIVO: 0,

      DATASOLICITACAO: agora,
      DATALIBERACAO: null,
      LIBERADOPOR: null,

      DATACADASTRO: dataHoje(),
      DATAMODIFICACAO: agora,
      userModificador: 0,
      DIGITAL: null,
    };

    const usuariosAtualizados = [
      novoUsuarioSolicitado,
      ...usuariosCadastrados,
    ];

    salvarStorage(STORAGE_KEY_USUARIOS, usuariosAtualizados);

    limparFormulario();
    setSolicitacaoEnviada(true);
    setMensagem('');

    window.setTimeout(() => {
      const telaCadastro = document.querySelector('.solicitar-acesso-phone');

      if (telaCadastro) {
        telaCadastro.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }, 100);
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

            <form
              className="solicitar-acesso-card"
              onSubmit={handleSalvar}
            >
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
                    onChange={(event) => {
                      const novaMatricula = formatarMatricula(
                        event.target.value
                      );

                      setMatricula(novaMatricula);
                      verificarMatriculaCadastrada(novaMatricula);
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
                    disabled={matriculaBloqueada}
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
                    disabled={matriculaBloqueada}
                    onChange={(event) => setNomeCompleto(event.target.value)}
                  />
                </div>
              </div>

              <div className="solicitar-acesso-form-group">
                <label htmlFor="email">Email</label>

                <div className="solicitar-acesso-input-icon">
                  <FaEnvelope />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    placeholder="email@exemplo.com"
                    disabled={matriculaBloqueada}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="solicitar-acesso-form-group">
                <label htmlFor="postGrad">Post/Grad</label>

                <select
                  id="postGrad"
                  value={postGrad}
                  disabled={matriculaBloqueada}
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
                    disabled={matriculaBloqueada}
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
                    disabled={!unidadeSelecionada || matriculaBloqueada}
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
                      disabled={matriculaBloqueada}
                      onChange={(event) => setSenha(event.target.value)}
                    />

                    <button
                      type="button"
                      className="solicitar-acesso-eye"
                      disabled={matriculaBloqueada}
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
                      disabled={matriculaBloqueada}
                      onChange={(event) =>
                        setConfirmarSenha(event.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="solicitar-acesso-eye"
                      disabled={matriculaBloqueada}
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
                  O cadastro não libera o acesso automaticamente. O
                  administrador deverá conferir os dados e aprovar a solicitação.
                </span>
              </div>

              <button
                type="submit"
                className="solicitar-acesso-salvar"
                disabled={matriculaBloqueada}
              >
                <FaUserPlus />
                Enviar cadastro
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default SolicitarAcesso;