package br.com.rpmont.conferencia.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(
        name = "`TB_item_solicitacao_transferencia_feno_racao`"
)
public class ItemSolicitacaoTransferenciaFenoRacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "`ID`")
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "`solicitacaoID`",
            nullable = false
    )
    private SolicitacaoTransferenciaFenoRacao solicitacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "`transferenciaID`")
    private TransferenciaFenoRacao transferencia;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "`loteOrigemID`",
            nullable = false
    )
    private LoteFenoRacao loteOrigem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "`loteDestinoID`")
    private LoteFenoRacao loteDestino;

    @Column(
            name = "`saldoDisponivelPlanejamento`",
            nullable = false
    )
    private Integer saldoDisponivelPlanejamento;

    @Column(
            name = "`quantidadePrevista`",
            nullable = false
    )
    private Integer quantidadePrevista;

    @Column(name = "`quantidadeAprovada`")
    private Integer quantidadeAprovada;

    @Column(
            name = "`ordemAtendimento`",
            nullable = false
    )
    private Integer ordemAtendimento;

    @Column(name = "`saldoAnterior`")
    private Integer saldoAnterior;

    @Column(name = "`saldoPosterior`")
    private Integer saldoPosterior;

    @Column(
            name = "`usuarioCadastroID`",
            nullable = false
    )
    private Integer usuarioCadastroId;

    @Column(
            name = "`dataCadastro`",
            nullable = false,
            updatable = false
    )
    private LocalDateTime dataCadastro;
}