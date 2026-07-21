package br.com.rpmont.conferencia.model;

import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoMaterial;
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
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "`TB_movimentacao_material`")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovimentacaoMaterial implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "`ID`")
    private Long id;

    @Column(
            name = "`materialID`",
            nullable = false
    )
    private Long materialId;

    /*
     * Relacionamento utilizado somente para consultas.
     *
     * O campo materialId continua responsável pela
     * gravação da chave estrangeira.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "`materialID`",
            referencedColumnName = "`ID`",
            insertable = false,
            updatable = false
    )
    private MaterialPatrimonial material;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`tipoMovimentacao`",
            nullable = false,
            length = 40
    )
    private TipoMovimentacaoMaterial tipoMovimentacao;

    @Column(
            name = "`setorOrigem`",
            length = 50
    )
    private String setorOrigem;

    @Column(
            name = "`setorDestino`",
            length = 50
    )
    private String setorDestino;

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

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`situacaoAnterior`",
            length = 30
    )
    private SituacaoMaterial situacaoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "`situacaoNova`",
            length = 30
    )
    private SituacaoMaterial situacaoNova;

    @Column(
            name = "`motivo`",
            length = 300
    )
    private String motivo;

    @Column(
            name = "`observacao`",
            length = 500
    )
    private String observacao;

    @Column(
            name = "`numeroDocumento`",
            length = 150
    )
    private String numeroDocumento;

    @Column(
            name = "`usuarioID`",
            nullable = false
    )
    private Long usuarioId;

    /*
     * Relacionamento utilizado somente para consultas.
     *
     * O campo usuarioId continua responsável pela
     * gravação da chave estrangeira.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "`usuarioID`",
            referencedColumnName = "ID",
            insertable = false,
            updatable = false
    )
    private Usuario usuario;

    @CreationTimestamp
    @Column(
            name = "`dataMovimentacao`",
            nullable = false,
            updatable = false
    )
    private LocalDateTime dataMovimentacao;
}