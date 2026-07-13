package br.com.rpmont.conferencia.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@RequiredArgsConstructor
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.remetente}")
    private String remetente;

    @Value("${spring.mail.username}")
    private String smtpUsername;

    @Value("${spring.mail.password}")
    private String smtpPassword;


    /*
     * =====================================================
     * DIAGNÓSTICO DA CONFIGURAÇÃO SMTP
     * =====================================================
     */

    @PostConstruct
    public void verificarConfiguracaoSmtp() {

        int tamanhoSenha =
                smtpPassword == null
                        ? 0
                        : smtpPassword.length();

        String finalSenha =
                obterFinalSeguroSenha(
                        smtpPassword
                );

        System.out.println();
        System.out.println(
                "====================================================="
        );
        System.out.println(
                "DIAGNÓSTICO DA CONFIGURAÇÃO SMTP"
        );
        System.out.println(
                "====================================================="
        );
        System.out.println(
                "Login SMTP carregado: "
                        + smtpUsername
        );
        System.out.println(
                "Tamanho da chave SMTP: "
                        + tamanhoSenha
        );
        System.out.println(
                "Final da chave SMTP: "
                        + finalSenha
        );
        System.out.println(
                "Remetente configurado: "
                        + remetente
        );
        System.out.println(
                "====================================================="
        );
        System.out.println();
    }


    /*
     * =====================================================
     * OBTER FINAL SEGURO DA SENHA
     * =====================================================
     */

    private String obterFinalSeguroSenha(
            String senha
    ) {

        if (
                !StringUtils.hasText(
                        senha
                )
        ) {

            return "NÃO INFORMADA";
        }

        String senhaLimpa =
                senha.trim();

        if (
                senhaLimpa.length() < 6
        ) {

            return "CHAVE INVÁLIDA";
        }

        return senhaLimpa.substring(
                senhaLimpa.length() - 6
        );
    }


    /*
     * =====================================================
     * ENVIAR CÓDIGO DE RECUPERAÇÃO
     * =====================================================
     */

    @Override
    public void enviarCodigoRecuperacao(
            String destinatario,
            String codigo
    ) {

        validarDestinatario(
                destinatario
        );

        validarCodigo(
                codigo
        );

        SimpleMailMessage mensagem =
                criarMensagemRecuperacao(
                        destinatario.trim(),
                        codigo.trim()
                );

        enviarEmail(
                mensagem
        );
    }


    /*
     * =====================================================
     * ENVIAR E-MAIL
     * =====================================================
     */

    private void enviarEmail(
            SimpleMailMessage mensagem
    ) {

        mailSender.send(
                mensagem
        );
    }


    /*
     * =====================================================
     * CRIAR MENSAGEM DE RECUPERAÇÃO
     * =====================================================
     */

    private SimpleMailMessage criarMensagemRecuperacao(
            String destinatario,
            String codigo
    ) {

        SimpleMailMessage mensagem =
                new SimpleMailMessage();

        mensagem.setFrom(
                remetente.trim()
        );

        mensagem.setTo(
                destinatario
        );

        mensagem.setSubject(
                "Recuperação de senha - Sistema RPMont"
        );

        mensagem.setText(
                criarCorpoEmailRecuperacao(
                        codigo
                )
        );

        return mensagem;
    }


    /*
     * =====================================================
     * CRIAR CORPO DO E-MAIL
     * =====================================================
     */

    private String criarCorpoEmailRecuperacao(
            String codigo
    ) {

        return """
                Olá,

                Foi solicitada a recuperação de senha da sua conta no Sistema Integrado de Gestão Interna do RPMont.

                Seu código de recuperação é:

                %s

                Este código é válido por 10 minutos.

                Por segurança:

                - não compartilhe este código com outras pessoas;
                - o código poderá ser utilizado somente dentro do prazo de validade;
                - após a redefinição da senha, o código será automaticamente invalidado.

                Caso você não tenha solicitado a recuperação de senha, ignore esta mensagem.

                Regimento de Polícia Montada - Cel. Calixto
                Sistema de Conferência de Material Patrimonial
                """.formatted(
                codigo
        );
    }


    /*
     * =====================================================
     * VALIDAR DESTINATÁRIO
     * =====================================================
     */

    private void validarDestinatario(
            String destinatario
    ) {

        if (
                !StringUtils.hasText(
                        destinatario
                )
        ) {

            throw new IllegalArgumentException(
                    "O destinatário do e-mail é obrigatório."
            );
        }
    }


    /*
     * =====================================================
     * VALIDAR CÓDIGO
     * =====================================================
     */

    private void validarCodigo(
            String codigo
    ) {

        if (
                !StringUtils.hasText(
                        codigo
                )
        ) {

            throw new IllegalArgumentException(
                    "O código de recuperação é obrigatório."
            );
        }

        String codigoLimpo =
                codigo.trim();

        if (
                !codigoLimpo.matches(
                        "\\d{6}"
                )
        ) {

            throw new IllegalArgumentException(
                    "O código de recuperação deve possuir 6 dígitos."
            );
        }
    }
}