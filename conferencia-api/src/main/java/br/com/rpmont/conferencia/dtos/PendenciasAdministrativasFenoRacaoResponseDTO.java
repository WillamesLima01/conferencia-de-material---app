package br.com.rpmont.conferencia.dtos;

public record PendenciasAdministrativasFenoRacaoResponseDTO(
        long extraviosPendentes,
        long transferenciasPendentes,
        long totalPendencias,
        boolean possuiPendencias
) {
}