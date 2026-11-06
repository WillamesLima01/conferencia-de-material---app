package br.com.rpmont.conferencia.security;

import br.com.rpmont.conferencia.model.Usuario;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.util.ReflectionTestUtils;
import java.nio.charset.StandardCharsets;
import java.math.BigInteger;
import java.util.Date;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private static final String CHAVE = "chave-sintetica-exclusiva-achado04-01234567890123456789";
    private JwtService jwt;
    @BeforeEach void preparar() {
        jwt = new JwtService();
        ReflectionTestUtils.setField(jwt, "jwtSecret", CHAVE);
        ReflectionTestUtils.setField(jwt, "jwtExpiration", 3600000L);
    }
    private String assinar(Object versao, Object id) {
        return Jwts.builder().subject("SINTETICO").claim("id", id).claim("credencialVersao", versao)
                .issuedAt(new Date(1000)).expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(Keys.hmacShaKeyFor(CHAVE.getBytes(StandardCharsets.UTF_8))).compact();
    }
    static Stream<Object> invalidos() {
        return Stream.of(null, "0", -1, 1.5, 0.0, true, new BigInteger("9223372036854775808"));
    }
    @ParameterizedTest @MethodSource("invalidos")
    void versaoAusenteOuFormatoInvalidoRecusa(Object versao) {
        assertTrue(jwt.validarIdentidade(assinar(versao, 1L)).isEmpty());
    }
    @ParameterizedTest @MethodSource("invalidos")
    void idAusenteOuFormatoInvalidoRecusa(Object id) {
        assertTrue(jwt.validarIdentidade(assinar(0L, id)).isEmpty());
    }
    @Test void idZeroNaoIdentificaConta() { assertTrue(jwt.validarIdentidade(assinar(0, 0)).isEmpty()); }
    @Test void aceitaInteirosSemPerderPrecisao() {
        var identidade = jwt.validarIdentidade(assinar(Long.MAX_VALUE, 1)).orElseThrow();
        assertEquals(Long.MAX_VALUE, identidade.credencialVersao());
    }
    @Test void versaoDistingueTokensComMesmoIat() {
        var anterior = jwt.validarIdentidade(assinar(0, 1)).orElseThrow();
        var atual = jwt.validarIdentidade(assinar(1, 1)).orElseThrow();
        assertEquals(0, anterior.credencialVersao()); assertEquals(1, atual.credencialVersao());
    }
    @Test void emiteSnapshotSemSenhaERejeitaEntradaMalformada() {
        Usuario u = new Usuario(); u.setId(1L); u.setMatricula("SINTETICO");
        u.setSenha("SENTINELA-HASH-NAO-DEVE-IR-NO-TOKEN");
        String token = jwt.gerarToken(u);
        var claims = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(CHAVE.getBytes(StandardCharsets.UTF_8)))
                .build().parseSignedClaims(token).getPayload();
        assertEquals(0L, jwt.validarIdentidade(token).orElseThrow().credencialVersao());
        assertFalse(claims.toString().contains(u.getSenha()), "Hash nao pode integrar claims.");
        assertFalse(claims.containsKey("versaoRegistro"));
        assertTrue(jwt.validarIdentidade("token-malformado-sintetico").isEmpty());
    }
    @Test void overflowNaoModificaSenhaNemVersao() {
        Usuario u = new Usuario(); u.setSenha("hash-original"); u.setCredencialVersao(Long.MAX_VALUE);
        assertThrows(ArithmeticException.class, () -> u.trocarSenha("hash-novo"));
        assertTrue("hash-original".equals(u.getSenha())); assertEquals(Long.MAX_VALUE, u.getCredencialVersao());
    }
}
