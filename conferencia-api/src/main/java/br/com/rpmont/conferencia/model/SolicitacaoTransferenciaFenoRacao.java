package br.com.rpmont.conferencia.model;

import br.com.rpmont.conferencia.enums.StatusSolicitacaoTransferenciaFenoRacao;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "`TB_solicitacao_transferencia_feno_racao`")
public class SolicitacaoTransferenciaFenoRacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "produtoID",
            nullable = false
    )
    private ProdutoFenoRacao produto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "loteSolicitadoID",
            nullable = false
    )
    private LoteFenoRacao loteSolicitado;

    @Column(
            name = "unidadeSolicitante",
            nullable = false,
            length = 50
    )
    private String unidadeSolicitante;

    @Column(
            name = "unidadeOrigem",
            nullable = false,
            length = 50
    )
    private String unidadeOrigem;

    @Column(
            name = "quantidadeSolicitada",
            nullable = false
    )
    private Integer quantidadeSolicitada;

    @Column(
            name = "pesoUnidadeKg",
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal pesoUnidadeKg;

    @Column(
            name = "pesoTotalSolicitadoKg",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal pesoTotalSolicitadoKg;

    @Column(
            name = "quantidadeDisponivelNoPedido",
            nullable = false
    )
    private Integer quantidadeDisponivelNoPedido;

    @Column(
            name = "saldoPrevistoOrigem",
            nullable = false
    )
    private Integer saldoPrevistoOrigem;

    @Column(
            name = "justificativa",
            nullable = false,
            length = 500
    )
    private String justificativa;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "status",
            nullable = false,
            length = 30
    )
    private StatusSolicitacaoTransferenciaFenoRacao status;

    @Column(
            name = "solicitadoPorID",
            nullable = false
    )
    private Integer solicitadoPorId;

    @Column(
            name = "dataSolicitacao",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private LocalDateTime dataSolicitacao;

    @Column(name = "respondidoPorID")
    private Integer respondidoPorId;

    @Column(name = "dataResposta")
    private LocalDateTime dataResposta;

    @Column(
            name = "observacaoResposta",
            length = 500
    )
    private String observacaoResposta;
}