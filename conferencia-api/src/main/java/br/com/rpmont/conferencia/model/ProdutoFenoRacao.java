package br.com.rpmont.conferencia.model;

import br.com.rpmont.conferencia.enums.SituacaoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
@Table(
        name = "`TB_produto_feno_racao`",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_produto_feno_racao_tipo_peso",
                        columnNames = {
                                "`tipoProduto`",
                                "`pesoUnidadeKg`"
                        }
                )
        }
)
public class ProdutoFenoRacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "`ID`")
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`tipoProduto`",
            nullable = false,
            length = 30
    )
    private TipoProdutoFenoRacao tipoProduto;

    @Column(
            name = "`nomeProduto`",
            nullable = false,
            length = 100
    )
    private String nomeProduto;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`unidadeControle`",
            nullable = false,
            length = 20
    )
    private UnidadeControleFenoRacao unidadeControle;

    @Column(
            name = "`pesoUnidadeKg`",
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal pesoUnidadeKg;

    @Column(
            name = "`descricao`",
            length = 300
    )
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`situacao`",
            nullable = false,
            length = 20
    )
    private SituacaoProdutoFenoRacao situacao;

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