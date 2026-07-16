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
import '../styles/CadastroMaterial.css';

function CadastroMaterial({
  usuario,
  configuracao,
  codigo = '',
  modo = 'CONFERENCIA',
  onSalvar,
  onCancelar,
}) {
  const cadastroManual = modo === 'MANUAL';

  const [nSerie, setNSerie] = useState(codigo || '');
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [descricao, setDescricao] = useState('');
  const [observacao, setObservacao] = useState('');

  const [setorSelecionado, setSetorSelecionado] = useState(
    cadastroManual
      ? usuario?.setor || ''
      : configuracao?.tipo === 'SETOR'
        ? configuracao?.setor || ''
        : usuario?.setor || ''
  );

  const [mensagem, setMensagem] = useState('');

  const setorCadastro = cadastroManual
    ? setorSelecionado
    : configuracao?.tipo === 'SETOR'
      ? configuracao?.setor
      : usuario?.setor;

  const limparMensagem = () => {
    if (mensagem) {
      setMensagem('');
    }
  };

  const salvarMaterial = () => {
    const numeroSerieTratado = nSerie.trim();
    const nomeTratado = nome.trim();
    const marcaTratada = marca.trim();
    const descricaoTratada = descricao.trim();
    const observacaoTratada = observacao.trim();

    if (!numeroSerieTratado) {
      setMensagem('Informe o Nº Série / código do material.');
      return;
    }

    if (!descricaoTratada) {
      setMensagem('Informe a descrição do material.');
      return;
    }

    if (!setorCadastro?.trim()) {
      setMensagem('Selecione o setor do material.');
      return;
    }

    /*
     * O backend preenche automaticamente:
     *
     * unidade;
     * dataCadastro;
     * usuarioId;
     * dataModificacao;
     * usuarioModificadorId;
     * situacao.
     */
    const novoMaterial = {
      numeroSerie: numeroSerieTratado,
      nome: nomeTratado || null,
      marca: marcaTratada || null,
      descricao: descricaoTratada,
      observacao: observacaoTratada || null,
      setor: setorCadastro.trim(),
      conferido: !cadastroManual,
    };

    onSalvar(novoMaterial);
  };

  return (
    <main className="cadastro-material-page">
      <section className="cadastro-material-phone">
        <header className="cadastro-material-header">
          <button
            type="button"
            className="voltar-cadastro-button"
            onClick={onCancelar}
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>
              {cadastroManual ? 'Cadastro manual' : 'Cadastro rápido'}
            </span>

            <h1>Novo material</h1>

            <p>
              {cadastroManual
                ? 'Cadastrar material recebido pela unidade'
                : 'Material encontrado durante a conferência'}
            </p>
          </div>
        </header>

        <section className="cadastro-alerta">
          <FaPenToSquare />

          <div>
            <strong>
              {cadastroManual
                ? 'Cadastrar novo material'
                : 'Produto não cadastrado'}
            </strong>

            <p>
              {cadastroManual
                ? 'Informe os dados do material para inserir no sistema.'
                : 'Complete os dados abaixo para cadastrar e retornar automaticamente para a conferência.'}
            </p>
          </div>
        </section>

        <section className="cadastro-info-grid">
          <div className="cadastro-info-card">
            <FaBuilding />

            <span>Unidade</span>

            <strong>{usuario?.unidade || 'Não informada'}</strong>
          </div>

          <div className="cadastro-info-card">
            <FaLayerGroup />

            <span>Setor</span>

            <strong>{setorCadastro || 'Selecione'}</strong>
          </div>
        </section>

        <section className="cadastro-form-card">
          <label className="cadastro-material-label">
            Nº Série / Código
            <div className="input-com-icone">
              <FaBarcode />

              <input
                type="text"
                value={nSerie}
                disabled={!cadastroManual}
                maxLength={100}
                placeholder="Ex.: 00494550"
                onChange={(event) => {
                  setNSerie(event.target.value);
                  limparMensagem();
                }}
              />
            </div>
          </label>

          {cadastroManual && (
            <label className="cadastro-material-label">
              Setor
              <select
                value={setorSelecionado}
                onChange={(event) => {
                  setSetorSelecionado(event.target.value);
                  limparMensagem();
                }}
              >
                <option value="">Selecione o setor</option>

                {setoresDaUnidade.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="cadastro-material-label">
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

          <label className="cadastro-material-label">
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

          <label className="cadastro-material-label">
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

          <label className="cadastro-material-label">
            Observação
            <textarea
              value={observacao}
              maxLength={500}
              placeholder="Ex.: Instalado na sala do P4"
              onChange={(event) => {
                setObservacao(event.target.value);
                limparMensagem();
              }}
            />
          </label>

          {mensagem && (
            <div className="cadastro-material-mensagem">
              {mensagem}
            </div>
          )}

          <button
            type="button"
            className="salvar-material-button"
            onClick={salvarMaterial}
          >
            <FaFloppyDisk />

            {cadastroManual
              ? 'Salvar material'
              : 'Salvar e continuar conferência'}
          </button>

          <button
            type="button"
            className="cancelar-material-button"
            onClick={onCancelar}
          >
            Cancelar
          </button>
        </section>
      </section>
    </main>
  );
}

export default CadastroMaterial;