package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.UnidadeRequestDTO;
import br.com.rpmont.conferencia.dtos.UnidadeResponseDTO;
import br.com.rpmont.conferencia.model.Usuario;

import java.util.List;

public interface UnidadeService {

    UnidadeResponseDTO cadastrar(
            UnidadeRequestDTO request,
            Usuario usuarioAutenticado
    );

    List<UnidadeResponseDTO> listarTodas(
            Usuario usuarioAutenticado
    );

    List<UnidadeResponseDTO> listarAtivas(
            Usuario usuarioAutenticado
    );

    UnidadeResponseDTO buscarPorId(
            Long id,
            Usuario usuarioAutenticado
    );

    UnidadeResponseDTO atualizar(
            Long id,
            UnidadeRequestDTO request,
            Usuario usuarioAutenticado
    );

    UnidadeResponseDTO inativar(
            Long id,
            Usuario usuarioAutenticado
    );

    UnidadeResponseDTO reativar(
            Long id,
            Usuario usuarioAutenticado
    );
}