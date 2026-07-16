import {
    FaBarcode,
    FaBuilding,
    FaCalendarDays,
    FaCheck,
    FaCircleInfo,
    FaClockRotateLeft,
    FaIndustry,
    FaLayerGroup,
    FaPenToSquare,
    FaTag,
    FaUser,
    FaXmark,
  } from 'react-icons/fa6';
  
  function MaterialDetalhesModal({
    material,
    aberto,
    onFechar,
    onEditar,
    podeEditar = true,
  }) {
    if (!aberto || !material) {
      return null;
    }
  
    const obterNumeroSerie = () =>
      material?.numeroSerie ??
      material?.NSerie ??
      'Não informado';
  
    const materialEstaConferido =
      material?.conferido === true ||
      material?.conferido === 1 ||
      material?.Conferido === true ||
      material?.Conferido === 1;
  
    const materialEstaAtivo =
      String(material?.situacao ?? 'ATIVO')
        .trim()
        .toUpperCase() !== 'INATIVO';
  
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
  
    const abrirEdicao = () => {
      onFechar?.();
      onEditar?.(material);
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
              className={
                materialEstaAtivo
                  ? 'status-material ativo'
                  : 'status-material inativo'
              }
            >
              {materialEstaAtivo ? 'ATIVO' : 'INATIVO'}
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
                  {material?.descricao ||
                    'Não informada'}
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
                  {material?.observacao ||
                    'Não informada'}
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
            {podeEditar &&
              typeof onEditar === 'function' &&
              materialEstaAtivo && (
                <button
                  type="button"
                  className="material-detalhes-editar"
                  onClick={abrirEdicao}
                >
                  <FaPenToSquare />
                  Editar material
                </button>
              )}
  
            <button
              type="button"
              className="material-detalhes-cancelar"
              onClick={onFechar}
            >
              <FaXmark />
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default MaterialDetalhesModal;