import {
  FaArrowRight,
  FaBarcode,
  FaBuilding,
  FaCalendarDays,
  FaCircleInfo,
  FaClockRotateLeft,
  FaFileLines,
  FaLayerGroup,
  FaTimeline,
  FaUser,
  FaXmark,
} from 'react-icons/fa6';

function HistoricoMaterialModal({
  aberto,
  material,
  historico = [],
  carregando = false,
  erro = '',
  onFechar,
}) {
  if (!aberto || !material) {
    return null;
  }

  const obterNumeroSerie = () =>
    material?.numeroSerie ??
    material?.NSerie ??
    'Não informado';

  const fecharAoClicarFora = (event) => {
    if (
      event.target === event.currentTarget &&
      !carregando
    ) {
      onFechar?.();
    }
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

  const formatarTipoMovimentacao = (tipo) => {
    switch (
      String(tipo ?? '')
        .trim()
        .toUpperCase()
    ) {
      case 'TRANSFERENCIA_SETOR':
        return 'Transferência de setor';

      case 'TRANSFERENCIA_UNIDADE':
        return 'Transferência de unidade';

      case 'ENVIO_MANUTENCAO':
        return 'Envio para manutenção';

      case 'RETORNO_MANUTENCAO':
        return 'Retorno da manutenção';

      case 'BAIXA':
        return 'Baixa patrimonial';

      case 'DESCARTE':
        return 'Descarte patrimonial';

      case 'EXTRAVIO':
        return 'Extravio patrimonial';

      case 'FURTO':
        return 'Furto patrimonial';

      case 'REATIVACAO':
        return 'Reativação patrimonial';

      case 'AJUSTE_CADASTRAL':
        return 'Ajuste cadastral';

      case 'CADASTRO':
        return 'Cadastro';

      default:
        return tipo || 'Movimentação';
    }
  };

  const formatarSituacao = (situacao) => {
    const valor = String(situacao ?? '')
      .trim()
      .toUpperCase();

    if (!valor) {
      return 'Não informada';
    }

    switch (valor) {
      case 'EM_MANUTENCAO':
        return 'EM MANUTENÇÃO';

      default:
        return valor;
    }
  };

  const obterClasseMovimentacao = (tipo) =>
    String(tipo ?? '')
      .trim()
      .toLowerCase()
      .replaceAll('_', '-');

  return (
    <div
      className="modal-overlay"
      onClick={fecharAoClicarFora}
      role="presentation"
    >
      <div
        className="modal-card historico-material-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="historico-material-titulo"
      >
        <button
          type="button"
          className="historico-material-fechar"
          onClick={onFechar}
          disabled={carregando}
          aria-label="Fechar histórico do material"
        >
          <FaXmark />
        </button>

        <div className="historico-material-icone">
          <FaTimeline />
        </div>

        <span className="historico-material-subtitulo">
          Histórico patrimonial
        </span>

        <h2 id="historico-material-titulo">
          Movimentações do material
        </h2>

        <div className="historico-material-resumo">
          <div>
            <FaBarcode />

            <span>
              Número de série
              <strong>{obterNumeroSerie()}</strong>
            </span>
          </div>

          <div>
            <FaCircleInfo />

            <span>
              Material
              <strong>
                {material?.nome ||
                  material?.descricao ||
                  'Material patrimonial'}
              </strong>
            </span>
          </div>

          <div>
            <FaLayerGroup />

            <span>
              Setor atual
              <strong>
                {material?.setor || 'Não informado'}
              </strong>
            </span>
          </div>

          <div>
            <FaBuilding />

            <span>
              Unidade
              <strong>
                {material?.unidade || 'Não informada'}
              </strong>
            </span>
          </div>
        </div>

        {carregando && (
          <div className="historico-material-carregando">
            Carregando histórico...
          </div>
        )}

        {!carregando && erro && (
          <div
            className="historico-material-erro"
            role="alert"
          >
            {erro}
          </div>
        )}

        {!carregando &&
          !erro &&
          historico.length === 0 && (
            <div className="historico-material-vazio">
              <FaClockRotateLeft />

              <strong>
                Nenhuma movimentação encontrada
              </strong>

              <p>
                Este material ainda não possui registros
                no histórico patrimonial.
              </p>
            </div>
          )}

        {!carregando &&
          !erro &&
          historico.length > 0 && (
            <div className="historico-material-lista">
              {historico.map((movimentacao) => (
                <article
                  key={
                    movimentacao?.id ??
                    `${movimentacao?.tipoMovimentacao}-${movimentacao?.dataMovimentacao}`
                  }
                  className={`historico-material-item historico-${obterClasseMovimentacao(
                    movimentacao?.tipoMovimentacao
                  )}`}
                >
                  <div className="historico-material-item-topo">
                    <div>
                      <span className="historico-material-tipo">
                        {formatarTipoMovimentacao(
                          movimentacao?.tipoMovimentacao
                        )}
                      </span>

                      <strong>
                        {formatarDataHora(
                          movimentacao?.dataMovimentacao
                        )}
                      </strong>
                    </div>

                    <FaFileLines />
                  </div>

                  <div className="historico-material-transicao">
                    <span>
                      {formatarSituacao(
                        movimentacao?.situacaoAnterior
                      )}
                    </span>

                    <FaArrowRight />

                    <span>
                      {formatarSituacao(
                        movimentacao?.situacaoNova
                      )}
                    </span>
                  </div>

                  <div className="historico-material-dados">
                    {(movimentacao?.setorOrigem ||
                      movimentacao?.setorDestino) && (
                      <div>
                        <FaLayerGroup />

                        <p>
                          <span>Setor</span>
                          <strong>
                            {movimentacao?.setorOrigem ||
                              'Não informado'}
                            {movimentacao?.setorDestino
                              ? ` → ${movimentacao.setorDestino}`
                              : ''}
                          </strong>
                        </p>
                      </div>
                    )}

                    {(movimentacao?.unidadeOrigem ||
                      movimentacao?.unidadeDestino) && (
                      <div>
                        <FaBuilding />

                        <p>
                          <span>Unidade</span>
                          <strong>
                            {movimentacao?.unidadeOrigem ||
                              'Não informada'}
                            {movimentacao?.unidadeDestino
                              ? ` → ${movimentacao.unidadeDestino}`
                              : ''}
                          </strong>
                        </p>
                      </div>
                    )}

                    <div>
                      <FaCircleInfo />

                      <p>
                        <span>Motivo</span>
                        <strong>
                          {movimentacao?.motivo ||
                            'Não informado'}
                        </strong>
                      </p>
                    </div>

                    <div>
                      <FaFileLines />

                      <p>
                        <span>Documento</span>
                        <strong>
                          {movimentacao?.numeroDocumento ||
                            'Não informado'}
                        </strong>
                      </p>
                    </div>

                    <div>
                      <FaUser />

                      <p>
                        <span>Usuário responsável</span>
                        <strong>
                          {movimentacao?.usuarioId ??
                            'Não informado'}
                        </strong>
                      </p>
                    </div>

                    <div>
                      <FaCalendarDays />

                      <p>
                        <span>Data</span>
                        <strong>
                          {formatarDataHora(
                            movimentacao?.dataMovimentacao
                          )}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {movimentacao?.observacao && (
                    <div className="historico-material-observacao">
                      <span>Observação</span>
                      <p>{movimentacao.observacao}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

        <div className="historico-material-acoes">
          <button
            type="button"
            className="historico-material-cancelar"
            onClick={onFechar}
            disabled={carregando}
          >
            <FaXmark />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistoricoMaterialModal;