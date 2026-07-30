package br.com.rpmont.conferencia.model;

import br.com.rpmont.conferencia.enums.SituacaoTransferenciaFenoRacao;
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
import jakarta.persistence.OneToOne;
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
@Table(name = "`TB_transferencia_feno_racao`")
public class TransferenciaFenoRacao {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    @Column(name = "`ID`")
    private Long id;

    @OneToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "`solicitacaoID`",
            nullable = false,
            unique = true
    )
    private SolicitacaoTransferenciaFenoRacao solicitacao;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "`produtoID`",
            nullable = false
    )
    private ProdutoFenoRacao produto;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "`loteOrigemID`",
            nullable = false
    )
    private LoteFenoRacao loteOrigem;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "`loteDestinoID`",
            nullable = false
    )
    private LoteFenoRacao loteDestino;

    @Column(
            name = "`unidadeOrigem`",
            nullable = false,
            length = 50
    )
    private String unidadeOrigem;

    @Column(
            name = "`unidadeDestino`",
            nullable = false,
            length = 50
    )
    private String unidadeDestino;

    @Column(
            name = "`quantidadeTransferida`",
            nullable = false
    )
    private Integer quantidadeTransferida;

    @Column(
            name = "`pesoUnidadeKg`",
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal pesoUnidadeKg;

    @Column(
            name = "`pesoTotalKg`",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal pesoTotalKg;

    @Column(
            name = "`saldoAnteriorOrigem`",
            nullable = false
    )
    private Integer saldoAnteriorOrigem;

    @Column(
            name = "`saldoPosteriorOrigem`",
            nullable = false
    )
    private Integer saldoPosteriorOrigem;

    @Column(
            name = "`aprovadoPorID`",
            nullable = false
    )
    private Long aprovadoPorId;

    @Column(
            name = "`dataTransferencia`",
            nullable = false
    )
    private LocalDateTime dataTransferencia;

    @Column(
            name = "`observacao`",
            length = 500
    )
    private String observacao;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`situacao`",
            nullable = false,
            length = 30
    )
    private SituacaoTransferenciaFenoRacao situacao;
}