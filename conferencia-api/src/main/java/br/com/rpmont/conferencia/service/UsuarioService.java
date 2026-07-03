package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.UsuarioNivelRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioResponseDTO;

import java.util.List;

public interface UsuarioService {

    UsuarioResponseDTO salvarUsuario(UsuarioRequestDTO usuarioRequestDTO);
    List<UsuarioResponseDTO> listarTodosUsuario();
    UsuarioResponseDTO buscarUsuarioPorId(Long id);
    UsuarioResponseDTO buscarUsuarioPorMatricula(String matricula);
    UsuarioResponseDTO atualizarUsuarioPorId(Long id, UsuarioRequestDTO usuarioRequestDTO);
    UsuarioResponseDTO alterarNivelUsuario(Long id, UsuarioNivelRequestDTO usuarioNivelRequestDTO);
    void deletarUsuarioId(Long id);
}
