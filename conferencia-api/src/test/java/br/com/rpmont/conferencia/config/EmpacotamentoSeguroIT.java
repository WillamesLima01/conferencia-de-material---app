package br.com.rpmont.conferencia.config;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class EmpacotamentoSeguroIT {

    @Test
    void jarFinalDeveConterSomenteEntradasAprovadas() {
        String configurado = System.getProperty("rpmont.jar.path");
        assertNotNull(configurado, "Execute pelo Maven Failsafe apos o empacotamento.");
        Path jar = Path.of(configurado);
        assertTrue(Files.isRegularFile(jar), "O JAR final deve existir antes da verificacao.");
        // Somente o indice de nomes do JAR: nenhum valor de propriedade e aberto ou impresso.
        PoliticaEmpacotamento.verificarJar(jar);
    }
}
