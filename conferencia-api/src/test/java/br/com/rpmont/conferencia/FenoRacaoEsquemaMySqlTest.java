
package br.com.rpmont.conferencia;

import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.model.ProdutoFenoRacao;
import br.com.rpmont.conferencia.model.LoteFenoRacao;
import br.com.rpmont.conferencia.model.MovimentacaoFenoRacao;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.orm.jpa.persistenceunit.PersistenceManagedTypes;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(
    classes = FenoRacaoEsquemaMySqlTest.Configuracao.class,
    webEnvironment = SpringBootTest.WebEnvironment.NONE,
    properties = {
        "spring.config.location=classpath:/application-homolog.properties",
        "spring.datasource.url=jdbc:mysql://127.0.0.1:3307/rpmont_homologacao",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.main.web-application-type=none"
    }
)
@ActiveProfiles("homolog")
@ContextConfiguration(
    initializers = FenoRacaoEsquemaMySqlTest.DestinoLocal.class
)
class FenoRacaoEsquemaMySqlTest {

    private static final String URL =
        "jdbc:mysql://127.0.0.1:3307/rpmont_homologacao";

    @SpringBootConfiguration
    @EnableAutoConfiguration(exclude = {
        org.springframework.boot.data.jpa.autoconfigure.DataJpaRepositoriesAutoConfiguration.class
    })
    static class Configuracao {

        @Bean
        PersistenceManagedTypes tipos() {
            return PersistenceManagedTypes.of(
                Usuario.class.getName(),
                ProdutoFenoRacao.class.getName(),
                LoteFenoRacao.class.getName(),
                MovimentacaoFenoRacao.class.getName()
            );
        }
    }

    static class DestinoLocal implements
        ApplicationContextInitializer<ConfigurableApplicationContext> {

        @Override
        public void initialize(
            ConfigurableApplicationContext context
        ) {
            var env = context.getEnvironment();

            if (!URL.equals(env.getProperty("spring.datasource.url"))
                || !"validate".equals(
                    env.getProperty("spring.jpa.hibernate.ddl-auto")
                )
                || !"classpath:/application-homolog.properties".equals(
                    env.getProperty("spring.config.location")
                )
                || !java.util.Arrays.equals(
                    new String[]{"homolog"},
                    env.getActiveProfiles()
                )
                || env.containsProperty("spring.config.import")
                || env.containsProperty(
                    "spring.config.additional-location"
                )) {

                throw new IllegalStateException(
                    "Configuracao de homologacao nao autorizada."
                );
            }
        }
    }

    @Autowired
    private DataSource dataSource;

    @Test
    void validarEsquemaMySqlHomologacao() throws Exception {

        try (var conexao = dataSource.getConnection()) {

            assertEquals(
                URL,
                conexao.getMetaData().getURL(),
                "URL JDBC inesperada."
            );

            assertEquals(
                "rpmont_homologacao",
                conexao.getCatalog(),
                "Catalogo MySQL inesperado."
            );

            String[] tabelas = {
                "usuarios_sistema",
                "TB_produto_feno_racao",
                "TB_lote_feno_racao",
                "TB_movimentacao_feno_racao"
            };

            for (String tabela : tabelas) {

                try (var resultado =
                    conexao.getMetaData().getTables(
                        "rpmont_homologacao",
                        null,
                        tabela,
                        new String[]{"TABLE"}
                    )) {

                    assertTrue(
                        resultado.next(),
                        "Tabela nao encontrada: " + tabela
                    );

                    assertEquals(
                        tabela,
                        resultado.getString("TABLE_NAME"),
                        "Nome fisico divergente."
                    );
                }
            }
        }
    }
}
