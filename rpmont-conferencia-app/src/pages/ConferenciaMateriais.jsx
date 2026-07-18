import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  FaArrowLeft,
  FaBarcode,
  FaCamera,
  FaCheck,
  FaCircleExclamation,
  FaEye,
  FaMagnifyingGlass,
  FaPenToSquare,
  FaPlus,
  FaTrashCan,
  FaTriangleExclamation,
  FaXmark,
} from 'react-icons/fa6';

import MaterialDetalhesModal from '../components/MaterialDetalhesModal';

import {
  leitorNativoDisponivel,
  lerCodigoNativo,
} from '../services/scannerService';

import '../styles/ConferenciaMateriais.css';

function ConferenciaMateriais({
  usuario,
  configuracao,
  materiais = [],
  setMateriais,
  onVoltar,
  onAbrirCadastro,
  onEditarMaterial,
  onExcluirMaterial,
  onConferirMaterial,
}) {
  const [codigoLido, setCodigoLido] =
    useState('');

  const [codigoPendente, setCodigoPendente] =
    useState('');

  const [
    modalNaoEncontrado,
    setModalNaoEncontrado,
  ] = useState(false);

  const [modalOutroSetor, setModalOutroSetor] =
    useState(null);

  const [modalExcluir, setModalExcluir] =
    useState(null);

  const [
    materialDetalhes,
    setMaterialDetalhes,
  ] = useState(null);

  const [mensagem, setMensagem] =
    useState('');

  const [
    conferindoMaterial,
    setConferindoMaterial,
  ] = useState(false);

  const [cameraAberta, setCameraAberta] =
    useState(false);

  const [
    carregandoCamera,
    setCarregandoCamera,
  ] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const leitorAtivoRef = useRef(false);

  const normalizarTexto = (valor) =>
    String(valor ?? '')
      .trim()
      .toLowerCase();

  const normalizarCodigo = (valor) =>
    String(valor ?? '').trim();

  const obterId = (material) =>
    material?.id ?? material?.ID;

  const obterNumeroSerie = (material) =>
    material?.numeroSerie ??
    material?.NSerie ??
    '';

  const materialEstaConferido = (material) =>
    material?.conferido === true ||
    material?.conferido === 1 ||
    material?.Conferido === true ||
    material?.Conferido === 1;

  const materialEstaAtivo = (material) =>
    normalizarTexto(material?.situacao) !==
    'inativo';

  const materiaisDaConferencia =
    useMemo(() => {
      return materiais.filter((material) => {
        const mesmaUnidade =
          normalizarTexto(
            material?.unidade
          ) ===
          normalizarTexto(
            usuario?.unidade
          );

        if (
          !materialEstaAtivo(material) ||
          !mesmaUnidade
        ) {
          return false;
        }

        if (
          configuracao?.tipo === 'TODOS'
        ) {
          return true;
        }

        return (
          configuracao?.tipo === 'SETOR' &&
          normalizarTexto(
            material?.setor
          ) ===
            normalizarTexto(
              configuracao?.setor
            )
        );
      });
    }, [
      materiais,
      usuario?.unidade,
      configuracao?.tipo,
      configuracao?.setor,
    ]);

  const total =
    materiaisDaConferencia.length;

  const conferidos =
    materiaisDaConferencia.filter(
      materialEstaConferido
    ).length;

  const pendentes = total - conferidos;

  const limparMensagens = () => {
    setMensagem('');
  };

  /*
   * Atualização local temporária.
   *
   * Atualmente utilizada somente no fluxo
   * de mudança de setor.
   *
   * A conferência normal já é persistida
   * pelo backend por meio de
   * onConferirMaterial.
   */
  const atualizarMaterialNaLista = (
    idMaterial,
    dadosAtualizados
  ) => {
    if (
      typeof setMateriais !== 'function'
    ) {
      return;
    }

    setMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        obterId(material) === idMaterial
          ? {
              ...material,
              ...dadosAtualizados,
            }
          : material
      )
    );
  };

  /*
   * ==========================================
   * CONFERIR MATERIAL
   * ==========================================
   */

  const conferirCodigoPorValor = async (
    valorCodigo
  ) => {
    limparMensagens();

    const codigo =
      normalizarCodigo(valorCodigo);

    if (!codigo) {
      setMensagem(
        'Informe ou leia um código de barras ou QR Code.'
      );

      return;
    }

    if (conferindoMaterial) {
      return;
    }

    const materialNaLista =
      materiaisDaConferencia.find(
        (material) =>
          normalizarCodigo(
            obterNumeroSerie(material)
          ) === codigo
      );

    if (materialNaLista) {
      /*
       * Impede nova requisição para um material
       * que já está marcado como conferido.
       */
      if (
        materialEstaConferido(
          materialNaLista
        )
      ) {
        const identificacaoMaterial =
          materialNaLista?.nome ||
          materialNaLista?.descricao ||
          obterNumeroSerie(
            materialNaLista
          );

        setMensagem(
          `Material já conferido: ${identificacaoMaterial}`
        );

        setCodigoLido('');
        setCodigoPendente('');

        return;
      }

      if (
        typeof onConferirMaterial !==
        'function'
      ) {
        setMensagem(
          'O serviço de conferência não está disponível.'
        );

        return;
      }

      try {
        setConferindoMaterial(true);

        /*
         * O App.jsx chama:
         *
         * PATCH
         * /material-patrimonial/{id}/conferir
         */
        const materialConferido =
          await onConferirMaterial(
            materialNaLista
          );

        if (!materialConferido) {
          setMensagem(
            'Não foi possível confirmar a conferência do material.'
          );

          return;
        }

        const identificacaoMaterial =
          materialConferido?.nome ||
          materialConferido?.descricao ||
          obterNumeroSerie(
            materialConferido
          );

        setMensagem(
          `Material conferido: ${identificacaoMaterial}`
        );

        setCodigoLido('');
        setCodigoPendente('');
      } catch (error) {
        console.error(
          'Erro ao conferir material:',
          error
        );

        setMensagem(
          error?.message ||
            'Não foi possível conferir o material.'
        );
      } finally {
        setConferindoMaterial(false);
      }

      return;
    }

    setCodigoPendente(codigo);
    setModalNaoEncontrado(true);
  };

  const conferirCodigo = async () => {
    await conferirCodigoPorValor(
      codigoLido
    );
  };

  /*
   * ==========================================
   * CÂMERA
   * ==========================================
   */

  const pararCamera = () => {
    leitorAtivoRef.current = false;

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraAberta(false);
    setCarregandoCamera(false);
  };

  const processarCodigoCamera = async (
    codigo
  ) => {
    const codigoTratado =
      normalizarCodigo(codigo);

    if (!codigoTratado) {
      setMensagem(
        'Não foi possível identificar o código.'
      );

      pararCamera();

      return;
    }

    setCodigoLido(codigoTratado);

    pararCamera();

    await conferirCodigoPorValor(
      codigoTratado
    );
  };

  const abrirLeitorCodigoBarra =
    async () => {
      limparMensagens();

      if (
        conferindoMaterial ||
        carregandoCamera
      ) {
        return;
      }

      /*
       * Aplicativo Android instalado:
       * utiliza o leitor nativo do Capacitor.
       */
      if (leitorNativoDisponivel()) {
        try {
          setCarregandoCamera(true);

          const codigo =
            await lerCodigoNativo();

          if (!codigo) {
            setMensagem(
              'Leitura cancelada.'
            );

            return;
          }

          setCodigoLido(codigo);

          await conferirCodigoPorValor(
            codigo
          );
        } catch (error) {
          console.error(
            'Erro ao abrir leitor nativo:',
            error
          );

          setMensagem(
            error?.message ||
              'Não foi possível abrir o leitor.'
          );
        } finally {
          setCarregandoCamera(false);
        }

        return;
      }

      /*
       * Navegador:
       * utiliza BarcodeDetector como
       * alternativa ao leitor nativo.
       */
      if (
        !(
          'BarcodeDetector' in window
        )
      ) {
        setMensagem(
          'O leitor não está disponível neste navegador. Utilize o aplicativo Android ou digite o código manualmente.'
        );

        return;
      }

      if (
        !navigator.mediaDevices
          ?.getUserMedia
      ) {
        setMensagem(
          'A câmera não está disponível neste dispositivo.'
        );

        return;
      }

      try {
        setCarregandoCamera(true);
        setCameraAberta(true);

        leitorAtivoRef.current = true;

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: {
                  ideal: 'environment',
                },
              },

              audio: false,
            }
          );

        streamRef.current = stream;

        window.setTimeout(async () => {
          if (
            !videoRef.current ||
            !leitorAtivoRef.current
          ) {
            pararCamera();

            return;
          }

          try {
            videoRef.current.srcObject =
              stream;

            await videoRef.current.play();

            const detector =
              new window.BarcodeDetector({
                formats: [
                  'qr_code',
                  'code_128',
                  'code_39',
                  'ean_13',
                  'ean_8',
                  'upc_a',
                  'upc_e',
                ],
              });

            const detectarCodigo =
              async () => {
                if (
                  !leitorAtivoRef.current ||
                  !videoRef.current
                ) {
                  return;
                }

                try {
                  const codigos =
                    await detector.detect(
                      videoRef.current
                    );

                  const codigoDetectado =
                    normalizarCodigo(
                      codigos?.[0]
                        ?.rawValue
                    );

                  if (codigoDetectado) {
                    await processarCodigoCamera(
                      codigoDetectado
                    );

                    return;
                  }
                } catch (error) {
                  console.error(
                    'Erro ao detectar código:',
                    error
                  );

                  setMensagem(
                    'Não foi possível ler o código. Tente novamente.'
                  );

                  pararCamera();

                  return;
                }

                window.requestAnimationFrame(
                  detectarCodigo
                );
              };

            setCarregandoCamera(false);

            await detectarCodigo();
          } catch (error) {
            console.error(
              'Erro ao iniciar vídeo:',
              error
            );

            setMensagem(
              'Não foi possível iniciar a visualização da câmera.'
            );

            pararCamera();
          }
        }, 300);
      } catch (error) {
        console.error(
          'Erro ao abrir câmera:',
          error
        );

        setMensagem(
          'Não foi possível abrir a câmera. Verifique a permissão.'
        );

        pararCamera();
      }
    };

  useEffect(() => {
    return () => {
      leitorAtivoRef.current = false;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }
    };
  }, []);

  /*
   * ==========================================
   * MATERIAL NÃO ENCONTRADO
   * ==========================================
   */

  const verificarEmTodosItens = () => {
    const materialEncontrado =
      materiais.find(
        (material) =>
          normalizarCodigo(
            obterNumeroSerie(material)
          ) ===
          normalizarCodigo(
            codigoPendente
          )
      );

    if (!materialEncontrado) {
      setModalNaoEncontrado(false);

      if (
        typeof onAbrirCadastro ===
        'function'
      ) {
        onAbrirCadastro(
          codigoPendente
        );
      }

      return;
    }

    const mesmaUnidade =
      normalizarTexto(
        materialEncontrado?.unidade
      ) ===
      normalizarTexto(
        usuario?.unidade
      );

    if (!mesmaUnidade) {
      setModalNaoEncontrado(false);

      setMensagem(
        `Material localizado em outra unidade: ${
          materialEncontrado?.unidade ||
          'não informada'
        }. Procure o administrador.`
      );

      return;
    }

    if (
      !materialEstaAtivo(
        materialEncontrado
      )
    ) {
      setModalNaoEncontrado(false);

      setMensagem(
        'O material foi localizado, mas está inativo.'
      );

      return;
    }

    if (
      materialEstaConferido(
        materialEncontrado
      )
    ) {
      setModalNaoEncontrado(false);

      const identificacaoMaterial =
        materialEncontrado?.nome ||
        materialEncontrado?.descricao ||
        obterNumeroSerie(
          materialEncontrado
        );

      setMensagem(
        `Material já conferido: ${identificacaoMaterial}`
      );

      setCodigoLido('');
      setCodigoPendente('');

      return;
    }

    const materialEmOutroSetor =
      configuracao?.tipo === 'SETOR' &&
      normalizarTexto(
        materialEncontrado?.setor
      ) !==
        normalizarTexto(
          configuracao?.setor
        );

    if (materialEmOutroSetor) {
      setModalNaoEncontrado(false);

      setModalOutroSetor(
        materialEncontrado
      );

      return;
    }

    setModalNaoEncontrado(false);

    setMensagem(
      'Material localizado, mas não pertence ao escopo atual.'
    );
  };

  const abrirCadastroRapido = () => {
    setModalNaoEncontrado(false);

    if (
      typeof onAbrirCadastro ===
      'function'
    ) {
      onAbrirCadastro(
        codigoPendente
      );
    }
  };

  /*
   * Esta operação ainda altera setor e
   * conferência somente no estado local.
   *
   * Depois deverá ser conectada a um
   * endpoint específico do backend para
   * transferência de setor.
   */
  const atualizarSetorEConferir = () => {
    if (!modalOutroSetor) {
      return;
    }

    atualizarMaterialNaLista(
      obterId(modalOutroSetor),
      {
        setor: configuracao?.setor,
        conferido: true,
      }
    );

    setMensagem(
      `Material transferido para ${configuracao?.setor} e conferido com sucesso.`
    );

    setModalOutroSetor(null);
    setCodigoLido('');
    setCodigoPendente('');
  };

  const fecharModais = () => {
    setModalNaoEncontrado(false);
    setModalOutroSetor(null);
    setCodigoPendente('');
  };

  /*
   * ==========================================
   * INATIVAR MATERIAL
   * ==========================================
   */

  const abrirModalExcluir = (
    material
  ) => {
    setModalExcluir(material);
  };

  const fecharModalExcluir = () => {
    setModalExcluir(null);
  };

  const confirmarExclusao =
    async () => {
      if (!modalExcluir) {
        return;
      }

      if (
        typeof onExcluirMaterial !==
        'function'
      ) {
        setMensagem(
          'O serviço de inativação não está disponível.'
        );

        return;
      }

      try {
        await onExcluirMaterial(
          modalExcluir
        );

        const identificacaoMaterial =
          modalExcluir?.nome ||
          modalExcluir?.descricao ||
          obterNumeroSerie(
            modalExcluir
          );

        setMensagem(
          `Material inativado: ${identificacaoMaterial}`
        );

        fecharModalExcluir();
      } catch (error) {
        console.error(
          'Erro ao inativar material:',
          error
        );

        setMensagem(
          error?.message ||
            'Não foi possível inativar o material.'
        );
      }
    };

  return (
    <main className="conferencia-page">
      <section className="conferencia-phone">
        <header className="conferencia-header">
          <button
            type="button"
            className="voltar-button"
            onClick={onVoltar}
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>
              Conferência Patrimonial
            </span>

            <h1>
              {configuracao?.tipo ===
              'TODOS'
                ? 'Todos os materiais'
                : configuracao?.setor}
            </h1>

            <p>
              {usuario?.unidade ||
                'Unidade não informada'}
            </p>
          </div>
        </header>

        <section className="contador-grid">
          <div>
            <span>Total</span>

            <strong>{total}</strong>
          </div>

          <div>
            <span>Conferidos</span>

            <strong>
              {conferidos}
            </strong>
          </div>

          <div>
            <span>Pendentes</span>

            <strong>
              {pendentes}
            </strong>
          </div>
        </section>

        <section className="scanner-card">
          <div className="scanner-titulo">
            <FaBarcode />

            <div>
              <h2>
                Leitura do código
              </h2>

              <p>
                Digite ou leia o Nº Série
                do material.
              </p>
            </div>
          </div>

          <div className="codigo-area">
            <input
              type="text"
              value={codigoLido}
              maxLength={100}
              placeholder="Ex.: 00494550"
              disabled={
                conferindoMaterial ||
                carregandoCamera
              }
              onChange={(event) => {
                setCodigoLido(
                  event.target.value
                );

                limparMensagens();
              }}
              onKeyDown={async (
                event
              ) => {
                if (
                  event.key === 'Enter'
                ) {
                  await conferirCodigo();
                }
              }}
            />

            <button
              type="button"
              onClick={conferirCodigo}
              disabled={
                conferindoMaterial ||
                carregandoCamera
              }
              aria-label="Pesquisar material"
            >
              <FaMagnifyingGlass />
            </button>
          </div>

          <button
            type="button"
            className="leitor-codigo-button"
            onClick={
              abrirLeitorCodigoBarra
            }
            disabled={
              conferindoMaterial ||
              carregandoCamera
            }
          >
            <FaCamera />

            {carregandoCamera
              ? 'Abrindo leitor...'
              : 'Leitor de código / QR Code'}
          </button>

          {conferindoMaterial && (
            <div className="mensagem-conferencia">
              Registrando conferência...
            </div>
          )}

          {!conferindoMaterial &&
            mensagem && (
              <div className="mensagem-conferencia">
                {mensagem}
              </div>
            )}
        </section>

        <section className="lista-materiais">
          <div className="lista-topo">
            <h2>
              Materiais esperados
            </h2>

            <span>
              {pendentes} pendente(s)
            </span>
          </div>

          <div className="materiais-scroll">
            {materiaisDaConferencia.map(
              (material) => {
                const conferido =
                  materialEstaConferido(
                    material
                  );

                return (
                  <article
                    key={
                      obterId(material) ??
                      obterNumeroSerie(
                        material
                      )
                    }
                    className={`material-card ${
                      conferido
                        ? 'material-conferido'
                        : ''
                    }`}
                  >
                    <div className="material-status">
                      {conferido ? (
                        <FaCheck />
                      ) : (
                        <FaBarcode />
                      )}
                    </div>

                    <div className="material-info">
                      <strong>
                        {obterNumeroSerie(
                          material
                        ) ||
                          'Sem número de série'}
                      </strong>

                      <h3>
                        {material?.nome ||
                          material?.descricao ||
                          'Material'}
                      </h3>

                      {material?.marca && (
                        <p>
                          <strong>
                            Marca:
                          </strong>{' '}
                          {material.marca}
                        </p>
                      )}

                      <p>
                        {material?.descricao ||
                          'Sem descrição'}
                      </p>

                      <p>
                        {material?.observacao ||
                          'Sem observação'}
                      </p>

                      <div className="material-tags">
                        <span>
                          {material?.setor ||
                            'Sem setor'}
                        </span>

                        <span>
                          {material?.unidade ||
                            'Sem unidade'}
                        </span>
                      </div>

                      <div className="material-acoes-admin">
                        <button
                          type="button"
                          className="detalhes-material-button"
                          onClick={() =>
                            setMaterialDetalhes(
                              material
                            )
                          }
                        >
                          <FaEye />

                          Ver detalhes
                        </button>

                        {typeof onEditarMaterial ===
                          'function' && (
                          <button
                            type="button"
                            className="editar-material-button"
                            onClick={() =>
                              onEditarMaterial(
                                material
                              )
                            }
                          >
                            <FaPenToSquare />

                            Editar
                          </button>
                        )}

                        {typeof onExcluirMaterial ===
                          'function' && (
                          <button
                            type="button"
                            className="excluir-material-button"
                            onClick={() =>
                              abrirModalExcluir(
                                material
                              )
                            }
                          >
                            <FaTrashCan />

                            Inativar
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              }
            )}

            {materiaisDaConferencia.length ===
              0 && (
              <div className="lista-vazia">
                Nenhum material encontrado
                para este filtro.
              </div>
            )}
          </div>
        </section>

        <MaterialDetalhesModal
          aberto={Boolean(
            materialDetalhes
          )}
          material={materialDetalhes}
          onFechar={() =>
            setMaterialDetalhes(null)
          }
          onEditar={(material) => {
            setMaterialDetalhes(null);

            if (
              typeof onEditarMaterial ===
              'function'
            ) {
              onEditarMaterial(material);
            }
          }}
          podeEditar={
            typeof onEditarMaterial ===
            'function'
          }
        />

        {modalNaoEncontrado && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-icon alerta">
                <FaCircleExclamation />
              </div>

              <h2>
                {configuracao?.tipo ===
                'SETOR'
                  ? `Produto não cadastrado neste setor: ${
                      configuracao?.setor ||
                      'não informado'
                    }`
                  : 'Produto não cadastrado'}
              </h2>

              <p>
                O código{' '}
                <strong>
                  {codigoPendente}
                </strong>{' '}
                {configuracao?.tipo ===
                'SETOR' ? (
                  <>
                    não foi encontrado na
                    lista do setor{' '}
                    <strong>
                      {configuracao?.setor ||
                        'selecionado'}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    não foi encontrado no
                    cadastro de materiais
                    patrimoniais.
                  </>
                )}
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-primary"
                  onClick={
                    abrirCadastroRapido
                  }
                >
                  <FaPlus />

                  Cadastrar agora
                </button>

                {configuracao?.tipo ===
                  'SETOR' && (
                  <button
                    type="button"
                    className="modal-secondary"
                    onClick={
                      verificarEmTodosItens
                    }
                  >
                    <FaMagnifyingGlass />

                    Verificar em todos os
                    itens
                  </button>
                )}

                <button
                  type="button"
                  className="modal-cancel"
                  onClick={fecharModais}
                >
                  <FaXmark />

                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalOutroSetor && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-icon alerta">
                <FaCircleExclamation />
              </div>

              <h2>
                Produto localizado em
                outro setor
              </h2>

              <p>
                <strong>
                  {modalOutroSetor?.nome ||
                    modalOutroSetor?.descricao}
                </strong>
              </p>

              {modalOutroSetor?.marca && (
                <p>
                  Marca:{' '}
                  {modalOutroSetor.marca}
                </p>
              )}

              <div className="divergencia-box">
                <span>
                  Setor cadastrado no
                  banco
                </span>

                <strong>
                  {modalOutroSetor?.setor}
                </strong>

                <span>
                  Setor onde o material
                  foi encontrado
                </span>

                <strong>
                  {configuracao?.setor}
                </strong>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-primary"
                  onClick={
                    atualizarSetorEConferir
                  }
                >
                  Atualizar setor e
                  conferir
                </button>

                <button
                  type="button"
                  className="modal-cancel"
                  onClick={fecharModais}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalExcluir && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-icon excluir">
                <FaTriangleExclamation />
              </div>

              <h2>
                Inativar material?
              </h2>

              <p>
                O material será removido
                das listagens ativas, mas
                continuará registrado no
                banco como{' '}
                <strong>INATIVO</strong>.
              </p>

              <div className="divergencia-box">
                <span>Nº Série</span>

                <strong>
                  {obterNumeroSerie(
                    modalExcluir
                  )}
                </strong>

                <span>Nome</span>

                <strong>
                  {modalExcluir?.nome ||
                    'Não informado'}
                </strong>

                <span>Marca</span>

                <strong>
                  {modalExcluir?.marca ||
                    'Não informada'}
                </strong>

                <span>Descrição</span>

                <strong>
                  {modalExcluir?.descricao}
                </strong>

                <span>Setor</span>

                <strong>
                  {modalExcluir?.setor}
                </strong>

                <span>Unidade</span>

                <strong>
                  {modalExcluir?.unidade}
                </strong>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-primary"
                  onClick={
                    confirmarExclusao
                  }
                >
                  <FaTrashCan />

                  Confirmar inativação
                </button>

                <button
                  type="button"
                  className="modal-cancel"
                  onClick={
                    fecharModalExcluir
                  }
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {cameraAberta && (
          <div className="modal-overlay">
            <div className="modal-card camera-card">
              <div className="modal-icon cadastro">
                <FaCamera />
              </div>

              <h2>
                Leitor de código
              </h2>

              <p>
                Aponte a câmera para o
                código de barras ou QR
                Code do material
                patrimonial.
              </p>

              <div className="camera-preview">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                />
              </div>

              {carregandoCamera && (
                <div className="mensagem-conferencia">
                  Abrindo câmera...
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={pararCamera}
                >
                  <FaXmark />

                  Fechar leitor
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default ConferenciaMateriais;