package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialFiltroDTO;
import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.model.MaterialPatrimonial;
import br.com.rpmont.conferencia.model.Usuario;

import java.util.List;

public interface MovimentacaoMaterialService {

    void registrarTransferenciaSetor(
            MaterialPatrimonial material,
            String setorOrigem,
            String setorDestino,
            Usuario usuarioResponsavel
    );

    void registrarBaixa(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    );

    void registrarDescarte(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    );

    void registrarExtravio(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    );

    void registrarFurto(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    );

    void registrarReativacao(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    );

    List<MovimentacaoMaterialResponseDTO> listarHistoricoPorMaterial(
            Long materialId,
            String matriculaUsuario
    );

    List<MovimentacaoMaterialResponseDTO> listarMovimentacoes(
            MovimentacaoMaterialFiltroDTO filtro,
            String matriculaUsuario
    );
}