package br.com.rpmont.conferencia.dtos;

import java.time.LocalDate;

public record ItemTransferenciaFenoRacaoResponseDTO(

        Long id,

        Integer ordemAtendimento,

        Integer loteOrigemId,

        String codigoLoteOrigem,

        LocalDate dataEntradaOrigem,

        LocalDate validadeOrigem,

        Integer loteDestinoId,

        String codigoLoteDestino,

        Integer quantidadePrevista,

        Integer quantidadeAprovada,

        Integer saldoAnteriorOrigem,

        Integer saldoPosteriorOrigem

) {
}