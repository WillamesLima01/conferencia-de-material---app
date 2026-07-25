package br.com.rpmont.conferencia.model;

import br.com.rpmont.conferencia.enums.TipoNotificacaoFenoRacao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "`TB_notificacao_feno_racao`")
public class NotificacaoFenoRacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(
            name = "unidadeDestino",
            nullable = false,
            length = 50
    )
    private String unidadeDestino;

    @Column(
            name = "titulo",
            nullable = false,
            length = 150
    )
    private String titulo;

    @Column(
            name = "mensagem",
            nullable = false,
            length = 500
    )
    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "tipo",
            nullable = false,
            length = 50
    )
    private TipoNotificacaoFenoRacao tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitacaoID")
    private SolicitacaoTransferenciaFenoRacao solicitacao;

    @Column(
            name = "lida",
            nullable = false
    )
    private Boolean lida;

    @Column(
            name = "dataCriacao",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private LocalDateTime dataCriacao;

    @Column(name = "dataLeitura")
    private LocalDateTime dataLeitura;

    @Column(name = "usuarioLeituraID")
    private Integer usuarioLeituraId;
}