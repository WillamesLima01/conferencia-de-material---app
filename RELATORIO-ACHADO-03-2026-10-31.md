# Relatório do Achado 03 — JWT após bloqueio

Data: 31/10/2026. Numeração do acompanhamento: Achado 01 = isolamento patrimonial; Achado 02 = recuperação de senha; Achado 03 = JWT após bloqueio.

## Estado e conclusão

- Branch: `fix/jwt-usuario-bloqueado`.
- Base e HEAD antes do commit do Achado 03: `33f22fac78364dc0da795057d9de14b21c0a2012` (`33f22fa`), merge dos Achados 01 e 02 na main.
- Correção validada localmente. Ainda sem commit ou integração do Achado 03 na main, publicação de PR ou liberação para produção no momento deste registro.
- Não houve acesso a Aiven ou outros bancos remotos. Somente homologação local e dados sintéticos.
- Este relatório não altera nem substitui `CONTINUIDADE-AUDITORIA-2026-10-27.md`. Resultados históricos do computador do trabalho não são presumidos como reproduzidos neste PC.

## Causa e correção

O login já exigia usuário ativo e status LIBERADO. Porém, em requisições posteriores, JwtAuthenticationFilter validava assinatura/expiração do JWT, buscava o usuário pela matrícula e criava a autenticação sem verificar seu estado atual. Assim, um administrador bloqueado após a emissão ainda podia autenticar com o JWT válido. A proteção adicional existente nas consultas patrimoniais não resolvia a autenticação global.

A correção verifica o usuário retornado pelo repositório antes de definir a role e criar a autenticação:

- usuário deve existir;
- `Boolean.TRUE.equals(usuario.getAtivo())` deve ser verdadeiro;
- `StatusAcessoUsuario.LIBERADO.name().equalsIgnoreCase(usuario.getStatusAcesso())` deve ser verdadeiro.

A comparação é a mesma do login: ignora caixa, mas não remove espaços. Valores nulos, false, PENDENTE, BLOQUEADO, vazios, desconhecidos e LIBERADO com espaços externos são recusados. A regra inclui ADMIN_MASTER. Na recusa, o contexto de segurança é limpo e a cadeia continua sem autenticação criada pelo JWT. Nas rotas protegidas testadas, o tratamento existente respondeu 403 antes do controller, sem detalhes internos verificados pelos testes.

Não foram alterados mapeamento de roles, SecurityConfig, rotas públicas, permissões por rota, contratos do login, regras patrimoniais ou configurações da aplicação.

## Arquivos de implementação e testes

1. `conferencia-api/src/main/java/br/com/rpmont/conferencia/security/JwtAuthenticationFilter.java` — verificação global do estado atual.
2. `conferencia-api/src/test/java/br/com/rpmont/conferencia/security/JwtAuthenticationFilterTest.java` — 37 invocações unitárias; estados/roles, usuário ausente, token rejeitado e contexto de segurança.
3. `conferencia-api/src/test/java/br/com/rpmont/conferencia/security/JwtHttpSegurancaTest.java` — 64 invocações HTTP sem banco; cadeia, JwtService e controllers reais, repositório e serviços simulados.
4. `conferencia-api/src/test/java/br/com/rpmont/conferencia/security/JwtBloqueioMySqlIntegracaoTest.java` — 12 invocações com Usuario e UsuarioRepository reais no MySQL; serviços simulados.

O quinto arquivo para versionamento é este relatório: `RELATORIO-ACHADO-03-2026-10-31.md`. Relatórios target, arquivos DPAPI, SQL local de inicialização e utilitários temporários não fazem parte desse conjunto.

## Evidências finais, separadas por execução

Todos os grupos abaixo encerraram com BUILD SUCCESS, zero falhas, erros ou ignorados. As contagens são invocações JUnit, incluindo parâmetros; não representam número de métodos nem devem ser somadas como cobertura inédita.

| Execução | Classe | Tests run |
|---|---|---:|
| Achado 03 sem banco | JwtAuthenticationFilterTest | 37 |
| Achado 03 sem banco | JwtHttpSegurancaTest | 64 |
| **Subtotal sem banco do Achado 03** | | **101** |
| **Achado 03 MySQL** | JwtBloqueioMySqlIntegracaoTest | **12** |
| Regressão dos Achados 01 e 02 | MovimentacaoMaterialControllerIsolamentoTest | 4 |
| Regressão dos Achados 01 e 02 | MovimentacaoMaterialIsolamentoTest | 13 |
| Regressão dos Achados 01 e 02 | MovimentacaoMaterialSpecificationIsolamentoTest | 5 |
| Regressão dos Achados 01 e 02 | RecuperacaoSenhaServiceImplTest | 24 |
| Regressão dos Achados 01 e 02 | RecuperacaoSenhaTransacaoTest | 4 |
| Regressão dos Achados 01 e 02 | GlobalExceptionHandlerTest | 29 |
| Regressão dos Achados 01 e 02 | GlobalExceptionHandlerMvcTest | 22 |
| **Subtotal da regressão** | | **101** |
| **Regressão HTTP patrimonial** | PatrimonioHttpSegurancaIntegracaoTest | **26** |

| Grupo | Sufixo dos relatórios finais |
|---|---|
| Achado 03 sem banco | `achado03-sem-banco-20261031-06` |
| Achado 03 MySQL | `achado03-mysql-20261031-03` |
| Sete grupos de regressão | `achado03-regressao-20261031-01` |
| HTTP patrimonial | `achado03-patrimonio-http-20261031-01` |

Evidências locais em `conferencia-api/target/surefire-reports/`: `<pacote>.<Classe>-<sufixo>.txt` e `TEST-<pacote>.<Classe>-<sufixo>.xml`. Esses relatórios não são versionados nem garantidos em outro checkout. Não usar clean enquanto sua preservação for necessária.

Tentativas anteriores foram preservadas como diagnóstico, sem contagem adicional de aprovação: a execução sem banco -05 teve 37 aprovados e 64 erros de inicialização por propriedades sintéticas; a MySQL -01 teve 12 erros de injeção de EntityManager; a MySQL -02 teve 12 erros pelo tamanho do e-mail sintético. Os ajustes ocorreram apenas nos testes novos. Nenhuma expectativa de segurança foi enfraquecida e nenhum esquema foi adaptado para fazê-los passar.

## Comportamentos comprovados e regressão

- GET /usuario e GET /unidades: 200 para ADMIN e ADMIN_MASTER ativos/liberados; mesmo JWT passa a receber 403 após bloqueio, inativação ou remoção.
- Negativas sem execução dos controllers/serviços simulados; respostas verificadas contra JWT, sentinelas privadas e detalhes internos.
- No MySQL, cada alteração é confirmada em transação separada, com leitura posterior; requisições fora da transação da fixture e cache de segundo nível desabilitado.
- Após desbloqueio/reativação, o mesmo JWT volta a receber 200 enquanto válido.
- Tokens ausentes, malformados, com assinatura diferente e expirados foram recusados nos testes HTTP sem banco. Nulos e estados não autorizados foram cobertos sem violar as colunas NOT NULL do MySQL.
- A regressão patrimonial confirmou perfis, isolamento pela unidade atual, filtros por origem/destino, 403 após bloqueio e sanitização HTTP 400. As quatro categorias de diagnóstico de binding ficaram presente=false.
- Fixtures HTTP patrimoniais já criam usuários ativos e liberados. Usuários incompletos nos testes diretos de controller/recuperação e status com espaços no teste direto do serviço patrimonial não passam pelo filtro e não foram alterados.

## Homologação local preparada neste PC

- Container: `rpmont-mysql-homolog`; imagem `mysql:8.4`; servidor observado `8.4.13`.
- Publicação exclusiva: `127.0.0.1:3307 -> 3306/tcp`.
- Volume novo exclusivo: `rpmont-mysql-homolog-achado03-data`. Recursos de outros projetos preservados.
- Catálogo: `rpmont_homologacao`; usuário: `rpmont_teste`.
- URL autorizada exata: `jdbc:mysql://127.0.0.1:3307/rpmont_homologacao`.
- InnoDB, utf8mb4, utf8mb4_0900_ai_ci e lower_case_table_names=0.
- Primeiro foi criada somente usuarios_sistema, a partir dos 20 campos da entidade versionada. Metadados conferidos antes da persistência.
- Posteriormente, após confirmar ausência das tabelas patrimoniais, foi executado integralmente uma única vez neste PC o SQL versionado `conferencia-api/scripts/homologacao/001_criar_patrimonio_homologacao.sql`, em conexão nova com catálogo explícito e parada no primeiro erro. Criou TB_inventario_MP e TB_movimentacao_material, índices e FKs. Metadados de usuarios_sistema permaneceram iguais.
- As três tabelas existem após essa preparação. Não repetir o script patrimonial neste ambiente. A execução antiga no trabalho não foi usada como prova da existência aqui. DDL tem commits implícitos; não há rollback conjunto prometido.
- recuperacao_senha não foi criada. RecuperacaoSenhaIntegracaoTest ainda depende de preparação adicional; MovimentacaoMaterialMySqlIntegracaoTest não foi executado nesta etapa.

As senhas locais foram geradas aleatoriamente e protegidas com DPAPI CurrentUser em `%LOCALAPPDATA%\RPMont\homolog-achado03`, com ACL restrita ao usuário Windows. O arquivo `rpmont_teste.dpapi` permite recuperar somente a senha do usuário de testes, sem consultar variáveis do container. DPAPI exige o mesmo usuário/PC; em outro ambiente, fornecer credencial exclusiva da homologação local por mecanismo equivalente. A senha root não é necessária para os testes. O Docker mantém credenciais de inicialização na configuração interna do container, acessível a quem controla o daemon; essa configuração não foi consultada.

Os executores temporários usados neste PC não são necessários para reproduzir os testes. Os comandos abaixo usam Maven instalado e propriedades de ambiente. Não há senha, JWT real, chave privada ou conteúdo DPAPI neste documento.

## Comandos reproduzíveis

Pré-requisitos: JDK 25, Maven (utilizado 3.9.15), dependências do projeto e, somente nos dois grupos com banco, homologação já preparada. Executar a partir de `conferencia-api`. Não executar suíte completa ou ConferenciaApiApplicationTests. Usar sufixo novo em cada repetição para não sobrescrever evidências.

### Sem banco ou SMTP

PowerShell, sem carregar application-local/produção: as classes selecionadas usam mocks, chamadas diretas ou contexto MVC explícito sem persistência.

```powershell
$sufixo = 'achado03-sem-banco-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
mvn '-Dtest=JwtAuthenticationFilterTest,JwtHttpSegurancaTest' '-DfailIfNoTests=true' '-Djunit.jupiter.execution.parallel.enabled=false' "-Dsurefire.reportNameSuffix=$sufixo" '-P!native,!nativeTest' test
if ($LASTEXITCODE -ne 0) { throw 'Falha nos testes sem banco; preservar relatórios.' }

$sufixo = 'achado03-regressao-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
mvn '-Dtest=MovimentacaoMaterialControllerIsolamentoTest,MovimentacaoMaterialIsolamentoTest,MovimentacaoMaterialSpecificationIsolamentoTest,RecuperacaoSenhaServiceImplTest,RecuperacaoSenhaTransacaoTest,GlobalExceptionHandlerTest,GlobalExceptionHandlerMvcTest' '-DfailIfNoTests=true' '-Djunit.jupiter.execution.parallel.enabled=false' "-Dsurefire.reportNameSuffix=$sufixo" '-P!native,!nativeTest' test
if ($LASTEXITCODE -ne 0) { throw 'Falha na regressão; preservar relatórios.' }
```

### Com MySQL local e credencial DPAPI em memória

A função abaixo é uma alternativa em Windows PowerShell com DPAPI disponível. Não imprime nem passa segredos como argumentos. Recusa sobrescrever variáveis já existentes. Executar separadamente cada grupo, apenas quando autorizado.

```powershell
function Invoke-RpmontHomologTest {
    param(
        [ValidateSet('JwtBloqueioMySqlIntegracaoTest', 'PatrimonioHttpSegurancaIntegracaoTest')]
        [string]$Classe,
        [Parameter(Mandatory=$true)][string]$Sufixo
    )
    if ((Test-Path Env:RPMONT_HOMOLOG_DB_PASSWORD) -or
        (Test-Path Env:RPMONT_HOMOLOG_JWT_SECRET)) {
        throw 'Variáveis já existem; revisar sem imprimir seus valores.'
    }
    $senhaBytes = $null
    $jwtBytes = New-Object byte[] 48
    $rng = $null
    try {
        Add-Type -AssemblyName System.Security
        $arquivo = Join-Path $env:LOCALAPPDATA 'RPMont\homolog-achado03\rpmont_teste.dpapi'
        $senhaBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
            [System.IO.File]::ReadAllBytes($arquivo), $null,
            [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
        $env:RPMONT_HOMOLOG_DB_PASSWORD = [System.Text.Encoding]::UTF8.GetString($senhaBytes)
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($jwtBytes)
        $env:RPMONT_HOMOLOG_JWT_SECRET = [Convert]::ToBase64String($jwtBytes)
        mvn "-Dtest=$Classe" '-DfailIfNoTests=true' '-Djunit.jupiter.execution.parallel.enabled=false' "-Dsurefire.reportNameSuffix=$Sufixo" '-P!native,!nativeTest' test
        if ($LASTEXITCODE -ne 0) { throw 'Falha no teste MySQL; preservar evidências e não alterar expectativas.' }
    } finally {
        Remove-Item Env:RPMONT_HOMOLOG_DB_PASSWORD -ErrorAction SilentlyContinue
        Remove-Item Env:RPMONT_HOMOLOG_JWT_SECRET -ErrorAction SilentlyContinue
        if ($null -ne $senhaBytes) { [Array]::Clear($senhaBytes, 0, $senhaBytes.Length) }
        [Array]::Clear($jwtBytes, 0, $jwtBytes.Length)
        if ($null -ne $rng) { $rng.Dispose() }
        $senhaBytes = $null
        $jwtBytes = $null
    }
}

# Executar apenas o grupo desejado/autorizado, cada qual com seu sufixo novo:
Invoke-RpmontHomologTest -Classe JwtBloqueioMySqlIntegracaoTest -Sufixo ('achado03-mysql-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
Invoke-RpmontHomologTest -Classe PatrimonioHttpSegurancaIntegracaoTest -Sufixo ('achado03-patrimonio-http-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
```

Os comandos Maven efetivamente usados tiveram as mesmas seleções explícitas e opções, com os sufixos finais registrados na tabela acima; a credencial foi fornecida por executor .NET em memória, pois PowerShell não iniciou na ferramenta deste PC. A alternativa PowerShell acima foi revisada, mas não executada nesta auditoria. Não confundir receita de reprodução com evidência de uma nova execução.

A classe MySQL nova verifica perfil exclusivo homolog, URL exata, usuário, configuração explícita, ausência de imports/localizações adicionais e validate antes de refresh; o DataSource confirma URL e catálogo antes da EntityManagerFactory. Carrega somente Usuario e UsuarioRepository, sem Boot auto-configuration ou SMTP. O HTTP patrimonial usa o initializer versionado da fixture, localização exclusiva application-homolog.properties, perfil homolog, validate e EmailService simulado.

Na execução HTTP patrimonial, o Boot registrou uma senha automática efêmera de desenvolvimento do usuário em memória. Ela não é a credencial MySQL nem o segredo JWT e não é reproduzida neste relatório. Esse log deve ser considerado em futura revisão do contexto de teste, sem alterar retrospectivamente a evidência.

## Limpeza e preservação

- No grupo MySQL do Achado 03, @AfterEach remove somente IDs capturados, confere a matrícula da fixture antes de excluir e verifica ausência em outra transação. Os 12 cenários registraram confirmação de limpeza.
- Na regressão HTTP patrimonial, a fixture remove somente IDs sintéticos capturados, na ordem movimentos, materiais e usuários, e verifica ausência. As assertions de limpeza passaram nos 26 cenários, sem erros de teardown. Não foi feita varredura geral independente nem consulta de registros de terceiros.
- Credencial/JWT foram temporários em memória; buffers foram limpos e referências/variáveis do executor removidas em finally. Strings gerenciadas não permitem prometer apagamento físico imediato de todas as cópias.
- Containers, volumes, esquema e credenciais DPAPI locais foram preservados. Os quatro arquivos validados não foram alterados durante a criação deste relatório; o relatório histórico também deve permanecer intacto.

## Limitações e pendências

1. Bloqueio é condicionado ao estado atual. Após desbloqueio/reativação, o JWT antigo volta a funcionar enquanto válido. Não há revogação permanente por versão, marco temporal ou lista de revogação.
2. A identidade continua sendo buscada pela matrícula. Recriar conta com a mesma matrícula pode permitir reutilização de JWT anterior; não há comparação com o ID do claim nesta correção mínima.
3. MockMvc com cadeia real não certifica servidor HTTP externo, proxy, integração frontend, transporte ou implantação de produção.
4. Serviços de /usuario e /unidades são simulados nos testes novos; eles demonstram a barreira global, não certificam as regras internas desses serviços.
5. A homologação foi derivada das entidades; equivalência integral com o esquema de produção não foi comprovada.
6. Nenhuma suíte completa foi executada, e os riscos remanescentes dos Achados 01 e 02 não foram encerrados por esta correção.
7. Correção validada localmente, ainda sem integração na main e sem liberação para produção. Commit, push, PR e merge dependem de etapas posteriores autorizadas.

Este documento registra as evidências existentes. Nenhum teste ou build foi executado para produzi-lo.
