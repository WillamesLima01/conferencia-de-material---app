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

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    public String gerarToken(Usuario usuario) {

        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + jwtExpiration);

        return Jwts.builder()
                .subject(usuario.getMatricula())
                .claim("id", usuario.getId())
                .claim("nome", usuario.getNome())
                .claim("nivel", usuario.getNivel())
                .claim("setor", usuario.getSetor())
                .claim("unidade", usuario.getUnidade())
                .claim("statusAcesso", usuario.getStatusAcesso())
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(getChaveAssinatura())
                .compact();
    }

    public String extrairMatricula(String token) {
        return extrairClaims(token).getSubject();
    }

    public boolean tokenValido(String token) {
        try {
            Claims claims = extrairClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception exception) {
            return false;
        }
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