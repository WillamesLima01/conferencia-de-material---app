package br.com.rpmont.conferencia.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "`TB_setor`", uniqueConstraints = @UniqueConstraint(
                name = "uk_setor_unidade_nome",
                columnNames = {"unidadeID", "nome"})
)
public class Setor implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    @Column(name = "ID")
    private Long id;

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "`unidadeID`", nullable = false, foreignKey = @ForeignKey(name = "fk_setor_unidade"))
    private Unidade unidade;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @Column(name = "`dataCadastro`", nullable = false)
    private LocalDateTime dataCadastro;

    @Column(name = "`dataModificacao`")
    private LocalDateTime dataModificacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "`userID`", nullable = false, foreignKey = @ForeignKey(name = "fk_setor_usuario"))
    private Usuario usuarioCadastro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "`userModificador`", foreignKey = @ForeignKey(name = "fk_setor_usuario_modificador"))
    private Usuario usuarioModificador;
}