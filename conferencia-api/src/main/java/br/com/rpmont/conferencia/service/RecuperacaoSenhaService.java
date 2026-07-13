package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.RedefinirSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitarRecuperacaoSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.ValidarCodigoRecuperacaoRequestDTO;

public interface RecuperacaoSenhaService {

    void solicitarRecuperacao(SolicitarRecuperacaoSenhaRequestDTO request);

    void validarCodigo(ValidarCodigoRecuperacaoRequestDTO request);

    void redefinirSenha(RedefinirSenhaRequestDTO request);

}
