import { useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBuilding,
  FaLayerGroup,
  FaPen,
  FaTrash,
  FaUserGear,
} from 'react-icons/fa6';
import '../styles/AdminUsuarios.css';

const STORAGE_KEY_UNIDADES = 'unidades';
const STORAGE_KEY_SETORES = 'setores';
const STORAGE_KEY_USUARIOS = 'usuarios';

const gerarId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return String(Date.now() + Math.random());
};

const dataAtual = () => {
  return new Date().toISOString().slice(0, 10);
};

const dataHoraAtual = () => {
  return new Date().toISOString();
};

const carregarStorage = (chave) => {
  const dadosSalvos = localStorage.getItem(chave);

  if (!dadosSalvos) return [];

  try {
    return JSON.parse(dadosSalvos);
  } catch {
    return [];
  }
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

function AdminUsuarios({ usuario, onVoltar }) {
  const [unidades] = useState(() => carregarStorage(STORAGE_KEY_UNIDADES));
  const [setores] = useState(() => carregarStorage(STORAGE_KEY_SETORES));
  const [usuarios, setUsuarios] = useState(() =>
    carregarStorage(STORAGE_KEY_USUARIOS)
  );

  const [matricula, setMatricula] = useState('');
  const [nome, setNome] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [postGrad, setPostGrad] = useState('');
  const [nivel, setNivel] = useState('2');
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('');

  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
  }, [usuarios]);

  const setoresDaUnidade = useMemo(() => {
    if (!unidadeSelecionada) return [];

    return setores.filter((setor) => setor.unidadeNome === unidadeSelecionada);
  }, [setores, unidadeSelecionada]);

  const limparFormulario = () => {
    setMatricula('');
    setNome('');
    setNomeCompleto('');
    setEmail('');
    setSenha('');
    setPostGrad('');
    setNivel('2');
    setUnidadeSelecionada('');
    setSetorSelecionado('');
    setUsuarioEditando(null);
  };

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    setTimeout(() => {
      setMensagem('');
    }, 3000);
  };

  const handleSalvar = (event) => {
    event.preventDefault();

    const matriculaTratada = formatarMatricula(matricula);
    const nomeTratado = nome.trim();
    const nomeCompletoTratado = nomeCompleto.trim();
    const emailTratado = email.trim();
    const senhaTratada = senha.trim();
    const postGradTratado = postGrad.trim();

    if (!matriculaTratada) {
      mostrarMensagem('Informe a matrícula.');
      return;
    }

    if (!matriculaValida(matriculaTratada)) {
      mostrarMensagem('A matrícula deve estar no formato 000.000-0.');
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

    if (!postGradTratado) {
      mostrarMensagem('Informe o posto/graduação.');
      return;
    }

    if (!unidadeSelecionada) {
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

    const matriculaJaExiste = usuarios.some(
      (item) =>
        formatarMatricula(item.MATRICULA) === matriculaTratada &&
        item.ID !== usuarioEditando?.ID
    );

    if (matriculaJaExiste) {
      mostrarMensagem('Já existe usuário cadastrado com essa matrícula.');
      return;
    }

    if (usuarioEditando) {
      const usuariosAtualizados = usuarios.map((item) =>
        item.ID === usuarioEditando.ID
          ? {
              ...item,
              MATRICULA: matriculaTratada,
              NOME: nomeTratado,
              NOMECOMPLETO: nomeCompletoTratado,
              EMAIL: emailTratado,
              SENHA: senhaTratada || item.SENHA,
              NIVEL: Number(nivel),
              POSTGRAD: postGradTratado,
              SETOR: setorSelecionado,
              UNIDADE: unidadeSelecionada,
              DATAMODIFICACAO: dataHoraAtual(),
              userModificador: usuario?.ID || usuario?.id || 1,
            }
          : item
      );

      setUsuarios(usuariosAtualizados);
      limparFormulario();
      mostrarMensagem('Usuário atualizado com sucesso.');
      return;
    }

    const novoUsuario = {
      ID: gerarId(),
      MATRICULA: matriculaTratada,
      NOME: nomeTratado,
      SENHA: senhaTratada,
      EMAIL: emailTratado,
      NIVEL: Number(nivel),
      POSTGRAD: postGradTratado,
      SETOR: setorSelecionado,
      NOMECOMPLETO: nomeCompletoTratado,
      UNIDADE: unidadeSelecionada,
      DATACADASTRO: dataAtual(),
      DATAMODIFICACAO: dataHoraAtual(),
      userModificador: usuario?.ID || usuario?.id || 1,
      DIGITAL: null,
    };

    setUsuarios((listaAtual) => [...listaAtual, novoUsuario]);
    limparFormulario();
    mostrarMensagem('Usuário cadastrado com sucesso.');
  };

  const handleEditar = (item) => {
    setUsuarioEditando(item);
    setMatricula(formatarMatricula(item.MATRICULA || ''));
    setNome(item.NOME || '');
    setNomeCompleto(item.NOMECOMPLETO || '');
    setEmail(item.EMAIL || '');
    setSenha('');
    setPostGrad(item.POSTGRAD || '');
    setNivel(String(item.NIVEL || 2));
    setUnidadeSelecionada(item.UNIDADE || '');
    setSetorSelecionado(item.SETOR || '');
  };

  const handleExcluir = (item) => {
    setUsuarioParaExcluir(item);
    setModalExcluirAberto(true);
  };

  const confirmarExclusao = () => {
    if (!usuarioParaExcluir) return;

    const usuariosAtualizados = usuarios.filter(
      (item) => item.ID !== usuarioParaExcluir.ID
    );

    setUsuarios(usuariosAtualizados);
    limparFormulario();
    setModalExcluirAberto(false);
    setUsuarioParaExcluir(null);
    mostrarMensagem('Usuário excluído com sucesso.');
  };

  const cancelarExclusao = () => {
    setModalExcluirAberto(false);
    setUsuarioParaExcluir(null);
  };

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
              {usuario?.unidade ||
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
            <p>Cadastre usuários vinculados a unidade, setor e nível de acesso.</p>
          </div>
        </section>

        {mensagem && <div className="admin-usuarios-mensagem">{mensagem}</div>}

        <section className="admin-usuarios-card">
          <h2>{usuarioEditando ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</h2>

          <form onSubmit={handleSalvar} className="admin-usuarios-form">
            <div className="admin-usuarios-grid">
              <div className="admin-usuarios-form-group">
                <label htmlFor="matricula">Matrícula</label>

                <input
                  id="matricula"
                  type="text"
                  value={matricula}
                  onChange={(event) => {
                    const matriculaFormatada = formatarMatricula(
                      event.target.value
                    );
                    setMatricula(matriculaFormatada);
                  }}
                  placeholder="Ex: 525.709-3"
                  maxLength={9}
                  inputMode="numeric"
                />
              </div>

              <div className="admin-usuarios-form-group">
                <label htmlFor="postGrad">Post/Grad</label>
                <input
                  id="postGrad"
                  type="text"
                  value={postGrad}
                  onChange={(event) => setPostGrad(event.target.value)}
                  placeholder="Ex: SD"
                />
              </div>
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="nome">Nome de Guerra</label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: Lima"
              />
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="nomeCompleto">Nome Completo</label>
              <input
                id="nomeCompleto"
                type="text"
                value={nomeCompleto}
                onChange={(event) => setNomeCompleto(event.target.value)}
                placeholder="Ex: Willames Pereira Lima"
              />
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Ex: usuario@email.com"
              />
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="unidade">Unidade</label>
              <select
                id="unidade"
                value={unidadeSelecionada}
                onChange={(event) => {
                  setUnidadeSelecionada(event.target.value);
                  setSetorSelecionado('');
                }}
              >
                <option value="">Selecione uma unidade</option>

                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.nome}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-usuarios-form-group">
              <label htmlFor="setor">Setor</label>
              <select
                id="setor"
                value={setorSelecionado}
                onChange={(event) => setSetorSelecionado(event.target.value)}
                disabled={!unidadeSelecionada}
              >
                <option value="">
                  {unidadeSelecionada
                    ? 'Selecione um setor'
                    : 'Selecione uma unidade primeiro'}
                </option>

                {setoresDaUnidade.map((setor) => (
                  <option key={setor.id} value={setor.nome}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-usuarios-grid">
              <div className="admin-usuarios-form-group">
                <label htmlFor="nivel">Nível</label>
                <select
                  id="nivel"
                  value={nivel}
                  onChange={(event) => setNivel(event.target.value)}
                >
                  <option value="1">Administrador</option>
                  <option value="2">Usuário comum</option>
                </select>
              </div>

              <div className="admin-usuarios-form-group">
                <label htmlFor="senha">Senha</label>
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder={
                    usuarioEditando ? 'Manter senha atual' : 'Senha inicial'
                  }
                />
              </div>
            </div>

            <div className="admin-usuarios-botoes">
              <button type="submit" className="btn-salvar-usuario">
                {usuarioEditando ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
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
              <h2>Usuários Cadastrados</h2>
              <p>Total de {usuarios.length} usuário(s)</p>
            </div>
          </div>

          {usuarios.length === 0 ? (
            <div className="admin-usuarios-vazio">Nenhum usuário cadastrado.</div>
          ) : (
            <div className="admin-usuarios-lista">
              {usuarios.map((item) => (
                <div className="admin-usuarios-item" key={item.ID}>
                  <div className="admin-usuarios-item-info">
                    <div className="admin-usuarios-item-icon">
                      <FaUserGear />
                    </div>

                    <div>
                      <h3>
                        {item.POSTGRAD} {item.NOME}
                      </h3>

                      <p>Matrícula: {formatarMatricula(item.MATRICULA)}</p>

                      <p>
                        <FaBuilding /> {item.UNIDADE}
                      </p>

                      <p>
                        <FaLayerGroup /> {item.SETOR}
                      </p>

                      <span>
                        {Number(item.NIVEL) === 1
                          ? 'Administrador'
                          : 'Usuário comum'}
                      </span>
                    </div>
                  </div>

                  <div className="admin-usuarios-item-acoes">
                    <button
                      type="button"
                      className="btn-editar-usuario"
                      onClick={() => handleEditar(item)}
                    >
                      <FaPen />
                    </button>

                    <button
                      type="button"
                      className="btn-excluir-usuario"
                      onClick={() => handleExcluir(item)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
                  {usuarioParaExcluir?.POSTGRAD} {usuarioParaExcluir?.NOME}
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