import { useState } from 'react';
import {
  FaArrowLeft,
  FaBarcode,
  FaBuilding,
  FaFloppyDisk,
  FaLayerGroup,
  FaPenToSquare,
} from 'react-icons/fa6';
import { setoresDaUnidade } from '../data/setores';
import '../styles/EditarMaterial.css';

const unidadesSistema = ['RPMont', '3º EPMont'];

function EditarMaterial({ material, usuario, onSalvar, onCancelar }) {
  const [descricao, setDescricao] = useState(material.descricao || '');
  const [observacao, setObservacao] = useState(material.observacao || '');
  const [setor, setSetor] = useState(material.setor || '');
  const [unidade, setUnidade] = useState(material.unidade || usuario.unidade);
  const [mensagem, setMensagem] = useState('');

  const salvarAlteracoes = () => {
    if (!descricao.trim()) {
      setMensagem('Informe a descrição do material.');
      return;
    }

    if (!setor) {
      setMensagem('Selecione o setor do material.');
      return;
    }

    if (!unidade) {
      setMensagem('Selecione a unidade do material.');
      return;
    }

    onSalvar({
      ...material,
      descricao: descricao.trim(),
      observacao: observacao.trim() || '-',
      setor,
      unidade,
      dataModificacao: new Date().toISOString(),
      userModificador: usuario.id,
    });
  };

  return (
    <main className="editar-material-page">
      <section className="editar-material-phone">
        <header className="editar-material-header">
          <button
            type="button"
            className="voltar-editar-button"
            onClick={onCancelar}
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
            <strong>Alteração administrativa</strong>
            <p>
              As alterações ficarão vinculadas ao usuário administrador que está
              realizando a edição.
            </p>
          </div>
        </section>

        <section className="editar-info-grid">
          <div className="editar-info-card">
            <FaBarcode />
            <span>Nº Série</span>
            <strong>{material.NSerie}</strong>
          </div>

          <div className="editar-info-card">
            <FaBuilding />
            <span>Unidade atual</span>
            <strong>{unidade}</strong>
          </div>

          <div className="editar-info-card editar-info-card-full">
            <FaLayerGroup />
            <span>Setor atual</span>
            <strong>{setor}</strong>
          </div>
        </section>

        <section className="editar-form-card">
          <label className="editar-material-label">
            Descrição do material
            <input
              type="text"
              value={descricao}
              placeholder="Ex.: Ar-condicionado Split 12.000 BTUs"
              onChange={(event) => {
                setDescricao(event.target.value);
                setMensagem('');
              }}
            />
          </label>

          <label className="editar-material-label">
            Observação
            <textarea
              value={observacao}
              placeholder="Observação do material"
              onChange={(event) => setObservacao(event.target.value)}
            />
          </label>

          <label className="editar-material-label">
            Setor
            <select
              value={setor}
              onChange={(event) => {
                setSetor(event.target.value);
                setMensagem('');
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
            <select
              value={unidade}
              onChange={(event) => {
                setUnidade(event.target.value);
                setMensagem('');
              }}
            >
              {unidadesSistema.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {mensagem && <div className="editar-material-mensagem">{mensagem}</div>}

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
            className="cancelar-editar-button"
            onClick={onCancelar}
          >
            Cancelar
          </button>
        </section>
      </section>
    </main>
  );
}

export default EditarMaterial;