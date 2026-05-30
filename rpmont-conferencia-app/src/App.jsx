import { useState } from 'react';
import Login from './pages/Login';
import SelecionarConferencia from './pages/SelecionarConferencia';
import ConferenciaMateriais from './pages/ConferenciaMateriais';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [configuracaoConferencia, setConfiguracaoConferencia] = useState(null);

  if (!usuarioLogado) {
    return <Login onLoginSuccess={setUsuarioLogado} />;
  }

  if (!configuracaoConferencia) {
    return (
      <SelecionarConferencia
        usuario={usuarioLogado}
        onIniciarConferencia={setConfiguracaoConferencia}
      />
    );
  }

  return (
    <ConferenciaMateriais
      usuario={usuarioLogado}
      configuracao={configuracaoConferencia}
      onVoltar={() => setConfiguracaoConferencia(null)}
    />
  );
}

export default App;