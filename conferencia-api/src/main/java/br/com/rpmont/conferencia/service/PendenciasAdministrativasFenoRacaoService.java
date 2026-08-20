package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.PendenciasAdministrativasFenoRacaoResponseDTO;

public interface PendenciasAdministrativasFenoRacaoService {

    PendenciasAdministrativasFenoRacaoResponseDTO consultarResumo(
            String matriculaUsuario
    );
}