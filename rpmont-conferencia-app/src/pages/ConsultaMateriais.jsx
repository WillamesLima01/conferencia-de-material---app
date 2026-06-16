import { useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBarcode,
  FaBoxesStacked,
  FaCheck,
  FaFilePdf,
  FaFilter,
  FaMagnifyingGlass,
  FaRotateLeft,
} from 'react-icons/fa6';

import { setoresDaUnidade } from '../data/setores';
import { gerarRelatorioPatrimonioPdf } from '../relatorios/gerarRelatorioPatrimonioPdf';

import '../styles/ConsultaMateriais.css';

function ConsultaMateriais({ usuario, materiais, onVoltar }) {
  const [descricao, setDescricao] = useState('');
  const [nSerie, setNSerie] = useState('');
  const [setor, setSetor] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [situacao, setSituacao] = useState('ATIVO');
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const materiaisFiltrados = useMemo(() => {
    return materiais.filter((material) => {
      const mesmaUnidade = material.unidade === usuario.unidade;

      const descricaoConfere = material.descricao
        ?.toLowerCase()
        .includes(descricao.toLowerCase().trim());

      const serieConfere = material.NSerie
        ?.toLowerCase()
        .includes(nSerie.toLowerCase().trim());

      const setorConfere = setor ? material.setor === setor : true;

      const statusConfere =
        status === 'TODOS'
          ? true
          : status === 'CONFERIDO'
            ? material.Conferido === 1
            : material.Conferido === 0;

      const situacaoConfere =
        situacao === 'TODOS' ? true : material.situacao === situacao;

      return (
        mesmaUnidade &&
        descricaoConfere &&
        serieConfere &&
        setorConfere &&
        statusConfere &&
        situacaoConfere
      );
    });
  }, [materiais, usuario.unidade, descricao, nSerie, setor, status, situacao]);

  const total = materiaisFiltrados.length;

  const totalConferidos = materiaisFiltrados.filter(
    (material) => material.Conferido === 1
  ).length;

  const totalPendentes = materiaisFiltrados.filter(
    (material) => material.Conferido === 0
  ).length;

  const totalAtivos = materiaisFiltrados.filter(
    (material) => material.situacao === 'ATIVO'
  ).length;

  const totalInativos = materiaisFiltrados.filter(
    (material) => material.situacao === 'INATIVO'
  ).length;

  const resumoPorSetor = useMemo(() => {
    const resumo = {};

    materiaisFiltrados.forEach((material) => {
      if (!resumo[material.setor]) {
        resumo[material.setor] = 0;
      }

      resumo[material.setor] += 1;
    });

    return Object.entries(resumo).sort((a, b) => a[0].localeCompare(b[0]));
  }, [materiaisFiltrados]);

  const limparFiltros = () => {
    setDescricao('');
    setNSerie('');
    setSetor('');
    setStatus('TODOS');
    setSituacao('ATIVO');
  };

  const gerarPDF = async () => {
    if (gerandoPdf || materiaisFiltrados.length === 0) return;

    try {
      setGerandoPdf(true);

      await gerarRelatorioPatrimonioPdf({
        usuario,
        filtros: {
          descricao,
          nSerie,
          setor,
          status,
          situacao,
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
      console.error('Erro ao gerar PDF:', error);
      window.alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <main className="consulta-page">
      <section className="consulta-phone">
        <header className="consulta-header">
          <button type="button" className="consulta-voltar" onClick={onVoltar}>
            <FaArrowLeft />
          </button>

          <div>
            <span>Consulta patrimonial</span>
            <h1>Filtros avançados</h1>
            <p>Unidade: {usuario.unidade}</p>
          </div>
        </header>

        <section className="consulta-resumo-grid">
          <div>
            <span>Total</span>
            <strong>{total}</strong>
          </div>

          <div>
            <span>Conferidos</span>
            <strong>{totalConferidos}</strong>
          </div>

          <div>
            <span>Pendentes</span>
            <strong>{totalPendentes}</strong>
          </div>

          <div>
            <span>Ativos</span>
            <strong>{totalAtivos}</strong>
          </div>

          <div>
            <span>Inativos</span>
            <strong>{totalInativos}</strong>
          </div>
        </section>

        <section className="consulta-filtros-card">
          <div className="consulta-card-titulo">
            <FaFilter />
            <div>
              <h2>Filtrar materiais</h2>
              <p>Busque por descrição, série, setor, status ou situação.</p>
            </div>
          </div>

          <label className="consulta-label">
            Descrição
            <div className="consulta-input-icon">
              <FaMagnifyingGlass />
              <input
                type="text"
                value={descricao}
                placeholder="Ex.: computador, notebook, ar-condicionado"
                onChange={(event) => setDescricao(event.target.value)}
              />
            </div>
          </label>

          <label className="consulta-label">
            Nº Série / Código
            <div className="consulta-input-icon">
              <FaBarcode />
              <input
                type="text"
                value={nSerie}
                placeholder="Ex.: 100005"
                onChange={(event) => setNSerie(event.target.value)}
              />
            </div>
          </label>

          <div className="consulta-select-grid">
            <label className="consulta-label">
              Setor
              <select
                value={setor}
                onChange={(event) => setSetor(event.target.value)}
              >
                <option value="">Todos</option>
                {setoresDaUnidade.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="consulta-label">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="CONFERIDO">Conferidos</option>
                <option value="PENDENTE">Pendentes</option>
              </select>
            </label>
          </div>

          <label className="consulta-label">
            Situação
            <select
              value={situacao}
              onChange={(event) => setSituacao(event.target.value)}
            >
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
              <option value="TODOS">Todos</option>
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
              className="gerar-pdf-button"
              onClick={gerarPDF}
              disabled={materiaisFiltrados.length === 0 || gerandoPdf}
            >
              <FaFilePdf />
              {gerandoPdf ? 'Gerando PDF...' : 'Gerar PDF'}
            </button>
          </div>
        </section>

        <section className="consulta-setores-card">
          <div className="consulta-lista-topo">
            <h2>Resumo por setor</h2>
            <span>{resumoPorSetor.length} setor(es)</span>
          </div>

          {resumoPorSetor.length > 0 ? (
            <div className="consulta-setores-lista">
              {resumoPorSetor.map(([nomeSetor, quantidade]) => (
                <div key={nomeSetor} className="consulta-setor-item">
                  <span>{nomeSetor}</span>
                  <strong>{quantidade}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="consulta-vazio">Nenhum setor encontrado.</div>
          )}
        </section>

        <section className="consulta-resultados-card">
          <div className="consulta-lista-topo">
            <h2>Resultado da consulta</h2>
            <span>{total} item(ns)</span>
          </div>

          <div className="consulta-resultados-scroll">
            {materiaisFiltrados.map((material) => (
              <article
                key={material.ID}
                className={`consulta-material-card ${
                  material.situacao === 'INATIVO'
                    ? 'consulta-material-inativo'
                    : ''
                }`}
              >
                <div className="consulta-material-icon">
                  {material.Conferido === 1 ? <FaCheck /> : <FaBoxesStacked />}
                </div>

                <div className="consulta-material-info">
                  <strong>{material.NSerie}</strong>
                  <h3>{material.descricao}</h3>
                  <p>{material.observacao}</p>

                  <div className="consulta-material-tags">
                    <span>{material.setor}</span>
                    <span>{material.situacao}</span>
                    <span>
                      {material.Conferido === 1 ? 'CONFERIDO' : 'PENDENTE'}
                    </span>
                  </div>
                </div>
              </article>
            ))}

            {materiaisFiltrados.length === 0 && (
              <div className="consulta-vazio">
                Nenhum material encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default ConsultaMateriais;