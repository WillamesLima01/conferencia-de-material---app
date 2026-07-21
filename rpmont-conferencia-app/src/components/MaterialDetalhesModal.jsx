import {
  FaArrowRotateLeft,
  FaBarcode,
  FaBoxArchive,
  FaBuilding,
  FaCalendarDays,
  FaCheck,
  FaCircleInfo,
  FaClockRotateLeft,
  FaFileCircleExclamation,
  FaIndustry,
  FaLayerGroup,
  FaPenToSquare,
  FaRightFromBracket,
  FaShieldHalved,
  FaTag,
  FaTimeline,
  FaTrashCan,
  FaUser,
  FaXmark,
} from 'react-icons/fa6';

function MaterialDetalhesModal({
  material,
  aberto,
  onFechar,
  onEditar,
  onBaixar,
  onDescartar,
  onExtraviar,
  onRegistrarFurto,
  onReativar,
  onVerHistorico,
  podeEditar = true,
  podeMovimentar = true,
}) {
  if (!aberto || !material) {
    return null;
  }

  const normalizarSituacao = (valor) =>
    String(valor ?? '')
      .trim()
      .toUpperCase();

  const obterNumeroSerie = () =>
    material?.numeroSerie ??
    material?.NSerie ??
    'Não informado';

  const situacaoMaterial =
    normalizarSituacao(material?.situacao) || 'ATIVO';

  const materialEstaConferido =
    material?.conferido === true ||
    material?.conferido === 1 ||
    material?.Conferido === true ||
    material?.Conferido === 1;

  const materialEstaAtivo =
    situacaoMaterial === 'ATIVO';

  const materialEstaBaixado =
    situacaoMaterial === 'BAIXADO';

  const materialEstaExtraviado =
    situacaoMaterial === 'EXTRAVIADO';

  const materialEstaFurtado =
    situacaoMaterial === 'FURTADO';

  const materialPodeSerReativado =
    materialEstaExtraviado || materialEstaFurtado;

  const obterClasseSituacao = () => {
    switch (situacaoMaterial) {
      case 'ATIVO':
        return 'ativo';

      case 'INATIVO':
        return 'inativo';

      case 'BAIXADO':
        return 'baixado';

      case 'DESCARTADO':
        return 'descartado';

      case 'EXTRAVIADO':
        return 'extraviado';

      case 'FURTADO':
        return 'furtado';

      case 'EM_MANUTENCAO':
        return 'manutencao';

      default:
        return 'inativo';
    }
  };

  const formatarSituacao = () => {
    switch (situacaoMaterial) {
      case 'EM_MANUTENCAO':
        return 'EM MANUTENÇÃO';

      default:
        return situacaoMaterial;
    }
  };

  const formatarData = (valor) => {
    if (!valor) {
      return 'Não informada';
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return data.toLocaleDateString('pt-BR');
  };

  const formatarDataHora = (valor) => {
    if (!valor) {
      return 'Não informada';
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return data.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const obterUsuarioCadastro = () =>
    material?.usuarioCadastro?.nomeExibicao ??
    material?.usuarioCadastro?.nome ??
    material?.usuario?.nomeExibicao ??
    material?.usuario?.nome ??
    material?.userID ??
    material?.usuarioId ??
    'Não informado';

  const obterUsuarioModificador = () =>
    material?.usuarioModificador?.nomeExibicao ??
    material?.usuarioModificador?.nome ??
    material?.userModificador ??
    material?.usuarioModificadorId ??
    'Não informado';

  const fecharAoClicarFora = (event) => {
    if (event.target === event.currentTarget) {
      onFechar?.();
    }
  };

  const executarAcao = (callback) => {
    if (typeof callback !== 'function') {
      return;
    }

    onFechar?.();
    callback(material);
  };

  return (
    <div
      className="modal-overlay"
      onClick={fecharAoClicarFora}
      role="presentation"
    >
      <div
        className="modal-card material-detalhes-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="material-detalhes-titulo"
      >
        <button
          type="button"
          className="material-detalhes-fechar"
          onClick={onFechar}
          aria-label="Fechar detalhes do material"
        >
          <FaXmark />
        </button>

        <div className="modal-icon cadastro">
          <FaCircleInfo />
        </div>

        <span className="material-detalhes-subtitulo">
          Material patrimonial
        </span>

        <h2 id="material-detalhes-titulo">
          Detalhes do material
        </h2>

        <div className="material-detalhes-status">
          <span
            className={`status-material ${obterClasseSituacao()}`}
          >
            {formatarSituacao()}
          </span>

          <span
            className={
              materialEstaConferido
                ? 'status-material conferido'
                : 'status-material pendente'
            }
          >
            {materialEstaConferido
              ? 'CONFERIDO'
              : 'PENDENTE'}
          </span>
        </div>

        <div className="material-detalhes-grid">
          <div className="material-detalhes-item destaque">
            <div className="material-detalhes-icone">
              <FaBarcode />
            </div>

            <div>
              <span>Número de série</span>
              <strong>{obterNumeroSerie()}</strong>
            </div>
          </div>

          <div className="material-detalhes-item">
            <div className="material-detalhes-icone">
              <FaTag />
            </div>

            <div>
              <span>Nome</span>
              <strong>
                {material?.nome || 'Não informado'}
              </strong>
            </div>
          </div>

          <div className="material-detalhes-item">
            <div className="material-detalhes-icone">
              <FaIndustry />
            </div>

            <div>
              <span>Marca</span>
              <strong>
                {material?.marca || 'Não informada'}
              </strong>
            </div>
          </div>

          <div className="material-detalhes-item largura-total">
            <div className="material-detalhes-icone">
              <FaCircleInfo />
            </div>

            <div>
              <span>Descrição</span>
              <strong>
                {material?.descricao || 'Não informada'}
              </strong>
            </div>
          </div>

          <div className="material-detalhes-item largura-total">
            <div className="material-detalhes-icone">
              <FaLayerGroup />
            </div>

            <div>
              <span>Observação</span>
              <strong>
                {material?.observacao || 'Não informada'}
              </strong>
            </div>
          </div>

          <div className="material-detalhes-item">
            <div className="material-detalhes-icone">
              <FaLayerGroup />
            </div>

            <div>
              <span>Setor</span>
              <strong>
                {material?.setor || 'Não informado'}
              </strong>
            </div>
          </div>

          <div className="material-detalhes-item">
            <div className="material-detalhes-icone">
              <FaBuilding />
            </div>

            <div>
              <span>Unidade</span>
              <strong>
                {material?.unidade || 'Não informada'}
              </strong>
            </div>
          </div>

          <div className="material-detalhes-item">
            <div className="material-detalhes-icone">
              <FaCalendarDays />
            </div>

            <div>
              <span>Data de cadastro</span>
              <strong>
                {formatarData(material?.dataCadastro)}
              </strong>
            </div>
          </div>

          <div className="material-detalhes-item">
            <div className="material-detalhes-icone">
              <FaClockRotateLeft />
            </div>

            <div>
              <span>Última modificação</span>
              <strong>
                {formatarDataHora(
                  material?.dataModificacao
                )}
              </strong>
            </div>
          </div>

          <div className="material-detalhes-item">
            <div className="material-detalhes-icone">
              <FaUser />
            </div>

            <div>
              <span>Cadastrado por</span>
              <strong>{obterUsuarioCadastro()}</strong>
            </div>
          </div>

          <div className="material-detalhes-item">
            <div className="material-detalhes-icone">
              <FaUser />
            </div>

            <div>
              <span>Última alteração por</span>
              <strong>
                {obterUsuarioModificador()}
              </strong>
            </div>
          </div>

          <div className="material-detalhes-item">
            <div className="material-detalhes-icone">
              <FaCheck />
            </div>

            <div>
              <span>Status da conferência</span>
              <strong>
                {materialEstaConferido
                  ? 'Conferido'
                  : 'Pendente'}
              </strong>
            </div>
          </div>
        </div>

        <div className="material-detalhes-acoes">
          {typeof onVerHistorico === 'function' && (
            <button
              type="button"
              className="material-detalhes-historico"
              onClick={() =>
                executarAcao(onVerHistorico)
              }
            >
              <FaTimeline />
              Ver histórico
            </button>
          )}

          {podeEditar &&
            typeof onEditar === 'function' &&
            materialEstaAtivo && (
              <button
                type="button"
                className="material-detalhes-editar"
                onClick={() =>
                  executarAcao(onEditar)
                }
              >
                <FaPenToSquare />
                Editar material
              </button>
            )}

          {podeMovimentar &&
            materialEstaAtivo &&
            typeof onBaixar === 'function' && (
              <button
                type="button"
                className="material-detalhes-baixar"
                onClick={() =>
                  executarAcao(onBaixar)
                }
              >
                <FaBoxArchive />
                Baixar material
              </button>
            )}

          {podeMovimentar &&
            materialEstaBaixado &&
            typeof onDescartar === 'function' && (
              <button
                type="button"
                className="material-detalhes-descartar"
                onClick={() =>
                  executarAcao(onDescartar)
                }
              >
                <FaTrashCan />
                Descartar material
              </button>
            )}

          {podeMovimentar &&
            materialEstaAtivo &&
            typeof onExtraviar === 'function' && (
              <button
                type="button"
                className="material-detalhes-extraviar"
                onClick={() =>
                  executarAcao(onExtraviar)
                }
              >
                <FaFileCircleExclamation />
                Registrar extravio
              </button>
            )}

          {podeMovimentar &&
            materialEstaAtivo &&
            typeof onRegistrarFurto === 'function' && (
              <button
                type="button"
                className="material-detalhes-furto"
                onClick={() =>
                  executarAcao(onRegistrarFurto)
                }
              >
                <FaShieldHalved />
                Registrar furto
              </button>
            )}

          {podeMovimentar &&
            materialPodeSerReativado &&
            typeof onReativar === 'function' && (
              <button
                type="button"
                className="material-detalhes-reativar"
                onClick={() =>
                  executarAcao(onReativar)
                }
              >
                <FaArrowRotateLeft />
                Reativar material
              </button>
            )}

          <button
            type="button"
            className="material-detalhes-cancelar"
            onClick={onFechar}
          >
            <FaRightFromBracket />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaterialDetalhesModal;