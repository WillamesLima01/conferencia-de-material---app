import { useEffect, useMemo, useState } from 'react';

import {
  FaArrowLeft,
  FaBan,
  FaBuilding,
  FaLayerGroup,
  FaPen,
  FaRotateLeft,
} from 'react-icons/fa6';

import {
  atualizarSetor,
  cadastrarSetor,
  inativarSetor,
  listarSetores,
  reativarSetor,
} from '../services/setorService';

import {
  listarUnidadesAtivas,
} from '../services/unidadeService';

import '../styles/AdminSetores.css';

function AdminSetores({ usuario, onVoltar }) {
  const [unidades, setUnidades] = useState([]);
  const [setores, setSetores] = useState([]);

  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState('');
  const [nomeSetor, setNomeSetor] = useState('');
  const [setorEditando, setSetorEditando] = useState(null);

  const [setorParaAlterarStatus, setSetorParaAlterarStatus] = useState(null);
  const [modalStatusAberto, setModalStatusAberto] = useState(false);

  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('');

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  const usuarioEhAdminMaster = Number(usuario?.nivel) === 1;

  const mostrarMensagem = (texto, tipo = 'sucesso') => {
    setMensagem(texto);
    setTipoMensagem(tipo);

    window.setTimeout(() => {
      setMensagem('');
      setTipoMensagem('');
    }, 4000);
  };

  const obterMensagemErro = (erro) => {
    return (
      erro?.message ||
      erro?.response?.data?.message ||
      'Ocorreu um erro inesperado.'
    );
  };

  const normalizarLista = (resposta) => {
    if (Array.isArray(resposta)) {
      return resposta;
    }

    if (Array.isArray(resposta?.data)) {
      return resposta.data;
    }

    return [];
  };

  const filtrarUnidadesPermitidas = (lista) => {
    if (usuarioEhAdminMaster) {
      return lista;
    }

    const unidadeUsuario = String(usuario?.unidade || '')
      .trim()
      .toLowerCase();

    return lista.filter((unidade) => {
      const nome = String(unidade?.nome || '').trim().toLowerCase();
      const sigla = String(unidade?.sigla || '').trim().toLowerCase();

      return nome === unidadeUsuario || sigla === unidadeUsuario;
    });
  };

  useEffect(() => {
    let componenteAtivo = true;

    const carregarDadosIniciais = async () => {
      try {
        const [respostaUnidades, respostaSetores] = await Promise.all([
          listarUnidadesAtivas(),
          listarSetores(),
        ]);

        if (!componenteAtivo) {
          return;
        }

        const unidadesPermitidas = filtrarUnidadesPermitidas(
          normalizarLista(respostaUnidades)
        );

        setUnidades(unidadesPermitidas);
        setSetores(normalizarLista(respostaSetores));

        if (!usuarioEhAdminMaster && unidadesPermitidas.length === 1) {
          setUnidadeSelecionadaId(String(unidadesPermitidas[0].id));
        }
      } catch (erro) {
        if (componenteAtivo) {
          mostrarMensagem(
            obterMensagemErro(erro),
            'erro'
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregando(false);
        }
      }
    };

    carregarDadosIniciais();

    return () => {
      componenteAtivo = false;
    };
  }, [usuario?.nivel, usuario?.unidade]);

  const recarregarSetores = async () => {
    const resposta = await listarSetores();
    setSetores(normalizarLista(resposta));
  };

  const setoresFiltrados = useMemo(() => {
    if (!unidadeSelecionadaId) {
      return setores;
    }

    return setores.filter(
      (setor) =>
        String(setor.unidadeId) === String(unidadeSelecionadaId)
    );
  }, [setores, unidadeSelecionadaId]);

  const limparFormulario = () => {
    setNomeSetor('');
    setSetorEditando(null);

    if (usuarioEhAdminMaster) {
      setUnidadeSelecionadaId('');
    }
  };

  const handleSalvar = async (event) => {
    event.preventDefault();

    const nomeTratado = nomeSetor.trim();
    const unidadeId = Number(unidadeSelecionadaId);

    if (!unidadeSelecionadaId || Number.isNaN(unidadeId)) {
      mostrarMensagem('Selecione uma unidade.', 'erro');
      return;
    }

    if (!nomeTratado) {
      mostrarMensagem('Informe o nome do setor.', 'erro');
      return;
    }

    const dados = {
      nome: nomeTratado,
      unidadeId,
    };

    try {
      setSalvando(true);

      if (setorEditando) {
        await atualizarSetor(setorEditando.id, dados);
        mostrarMensagem('Setor atualizado com sucesso.');
      } else {
        await cadastrarSetor(dados);
        mostrarMensagem('Setor cadastrado com sucesso.');
      }

      limparFormulario();
      await recarregarSetores();
    } catch (erro) {
      mostrarMensagem(
        obterMensagemErro(erro),
        'erro'
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (setor) => {
    if (!setor.ativo) {
      mostrarMensagem(
        'Reative o setor antes de editá-lo.',
        'erro'
      );
      return;
    }

    setSetorEditando(setor);
    setNomeSetor(setor.nome || '');
    setUnidadeSelecionadaId(String(setor.unidadeId));

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const abrirModalStatus = (setor) => {
    setSetorParaAlterarStatus(setor);
    setModalStatusAberto(true);
  };

  const cancelarAlteracaoStatus = () => {
    if (alterandoStatus) {
      return;
    }

    setModalStatusAberto(false);
    setSetorParaAlterarStatus(null);
  };

  const confirmarAlteracaoStatus = async () => {
    if (!setorParaAlterarStatus) {
      return;
    }

    try {
      setAlterandoStatus(true);

      if (setorParaAlterarStatus.ativo) {
        await inativarSetor(setorParaAlterarStatus.id);
        mostrarMensagem('Setor inativado com sucesso.');
      } else {
        await reativarSetor(setorParaAlterarStatus.id);
        mostrarMensagem('Setor reativado com sucesso.');
      }

      if (setorEditando?.id === setorParaAlterarStatus.id) {
        limparFormulario();
      }

      setModalStatusAberto(false);
      setSetorParaAlterarStatus(null);

      await recarregarSetores();
    } catch (erro) {
      mostrarMensagem(
        obterMensagemErro(erro),
        'erro'
      );
    } finally {
      setAlterandoStatus(false);
    }
  };

  return (
    <main className="admin-setores-page">
      <section className="admin-setores-phone">
        <header className="admin-setores-header">
          <button
            type="button"
            className="admin-setores-voltar-button"
            onClick={onVoltar}
            aria-label="Voltar"
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
            <p>
              Cadastre, edite, inative e reative setores vinculados às
              unidades administrativas.
            </p>
          </div>
        </section>

        {mensagem && (
          <div
            className={`admin-setores-mensagem ${
              tipoMensagem === 'erro'
                ? 'admin-setores-mensagem-erro'
                : 'admin-setores-mensagem-sucesso'
            }`}
          >
            {mensagem}
          </div>
        )}

        {carregando ? (
          <section className="admin-setores-card">
            <div className="admin-setores-vazio">
              Carregando unidades e setores...
            </div>
          </section>
        ) : unidades.length === 0 ? (
          <section className="admin-setores-card">
            <div className="admin-setores-vazio">
              Nenhuma unidade ativa disponível para cadastro de setores.
            </div>
          </section>
        ) : (
          <>
            <section className="admin-setores-card">
              <h2>
                {setorEditando
                  ? 'Editar Setor'
                  : 'Cadastrar Novo Setor'}
              </h2>

              <form
                onSubmit={handleSalvar}
                className="admin-setores-form"
              >
                <div className="admin-setores-form-group">
                  <label htmlFor="unidadeSetor">Unidade</label>

                  <select
                    id="unidadeSetor"
                    value={unidadeSelecionadaId}
                    onChange={(event) =>
                      setUnidadeSelecionadaId(event.target.value)
                    }
                    disabled={salvando || !usuarioEhAdminMaster}
                  >
                    <option value="">Selecione uma unidade</option>

                    {unidades.map((unidade) => (
                      <option
                        key={unidade.id}
                        value={unidade.id}
                      >
                        {unidade.nome} ({unidade.sigla})
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
                    onChange={(event) =>
                      setNomeSetor(event.target.value)
                    }
                    placeholder="Ex: P4"
                    maxLength={100}
                    disabled={salvando}
                  />
                </div>

                <div className="admin-setores-botoes">
                  <button
                    type="submit"
                    className="btn-salvar-setor"
                    disabled={salvando}
                  >
                    {salvando
                      ? 'Salvando...'
                      : setorEditando
                        ? 'Atualizar Setor'
                        : 'Cadastrar Setor'}
                  </button>

                  {setorEditando && (
                    <button
                      type="button"
                      className="btn-cancelar-setor"
                      onClick={limparFormulario}
                      disabled={salvando}
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
                  <p>
                    Total de {setoresFiltrados.length} setor(es)
                  </p>
                </div>
              </div>

              {setoresFiltrados.length === 0 ? (
                <div className="admin-setores-vazio">
                  Nenhum setor cadastrado.
                </div>
              ) : (
                <div className="admin-setores-lista">
                  {setoresFiltrados.map((setor) => (
                    <div
                      className={`admin-setores-item ${
                        !setor.ativo
                          ? 'admin-setores-item-inativo'
                          : ''
                      }`}
                      key={setor.id}
                    >
                      <div className="admin-setores-item-info">
                        <div className="admin-setores-item-icon">
                          <FaLayerGroup />
                        </div>

                        <div>
                          <h3>{setor.nome}</h3>

                          <p>
                            <FaBuilding /> {setor.unidadeNome}
                            {' · '}
                            {setor.ativo ? 'Ativo' : 'Inativo'}
                          </p>
                        </div>
                      </div>

                      <div className="admin-setores-item-acoes">
                        {setor.ativo && (
                          <button
                            type="button"
                            className="btn-editar-setor"
                            onClick={() => handleEditar(setor)}
                            title="Editar setor"
                            aria-label={`Editar ${setor.nome}`}
                          >
                            <FaPen />
                          </button>
                        )}

                        <button
                          type="button"
                          className={
                            setor.ativo
                              ? 'btn-excluir-setor'
                              : 'btn-reativar-setor'
                          }
                          onClick={() => abrirModalStatus(setor)}
                          title={
                            setor.ativo
                              ? 'Inativar setor'
                              : 'Reativar setor'
                          }
                          aria-label={
                            setor.ativo
                              ? `Inativar ${setor.nome}`
                              : `Reativar ${setor.nome}`
                          }
                        >
                          {setor.ativo ? (
                            <FaBan />
                          ) : (
                            <FaRotateLeft />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {modalStatusAberto && (
          <div className="admin-setores-modal-overlay">
            <div className="admin-setores-modal-card">
              <div
                className={`admin-setores-modal-icon ${
                  setorParaAlterarStatus?.ativo
                    ? 'excluir'
                    : 'reativar'
                }`}
              >
                {setorParaAlterarStatus?.ativo ? (
                  <FaBan />
                ) : (
                  <FaRotateLeft />
                )}
              </div>

              <h2>
                {setorParaAlterarStatus?.ativo
                  ? 'Inativar setor?'
                  : 'Reativar setor?'}
              </h2>

              <p>
                Deseja realmente{' '}
                {setorParaAlterarStatus?.ativo
                  ? 'inativar'
                  : 'reativar'}{' '}
                o setor{' '}
                <strong>{setorParaAlterarStatus?.nome}</strong>?
              </p>

              <div className="admin-setores-modal-actions">
                <button
                  type="button"
                  className="admin-setores-modal-primary"
                  onClick={confirmarAlteracaoStatus}
                  disabled={alterandoStatus}
                >
                  {alterandoStatus
                    ? 'Processando...'
                    : setorParaAlterarStatus?.ativo
                      ? 'Sim, inativar'
                      : 'Sim, reativar'}
                </button>

                <button
                  type="button"
                  className="admin-setores-modal-secondary"
                  onClick={cancelarAlteracaoStatus}
                  disabled={alterandoStatus}
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