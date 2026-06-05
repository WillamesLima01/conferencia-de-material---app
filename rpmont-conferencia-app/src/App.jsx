import { useState } from 'react';
import Login from './pages/Login';
import SelecionarConferencia from './pages/SelecionarConferencia';
import ConferenciaMateriais from './pages/ConferenciaMateriais';
import CadastroMaterial from './pages/CadastroMaterial';
import EditarMaterial from './pages/EditarMaterial';
import ConsultaMateriais from './pages/ConsultaMateriais';
import AdminPainel from './pages/AdminPainel';
import { materiaisMock } from './data/materiais';
import './App.css';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [configuracaoConferencia, setConfiguracaoConferencia] = useState(null);
  const [materiais, setMateriais] = useState(materiaisMock);

  const [abrirConsulta, setAbrirConsulta] = useState(false);
  const [abrirAdmin, setAbrirAdmin] = useState(false);

  const [cadastroPendente, setCadastroPendente] = useState(null);
  const [materialEmEdicao, setMaterialEmEdicao] = useState(null);

  const zerarConferenciaDaUnidade = (usuario) => {
    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        material.unidade === usuario.unidade && material.situacao !== 'INATIVO'
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

    setMateriais((materiaisAtuais) => [...materiaisAtuais, materialCompleto]);
    setCadastroPendente(null);
  };

  const salvarMaterialEditado = (materialAtualizado) => {
    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        material.ID === materialAtualizado.ID ? materialAtualizado : material
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
              userModificador: usuarioLogado.id,
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
      <SelecionarConferencia
        usuario={usuarioLogado}
        onIniciarConferencia={setConfiguracaoConferencia}
        onZerarConferencia={zerarConferenciaDaUnidade}
        onAbrirCadastroManual={abrirTelaCadastroManual}
        onAbrirConsulta={() => setAbrirConsulta(true)}
        onAbrirAdmin={() => setAbrirAdmin(true)}
      />
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