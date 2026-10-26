package br.com.rpmont.conferencia.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import java.util.Set;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.jar.JarOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class EmpacotamentoSeguroTest {

    @TempDir
    Path temporario;

    @Test
    void deveAceitarClassesConfiguracaoBaseEMetadadosAprovados() throws IOException {
        List<String> entradas = entradasMinimas();
        entradas.addAll(List.of(
                "BOOT-INF/classes/br/com/rpmont/conferencia/service/EmailServiceImpl.class",
                "BOOT-INF/lib/spring-core-ficticio.jar",
                "BOOT-INF/classpath.idx", "BOOT-INF/layers.idx",
                "org/springframework/boot/loader/launch/JarLauncher.class",
                "META-INF/MANIFEST.MF",
                "META-INF/maven/br.com.rpmont/conferencia-api/pom.xml",
                "META-INF/maven/br.com.rpmont/conferencia-api/pom.properties",
                "META-INF/services/java.nio.file.spi.FileSystemProvider"));
        Path jar = criarJar(entradas);
        assertDoesNotThrow(() -> PoliticaEmpacotamento.verificarJar(jar));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "application-local.properties", "config/application-local.yaml", "application-prod.properties",
            "application-secret.yml", ".env", "config/.env.local", "config/credenciais.key",
            "config/chave.pem", "config/chave.p12", "config/chave.pfx", "config/chave.jks",
            "config/chave.keystore", "config/id_rsa", "config/id_ed25519", "config/credentials.json",
            "config/SECRETS.JSON", "config/CHAVE.PEM", "config/ajustes.local"
    })
    void deveRejeitarArquivosLocaisEChavesSemLerConteudo(String entrada) throws IOException {
        List<String> entradas = entradasMinimas();
        entradas.add("BOOT-INF/classes/" + entrada);
        exigirRejeicao(criarJar(entradas));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "BOOT-INF/classes/config/arquivo-desconhecido.txt",
            "BOOT-INF/classes/application-homolog.properties",
            "BOOT-INF/classes/br/com/rpmont/conferencia/config/EmpacotamentoSeguroTest.class",
            "BOOT-INF/classes/br/com/rpmont/conferencia/config/EmpacotamentoSeguroIT.class",
            "BOOT-INF/classes/br/com/rpmont/conferencia/config/EmpacotamentoSeguroTest$Interna.class",
            "BOOT-INF/classes/br/com/rpmont/conferencia/config/EmpacotamentoSeguroIT$Interna.class",
            "BOOT-INF/classes/../arquivo.txt", "BOOT-INF/classes\\arquivo.txt",
            "BOOT-INF/lib/subpasta/arquivo.jar", "BOOT-INF/lib/arquivo.properties",
            "arquivo-na-raiz.txt", "META-INF/arquivo-nao-aprovado.txt", ".env"
    })
    void deveRejeitarRecursosPropriosNaoAutorizados(String entrada) throws IOException {
        List<String> entradas = entradasMinimas();
        entradas.add(entrada);
        exigirRejeicao(criarJar(entradas));
    }

    @ParameterizedTest
    @ValueSource(strings = {PoliticaEmpacotamento.CONFIGURACAO, PoliticaEmpacotamento.CLASSE_PRINCIPAL})
    void deveExigirConfiguracaoBaseEClassePrincipal(String ausente) throws IOException {
        List<String> entradas = entradasMinimas();
        entradas.remove(ausente);
        exigirRejeicao(criarJar(entradas));
    }

    @Test
    void configuracaoBaseNaoDeveAtivarPerfilLocalNemPerderTimeouts() throws IOException {
        // Apenas o recurso publico aprovado; nao carrega perfis ou qualquer contexto Spring.
        Properties propriedades = new Properties();
        try (InputStream recurso = getClass().getClassLoader().getResourceAsStream("application.properties")) {
            assertNotNull(recurso, "A configuracao base deve estar disponivel.");
            propriedades.load(recurso);
        }
        assertNull(propriedades.getProperty("spring.profiles.active"),
                "O perfil deve ser selecionado explicitamente pelo ambiente.");
        for (String protocolo : List.of("smtp", "smtps")) {
            assertEquals("${RPMONT_SMTP_CONNECTION_TIMEOUT_MS:5000}",
                    propriedades.getProperty("spring.mail.properties[mail." + protocolo + ".connectiontimeout]"));
            assertEquals("${RPMONT_SMTP_READ_TIMEOUT_MS:5000}",
                    propriedades.getProperty("spring.mail.properties[mail." + protocolo + ".timeout]"));
            assertEquals("${RPMONT_SMTP_WRITE_TIMEOUT_MS:5000}",
                    propriedades.getProperty("spring.mail.properties[mail." + protocolo + ".writetimeout]"));
        }
    }

    private List<String> entradasMinimas() {
        return new ArrayList<>(List.of(PoliticaEmpacotamento.CONFIGURACAO, PoliticaEmpacotamento.CLASSE_PRINCIPAL));
    }

    private Path criarJar(List<String> entradas) throws IOException {
        Path arquivo = temporario.resolve("artefato-ficticio.jar");
        try (JarOutputStream jar = new JarOutputStream(Files.newOutputStream(arquivo))) {
            for (String nome : entradas) {
                jar.putNextEntry(new JarEntry(nome));
                // Entradas vazias: nenhum segredo, configuracao real ou bytecode e copiado.
                jar.closeEntry();
            }
        }
        return arquivo;
    }

    private void exigirRejeicao(Path jar) {
        IllegalStateException erro = assertThrows(IllegalStateException.class,
                () -> PoliticaEmpacotamento.verificarJar(jar));
        assertTrue(erro.getMessage().startsWith("EMPACOTAMENTO_"));
        assertNull(erro.getCause(), "A falha deve informar somente a regra, sem conteudos ou caminhos.");
    }
}

// Compartilhada pelos dois testes no mesmo pacote, sem adicionar codigo a aplicacao.
final class PoliticaEmpacotamento {

    static final String CONFIGURACAO = "BOOT-INF/classes/application.properties";
    static final String CLASSE_PRINCIPAL = "BOOT-INF/classes/br/com/rpmont/conferencia/ConferenciaApiApplication.class";
    private static final Set<String> METADADOS = Set.of(
            "META-INF/MANIFEST.MF", "META-INF/LICENSE.txt", "META-INF/NOTICE.txt",
            "META-INF/maven/br.com.rpmont/conferencia-api/pom.xml",
            "META-INF/maven/br.com.rpmont/conferencia-api/pom.properties",
            "META-INF/services/java.nio.file.spi.FileSystemProvider",
            "BOOT-INF/classpath.idx", "BOOT-INF/layers.idx");

    private PoliticaEmpacotamento() {
    }

    static void verificarJar(Path arquivo) {
        boolean configuracao = false;
        boolean principal = false;
        try (JarFile jar = new JarFile(arquivo.toFile(), false)) {
            var entradas = jar.entries();
            while (entradas.hasMoreElements()) {
                JarEntry entrada = entradas.nextElement();
                String nome = entrada.getName();
                if (nome.contains("\\") || nome.startsWith("/") || List.of(nome.split("/")).contains("..")) {
                    throw new IllegalStateException("EMPACOTAMENTO_CAMINHO_INVALIDO");
                }
                if (entrada.isDirectory()) {
                    continue;
                }
                if (proibido(nome)) {
                    throw new IllegalStateException("EMPACOTAMENTO_ARQUIVO_PROIBIDO");
                }
                if (!permitido(nome)) {
                    throw new IllegalStateException("EMPACOTAMENTO_RECURSO_NAO_AUTORIZADO");
                }
                configuracao |= CONFIGURACAO.equals(nome);
                principal |= CLASSE_PRINCIPAL.equals(nome);
            }
        } catch (IOException erro) {
            throw new IllegalStateException("EMPACOTAMENTO_ARTEFATO_INACESSIVEL");
        }
        if (!configuracao || !principal) {
            throw new IllegalStateException("EMPACOTAMENTO_RECURSO_OBRIGATORIO_AUSENTE");
        }
    }

    private static boolean permitido(String nome) {
        if (nome.startsWith("BOOT-INF/classes/")) {
            return CONFIGURACAO.equals(nome) || (nome.endsWith(".class")
                    && !nome.endsWith("Test.class") && !nome.endsWith("IT.class")
                    && !nome.contains("Test$") && !nome.contains("IT$"));
        }
        if (nome.startsWith("BOOT-INF/lib/")) {
            String biblioteca = nome.substring("BOOT-INF/lib/".length());
            return biblioteca.endsWith(".jar") && !biblioteca.contains("/");
        }
        return METADADOS.contains(nome)
                || (nome.startsWith("org/springframework/boot/loader/") && nome.endsWith(".class"));
    }

    private static boolean proibido(String nome) {
        String base = nome.substring(nome.lastIndexOf('/') + 1).toLowerCase(Locale.ROOT);
        return base.startsWith(".env") || base.startsWith("application-local")
                || base.startsWith("application-prod") || base.startsWith("application-secret")
                || base.startsWith("id_rsa") || base.startsWith("id_ed25519")
                || base.endsWith(".local") || base.endsWith(".key") || base.endsWith(".pem")
                || base.endsWith(".p12") || base.endsWith(".pfx") || base.endsWith(".jks")
                || base.endsWith(".keystore")
                || (!base.endsWith(".class") && (base.contains("credentials") || base.contains("secret")));
    }
}
