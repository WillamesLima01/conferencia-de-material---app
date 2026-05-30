import { useState } from 'react';
import {
  FaBoxesStacked,
  FaBuildingUser,
  FaChevronRight,
  FaCheck,
  FaArrowLeft,
} from 'react-icons/fa6';
import { setoresRPMont } from '../data/setores';
import '../styles/SelecionarConferencia.css';

function SelecionarConferencia({ usuario, onIniciarConferencia }) {
  const [modoConferencia, setModoConferencia] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('');

  const selecionarTodosMateriais = () => {
    setModoConferencia('TODOS');
    setSetorSelecionado('');
  };

  const abrirSelecaoSetor = () => {
    setModoConferencia('SETOR');
    setSetorSelecionado('');
  };

  const continuarConferencia = () => {
    if (modoConferencia === 'TODOS') {
      onIniciarConferencia({
        tipo: 'TODOS',
        setor: null,
      });
      return;
    }

    if (modoConferencia === 'SETOR' && setorSelecionado) {
      onIniciarConferencia({
        tipo: 'SETOR',
        setor: setorSelecionado,
      });
      return;
    }
  };

  return (
    <main className="selecao-page">
      <section className="selecao-phone">
        <header className="selecao-header">
          <div>
            <span>Conferência Patrimonial</span>
            <h1>Selecionar Conferência</h1>
          </div>

          <div className="usuario-chip">
            {usuario.postGrad?.toUpperCase()} {usuario.nome}
          </div>
        </header>

        <section className="usuario-card">
          <p>Seja bem-vindo,</p>
          <h2>{usuario.nomeExibicao}</h2>

          <div className="usuario-info-grid">
            <div>
              <span>Unidade</span>
              <strong>{usuario.unidade}</strong>
            </div>

            <div>
              <span>Setor</span>
              <strong>{usuario.setor}</strong>
            </div>
          </div>
        </section>

        <section className="resumo-card">
          <span>Próximo passo</span>
          <h3>Escolha o tipo de conferência</h3>
          <p>
            O sistema carregará somente os materiais vinculados à unidade{' '}
            <strong>{usuario.unidade}</strong>.
          </p>
        </section>

        {modoConferencia !== 'SETOR' && (
          <section className="opcoes-conferencia">
            <button
              type="button"
              className={`opcao-card ${
                modoConferencia === 'TODOS' ? 'opcao-card-ativa' : ''
              }`}
              onClick={selecionarTodosMateriais}
            >
              <div className="opcao-icon vermelho">
                <FaBoxesStacked />
              </div>

              <div className="opcao-texto">
                <h3>Todos os materiais</h3>
                <p>Conferir todos os materiais da unidade {usuario.unidade}.</p>
              </div>

              {modoConferencia === 'TODOS' ? (
                <FaCheck className="opcao-check" />
              ) : (
                <FaChevronRight className="opcao-seta" />
              )}
            </button>

            <button
              type="button"
              className="opcao-card"
              onClick={abrirSelecaoSetor}
            >
              <div className="opcao-icon amarelo">
                <FaBuildingUser />
              </div>

              <div className="opcao-texto">
                <h3>Por setor</h3>
                <p>Selecionar um setor específico para realizar a conferência.</p>
              </div>

              <FaChevronRight className="opcao-seta" />
            </button>
          </section>
        )}

        {modoConferencia === 'SETOR' && (
          <section className="setores-area">
            <div className="setores-topo">
              <button
                type="button"
                className="voltar-setores"
                onClick={() => {
                  setModoConferencia('');
                  setSetorSelecionado('');
                }}
              >
                <FaArrowLeft />
              </button>

              <div>
                <span>Conferência por setor</span>
                <h3>Selecione o setor</h3>
              </div>
            </div>

            <div className="setores-lista">
              {setoresRPMont.map((setor) => (
                <button
                  key={setor}
                  type="button"
                  className={`setor-item ${
                    setorSelecionado === setor ? 'setor-item-ativo' : ''
                  }`}
                  onClick={() => setSetorSelecionado(setor)}
                >
                  <span>{setor}</span>
                  {setorSelecionado === setor && <FaCheck />}
                </button>
              ))}
            </div>
          </section>
        )}

        {(modoConferencia === 'TODOS' ||
          (modoConferencia === 'SETOR' && setorSelecionado)) && (
          <button
            type="button"
            className="continuar-conferencia-button"
            onClick={continuarConferencia}
          >
            {modoConferencia === 'TODOS'
              ? 'Continuar com todos os materiais'
              : `Continuar com ${setorSelecionado}`}
          </button>
        )}
      </section>
    </main>
  );
}

export default SelecionarConferencia;