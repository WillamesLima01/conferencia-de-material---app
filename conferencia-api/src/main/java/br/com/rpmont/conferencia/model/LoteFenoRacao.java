package br.com.rpmont.conferencia.model;

import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
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
@Table(name = "`TB_lote_feno_racao`")
public class LoteFenoRacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "`ID`")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "`produtoID`",
            nullable = false
    )
    private ProdutoFenoRacao produto;

    @Column(
            name = "`codigoLote`",
            length = 100
    )
    private String codigoLote;

    @Column(
            name = "`quantidadeInicial`",
            nullable = false
    )
    private Integer quantidadeInicial;

    @Column(
            name = "`quantidadeAtual`",
            nullable = false
    )
    private Integer quantidadeAtual;

    @Column(
            name = "`pesoTotalInicialKg`",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal pesoTotalInicialKg;

    @Column(
            name = "`pesoTotalAtualKg`",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal pesoTotalAtualKg;

    @Column(
            name = "`dataEntrada`",
            nullable = false
    )
    private LocalDate dataEntrada;

    @Column(name = "`validade`")
    private LocalDate validade;

    @Column(
            name = "`fornecedor`",
            length = 150
    )
    private String fornecedor;

    @Column(
            name = "`numeroDocumento`",
            length = 100
    )
    private String numeroDocumento;

    @Column(name = "`transferenciaOrigemID`")
    private Long transferenciaOrigemId;

    @Column(
            name = "`responsavelRecebimento`",
            nullable = false,
            length = 150
    )
    private String responsavelRecebimento;

    @Column(
            name = "`observacao`",
            length = 500
    )
    private String observacao;

    @Column(
            name = "`unidade`",
            nullable = false,
            length = 50
    )
    private String unidade;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`situacao`",
            nullable = false,
            length = 30
    )
    private SituacaoLoteFenoRacao situacao;

    @Column(
            name = "`usuarioCadastroID`",
            nullable = false
    )
    private Long usuarioCadastroId;

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