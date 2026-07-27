package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.TipoNotificacaoFenoRacao;

import java.time.LocalDateTime;

public record NotificacaoFenoRacaoResponseDTO(

        Long id,

        String unidadeDestino,

        String titulo,

        String mensagem,

        TipoNotificacaoFenoRacao tipo,

        Long solicitacaoId,

        Boolean lida,

        LocalDateTime dataCriacao,

        LocalDateTime dataLeitura,

        Long usuarioLeituraId

) {
}