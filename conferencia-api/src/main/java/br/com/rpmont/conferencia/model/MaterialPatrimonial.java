package br.com.rpmont.conferencia.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "`TB_inventario_MP`")
public class MaterialPatrimonial implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "`ID`")
    private Long id;

    @Column(name = "`NSerie`", nullable = false, length = 100)
    private String numeroSerie;

    @Column(name = "nome", length = 100)
    private String nome;

    @Column(name = "marca", length = 100)
    private String marca;

    @Column(name = "`descricao`", nullable = false, length = 300)
    private String descricao;

    @Column(name = "`observacao`", nullable = false, length = 500)
    private String observacao;

    @Column(name = "`setor`", nullable = false, length = 50)
    private String setor;

    @Column(name = "`unidade`", nullable = false, length = 50)
    private String unidade;

    @Column(name = "`dataCadastro`", nullable = false)
    private LocalDate dataCadastro;

    @Column(name = "`userID`", nullable = false)
    private Long usuarioId;

    @Column(name = "`dataModificacao`", nullable = false)
    private LocalDateTime dataModificacao;

    @Column(name = "`userModificador`", nullable = false)
    private Long usuarioModificadorId;

    @Column(name = "`Conferido`", nullable = false)
    private Boolean conferido;

    @Column(name = "`situacao`", nullable = false, length = 30)
    private String situacao;
}