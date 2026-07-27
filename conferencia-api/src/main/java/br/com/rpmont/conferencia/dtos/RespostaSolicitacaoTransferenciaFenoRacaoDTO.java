package br.com.rpmont.conferencia.dtos;

public record RespostaSolicitacaoTransferenciaFenoRacaoDTO(

        SolicitacaoTransferenciaFenoRacaoResponseDTO solicitacao,

        TransferenciaFenoRacaoResponseDTO transferencia,

        String mensagem

) {
}