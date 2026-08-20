import { useState } from 'react';

import {
  FaArrowLeft,
  FaArrowRightArrowLeft,
  FaBuilding,
  FaChevronRight,
  FaCircleCheck,
  FaLayerGroup,
  FaRotate,
  FaTriangleExclamation,
  FaUsersGear,
} from 'react-icons/fa6';

import '../styles/AdminPainel.css';

import AdminUnidades from './AdminUnidades';
import AdminSetores from './AdminSetores';
import AdminUsuarios from './AdminUsuarios';

function AdminPainel({
  usuario,
  pendencias,
  onVerExtravios,
  onVerTransferencias,
  onAtualizarPendencias,
  onVoltar,
}) {
  const [
    telaAtual,
    setTelaAtual,
  ] = useState('painel');

  const [
    atualizandoPendencias,
    setAtualizandoPendencias,
  ] = useState(false);

  const extraviosPendentes =
    Number(
      pendencias?.extraviosPendentes ??
        0
    );

  const transferenciasPendentes =
    Number(
      pendencias?.transferenciasPendentes ??
        0
    );

  const totalPendencias =
    Number(
      pendencias?.totalPendencias ??
        (
          extraviosPendentes +
          transferenciasPendentes
        )
    );

  const possuiPendencias =
    Boolean(
      pendencias?.possuiPendencias ??
        totalPendencias > 0
    );

  /*
   * =====================================================
   * NAVEGAÇÃO INTERNA
   * =====================================================
   */

  const abrirModulo = (
    modulo
  ) => {
    if (
      modulo === 'Usuários'
    ) {
      setTelaAtual(
        'usuarios'
      );

      return;
    }

    if (
      modulo === 'Unidades'
    ) {
      setTelaAtual(
        'unidades'
      );

      return;
    }

    if (
      modulo === 'Setores'
    ) {
      setTelaAtual(
        'setores'
      );

      return;
    }

    alert(
      `Módulo ${modulo} será criado na próxima etapa.`
    );
  };

  const voltarParaPainel =
    () => {
      setTelaAtual(
        'painel'
      );
    };

  /*
   * =====================================================
   * ATUALIZAÇÃO MANUAL DAS PENDÊNCIAS
   * =====================================================
   */

  const atualizarPendencias =
    async () => {
      if (
        typeof onAtualizarPendencias !==
        'function'
      ) {
        return;
      }

      if (
        atualizandoPendencias
      ) {
        return;
      }

      try {
        setAtualizandoPendencias(
          true
        );

        await onAtualizarPendencias();
      } catch (error) {
        console.error(
          'Erro ao atualizar pendências administrativas:',
          error
        );
      } finally {
        setAtualizandoPendencias(
          false
        );
      }
    };

  /*
   * =====================================================
   * TELAS INTERNAS
   * =====================================================
   */

  if (
    telaAtual === 'unidades'
  ) {
    return (
      <AdminUnidades
        usuario={usuario}
        onVoltar={
          voltarParaPainel
        }
      />
    );
  }

  if (
    telaAtual === 'setores'
  ) {
    return (
      <AdminSetores
        usuario={usuario}
        onVoltar={
          voltarParaPainel
        }
      />
    );
  }

  if (
    telaAtual === 'usuarios'
  ) {
    return (
      <AdminUsuarios
        usuario={usuario}
        onVoltar={
          voltarParaPainel
        }
      />
    );
  }

  /*
   * =====================================================
   * PAINEL PRINCIPAL
   * =====================================================
   */

  return (
    <main className="admin-painel-page">
      <section className="admin-painel-phone">
        <header className="admin-painel-header">
          <button
            type="button"
            className="admin-voltar-button"
            onClick={onVoltar}
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>
              Área administrativa
            </span>

            <h1>
              Painel Administrativo
            </h1>

            <p>
              {usuario?.unidade}
            </p>
          </div>
        </header>

        <section className="admin-boas-vindas">
          <span>
            Administrador
          </span>

          <h2>
            {usuario?.nomeExibicao ||
              usuario?.nome}
          </h2>

          <p>
            Gerencie usuários,
            unidades, setores e
            acompanhe as pendências
            administrativas do
            sistema.
          </p>
        </section>

        {/*
         * =================================================
         * PENDÊNCIAS ADMINISTRATIVAS
         * =================================================
         */}

        <section className="admin-pendencias">
          <div className="admin-pendencias-cabecalho">
            <div>
              <span className="admin-pendencias-subtitulo">
                Feno e Ração
              </span>

              <h2>
                Pendências
                Administrativas
              </h2>
            </div>

            <div
              className={
                possuiPendencias
                  ? 'admin-pendencias-badge possui'
                  : 'admin-pendencias-badge vazio'
              }
            >
              {totalPendencias}
            </div>
          </div>

          {possuiPendencias ? (
            <>
              <div className="admin-pendencias-alerta">
                <FaTriangleExclamation />

                <div>
                  <strong>
                    {totalPendencias ===
                    1
                      ? '1 pendência aguardando análise'
                      : `${totalPendencias} pendências aguardando análise`}
                  </strong>

                  <p>
                    Existem ocorrências
                    que precisam de
                    decisão
                    administrativa.
                  </p>
                </div>
              </div>

              <div className="admin-pendencias-lista">
                <button
                  type="button"
                  className="admin-pendencia-card"
                  onClick={
                    onVerExtravios
                  }
                  disabled={
                    extraviosPendentes <=
                    0
                  }
                >
                  <div className="admin-pendencia-icon extravio">
                    <FaTriangleExclamation />
                  </div>

                  <div className="admin-pendencia-conteudo">
                    <div className="admin-pendencia-titulo">
                      <strong>
                        Extravios
                      </strong>

                      <span>
                        {
                          extraviosPendentes
                        }
                      </span>
                    </div>

                    <p>
                      {extraviosPendentes ===
                      1
                        ? '1 extravio aguardando análise.'
                        : `${extraviosPendentes} extravios aguardando análise.`}
                    </p>
                  </div>

                  <FaChevronRight className="admin-pendencia-seta" />
                </button>

                <button
                  type="button"
                  className="admin-pendencia-card"
                  onClick={
                    onVerTransferencias
                  }
                  disabled={
                    transferenciasPendentes <=
                    0
                  }
                >
                  <div className="admin-pendencia-icon transferencia">
                    <FaArrowRightArrowLeft />
                  </div>

                  <div className="admin-pendencia-conteudo">
                    <div className="admin-pendencia-titulo">
                      <strong>
                        Transferências
                      </strong>

                      <span>
                        {
                          transferenciasPendentes
                        }
                      </span>
                    </div>

                    <p>
                      {transferenciasPendentes ===
                      1
                        ? '1 transferência aguardando análise.'
                        : `${transferenciasPendentes} transferências aguardando análise.`}
                    </p>
                  </div>

                  <FaChevronRight className="admin-pendencia-seta" />
                </button>
              </div>
            </>
          ) : (
            <div className="admin-pendencias-ok">
              <div className="admin-pendencias-ok-icon">
                <FaCircleCheck />
              </div>

              <div>
                <strong>
                  Nenhuma pendência
                </strong>

                <p>
                  Não existem extravios
                  ou transferências
                  aguardando análise no
                  momento.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            className="admin-pendencias-atualizar"
            onClick={
              atualizarPendencias
            }
            disabled={
              atualizandoPendencias
            }
          >
            <FaRotate
              className={
                atualizandoPendencias
                  ? 'girando'
                  : ''
              }
            />

            {atualizandoPendencias
              ? 'Atualizando...'
              : 'Atualizar pendências'}
          </button>
        </section>

        {/*
         * =================================================
         * MÓDULOS ADMINISTRATIVOS
         * =================================================
         */}

        <section className="admin-modulos">
          <h2 className="admin-modulos-titulo">
            Administração do Sistema
          </h2>

          <button
            type="button"
            className="admin-modulo-card"
            onClick={() =>
              abrirModulo(
                'Usuários'
              )
            }
          >
            <div className="admin-modulo-icon vermelho">
              <FaUsersGear />
            </div>

            <div className="admin-modulo-texto">
              <h3>
                Usuários
              </h3>

              <p>
                Adicionar, editar e
                excluir usuários do
                sistema.
              </p>
            </div>

            <FaChevronRight className="admin-modulo-seta" />
          </button>

          <button
            type="button"
            className="admin-modulo-card"
            onClick={() =>
              abrirModulo(
                'Unidades'
              )
            }
          >
            <div className="admin-modulo-icon amarelo">
              <FaBuilding />
            </div>

            <div className="admin-modulo-texto">
              <h3>
                Unidades
              </h3>

              <p>
                Adicionar, editar e
                excluir unidades
                administrativas.
              </p>
            </div>

            <FaChevronRight className="admin-modulo-seta" />
          </button>

          <button
            type="button"
            className="admin-modulo-card"
            onClick={() =>
              abrirModulo(
                'Setores'
              )
            }
          >
            <div className="admin-modulo-icon preto">
              <FaLayerGroup />
            </div>

            <div className="admin-modulo-texto">
              <h3>
                Setores
              </h3>

              <p>
                Adicionar setores
                vinculados a uma
                unidade.
              </p>
            </div>

            <FaChevronRight className="admin-modulo-seta" />
          </button>
        </section>
      </section>
    </main>
  );
}

export default AdminPainel;