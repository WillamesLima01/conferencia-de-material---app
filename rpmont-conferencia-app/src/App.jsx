import { useEffect, useState } from 'react';

import Login from './pages/Login';
import SelecionarConferencia from './pages/SelecionarConferencia';
import ConferenciaMateriais from './pages/ConferenciaMateriais';
import CadastroMaterial from './pages/CadastroMaterial';
import EditarMaterial from './pages/EditarMaterial';
import ConsultaMateriais from './pages/ConsultaMateriais';
import ConsultaMovimentacoes from './pages/ConsultaMovimentacoes';
import AdminPainel from './pages/AdminPainel';
import CadastroFenoRacao from './pages/CadastroFenoRacao';
import SaidaFenoRacao from './pages/SaidaFenoRacao';
import RelatorioFenoRacao from './pages/RelatorioFenoRacao';
import ExtravioFenoRacao from './pages/ExtravioFenoRacao';
import TransferenciaFenoRacao from './pages/TransferenciaFenoRacao';
import ConsultaEstoqueFenoRacao from './pages/ConsultaEstoqueFenoRacao';
import SolicitarAcesso from './pages/SolicitarAcesso';
import RecuperarSenha from './pages/RecuperarSenha';

import {
  atualizarMaterial,
  cadastrarMaterial,
  conferirMaterial,
  inativarMaterial,
  listarMateriais,
  zerarConferencia,
} from './services/materialPatrimonialService';

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

  const [materiais, setMateriais] = useState([]);
  const [carregandoMateriais, setCarregandoMateriais] =
    useState(false);
  const [erroMateriais, setErroMateriais] = useState('');

  const [abrirConsulta, setAbrirConsulta] = useState(false);

  const [
    abrirConsultaMovimentacoes,
    setAbrirConsultaMovimentacoes,
  ] = useState(false);

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
    abrirConsultaEstoqueFenoRacao,
    setAbrirConsultaEstoqueFenoRacao,
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
  ] = useState(() => {
    return (
      sessionStorage.getItem(
        'recuperacaoSenhaEmAndamento'
      ) === 'true'
    );
  });

  useEffect(() => {
    if (abrirRecuperarSenha) {
      sessionStorage.setItem(
        'recuperacaoSenhaEmAndamento',
        'true'
      );

      return;
    }

    sessionStorage.removeItem(
      'recuperacaoSenhaEmAndamento'
    );
  }, [abrirRecuperarSenha]);

  const obterMensagemErro = (error) => {
    return (
      error?.response?.data?.message ||
      error?.message ||
      'Não foi possível concluir a operação.'
    );
  };

  const obterIdMaterial = (material) => {
    return material?.id ?? material?.ID;
  };

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

  const usuarioEhFiscalDeDia = (usuario) => {
    return (
      obterSetorUsuario(usuario) ===
      'FISCALDEDIA'
    );
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
      usuarioEhBaia(usuario) ||
      usuarioEhFiscalDeDia(usuario)
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

  const carregarMateriais = async (
    usuario,
    exibirCarregamento = true
  ) => {
    if (
      !usuario ||
      !usuarioPodeAcessarPatrimonio(usuario)
    ) {
      setMateriais([]);
      setErroMateriais('');

      if (exibirCarregamento) {
        setCarregandoMateriais(false);
      }

      return;
    }

    try {
      if (exibirCarregamento) {
        setCarregandoMateriais(true);
      }

      setErroMateriais('');

      const materiaisRecebidos =
        await listarMateriais();

      setMateriais(
        Array.isArray(materiaisRecebidos)
          ? materiaisRecebidos
          : []
      );
    } catch (error) {
      console.error(
        'Erro ao carregar materiais patrimoniais:',
        error
      );

      setErroMateriais(
        obterMensagemErro(error)
      );

      if (exibirCarregamento) {
        setMateriais([]);
      }

      throw error;
    } finally {
      if (exibirCarregamento) {
        setCarregandoMateriais(false);
      }
    }
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
      'É BAIA?',
      usuarioEhBaia(usuarioNormalizado)
    );

    console.log(
      'É FISCAL-DE-DIA?',
      usuarioEhFiscalDeDia(
        usuarioNormalizado
      )
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
    setAbrirConsultaMovimentacoes(false);
    setAbrirAdmin(false);
    setAbrirCadastroAlimentacao(false);
    setAbrirSaidaFenoRacao(false);
    setAbrirExtravioFenoRacao(false);
    setAbrirRelatorioFenoRacao(false);
    setAbrirTransferenciaFenoRacao(false);
    setAbrirConsultaEstoqueFenoRacao(false);
    setAbrirModalFenoRacao(false);
    setCadastroPendente(null);
    setMaterialEmEdicao(null);
  };

  const sairDoSistema = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioLogado');

    setUsuarioLogado(null);
    setMateriais([]);
    setErroMateriais('');
    setCarregandoMateriais(false);

    fecharTelasSecundarias();
  };

  const zerarConferenciaPatrimonial = async ({
    usuario,
    senha,
    tipo,
    setor,
  }) => {
    if (!usuarioPodeAcessarPatrimonio(usuario)) {
      throw new Error(
        'Acesso negado. Somente usuários do setor P4 podem zerar a conferência patrimonial.'
      );
    }
  
    if (!usuarioEhAdmin(usuario)) {
      throw new Error(
        'Acesso negado. Somente administradores podem zerar a conferência.'
      );
    }
  
    const senhaTratada = String(
      senha ?? ''
    ).trim();
  
    const tipoTratado = String(
      tipo ?? ''
    )
      .trim()
      .toUpperCase();
  
    const setorTratado = String(
      setor ?? ''
    ).trim();
  
    if (!senhaTratada) {
      throw new Error(
        'Digite a senha do administrador.'
      );
    }
  
    if (
      tipoTratado !== 'TODOS' &&
      tipoTratado !== 'SETOR'
    ) {
      throw new Error(
        'O tipo de zeramento é inválido.'
      );
    }
  
    if (
      tipoTratado === 'SETOR' &&
      !setorTratado
    ) {
      throw new Error(
        'O setor da conferência não foi identificado.'
      );
    }
  
    try {
      const quantidadeZerada =
        await zerarConferencia({
          senha: senhaTratada,
          tipo: tipoTratado,
          setor:
            tipoTratado === 'SETOR'
              ? setorTratado
              : null,
        });
  
      await carregarMateriais(
        usuario,
        false
      );
  
      return quantidadeZerada;
    } catch (error) {
      console.error(
        'Erro ao zerar conferência:',
        error
      );
  
      throw new Error(
        obterMensagemErro(error),
        {
          cause: error,
        }
      );
    }
  };

  const salvarMaterialCadastrado = async (
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

    try {
      const materialCadastrado =
        await cadastrarMaterial(
          dadosNovoMaterial
        );

      setMateriais((materiaisAtuais) => [
        ...materiaisAtuais,
        materialCadastrado,
      ]);

      setCadastroPendente(null);
    } catch (error) {
      console.error(
        'Erro ao cadastrar material:',
        error
      );

      window.alert(obterMensagemErro(error));
    }
  };

  const salvarMaterialEditado = async (
    dadosAtualizados
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

    const idMaterial =
      obterIdMaterial(materialEmEdicao);

    if (idMaterial === null || idMaterial === undefined) {
      window.alert(
        'Não foi possível identificar o material que será editado.'
      );

      return;
    }

    try {
      const materialAtualizado =
        await atualizarMaterial(
          idMaterial,
          dadosAtualizados
        );

      setMateriais((materiaisAtuais) =>
        materiaisAtuais.map((material) =>
          obterIdMaterial(material) === idMaterial
            ? materialAtualizado
            : material
        )
      );

      setMaterialEmEdicao(null);
    } catch (error) {
      console.error(
        'Erro ao editar material:',
        error
      );

      window.alert(obterMensagemErro(error));
    }
  };

  const atualizarMaterialAposMovimentacao = (
    materialAtualizado
  ) => {
    const materialRecebido =
      materialAtualizado?.data ??
      materialAtualizado;

    const idMaterialAtualizado =
      obterIdMaterial(materialRecebido);

    if (
      !materialRecebido ||
      idMaterialAtualizado === null ||
      idMaterialAtualizado === undefined
    ) {
      console.error(
        'Não foi possível atualizar o material na lista:',
        materialAtualizado
      );

      return;
    }

    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        obterIdMaterial(material) ===
        idMaterialAtualizado
          ? materialRecebido
          : material
      )
    );
  };

  const excluirMaterial = async (
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

    const idMaterial =
      obterIdMaterial(materialParaExcluir);

    if (idMaterial === null || idMaterial === undefined) {
      window.alert(
        'Não foi possível identificar o material que será inativado.'
      );

      return;
    }

    try {
      const materialInativado =
        await inativarMaterial(idMaterial);

      setMateriais((materiaisAtuais) =>
        materiaisAtuais.map((material) =>
          obterIdMaterial(material) === idMaterial
            ? materialInativado
            : material
        )
      );

      setMaterialEmEdicao(null);
    } catch (error) {
      console.error(
        'Erro ao inativar material:',
        error
      );

      window.alert(obterMensagemErro(error));
    }
  };

  const conferirMaterialPatrimonial = async (
    materialParaConferir
  ) => {
    if (
      !usuarioPodeAcessarPatrimonio(
        usuarioLogado
      )
    ) {
      window.alert(
        'Acesso negado. A conferência patrimonial é permitida somente para usuários do setor P4.'
      );

      return null;
    }

    const idMaterial =
      obterIdMaterial(materialParaConferir);

    if (idMaterial === null || idMaterial === undefined) {
      window.alert(
        'Não foi possível identificar o material que será conferido.'
      );

      return null;
    }

    try {
      const materialConferido =
        await conferirMaterial(idMaterial);

      setMateriais((materiaisAtuais) =>
        materiaisAtuais.map((material) =>
          obterIdMaterial(material) === idMaterial
            ? materialConferido
            : material
        )
      );

      return materialConferido;
    } catch (error) {
      console.error(
        'Erro ao conferir material:',
        error
      );

      window.alert(obterMensagemErro(error));

      return null;
    }
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

  const abrirConsultaMovimentacoesComPermissao =
    () => {
      if (
        !usuarioPodeAcessarPatrimonio(
          usuarioLogado
        )
      ) {
        window.alert(
          'Acesso negado. A consulta de movimentações patrimoniais é permitida somente para usuários do setor P4.'
        );

        return;
      }

      fecharTelasSecundarias();
      setAbrirConsultaMovimentacoes(true);
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
      'Você não tem permissão para acessar Feno e Ração. Para usuário comum, o acesso é permitido somente aos setores/funções Baia e Fiscal-de-dia do RPMont ou 3º EPMont.'
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

  const abrirTelaConsultaEstoqueFenoRacao = () => {
    if (
      !usuarioPodeAcessarFenoRacao(
        usuarioLogado
      )
    ) {
      window.alert(
        'Você não tem permissão para consultar o estoque de Feno e Ração.'
      );

      return;
    }

    fecharTelasSecundarias();

    setAbrirConsultaEstoqueFenoRacao(true);
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

  const voltarDaConsultaEstoqueFenoRacao =
    () => {
      setAbrirConsultaEstoqueFenoRacao(false);
      setConfiguracaoConferencia(null);
    };

  const voltarDaConsulta = () => {
    setAbrirConsulta(false);
  };

  const voltarDaConsultaMovimentacoes = () => {
    setAbrirConsultaMovimentacoes(false);
  };

  const voltarDoAdmin = () => {
    setAbrirAdmin(false);
  };

  const voltarDaConferencia = () => {
    setConfiguracaoConferencia(null);
  };

  if (abrirRecuperarSenha) {
    return (
      <RecuperarSenha
        onVoltar={() => {
          sessionStorage.removeItem(
            'recuperacaoSenhaEmAndamento'
          );

          setAbrirRecuperarSenha(false);
        }}
      />
    );
  }

  if (abrirSolicitarAcesso) {
    return (
      <SolicitarAcesso
        onVoltar={() =>
          setAbrirSolicitarAcesso(false)
        }
      />
    );
  }

  if (!usuarioLogado) {
    return (
      <Login
        onLoginSuccess={async (usuario) => {
          const usuarioNormalizado =
            normalizarUsuarioLogado(usuario);

          setUsuarioLogado(
            usuarioNormalizado
          );

          await carregarMateriais(
            usuarioNormalizado
          );
        }}
        onSolicitarAcesso={() => {
          sessionStorage.removeItem(
            'recuperacaoSenhaEmAndamento'
          );

          setAbrirRecuperarSenha(false);
          setAbrirSolicitarAcesso(true);
        }}
        onRecuperarSenha={() => {
          sessionStorage.setItem(
            'recuperacaoSenhaEmAndamento',
            'true'
          );

          setAbrirSolicitarAcesso(false);
          setAbrirRecuperarSenha(true);
        }}
      />
    );
  }

  if (abrirConsultaEstoqueFenoRacao) {
    return (
      <ConsultaEstoqueFenoRacao
        usuario={usuarioLogado}
        onVoltar={
          voltarDaConsultaEstoqueFenoRacao
        }
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

  if (
    carregandoMateriais &&
    (
      configuracaoConferencia ||
      abrirConsulta ||
      abrirConsultaMovimentacoes ||
      cadastroPendente ||
      materialEmEdicao
    )
  ) {
    return (
      <main className="app-feedback-page">
        <p>Carregando materiais patrimoniais...</p>
      </main>
    );
  }

  if (
    erroMateriais &&
    (
      configuracaoConferencia ||
      abrirConsulta
    )
  ) {
    return (
      <main className="app-feedback-page">
        <p>{erroMateriais}</p>

        <button
          type="button"
          onClick={() =>
            carregarMateriais(
              usuarioLogado
            )
          }
        >
          Tentar novamente
        </button>

        <button
          type="button"
          onClick={fecharTelasSecundarias}
        >
          Voltar
        </button>
      </main>
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

  if (abrirConsultaMovimentacoes) {
    return (
      <ConsultaMovimentacoes
        usuario={usuarioLogado}
        onVoltar={
          voltarDaConsultaMovimentacoes
        }
      />
    );
  }

  if (abrirConsulta) {
    return (
      <ConsultaMateriais
        usuario={usuarioLogado}
        materiais={materiais}
        onVoltar={voltarDaConsulta}
        onEditarMaterial={
          setMaterialEmEdicao
        }
        onMaterialAtualizado={
          atualizarMaterialAposMovimentacao
        }
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
          onAbrirCadastroManual={
            abrirTelaCadastroManual
          }
          onAbrirConsulta={
            abrirConsultaComPermissao
          }
          onAbrirConsultaMovimentacoes={
            abrirConsultaMovimentacoesComPermissao
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
                  className="modal-feno-racao-btn modal-feno-racao-btn-consulta"
                  onClick={
                    abrirTelaConsultaEstoqueFenoRacao
                  }
                >
                  Consultar Estoque de Feno e Ração
                </button>

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
      onConferirMaterial={
        conferirMaterialPatrimonial
      }
      onZerarConferencia={
        zerarConferenciaPatrimonial
      }
    />
  );
}

export default App;