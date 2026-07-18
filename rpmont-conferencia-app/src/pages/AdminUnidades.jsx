import { useEffect, useState } from 'react';

import {
  FaArrowLeft,
  FaBan,
  FaBuilding,
  FaPen,
  FaRotateLeft,
} from 'react-icons/fa6';

import {
  atualizarUnidade,
  cadastrarUnidade,
  inativarUnidade,
  listarUnidades,
  reativarUnidade,
} from '../services/unidadeService';

import '../styles/AdminUnidades.css';

function AdminUnidades({ usuario, onVoltar }) {
  const [unidades, setUnidades] = useState([]);

  const [nomeUnidade, setNomeUnidade] = useState('');
  const [siglaUnidade, setSiglaUnidade] = useState('');

  const [unidadeEditando, setUnidadeEditando] = useState(null);

  const [
    unidadeParaAlterarStatus,
    setUnidadeParaAlterarStatus,
  ] = useState(null);

  const [
    modalStatusAberto,
    setModalStatusAberto,
  ] = useState(false);

  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('');

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [
    alterandoStatus,
    setAlterandoStatus,
  ] = useState(false);

  const limparFormulario = () => {
    setNomeUnidade('');
    setSiglaUnidade('');
    setUnidadeEditando(null);
  };

  const mostrarMensagem = (
    texto,
    tipo = 'sucesso'
  ) => {
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

  const carregarUnidades = async () => {
    try {
      const resposta = await listarUnidades();

      const lista = Array.isArray(resposta)
        ? resposta
        : Array.isArray(resposta?.data)
          ? resposta.data
          : [];

      setUnidades(lista);
    } catch (erro) {
      mostrarMensagem(
        obterMensagemErro(erro),
        'erro'
      );
    }
  };

  useEffect(() => {
    let componenteAtivo = true;

    const buscarUnidadesIniciais = async () => {
      try {
        const resposta = await listarUnidades();

        const lista = Array.isArray(resposta)
          ? resposta
          : Array.isArray(resposta?.data)
            ? resposta.data
            : [];

        if (componenteAtivo) {
          setUnidades(lista);
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

    buscarUnidadesIniciais();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const handleSalvar = async (event) => {
    event.preventDefault();

    const nomeTratado =
      nomeUnidade.trim();

    const siglaTratada =
      siglaUnidade
        .trim()
        .replace(/\s+/g, '')
        .toUpperCase();

    if (!nomeTratado) {
      mostrarMensagem(
        'Informe o nome da unidade.',
        'erro'
      );
      return;
    }

    if (!siglaTratada) {
      mostrarMensagem(
        'Informe a sigla da unidade.',
        'erro'
      );
      return;
    }

    const dados = {
      nome: nomeTratado,
      sigla: siglaTratada,
    };

    try {
      setSalvando(true);

      if (unidadeEditando) {
        await atualizarUnidade(
          unidadeEditando.id,
          dados
        );

        mostrarMensagem(
          'Unidade atualizada com sucesso.'
        );
      } else {
        await cadastrarUnidade(
          dados
        );

        mostrarMensagem(
          'Unidade cadastrada com sucesso.'
        );
      }

      limparFormulario();

      await carregarUnidades();
    } catch (erro) {
      mostrarMensagem(
        obterMensagemErro(erro),
        'erro'
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (unidade) => {
    if (!unidade.ativo) {
      mostrarMensagem(
        'Reative a unidade antes de editá-la.',
        'erro'
      );
      return;
    }

    setUnidadeEditando(unidade);
    setNomeUnidade(
      unidade.nome || ''
    );
    setSiglaUnidade(
      unidade.sigla || ''
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const abrirModalStatus = (unidade) => {
    setUnidadeParaAlterarStatus(
      unidade
    );

    setModalStatusAberto(true);
  };

  const cancelarAlteracaoStatus = () => {
    if (alterandoStatus) {
      return;
    }

    setModalStatusAberto(false);
    setUnidadeParaAlterarStatus(null);
  };

  const confirmarAlteracaoStatus =
    async () => {
      if (!unidadeParaAlterarStatus) {
        return;
      }

      try {
        setAlterandoStatus(true);

        if (
          unidadeParaAlterarStatus.ativo
        ) {
          await inativarUnidade(
            unidadeParaAlterarStatus.id
          );

          mostrarMensagem(
            'Unidade inativada com sucesso.'
          );
        } else {
          await reativarUnidade(
            unidadeParaAlterarStatus.id
          );

          mostrarMensagem(
            'Unidade reativada com sucesso.'
          );
        }

        if (
          unidadeEditando?.id ===
          unidadeParaAlterarStatus.id
        ) {
          limparFormulario();
        }

        setModalStatusAberto(false);
        setUnidadeParaAlterarStatus(null);

        await carregarUnidades();
      } catch (erro) {
        mostrarMensagem(
          obterMensagemErro(erro),
          'erro'
        );
      } finally {
        setAlterandoStatus(false);
      }
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
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Área administrativa</span>

            <h1>Unidades</h1>

            <p>
              {usuario?.unidade ||
                'Gerenciamento de unidades'}
            </p>
          </div>
        </header>

        <section className="admin-unidades-boas-vindas">
          <div className="admin-unidades-boas-vindas-icon">
            <FaBuilding />
          </div>

          <div>
            <span>
              Cadastro administrativo
            </span>

            <h2>
              Gerenciar Unidades
            </h2>

            <p>
              Cadastre, edite, inative e
              reative unidades administrativas
              do sistema.
            </p>
          </div>
        </section>

        {mensagem && (
          <div
            className={`admin-unidades-mensagem ${
              tipoMensagem === 'erro'
                ? 'admin-unidades-mensagem-erro'
                : 'admin-unidades-mensagem-sucesso'
            }`}
          >
            {mensagem}
          </div>
        )}

        <section className="admin-unidades-card">
          <h2>
            {unidadeEditando
              ? 'Editar Unidade'
              : 'Cadastrar Nova Unidade'}
          </h2>

          <form
            onSubmit={handleSalvar}
            className="admin-unidades-form"
          >
            <div className="admin-unidades-form-group">
              <label htmlFor="nomeUnidade">
                Nome da Unidade
              </label>

              <input
                id="nomeUnidade"
                type="text"
                value={nomeUnidade}
                onChange={(event) =>
                  setNomeUnidade(
                    event.target.value
                  )
                }
                placeholder="Ex: Regimento de Polícia Montada"
                maxLength={100}
                disabled={salvando}
              />
            </div>

            <div className="admin-unidades-form-group">
              <label htmlFor="siglaUnidade">
                Sigla
              </label>

              <input
                id="siglaUnidade"
                type="text"
                value={siglaUnidade}
                onChange={(event) =>
                  setSiglaUnidade(
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="Ex: RPMONT"
                maxLength={30}
                disabled={salvando}
              />
            </div>

            <div className="admin-unidades-botoes">
              <button
                type="submit"
                className="btn-salvar-unidade"
                disabled={salvando}
              >
                {salvando
                  ? 'Salvando...'
                  : unidadeEditando
                    ? 'Atualizar Unidade'
                    : 'Cadastrar Unidade'}
              </button>

              {unidadeEditando && (
                <button
                  type="button"
                  className="btn-cancelar-unidade"
                  onClick={
                    handleCancelarEdicao
                  }
                  disabled={salvando}
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
              <h2>
                Unidades Cadastradas
              </h2>

              <p>
                Total de {unidades.length}{' '}
                unidade(s)
              </p>
            </div>
          </div>

          {carregando ? (
            <div className="admin-unidades-vazio">
              Carregando unidades...
            </div>
          ) : unidades.length === 0 ? (
            <div className="admin-unidades-vazio">
              Nenhuma unidade cadastrada.
            </div>
          ) : (
            <div className="admin-unidades-lista">
              {unidades.map(
                (unidade) => (
                  <div
                    key={unidade.id}
                    className={`admin-unidades-item ${
                      !unidade.ativo
                        ? 'admin-unidades-item-inativo'
                        : ''
                    }`}
                  >
                    <div className="admin-unidades-item-info">
                      <div className="admin-unidades-item-icon">
                        <FaBuilding />
                      </div>

                      <div>
                        <h3>
                          {unidade.nome}
                        </h3>

                        <p>
                          {unidade.sigla} ·{' '}
                          {unidade.ativo
                            ? 'Ativa'
                            : 'Inativa'}
                        </p>
                      </div>
                    </div>

                    <div className="admin-unidades-item-acoes">
                      {unidade.ativo && (
                        <button
                          type="button"
                          className="btn-editar-unidade"
                          onClick={() =>
                            handleEditar(
                              unidade
                            )
                          }
                          title="Editar unidade"
                          aria-label={`Editar ${unidade.nome}`}
                        >
                          <FaPen />
                        </button>
                      )}

                      <button
                        type="button"
                        className={
                          unidade.ativo
                            ? 'btn-excluir-unidade'
                            : 'btn-reativar-unidade'
                        }
                        onClick={() =>
                          abrirModalStatus(
                            unidade
                          )
                        }
                        title={
                          unidade.ativo
                            ? 'Inativar unidade'
                            : 'Reativar unidade'
                        }
                        aria-label={
                          unidade.ativo
                            ? `Inativar ${unidade.nome}`
                            : `Reativar ${unidade.nome}`
                        }
                      >
                        {unidade.ativo ? (
                          <FaBan />
                        ) : (
                          <FaRotateLeft />
                        )}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {modalStatusAberto && (
          <div className="admin-unidades-modal-overlay">
            <div className="admin-unidades-modal-card">
              <div
                className={`admin-unidades-modal-icon ${
                  unidadeParaAlterarStatus?.ativo
                    ? 'excluir'
                    : 'reativar'
                }`}
              >
                {unidadeParaAlterarStatus?.ativo ? (
                  <FaBan />
                ) : (
                  <FaRotateLeft />
                )}
              </div>

              <h2>
                {unidadeParaAlterarStatus?.ativo
                  ? 'Inativar unidade?'
                  : 'Reativar unidade?'}
              </h2>

              <p>
                Deseja realmente{' '}
                {unidadeParaAlterarStatus?.ativo
                  ? 'inativar'
                  : 'reativar'}{' '}
                a unidade{' '}
                <strong>
                  {
                    unidadeParaAlterarStatus?.nome
                  }
                </strong>
                ?
              </p>

              {unidadeParaAlterarStatus?.ativo && (
                <p>
                  A unidade continuará
                  registrada para preservação
                  do histórico, mas não deverá
                  aparecer em novos cadastros.
                </p>
              )}

              <div className="admin-unidades-modal-actions">
                <button
                  type="button"
                  className="admin-unidades-modal-primary"
                  onClick={
                    confirmarAlteracaoStatus
                  }
                  disabled={alterandoStatus}
                >
                  {alterandoStatus
                    ? 'Processando...'
                    : unidadeParaAlterarStatus?.ativo
                      ? 'Sim, inativar'
                      : 'Sim, reativar'}
                </button>

                <button
                  type="button"
                  className="admin-unidades-modal-secondary"
                  onClick={
                    cancelarAlteracaoStatus
                  }
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

export default AdminUnidades;