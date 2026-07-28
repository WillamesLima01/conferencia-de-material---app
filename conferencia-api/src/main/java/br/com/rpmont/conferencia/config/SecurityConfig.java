package br.com.rpmont.conferencia.config;

import br.com.rpmont.conferencia.security.JwtAuthenticationFilter;
import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@RequiredArgsConstructor
@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity httpSecurity
    ) throws Exception {

        return httpSecurity

                .cors(Customizer.withDefaults())

                .csrf(csrf -> csrf.disable())

                .sessionManagement(
                        session -> session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(
                        auth -> auth

                                /*
                                 * Permite o encaminhamento interno
                                 * das páginas de erro.
                                 */
                                .dispatcherTypeMatchers(
                                        DispatcherType.ERROR
                                )
                                .permitAll()

                                /*
                                 * Libera as requisições preflight
                                 * enviadas pelo navegador.
                                 */
                                .requestMatchers(
                                        HttpMethod.OPTIONS,
                                        "/**"
                                )
                                .permitAll()

                                /*
                                 * Rotas públicas de autenticação,
                                 * login e recuperação de senha.
                                 */
                                .requestMatchers(
                                        "/auth/**"
                                )
                                .permitAll()

                                /*
                                 * Solicitação pública de acesso.
                                 */
                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/usuario/solicitar-acesso"
                                )
                                .permitAll()

                                /*
                                 * Administração de usuários.
                                 */
                                .requestMatchers(
                                        "/usuario/**"
                                )
                                .hasAnyRole(
                                        "ADMIN_MASTER",
                                        "ADMIN"
                                )

                                /*
                                 * Todas as demais rotas exigem JWT.
                                 */
                                .anyRequest()
                                .authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost",
                        "https://localhost",
                        "http://localhost:5173",
                        "http://192.168.0.11:5173"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "X-Requested-With"
                )
        );

        configuration.setExposedHeaders(
                List.of(
                        "Authorization"
                )
        );

        /*
         * O projeto usa JWT no cabeçalho Authorization,
         * e não autenticação por cookie.
         */
        configuration.setAllowCredentials(false);

        /*
         * Mantém o resultado do preflight em cache
         * durante uma hora.
         */
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}