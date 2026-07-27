package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.ProdutoFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.ProdutoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;

import java.util.List;

public interface ProdutoFenoRacaoService {

    ProdutoFenoRacaoResponseDTO cadastrar(
            ProdutoFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    List<ProdutoFenoRacaoResponseDTO> listarAtivos(
            TipoProdutoFenoRacao tipoProduto,
            String matriculaUsuario
    );

    ProdutoFenoRacaoResponseDTO buscarPorId(
            Integer produtoId,
            String matriculaUsuario
    );

    ProdutoFenoRacaoResponseDTO atualizar(
            Integer produtoId,
            ProdutoFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    ProdutoFenoRacaoResponseDTO inativar(
            Integer produtoId,
            String matriculaUsuario
    );

    ProdutoFenoRacaoResponseDTO reativar(
            Integer produtoId,
            String matriculaUsuario
    );
}