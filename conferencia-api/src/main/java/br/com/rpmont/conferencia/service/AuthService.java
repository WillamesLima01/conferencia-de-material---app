package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.LoginRequestDTO;
import br.com.rpmont.conferencia.dtos.LoginResponseDTO;

public interface AuthService {

    LoginResponseDTO login(LoginRequestDTO loginRequestDTO);
}