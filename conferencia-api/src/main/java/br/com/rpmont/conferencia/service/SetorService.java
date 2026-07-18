package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.SetorRequestDTO;
import br.com.rpmont.conferencia.dtos.SetorResponseDTO;
import br.com.rpmont.conferencia.model.Usuario;

import java.util.List;

public interface SetorService {

    SetorResponseDTO cadastrar(SetorRequestDTO request, Usuario usuarioAutenticado);

    List<SetorResponseDTO> listarTodos(Usuario usuarioAutenticado);

    List<SetorResponseDTO> listarAtivos(Usuario usuarioAutenticado);

    List<SetorResponseDTO> listarPorUnidade(Long unidadeId, Usuario usuarioAutenticado);

    List<SetorResponseDTO> listarAtivosPorUnidade(Long unidadeId, Usuario usuarioAutenticado);

    SetorResponseDTO buscarPorId(Long id, Usuario usuarioAutenticado);

    SetorResponseDTO atualizar(Long id, SetorRequestDTO request, Usuario usuarioAutenticado);

    SetorResponseDTO inativar(Long id, Usuario usuarioAutenticado);

    SetorResponseDTO reativar(Long id, Usuario usuarioAutenticado);
}