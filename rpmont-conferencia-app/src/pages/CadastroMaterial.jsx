import { useEffect, useMemo, useState } from 'react';

import {
  FaArrowLeft,
  FaBarcode,
  FaBuilding,
  FaFloppyDisk,
  FaLayerGroup,
  FaPenToSquare,
} from 'react-icons/fa6';

import {
  listarSetoresAtivos,
} from '../services/setorService';

import '../styles/CadastroMaterial.css';

const normalizarTexto = (valor) => {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/º/g, '')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
};

const normalizarLista = (resposta) => {
  if (Array.isArray(resposta)) {
    return resposta;
  }

  if (Array.isArray(resposta?.data)) {
    return resposta.data;
  }

  return [];
};

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

  const [setores, setSetores] = useState([]);
  const [setorSelecionadoId, setSetorSelecionadoId] = useState('');

  const [carregandoSetores, setCarregandoSetores] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const unidadeUsuario = useMemo(() => {
    return normalizarTexto(
      usuario?.unidade ??
        usuario?.UNIDADE ??
        ''
    );
  }, [usuario]);

  const setoresDaUnidade = useMemo(() => {
    return setores.filter((setor) => {
      const unidadeNome = normalizarTexto(
        setor?.unidadeNome ??
          setor?.unidade?.nome ??
          ''
      );

      const unidadeSigla = normalizarTexto(
        setor?.unidadeSigla ??
          setor?.unidade?.sigla ??
          ''
      );

      return (
        unidadeNome === unidadeUsuario ||
        unidadeSigla === unidadeUsuario
      );
    });
  }, [setores, unidadeUsuario]);

  const setorSelecionado = useMemo(() => {
    return setoresDaUnidade.find(
      (setor) =>
        String(setor.id) === String(setorSelecionadoId)
    );
  }, [setoresDaUnidade, setorSelecionadoId]);

  const setorConfiguracao = useMemo(() => {
    return String(
      configuracao?.setor?.nome ??
        configuracao?.setor ??
        ''
    ).trim();
  }, [configuracao]);

  const nomeSetorCadastro = cadastroManual
    ? setorSelecionado?.nome || ''
    : configuracao?.tipo === 'SETOR'
      ? setorConfiguracao
      : String(
          usuario?.setor ??
            usuario?.SETOR ??
            ''
        ).trim();

  useEffect(() => {
    let componenteAtivo = true;

    const carregarSetores = async () => {
      try {
        const resposta = await listarSetoresAtivos();
        const lista = normalizarLista(resposta);

        if (!componenteAtivo) {
          return;
        }

        setSetores(lista);

        if (cadastroManual) {
          const unidadeAtual = normalizarTexto(
            usuario?.unidade ??
              usuario?.UNIDADE ??
              ''
          );

          const setorUsuario = normalizarTexto(
            usuario?.setor ??
              usuario?.SETOR ??
              ''
          );

          const setoresPermitidos = lista.filter((setor) => {
            const unidadeNome = normalizarTexto(
              setor?.unidadeNome ??
                setor?.unidade?.nome ??
                ''
            );

            const unidadeSigla = normalizarTexto(
              setor?.unidadeSigla ??
                setor?.unidade?.sigla ??
                ''
            );

            return (
              unidadeNome === unidadeAtual ||
              unidadeSigla === unidadeAtual
            );
          });

          const setorCorrespondente = setoresPermitidos.find(
            (setor) =>
              normalizarTexto(setor?.nome) === setorUsuario
          );

          if (setorCorrespondente) {
            setSetorSelecionadoId(
              String(setorCorrespondente.id)
            );
          }
        }
      } catch (erro) {
        if (componenteAtivo) {
          setMensagem(
            erro?.message ||
              'Não foi possível carregar os setores cadastrados.'
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoSetores(false);
        }
      }
    };

    carregarSetores();

    return () => {
      componenteAtivo = false;
    };
  }, [cadastroManual, usuario]);

  const limparMensagem = () => {
    if (mensagem) {
      setMensagem('');
    }
  };

  const salvarMaterial = async () => {
    const numeroSerieTratado = nSerie.trim();
    const nomeTratado = nome.trim();
    const marcaTratada = marca.trim();
    const descricaoTratada = descricao.trim();
    const observacaoTratada = observacao.trim();

    if (!numeroSerieTratado) {
      setMensagem(
        'Informe o Nº Série / código do material.'
      );
      return;
    }

    if (!descricaoTratada) {
      setMensagem(
        'Informe a descrição do material.'
      );
      return;
    }

    if (!nomeSetorCadastro) {
      setMensagem(
        'Selecione o setor do material.'
      );
      return;
    }

    if (typeof onSalvar !== 'function') {
      setMensagem(
        'A função de salvar material não foi configurada.'
      );
      return;
    }

    const novoMaterial = {
      numeroSerie: numeroSerieTratado,
      nome: nomeTratado || null,
      marca: marcaTratada || null,
      descricao: descricaoTratada,
      observacao: observacaoTratada || null,
      setor: nomeSetorCadastro,
      conferido: !cadastroManual,
    };

    try {
      setSalvando(true);
      setMensagem('');

      await onSalvar(novoMaterial);
    } catch (erro) {
      setMensagem(
        erro?.message ||
          'Não foi possível salvar o material.'
      );
    } finally {
      setSalvando(false);
    }
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
            disabled={salvando}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>
              {cadastroManual
                ? 'Cadastro manual'
                : 'Cadastro rápido'}
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

            <strong>
              {usuario?.unidade ||
                usuario?.UNIDADE ||
                'Não informada'}
            </strong>
          </div>

          <div className="cadastro-info-card">
            <FaLayerGroup />

            <span>Setor</span>

            <strong>
              {nomeSetorCadastro || 'Selecione'}
            </strong>
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
                disabled={!cadastroManual || salvando}
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
                value={setorSelecionadoId}
                disabled={carregandoSetores || salvando}
                onChange={(event) => {
                  setSetorSelecionadoId(
                    event.target.value
                  );
                  limparMensagem();
                }}
              >
                <option value="">
                  {carregandoSetores
                    ? 'Carregando setores...'
                    : 'Selecione o setor'}
                </option>

                {setoresDaUnidade.map((setor) => (
                  <option
                    key={setor.id}
                    value={setor.id}
                  >
                    {setor.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          {cadastroManual &&
            !carregandoSetores &&
            setoresDaUnidade.length === 0 && (
              <div className="cadastro-material-mensagem">
                Nenhum setor ativo foi encontrado para a
                unidade{' '}
                {usuario?.unidade ||
                  usuario?.UNIDADE}.
              </div>
            )}

          <label className="cadastro-material-label">
            Nome do material

            <input
              type="text"
              value={nome}
              maxLength={100}
              disabled={salvando}
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
              disabled={salvando}
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
              disabled={salvando}
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
              disabled={salvando}
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
            disabled={
              salvando ||
              (cadastroManual &&
                (carregandoSetores ||
                  setoresDaUnidade.length === 0))
            }
          >
            <FaFloppyDisk />

            {salvando
              ? 'Salvando...'
              : cadastroManual
                ? 'Salvar material'
                : 'Salvar e continuar conferência'}
          </button>

          <button
            type="button"
            className="cancelar-material-button"
            onClick={onCancelar}
            disabled={salvando}
          >
            Cancelar
          </button>
        </section>
      </section>
    </main>
  );
}

export default CadastroMaterial;