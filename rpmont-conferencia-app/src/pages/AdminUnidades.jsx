import { useEffect, useState } from 'react';
import { FaArrowLeft, FaBuilding, FaPen, FaTrash } from 'react-icons/fa6';
import '../styles/AdminUnidades.css';

const STORAGE_KEY_UNIDADES = 'unidades';

const gerarId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return String(Date.now() + Math.random());
};

const carregarUnidadesIniciais = () => {
  const unidadesSalvas = localStorage.getItem(STORAGE_KEY_UNIDADES);

  if (unidadesSalvas) {
    try {
      return JSON.parse(unidadesSalvas);
    } catch {
      return [];
    }
  }

  return [
    {
      id: gerarId(),
      nome: 'RPMont',
    },
    {
      id: gerarId(),
      nome: '3º EPMont',
    },
  ];
};

function AdminUnidades({ usuario, onVoltar }) {
  const [unidades, setUnidades] = useState(carregarUnidadesIniciais);
  const [nomeUnidade, setNomeUnidade] = useState('');
  const [unidadeEditando, setUnidadeEditando] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [unidadeParaExcluir, setUnidadeParaExcluir] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_UNIDADES, JSON.stringify(unidades));
  }, [unidades]);

  const limparFormulario = () => {
    setNomeUnidade('');
    setUnidadeEditando(null);
  };

  const mostrarMensagem = (texto) => {
    setMensagem(texto);

    setTimeout(() => {
      setMensagem('');
    }, 3000);
  };

  const handleSalvar = (event) => {
    event.preventDefault();

    const nomeTratado = nomeUnidade.trim();

    if (!nomeTratado) {
      mostrarMensagem('Informe o nome da unidade.');
      return;
    }

    const unidadeJaExiste = unidades.some(
      (unidade) =>
        unidade.nome.toLowerCase() === nomeTratado.toLowerCase() &&
        unidade.id !== unidadeEditando?.id
    );

    if (unidadeJaExiste) {
      mostrarMensagem('Essa unidade já está cadastrada.');
      return;
    }

    if (unidadeEditando) {
      const unidadesAtualizadas = unidades.map((unidade) =>
        unidade.id === unidadeEditando.id
          ? {
              ...unidade,
              nome: nomeTratado,
            }
          : unidade
      );

      setUnidades(unidadesAtualizadas);
      limparFormulario();
      mostrarMensagem('Unidade atualizada com sucesso.');
      return;
    }

    const novaUnidade = {
      id: gerarId(),
      nome: nomeTratado,
    };

    setUnidades((listaAtual) => [...listaAtual, novaUnidade]);
    limparFormulario();
    mostrarMensagem('Unidade cadastrada com sucesso.');
  };

  const handleEditar = (unidade) => {
    setUnidadeEditando(unidade);
    setNomeUnidade(unidade.nome);
  };

  const handleExcluir = (unidade) => {
    setUnidadeParaExcluir(unidade);
    setModalExcluirAberto(true);
  };

  const confirmarExclusao = () => {
    if (!unidadeParaExcluir) return;

    const unidadesAtualizadas = unidades.filter(
      (unidade) => unidade.id !== unidadeParaExcluir.id
    );

    setUnidades(unidadesAtualizadas);
    limparFormulario();
    setModalExcluirAberto(false);
    setUnidadeParaExcluir(null);
    mostrarMensagem('Unidade excluída com sucesso.');
  };

  const cancelarExclusao = () => {
    setModalExcluirAberto(false);
    setUnidadeParaExcluir(null);
  };

  const handleCancelarEdicao = () => {
    limparFormulario();
  };

  return (
    <main className="admin-unidades-page">
      <section className="admin-unidades-phone">
        <header className="admin-unidades-header">
          <button
            type="button"
            className="admin-unidades-voltar-button"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Área administrativa</span>
            <h1>Unidades</h1>
            <p>{usuario?.unidade || 'Gerenciamento de unidades'}</p>
          </div>
        </header>

        <section className="admin-unidades-boas-vindas">
          <div className="admin-unidades-boas-vindas-icon">
            <FaBuilding />
          </div>

          <div>
            <span>Cadastro administrativo</span>
            <h2>Gerenciar Unidades</h2>
            <p>Cadastre, edite e exclua unidades administrativas do sistema.</p>
          </div>
        </section>

        {mensagem && <div className="admin-unidades-mensagem">{mensagem}</div>}

        <section className="admin-unidades-card">
          <h2>{unidadeEditando ? 'Editar Unidade' : 'Cadastrar Nova Unidade'}</h2>

          <form onSubmit={handleSalvar} className="admin-unidades-form">
            <div className="admin-unidades-form-group">
              <label htmlFor="nomeUnidade">Nome da Unidade</label>

              <input
                id="nomeUnidade"
                type="text"
                value={nomeUnidade}
                onChange={(event) => setNomeUnidade(event.target.value)}
                placeholder="Ex: RPMont"
              />
            </div>

            <div className="admin-unidades-botoes">
              <button type="submit" className="btn-salvar-unidade">
                {unidadeEditando ? 'Atualizar Unidade' : 'Cadastrar Unidade'}
              </button>

              {unidadeEditando && (
                <button
                  type="button"
                  className="btn-cancelar-unidade"
                  onClick={handleCancelarEdicao}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-unidades-card">
          <div className="admin-unidades-lista-header">
            <div>
              <h2>Unidades Cadastradas</h2>
              <p>Total de {unidades.length} unidade(s)</p>
            </div>
          </div>

          {unidades.length === 0 ? (
            <div className="admin-unidades-vazio">
              Nenhuma unidade cadastrada.
            </div>
          ) : (
            <div className="admin-unidades-lista">
              {unidades.map((unidade) => (
                <div className="admin-unidades-item" key={unidade.id}>
                  <div className="admin-unidades-item-info">
                    <div className="admin-unidades-item-icon">
                      <FaBuilding />
                    </div>

                    <div>
                      <h3>{unidade.nome}</h3>
                      <p>Unidade administrativa</p>
                    </div>
                  </div>

                  <div className="admin-unidades-item-acoes">
                    <button
                      type="button"
                      className="btn-editar-unidade"
                      onClick={() => handleEditar(unidade)}
                    >
                      <FaPen />
                    </button>

                    <button
                      type="button"
                      className="btn-excluir-unidade"
                      onClick={() => handleExcluir(unidade)}
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
          <div className="admin-unidades-modal-overlay">
            <div className="admin-unidades-modal-card">
              <div className="admin-unidades-modal-icon excluir">
                <FaTrash />
              </div>

              <h2>Excluir unidade?</h2>

              <p>
                Deseja realmente excluir a unidade{' '}
                <strong>{unidadeParaExcluir?.nome}</strong>?
              </p>

              <div className="admin-unidades-modal-actions">
                <button
                  type="button"
                  className="admin-unidades-modal-primary"
                  onClick={confirmarExclusao}
                >
                  Sim, excluir
                </button>

                <button
                  type="button"
                  className="admin-unidades-modal-secondary"
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

export default AdminUnidades;