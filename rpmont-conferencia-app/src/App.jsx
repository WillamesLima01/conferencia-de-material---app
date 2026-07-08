import { useState } from 'react';

import Login from './pages/Login';
import SelecionarConferencia from './pages/SelecionarConferencia';
import ConferenciaMateriais from './pages/ConferenciaMateriais';
import CadastroMaterial from './pages/CadastroMaterial';
import EditarMaterial from './pages/EditarMaterial';
import ConsultaMateriais from './pages/ConsultaMateriais';
import AdminPainel from './pages/AdminPainel';
import CadastroFenoRacao from './pages/CadastroFenoRacao';
import SaidaFenoRacao from './pages/SaidaFenoRacao';
import RelatorioFenoRacao from './pages/RelatorioFenoRacao';
import ExtravioFenoRacao from './pages/ExtravioFenoRacao';
import TransferenciaFenoRacao from './pages/TransferenciaFenoRacao';
import SolicitarAcesso from './pages/SolicitarAcesso';
import RecuperarSenha from './pages/RecuperarSenha';

import { materiaisMock } from './data/materiais';

import './App.css';

const UNIDADES_EQUINAS = ['RPMONT', '3EPMONT'];

const NIVEIS_USUARIO = {
  ADMIN_MASTER: 1,
  ADMIN: 2,
  USUARIO_COMUM: 3,
};

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  const [
    configuracaoConferencia,
    setConfiguracaoConferencia,
  ] = useState(null);

  const [materiais, setMateriais] = useState(materiaisMock);

  const [abrirConsulta, setAbrirConsulta] = useState(false);
  const [abrirAdmin, setAbrirAdmin] = useState(false);

  const [
    abrirCadastroAlimentacao,
    setAbrirCadastroAlimentacao,
  ] = useState(false);

  const [
    abrirSaidaFenoRacao,
    setAbrirSaidaFenoRacao,
  ] = useState(false);

  const [
    abrirExtravioFenoRacao,
    setAbrirExtravioFenoRacao,
  ] = useState(false);

  const [
    abrirRelatorioFenoRacao,
    setAbrirRelatorioFenoRacao,
  ] = useState(false);

  const [
    abrirTransferenciaFenoRacao,
    setAbrirTransferenciaFenoRacao,
  ] = useState(false);

  const [
    abrirModalFenoRacao,
    setAbrirModalFenoRacao,
  ] = useState(false);

  const [cadastroPendente, setCadastroPendente] =
    useState(null);

  const [materialEmEdicao, setMaterialEmEdicao] =
    useState(null);

  const [
    abrirSolicitarAcesso,
    setAbrirSolicitarAcesso,
  ] = useState(false);

  const [
    abrirRecuperarSenha,
    setAbrirRecuperarSenha,
  ] = useState(false);

  const limparNumeros = (valor) => {
    return String(valor || '').replace(/\D/g, '');
  };

  const obterValorNormalizado = (valor) => {
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
    return obterValorNormalizado(
      usuario?.setor ??
        usuario?.SETOR ??
        ''
    );
  };

  const obterUnidadeUsuario = (usuario) => {
    return obterValorNormalizado(
      usuario?.unidade ??
        usuario?.UNIDADE ??
        ''
    );
  };

  const usuarioEhAdminMaster = (usuario) => {
    return (
      obterNivelUsuario(usuario) ===
      NIVEIS_USUARIO.ADMIN_MASTER
    );
  };

  const usuarioEhAdmin = (usuario) => {
    const nivel = obterNivelUsuario(usuario);

    return (
      nivel === NIVEIS_USUARIO.ADMIN_MASTER ||
      nivel === NIVEIS_USUARIO.ADMIN
    );
  };

  const usuarioEhP4 = (usuario) => {
    return obterSetorUsuario(usuario) === 'P4';
  };

  const usuarioEhBaia = (usuario) => {
    return obterSetorUsuario(usuario) === 'BAIA';
  };

  const usuarioEhUnidadeEquina = (usuario) => {
    const unidade = obterUnidadeUsuario(usuario);

    return UNIDADES_EQUINAS.includes(unidade);
  };

  const usuarioPodeAcessarPatrimonio = (usuario) => {
    return usuarioEhP4(usuario);
  };

  const usuarioPodeAcessarFenoRacao = (usuario) => {
    if (!usuarioEhUnidadeEquina(usuario)) {
      return false;
    }

    return (
      usuarioEhAdmin(usuario) ||
      usuarioEhBaia(usuario)
    );
  };

  const usuarioPodeAdministrarFenoRacao = (
    usuario
  ) => {
    return (
      usuarioEhUnidadeEquina(usuario) &&
      usuarioEhAdmin(usuario)
    );
  };

  const normalizarUsuarioLogado = (usuario) => {
    const matriculaLimpa = limparNumeros(
      usuario?.matricula ??
        usuario?.MATRICULA
    );

    const usuarioWillamesTeste =
      matriculaLimpa === '5257093';

    const nivelRecebido = Number(
      usuario?.nivel ??
        usuario?.NIVEL ??
        NIVEIS_USUARIO.USUARIO_COMUM
    );

    const nivelFinal = usuarioWillamesTeste
      ? NIVEIS_USUARIO.ADMIN_MASTER
      : nivelRecebido;

    const unidadeFinal =
      usuario?.unidade ??
      usuario?.UNIDADE ??
      (usuarioWillamesTeste ? 'RPMont' : '');

    const setorFinal =
      usuario?.setor ??
      usuario?.SETOR ??
      (usuarioWillamesTeste ? 'P4' : '');

    const usuarioNormalizado = {
      ...usuario,

      id:
        usuario?.id ??
        usuario?.ID,

      ID:
        usuario?.ID ??
        usuario?.id,

      matricula:
        usuario?.matricula ??
        usuario?.MATRICULA ??
        '',

      MATRICULA:
        usuario?.MATRICULA ??
        usuario?.matricula ??
        '',

      nome:
        usuario?.nome ??
        usuario?.NOME ??
        '',

      NOME:
        usuario?.NOME ??
        usuario?.nome ??
        '',

      nomeCompleto:
        usuario?.nomeCompleto ??
        usuario?.NOMECOMPLETO ??
        '',

      NOMECOMPLETO:
        usuario?.NOMECOMPLETO ??
        usuario?.nomeCompleto ??
        '',

      postGrad:
        usuario?.postGrad ??
        usuario?.POSTGRAD ??
        '',

      POSTGRAD:
        usuario?.POSTGRAD ??
        usuario?.postGrad ??
        '',

      nomeExibicao:
        usuario?.nomeExibicao ??
        `${
          usuario?.postGrad ??
          usuario?.POSTGRAD ??
          ''
        } ${
          usuario?.nome ??
          usuario?.NOME ??
          ''
        }`.trim(),

      unidade: unidadeFinal,
      UNIDADE: unidadeFinal,

      setor: setorFinal,
      SETOR: setorFinal,

      nivel: nivelFinal,
      NIVEL: nivelFinal,

      email:
        usuario?.email ??
        usuario?.EMAIL ??
        '',

      EMAIL:
        usuario?.EMAIL ??
        usuario?.email ??
        '',

      digital:
        usuario?.digital ??
        usuario?.DIGITAL ??
        null,

      DIGITAL:
        usuario?.DIGITAL ??
        usuario?.digital ??
        null,

      statusAcesso:
        usuario?.statusAcesso ??
        usuario?.STATUSACESSO ??
        'LIBERADO',

      STATUSACESSO:
        usuario?.STATUSACESSO ??
        usuario?.statusAcesso ??
        'LIBERADO',

      ativo: Number(
        usuario?.ativo ??
          usuario?.ATIVO ??
          1
      ),

      ATIVO: Number(
        usuario?.ATIVO ??
          usuario?.ativo ??
          1
      ),
    };

    console.log(
      'USUÁRIO LOGADO NORMALIZADO:',
      usuarioNormalizado
    );

    console.log(
      'É ADMIN MASTER?',
      usuarioEhAdminMaster(usuarioNormalizado)
    );

    console.log(
      'É ADMIN?',
      usuarioEhAdmin(usuarioNormalizado)
    );

    console.log(
      'É P4?',
      usuarioEhP4(usuarioNormalizado)
    );

    console.log(
      'UNIDADE:',
      usuarioNormalizado.unidade
    );

    console.log(
      'SETOR:',
      usuarioNormalizado.setor
    );

    console.log(
      'NÍVEL:',
      usuarioNormalizado.nivel
    );

    return usuarioNormalizado;
  };

  const fecharTelasSecundarias = () => {
    setConfiguracaoConferencia(null);
    setAbrirConsulta(false);
    setAbrirAdmin(false);
    setAbrirCadastroAlimentacao(false);
    setAbrirSaidaFenoRacao(false);
    setAbrirExtravioFenoRacao(false);
    setAbrirRelatorioFenoRacao(false);
    setAbrirTransferenciaFenoRacao(false);
    setAbrirModalFenoRacao(false);
    setCadastroPendente(null);
    setMaterialEmEdicao(null);
  };

  const sairDoSistema = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioLogado');

    setUsuarioLogado(null);

    fecharTelasSecundarias();
  };

  const zerarConferenciaDaUnidade = (usuario) => {
    if (!usuarioPodeAcessarPatrimonio(usuario)) {
      window.alert(
        'Acesso negado. Somente usuários do setor P4 podem zerar a conferência patrimonial.'
      );

      return;
    }

    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        material.unidade === usuario.unidade &&
        material.situacao !== 'INATIVO'
          ? {
              ...material,
              Conferido: 0,
              dataModificacao:
                new Date().toISOString(),
              userModificador: usuario.id,
            }
          : material
      )
    );
  };

  const salvarMaterialCadastrado = (
    dadosNovoMaterial
  ) => {
    if (
      !usuarioPodeAcessarPatrimonio(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. Somente usuários do setor P4 podem cadastrar material patrimonial.'
      );

      return;
    }

    const novoId =
      materiais.length > 0
        ? Math.max(
            ...materiais.map(
              (material) => material.ID
            )
          ) + 1
        : 1;

    const materialCompleto = {
      ID: novoId,
      situacao: 'ATIVO',
      ...dadosNovoMaterial,
    };

    setMateriais((materiaisAtuais) => [
      ...materiaisAtuais,
      materialCompleto,
    ]);

    setCadastroPendente(null);
  };

  const salvarMaterialEditado = (
    materialAtualizado
  ) => {
    if (
      !usuarioPodeAcessarPatrimonio(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. Somente usuários do setor P4 podem editar material patrimonial.'
      );

      return;
    }

    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        material.ID === materialAtualizado.ID
          ? materialAtualizado
          : material
      )
    );

    setMaterialEmEdicao(null);
  };

  const excluirMaterial = (
    materialParaExcluir
  ) => {
    if (
      !usuarioPodeAcessarPatrimonio(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. Somente usuários do setor P4 podem inativar material patrimonial.'
      );

      return;
    }

    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        material.ID === materialParaExcluir.ID
          ? {
              ...material,

              situacao: 'INATIVO',

              dataModificacao:
                new Date().toISOString(),

              userModificador:
                usuarioLogado?.id ||
                usuarioLogado?.ID ||
                1,
            }
          : material
      )
    );

    setMaterialEmEdicao(null);
  };

  const abrirTelaCadastroManual = () => {
    if (
      !usuarioPodeAcessarPatrimonio(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. O cadastro de material patrimonial é permitido somente para usuários do setor P4.'
      );

      return;
    }

    fecharTelasSecundarias();

    setCadastroPendente({
      modo: 'MANUAL',
      codigo: '',
    });
  };

  const abrirTelaCadastroConferencia = (
    codigo
  ) => {
    if (
      !usuarioPodeAcessarPatrimonio(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. O cadastro de material patrimonial é permitido somente para usuários do setor P4.'
      );

      return;
    }

    setCadastroPendente({
      modo: 'CONFERENCIA',
      codigo,
    });
  };

  const iniciarConferenciaComPermissao = (
    configuracao
  ) => {
    if (
      !usuarioPodeAcessarPatrimonio(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. A conferência patrimonial é permitida somente para usuários do setor P4.'
      );

      return;
    }

    fecharTelasSecundarias();

    setConfiguracaoConferencia(configuracao);
  };

  const abrirConsultaComPermissao = () => {
    if (
      !usuarioPodeAcessarPatrimonio(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. A consulta patrimonial é permitida somente para usuários do setor P4.'
      );

      return;
    }

    fecharTelasSecundarias();

    setAbrirConsulta(true);
  };

  const abrirModuloFenoRacao = () => {
    fecharTelasSecundarias();

    if (
      usuarioPodeAcessarFenoRacao(
        usuarioLogado
      )
    ) {
      setAbrirModalFenoRacao(true);

      return;
    }

    window.alert(
      'Você não tem permissão para acessar Feno e Ração. Este módulo é exclusivo do RPMont e 3º EPMont.'
    );
  };

  const abrirTelaCadastroAlimentacao = () => {
    if (
      !usuarioPodeAdministrarFenoRacao(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. Somente administrador do RPMont ou 3º EPMont pode cadastrar entrada de Feno e Ração.'
      );

      return;
    }

    fecharTelasSecundarias();

    setAbrirCadastroAlimentacao(true);
  };

  const abrirTelaSaidaFenoRacao = () => {
    if (
      !usuarioPodeAcessarFenoRacao(
        usuarioLogado
      )
    ) {
      window.alert(
        'Você não tem permissão para acessar Saída de Feno e Ração.'
      );

      return;
    }

    fecharTelasSecundarias();

    setAbrirSaidaFenoRacao(true);
  };

  const abrirTelaExtravioFenoRacao = () => {
    if (
      !usuarioPodeAcessarFenoRacao(
        usuarioLogado
      )
    ) {
      window.alert(
        'Você não tem permissão para acessar Extravio de Feno e Ração.'
      );

      return;
    }

    fecharTelasSecundarias();

    setAbrirExtravioFenoRacao(true);
  };

  const abrirTelaRelatorioFenoRacao = () => {
    if (
      !usuarioPodeAdministrarFenoRacao(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. Somente administrador do RPMont ou 3º EPMont pode acessar o relatório de Feno e Ração.'
      );

      return;
    }

    fecharTelasSecundarias();

    setAbrirRelatorioFenoRacao(true);
  };

  const abrirTelaTransferenciaFenoRacao = () => {
    if (
      !usuarioPodeAdministrarFenoRacao(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. Somente administrador do RPMont ou 3º EPMont pode acessar Transferência de Feno e Ração.'
      );

      return;
    }

    fecharTelasSecundarias();

    setAbrirTransferenciaFenoRacao(true);
  };

  const voltarDoCadastroAlimentacao = () => {
    setAbrirCadastroAlimentacao(false);
    setConfiguracaoConferencia(null);
  };

  const voltarDaSaidaFenoRacao = () => {
    setAbrirSaidaFenoRacao(false);
    setConfiguracaoConferencia(null);
  };

  const voltarDoExtravioFenoRacao = () => {
    setAbrirExtravioFenoRacao(false);
    setConfiguracaoConferencia(null);
  };

  const voltarDoRelatorioFenoRacao = () => {
    setAbrirRelatorioFenoRacao(false);
    setConfiguracaoConferencia(null);
  };

  const voltarDaTransferenciaFenoRacao =
    () => {
      setAbrirTransferenciaFenoRacao(false);
      setConfiguracaoConferencia(null);
    };

  const voltarDaConsulta = () => {
    setAbrirConsulta(false);
  };

  const voltarDoAdmin = () => {
    setAbrirAdmin(false);
  };

  const voltarDaConferencia = () => {
    setConfiguracaoConferencia(null);
  };

  /*
   * ============================================
   * RECUPERAÇÃO DE SENHA
   * ============================================
   */

  if (abrirRecuperarSenha) {
    return (
      <RecuperarSenha
        onVoltar={() =>
          setAbrirRecuperarSenha(false)
        }
      />
    );
  }

  /*
   * ============================================
   * SOLICITAÇÃO DE ACESSO
   * ============================================
   */

  if (abrirSolicitarAcesso) {
    return (
      <SolicitarAcesso
        onVoltar={() =>
          setAbrirSolicitarAcesso(false)
        }
      />
    );
  }

  /*
   * ============================================
   * LOGIN
   * ============================================
   */

  if (!usuarioLogado) {
    return (
      <Login
        onLoginSuccess={(usuario) => {
          const usuarioNormalizado =
            normalizarUsuarioLogado(usuario);

          setUsuarioLogado(
            usuarioNormalizado
          );
        }}
        onSolicitarAcesso={() => {
          setAbrirRecuperarSenha(false);
          setAbrirSolicitarAcesso(true);
        }}
        onRecuperarSenha={() => {
          setAbrirSolicitarAcesso(false);
          setAbrirRecuperarSenha(true);
        }}
      />
    );
  }

  if (abrirTransferenciaFenoRacao) {
    return (
      <TransferenciaFenoRacao
        usuario={usuarioLogado}
        onVoltar={
          voltarDaTransferenciaFenoRacao
        }
      />
    );
  }

  if (abrirRelatorioFenoRacao) {
    return (
      <RelatorioFenoRacao
        usuario={usuarioLogado}
        onVoltar={
          voltarDoRelatorioFenoRacao
        }
      />
    );
  }

  if (abrirExtravioFenoRacao) {
    return (
      <ExtravioFenoRacao
        usuario={usuarioLogado}
        onVoltar={
          voltarDoExtravioFenoRacao
        }
      />
    );
  }

  if (abrirSaidaFenoRacao) {
    return (
      <SaidaFenoRacao
        usuario={usuarioLogado}
        onVoltar={
          voltarDaSaidaFenoRacao
        }
      />
    );
  }

  if (abrirCadastroAlimentacao) {
    return (
      <CadastroFenoRacao
        usuario={usuarioLogado}
        onVoltar={
          voltarDoCadastroAlimentacao
        }
      />
    );
  }

  if (materialEmEdicao) {
    return (
      <EditarMaterial
        material={materialEmEdicao}
        usuario={usuarioLogado}
        onSalvar={salvarMaterialEditado}
        onInativar={excluirMaterial}
        onCancelar={() =>
          setMaterialEmEdicao(null)
        }
      />
    );
  }

  if (cadastroPendente) {
    return (
      <CadastroMaterial
        usuario={usuarioLogado}
        configuracao={
          configuracaoConferencia
        }
        codigo={cadastroPendente.codigo}
        modo={cadastroPendente.modo}
        onSalvar={salvarMaterialCadastrado}
        onCancelar={() =>
          setCadastroPendente(null)
        }
      />
    );
  }

  if (abrirAdmin) {
    return (
      <AdminPainel
        usuario={usuarioLogado}
        onVoltar={voltarDoAdmin}
      />
    );
  }

  if (abrirConsulta) {
    return (
      <ConsultaMateriais
        usuario={usuarioLogado}
        materiais={materiais}
        onVoltar={voltarDaConsulta}
      />
    );
  }

  if (!configuracaoConferencia) {
    return (
      <>
        <SelecionarConferencia
          usuario={usuarioLogado}
          onSair={sairDoSistema}
          onIniciarConferencia={
            iniciarConferenciaComPermissao
          }
          onZerarConferencia={
            zerarConferenciaDaUnidade
          }
          onAbrirCadastroManual={
            abrirTelaCadastroManual
          }
          onAbrirConsulta={
            abrirConsultaComPermissao
          }
          onAbrirAdmin={() =>
            setAbrirAdmin(true)
          }
          onAbrirFenoRacao={
            abrirModuloFenoRacao
          }
          onAbrirCadastroAlimentacao={
            abrirModuloFenoRacao
          }
          onAbrirSaidaFenoRacao={
            abrirModuloFenoRacao
          }
        />

        {abrirModalFenoRacao && (
          <div className="modal-feno-racao-overlay">
            <div className="modal-feno-racao">
              <div className="modal-feno-racao-header">
                <span>
                  Alimentação equina
                </span>

                <h2>Feno e Ração</h2>

                <p>
                  Escolha uma opção para
                  continuar.
                </p>
              </div>

              <div className="modal-feno-racao-actions">
                {usuarioPodeAdministrarFenoRacao(
                  usuarioLogado
                ) && (
                  <button
                    type="button"
                    className="modal-feno-racao-btn modal-feno-racao-btn-cadastro"
                    onClick={
                      abrirTelaCadastroAlimentacao
                    }
                  >
                    Cadastrar Feno e Ração
                  </button>
                )}

                <button
                  type="button"
                  className="modal-feno-racao-btn modal-feno-racao-btn-saida"
                  onClick={
                    abrirTelaSaidaFenoRacao
                  }
                >
                  Saída de Feno e Ração
                </button>

                <button
                  type="button"
                  className="modal-feno-racao-btn modal-feno-racao-btn-extravio"
                  onClick={
                    abrirTelaExtravioFenoRacao
                  }
                >
                  Extravio de Feno e Ração
                </button>

                {usuarioPodeAdministrarFenoRacao(
                  usuarioLogado
                ) && (
                  <>
                    <button
                      type="button"
                      className="modal-feno-racao-btn modal-feno-racao-btn-relatorio"
                      onClick={
                        abrirTelaRelatorioFenoRacao
                      }
                    >
                      Relatório de Feno e Ração
                    </button>

                    <button
                      type="button"
                      className="modal-feno-racao-btn modal-feno-racao-btn-transferencia"
                      onClick={
                        abrirTelaTransferenciaFenoRacao
                      }
                    >
                      Transferência de Feno e Ração
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                className="modal-feno-racao-cancelar"
                onClick={() =>
                  setAbrirModalFenoRacao(false)
                }
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <ConferenciaMateriais
      usuario={usuarioLogado}
      configuracao={configuracaoConferencia}
      materiais={materiais}
      setMateriais={setMateriais}
      onVoltar={voltarDaConferencia}
      onAbrirCadastro={
        abrirTelaCadastroConferencia
      }
      onEditarMaterial={
        setMaterialEmEdicao
      }
      onExcluirMaterial={excluirMaterial}
    />
  );
}

export default App;