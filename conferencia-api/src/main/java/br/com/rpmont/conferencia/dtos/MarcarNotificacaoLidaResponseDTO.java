package br.com.rpmont.conferencia.dtos;

import java.time.LocalDateTime;

public record MarcarNotificacaoLidaResponseDTO(

        Long notificacaoId,

        Boolean lida,

        LocalDateTime dataLeitura,

        Long usuarioLeituraId,

        String mensagem

) {
}