package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.BaixarMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.DescartarMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.ExtraviarMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.MaterialPatrimonialRequestDTO;
import br.com.rpmont.conferencia.dtos.MaterialPatrimonialResponseDTO;
import br.com.rpmont.conferencia.dtos.ReativarMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.RegistrarFurtoMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.TransferirConferirMaterialRequestDTO;

import java.util.List;

public interface MaterialPatrimonialService {

    MaterialPatrimonialResponseDTO cadastrar(
            MaterialPatrimonialRequestDTO request,
            String matriculaUsuario
    );

    List<MaterialPatrimonialResponseDTO> listar(
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO buscarPorId(
            Long id,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO buscarPorNumeroSerie(
            String numeroSerie,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO atualizar(
            Long id,
            MaterialPatrimonialRequestDTO request,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO conferir(
            Long id,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO transferirEConferir(
            Long id,
            TransferirConferirMaterialRequestDTO request,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO baixar(
            Long id,
            BaixarMaterialRequestDTO request,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO descartar(
            Long id,
            DescartarMaterialRequestDTO request,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO extraviar(
            Long id,
            ExtraviarMaterialRequestDTO request,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO registrarFurto(
            Long id,
            RegistrarFurtoMaterialRequestDTO request,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO reativar(
            Long id,
            ReativarMaterialRequestDTO request,
            String matriculaUsuario
    );

    MaterialPatrimonialResponseDTO inativar(
            Long id,
            String matriculaUsuario
    );
}