package br.com.rpmont.conferencia.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios_sistema")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Usuario implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "MATRICULA", nullable = false, length = 100)
    private String matricula;

    @Column(name = "NOME", nullable = false, length = 100)
    private String nome;

    @Column(name = "SENHA", nullable = false, length = 100)
    private String senha;

    @Column(name = "EMAIL", nullable = false, length = 50)
    private String email;

    @Column(name = "NIVEL", nullable = false)
    private Integer nivel;

    @Column(name = "POSTGRAD", length = 100)
    private String postGrad;

    @Column(name = "SETOR", length = 50)
    private String setor;

    @Column(name = "NOMECOMPLETO", nullable = false, length = 200)
    private String nomeCompleto;

    @Column(name = "UNIDADE", length = 50)
    private String unidade;

    @Column(name = "STATUSACESSO", length = 20, nullable = false)
    private String statusAcesso;

    @Column(name = "ATIVO", nullable = false)
    private Integer ativo;

    @Column(name = "DATASOLICITACAO")
    private LocalDateTime dataSolicitacao;

    @Column(name = "DATALIBERACAO")
    private LocalDateTime dataLiberacao;

    @Column(name = "LIBERADOPOR")
    private Integer liberadoPor;

    @CreationTimestamp
    @Column(name = "DATACADASTRO", nullable = false, updatable = false)
    private LocalDate dataCadastro;

    @UpdateTimestamp
    @Column(name = "DATAMODIFICACAO", nullable = false)
    private LocalDateTime dataModificacao;

    @Column(name = "`userModificador`")
    private Integer userModificador;

    @PrePersist
    public void prePersist() {
        LocalDateTime agora = LocalDateTime.now();

        if (this.nivel == null) {
            this.nivel = 3;
        }

        if (this.statusAcesso == null || this.statusAcesso.isBlank()) {
            this.statusAcesso = "PENDENTE";
        }

        if (this.ativo == null) {
            this.ativo = 0;
        }

        if (this.dataSolicitacao == null) {
            this.dataSolicitacao = agora;
        }

        if (this.userModificador == null) {
            this.userModificador = 0;
        }
    }

}
