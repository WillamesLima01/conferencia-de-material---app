import { useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBarcode,
  FaCheck,
  FaCircleExclamation,
  FaMagnifyingGlass,
  FaPlus,
  FaXmark,
} from 'react-icons/fa6';
import { materiaisMock } from '../data/materiais';
import '../styles/ConferenciaMateriais.css';

function ConferenciaMateriais({ usuario, configuracao, onVoltar }) {
  const [todosMateriais, setTodosMateriais] = useState(materiaisMock);
  const [codigoLido, setCodigoLido] = useState('');
  const [codigoPendente, setCodigoPendente] = useState('');
  const [modalNaoEncontrado, setModalNaoEncontrado] = useState(false);
  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalOutroSetor, setModalOutroSetor] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const [novoMaterial, setNovoMaterial] = useState({
    descricao: '',
    observacao: '',
  });

  const materiaisDaConferencia = useMemo(() => {
    return todosMateriais.filter((material) => {
      const mesmaUnidade = material.unidade === usuario.unidade;

      if (configuracao.tipo === 'TODOS') {
        return mesmaUnidade;
      }

      return mesmaUnidade && material.setor === configuracao.setor;
    });
  }, [todosMateriais, usuario.unidade, configuracao]);

  const total = materiaisDaConferencia.length;
  const conferidos = materiaisDaConferencia.filter(
    (material) => material.Conferido === 1
  ).length;
  const pendentes = total - conferidos;

  const normalizarCodigo = (valor) => {
    return valor.trim();
  };

  const limparMensagens = () => {
    setMensagem('');
  };

  const conferirCodigo = () => {
    limparMensagens();

    const codigo = normalizarCodigo(codigoLido);

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

  const verificarEmTodosItens = () => {
    const materialEncontrado = todosMateriais.find(
      (material) => material.NSerie === codigoPendente
    );

    if (!materialEncontrado) {
      setModalNaoEncontrado(false);
      setModalCadastro(true);
      setNovoMaterial({
        descricao: '',
        observacao: '',
      });
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
    setModalCadastro(true);
    setNovoMaterial({
      descricao: '',
      observacao: '',
    });
  };

  const salvarCadastroRapido = () => {
    if (!novoMaterial.descricao.trim()) {
      setMensagem('Informe a descrição do material.');
      return;
    }

    const novoId =
      todosMateriais.length > 0
        ? Math.max(...todosMateriais.map((material) => material.ID)) + 1
        : 1;

    const materialCriado = {
      ID: novoId,
      NSerie: codigoPendente,
      descricao: novoMaterial.descricao.trim(),
      observacao: novoMaterial.observacao.trim() || '-',
      setor: configuracao.tipo === 'SETOR' ? configuracao.setor : usuario.setor,
      unidade: usuario.unidade,
      dataCadastro: new Date().toISOString().slice(0, 10),
      userID: usuario.id,
      dataModificacao: new Date().toISOString(),
      userModificador: usuario.id,
      Conferido: 1,
    };

    setTodosMateriais((materiaisAtuais) => [...materiaisAtuais, materialCriado]);
    setModalCadastro(false);
    setCodigoLido('');
    setCodigoPendente('');
    setMensagem(`Material cadastrado e conferido: ${materialCriado.descricao}`);
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
      `Setor atualizado para ${configuracao.setor} e material conferido.`
    );
    setModalOutroSetor(null);
    setCodigoLido('');
    setCodigoPendente('');
  };

  const fecharModais = () => {
    setModalNaoEncontrado(false);
    setModalCadastro(false);
    setModalOutroSetor(null);
    setCodigoPendente('');
  };

  return (
    <main className="conferencia-page">
      <section className="conferencia-phone">
        <header className="conferencia-header">
          <button type="button" className="voltar-button" onClick={onVoltar}>
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

          {mensagem && <div className="mensagem-conferencia">{mensagem}</div>}
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
                O código <strong>{codigoPendente}</strong> não foi encontrado na
                lista atual da conferência.
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

        {modalCadastro && (
          <div className="modal-overlay">
            <div className="modal-card cadastro-card">
              <div className="modal-icon cadastro">
                <FaPlus />
              </div>

              <h2>Cadastro rápido</h2>
              <p>
                O material será cadastrado na unidade{' '}
                <strong>{usuario.unidade}</strong> e no setor{' '}
                <strong>
                  {configuracao.tipo === 'SETOR'
                    ? configuracao.setor
                    : usuario.setor}
                </strong>
                .
              </p>

              <label className="cadastro-label">
                Nº Série
                <input type="text" value={codigoPendente} disabled />
              </label>

              <label className="cadastro-label">
                Descrição
                <input
                  type="text"
                  value={novoMaterial.descricao}
                  placeholder="Digite a descrição do material"
                  onChange={(event) =>
                    setNovoMaterial((dados) => ({
                      ...dados,
                      descricao: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="cadastro-label">
                Observação
                <textarea
                  value={novoMaterial.observacao}
                  placeholder="Observação, se houver"
                  onChange={(event) =>
                    setNovoMaterial((dados) => ({
                      ...dados,
                      observacao: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-primary"
                  onClick={salvarCadastroRapido}
                >
                  Salvar e continuar
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
                <span>Setor cadastrado</span>
                <strong>{modalOutroSetor.setor}</strong>

                <span>Setor atual da conferência</span>
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
      </section>
    </main>
  );
}

export default ConferenciaMateriais;