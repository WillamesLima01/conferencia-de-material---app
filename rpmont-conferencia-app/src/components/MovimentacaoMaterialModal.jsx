import { useMemo, useState } from 'react';

import {
  FaArrowRotateLeft,
  FaBoxArchive,
  FaFileCircleExclamation,
  FaFloppyDisk,
  FaShieldHalved,
  FaTrashCan,
  FaXmark,
} from 'react-icons/fa6';

function MovimentacaoMaterialModal({
  aberto,
  material,
  tipo,
  processando = false,
  erro = '',
  onFechar,
  onConfirmar,
}) {
  const configuracao = useMemo(
    () => obterConfiguracaoMovimentacao(tipo),
    [tipo]
  );

  if (!aberto || !material || !configuracao) {
    return null;
  }

  const chaveFormulario = `${
    material?.id ?? material?.ID ?? 'material'
  }-${tipo}`;

  return (
    <MovimentacaoMaterialFormulario
      key={chaveFormulario}
      material={material}
      configuracao={configuracao}
      processando={processando}
      erro={erro}
      onFechar={onFechar}
      onConfirmar={onConfirmar}
    />
  );
}

function MovimentacaoMaterialFormulario({
  material,
  configuracao,
  processando,
  erro,
  onFechar,
  onConfirmar,
}) {
  const [motivo, setMotivo] = useState('');
  const [numeroDocumento, setNumeroDocumento] =
    useState('');
  const [observacao, setObservacao] = useState('');

  const obterNumeroSerie = () =>
    material?.numeroSerie ??
    material?.NSerie ??
    'Não informado';

  const fecharAoClicarFora = (event) => {
    if (
      event.target === event.currentTarget &&
      !processando
    ) {
      onFechar?.();
    }
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();

    if (processando) {
      return;
    }

    const motivoTratado = motivo.trim();
    const documentoTratado =
      numeroDocumento.trim();
    const observacaoTratada =
      observacao.trim();

    if (!motivoTratado) {
      window.alert(
        configuracao.mensagemMotivoObrigatorio
      );
      return;
    }

    if (!documentoTratado) {
      window.alert(
        configuracao.mensagemDocumentoObrigatorio
      );
      return;
    }

    if (typeof onConfirmar !== 'function') {
      return;
    }

    await onConfirmar({
      motivo: motivoTratado,
      numeroDocumento: documentoTratado,
      observacao: observacaoTratada || null,
    });
  };

  const fecharModal = () => {
    if (!processando) {
      onFechar?.();
    }
  };

  const { Icone } = configuracao;

  return (
    <div
      className="modal-overlay"
      onClick={fecharAoClicarFora}
      role="presentation"
    >
      <div
        className={`modal-card movimentacao-material-modal movimentacao-${configuracao.classe}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movimentacao-material-titulo"
      >
        <button
          type="button"
          className="movimentacao-material-fechar"
          onClick={fecharModal}
          disabled={processando}
          aria-label="Fechar movimentação"
        >
          <FaXmark />
        </button>

        <div
          className={`movimentacao-material-icone ${configuracao.classe}`}
        >
          <Icone />
        </div>

        <span className="movimentacao-material-subtitulo">
          {configuracao.subtitulo}
        </span>

        <h2 id="movimentacao-material-titulo">
          {configuracao.titulo}
        </h2>

        <p className="movimentacao-material-descricao">
          {configuracao.descricao}
        </p>

        <div className="movimentacao-material-resumo">
          <span>Material</span>

          <strong>
            {material?.nome ||
              material?.descricao ||
              'Material patrimonial'}
          </strong>

          <p>
            Série: {obterNumeroSerie()}
          </p>

          <p>
            Setor:{' '}
            {material?.setor || 'Não informado'}
          </p>

          <p>
            Situação atual:{' '}
            {material?.situacao || 'Não informada'}
          </p>
        </div>

        <form
          className="movimentacao-material-form"
          onSubmit={enviarFormulario}
        >
          <label>
            {configuracao.labelMotivo}

            <textarea
              value={motivo}
              placeholder={
                configuracao.placeholderMotivo
              }
              maxLength={300}
              rows={3}
              disabled={processando}
              required
              onChange={(event) =>
                setMotivo(event.target.value)
              }
            />

            <small>{motivo.length}/300</small>
          </label>

          <label>
            {configuracao.labelDocumento}

            <input
              type="text"
              value={numeroDocumento}
              placeholder={
                configuracao.placeholderDocumento
              }
              maxLength={150}
              disabled={processando}
              required
              onChange={(event) =>
                setNumeroDocumento(
                  event.target.value
                )
              }
            />

            <small>
              {numeroDocumento.length}/150
            </small>
          </label>

          <label>
            Observação

            <textarea
              value={observacao}
              placeholder="Informações complementares da movimentação"
              maxLength={500}
              rows={4}
              disabled={processando}
              onChange={(event) =>
                setObservacao(event.target.value)
              }
            />

            <small>
              {observacao.length}/500
            </small>
          </label>

          {erro && (
            <div
              className="movimentacao-material-erro"
              role="alert"
            >
              {erro}
            </div>
          )}

          <div className="movimentacao-material-acoes">
            <button
              type="button"
              className="movimentacao-material-cancelar"
              onClick={fecharModal}
              disabled={processando}
            >
              <FaXmark />
              Cancelar
            </button>

            <button
              type="submit"
              className={`movimentacao-material-confirmar ${configuracao.classe}`}
              disabled={
                processando ||
                !motivo.trim() ||
                !numeroDocumento.trim()
              }
            >
              <FaFloppyDisk />

              {processando
                ? 'Processando...'
                : configuracao.textoBotao}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function obterConfiguracaoMovimentacao(tipo) {
  switch (tipo) {
    case 'BAIXA':
      return {
        titulo: 'Baixar material',
        subtitulo: 'Baixa patrimonial',
        descricao:
          'O material será retirado da situação ativa e ficará disponível para descarte posterior.',
        textoBotao: 'Confirmar baixa',
        labelMotivo: 'Motivo da baixa',
        placeholderMotivo:
          'Ex.: material sem condições de uso',
        labelDocumento:
          'Número do documento',
        placeholderDocumento:
          'Ex.: TERMO-BAIXA-001/2026',
        mensagemMotivoObrigatorio:
          'Informe o motivo da baixa.',
        mensagemDocumentoObrigatorio:
          'Informe o número do documento da baixa.',
        Icone: FaBoxArchive,
        classe: 'baixa',
      };

    case 'DESCARTE':
      return {
        titulo: 'Descartar material',
        subtitulo: 'Descarte patrimonial',
        descricao:
          'O descarte é definitivo e somente pode ser realizado em materiais previamente baixados.',
        textoBotao: 'Confirmar descarte',
        labelMotivo: 'Motivo do descarte',
        placeholderMotivo:
          'Ex.: material inutilizado e sem possibilidade de recuperação',
        labelDocumento:
          'Número do documento',
        placeholderDocumento:
          'Ex.: TERMO-DESCARTE-001/2026',
        mensagemMotivoObrigatorio:
          'Informe o motivo do descarte.',
        mensagemDocumentoObrigatorio:
          'Informe o número do documento do descarte.',
        Icone: FaTrashCan,
        classe: 'descarte',
      };

    case 'EXTRAVIO':
      return {
        titulo: 'Registrar extravio',
        subtitulo: 'Extravio patrimonial',
        descricao:
          'O material será marcado como extraviado e ficará bloqueado para conferência.',
        textoBotao: 'Confirmar extravio',
        labelMotivo: 'Motivo do extravio',
        placeholderMotivo:
          'Ex.: material não localizado durante a conferência',
        labelDocumento:
          'Número do documento',
        placeholderDocumento:
          'Ex.: REL-EXTRAVIO-001/2026',
        mensagemMotivoObrigatorio:
          'Informe o motivo do extravio.',
        mensagemDocumentoObrigatorio:
          'Informe o número do documento do extravio.',
        Icone: FaFileCircleExclamation,
        classe: 'extravio',
      };

    case 'FURTO':
      return {
        titulo: 'Registrar furto',
        subtitulo: 'Furto patrimonial',
        descricao:
          'O material será marcado como furtado e ficará bloqueado para conferência.',
        textoBotao: 'Confirmar furto',
        labelMotivo:
          'Motivo do registro',
        placeholderMotivo:
          'Ex.: material subtraído das dependências da unidade',
        labelDocumento:
          'Número do boletim de ocorrência',
        placeholderDocumento:
          'Ex.: BO-001/2026',
        mensagemMotivoObrigatorio:
          'Informe o motivo do registro de furto.',
        mensagemDocumentoObrigatorio:
          'Informe o número do boletim de ocorrência.',
        Icone: FaShieldHalved,
        classe: 'furto',
      };

    case 'REATIVACAO':
      return {
        titulo: 'Reativar material',
        subtitulo: 'Reativação patrimonial',
        descricao:
          'O material será reintegrado ao patrimônio e voltará para a situação ativa.',
        textoBotao: 'Confirmar reativação',
        labelMotivo:
          'Motivo da reativação',
        placeholderMotivo:
          'Ex.: material recuperado e devolvido ao patrimônio',
        labelDocumento:
          'Número do documento',
        placeholderDocumento:
          'Ex.: TERMO-RECUPERACAO-001/2026',
        mensagemMotivoObrigatorio:
          'Informe o motivo da reativação.',
        mensagemDocumentoObrigatorio:
          'Informe o número do documento da reativação.',
        Icone: FaArrowRotateLeft,
        classe: 'reativacao',
      };

    default:
      return null;
  }
}

export default MovimentacaoMaterialModal;