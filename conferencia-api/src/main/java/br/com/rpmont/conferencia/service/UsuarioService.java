package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.UsuarioAdminRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioNivelRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioResponseDTO;
import br.com.rpmont.conferencia.dtos.UsuarioStatusRequestDTO;

import java.util.List;

public interface UsuarioService {

    UsuarioResponseDTO solicitarAcesso(UsuarioRequestDTO usuarioRequestDTO);

    UsuarioResponseDTO salvarUsuario(UsuarioAdminRequestDTO usuarioAdminRequestDTO);

    List<UsuarioResponseDTO> listarTodosUsuario();

    UsuarioResponseDTO buscarUsuarioPorId(Long id);

    UsuarioResponseDTO buscarUsuarioPorMatricula(String matricula);

    UsuarioResponseDTO atualizarUsuarioPorId(Long id, UsuarioAdminRequestDTO usuarioAdminRequestDTO);

    UsuarioResponseDTO alterarStatusUsuario(Long id, UsuarioStatusRequestDTO usuarioStatusRequestDTO);

    UsuarioResponseDTO alterarNivelUsuario(Long id, UsuarioNivelRequestDTO usuarioNivelRequestDTO);

    void deletarUsuarioId(Long id);
}