import { useEffect, useMemo, useState } from 'react';

import {
  FaArrowLeft,
  FaBarcode,
  FaBoxesStacked,
  FaCheck,
  FaEye,
  FaFilePdf,
  FaFilter,
  FaListUl,
  FaMagnifyingGlass,
  FaRotateLeft,
} from 'react-icons/fa6';

import {
  baixarMaterial,
  descartarMaterial,
  extraviarMaterial,
  listarHistoricoMaterial,
  reativarMaterial,
  registrarFurtoMaterial,
} from '../services/materialPatrimonialService';

import { listarSetoresAtivos } from '../services/setorService';
import { gerarRelatorioPatrimonioPdf } from '../relatorios/gerarRelatorioPatrimonioPdf';

import HistoricoMaterialModal from '../components/HistoricoMaterialModal';
import MaterialDetalhesModal from '../components/MaterialDetalhesModal';
import MateriaisFiltradosModal from '../components/MateriaisFiltradosModal';
import MovimentacaoMaterialModal from '../components/MovimentacaoMaterialModal';

import '../styles/ConsultaMateriais.css';

function ConsultaMateriais({
  usuario,
  materiais = [],
  onVoltar,
  onEditarMaterial,
  onMaterialAtualizado,
}) {
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [descricao, setDescricao] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [setor, setSetor] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [situacao, setSituacao] = useState('ATIVO');

  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [materialDetalhes, setMaterialDetalhes] =
    useState(null);

  const [
    modalMateriaisAberto,
    setModalMateriaisAberto,
  ] = useState(false);

  const [
    materialMovimentacao,
    setMaterialMovimentacao,
  ] = useState(null);

  const [
    tipoMovimentacao,
    setTipoMovimentacao,
  ] = useState(null);

  const [
    processandoMovimentacao,
    setProcessandoMovimentacao,
  ] = useState(false);

  const [
    erroMovimentacao,
    setErroMovimentacao,
  ] = useState('');

  const [
    sucessoMovimentacao,
    setSucessoMovimentacao,
  ] = useState('');

  const [
    materialHistorico,
    setMaterialHistorico,
  ] = useState(null);

  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] =
    useState(false);

  const [erroHistorico, setErroHistorico] =
    useState('');

  const [
    setoresCadastrados,
    setSetoresCadastrados,
  ] = useState([]);

  const [
    carregandoSetores,
    setCarregandoSetores,
  ] = useState(true);

  const [erroSetores, setErroSetores] = useState('');

  const normalizar = (valor) =>
    String(valor ?? '')
      .trim()
      .toLowerCase();

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

  useEffect(() => {
    let componenteAtivo = true;

    const carregarSetoresAtivos = async () => {
      try {
        const resposta =
          await listarSetoresAtivos();

        const lista = Array.isArray(resposta)
          ? resposta
          : Array.isArray(resposta?.data)
            ? resposta.data
            : [];

        if (componenteAtivo) {
          setSetoresCadastrados(lista);
          setErroSetores('');
        }
      } catch (erro) {
        if (componenteAtivo) {
          setErroSetores(
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

    carregarSetoresAtivos();

    return () => {
      componenteAtivo = false;
    };
  }, []);


  useEffect(() => {
    if (!sucessoMovimentacao) {
      return undefined;
    }

    const temporizador = window.setTimeout(() => {
      setSucessoMovimentacao('');
    }, 4000);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [sucessoMovimentacao]);

  const setoresDaUnidade = useMemo(() => {
    const unidadeUsuario =
      normalizar(usuario?.unidade);

    return setoresCadastrados
      .filter((item) => {
        const unidadeNome = normalizar(
          item?.unidadeNome ??
            item?.unidade?.nome ??
            ''
        );

        const unidadeSigla = normalizar(
          item?.unidadeSigla ??
            item?.unidade?.sigla ??
            ''
        );

        return (
          unidadeNome === unidadeUsuario ||
          unidadeSigla === unidadeUsuario
        );
      })
      .sort((a, b) =>
        String(a?.nome || '').localeCompare(
          String(b?.nome || ''),
          'pt-BR'
        )
      );
  }, [setoresCadastrados, usuario?.unidade]);

  const materiaisFiltrados = useMemo(() => {
    const filtroNome = normalizar(nome);
    const filtroMarca = normalizar(marca);
    const filtroDescricao =
      normalizar(descricao);
    const filtroNumeroSerie =
      normalizar(numeroSerie);

    return materiais
      .filter((material) => {
        const mesmaUnidade =
          normalizar(material?.unidade) ===
          normalizar(usuario?.unidade);

        const nomeConfere =
          !filtroNome ||
          normalizar(material?.nome).includes(
            filtroNome
          );

        const marcaConfere =
          !filtroMarca ||
          normalizar(material?.marca).includes(
            filtroMarca
          );

        const descricaoConfere =
          !filtroDescricao ||
          normalizar(
            material?.descricao
          ).includes(filtroDescricao);

        const serieConfere =
          !filtroNumeroSerie ||
          normalizar(
            obterNumeroSerie(material)
          ).includes(filtroNumeroSerie);

        const setorConfere =
          !setor ||
          normalizar(material?.setor) ===
            normalizar(setor);

        const conferido =
          materialEstaConferido(material);

        const statusConfere =
          status === 'TODOS' ||
          (status === 'CONFERIDO' &&
            conferido) ||
          (status === 'PENDENTE' &&
            !conferido);

        const situacaoConfere =
          situacao === 'TODOS' ||
          normalizar(material?.situacao) ===
            normalizar(situacao);

        return (
          mesmaUnidade &&
          nomeConfere &&
          marcaConfere &&
          descricaoConfere &&
          serieConfere &&
          setorConfere &&
          statusConfere &&
          situacaoConfere
        );
      })
      .sort((a, b) => {
        const setorA = String(
          a?.setor || ''
        );

        const setorB = String(
          b?.setor || ''
        );

        const comparacaoSetor =
          setorA.localeCompare(
            setorB,
            'pt-BR'
          );

        if (comparacaoSetor !== 0) {
          return comparacaoSetor;
        }

        return String(
          a?.nome ||
            a?.descricao ||
            obterNumeroSerie(a)
        ).localeCompare(
          String(
            b?.nome ||
              b?.descricao ||
              obterNumeroSerie(b)
          ),
          'pt-BR'
        );
      });
  }, [
    materiais,
    usuario?.unidade,
    nome,
    marca,
    descricao,
    numeroSerie,
    setor,
    status,
    situacao,
  ]);

  const total = materiaisFiltrados.length;

  const totalConferidos =
    materiaisFiltrados.filter(
      materialEstaConferido
    ).length;

  const totalPendentes =
    total - totalConferidos;

  const totalAtivos =
    materiaisFiltrados.filter(
      (material) =>
        normalizar(material?.situacao) ===
        'ativo'
    ).length;

  const totalInativos =
    materiaisFiltrados.filter(
      (material) =>
        normalizar(material?.situacao) ===
        'inativo'
    ).length;

  const resumoPorSetor = useMemo(() => {
    const resumo = {};

    materiaisFiltrados.forEach(
      (material) => {
        const nomeSetor =
          material?.setor ||
          'Não informado';

        if (!resumo[nomeSetor]) {
          resumo[nomeSetor] = 0;
        }

        resumo[nomeSetor] += 1;
      }
    );

    return Object.entries(resumo).sort(
      (a, b) =>
        a[0].localeCompare(
          b[0],
          'pt-BR'
        )
    );
  }, [materiaisFiltrados]);

  const filtrosAtuais = {
    nome,
    marca,
    descricao,
    numeroSerie,
    setor,
    status,
    situacao,
  };

  const limparFiltros = () => {
    setNome('');
    setMarca('');
    setDescricao('');
    setNumeroSerie('');
    setSetor('');
    setStatus('TODOS');
    setSituacao('ATIVO');
  };

  const gerarPDF = async () => {
    if (
      gerandoPdf ||
      materiaisFiltrados.length === 0
    ) {
      return;
    }

    try {
      setGerandoPdf(true);

      await gerarRelatorioPatrimonioPdf({
        usuario,
        filtros: {
          ...filtrosAtuais,
          nSerie: numeroSerie,
        },
        materiaisFiltrados,
        resumo: {
          total,
          totalConferidos,
          totalPendentes,
          totalAtivos,
          totalInativos,
        },
      });
    } catch (error) {
      console.error(
        'Erro ao gerar PDF:',
        error
      );

      window.alert(
        'Não foi possível gerar o PDF. Tente novamente.'
      );
    } finally {
      setGerandoPdf(false);
    }
  };

  const abrirDetalhesPeloModal = (
    material
  ) => {
    setModalMateriaisAberto(false);
    setMaterialDetalhes(material);
  };

  const fecharDetalhes = () => {
    setMaterialDetalhes(null);
  };

  const editarMaterial = (material) => {
    setMaterialDetalhes(null);

    if (
      typeof onEditarMaterial ===
      'function'
    ) {
      onEditarMaterial(material);
    }
  };

  const abrirMovimentacao = (
    material,
    tipo
  ) => {
    setMaterialDetalhes(null);
    setErroMovimentacao('');
    setSucessoMovimentacao('');
    setMaterialMovimentacao(material);
    setTipoMovimentacao(tipo);
  };

  const fecharMovimentacao = () => {
    if (processandoMovimentacao) {
      return;
    }

    setMaterialMovimentacao(null);
    setTipoMovimentacao(null);
    setErroMovimentacao('');
  };

  const confirmarMovimentacao = async (
    dados
  ) => {
    if (
      !materialMovimentacao ||
      !tipoMovimentacao ||
      processandoMovimentacao
    ) {
      return;
    }

    const idMaterial = obterId(
      materialMovimentacao
    );

    try {
      setProcessandoMovimentacao(true);
      setErroMovimentacao('');

      let materialAtualizado;

      switch (tipoMovimentacao) {
        case 'BAIXA':
          materialAtualizado =
            await baixarMaterial(
              idMaterial,
              dados
            );
          break;

        case 'DESCARTE':
          materialAtualizado =
            await descartarMaterial(
              idMaterial,
              dados
            );
          break;

        case 'EXTRAVIO':
          materialAtualizado =
            await extraviarMaterial(
              idMaterial,
              dados
            );
          break;

        case 'FURTO':
          materialAtualizado =
            await registrarFurtoMaterial(
              idMaterial,
              dados
            );
          break;

        case 'REATIVACAO':
          materialAtualizado =
            await reativarMaterial(
              idMaterial,
              dados
            );
          break;

        default:
          throw new Error(
            'Tipo de movimentação inválido.'
          );
      }

      if (
        typeof onMaterialAtualizado ===
        'function'
      ) {
        onMaterialAtualizado(
          materialAtualizado
        );
      }

      setMaterialMovimentacao(null);
      setTipoMovimentacao(null);
      setErroMovimentacao('');
      setSucessoMovimentacao(
        'Movimentação registrada com sucesso.'
      );
    } catch (erro) {
      setErroMovimentacao(
        erro?.message ||
          'Não foi possível registrar a movimentação.'
      );
    } finally {
      setProcessandoMovimentacao(false);
    }
  };

  const abrirHistorico = async (
    material
  ) => {
    const idMaterial = obterId(material);

    setMaterialDetalhes(null);
    setMaterialHistorico(material);
    setHistorico([]);
    setErroHistorico('');
    setCarregandoHistorico(true);

    try {
      const resposta =
        await listarHistoricoMaterial(
          idMaterial
        );

      const lista = Array.isArray(resposta)
        ? resposta
        : Array.isArray(resposta?.data)
          ? resposta.data
          : [];

      setHistorico(lista);
    } catch (erro) {
      setErroHistorico(
        erro?.message ||
          'Não foi possível carregar o histórico do material.'
      );
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const fecharHistorico = () => {
    if (carregandoHistorico) {
      return;
    }

    setMaterialHistorico(null);
    setHistorico([]);
    setErroHistorico('');
  };

  const obterClasseSituacaoCard = (
    material
  ) => {
    const situacaoMaterial =
      normalizar(material?.situacao);

    switch (situacaoMaterial) {
      case 'inativo':
        return 'consulta-material-inativo';

      case 'baixado':
        return 'consulta-material-baixado';

      case 'descartado':
        return 'consulta-material-descartado';

      case 'extraviado':
        return 'consulta-material-extraviado';

      case 'furtado':
        return 'consulta-material-furtado';

      case 'em_manutencao':
        return 'consulta-material-manutencao';

      default:
        return '';
    }
  };

  return (
    <main className="consulta-page">
      <section className="consulta-phone">
        <header className="consulta-header">
          <button
            type="button"
            className="consulta-voltar"
            onClick={onVoltar}
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span>
              Consulta patrimonial
            </span>

            <h1>Filtros avançados</h1>

            <p>
              Unidade:{' '}
              {usuario?.unidade ||
                'Não informada'}
            </p>
          </div>
        </header>

        {sucessoMovimentacao && (
          <div
            className="consulta-mensagem-sucesso consulta-mensagem-sucesso-flutuante"
            role="status"
            aria-live="polite"
          >
            <FaCheck />

            <span>
              {sucessoMovimentacao}
            </span>

            <button
              type="button"
              onClick={() =>
                setSucessoMovimentacao('')
              }
              aria-label="Fechar mensagem de sucesso"
            >
              ×
            </button>
          </div>
        )}

        <section className="consulta-resumo-grid">
          <div>
            <span>Total</span>
            <strong>{total}</strong>
          </div>

          <div>
            <span>Conferidos</span>
            <strong>
              {totalConferidos}
            </strong>
          </div>

          <div>
            <span>Pendentes</span>
            <strong>
              {totalPendentes}
            </strong>
          </div>

          <div>
            <span>Ativos</span>
            <strong>{totalAtivos}</strong>
          </div>

          <div>
            <span>Inativos</span>
            <strong>
              {totalInativos}
            </strong>
          </div>
        </section>

        <section className="consulta-filtros-card">
          <div className="consulta-card-titulo">
            <FaFilter />

            <div>
              <h2>Filtrar materiais</h2>

              <p>
                Busque por nome, marca,
                descrição, série, setor,
                status ou situação.
              </p>
            </div>
          </div>

          <label className="consulta-label">
            Nome

            <div className="consulta-input-icon">
              <FaMagnifyingGlass />

              <input
                type="text"
                value={nome}
                placeholder="Ex.: monitor, cadeira, armário"
                onChange={(event) =>
                  setNome(
                    event.target.value
                  )
                }
              />
            </div>
          </label>

          <label className="consulta-label">
            Marca

            <div className="consulta-input-icon">
              <FaMagnifyingGlass />

              <input
                type="text"
                value={marca}
                placeholder="Ex.: Lenovo, Dell, Antera"
                onChange={(event) =>
                  setMarca(
                    event.target.value
                  )
                }
              />
            </div>
          </label>

          <label className="consulta-label">
            Descrição

            <div className="consulta-input-icon">
              <FaMagnifyingGlass />

              <input
                type="text"
                value={descricao}
                placeholder="Ex.: computador, notebook, ar-condicionado"
                onChange={(event) =>
                  setDescricao(
                    event.target.value
                  )
                }
              />
            </div>
          </label>

          <label className="consulta-label">
            Nº Série / Código

            <div className="consulta-input-icon">
              <FaBarcode />

              <input
                type="text"
                value={numeroSerie}
                placeholder="Ex.: 00494550"
                onChange={(event) =>
                  setNumeroSerie(
                    event.target.value
                  )
                }
              />
            </div>
          </label>

          <div className="consulta-select-grid">
            <label className="consulta-label">
              Setor

              <select
                value={setor}
                disabled={
                  carregandoSetores
                }
                onChange={(event) =>
                  setSetor(
                    event.target.value
                  )
                }
              >
                <option value="">
                  {carregandoSetores
                    ? 'Carregando setores...'
                    : 'Todos'}
                </option>

                {setoresDaUnidade.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.nome}
                    >
                      {item.nome}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="consulta-label">
              Status

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
              >
                <option value="TODOS">
                  Todos
                </option>

                <option value="CONFERIDO">
                  Conferidos
                </option>

                <option value="PENDENTE">
                  Pendentes
                </option>
              </select>
            </label>
          </div>

          {erroSetores && (
            <div className="consulta-vazio">
              {erroSetores}
            </div>
          )}

          <label className="consulta-label">
            Situação

            <select
              value={situacao}
              onChange={(event) =>
                setSituacao(
                  event.target.value
                )
              }
            >
              <option value="ATIVO">
                Ativos
              </option>

              <option value="INATIVO">
                Inativos
              </option>

              <option value="BAIXADO">
                Baixados
              </option>

              <option value="DESCARTADO">
                Descartados
              </option>

              <option value="EXTRAVIADO">
                Extraviados
              </option>

              <option value="FURTADO">
                Furtados
              </option>

              <option value="EM_MANUTENCAO">
                Em manutenção
              </option>

              <option value="TODOS">
                Todos
              </option>
            </select>
          </label>

          <div className="consulta-acoes-filtros">
            <button
              type="button"
              className="limpar-filtros-button"
              onClick={limparFiltros}
            >
              <FaRotateLeft />
              Limpar filtros
            </button>

            <button
              type="button"
              className="consulta-ver-todos-button"
              onClick={() =>
                setModalMateriaisAberto(
                  true
                )
              }
              disabled={
                materiaisFiltrados.length ===
                0
              }
            >
              <FaListUl />
              Ver todos os materiais
              filtrados
            </button>

            <button
              type="button"
              className="gerar-pdf-button"
              onClick={gerarPDF}
              disabled={
                materiaisFiltrados.length ===
                  0 || gerandoPdf
              }
            >
              <FaFilePdf />

              {gerandoPdf
                ? 'Gerando...'
                : 'PDF'}
            </button>
          </div>
        </section>

        <section className="consulta-setores-card">
          <div className="consulta-lista-topo">
            <h2>Resumo por setor</h2>

            <span>
              {resumoPorSetor.length}{' '}
              setor(es)
            </span>
          </div>

          {resumoPorSetor.length >
          0 ? (
            <div className="consulta-setores-lista">
              {resumoPorSetor.map(
                ([
                  nomeSetor,
                  quantidade,
                ]) => (
                  <div
                    key={nomeSetor}
                    className="consulta-setor-item"
                  >
                    <span>
                      {nomeSetor}
                    </span>

                    <strong>
                      {quantidade}
                    </strong>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="consulta-vazio">
              Nenhum setor encontrado.
            </div>
          )}
        </section>

        <section className="consulta-resultados-card">
          <div className="consulta-lista-topo">
            <h2>
              Resultado da consulta
            </h2>

            <span>
              {total} item(ns)
            </span>
          </div>

          <div className="consulta-resultados-scroll">
            {materiaisFiltrados.map(
              (material) => {
                const conferido =
                  materialEstaConferido(
                    material
                  );

                const classeSituacao =
                  obterClasseSituacaoCard(
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
                    className={`consulta-material-card ${classeSituacao}`}
                  >
                    <div className="consulta-material-icon">
                      {conferido ? (
                        <FaCheck />
                      ) : (
                        <FaBoxesStacked />
                      )}
                    </div>

                    <div className="consulta-material-info">
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

                      <div className="consulta-material-tags">
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

                      <div className="consulta-material-acoes">
                        <button
                          type="button"
                          className="consulta-detalhes-button"
                          onClick={() =>
                            setMaterialDetalhes(
                              material
                            )
                          }
                        >
                          <FaEye />
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}

            {materiaisFiltrados.length ===
              0 && (
              <div className="consulta-vazio">
                Nenhum material encontrado
                para os filtros selecionados.
              </div>
            )}
          </div>
        </section>

        <MateriaisFiltradosModal
          aberto={
            modalMateriaisAberto
          }
          materiais={
            materiaisFiltrados
          }
          setorSelecionado={setor}
          gerandoPdf={gerandoPdf}
          onGerarPdf={gerarPDF}
          onFechar={() =>
            setModalMateriaisAberto(
              false
            )
          }
          onVerDetalhes={
            abrirDetalhesPeloModal
          }
        />

        <MaterialDetalhesModal
          aberto={Boolean(
            materialDetalhes
          )}
          material={materialDetalhes}
          onFechar={fecharDetalhes}
          onEditar={
            typeof onEditarMaterial ===
            'function'
              ? editarMaterial
              : undefined
          }
          onBaixar={(material) =>
            abrirMovimentacao(
              material,
              'BAIXA'
            )
          }
          onDescartar={(material) =>
            abrirMovimentacao(
              material,
              'DESCARTE'
            )
          }
          onExtraviar={(material) =>
            abrirMovimentacao(
              material,
              'EXTRAVIO'
            )
          }
          onRegistrarFurto={(
            material
          ) =>
            abrirMovimentacao(
              material,
              'FURTO'
            )
          }
          onReativar={(material) =>
            abrirMovimentacao(
              material,
              'REATIVACAO'
            )
          }
          onVerHistorico={
            abrirHistorico
          }
          podeEditar={
            typeof onEditarMaterial ===
            'function'
          }
          podeMovimentar
        />

        <MovimentacaoMaterialModal
          aberto={Boolean(
            materialMovimentacao &&
              tipoMovimentacao
          )}
          material={
            materialMovimentacao
          }
          tipo={tipoMovimentacao}
          processando={
            processandoMovimentacao
          }
          erro={erroMovimentacao}
          onFechar={
            fecharMovimentacao
          }
          onConfirmar={
            confirmarMovimentacao
          }
        />

        <HistoricoMaterialModal
          aberto={Boolean(
            materialHistorico
          )}
          material={materialHistorico}
          historico={historico}
          carregando={
            carregandoHistorico
          }
          erro={erroHistorico}
          onFechar={fecharHistorico}
        />
      </section>
    </main>
  );
}

export default ConsultaMateriais;