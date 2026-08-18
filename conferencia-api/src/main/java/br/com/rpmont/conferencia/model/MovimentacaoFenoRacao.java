package br.com.rpmont.conferencia.model;

import br.com.rpmont.conferencia.enums.SituacaoAnaliseExtravioFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "`TB_movimentacao_feno_racao`")
public class MovimentacaoFenoRacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "`ID`")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "`produtoID`",
            nullable = false
    )
    private ProdutoFenoRacao produto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "`loteID`",
            nullable = false
    )
    private LoteFenoRacao lote;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`tipoMovimentacao`",
            nullable = false,
            length = 40
    )
    private TipoMovimentacaoFenoRacao tipoMovimentacao;

    @Column(
            name = "`quantidadeUnidades`",
            nullable = false
    )
    private Integer quantidadeUnidades;

    @Column(
            name = "`pesoUnidadeKg`",
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal pesoUnidadeKg;

    @Column(
            name = "`quantidadeSolicitadaKg`",
            precision = 14,
            scale = 2
    )
    private BigDecimal quantidadeSolicitadaKg;

    @Column(
            name = "`pesoMovimentadoKg`",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal pesoMovimentadoKg;

    @Column(
            name = "`sobraCalculadaKg`",
            precision = 14,
            scale = 2
    )
    private BigDecimal sobraCalculadaKg;

    @Column(
            name = "`saldoAnterior`",
            nullable = false
    )
    private Integer saldoAnterior;

    @Column(
            name = "`saldoPosterior`",
            nullable = false
    )
    private Integer saldoPosterior;

    @Column(
            name = "`unidadeOrigem`",
            length = 50
    )
    private String unidadeOrigem;

    @Column(
            name = "`unidadeDestino`",
            length = 50
    )
    private String unidadeDestino;

    @Column(
            name = "`dataOperacao`",
            nullable = false
    )
    private LocalDate dataOperacao;

    @Column(
            name = "`servico`",
            length = 150
    )
    private String servico;

    @Column(
            name = "`motivo`",
            length = 250
    )
    private String motivo;

    @Column(
            name = "`observacao`",
            length = 500
    )
    private String observacao;

    @Column(
            name = "`numeroDocumento`",
            length = 100
    )
    private String numeroDocumento;

    @Column(
            name = "`responsavel`",
            length = 150
    )
    private String responsavel;

    @Column(
            name = "`usuarioID`",
            nullable = false
    )
    private Long usuarioId;

    @Column(
            name = "`usuarioSetor`",
            length = 100
    )
    private String usuarioSetor;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`situacao`",
            nullable = false,
            length = 20
    )
    private SituacaoMovimentacaoFenoRacao situacao;

    /*
     * ==========================================
     * ANÁLISE ADMINISTRATIVA DO EXTRAVIO
     * ==========================================
     */

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`situacaoAnaliseExtravio`",
            length = 30
    )
    private SituacaoAnaliseExtravioFenoRacao situacaoAnaliseExtravio;

    @Column(
            name = "`quantidadeConfirmada`"
    )
    private Integer quantidadeConfirmada;

    @Column(
            name = "`quantidadeDevolvida`"
    )
    private Integer quantidadeDevolvida;

    @Column(
            name = "`usuarioAnaliseID`"
    )
    private Long usuarioAnaliseId;

    @Column(
            name = "`dataAnalise`"
    )
    private LocalDateTime dataAnalise;

    @Column(
            name = "`motivoAnalise`",
            length = 500
    )
    private String motivoAnalise;

    /*
     * ==========================================
     * VÍNCULOS ENTRE MOVIMENTAÇÕES
     * ==========================================
     */

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "`movimentacaoOrigemID`")
    private MovimentacaoFenoRacao movimentacaoOrigem;

    @Column(name = "`transferenciaID`")
    private Long transferenciaId;

    /*
     * ==========================================
     * AUDITORIA
     * ==========================================
     */

    @Column(
            name = "`dataCadastro`",
            nullable = false,
            updatable = false
    )
    private LocalDateTime dataCadastro;

    @Column(name = "`usuarioModificadorID`")
    private Long usuarioModificadorId;

    @Column(name = "`dataModificacao`")
    private LocalDateTime dataModificacao;
}