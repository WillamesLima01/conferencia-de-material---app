package br.com.rpmont.conferencia.config;

import br.com.rpmont.conferencia.security.JwtAuthenticationFilter;
import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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


    /*
     * =========================================
     * CONFIGURAÇÃO DE SEGURANÇA
     * =========================================
     */

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity httpSecurity
    ) throws Exception {

        return httpSecurity

                .cors(
                        Customizer.withDefaults()
                )

                .csrf(
                        csrf -> csrf.disable()
                )

                .sessionManagement(
                        session ->
                                session.sessionCreationPolicy(
                                        SessionCreationPolicy.STATELESS
                                )
                )

                .authorizeHttpRequests(
                        auth -> auth

                                /*
                                 * =========================================
                                 * ERROS INTERNOS
                                 * =========================================
                                 */

                                .dispatcherTypeMatchers(
                                        DispatcherType.ERROR
                                )
                                .permitAll()


                                /*
                                 * =========================================
                                 * AUTENTICAÇÃO
                                 * =========================================
                                 */

                                .requestMatchers(
                                        "/auth/**"
                                )
                                .permitAll()


                                /*
                                 * =========================================
                                 * SOLICITAÇÃO DE ACESSO
                                 * =========================================
                                 */

                                .requestMatchers(
                                        "/usuario/solicitar-acesso"
                                )
                                .permitAll()


                                /*
                                 * =========================================
                                 * USUÁRIOS
                                 * =========================================
                                 */

                                .requestMatchers(
                                        "/usuario/**"
                                )
                                .hasAnyRole(
                                        "ADMIN_MASTER",
                                        "ADMIN"
                                )


                                /*
                                 * =========================================
                                 * DEMAIS ROTAS
                                 * =========================================
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


    /*
     * =========================================
     * CORS
     * =========================================
     */

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();


        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173",
                        "http://192.168.0.28:5173"
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
                        "Content-Type"
                )
        );


        configuration.setExposedHeaders(
                List.of(
                        "Authorization"
                )
        );


        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();


        source.registerCorsConfiguration(
                "/**",
                configuration
        );


        return source;
    }


    /*
     * =========================================
     * PASSWORD ENCODER
     * =========================================
     */

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }
}