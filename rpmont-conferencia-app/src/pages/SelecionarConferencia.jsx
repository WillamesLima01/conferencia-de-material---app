import { useEffect, useMemo, useState } from 'react';
import {
  FaBoxesStacked,
  FaBuildingUser,
  FaChevronRight,
  FaCheck,
  FaArrowLeft,
  FaMagnifyingGlassChart,
  FaClockRotateLeft,
  FaUserGear,
  FaWheatAwn,
  FaRightFromBracket,
} from 'react-icons/fa6';

import { listarSetoresAtivos } from '../services/setorService';

import '../styles/SelecionarConferencia.css';


const UNIDADES_EQUINAS = ['RPMONT', '3EPMONT'];

const NIVEIS_USUARIO = {
  ADMIN_MASTER: 1,
  ADMIN: 2,
  USUARIO_COMUM: 3,
};


const normalizarTexto = (valor) => {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/º/g, '')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
};

const obterNivelUsuario = (usuario) => {
  return Number(
    usuario?.nivel ??
      usuario?.NIVEL ??
      usuario?.nivelAcesso ??
      usuario?.NIVEL_ACESSO ??
      NIVEIS_USUARIO.USUARIO_COMUM
  );
};

const obterSetorUsuario = (usuario) => {
  return normalizarTexto(usuario?.setor ?? usuario?.SETOR ?? '');
};

const obterUnidadeUsuario = (usuario) => {
  return normalizarTexto(usuario?.unidade ?? usuario?.UNIDADE ?? '');
};

const usuarioEhAdminMaster = (usuario) => {
  return obterNivelUsuario(usuario) === NIVEIS_USUARIO.ADMIN_MASTER;
};

const usuarioEhAdminSistema = (usuario) => {
  const nivel = obterNivelUsuario(usuario);

  return (
    nivel === NIVEIS_USUARIO.ADMIN_MASTER ||
    nivel === NIVEIS_USUARIO.ADMIN
  );
};

const usuarioEhSetorP4 = (usuario) => {
  return obterSetorUsuario(usuario) === 'P4';
};

const usuarioEhSetorBaia = (usuario) => {
  return obterSetorUsuario(usuario) === 'BAIA';
};

const usuarioEhFuncaoFiscalDeDia = (usuario) => {
  return obterSetorUsuario(usuario) === 'FISCALDEDIA';
};

const usuarioEhUnidadeEquina = (usuario) => {
  const unidade = obterUnidadeUsuario(usuario);

  return UNIDADES_EQUINAS.includes(unidade);
};

function SelecionarConferencia({
  usuario,
  onSair,
  onIniciarConferencia,
  onAbrirCadastroManual,
  onAbrirConsulta,
  onAbrirConsultaMovimentacoes,
  onAbrirAdmin,
  onAbrirFenoRacao,
  onAbrirCadastroAlimentacao,
  onAbrirSaidaFenoRacao,
}) {
  const [modoConferencia, setModoConferencia] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('');

  const [setoresCadastrados, setSetoresCadastrados] = useState([]);
  const [carregandoSetores, setCarregandoSetores] = useState(true);
  const [erroSetores, setErroSetores] = useState('');

  const usuarioEhAdmin = usuarioEhAdminSistema(usuario);
  const usuarioMaster = usuarioEhAdminMaster(usuario);
  const usuarioEhP4 = usuarioEhSetorP4(usuario);
  const usuarioEhBaia = usuarioEhSetorBaia(usuario);
  const usuarioEhFiscalDeDia =
    usuarioEhFuncaoFiscalDeDia(usuario);

  const usuarioEhUnidadeComEquinos =
    usuarioEhUnidadeEquina(usuario);

  const usuarioPodeAcessarPatrimonio = usuarioEhP4;

  const usuarioPodeAcessarFenoRacao =
    usuarioEhUnidadeComEquinos &&
    (
      usuarioEhAdmin ||
      usuarioEhBaia ||
      usuarioEhFiscalDeDia
    );


  useEffect(() => {
    let componenteAtivo = true;

    const buscarSetoresAtivos = async () => {
      try {
        const resposta = await listarSetoresAtivos();

        const lista = Array.isArray(resposta)
          ? resposta
          : Array.isArray(resposta?.data)
            ? resposta.data
            : [];

        if (componenteAtivo) {
          setSetoresCadastrados(lista);
          setErroSetores('');
        }
      } catch (erro) {
        if (componenteAtivo) {
          setErroSetores(
            erro?.message ||
              'Não foi possível carregar os setores cadastrados.'
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoSetores(false);
        }
      }
    };

    buscarSetoresAtivos();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const setoresDaUnidade = useMemo(() => {
    const unidadeUsuario = normalizarTexto(
      usuario?.unidade ?? usuario?.UNIDADE ?? ''
    );

    return setoresCadastrados.filter((setor) => {
      const unidadeNome = normalizarTexto(
        setor?.unidadeNome ?? setor?.unidade?.nome ?? ''
      );

      const unidadeSigla = normalizarTexto(
        setor?.unidadeSigla ?? setor?.unidade?.sigla ?? ''
      );

      return (
        unidadeNome === unidadeUsuario ||
        unidadeSigla === unidadeUsuario
      );
    });
  }, [setoresCadastrados, usuario]);

  const handleSair = () => {
    if (typeof onSair === 'function') {
      onSair();
      return;
    }

    window.alert('A função de sair não foi configurada no App.jsx.');
  };

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

    if (typeof onAbrirCadastroManual === 'function') {
      onAbrirCadastroManual();
      return;
    }

    window.alert('A função de cadastro manual não foi configurada no App.jsx.');
  };

  const abrirConsultaComPermissao = () => {
    if (!usuarioPodeAcessarPatrimonio) {
      window.alert(
        'Acesso negado. A consulta patrimonial é permitida somente para usuários do setor P4.'
      );
      return;
    }

    if (typeof onAbrirConsulta === 'function') {
      onAbrirConsulta();
      return;
    }

    window.alert('A função de consulta não foi configurada no App.jsx.');
  };

  const abrirConsultaMovimentacoesComPermissao = () => {
    if (!usuarioPodeAcessarPatrimonio) {
      window.alert(
        'Acesso negado. A consulta de movimentações patrimoniais é permitida somente para usuários do setor P4.'
      );
      return;
    }

    if (typeof onAbrirConsultaMovimentacoes === 'function') {
      onAbrirConsultaMovimentacoes();
      return;
    }

    window.alert(
      'A função de consulta de movimentações não foi configurada no App.jsx.'
    );
  };

  const abrirAdministracao = () => {
    if (!usuarioEhAdmin) {
      window.alert('Acesso negado. Apenas administradores podem acessar esta área.');
      return;
    }

    if (typeof onAbrirAdmin === 'function') {
      onAbrirAdmin();
      return;
    }

    window.alert('A função de administração não foi configurada no App.jsx.');
  };

  const abrirFenoRacao = () => {
    if (!usuarioPodeAcessarFenoRacao) {
      window.alert(
        'Você não tem permissão para acessar Feno e Ração. Para usuário comum, o acesso é permitido somente para Baia ou Fiscal-de-dia no RPMont ou 3º EPMont.'
      );
      return;
    }

    if (typeof onAbrirFenoRacao === 'function') {
      onAbrirFenoRacao();
      return;
    }

    if (usuarioEhAdmin && typeof onAbrirCadastroAlimentacao === 'function') {
      onAbrirCadastroAlimentacao();
      return;
    }

    if (
      !usuarioEhAdmin &&
      (
        usuarioEhBaia ||
        usuarioEhFiscalDeDia
      ) &&
      typeof onAbrirSaidaFenoRacao === 'function'
    ) {
      onAbrirSaidaFenoRacao();
      return;
    }

    window.alert('A função de Feno e Ração não foi configurada no App.jsx.');
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

          <div className="selecao-header-actions">
            <button
              type="button"
              className="selecao-sair-button"
              onClick={handleSair}
            >
              <FaRightFromBracket />
              Sair
            </button>

            <div className="usuario-chip">
              {usuario?.postGrad?.toUpperCase()} {usuario?.nome}
            </div>
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
              <span>Setor/Função</span>
              <strong>{usuario?.setor || usuario?.SETOR}</strong>
            </div>

            <div>
              <span>Nível</span>
              <strong>
                {usuarioMaster
                  ? 'Admin Master'
                  : usuarioEhAdmin
                    ? 'Administrador'
                    : 'Usuário comum'}
              </strong>
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
                  ? `Gerencie materiais patrimoniais, administração${
                      usuarioPodeAcessarFenoRacao ? ', feno e ração' : ''
                    } da unidade ${
                      usuario?.unidade || usuario?.UNIDADE
                    }.`
                  : usuarioPodeAcessarFenoRacao
                    ? 'Você possui acesso administrativo ao módulo de Feno e Ração da unidade equina. A conferência patrimonial é exclusiva do setor P4.'
                    : 'Você possui acesso administrativo, mas a conferência patrimonial é exclusiva do setor P4 e o módulo de Feno e Ração é exclusivo do RPMont e 3º EPMont.'}
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

                  <button type="button" onClick={abrirConsultaComPermissao}>
                    <FaMagnifyingGlassChart />
                    Filtros avançados
                  </button>

                  <button
                    type="button"
                    onClick={abrirConsultaMovimentacoesComPermissao}
                  >
                    <FaClockRotateLeft />
                    Movimentações patrimoniais
                  </button>
                </>
              )}

              <button type="button" onClick={abrirAdministracao}>
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
            </div>
          </section>
        )}

        {!usuarioEhAdmin &&
          (usuarioEhBaia || usuarioEhFiscalDeDia) &&
          usuarioPodeAcessarFenoRacao && (
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

                {carregandoSetores ? (
                  <div className="setores-vazio">
                    Carregando setores...
                  </div>
                ) : erroSetores ? (
                  <div className="setores-vazio">
                    {erroSetores}
                  </div>
                ) : setoresDaUnidade.length === 0 ? (
                  <div className="setores-vazio">
                    Nenhum setor ativo cadastrado para a unidade{' '}
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
              Feno e Ração é exclusivo do RPMont e 3º EPMont, sendo permitido
              apenas para administradores dessas unidades ou usuários comuns
              cadastrados como Baia ou Fiscal-de-dia nessas unidades.
            </p>
          </section>
        )}

      </section>
    </main>
  );
}

export default SelecionarConferencia;