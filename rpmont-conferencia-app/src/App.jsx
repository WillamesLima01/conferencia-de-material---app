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

import { materiaisMock } from './data/materiais';

import './App.css';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [configuracaoConferencia, setConfiguracaoConferencia] = useState(null);
  const [materiais, setMateriais] = useState(materiaisMock);

  const [abrirConsulta, setAbrirConsulta] = useState(false);
  const [abrirAdmin, setAbrirAdmin] = useState(false);
  const [abrirCadastroAlimentacao, setAbrirCadastroAlimentacao] = useState(false);
  const [abrirSaidaFenoRacao, setAbrirSaidaFenoRacao] = useState(false);
  const [abrirModalFenoRacao, setAbrirModalFenoRacao] = useState(false);
  const [abrirRelatorioFenoRacao, setAbrirRelatorioFenoRacao] = useState(false);

  const [cadastroPendente, setCadastroPendente] = useState(null);
  const [materialEmEdicao, setMaterialEmEdicao] = useState(null);

  const obterValorNormalizado = (valor) => {
    return String(valor || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const obterNivelUsuario = (usuario) => {
    return obterValorNormalizado(
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
    return obterValorNormalizado(usuario?.setor || usuario?.SETOR);
  };

  const usuarioEhAdmin = (usuario) => {
    const nivel = obterNivelUsuario(usuario);

    return (
      nivel === 'ADMIN' ||
      nivel === 'ADMINP4' ||
      nivel === 'ADMIN_P4' ||
      nivel === 'ADMINMASTER' ||
      nivel === 'ADMIN_MASTER' ||
      nivel === 'MASTER' ||
      nivel === '1'
    );
  };

  const usuarioEhBaia = (usuario) => {
    return obterSetorUsuario(usuario) === 'BAIA';
  };

  const fecharTelasSecundarias = () => {
    setConfiguracaoConferencia(null);
    setAbrirConsulta(false);
    setAbrirAdmin(false);
    setAbrirCadastroAlimentacao(false);
    setAbrirSaidaFenoRacao(false);
    setAbrirRelatorioFenoRacao(false);
    setCadastroPendente(null);
    setMaterialEmEdicao(null);
  };

  const zerarConferenciaDaUnidade = (usuario) => {
    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        material.unidade === usuario.unidade &&
        material.situacao !== 'INATIVO'
          ? {
              ...material,
              Conferido: 0,
              dataModificacao: new Date().toISOString(),
              userModificador: usuario.id,
            }
          : material
      )
    );
  };

  const salvarMaterialCadastrado = (dadosNovoMaterial) => {
    const novoId =
      materiais.length > 0
        ? Math.max(...materiais.map((material) => material.ID)) + 1
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

  const salvarMaterialEditado = (materialAtualizado) => {
    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        material.ID === materialAtualizado.ID
          ? materialAtualizado
          : material
      )
    );

    setMaterialEmEdicao(null);
  };

  const excluirMaterial = (materialParaExcluir) => {
    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        material.ID === materialParaExcluir.ID
          ? {
              ...material,
              situacao: 'INATIVO',
              dataModificacao: new Date().toISOString(),
              userModificador: usuarioLogado?.id || 1,
            }
          : material
      )
    );

    setMaterialEmEdicao(null);
  };

  const abrirTelaCadastroManual = () => {
    setCadastroPendente({
      modo: 'MANUAL',
      codigo: '',
    });
  };

  const abrirTelaCadastroConferencia = (codigo) => {
    setCadastroPendente({
      modo: 'CONFERENCIA',
      codigo,
    });
  };

  const abrirModuloFenoRacao = () => {
    fecharTelasSecundarias();

    if (usuarioEhAdmin(usuarioLogado)) {
      setAbrirModalFenoRacao(true);
      return;
    }

    if (usuarioEhBaia(usuarioLogado)) {
      setAbrirSaidaFenoRacao(true);
      return;
    }

    window.alert('Você não tem permissão para acessar Feno e Ração.');
  };

  const abrirTelaCadastroAlimentacao = () => {
    fecharTelasSecundarias();
    setAbrirModalFenoRacao(false);
    setAbrirCadastroAlimentacao(true);
  };

  const abrirTelaSaidaFenoRacao = () => {
    fecharTelasSecundarias();
    setAbrirModalFenoRacao(false);
    setAbrirSaidaFenoRacao(true);
  };

  const abrirTelaRelatorioFenoRacao = () => {
    fecharTelasSecundarias();
    setAbrirModalFenoRacao(false);
    setAbrirRelatorioFenoRacao(true);
  };

  const voltarDoCadastroAlimentacao = () => {
    setAbrirCadastroAlimentacao(false);
    setConfiguracaoConferencia(null);
  };

  const voltarDaSaidaFenoRacao = () => {
    setAbrirSaidaFenoRacao(false);
    setConfiguracaoConferencia(null);
  };

  const voltarDoRelatorioFenoRacao = () => {
    setAbrirRelatorioFenoRacao(false);
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

  if (!usuarioLogado) {
    return <Login onLoginSuccess={setUsuarioLogado} />;
  }

  if (abrirRelatorioFenoRacao) {
    return (
      <RelatorioFenoRacao
        usuario={usuarioLogado}
        onVoltar={voltarDoRelatorioFenoRacao}
      />
    );
  }

  if (abrirSaidaFenoRacao) {
    return (
      <SaidaFenoRacao
        usuario={usuarioLogado}
        onVoltar={voltarDaSaidaFenoRacao}
      />
    );
  }

  if (abrirCadastroAlimentacao) {
    return (
      <CadastroFenoRacao
        usuario={usuarioLogado}
        onVoltar={voltarDoCadastroAlimentacao}
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
        onCancelar={() => setMaterialEmEdicao(null)}
      />
    );
  }

  if (cadastroPendente) {
    return (
      <CadastroMaterial
        usuario={usuarioLogado}
        configuracao={configuracaoConferencia}
        codigo={cadastroPendente.codigo}
        modo={cadastroPendente.modo}
        onSalvar={salvarMaterialCadastrado}
        onCancelar={() => setCadastroPendente(null)}
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
          onIniciarConferencia={setConfiguracaoConferencia}
          onZerarConferencia={zerarConferenciaDaUnidade}
          onAbrirCadastroManual={abrirTelaCadastroManual}
          onAbrirConsulta={() => setAbrirConsulta(true)}
          onAbrirAdmin={() => setAbrirAdmin(true)}
          onAbrirFenoRacao={abrirModuloFenoRacao}
          onAbrirCadastroAlimentacao={abrirModuloFenoRacao}
          onAbrirSaidaFenoRacao={abrirModuloFenoRacao}
        />

        {abrirModalFenoRacao && (
          <div className="modal-feno-racao-overlay">
            <div className="modal-feno-racao">
              <div className="modal-feno-racao-header">
                <span>Alimentação equina</span>
                <h2>Feno e Ração</h2>
                <p>Escolha uma opção para continuar.</p>
              </div>

              <div className="modal-feno-racao-actions">
                <button
                  type="button"
                  className="modal-feno-racao-btn modal-feno-racao-btn-cadastro"
                  onClick={abrirTelaCadastroAlimentacao}
                >
                  Cadastrar Feno e Ração
                </button>

                <button
                  type="button"
                  className="modal-feno-racao-btn modal-feno-racao-btn-saida"
                  onClick={abrirTelaSaidaFenoRacao}
                >
                  Saída de Feno e Ração
                </button>

                <button
                  type="button"
                  className="modal-feno-racao-btn modal-feno-racao-btn-relatorio"
                  onClick={abrirTelaRelatorioFenoRacao}
                >
                  Relatório de Feno e Ração
                </button>
              </div>

              <button
                type="button"
                className="modal-feno-racao-cancelar"
                onClick={() => setAbrirModalFenoRacao(false)}
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
      onAbrirCadastro={abrirTelaCadastroConferencia}
      onEditarMaterial={setMaterialEmEdicao}
      onExcluirMaterial={excluirMaterial}
    />
  );
}

export default App;