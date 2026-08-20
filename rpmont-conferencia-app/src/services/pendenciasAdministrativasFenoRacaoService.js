import api from './api';

// ======================================================
// PENDÊNCIAS ADMINISTRATIVAS DE FENO E RAÇÃO
// ======================================================

export const consultarResumoPendenciasAdministrativas =
  async () => {
    return api(
      '/feno-racao/pendencias-administrativas/resumo'
    );
  };