import { useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBuilding,
  FaLayerGroup,
  FaPen,
  FaTrash,
} from 'react-icons/fa6';
import '../styles/AdminSetores.css';

const STORAGE_KEY_UNIDADES = 'unidades';
const STORAGE_KEY_SETORES = 'setores';

const gerarId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return String(Date.now() + Math.random());
};

const carregarUnidades = () => {
  const unidadesSalvas = localStorage.getItem(STORAGE_KEY_UNIDADES);

  if (!unidadesSalvas) return [];

  try {
    return JSON.parse(unidadesSalvas);
  } catch {
    return [];
  }
};

const carregarSetores = () => {
  const setoresSalvos = localStorage.getItem(STORAGE_KEY_SETORES);

  if (!setoresSalvos) return [];

  try {
    return JSON.parse(setoresSalvos);
  } catch {
    return [];
  }
};

function AdminSetores({ usuario, onVoltar }) {
  const [unidades] = useState(carregarUnidades);
  const [setores, setSetores] = useState(carregarSetores);
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState('');
  const [nomeSetor, setNomeSetor] = useState('');
  const [setorEditando, setSetorEditando] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [setorParaExcluir, setSetorParaExcluir] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETORES, JSON.stringify(setores));
  }, [setores]);

  const unidadeSelecionada = useMemo(() => {
    return unidades.find((unidade) => unidade.id === unidadeSelecionadaId);
  }, [unidades, unidadeSelecionadaId]);

  const setoresFiltrados = useMemo(() => {
    if (!unidadeSelecionadaId) return setores;

    return setores.filter((setor) => setor.unidadeId === unidadeSelecionadaId);
  }, [setores, unidadeSelecionadaId]);

  const limparFormulario = () => {
    setNomeSetor('');
    setSetorEditando(null);
  };

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    setTimeout(() => {
      setMensagem('');
    }, 3000);
  };

  const handleSalvar = (event) => {
    event.preventDefault();

    const nomeTratado = nomeSetor.trim();

    if (!unidadeSelecionadaId) {
      mostrarMensagem('Selecione uma unidade.');
      return;
    }

    if (!nomeTratado) {
      mostrarMensagem('Informe o nome do setor.');
      return;
    }

    const setorJaExiste = setores.some(
      (setor) =>
        setor.nome.toLowerCase() === nomeTratado.toLowerCase() &&
        setor.unidadeId === unidadeSelecionadaId &&
        setor.id !== setorEditando?.id
    );

    if (setorJaExiste) {
      mostrarMensagem('Esse setor já está cadastrado para esta unidade.');
      return;
    }

    if (setorEditando) {
      const setoresAtualizados = setores.map((setor) =>
        setor.id === setorEditando.id
          ? {
              ...setor,
              nome: nomeTratado,
              unidadeId: unidadeSelecionada.id,
              unidadeNome: unidadeSelecionada.nome,
            }
          : setor
      );

      setSetores(setoresAtualizados);
      limparFormulario();
      mostrarMensagem('Setor atualizado com sucesso.');
      return;
    }

    const novoSetor = {
      id: gerarId(),
      nome: nomeTratado,
      unidadeId: unidadeSelecionada.id,
      unidadeNome: unidadeSelecionada.nome,
    };

    setSetores((listaAtual) => [...listaAtual, novoSetor]);
    limparFormulario();
    mostrarMensagem('Setor cadastrado com sucesso.');
  };

  const handleEditar = (setor) => {
    setSetorEditando(setor);
    setNomeSetor(setor.nome);
    setUnidadeSelecionadaId(setor.unidadeId);
  };

  const handleExcluir = (setor) => {
    setSetorParaExcluir(setor);
    setModalExcluirAberto(true);
  };

  const confirmarExclusao = () => {
    if (!setorParaExcluir) return;

    const setoresAtualizados = setores.filter(
      (setor) => setor.id !== setorParaExcluir.id
    );

    setSetores(setoresAtualizados);
    limparFormulario();
    setModalExcluirAberto(false);
    setSetorParaExcluir(null);
    mostrarMensagem('Setor excluído com sucesso.');
  };

  const cancelarExclusao = () => {
    setModalExcluirAberto(false);
    setSetorParaExcluir(null);
  };

  const handleCancelarEdicao = () => {
    limparFormulario();
  };

  return (
    <main className="admin-setores-page">
      <section className="admin-setores-phone">
        <header className="admin-setores-header">
          <button
            type="button"
            className="admin-setores-voltar-button"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Área administrativa</span>
            <h1>Setores</h1>
            <p>{usuario?.unidade || 'Gerenciamento de setores'}</p>
          </div>
        </header>

        <section className="admin-setores-boas-vindas">
          <div className="admin-setores-boas-vindas-icon">
            <FaLayerGroup />
          </div>

          <div>
            <span>Cadastro administrativo</span>
            <h2>Gerenciar Setores</h2>
            <p>Cadastre setores vinculados às unidades administrativas.</p>
          </div>
        </section>

        {mensagem && <div className="admin-setores-mensagem">{mensagem}</div>}

        {unidades.length === 0 ? (
          <section className="admin-setores-card">
            <div className="admin-setores-vazio">
              Nenhuma unidade cadastrada. Cadastre uma unidade antes de criar
              setores.
            </div>
          </section>
        ) : (
          <>
            <section className="admin-setores-card">
              <h2>{setorEditando ? 'Editar Setor' : 'Cadastrar Novo Setor'}</h2>

              <form onSubmit={handleSalvar} className="admin-setores-form">
                <div className="admin-setores-form-group">
                  <label htmlFor="unidadeSetor">Unidade</label>

                  <select
                    id="unidadeSetor"
                    value={unidadeSelecionadaId}
                    onChange={(event) => setUnidadeSelecionadaId(event.target.value)}
                  >
                    <option value="">Selecione uma unidade</option>

                    {unidades.map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-setores-form-group">
                  <label htmlFor="nomeSetor">Nome do Setor</label>

                  <input
                    id="nomeSetor"
                    type="text"
                    value={nomeSetor}
                    onChange={(event) => setNomeSetor(event.target.value)}
                    placeholder="Ex: P4"
                  />
                </div>

                <div className="admin-setores-botoes">
                  <button type="submit" className="btn-salvar-setor">
                    {setorEditando ? 'Atualizar Setor' : 'Cadastrar Setor'}
                  </button>

                  {setorEditando && (
                    <button
                      type="button"
                      className="btn-cancelar-setor"
                      onClick={handleCancelarEdicao}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="admin-setores-card">
              <div className="admin-setores-lista-header">
                <div>
                  <h2>Setores Cadastrados</h2>
                  <p>Total de {setoresFiltrados.length} setor(es)</p>
                </div>
              </div>

              {setoresFiltrados.length === 0 ? (
                <div className="admin-setores-vazio">
                  Nenhum setor cadastrado.
                </div>
              ) : (
                <div className="admin-setores-lista">
                  {setoresFiltrados.map((setor) => (
                    <div className="admin-setores-item" key={setor.id}>
                      <div className="admin-setores-item-info">
                        <div className="admin-setores-item-icon">
                          <FaLayerGroup />
                        </div>

                        <div>
                          <h3>{setor.nome}</h3>

                          <p>
                            <FaBuilding /> {setor.unidadeNome}
                          </p>
                        </div>
                      </div>

                      <div className="admin-setores-item-acoes">
                        <button
                          type="button"
                          className="btn-editar-setor"
                          onClick={() => handleEditar(setor)}
                        >
                          <FaPen />
                        </button>

                        <button
                          type="button"
                          className="btn-excluir-setor"
                          onClick={() => handleExcluir(setor)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {modalExcluirAberto && (
          <div className="admin-setores-modal-overlay">
            <div className="admin-setores-modal-card">
              <div className="admin-setores-modal-icon excluir">
                <FaTrash />
              </div>

              <h2>Excluir setor?</h2>

              <p>
                Deseja realmente excluir o setor{' '}
                <strong>{setorParaExcluir?.nome}</strong>?
              </p>

              <div className="admin-setores-modal-actions">
                <button
                  type="button"
                  className="admin-setores-modal-primary"
                  onClick={confirmarExclusao}
                >
                  Sim, excluir
                </button>

                <button
                  type="button"
                  className="admin-setores-modal-secondary"
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

export default AdminSetores;