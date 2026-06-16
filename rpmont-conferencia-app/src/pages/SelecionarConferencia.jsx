import { useMemo, useState } from 'react';
import {
  FaBoxesStacked,
  FaBuildingUser,
  FaChevronRight,
  FaCheck,
  FaArrowLeft,
  FaRotateRight,
  FaLock,
  FaXmark,
  FaMagnifyingGlassChart,
  FaUserGear,
  FaWheatAwn,
} from 'react-icons/fa6';

import '../styles/SelecionarConferencia.css';

const STORAGE_KEY_SETORES = 'setores';

const carregarSetoresCadastrados = () => {
  const setoresSalvos = localStorage.getItem(STORAGE_KEY_SETORES);

  if (!setoresSalvos) return [];

  try {
    const setoresConvertidos = JSON.parse(setoresSalvos);

    return Array.isArray(setoresConvertidos) ? setoresConvertidos : [];
  } catch {
    return [];
  }
};

const normalizarTexto = (valor) => {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
};

const obterNivelUsuario = (usuario) => {
  return normalizarTexto(
    usuario?.nivelAcesso ||
      usuario?.perfil ||
      usuario?.role ||
      usuario?.tipo ||
      usuario?.NIVEL_ACESSO ||
      usuario?.PERFIL ||
      usuario?.ROLE ||
      usuario?.TIPO ||
      usuario?.nivel ||
      usuario?.NIVEL
  );
};

const obterSetorUsuario = (usuario) => {
  return normalizarTexto(usuario?.setor || usuario?.SETOR);
};

const usuarioEhAdminSistema = (usuario) => {
  const nivel = obterNivelUsuario(usuario);

  return ['ADMIN', 'ADMINP4', 'ADMINMASTER', 'MASTER', '1'].includes(nivel);
};

const usuarioEhSetorP4 = (usuario) => {
  return obterSetorUsuario(usuario) === 'P4';
};

const usuarioEhSetorBaia = (usuario) => {
  return obterSetorUsuario(usuario) === 'BAIA';
};

function SelecionarConferencia({
  usuario,
  onIniciarConferencia,
  onZerarConferencia,
  onAbrirCadastroManual,
  onAbrirConsulta,
  onAbrirAdmin,

  /*
    Prop correta.
    Ela chama o controle centralizado no App.jsx.
  */
  onAbrirFenoRacao,

  /*
    Props antigas mantidas apenas como segurança.
    Depois que o App.jsx estiver 100%, pode remover.
  */
  onAbrirCadastroAlimentacao,
  onAbrirSaidaFenoRacao,
}) {
  const [modoConferencia, setModoConferencia] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('');

  const [setoresCadastrados, setSetoresCadastrados] = useState(() =>
    carregarSetoresCadastrados()
  );

  const [modalZerar, setModalZerar] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [mensagemZerar, setMensagemZerar] = useState('');

  const usuarioEhAdmin = usuarioEhAdminSistema(usuario);
  const usuarioEhP4 = usuarioEhSetorP4(usuario);
  const usuarioEhBaia = usuarioEhSetorBaia(usuario);

  const usuarioPodeAcessarPatrimonio = usuarioEhP4;
  const usuarioPodeAcessarFenoRacao = usuarioEhAdmin || usuarioEhBaia;

  const unidadeUsuarioLogada = String(usuario?.unidade || usuario?.UNIDADE || '')
    .trim()
    .toLowerCase();

  const setoresDaUnidade = useMemo(() => {
    return setoresCadastrados.filter((setor) => {
      const unidadeSetor = String(setor?.unidadeNome || '')
        .trim()
        .toLowerCase();

      return unidadeSetor === unidadeUsuarioLogada;
    });
  }, [setoresCadastrados, unidadeUsuarioLogada]);

  const selecionarTodosMateriais = () => {
    if (!usuarioPodeAcessarPatrimonio) {
      window.alert(
        'Acesso negado. A conferência patrimonial é permitida somente para usuários do setor P4.'
      );
      return;
    }

    setModoConferencia('TODOS');
    setSetorSelecionado('');
  };

  const abrirSelecaoSetor = () => {
    if (!usuarioPodeAcessarPatrimonio) {
      window.alert(
        'Acesso negado. A conferência patrimonial é permitida somente para usuários do setor P4.'
      );
      return;
    }

    setSetoresCadastrados(carregarSetoresCadastrados());
    setModoConferencia('SETOR');
    setSetorSelecionado('');
  };

  const continuarConferencia = () => {
    if (!usuarioPodeAcessarPatrimonio) {
      window.alert(
        'Acesso negado. A conferência patrimonial é permitida somente para usuários do setor P4.'
      );
      return;
    }

    if (modoConferencia === 'TODOS') {
      onIniciarConferencia({
        tipo: 'TODOS',
        setor: null,
      });

      return;
    }

    if (modoConferencia === 'SETOR' && setorSelecionado) {
      onIniciarConferencia({
        tipo: 'SETOR',
        setor: setorSelecionado,
      });
    }
  };

  const abrirCadastroManualComPermissao = () => {
    if (!usuarioPodeAcessarPatrimonio) {
      window.alert(
        'Acesso negado. O cadastro de material patrimonial é permitido somente para usuários do setor P4.'
      );
      return;
    }

    onAbrirCadastroManual();
  };

  const abrirConsultaComPermissao = () => {
    if (!usuarioPodeAcessarPatrimonio) {
      window.alert(
        'Acesso negado. A consulta patrimonial é permitida somente para usuários do setor P4.'
      );
      return;
    }

    onAbrirConsulta();
  };

  const abrirFenoRacao = () => {
    if (!usuarioPodeAcessarFenoRacao) {
      window.alert('Você não tem permissão para acessar Feno e Ração.');
      return;
    }

    if (typeof onAbrirFenoRacao === 'function') {
      onAbrirFenoRacao();
      return;
    }

    /*
      Fallback provisório:
      se o App.jsx ainda estiver usando as props antigas,
      o botão não fica morto.
    */
    if (usuarioEhAdmin && typeof onAbrirCadastroAlimentacao === 'function') {
      onAbrirCadastroAlimentacao();
      return;
    }

    if (!usuarioEhAdmin && usuarioEhBaia && typeof onAbrirSaidaFenoRacao === 'function') {
      onAbrirSaidaFenoRacao();
      return;
    }

    window.alert('A função de Feno e Ração não foi configurada no App.jsx.');
  };

  const abrirModalZerar = () => {
    if (!usuarioPodeAcessarPatrimonio) {
      window.alert(
        'Acesso negado. O zeramento da conferência patrimonial é permitido somente para usuários do setor P4.'
      );
      return;
    }

    setSenhaAdmin('');
    setMensagemZerar('');
    setModalZerar(true);
  };

  const fecharModalZerar = () => {
    setSenhaAdmin('');
    setMensagemZerar('');
    setModalZerar(false);
  };

  const confirmarZeramento = () => {
    if (!usuarioPodeAcessarPatrimonio) {
      setMensagemZerar(
        'Acesso negado. Somente usuários do setor P4 podem zerar a conferência.'
      );
      return;
    }

    /*
      Validação provisória no front-end.
      Depois será substituída pela validação no backend/MySQL.
    */
    if (senhaAdmin !== '123456') {
      setMensagemZerar('Senha de administrador incorreta.');
      return;
    }

    onZerarConferencia(usuario);
    setMensagemZerar('Conferência zerada com sucesso.');

    window.setTimeout(() => {
      fecharModalZerar();
    }, 900);
  };

  return (
    <main className="selecao-page">
      <section className="selecao-phone">
        <header className="selecao-header">
          <div>
            <span>
              {usuarioPodeAcessarPatrimonio
                ? 'Conferência Patrimonial'
                : usuarioPodeAcessarFenoRacao
                  ? 'Alimentação Equina'
                  : 'Acesso restrito'}
            </span>

            <h1>
              {usuarioPodeAcessarPatrimonio
                ? 'Selecionar Conferência'
                : usuarioPodeAcessarFenoRacao
                  ? 'Feno e Ração'
                  : 'Sem módulo disponível'}
            </h1>
          </div>

          <div className="usuario-chip">
            {usuario?.postGrad?.toUpperCase()} {usuario?.nome}
          </div>
        </header>

        <section className="usuario-card">
          <p>Seja bem-vindo,</p>

          <h2>{usuario?.nomeExibicao}</h2>

          <div className="usuario-info-grid">
            <div>
              <span>Unidade</span>
              <strong>{usuario?.unidade || usuario?.UNIDADE}</strong>
            </div>

            <div>
              <span>Setor</span>
              <strong>{usuario?.setor || usuario?.SETOR}</strong>
            </div>
          </div>
        </section>

        {usuarioEhAdmin && (
          <section className="admin-card admin-card-duplo">
            <div className="admin-card-texto">
              <span>Ações administrativas</span>

              <h3>Gerenciar o sistema</h3>

              <p>
                {usuarioEhP4
                  ? `Gerencie materiais patrimoniais, administração, feno e ração ou reinicie a conferência da unidade ${usuario?.unidade || usuario?.UNIDADE}.`
                  : 'Você possui acesso administrativo, mas a conferência patrimonial é exclusiva do setor P4. O acesso a Feno e Ração permanece liberado.'}
              </p>
            </div>

            <div className="admin-card-acoes">
              {usuarioPodeAcessarPatrimonio && (
                <>
                  <button
                    type="button"
                    onClick={abrirCadastroManualComPermissao}
                  >
                    <FaBoxesStacked />
                    Cadastrar material
                  </button>

                  <button
                    type="button"
                    onClick={abrirConsultaComPermissao}
                  >
                    <FaMagnifyingGlassChart />
                    Filtros avançados
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onAbrirAdmin}
              >
                <FaUserGear />
                Administração
              </button>

              {usuarioPodeAcessarFenoRacao && (
                <button
                  type="button"
                  className="admin-acao-alimentacao"
                  onClick={abrirFenoRacao}
                >
                  <FaWheatAwn />
                  Feno e Ração
                </button>
              )}

              {usuarioPodeAcessarPatrimonio && (
                <button
                  type="button"
                  onClick={abrirModalZerar}
                >
                  <FaRotateRight />
                  Zerar conferência
                </button>
              )}
            </div>
          </section>
        )}

        {!usuarioEhAdmin && usuarioEhBaia && (
          <section className="admin-card admin-card-duplo">
            <div className="admin-card-texto">
              <span>Alimentação equina</span>

              <h3>Feno e Ração</h3>

              <p>
                Registre saída e extravio de feno e ração para o serviço
                operacional da unidade {usuario?.unidade || usuario?.UNIDADE}.
              </p>
            </div>

            <div className="admin-card-acoes">
              <button
                type="button"
                className="admin-acao-alimentacao"
                onClick={abrirFenoRacao}
              >
                <FaWheatAwn />
                Feno e Ração
              </button>
            </div>
          </section>
        )}

        {usuarioPodeAcessarPatrimonio && (
          <>
            <section className="resumo-card">
              <span>Próximo passo</span>

              <h3>Escolha o tipo de conferência</h3>

              <p>
                O sistema carregará somente os materiais vinculados à unidade{' '}
                <strong>{usuario?.unidade || usuario?.UNIDADE}</strong>.
              </p>
            </section>

            {modoConferencia !== 'SETOR' && (
              <section className="opcoes-conferencia">
                <button
                  type="button"
                  className={`opcao-card ${
                    modoConferencia === 'TODOS' ? 'opcao-card-ativa' : ''
                  }`}
                  onClick={selecionarTodosMateriais}
                >
                  <div className="opcao-icon vermelho">
                    <FaBoxesStacked />
                  </div>

                  <div className="opcao-texto">
                    <h3>Todos os materiais</h3>

                    <p>
                      Conferir todos os materiais da unidade{' '}
                      {usuario?.unidade || usuario?.UNIDADE}.
                    </p>
                  </div>

                  {modoConferencia === 'TODOS' ? (
                    <FaCheck className="opcao-check" />
                  ) : (
                    <FaChevronRight className="opcao-seta" />
                  )}
                </button>

                <button
                  type="button"
                  className="opcao-card"
                  onClick={abrirSelecaoSetor}
                >
                  <div className="opcao-icon amarelo">
                    <FaBuildingUser />
                  </div>

                  <div className="opcao-texto">
                    <h3>Por setor</h3>

                    <p>
                      Selecionar um setor específico para realizar a
                      conferência.
                    </p>
                  </div>

                  <FaChevronRight className="opcao-seta" />
                </button>
              </section>
            )}

            {modoConferencia === 'SETOR' && (
              <section className="setores-area">
                <div className="setores-topo">
                  <button
                    type="button"
                    className="voltar-setores"
                    onClick={() => {
                      setModoConferencia('');
                      setSetorSelecionado('');
                    }}
                  >
                    <FaArrowLeft />
                  </button>

                  <div>
                    <span>Conferência por setor</span>
                    <h3>Selecione o setor</h3>
                  </div>
                </div>

                {setoresDaUnidade.length === 0 ? (
                  <div className="setores-vazio">
                    Nenhum setor cadastrado para a unidade{' '}
                    {usuario?.unidade || usuario?.UNIDADE}.
                  </div>
                ) : (
                  <div className="setores-lista">
                    {setoresDaUnidade.map((setor) => (
                      <button
                        key={setor.id}
                        type="button"
                        className={`setor-item ${
                          setorSelecionado === setor.nome
                            ? 'setor-item-ativo'
                            : ''
                        }`}
                        onClick={() => setSetorSelecionado(setor.nome)}
                      >
                        <span>{setor.nome}</span>

                        {setorSelecionado === setor.nome && <FaCheck />}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {(modoConferencia === 'TODOS' ||
              (modoConferencia === 'SETOR' && setorSelecionado)) && (
              <button
                type="button"
                className="continuar-conferencia-button"
                onClick={continuarConferencia}
              >
                {modoConferencia === 'TODOS'
                  ? 'Continuar com todos os materiais'
                  : `Continuar com ${setorSelecionado}`}
              </button>
            )}
          </>
        )}

        {!usuarioPodeAcessarPatrimonio && !usuarioPodeAcessarFenoRacao && (
          <section className="resumo-card">
            <span>Acesso restrito</span>

            <h3>Nenhum módulo disponível para o seu setor</h3>

            <p>
              A conferência patrimonial é exclusiva do setor P4. O módulo de
              Feno e Ração é permitido para administradores ou usuários do setor
              Baia.
            </p>
          </section>
        )}

        {modalZerar && usuarioPodeAcessarPatrimonio && (
          <div className="modal-zerar-overlay">
            <div className="modal-zerar-card">
              <button
                type="button"
                className="fechar-modal-zerar"
                onClick={fecharModalZerar}
              >
                <FaXmark />
              </button>

              <div className="modal-zerar-icon">
                <FaLock />
              </div>

              <h2>Zerar conferência?</h2>

              <p>
                Esta ação marcará todos os materiais da unidade{' '}
                <strong>{usuario?.unidade || usuario?.UNIDADE}</strong> como{' '}
                <strong>não conferidos</strong>.
              </p>

              <label>
                Senha de administrador

                <input
                  type="password"
                  value={senhaAdmin}
                  placeholder="Digite a senha"
                  onChange={(event) => {
                    setSenhaAdmin(event.target.value);
                    setMensagemZerar('');
                  }}
                />
              </label>

              {mensagemZerar && (
                <div
                  className={
                    mensagemZerar.includes('sucesso')
                      ? 'mensagem-zerar sucesso'
                      : 'mensagem-zerar erro'
                  }
                >
                  {mensagemZerar}
                </div>
              )}

              <button
                type="button"
                className="confirmar-zerar-button"
                onClick={confirmarZeramento}
              >
                Confirmar zeramento
              </button>

              <button
                type="button"
                className="cancelar-zerar-button"
                onClick={fecharModalZerar}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default SelecionarConferencia;