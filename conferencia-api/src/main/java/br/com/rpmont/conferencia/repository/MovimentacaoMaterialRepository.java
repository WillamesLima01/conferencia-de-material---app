package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.TipoMovimentacaoMaterial;
import br.com.rpmont.conferencia.model.MovimentacaoMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimentacaoMaterialRepository
        extends JpaRepository<MovimentacaoMaterial, Long> {

    List<MovimentacaoMaterial> findByMaterialIdOrderByDataMovimentacaoDesc(
            Long materialId
    );

    List<MovimentacaoMaterial> findByTipoMovimentacaoOrderByDataMovimentacaoDesc(
            TipoMovimentacaoMaterial tipoMovimentacao
    );

    List<MovimentacaoMaterial> findByUsuarioIdOrderByDataMovimentacaoDesc(
            Long usuarioId
    );
}