package br.com.rpmont.conferencia.dtos;

import java.time.LocalDate;

public record ItemSolicitacaoTransferenciaFenoRacaoResponseDTO(

        Long id,

        Integer ordemAtendimento,

        Integer loteOrigemId,

        String codigoLoteOrigem,

        LocalDate dataEntrada,

        LocalDate validade,

        Integer saldoDisponivelPlanejamento,

        Integer quantidadePrevista,

        Integer quantidadeAprovada,

        Integer saldoAnterior,

        Integer saldoPosterior,

        Integer loteDestinoId,

        String codigoLoteDestino

) {
}