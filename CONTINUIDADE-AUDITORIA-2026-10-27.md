# Continuidade da auditoria pre-producao RPMont

Registro de encerramento de 27/10/2026. Retomar em **28/10/2026**, neste mesmo computador, a partir deste estado. Nao reiniciar a auditoria nem iniciar o Achado 03.

## Estado do Git e integracao

- Repositorio: `D:\conferencia-de-material---app`.
- Branch atual: `integracao/achados-01-02`.
- HEAD: `96dda2b1a13f45eb5f7f3879cf9395c8ed20f1ef`.
- Pais do commit de integracao: `dd15f017790dd1692a23f01f1a269bf0c0db3168` e `1e550407ea6cdb83992910f1b27a5631875bdb26`.
- Base revisada de `main`: `1757a358054e1192c5a5042e0afa8ba8f01a259e`.
- Recuperacao de senha integrada primeiro por fast-forward; isolamento patrimonial integrado depois, sem conflitos e preservando commits originais.
- A branch de integracao nao foi publicada. Nao houve merge na main nem alteracoes no PR.
- Staging vazio. Nenhum arquivo rastreado foi modificado nesta etapa.
- Este relatorio e um quinto arquivo novo, alem dos quatro arquivos de trabalho listados abaixo; nenhum foi adicionado ao staging.

### Quatro arquivos de trabalho novos, ainda nao rastreados

1. `conferencia-api/scripts/homologacao/001_criar_patrimonio_homologacao.sql`
2. `conferencia-api/src/test/java/br/com/rpmont/conferencia/support/PatrimonioHomologacaoFixture.java`
3. `conferencia-api/src/test/java/br/com/rpmont/conferencia/security/PatrimonioHttpSegurancaIntegracaoTest.java`
4. `conferencia-api/src/test/java/br/com/rpmont/conferencia/service/MovimentacaoMaterialMySqlIntegracaoTest.java`

Preservar os quatro arquivos e as expectativas atuais. Nao adaptar expectativas apenas para obter aprovacao.

## Evidencias anteriores: 185 verificacoes aprovadas na integracao

| Classe | Aprovacoes |
|---|---:|
| RecuperacaoSenhaServiceImplTest | 24 |
| RecuperacaoSenhaTransacaoTest | 4 |
| EmailServiceImplTest | 14 |
| GlobalExceptionHandlerTest | 27 |
| GlobalExceptionHandlerMvcTest | 22 |
| SmtpTimeoutConfiguracaoTest | 4 |
| MovimentacaoMaterialControllerIsolamentoTest | 4 |
| MovimentacaoMaterialIsolamentoTest | 13 |
| MovimentacaoMaterialSpecificationIsolamentoTest | 5 |
| EmpacotamentoSeguroTest | 35 |
| EmpacotamentoSeguroIT | 1 |
| RecuperacaoSenhaIntegracaoTest | 32 |
| **Total** | **185** |

As primeiras 153 verificacoes passaram em `verify`; as 32 de recuperacao passaram depois, no MySQL local. Zero falhas, erros e ignorados nesses grupos. As 159 verificacoes historicas anteriores a integracao permanecem como evidencia separada e sobreposta; nao somar os totais como cobertura distinta.

Relatorios TXT das primeiras 152 verificacoes: `conferencia-api/target/surefire-reports/`, nomes `br.com.rpmont.conferencia.<pacote>.<Classe>-integracao-achados-01-02.txt`.

Relatorio do JAR: `conferencia-api/target/failsafe-reports/br.com.rpmont.conferencia.config.EmpacotamentoSeguroIT-integracao-achados-01-02.txt`.

Relatorio dos 32 testes MySQL: `conferencia-api/target/surefire-reports/br.com.rpmont.conferencia.service.RecuperacaoSenhaIntegracaoTest-achados-01-02-mysql-20261027-112730.txt`.

## Testes adicionais: resultado ainda nao aprovado

Somente `PatrimonioHttpSegurancaIntegracaoTest` e `MovimentacaoMaterialMySqlIntegracaoTest` foram selecionados. Nao executar a suite completa nem `ConferenciaApiApplicationTests`.

| Classe | Cenarios | Aprovados | Falhas | Erros | Ignorados |
|---|---:|---:|---:|---:|---:|
| PatrimonioHttpSegurancaIntegracaoTest | 23 | 20 | 3 | 0 | 0 |
| MovimentacaoMaterialMySqlIntegracaoTest | 14 | 12 | 2 | 0 | 0 |
| **Total adicional** | **37** | **32** | **5** | **0** | **0** |

Resultado final da execucao adicional: **BUILD FAILURE**. Nao considerar as lacunas encerradas nem o conjunto aprovado.

### Cinco testes com falha

| Classe / metodo | Evidencia |
|---|---|
| PatrimonioHttpSegurancaIntegracaoTest.filtrosNaoAmpliamAcesso | Esperava lista vazia; retornaram duas movimentacoes de materiais da propria unidade. |
| PatrimonioHttpSegurancaIntegracaoTest.adminMasterConsultaGlobalEFiltra | Esperava um resultado; retornaram tres. |
| MovimentacaoMaterialMySqlIntegracaoTest.filtrosExternosNaoUltrapassamUnidade | A expectativa de lista vazia falhou. |
| MovimentacaoMaterialMySqlIntegracaoTest.adminMasterConsultaAmbasUnidadesEAplicaFiltro | Esperava uma movimentacao; retornaram tres. |
| PatrimonioHttpSegurancaIntegracaoTest.parametroInvalidoRecebe400Sanitizado | HTTP 400 confirmado, mas a assertion detectou fragmento proibido no corpo da resposta. |

As primeiras quatro falhas compartilham uma divergencia semantica: `MovimentacaoMaterialSpecification.java`, linhas 161-185, aplica o filtro `unidade` a `unidadeOrigem OR unidadeDestino` da movimentacao. Os testes esperavam filtragem pela unidade atual do material. As fixtures incluem transferencias entre ambas as unidades. A restricao obrigatoria de acesso pela unidade atual do material e separada do filtro opcional.

Essas quatro falhas, por si, nao comprovam vazamento de materiais externos. A premissa do planejamento deve ser esclarecida com o usuario antes de mudar expectativas ou producao. Preservar os testes vermelhos e a evidencia.

Na quinta falha, `GlobalExceptionHandler.java`, linhas 121-149, copia `FieldError.getDefaultMessage()` para a resposta. Isso pode transportar detalhes de conversao. O fragmento exato ainda nao foi capturado: a assertion e agregada e o relatorio nao preservou o corpo HTTP completo. Nao afirmar qual foi o fragmento nem que houve vazamento de credencial. Investigar com instrumentacao minima, sem expor JWT, senhas, hashes ou dados de terceiros.

### Relatorios adicionais preservados

Diretorio: `conferencia-api/target/surefire-reports/`.

Execucao apos preparacao do esquema:

- `br.com.rpmont.conferencia.security.PatrimonioHttpSegurancaIntegracaoTest-patrimonio-adicional-20261027-114641.txt`
- `br.com.rpmont.conferencia.service.MovimentacaoMaterialMySqlIntegracaoTest-patrimonio-adicional-20261027-114641.txt`
- XML correspondentes: mesmos nomes, prefixo `TEST-` e extensao `.xml`.

Primeira execucao, anterior a criacao das tabelas: sufixo `patrimonio-adicional-20261027-113535`, para as mesmas duas classes. Foram 37 erros de inicializacao por tabela patrimonial ausente; nenhum dado sintetico foi criado nessa tentativa. Preservar tambem esses TXT/XML, sem confundi-los com o resultado funcional posterior.

Comando da execucao funcional, a partir de `conferencia-api` (credencial e JWT fornecidos somente pelo ambiente em memoria):

```powershell
.\mvnw.cmd `
  "-Dtest=PatrimonioHttpSegurancaIntegracaoTest,MovimentacaoMaterialMySqlIntegracaoTest" `
  "-DfailIfNoTests=true" `
  "-Djunit.jupiter.execution.parallel.enabled=false" `
  "-Dsurefire.reportNameSuffix=patrimonio-adicional-20261027-114641" `
  "-Dspring.test.context.failure.threshold=1" `
  "-P!native,!nativeTest" test
```

Para futura repeticao autorizada, usar sufixo novo. Nao executar `clean`: os relatorios locais sao evidencias ainda nao versionadas.

## Ambiente local e esquema: NAO repetir o script

- Container: `rpmont-mysql-homolog`; imagem `mysql:8.4`; estava em execucao.
- Publicacao: `127.0.0.1:3307 -> 3306/tcp`.
- URL exclusiva: `jdbc:mysql://127.0.0.1:3307/rpmont_homologacao`.
- Perfil `homolog` explicito; carregamento apenas de `application-homolog.properties`; `ddl-auto=validate`.
- `lower_case_table_names=0`: preservar a capitalizacao exata.
- Engine InnoDB; charset utf8mb4; collation utf8mb4_0900_ai_ci.
- Usuario local autorizado: `rpmont_teste`. Nenhuma senha esta registrada neste relatorio.
- Credencial obtida somente em memoria da configuracao de inicializacao autorizada do container, verificando correspondencia de MYSQL_USER e presenca de MYSQL_PASSWORD. Nao tentar outras senhas nem redefinir credenciais.
- JWT temporario gerado em memoria. SMTP simulado por EmailService mock; nenhum e-mail real enviado.
- JAVA_HOME usado apenas no processo: `C:\Users\PMPB\.jdks\loom-ea-25-loom+1-11`; Maven Wrapper 3.9.16.

O script `001_criar_patrimonio_homologacao.sql` foi executado **uma unica vez e com sucesso**, em conexao nova, com parada no primeiro erro. As tabelas ja existem:

1. `TB_inventario_MP`: PK ID BIGINT com sinal, AUTO_INCREMENT.
2. `TB_movimentacao_material`: PK ID BIGINT com sinal, AUTO_INCREMENT; indices de materialID e usuarioID; FKs para TB_inventario_MP.ID e usuarios_sistema.ID.

Metadados de colunas, tipos, nulabilidade, engine, collation, indices e FKs conferidos apos o DDL. As tabelas preexistentes usuarios_sistema e recuperacao_senha nao foram alteradas. Nenhuma criacao parcial ocorreu. O Hibernate passou da validacao de esquema para a execucao dos testes.

**NAO executar novamente o script de criacao.** O cabecalho do arquivo diz que foi preparado e nao executado; esse comentario ficou historico e nao foi editado. Este registro documenta a execucao efetiva. DDL MySQL tem commits implicitos e nao ha rollback conjunto prometido.

## Limpeza e seguranca

- Na execucao funcional, @AfterEach removeu somente os IDs sinteticos capturados, na ordem movimentacoes, materiais, usuarios.
- As verificacoes de ausencia desses IDs passaram nos 37 cenarios, inclusive nos cinco com assertions falhas. Zero erros de limpeza reportados.
- Confirmacao baseada nas assertions de limpeza; nao foi feita varredura geral independente dos registros do banco.
- Variaveis temporarias de senha, JWT e JAVA_HOME removidas ao terminar; bytes aleatorios do JWT limpos. Strings Java/.NET sao gerenciadas pelo runtime: nao ha promessa de apagamento fisico imediato de toda copia da memoria.
- Nao abrir arquivos .env, application-local.properties ou credenciais reais; nao acessar Aiven ou outros bancos remotos.
- Nao registrar segredos nos relatorios, comandos, chat ou arquivos. A credencial nunca foi passada como argumento de linha de comando.

## Proximos passos para 28/10/2026

1. Ler este relatorio e reconfirmar branch, HEAD, staging e arquivos novos. Preservar tudo; nao trocar branches ou integrar outras alteracoes sem autorizacao.
2. Esclarecer a regra do filtro `unidade`: origem/destino do movimento ou unidade atual do material? Separar essa decisao da restricao obrigatoria de acesso.
3. Capturar precisamente, em cenario sintetico controlado, o fragmento proibido na resposta HTTP 400. Nao reproduzir tokens, credenciais ou corpos reais. Propor correcao somente apos diagnostico e autorizacao.
4. Manter as cinco falhas e relatorios como evidencia. Nao enfraquecer testes para obter aprovacao.
5. Apos decisao e autorizacao, executar somente os grupos necessarios com sufixos novos, sem repetir o DDL nem apagar relatorios.
6. Revisar os arquivos novos e seu versionamento somente depois da resolucao e homologacao. Nao fazer commit, push, merge ou alterar o PR sem autorizacao especifica.

## Demais riscos e pendencias preservados

- SMTP continua sincrono antes do commit: pode haver envio seguido de rollback. Timeouts de 5 segundos por operacao mitigam bloqueio prolongado, mas nao garantem prazo total nem entrega atomica. After-commit/outbox nao implementados.
- Enumeracao de usuarios na recuperacao: respostas deliberadas e diferencas de status, incluindo 429, ainda exigem revisao de contrato separada.
- Falhas do filtro JWT ocorrem fora do handler MVC; bloqueio posterior ao token foi exercitado somente nas consultas patrimoniais. Isso nao encerra o Achado 03.
- Possivel autorizacao indevida de escrita de Comando/Subcomando: pendencia separada, sem numeracao atribuida e sem correcao nesta etapa. A regra e consulta ao historico da propria unidade, sem alteracao de materiais. GETs sem escrita passaram; bloqueio das rotas de escrita nao foi certificado.
- Teste de transferencia caracteriza acesso pela unidade atual; nao resolve a decisao de negocio sobre manutencao de acesso historico pela unidade de origem.
- Normalizacao adicional cobre apenas espacos externos e maiusculas/minusculas ASCII; nao certifica equivalencia de acentos/Unicode/collation para autorizacao.
- Esquema local derivado das entidades, sem DDL/migrations versionados de producao: equivalencia com producao nao comprovada.
- MockMvc usa cadeia real de seguranca, controllers, servico, repositories e handler, mas nao servidor HTTP externo, proxy reverso ou fluxo frontend completo.
- A aplicacao inteira nao esta liberada para producao. A integracao local nao foi incorporada a main.
- PR #1: https://github.com/WillamesLima01/conferencia-de-material---app/pull/1 ; ultimo estado consultado: aberto, base main em 1757a35, head dd15f01. Nao atualizado nesta etapa; conferir novamente quando autorizado.
- Branches originais preservadas: fix/rollback-recuperacao-senha em dd15f01 e fix/isolamento-movimentacoes-patrimoniais em 1e55040.
- Foram observados espacos finais preexistentes em RecuperacaoSenhaServiceImplTest.java, linhas 152 e 212; nao alterados.

Encerramento solicitado pelo usuario: nenhum novo teste executado para produzir este relatorio, nenhum codigo ou expectativa alterado, nenhum commit/push/merge realizado.

## Atualizacao de 28/10/2026 — etapa autorizada em andamento

O usuario confirmou o contrato: autorizacao pela unidade atual do material; filtro
opcional por origem OU destino da movimentacao. As expectativas dos dois testes
adicionais foram ajustadas a esse contrato, com IDs exatos. Os quatro casos de
filtro em cada classe passaram a invocacoes JUnit independentes. Os cenarios de
ADMIN_MASTER incluem uma terceira unidade, sem correspondencia com o filtro,
para comprovar que o filtro efetivamente exclui movimentos nao correspondentes.

O cenario HTTP 400 foi instrumentado com categorias fixas e booleanos para
JAVA_LANG, TIPO_STRING, TIPO_LONG e VALOR_REJEITADO. Nao imprime corpo, JWT,
senha ou valores do ambiente; as assertions permanecem exigindo ausencia de
detalhes internos e do valor rejeitado, agora agrupadas para verificar ambos.

A tentativa de iniciar esse cenario parou ANTES da obtencao de credenciais ou
conexao: o endpoint Docker Desktop Linux nao existia. Foi solicitada ao usuario
a inicializacao do Docker. Nao houve execucao de teste MySQL nessa tentativa,
nem repeticao do script SQL. Variaveis temporarias foram removidas pelo finally.

Enquanto isso, foram executados somente GlobalExceptionHandlerTest (27) e
GlobalExceptionHandlerMvcTest (22), isolados de banco/SMTP: **49 aprovados**, zero
falhas, erros ou ignorados, BUILD SUCCESS. A compilacao incluiu os testes novos
modificados. Relatorios TXT/XML preservados em target/surefire-reports, sufixo
`handler-baseline-20261028-104349`. Sao evidencias novas de baseline, sem alterar
a contagem historica das 185 verificacoes nem reclassificar as cinco falhas antigas.

GlobalExceptionHandler ainda NAO foi alterado: aguarda confirmacao dinamica da
exposicao pelo cenario HTTP 400. Apos o Docker estar disponivel, continuar a
autorizacao vigente: diagnostico isolado; se confirmado, sanitizacao minima de
binding/conversao preservando validacao deliberada; selecao explicita das duas
classes adicionais e dos dois grupos existentes do handler; novos sufixos e
conferencia da limpeza sintetica. Nao repetir DDL, nao fazer commit/push/merge.

Pendencia de frontend, sem alteracao nesta etapa: ConsultaMovimentacoes.jsx
rotula o seletor apenas como "Unidade", sem indicar origem/destino; fica fixo na
unidade do usuario local e permite todas as unidades para ADMIN_MASTER. Propor
esclarecimento de rotulo/ajuda e avaliar separadamente o preenchimento automatico
do filtro, que pode restringir historicos autorizados de materiais transferidos.

## Conclusao da etapa de 28/10/2026 — filtros e HTTP 400

O Docker ficou disponivel: rpmont-mysql-homolog, mysql:8.4, running,
127.0.0.1:3307 -> 3306/tcp. Nao foi necessario iniciar/recriar container e o
script SQL NAO foi repetido.

Diagnostico ANTES da correcao: executado somente
PatrimonioHttpSegurancaIntegracaoTest#parametroInvalidoRecebe400Sanitizado.
Sufixo dos relatorios: `diagnostico-http400-20261028-104841`.
Resultado: 1 teste, 1 falha, 0 erros, 0 ignorados. As categorias JAVA_LANG,
TIPO_STRING, TIPO_LONG e VALOR_REJEITADO foram todas `presente=true`.
Isso confirma detalhes internos java.lang.String/java.lang.Long e reproducao do
valor sintetico rejeitado no corpo HTTP 400. Nao foi falso positivo da verificacao.
Nao foram impressos corpo completo, JWT ou credenciais. O relatorio vermelho
permanece preservado como evidencia anterior a correcao.

Correcao minima em GlobalExceptionHandler: para FieldError.isBindingFailure()
verdadeiro, fields recebe mensagem publica fixa `Valor inválido.`; para validacao
deliberada, preserva getDefaultMessage(). HTTP 400 e estrutura ApiError preservados.
GlobalExceptionHandlerTest recebeu 2 casos adicionais (typeMismatch e
methodInvocation), com binding e validacao deliberada na mesma resposta e
verificacao de ausencia de detalhes nos logs.

Validacao final, selecao explicita das quatro classes:

| Classe | Aprovados | Falhas | Erros | Ignorados |
|---|---:|---:|---:|---:|
| GlobalExceptionHandlerMvcTest | 22 | 0 | 0 | 0 |
| GlobalExceptionHandlerTest | 29 | 0 | 0 | 0 |
| PatrimonioHttpSegurancaIntegracaoTest | 26 | 0 | 0 | 0 |
| MovimentacaoMaterialMySqlIntegracaoTest | 17 | 0 | 0 | 0 |
| **Total final desta execucao** | **94** | **0** | **0** | **0** |

BUILD SUCCESS. Os 37 cenarios adicionais anteriores passaram a 43 porque os
dois lacos de filtros foram separados em quatro invocacoes independentes cada.
Expectativas alinhadas ao contrato confirmado pelo usuario, IDs exatos e ausencia
de materiais externos mantidos. A terceira unidade nos cenarios ADMIN_MASTER
comprova que o filtro exclui movimentos nao correspondentes.

Depois da correcao, as quatro categorias do diagnostico HTTP 400 retornaram
`presente=false`; o teste tambem exige fields.materialId = `Valor inválido.`.

Relatorios finais em `conferencia-api/target/surefire-reports/`, sufixo
`validacao-binding-filtros-20261028-105019`, para as quatro classes acima;
TXT e XML (XML com prefixo TEST-). Nenhum relatorio anterior foi apagado.

Comando final (na pasta conferencia-api; credencial e JWT somente em memoria):

```powershell
.\mvnw.cmd `
  "-Dtest=PatrimonioHttpSegurancaIntegracaoTest,MovimentacaoMaterialMySqlIntegracaoTest,GlobalExceptionHandlerTest,GlobalExceptionHandlerMvcTest" `
  "-DfailIfNoTests=true" `
  "-Djunit.jupiter.execution.parallel.enabled=false" `
  "-Dsurefire.reportNameSuffix=validacao-binding-filtros-20261028-105019" `
  "-Dspring.test.context.failure.threshold=1" `
  "-P!native,!nativeTest" test
```

A limpeza por IDs e as assertions de ausencia passaram nos 43 cenarios com banco
da validacao final e tambem no diagnostico vermelho anterior a correcao. Nenhum erro de limpeza.
Confirmacao baseada em @AfterEach, sem varredura geral de dados preexistentes.
Credenciais/JWT/JAVA_HOME temporarios removidos no finally; nenhuma falha de
autenticacao detectada. Somente homologacao local, ddl-auto=validate e EmailService
simulado. Nao houve envio SMTP real, acesso Aiven, alteracao de frontend ou DDL.

Contagens separadas: 185 verificacoes anteriores; 37 adicionais antigos com
32 aprovados/5 falhas; baseline de hoje 49 aprovados; diagnostico anterior a
correcao 1 falha; validacao final de hoje 94 aprovados. Sao execucoes com
sobreposicao: nao somar como testes distintos nem declarar suite completa aprovada.

As cinco falhas antigas estao tratadas por contrato de filtro confirmado e pela
sanitizacao comprovada. Nao significa liberacao geral de producao ou encerramento
do Achado 03. Permanecem a ambiguidade do rotulo Unidade no frontend, permissao de
escrita de Comando/Subcomando nao certificada, SMTP antes do commit, enumeracao de
usuarios, limites do filtro JWT e demais riscos descritos acima.

Estado ao concluir: branch integracao/achados-01-02, HEAD 96dda2b1 inalterado;
staging vazio. Modificados rastreados: GlobalExceptionHandler.java e
GlobalExceptionHandlerTest.java. Preservados os cinco arquivos nao rastreados
(relatorio, SQL e tres arquivos de testes). Nenhum commit/push/merge realizado.
