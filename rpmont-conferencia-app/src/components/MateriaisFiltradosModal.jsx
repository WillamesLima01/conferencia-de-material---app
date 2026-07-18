import { useEffect } from 'react';

import {
  FaBoxesStacked,
  FaCheck,
  FaEye,
  FaFilePdf,
  FaXmark,
} from 'react-icons/fa6';

function MateriaisFiltradosModal({
  aberto,
  materiais = [],
  setorSelecionado = '',
  gerandoPdf = false,
  onGerarPdf,
  onFechar,
  onVerDetalhes,
}) {
  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    const fecharComEscape = (event) => {
      if (event.key === 'Escape') {
        onFechar?.();
      }
    };

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.addEventListener(
      'keydown',
      fecharComEscape
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      document.removeEventListener(
        'keydown',
        fecharComEscape
      );
    };
  }, [aberto, onFechar]);

  if (!aberto) {
    return null;
  }

  const materialEstaConferido = (material) =>
    material?.conferido === true ||
    material?.conferido === 1 ||
    material?.Conferido === true ||
    material?.Conferido === 1;

  const obterNumeroSerie = (material) =>
    material?.numeroSerie ??
    material?.NSerie ??
    '';

  const obterId = (material) =>
    material?.id ?? material?.ID;

  return (
    <div
      className="materiais-filtrados-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onFechar?.();
        }
      }}
    >
      <section
        className="materiais-filtrados-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="materiais-filtrados-titulo"
      >
        <header className="materiais-filtrados-header">
          <div>
            <span>Consulta patrimonial</span>

            <h2 id="materiais-filtrados-titulo">
              Materiais encontrados
            </h2>

            <p>
              {materiais.length} item(ns)
              {setorSelecionado
                ? ` · Setor: ${setorSelecionado}`
                : ' · Todos os setores'}
            </p>
          </div>

          <button
            type="button"
            className="materiais-filtrados-fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <FaXmark />
          </button>
        </header>

        <div className="materiais-filtrados-acoes">
          <button
            type="button"
            className="materiais-filtrados-pdf"
            onClick={onGerarPdf}
            disabled={
              materiais.length === 0 ||
              gerandoPdf
            }
          >
            <FaFilePdf />

            {gerandoPdf
              ? 'Gerando PDF...'
              : 'Gerar PDF destes materiais'}
          </button>
        </div>

        <div className="materiais-filtrados-lista">
          {materiais.map((material) => {
            const conferido =
              materialEstaConferido(material);

            const inativo =
              String(
                material?.situacao ?? ''
              )
                .trim()
                .toLowerCase() === 'inativo';

            return (
              <article
                key={
                  obterId(material) ??
                  obterNumeroSerie(material)
                }
                className={`materiais-filtrados-item ${
                  inativo
                    ? 'materiais-filtrados-item-inativo'
                    : ''
                }`}
              >
                <div className="materiais-filtrados-icone">
                  {conferido ? (
                    <FaCheck />
                  ) : (
                    <FaBoxesStacked />
                  )}
                </div>

                <div className="materiais-filtrados-info">
                  <strong>
                    {obterNumeroSerie(material) ||
                      'Sem número de série'}
                  </strong>

                  <h3>
                    {material?.nome ||
                      material?.descricao ||
                      'Material'}
                  </h3>

                  {material?.marca && (
                    <p>
                      <b>Marca:</b> {material.marca}
                    </p>
                  )}

                  <p>
                    {material?.descricao ||
                      'Sem descrição'}
                  </p>

                  <div className="materiais-filtrados-tags">
                    <span>
                      {material?.setor ||
                        'Sem setor'}
                    </span>

                    <span>
                      {material?.situacao ||
                        'Sem situação'}
                    </span>

                    <span>
                      {conferido
                        ? 'CONFERIDO'
                        : 'PENDENTE'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="materiais-filtrados-detalhes"
                    onClick={() =>
                      onVerDetalhes?.(material)
                    }
                  >
                    <FaEye />
                    Ver detalhes
                  </button>
                </div>
              </article>
            );
          })}

          {materiais.length === 0 && (
            <div className="materiais-filtrados-vazio">
              Nenhum material encontrado.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default MateriaisFiltradosModal;