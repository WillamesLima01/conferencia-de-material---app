package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.UsuarioRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioResponseDTO;
import br.com.rpmont.conferencia.dtos.UsuarioStatusRequestDTO;

import java.util.List;

public interface UsuarioService {

    UsuarioResponseDTO solicitarAcesso(UsuarioRequestDTO usuarioRequestDTO);

    UsuarioResponseDTO salvarUsuario(UsuarioRequestDTO usuarioRequestDTO);

    List<UsuarioResponseDTO> listarTodosUsuario();

    UsuarioResponseDTO buscarUsuarioPorId(Long id);

    UsuarioResponseDTO buscarUsuarioPorMatricula(String matricula);

    UsuarioResponseDTO atualizarUsuarioPorId(Long id, UsuarioRequestDTO usuarioRequestDTO);

    UsuarioResponseDTO alterarStatusUsuario(Long id, UsuarioStatusRequestDTO usuarioStatusRequestDTO);

    void deletarUsuarioId(Long id);
}