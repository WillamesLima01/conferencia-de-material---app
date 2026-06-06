import { useState } from 'react';
import {
  FaArrowLeft,
  FaBuilding,
  FaChevronRight,
  FaLayerGroup,
  FaUsersGear,
} from 'react-icons/fa6';
import '../styles/AdminPainel.css';
import AdminUnidades from './AdminUnidades';
import AdminSetores from './AdminSetores';
import AdminUsuarios from './AdminUsuarios';

function AdminPainel({ usuario, onVoltar }) {
  const [telaAtual, setTelaAtual] = useState('painel');

  const abrirModulo = (modulo) => {
    if (modulo === 'Usuários') {
      setTelaAtual('usuarios');
      return;
    }

    if (modulo === 'Unidades') {
      setTelaAtual('unidades');
      return;
    }

    if (modulo === 'Setores') {
      setTelaAtual('setores');
      return;
    }

    alert(`Módulo ${modulo} será criado na próxima etapa.`);
  };

  const voltarParaPainel = () => {
    setTelaAtual('painel');
  };

  if (telaAtual === 'unidades') {
    return (
      <AdminUnidades
        usuario={usuario}
        onVoltar={voltarParaPainel}
      />
    );
  }

  if (telaAtual === 'setores') {
    return (
      <AdminSetores
        usuario={usuario}
        onVoltar={voltarParaPainel}
      />
    );
  }

  if (telaAtual === 'usuarios') {
    return (
      <AdminUsuarios
        usuario={usuario}
        onVoltar={voltarParaPainel}
      />
    );
  }

  return (
    <main className="admin-painel-page">
      <section className="admin-painel-phone">
        <header className="admin-painel-header">
          <button type="button" className="admin-voltar-button" onClick={onVoltar}>
            <FaArrowLeft />
          </button>

          <div>
            <span>Área administrativa</span>
            <h1>Painel Administrativo</h1>
            <p>{usuario.unidade}</p>
          </div>
        </header>

        <section className="admin-boas-vindas">
          <span>Administrador</span>
          <h2>{usuario.nomeExibicao || usuario.nome}</h2>
          <p>
            Gerencie usuários, unidades e setores do sistema de conferência
            patrimonial.
          </p>
        </section>

        <section className="admin-modulos">
          <button
            type="button"
            className="admin-modulo-card"
            onClick={() => abrirModulo('Usuários')}
          >
            <div className="admin-modulo-icon vermelho">
              <FaUsersGear />
            </div>

            <div className="admin-modulo-texto">
              <h3>Usuários</h3>
              <p>Adicionar, editar e excluir usuários do sistema.</p>
            </div>

            <FaChevronRight className="admin-modulo-seta" />
          </button>

          <button
            type="button"
            className="admin-modulo-card"
            onClick={() => abrirModulo('Unidades')}
          >
            <div className="admin-modulo-icon amarelo">
              <FaBuilding />
            </div>

            <div className="admin-modulo-texto">
              <h3>Unidades</h3>
              <p>Adicionar, editar e excluir unidades administrativas.</p>
            </div>

            <FaChevronRight className="admin-modulo-seta" />
          </button>

          <button
            type="button"
            className="admin-modulo-card"
            onClick={() => abrirModulo('Setores')}
          >
            <div className="admin-modulo-icon preto">
              <FaLayerGroup />
            </div>

            <div className="admin-modulo-texto">
              <h3>Setores</h3>
              <p>Adicionar setores vinculados a uma unidade.</p>
            </div>

            <FaChevronRight className="admin-modulo-seta" />
          </button>
        </section>
      </section>
    </main>
  );
}

export default AdminPainel;