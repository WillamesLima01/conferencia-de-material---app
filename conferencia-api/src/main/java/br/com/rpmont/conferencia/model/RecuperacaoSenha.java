package br.com.rpmont.conferencia.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "recuperacao_senha")
@Entity
public class RecuperacaoSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "codigo_hash", nullable = false, length = 100)
    private String codigoHash;

    @Column(name = "data_expiracao", nullable = false)
    private LocalDateTime dataExpiracao;

    @Column(name = "utilizado", nullable = false)
    private Boolean utilizado;

    @Column(name = "tentativas", nullable = false)
    private Integer tentativas;

    @Column(name = "data_criacao", nullable = false)
    private LocalDateTime dataCriacao;

}
