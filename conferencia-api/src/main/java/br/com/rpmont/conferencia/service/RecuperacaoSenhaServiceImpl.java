package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.RedefinirSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitarRecuperacaoSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.ValidarCodigoRecuperacaoRequestDTO;
import br.com.rpmont.conferencia.model.RecuperacaoSenha;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.RecuperacaoSenhaRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@Service
public class RecuperacaoSenhaServiceImpl
        implements RecuperacaoSenhaService {

    private static final int TEMPO_EXPIRACAO_MINUTOS = 10;

    private static final int INTERVALO_NOVA_SOLICITACAO_SEGUNDOS = 60;

    private static final int MAXIMO_TENTATIVAS = 5;

    private static final SecureRandom SECURE_RANDOM =
            new SecureRandom();

    private final RecuperacaoSenhaRepository
            recuperacaoSenhaRepository;

    private final UsuarioRepository
            usuarioRepository;

    private final PasswordEncoder
            passwordEncoder;

    private final EmailService
            emailService;


    /*
     * =====================================================
     * SOLICITAR RECUPERAÇÃO
     * =====================================================
     */

    @Transactional
    @Override
    public void solicitarRecuperacao(
            SolicitarRecuperacaoSenhaRequestDTO request
    ) {

        String email = normalizarEmail(
                request.email()
        );

        validarEmailObrigatorio(
                email
        );

        Usuario usuario = usuarioRepository
                .findByEmail(email)
                .orElse(null);

        /*
         * Não informa se o e-mail existe ou não.
         *
         * Isso evita enumeração de usuários.
         */
        if (usuario == null) {
            return;
        }

        validarIntervaloEntreSolicitacoes(
                usuario
        );

        invalidarRecuperacoesAnteriores(
                usuario
        );

        String codigo =
                gerarCodigoRecuperacao();

        String codigoHash =
                passwordEncoder.encode(
                        codigo
                );

        RecuperacaoSenha recuperacao =
                criarRecuperacao(
                        usuario,
                        codigoHash
                );

        recuperacaoSenhaRepository.save(
                recuperacao
        );

        enviarCodigoRecuperacao(
                usuario,
                codigo
        );
    }


    /*
     * =====================================================
     * VALIDAR CÓDIGO
     * =====================================================
     */

    @Transactional
    @Override
    public void validarCodigo(
            ValidarCodigoRecuperacaoRequestDTO request
    ) {

        String email =
                normalizarEmail(
                        request.email()
                );

        String codigo =
                normalizarCodigo(
                        request.codigo()
                );

        validarEmailObrigatorio(
                email
        );

        validarCodigoObrigatorio(
                codigo
        );

        Usuario usuario =
                buscarUsuarioPorEmail(
                        email
                );

        RecuperacaoSenha recuperacao =
                buscarUltimaRecuperacaoValida(
                        usuario
                );

        validarRecuperacao(
                recuperacao,
                codigo
        );
    }


    /*
     * =====================================================
     * REDEFINIR SENHA
     * =====================================================
     */

    @Transactional
    @Override
    public void redefinirSenha(
            RedefinirSenhaRequestDTO request
    ) {

        String email =
                normalizarEmail(
                        request.email()
                );

        String codigo =
                normalizarCodigo(
                        request.codigo()
                );

        validarEmailObrigatorio(
                email
        );

        validarCodigoObrigatorio(
                codigo
        );

        validarNovaSenha(
                request.novaSenha(),
                request.confirmarSenha()
        );

        Usuario usuario =
                buscarUsuarioPorEmail(
                        email
                );

        RecuperacaoSenha recuperacao =
                buscarUltimaRecuperacaoValida(
                        usuario
                );

        validarRecuperacao(
                recuperacao,
                codigo
        );

        atualizarSenhaUsuario(
                usuario,
                request.novaSenha()
        );

        marcarRecuperacaoComoUtilizada(
                recuperacao
        );
    }


    /*
     * =====================================================
     * NORMALIZAÇÃO
     * =====================================================
     */

    private String normalizarEmail(
            String email
    ) {

        if (email == null) {
            return null;
        }

        return email
                .trim()
                .toLowerCase();
    }


    private String normalizarCodigo(
            String codigo
    ) {

        if (codigo == null) {
            return null;
        }

        return codigo
                .replaceAll("\\D", "")
                .trim();
    }


    /*
     * =====================================================
     * VALIDAÇÕES DE ENTRADA
     * =====================================================
     */

    private void validarEmailObrigatorio(
            String email
    ) {

        if (
                email == null ||
                        email.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O e-mail é obrigatório."
            );
        }
    }


    private void validarCodigoObrigatorio(
            String codigo
    ) {

        if (
                codigo == null ||
                        codigo.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O código de recuperação é obrigatório."
            );
        }

        if (codigo.length() != 6) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O código de recuperação deve possuir 6 dígitos."
            );
        }
    }


    /*
     * =====================================================
     * BUSCA DO USUÁRIO
     * =====================================================
     */

    private Usuario buscarUsuarioPorEmail(
            String email
    ) {

        return usuarioRepository
                .findByEmail(email)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Não foi possível validar a recuperação de senha."
                        )
                );
    }


    /*
     * =====================================================
     * CRIAÇÃO DA RECUPERAÇÃO
     * =====================================================
     */

    private RecuperacaoSenha criarRecuperacao(
            Usuario usuario,
            String codigoHash
    ) {

        LocalDateTime agora =
                LocalDateTime.now();

        RecuperacaoSenha recuperacao =
                new RecuperacaoSenha();

        recuperacao.setUsuario(
                usuario
        );

        recuperacao.setCodigoHash(
                codigoHash
        );

        recuperacao.setDataCriacao(
                agora
        );

        recuperacao.setDataExpiracao(
                agora.plusMinutes(
                        TEMPO_EXPIRACAO_MINUTOS
                )
        );

        recuperacao.setUtilizado(
                false
        );

        recuperacao.setTentativas(
                0
        );

        return recuperacao;
    }


    /*
     * =====================================================
     * GERAÇÃO DO CÓDIGO
     * =====================================================
     */

    private String gerarCodigoRecuperacao() {

        int numero =
                SECURE_RANDOM.nextInt(
                        100_000,
                        1_000_000
                );

        return String.valueOf(
                numero
        );
    }


    /*
     * =====================================================
     * ENVIO DO CÓDIGO POR E-MAIL
     * =====================================================
     */

    private void enviarCodigoRecuperacao(
            Usuario usuario,
            String codigo
    ) {

        emailService.enviarCodigoRecuperacao(
                usuario.getEmail(),
                codigo
        );
    }


    /*
     * =====================================================
     * INTERVALO ENTRE SOLICITAÇÕES
     * =====================================================
     */

    private void validarIntervaloEntreSolicitacoes(
            Usuario usuario
    ) {

        recuperacaoSenhaRepository
                .findTopByUsuarioAndUtilizadoFalseOrderByDataCriacaoDesc(
                        usuario
                )
                .ifPresent(
                        recuperacao -> {

                            LocalDateTime proximaSolicitacao =
                                    recuperacao
                                            .getDataCriacao()
                                            .plusSeconds(
                                                    INTERVALO_NOVA_SOLICITACAO_SEGUNDOS
                                            );

                            if (
                                    LocalDateTime.now()
                                            .isBefore(
                                                    proximaSolicitacao
                                            )
                            ) {

                                throw new ResponseStatusException(
                                        HttpStatus.TOO_MANY_REQUESTS,
                                        "Aguarde antes de solicitar um novo código."
                                );
                            }
                        }
                );
    }


    /*
     * =====================================================
     * INVALIDAR CÓDIGOS ANTERIORES
     * =====================================================
     */

    private void invalidarRecuperacoesAnteriores(
            Usuario usuario
    ) {

        List<RecuperacaoSenha> recuperacoes =
                recuperacaoSenhaRepository
                        .findAllByUsuarioAndUtilizadoFalse(
                                usuario
                        );

        if (recuperacoes.isEmpty()) {
            return;
        }

        recuperacoes.forEach(
                recuperacao ->
                        recuperacao.setUtilizado(
                                true
                        )
        );

        recuperacaoSenhaRepository.saveAll(
                recuperacoes
        );
    }


    /*
     * =====================================================
     * BUSCAR RECUPERAÇÃO
     * =====================================================
     */

    private RecuperacaoSenha buscarUltimaRecuperacaoValida(
            Usuario usuario
    ) {

        return recuperacaoSenhaRepository
                .findTopByUsuarioAndUtilizadoFalseOrderByDataCriacaoDesc(
                        usuario
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Código de recuperação inválido ou expirado."
                        )
                );
    }


    /*
     * =====================================================
     * VALIDAR RECUPERAÇÃO
     * =====================================================
     */

    private void validarRecuperacao(
            RecuperacaoSenha recuperacao,
            String codigo
    ) {

        validarSeFoiUtilizada(
                recuperacao
        );

        validarExpiracao(
                recuperacao
        );

        validarLimiteTentativas(
                recuperacao
        );

        validarCodigoInformado(
                recuperacao,
                codigo
        );
    }


    /*
     * =====================================================
     * VALIDAR UTILIZAÇÃO
     * =====================================================
     */

    private void validarSeFoiUtilizada(
            RecuperacaoSenha recuperacao
    ) {

        if (
                Boolean.TRUE.equals(
                        recuperacao.getUtilizado()
                )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Código de recuperação inválido ou já utilizado."
            );
        }
    }


    /*
     * =====================================================
     * VALIDAR EXPIRAÇÃO
     * =====================================================
     */

    private void validarExpiracao(
            RecuperacaoSenha recuperacao
    ) {

        if (
                LocalDateTime.now()
                        .isAfter(
                                recuperacao.getDataExpiracao()
                        )
        ) {

            recuperacao.setUtilizado(
                    true
            );

            recuperacaoSenhaRepository.save(
                    recuperacao
            );

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Código de recuperação inválido ou expirado."
            );
        }
    }


    /*
     * =====================================================
     * VALIDAR LIMITE DE TENTATIVAS
     * =====================================================
     */

    private void validarLimiteTentativas(
            RecuperacaoSenha recuperacao
    ) {

        int tentativas =
                recuperacao.getTentativas() == null
                        ? 0
                        : recuperacao.getTentativas();

        if (
                tentativas >=
                        MAXIMO_TENTATIVAS
        ) {

            recuperacao.setUtilizado(
                    true
            );

            recuperacaoSenhaRepository.save(
                    recuperacao
            );

            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Limite de tentativas excedido. Solicite um novo código."
            );
        }
    }


    /*
     * =====================================================
     * VALIDAR CÓDIGO INFORMADO
     * =====================================================
     */

    private void validarCodigoInformado(
            RecuperacaoSenha recuperacao,
            String codigo
    ) {

        boolean codigoCorreto =
                passwordEncoder.matches(
                        codigo,
                        recuperacao.getCodigoHash()
                );

        if (codigoCorreto) {
            return;
        }

        registrarTentativaInvalida(
                recuperacao
        );

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Código de recuperação inválido ou expirado."
        );
    }


    /*
     * =====================================================
     * REGISTRAR TENTATIVA INVÁLIDA
     * =====================================================
     */

    private void registrarTentativaInvalida(
            RecuperacaoSenha recuperacao
    ) {

        int tentativasAtuais =
                recuperacao.getTentativas() == null
                        ? 0
                        : recuperacao.getTentativas();

        int novasTentativas =
                tentativasAtuais + 1;

        recuperacao.setTentativas(
                novasTentativas
        );

        if (
                novasTentativas >=
                        MAXIMO_TENTATIVAS
        ) {

            recuperacao.setUtilizado(
                    true
            );
        }

        recuperacaoSenhaRepository.save(
                recuperacao
        );
    }


    /*
     * =====================================================
     * VALIDAR NOVA SENHA
     * =====================================================
     */

    private void validarNovaSenha(
            String novaSenha,
            String confirmarSenha
    ) {

        if (
                novaSenha == null ||
                        novaSenha.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha é obrigatória."
            );
        }

        if (novaSenha.length() < 4) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha deve ter no mínimo 4 caracteres."
            );
        }

        if (
                confirmarSenha == null ||
                        !novaSenha.equals(
                                confirmarSenha
                        )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha e a confirmação não conferem."
            );
        }
    }


    /*
     * =====================================================
     * ATUALIZAR SENHA
     * =====================================================
     */

    private void atualizarSenhaUsuario(
            Usuario usuario,
            String novaSenha
    ) {

        String senhaCriptografada =
                passwordEncoder.encode(
                        novaSenha
                );

        usuario.setSenha(
                senhaCriptografada
        );

        usuario.setDataModificacao(
                LocalDateTime.now()
        );

        usuarioRepository.save(
                usuario
        );
    }


    /*
     * =====================================================
     * MARCAR RECUPERAÇÃO COMO UTILIZADA
     * =====================================================
     */

    private void marcarRecuperacaoComoUtilizada(
            RecuperacaoSenha recuperacao
    ) {

        recuperacao.setUtilizado(
                true
        );

        recuperacaoSenhaRepository.save(
                recuperacao
        );
    }
}