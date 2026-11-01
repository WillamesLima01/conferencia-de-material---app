-- Executado com sucesso em 01/11/2026 exclusivamente na homologacao local
-- 127.0.0.1:3307/rpmont_homologacao. NAO repetir nesse ambiente.
-- Criar este arquivo NAO executa a migracao. Nao autorizado para outros ambientes.
-- Exclusivo de 127.0.0.1:3307/rpmont_homologacao; conexao nova, sem escritores concorrentes.
-- Executar somente mediante autorizacao, com cliente que pare no primeiro erro, sem --force.
-- Nao repetir o script historico de criacao de tabelas.
SET @rpmont_precondicoes = COALESCE((
    BINARY DATABASE() = BINARY 'rpmont_homologacao'
    AND @@lower_case_table_names = 0
    AND EXISTS (
        SELECT 1 FROM information_schema.TABLES
        WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
          AND BINARY TABLE_NAME = BINARY 'usuarios_sistema'
          AND TABLE_TYPE = 'BASE TABLE' AND ENGINE = 'InnoDB'
    )
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
          AND BINARY TABLE_NAME = BINARY 'usuarios_sistema'
          AND LOWER(COLUMN_NAME) IN ('credencialversao', 'versaoregistro')
    )
), 0);
SELECT IF(@rpmont_precondicoes = 1, 'PRECONDICOES_OK',
    'ABORTAR: catalogo, tabela, engine ou colunas divergentes') AS diagnostico;
SET @rpmont_ddl = IF(@rpmont_precondicoes = 1,
    'ALTER TABLE `rpmont_homologacao`.`usuarios_sistema`
        ADD COLUMN `credencialVersao` BIGINT NOT NULL DEFAULT 0,
        ADD COLUMN `versaoRegistro` BIGINT NOT NULL DEFAULT 0',
    'RPMONT_ABORTAR_PRECONDICOES_NAO_ATENDIDAS');
PREPARE rpmont_adicionar_versoes FROM @rpmont_ddl;
EXECUTE rpmont_adicionar_versoes;
DEALLOCATE PREPARE rpmont_adicionar_versoes;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
  AND BINARY TABLE_NAME = BINARY 'usuarios_sistema'
  AND LOWER(COLUMN_NAME) IN ('credencialversao', 'versaoregistro')
ORDER BY ORDINAL_POSITION;
-- As linhas existentes recebem zero; senhas/demais atributos nao sao modificados.
-- DDL tem commits implicitos. Em erro/desconexao, parar e inspecionar metadados
-- em nova conexao antes de qualquer repeticao. Nao remover colunas automaticamente.
-- Coordenar implantacao para impedir instancias antigas de ignorar as versoes.
