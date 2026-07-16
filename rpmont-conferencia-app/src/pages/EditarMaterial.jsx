import { useState } from 'react';
import {
  FaArrowLeft,
  FaBarcode,
  FaBuilding,
  FaFloppyDisk,
  FaLayerGroup,
  FaPenToSquare,
  FaTrashCan,
  FaTriangleExclamation,
  FaXmark,
} from 'react-icons/fa6';
import { setoresDaUnidade } from '../data/setores';
import '../styles/EditarMaterial.css';

function EditarMaterial({
  material,
  usuario,
  onSalvar,
  onInativar,
  onCancelar,
}) {
  const [numeroSerie, setNumeroSerie] = useState(
    material?.numeroSerie || ''
  );

  const [nome, setNome] = useState(
    material?.nome || ''
  );

  const [marca, setMarca] = useState(
    material?.marca || ''
  );

  const [descricao, setDescricao] = useState(
    material?.descricao || ''
  );

  const [observacao, setObservacao] = useState(
    material?.observacao === '-'
      ? ''
      : material?.observacao || ''
  );

  const [setor, setSetor] = useState(
    material?.setor || ''
  );

  const [mensagem, setMensagem] = useState('');

  const [modalInativar, setModalInativar] = useState(false);

  const limparMensagem = () => {
    if (mensagem) {
      setMensagem('');
    }
  };

  const salvarAlteracoes = () => {
    const numeroSerieTratado = numeroSerie.trim();
    const nomeTratado = nome.trim();
    const marcaTratada = marca.trim();
    const descricaoTratada = descricao.trim();
    const observacaoTratada = observacao.trim();
    const setorTratado = setor.trim();

    if (!numeroSerieTratado) {
      setMensagem('Informe o Nº Série / código do material.');
      return;
    }

    if (!descricaoTratada) {
      setMensagem('Informe a descrição do material.');
      return;
    }

    if (!setorTratado) {
      setMensagem('Selecione o setor do material.');
      return;
    }

    /*
     * Envia somente os campos aceitos pelo
     * MaterialPatrimonialRequestDTO.
     *
     * Unidade, auditoria, datas e situação
     * são controladas pelo backend.
     */
    const materialAtualizado = {
      numeroSerie: numeroSerieTratado,
      nome: nomeTratado || null,
      marca: marcaTratada || null,
      descricao: descricaoTratada,
      observacao: observacaoTratada || null,
      setor: setorTratado,
      conferido: Boolean(material?.conferido),
    };

    onSalvar(materialAtualizado);
  };

  const abrirModalInativar = () => {
    setModalInativar(true);
  };

  const fecharModalInativar = () => {
    setModalInativar(false);
  };

  const confirmarInativacao = () => {
    onInativar(material);
    fecharModalInativar();
  };

  return (
    <main className="editar-material-page">
      <section className="editar-material-phone">
        <header className="editar-material-header">
          <button
            type="button"
            className="voltar-editar-button"
            onClick={onCancelar}
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>Editar cadastro</span>
            <h1>Editar material</h1>
            <p>Corrija os dados do item patrimonial</p>
          </div>
        </header>

        <section className="editar-alerta">
          <FaPenToSquare />

          <div>
            <strong>Alteração de material</strong>

            <p>
              As alterações ficarão vinculadas ao usuário que está realizando
              a edição.
            </p>
          </div>
        </section>

        <section className="editar-info-grid">
          <div className="editar-info-card">
            <FaBarcode />
            <span>Nº Série</span>
            <strong>
              {material?.numeroSerie || 'Não informado'}
            </strong>
          </div>

          <div className="editar-info-card">
            <FaBuilding />
            <span>Unidade</span>
            <strong>
              {material?.unidade || usuario?.unidade || 'Não informada'}
            </strong>
          </div>

          <div className="editar-info-card editar-info-card-full">
            <FaLayerGroup />
            <span>Setor atual</span>
            <strong>{setor || 'Não informado'}</strong>
          </div>
        </section>

        <section className="editar-form-card">
          <label className="editar-material-label">
            Nº Série / Código
            <input
              type="text"
              value={numeroSerie}
              maxLength={100}
              placeholder="Ex.: 00494550"
              onChange={(event) => {
                setNumeroSerie(event.target.value);
                limparMensagem();
              }}
            />
          </label>

          <label className="editar-material-label">
            Nome do material
            <input
              type="text"
              value={nome}
              maxLength={100}
              placeholder="Ex.: Monitor"
              onChange={(event) => {
                setNome(event.target.value);
                limparMensagem();
              }}
            />
          </label>

          <label className="editar-material-label">
            Marca
            <input
              type="text"
              value={marca}
              maxLength={100}
              placeholder="Ex.: Lenovo"
              onChange={(event) => {
                setMarca(event.target.value);
                limparMensagem();
              }}
            />
          </label>

          <label className="editar-material-label">
            Descrição do material
            <input
              type="text"
              value={descricao}
              maxLength={300}
              placeholder="Ex.: Monitor LED modelo ThinkVision de 24 polegadas"
              onChange={(event) => {
                setDescricao(event.target.value);
                limparMensagem();
              }}
            />
          </label>

          <label className="editar-material-label">
            Observação
            <textarea
              value={observacao}
              maxLength={500}
              placeholder="Observação do material"
              onChange={(event) => {
                setObservacao(event.target.value);
                limparMensagem();
              }}
            />
          </label>

          <label className="editar-material-label">
            Setor
            <select
              value={setor}
              onChange={(event) => {
                setSetor(event.target.value);
                limparMensagem();
              }}
            >
              <option value="">Selecione o setor</option>

              {setoresDaUnidade.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="editar-material-label">
            Unidade
            <input
              type="text"
              value={
                material?.unidade ||
                usuario?.unidade ||
                ''
              }
              disabled
            />
          </label>

          {mensagem && (
            <div className="editar-material-mensagem">
              {mensagem}
            </div>
          )}

          <button
            type="button"
            className="salvar-editar-button"
            onClick={salvarAlteracoes}
          >
            <FaFloppyDisk />
            Salvar alterações
          </button>

          <button
            type="button"
            className="inativar-material-button"
            onClick={abrirModalInativar}
          >
            <FaTrashCan />
            Inativar material
          </button>

          <button
            type="button"
            className="cancelar-editar-button"
            onClick={onCancelar}
          >
            Cancelar
          </button>
        </section>

        {modalInativar && (
          <div className="modal-inativar-overlay">
            <div className="modal-inativar-card">
              <button
                type="button"
                className="fechar-modal-inativar"
                onClick={fecharModalInativar}
                aria-label="Fechar"
              >
                <FaXmark />
              </button>

              <div className="modal-inativar-icon">
                <FaTriangleExclamation />
              </div>

              <h2>Inativar material?</h2>

              <p>
                O material{' '}
                <strong>
                  {material?.numeroSerie}
                </strong>{' '}
                será removido das listagens ativas da conferência.
              </p>

              <div className="material-inativar-resumo">
                <span>Nome</span>
                <strong>
                  {material?.nome || 'Não informado'}
                </strong>

                <span>Marca</span>
                <strong>
                  {material?.marca || 'Não informada'}
                </strong>

                <span>Descrição</span>
                <strong>{material?.descricao}</strong>

                <span>Setor</span>
                <strong>{material?.setor}</strong>

                <span>Unidade</span>
                <strong>{material?.unidade}</strong>
              </div>

              <button
                type="button"
                className="confirmar-inativar-button"
                onClick={confirmarInativacao}
              >
                Confirmar inativação
              </button>

              <button
                type="button"
                className="cancelar-inativar-button"
                onClick={fecharModalInativar}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default EditarMaterial;