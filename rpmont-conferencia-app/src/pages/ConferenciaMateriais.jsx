import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowLeft,
  FaBarcode,
  FaCamera,
  FaCheck,
  FaCircleExclamation,
  FaMagnifyingGlass,
  FaPlus,
  FaXmark,
  FaPenToSquare,
  FaTrashCan,
  FaTriangleExclamation,
} from 'react-icons/fa6';

import '../styles/ConferenciaMateriais.css';

function ConferenciaMateriais({
  usuario,
  configuracao,
  materiais,
  setMateriais,
  onVoltar,
  onAbrirCadastro,
  onEditarMaterial,
  onExcluirMaterial,
}) {
  const todosMateriais = materiais;
  const setTodosMateriais = setMateriais;

  const [codigoLido, setCodigoLido] = useState('');
  const [codigoPendente, setCodigoPendente] = useState('');
  const [modalNaoEncontrado, setModalNaoEncontrado] = useState(false);
  const [modalOutroSetor, setModalOutroSetor] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const [cameraAberta, setCameraAberta] = useState(false);
  const [carregandoCamera, setCarregandoCamera] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const leitorAtivoRef = useRef(false);

  const [modalExcluir, setModalExcluir] = useState(null);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [mensagemExcluir, setMensagemExcluir] = useState('');

  const usuarioEhAdmin = Number(usuario.nivel) === 1;

  const materiaisDaConferencia = useMemo(() => {
    return todosMateriais.filter((material) => {
      const materialAtivo = material.situacao !== 'INATIVO';
      const mesmaUnidade = material.unidade === usuario.unidade;

      if (configuracao.tipo === 'TODOS') {
        return materialAtivo && mesmaUnidade;
      }

      return (
        materialAtivo &&
        mesmaUnidade &&
        material.setor === configuracao.setor
      );
    });
  }, [todosMateriais, usuario.unidade, configuracao]);

  const total = materiaisDaConferencia.length;

  const conferidos = materiaisDaConferencia.filter(
    (material) => material.Conferido === 1
  ).length;

  const pendentes = total - conferidos;

  const normalizarCodigo = (valor) => {
    return String(valor || '').trim();
  };

  const limparMensagens = () => {
    setMensagem('');
  };

  const conferirCodigoPorValor = (valorCodigo) => {
    limparMensagens();

    const codigo = normalizarCodigo(valorCodigo);

    if (!codigo) {
      setMensagem('Informe ou leia um código de barras.');
      return;
    }

    const materialNaLista = materiaisDaConferencia.find(
      (material) => material.NSerie === codigo
    );

    if (materialNaLista) {
      setTodosMateriais((materiaisAtuais) =>
        materiaisAtuais.map((material) =>
          material.ID === materialNaLista.ID
            ? {
                ...material,
                Conferido: 1,
                dataModificacao: new Date().toISOString(),
                userModificador: usuario.id,
              }
            : material
        )
      );

      setMensagem(`Material conferido: ${materialNaLista.descricao}`);
      setCodigoLido('');
      return;
    }

    setCodigoPendente(codigo);
    setModalNaoEncontrado(true);
  };

  const conferirCodigo = () => {
    conferirCodigoPorValor(codigoLido);
  };

  const pararCamera = () => {
    leitorAtivoRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraAberta(false);
    setCarregandoCamera(false);
  };

  const processarCodigoCamera = (codigo) => {
    setCodigoLido(codigo);
    pararCamera();
    conferirCodigoPorValor(codigo);
  };

  const abrirLeitorCodigoBarra = async () => {
    limparMensagens();

    if (!('BarcodeDetector' in window)) {
      setMensagem(
        'Leitor de código de barras não disponível neste navegador. No app Android final, vamos usar o leitor nativo.'
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMensagem('Câmera não disponível neste dispositivo.');
      return;
    }

    try {
      setCarregandoCamera(true);
      setCameraAberta(true);
      leitorAtivoRef.current = true;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
        audio: false,
      });

      streamRef.current = stream;

      setTimeout(async () => {
        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new window.BarcodeDetector();

        const detectarCodigo = async () => {
          if (!leitorAtivoRef.current || !videoRef.current) return;

          try {
            const codigos = await detector.detect(videoRef.current);

            if (codigos.length > 0) {
              const codigoDetectado = codigos[0].rawValue;
              processarCodigoCamera(codigoDetectado);
              return;
            }
          } catch {
            setMensagem('Não foi possível ler o código. Tente novamente.');
            pararCamera();
            return;
          }

          requestAnimationFrame(detectarCodigo);
        };

        setCarregandoCamera(false);
        detectarCodigo();
      }, 300);
    } catch {
      setMensagem('Não foi possível abrir a câmera. Verifique a permissão.');
      pararCamera();
    }
  };

  useEffect(() => {
    return () => {
      leitorAtivoRef.current = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const verificarEmTodosItens = () => {
    const materialEncontrado = todosMateriais.find(
      (material) => material.NSerie === codigoPendente
    );

    if (!materialEncontrado) {
      setModalNaoEncontrado(false);
      onAbrirCadastro(codigoPendente);
      return;
    }

    if (materialEncontrado.unidade !== usuario.unidade) {
      setModalNaoEncontrado(false);

      setMensagem(
        `Material localizado em outra unidade: ${materialEncontrado.unidade}. Procure o administrador.`
      );

      return;
    }

    if (
      configuracao.tipo === 'SETOR' &&
      materialEncontrado.setor !== configuracao.setor
    ) {
      setModalNaoEncontrado(false);
      setModalOutroSetor(materialEncontrado);
      return;
    }

    setModalNaoEncontrado(false);
    setMensagem('Material localizado, mas não pertence ao escopo atual.');
  };

  const abrirCadastroRapido = () => {
    setModalNaoEncontrado(false);
    onAbrirCadastro(codigoPendente);
  };

  const atualizarSetorEConferir = () => {
    if (!modalOutroSetor) return;

    setTodosMateriais((materiaisAtuais) =>
      materiaisAtuais.map((material) =>
        material.ID === modalOutroSetor.ID
          ? {
              ...material,
              setor: configuracao.setor,
              Conferido: 1,
              dataModificacao: new Date().toISOString(),
              userModificador: usuario.id,
            }
          : material
      )
    );

    setMensagem(
      `Material transferido para ${configuracao.setor} e conferido com sucesso.`
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

  const abrirModalExcluir = (material) => {
    setModalExcluir(material);
    setSenhaExcluir('');
    setMensagemExcluir('');
  };

  const fecharModalExcluir = () => {
    setModalExcluir(null);
    setSenhaExcluir('');
    setMensagemExcluir('');
  };

  const confirmarExclusao = () => {
    if (!modalExcluir) return;

    if (senhaExcluir !== '123456') {
      setMensagemExcluir('Senha de administrador incorreta.');
      return;
    }

    onExcluirMaterial(modalExcluir);

    setMensagem(`Material excluído: ${modalExcluir.descricao}`);

    fecharModalExcluir();
  };

  return (
    <main className="conferencia-page">
      <section className="conferencia-phone">
        <header className="conferencia-header">
          <button
            type="button"
            className="voltar-button"
            onClick={onVoltar}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Conferência Patrimonial</span>

            <h1>
              {configuracao.tipo === 'TODOS'
                ? 'Todos os materiais'
                : configuracao.setor}
            </h1>

            <p>{usuario.unidade}</p>
          </div>
        </header>

        <section className="contador-grid">
          <div>
            <span>Total</span>
            <strong>{total}</strong>
          </div>

          <div>
            <span>Conferidos</span>
            <strong>{conferidos}</strong>
          </div>

          <div>
            <span>Pendentes</span>
            <strong>{pendentes}</strong>
          </div>
        </section>

        <section className="scanner-card">
          <div className="scanner-titulo">
            <FaBarcode />

            <div>
              <h2>Leitura do código</h2>
              <p>Digite ou leia o Nº Série do material.</p>
            </div>
          </div>

          <div className="codigo-area">
            <input
              type="text"
              value={codigoLido}
              placeholder="Ex.: 100005"
              onChange={(event) => {
                setCodigoLido(event.target.value);
                limparMensagens();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  conferirCodigo();
                }
              }}
            />

            <button type="button" onClick={conferirCodigo}>
              <FaMagnifyingGlass />
            </button>
          </div>

          <button
            type="button"
            className="leitor-codigo-button"
            onClick={abrirLeitorCodigoBarra}
          >
            <FaCamera />
            Leitor de código de barras
          </button>

          {mensagem && (
            <div className="mensagem-conferencia">
              {mensagem}
            </div>
          )}
        </section>

        <section className="lista-materiais">
          <div className="lista-topo">
            <h2>Materiais esperados</h2>
            <span>{pendentes} pendente(s)</span>
          </div>

          <div className="materiais-scroll">
            {materiaisDaConferencia.map((material) => (
              <article
                key={material.ID}
                className={`material-card ${
                  material.Conferido === 1 ? 'material-conferido' : ''
                }`}
              >
                <div className="material-status">
                  {material.Conferido === 1 ? <FaCheck /> : <FaBarcode />}
                </div>

                <div className="material-info">
                  <strong>{material.NSerie}</strong>
                  <h3>{material.descricao}</h3>
                  <p>{material.observacao}</p>

                  <div className="material-tags">
                    <span>{material.setor}</span>
                    <span>{material.unidade}</span>
                  </div>

                  {usuarioEhAdmin && (
                    <div className="material-acoes-admin">
                      <button
                        type="button"
                        className="editar-material-button"
                        onClick={() => onEditarMaterial(material)}
                      >
                        <FaPenToSquare />
                        Editar
                      </button>

                      <button
                        type="button"
                        className="excluir-material-button"
                        onClick={() => abrirModalExcluir(material)}
                      >
                        <FaTrashCan />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}

            {materiaisDaConferencia.length === 0 && (
              <div className="lista-vazia">
                Nenhum material encontrado para este filtro.
              </div>
            )}
          </div>
        </section>

        {modalNaoEncontrado && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-icon alerta">
                <FaCircleExclamation />
              </div>

              <h2>Produto não cadastrado neste setor</h2>

              <p>
                O código <strong>{codigoPendente}</strong> não foi encontrado
                na lista atual da conferência.
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-primary"
                  onClick={abrirCadastroRapido}
                >
                  <FaPlus />
                  Cadastrar agora
                </button>

                <button
                  type="button"
                  className="modal-secondary"
                  onClick={verificarEmTodosItens}
                >
                  <FaMagnifyingGlass />
                  Verificar em todos os itens
                </button>

                <button
                  type="button"
                  className="modal-cancel"
                  onClick={fecharModais}
                >
                  <FaXmark />
                  Não
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

              <h2>Produto localizado em outro setor</h2>

              <p>
                <strong>{modalOutroSetor.descricao}</strong>
              </p>

              <div className="divergencia-box">
                <span>Setor cadastrado no banco</span>
                <strong>{modalOutroSetor.setor}</strong>

                <span>Setor onde o material foi encontrado agora</span>
                <strong>{configuracao.setor}</strong>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-primary"
                  onClick={atualizarSetorEConferir}
                >
                  Atualizar setor e conferir
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

              <h2>Excluir material?</h2>

              <p>
                O material será removido das listagens ativas, mas continuará
                no banco como <strong>INATIVO</strong>.
              </p>

              <div className="divergencia-box">
                <span>Nº Série</span>
                <strong>{modalExcluir.NSerie}</strong>

                <span>Descrição</span>
                <strong>{modalExcluir.descricao}</strong>

                <span>Setor</span>
                <strong>{modalExcluir.setor}</strong>

                <span>Unidade</span>
                <strong>{modalExcluir.unidade}</strong>
              </div>

              <label className="senha-excluir-label">
                Senha de administrador

                <input
                  type="password"
                  value={senhaExcluir}
                  placeholder="Digite a senha"
                  onChange={(event) => {
                    setSenhaExcluir(event.target.value);
                    setMensagemExcluir('');
                  }}
                />
              </label>

              {mensagemExcluir && (
                <div className="mensagem-excluir-erro">
                  {mensagemExcluir}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-primary"
                  onClick={confirmarExclusao}
                >
                  <FaTrashCan />
                  Confirmar exclusão
                </button>

                <button
                  type="button"
                  className="modal-cancel"
                  onClick={fecharModalExcluir}
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

              <h2>Leitor de código</h2>

              <p>
                Aponte a câmera para o código de barras do material
                patrimonial.
              </p>

              <div className="camera-preview">
                <video ref={videoRef} playsInline muted />
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