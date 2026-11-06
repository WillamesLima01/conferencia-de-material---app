package br.com.rpmont.conferencia.security;

import br.com.rpmont.conferencia.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    public String gerarToken(Usuario usuario) {
        return gerarToken(DadosEmissao.de(usuario));
    }

    // Snapshot sem senha/hash: o login captura antes de verificar a credencial.
    public record DadosEmissao(Long id, String matricula, String nome, Integer nivel,
                               String setor, String unidade, String statusAcesso, Long credencialVersao) {
        public static DadosEmissao de(Usuario u) {
            return new DadosEmissao(u.getId(), u.getMatricula(), u.getNome(), u.getNivel(),
                    u.getSetor(), u.getUnidade(), u.getStatusAcesso(), u.getCredencialVersao());
        }
    }

    public record Identidade(Long id, String matricula, long credencialVersao) { }

    public String gerarToken(DadosEmissao dados) {
        if (dados.id() == null || dados.id() <= 0 || dados.matricula() == null || dados.matricula().isBlank()
                || dados.credencialVersao() == null || dados.credencialVersao() < 0) {
            throw new IllegalArgumentException("Identidade de emissão inválida.");
        }

        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + jwtExpiration);

        return Jwts.builder()
                .subject(dados.matricula())
                .claim("id", dados.id())
                .claim("credencialVersao", dados.credencialVersao())
                .claim("nome", dados.nome())
                .claim("nivel", dados.nivel())
                .claim("setor", dados.setor())
                .claim("unidade", dados.unidade())
                .claim("statusAcesso", dados.statusAcesso())
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(getChaveAssinatura())
                .compact();
    }

    public String extrairMatricula(String token) {
        return validarIdentidade(token).orElseThrow(
                () -> new IllegalArgumentException("Token inválido.")).matricula();
    }

    public boolean tokenValido(String token) {
        return validarIdentidade(token).isPresent();
    }

    public Optional<Identidade> validarIdentidade(String token) {
        try {
            Claims claims = extrairClaims(token);
            Long id = inteiro(claims.get("id"));
            Long versao = inteiro(claims.get("credencialVersao"));
            String matricula = claims.getSubject();
            if (claims.getExpiration() == null || !claims.getExpiration().after(new Date())
                    || id == null || id <= 0 || versao == null || versao < 0
                    || matricula == null || matricula.isBlank()) return Optional.empty();
            return Optional.of(new Identidade(id, matricula, versao));
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    private Long inteiro(Object valor) {
        // Não aceitar strings, floats, booleanos ou conversão truncada de números grandes.
        if (valor instanceof Integer i) return i.longValue();
        if (valor instanceof Long l) return l;
        return null;
    }

    private Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(getChaveAssinatura())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getChaveAssinatura() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}
