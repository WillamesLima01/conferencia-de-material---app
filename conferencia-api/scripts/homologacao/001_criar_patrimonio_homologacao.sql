-- EXCLUSIVO de 127.0.0.1:3307/rpmont_homologacao (MySQL 8.4).
-- Preparado a partir das entidades do commit 96dda2b1.
-- Executado na homologacao local em 27/10/2026; NAO repetir neste ambiente.
-- Executar integralmente em uma conexao nova, selecionando previamente o catalogo.
-- Cliente deve parar no primeiro erro; NAO usar --force nem executar trechos isolados.
-- Nao executar com transacoes de dados pendentes nem manutencao concorrente.
-- Nao ha USE: um catalogo incorreto deve causar erro, nao ser corrigido silenciosamente.
-- Somente metadados sao consultados. Nenhum registro e inserido, lido ou alterado.
-- Variaveis @rpmont_* sao somente de sessao; nao contêm credenciais.
-- Cada CREATE TABLE pode confirmar implicitamente a transacao; os dois CREATEs
-- NAO formam uma unidade transacional. Consulte o procedimento de falha parcial abaixo.

SET @rpmont_ok = (
    BINARY DATABASE() = BINARY 'rpmont_homologacao'
    AND @@lower_case_table_names = 0
    AND @@foreign_key_checks = 1
    AND EXISTS (
        SELECT 1 FROM information_schema.SCHEMATA
        WHERE BINARY SCHEMA_NAME = BINARY 'rpmont_homologacao'
          AND DEFAULT_CHARACTER_SET_NAME = 'utf8mb4'
          AND DEFAULT_COLLATION_NAME = 'utf8mb4_0900_ai_ci'
    )
    AND EXISTS (
        SELECT 1 FROM information_schema.TABLES
        WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
          AND BINARY TABLE_NAME = BINARY 'usuarios_sistema'
          AND TABLE_TYPE = 'BASE TABLE'
          AND ENGINE = 'InnoDB' AND TABLE_COLLATION = 'utf8mb4_0900_ai_ci'
    )
    AND EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
          AND BINARY TABLE_NAME = BINARY 'usuarios_sistema'
          AND BINARY COLUMN_NAME = BINARY 'ID'
          AND COLUMN_TYPE = 'bigint' AND IS_NULLABLE = 'NO'
          AND COLUMN_KEY = 'PRI' AND EXTRA = 'auto_increment'
    )
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.TABLES
        WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
          AND LOWER(TABLE_NAME) IN ('tb_inventario_mp', 'tb_movimentacao_material')
    )
);

SELECT IF(COALESCE(@rpmont_ok, 0), 'PRECONDICOES_OK',
    'ABORTAR: catalogo, tabelas existentes, engine, charset, chave ou configuracao divergente') AS diagnostico;

-- Fora de rotinas, IF/SIGNAL nao permitem este bloco condicional de DDL.
-- PREPARE de texto deliberadamente invalido interrompe o cliente no caminho de
-- erro. A escolha condicional tambem protege cada DDL se um cliente insistir em
-- continuar. Nao e criada procedure, tabela auxiliar ou outro objeto persistente.
SET @rpmont_comando = IF(COALESCE(@rpmont_ok, 0), 'DO 0',
    'RPMONT_ABORTAR_PRECONDICOES_NAO_ATENDIDAS');
PREPARE rpmont_guard FROM @rpmont_comando;
EXECUTE rpmont_guard;
DEALLOCATE PREPARE rpmont_guard;

SET @rpmont_ddl_material = '
CREATE TABLE `rpmont_homologacao`.`TB_inventario_MP` (
    `ID` BIGINT NOT NULL AUTO_INCREMENT,
    `NSerie` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(100) NULL,
    `marca` VARCHAR(100) NULL,
    `descricao` VARCHAR(300) NOT NULL,
    `observacao` VARCHAR(500) NOT NULL,
    `setor` VARCHAR(50) NOT NULL,
    `unidade` VARCHAR(50) NOT NULL,
    `dataCadastro` DATE NOT NULL,
    `userID` BIGINT NOT NULL,
    `dataModificacao` DATETIME(6) NOT NULL,
    `userModificador` BIGINT NOT NULL,
    `Conferido` BIT(1) NOT NULL,
    `situacao` ENUM(''ATIVO'',''INATIVO'',''EM_MANUTENCAO'',''BAIXADO'',
        ''DESCARTADO'',''EXTRAVIADO'',''FURTADO'',''TRANSFERIDO'') NOT NULL,
    PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

SET @rpmont_comando = IF(COALESCE(@rpmont_ok, 0)
    AND BINARY DATABASE() = BINARY 'rpmont_homologacao'
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.TABLES
        WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
          AND LOWER(TABLE_NAME) IN ('tb_inventario_mp', 'tb_movimentacao_material')
    ), @rpmont_ddl_material, 'RPMONT_ABORTAR_ANTES_DE_CRIAR_MATERIAL');
PREPARE rpmont_create_material FROM @rpmont_comando;
EXECUTE rpmont_create_material;
DEALLOCATE PREPARE rpmont_create_material;

SET @rpmont_ddl_movimento = '
CREATE TABLE `rpmont_homologacao`.`TB_movimentacao_material` (
    `ID` BIGINT NOT NULL AUTO_INCREMENT,
    `materialID` BIGINT NOT NULL,
    `tipoMovimentacao` ENUM(''CADASTRO'',''TRANSFERENCIA_SETOR'',''TRANSFERENCIA_UNIDADE'',
        ''ENVIO_MANUTENCAO'',''RETORNO_MANUTENCAO'',''BAIXA'',''DESCARTE'',
        ''EXTRAVIO'',''FURTO'',''REATIVACAO'',''AJUSTE_CADASTRAL'') NOT NULL,
    `setorOrigem` VARCHAR(50) NULL,
    `setorDestino` VARCHAR(50) NULL,
    `unidadeOrigem` VARCHAR(50) NULL,
    `unidadeDestino` VARCHAR(50) NULL,
    `situacaoAnterior` ENUM(''ATIVO'',''INATIVO'',''EM_MANUTENCAO'',''BAIXADO'',
        ''DESCARTADO'',''EXTRAVIADO'',''FURTADO'',''TRANSFERIDO'') NULL,
    `situacaoNova` ENUM(''ATIVO'',''INATIVO'',''EM_MANUTENCAO'',''BAIXADO'',
        ''DESCARTADO'',''EXTRAVIADO'',''FURTADO'',''TRANSFERIDO'') NULL,
    `motivo` VARCHAR(300) NULL,
    `observacao` VARCHAR(500) NULL,
    `numeroDocumento` VARCHAR(150) NULL,
    `usuarioID` BIGINT NOT NULL,
    `dataMovimentacao` DATETIME(6) NOT NULL,
    PRIMARY KEY (`ID`),
    KEY `idx_homolog_mov_material` (`materialID`),
    KEY `idx_homolog_mov_usuario` (`usuarioID`),
    CONSTRAINT `fk_homolog_mov_material` FOREIGN KEY (`materialID`)
        REFERENCES `rpmont_homologacao`.`TB_inventario_MP` (`ID`),
    CONSTRAINT `fk_homolog_mov_usuario` FOREIGN KEY (`usuarioID`)
        REFERENCES `rpmont_homologacao`.`usuarios_sistema` (`ID`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

SET @rpmont_comando = IF(COALESCE(@rpmont_ok, 0)
    AND BINARY DATABASE() = BINARY 'rpmont_homologacao'
    AND EXISTS (
        SELECT 1 FROM information_schema.TABLES
        WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
          AND BINARY TABLE_NAME = BINARY 'TB_inventario_MP' AND ENGINE = 'InnoDB'
    )
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.TABLES
        WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
          AND LOWER(TABLE_NAME) = 'tb_movimentacao_material'
    ), @rpmont_ddl_movimento, 'RPMONT_ABORTAR_ANTES_DE_CRIAR_MOVIMENTACAO');
PREPARE rpmont_create_movimento FROM @rpmont_comando;
EXECUTE rpmont_create_movimento;
DEALLOCATE PREPARE rpmont_create_movimento;

-- Resultado esperado: exatamente as duas tabelas, InnoDB, utf8mb4_0900_ai_ci.
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES
WHERE BINARY TABLE_SCHEMA = BINARY 'rpmont_homologacao'
  AND LOWER(TABLE_NAME) IN ('tb_inventario_mp', 'tb_movimentacao_material')
ORDER BY TABLE_NAME;

-- FALHA PARCIAL (sem remocao automatica):
-- 1. Pare no primeiro erro e preserve a mensagem/codigo sem credenciais.
-- 2. Em nova conexao local, execute SOMENTE a consulta de metadados acima.
-- 3. Zero tabelas: revisar a causa e as precondicoes antes de autorizar repeticao.
-- 4. Uma tabela: o primeiro DDL pode ja estar confirmado; nao execute este script
--    novamente. Inspecione colunas/chaves do objeto e prepare um script separado
--    revisado, apenas para completar o objeto ausente, mediante nova autorizacao.
-- 5. Duas tabelas: conferir metadados completos antes de autorizar os testes.
-- Nao ha rollback conjunto, exclusao automatica nem promessa de reversao de DDL.
