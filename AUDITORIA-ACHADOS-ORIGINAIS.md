# Auditoria RPMont — achados originais e proposta do Achado 04

Data desta consolidação documental: 01/11/2026.

## 1. Natureza e integridade deste documento

Este documento preserva os 23 achados da auditoria original recuperados do histórico desta sessão.

Os títulos, gravidades, classificações, locais e evidências da seção 2 são registros históricos. Não representam uma nova auditoria nem uma afirmação de que todos os problemas continuam presentes após as integrações posteriores.

As referências de linha correspondem ao código examinado na auditoria original e podem ter mudado.

A conclusão original foi:

> Não recomendo liberar o RPMont para produção no estado inspecionado.

A auditoria original foi realizada por inspeção estática e leitura local, sem execução de testes, builds, migrations ou conexões ao banco e a serviços externos.

As integrações posteriores estão registradas separadamente na seção 3. A análise e a proposta referentes ao Achado 04 estão na seção 4 e não devem ser confundidas com a evidência histórica.

Não há lacuna de contexto para a lista: os 23 registros originais foram recuperados nesta sessão. A proposta de versionamento de MaterialPatrimonial indevidamente associada ao Achado 04 foi excluída deste conteúdo corrigido.

## 2. Registro histórico dos 23 achados originais

Os caminhos backend abaixo pertencem ao módulo conferencia-api. Os caminhos frontend pertencem ao módulo rpmont-conferencia-app, exceto quando indicado de outra forma.

### Achado 01 — IDOR e ausência de isolamento nas movimentações patrimoniais

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/MovimentacaoMaterialServiceImpl.java:443, métodos das linhas 443–523.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/controller/MovimentacaoMaterialController.java:30.
- Evidência original:

> o histórico busca o material pelo ID e retorna suas movimentações. A listagem aplica apenas os filtros recebidos. Ambos verificam somente se a identificação recebida está preenchida; não validam setor, status de acesso ou unidade do usuário. A configuração geral exige apenas autenticação para essas rotas.

### Achado 02 — Limite de tentativas de recuperação de senha é revertido pela transação

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/RecuperacaoSenhaServiceImpl.java:122, linhas 169, 638–699.
- Evidência original:

> validarCodigo e redefinirSenha são transacionais. Um código incorreto incrementa e salva tentativas, mas em seguida lança ResponseStatusException, uma exceção de execução. Não há configuração para preservar essa gravação.

### Achado 03 — Administrador bloqueado continua autorizado com JWT existente

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/security/JwtAuthenticationFilter.java:50.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/UsuarioServiceImpl.java:620.
- Evidência original:

> o filtro autentica qualquer usuário encontrado, sem verificar ativo ou statusAcesso. Na administração de usuários, getUsuarioLogado e as verificações de permissão também não fazem essas verificações.

### Achado 04 — Troca de senha não revoga sessões existentes

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/security/JwtService.java:28.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/RecuperacaoSenhaServiceImpl.java:753.
- Evidência original:

> redefinir senha atualiza somente a senha e a data de modificação. A validação JWT verifica assinatura e expiração, sem versão de sessão ou comparação com a alteração da senha. A configuração local define validade de 24 horas.

### Achado 05 — Saídas de feno/ração ignoram restrições de setor

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/MovimentacaoFenoRacaoServiceImpl.java:64, linhas 1550–1582.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/EstoqueFenoRacaoServiceImpl.java:1352.
- Evidência original:

> registrarSaida verifica usuário ativo, liberado e com unidade preenchida, mas não setor ou nível. A consulta de estoque, por sua vez, restringe usuários comuns a Baia/Fiscal-de-dia e unidades equinas. Consultas de movimentações também utilizam a validação mais permissiva.

### Achado 06 — Atualizações de estoque sem controle explícito de concorrência

- Gravidade original: ALTA.
- Classificação original: Risco.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/MovimentacaoFenoRacaoServiceImpl.java:86, linhas 114–142 e 1240–1274.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/SolicitacaoTransferenciaFenoRacaoServiceImpl.java:723.
- Evidência original:

> os fluxos leem o saldo, calculam em memória e gravam o novo valor. Não foram encontrados @Version, @Lock ou atualizações condicionais de saldo nesses caminhos.

### Achado 07 — Comandos de estoque sem idempotência

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/MovimentacaoFenoRacaoServiceImpl.java:64.
  - rpmont-conferencia-app/src/services/api.js:103, linhas 146–155.
- Evidência original:

> cada chamada válida de saída cria uma nova movimentação e reduz o estoque. Não há identificador único da operação. O cliente aborta após dez segundos e orienta tentar novamente.

### Achado 08 — Aprovação de transferência contradiz o mapeamento JPA

- Gravidade original: ALTA.
- Classificação original: Comprovado; execução pendente.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/SolicitacaoTransferenciaFenoRacaoServiceImpl.java:659.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/model/TransferenciaFenoRacao.java:62.
- Evidência original:

> a aprovação constrói o registro principal com loteOrigem(null) e loteDestino(null) e o salva. As respectivas colunas estão declaradas com nullable = false.

### Achado 09 — Edição genérica contorna controles de conferência e histórico de transferência

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/MaterialPatrimonialServiceImpl.java:403, linhas 410–430.
  - Contraste com linhas 618–623 e 1277–1339 do mesmo arquivo.
- Evidência original:

> atualizar altera diretamente setor e conferido. Não registra transferência e não exige as verificações administrativas e de senha usadas em zerarConferencia.

### Achado 10 — Edição de usuário permite alterar unidade sem validar o destino

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/UsuarioServiceImpl.java:240, linhas 607–617 e 787–827.
- Evidência original:

> a autorização verifica a unidade atual do usuário alvo. Depois, preencherDadosAdministrativos aplica livremente dto.unidade() e dto.setor(), sem validar existência, vínculo ou destino.

### Achado 11 — Política de senhas fraca e inconsistente

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/AuthServiceImpl.java:108.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/UsuarioServiceImpl.java:529, linhas 588–596.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/dtos/UsuarioAdminRequestDTO.java:15.
- Evidência original:

> cadastro e recuperação aceitam quatro caracteres; a edição administrativa não reaplica o mínimo. O login também aceita comparação direta de senha quando o conteúdo armazenado não tem prefixo BCrypt.

### Achado 12 — JWT persistido em armazenamento acessível ao JavaScript

- Gravidade original: MÉDIA.
- Classificação original: Risco.
- Locais originais:
  - rpmont-conferencia-app/src/pages/Login.jsx:129.
  - rpmont-conferencia-app/src/services/api.js:97.
- Evidência original:

> o token é gravado e recuperado de localStorage, inclusive na aplicação Capacitor.

### Achado 13 — Transporte HTTP permitido e configurado no cliente local

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - rpmont-conferencia-app/capacitor.config.json:5.
  - rpmont-conferencia-app/android/app/src/main/AndroidManifest.xml:11.
  - rpmont-conferencia-app/src/services/api.js:1.
  - rpmont-conferencia-app/.env.local:2.
- Evidência original:

> allowMixedContent=true, cleartext=true, usesCleartextTraffic=true, fallback HTTP e URL local de API configurada com HTTP.

### Achado 14 — Perfil local ativo por padrão e segredos literais no arquivo local

- Gravidade original: ALTA.
- Classificação original: Comprovado; exposição não demonstrada.
- Locais originais:
  - conferencia-api/src/main/resources/application.properties:6.
  - conferencia-api/src/main/resources/application-local.properties:7–8,17.
- Evidência original:

> o perfil padrão é local; o arquivo local contém credenciais de banco e chave JWT literais.

- Limite originalmente registrado:

> o arquivo está listado no .gitignore. Isso não comprova exposição ou versionamento; o histórico Git não foi auditado.

### Achado 15 — Inicialização registra parte da credencial SMTP

- Gravidade original: ALTA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/EmailServiceImpl.java:33, linhas 56–66 e 108–110.
- Evidência original:

> o diagnóstico de inicialização imprime o login, o tamanho da chave e seus seis últimos caracteres.

### Achado 16 — Conexão JDBC exige criptografia sem exigir identidade do servidor

- Gravidade original: MÉDIA.
- Classificação original: Risco.
- Locais originais:
  - conferencia-api/src/main/resources/application-local.properties:5.
- Evidência original:

> a URL configura sslMode=REQUIRED, sem VERIFY_IDENTITY.

### Achado 17 — DTOs de usuários não refletem as restrições das entidades

- Gravidade original: MÉDIA.
- Classificação original: Comprovado.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/dtos/UsuarioRequestDTO.java:19.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/dtos/UsuarioAdminRequestDTO.java:9.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/model/Usuario.java:26.
- Evidência original:

> e-mail e nome completo podem chegar nulos, embora sejam obrigatórios na entidade. Faltam limites de tamanho correspondentes às colunas. Setor e unidade são textos livres, sem validação de relacionamento no serviço de usuários.

### Achado 18 — Unicidade de usuários e lotes depende de verificações prévias

- Gravidade original: MÉDIA.
- Classificação original: Risco.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/model/Usuario.java:26.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/model/LoteFenoRacao.java:31.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/EstoqueFenoRacaoServiceImpl.java:1560.
- Evidência original:

> os serviços consultam duplicidade antes de salvar; os mapeamentos desses registros não declaram todas as unicidades correspondentes.

### Achado 19 — Listagens e relatórios sem limites de volume

- Gravidade original: MÉDIA.
- Classificação original: Risco.
- Locais originais:
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/MovimentacaoMaterialServiceImpl.java:514.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/MovimentacaoFenoRacaoServiceImpl.java:1153.
- Evidência original:

> consultas retornam listas completas, sem paginação obrigatória. Parte dos filtros é aplicada em memória após carregar registros.

### Achado 20 — Interface mantém sessão e permissões antigas após expiração ou alteração administrativa

- Gravidade original: MÉDIA.
- Classificação original: Comprovado.
- Locais originais:
  - rpmont-conferencia-app/src/App.jsx:100.
  - rpmont-conferencia-app/src/services/api.js:131.
- Evidência original:

> a restauração aceita token presente e objeto de usuário válido em JSON. Não verifica expiração ou atualiza o perfil no servidor. O cliente HTTP propaga erros de autenticação sem tratamento central de encerramento da sessão.

### Achado 21 — Configuração de backup Android não exclui explicitamente dados de sessão

- Gravidade original: MÉDIA.
- Classificação original: Risco.
- Locais originais:
  - rpmont-conferencia-app/android/app/src/main/AndroidManifest.xml:5.
  - rpmont-conferencia-app/src/pages/Login.jsx:129.
- Evidência original:

> allowBackup=true e armazenamento persistente de token; não há regras de exclusão declaradas nesse manifesto.

### Achado 22 — Cobertura automatizada insuficiente para os fluxos críticos

- Gravidade original: MÉDIA.
- Classificação original: Comprovado no material inspecionado.
- Locais originais:
  - conferencia-api/src/test/java/br/com/rpmont/conferencia/ConferenciaApiApplicationTests.java:6.
  - rpmont-conferencia-app/package.json:6.
  - codemagic.yaml:13, na raiz do repositório.
- Evidência original:

> o teste backend encontrado apenas carrega o contexto. O frontend não declara comando de testes. O pipeline apresentado executa lint e builds iOS, sem testes dos fluxos de negócio ou validação backend.

### Achado 23 — Regras de autorização duplicadas e identificadores organizacionais inconsistentes

- Gravidade original: BAIXA.
- Classificação original: Comprovado.
- Locais originais:
  - rpmont-conferencia-app/src/App.jsx:167.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/MovimentacaoFenoRacaoServiceImpl.java:1634.
  - conferencia-api/src/main/java/br/com/rpmont/conferencia/service/EstoqueFenoRacaoServiceImpl.java:1389.
- Evidência original:

> frontend aceita BAIA e BAIAS; as verificações backend citadas aceitam somente a forma singular. As normalizações e políticas são implementadas repetidamente.

## 3. Integrações posteriores — separadas do registro histórico

As integrações abaixo foram informadas pelo usuário nesta sessão:

| Achados | Integração informada |
|---|---|
| 01 e 02 | Integrados à main pelo PR #2 |
| 03 | Integrado à main pelo PR #3 |

Esses eventos não alteram a redação das evidências originais.

A integração dos Achados 01–03 não implica encerramento automático dos Achados 04–23, mesmo que mudanças relacionadas tenham corrigido parcialmente outros problemas.

Não foi realizada nova verificação de integração, execução de testes ou certificação de produção para esta consolidação.

### Limitação da confirmação de Git nesta sessão

Em uma etapa anterior desta sessão, foram tentadas consultas de branch, HEAD e estado do Git. Elas foram recusadas pela proteção detected dubious ownership.

Não foi alterada a configuração safe.directory.

Por isso, esta sessão não confirmou:

- que a branch atual é main;
- que o HEAD atual corresponde a fd1cffe;
- que a árvore de trabalho estava limpa.

Esses estados não devem ser apresentados como confirmados por esta sessão. Informações de outra execução precisam ser identificadas com sua própria origem e evidência.

## 4. Achado 04 — análise posterior e proposta atual

Esta seção é uma análise e proposta posterior. Não integra a evidência histórica da seção 2 e não representa implementação, aprovação técnica definitiva ou encerramento do achado.

### 4.1. Escopo correto

O Achado 04 trata exclusivamente de:

> Troca de senha não revoga sessões existentes.

A solução proposta atua na identidade Usuario, na alteração de senha e na emissão/validação de JWT.

Não pertence a este achado uma proposta de adicionar @Version a MaterialPatrimonial, modificar zeramentos patrimoniais ou alterar controle de concorrência de materiais.

### 4.2. Evidências da leitura posterior do workspace

As referências abaixo pertencem à leitura posterior realizada nesta sessão, não à auditoria original. O commit correspondente não foi confirmado pelo Git.

| Arquivo e referência da leitura posterior | Observação |
|---|---|
| security/JwtService.java:23 | Emite JWT com identidade, dados organizacionais, emissão e expiração, sem versão de credencial. |
| security/JwtService.java:46 | Verifica assinatura e expiração, sem comparar estado de revogação da credencial. |
| security/JwtAuthenticationFilter.java:51 | Recarrega o usuário e verifica atividade/liberação, mas não compara versão de credencial. |
| model/Usuario.java:17 | Não possui campo de versão de credencial nem controle otimista identificado nessa leitura. |
| service/UsuarioServiceImpl.java:588 | A edição administrativa substitui a senha quando o campo tratado não está vazio, sem revogar tokens. |
| service/RecuperacaoSenhaServiceImpl.java:754 | A recuperação substitui senha e data de modificação, sem revogar tokens. |

Os caminhos da tabela são relativos a:

conferencia-api/src/main/java/br/com/rpmont/conferencia/.

A verificação de bloqueio do Achado 03 não resolve a troca de senha de uma conta que permanece ativa e liberada.

### 4.3. Caminhos de gravação de senha identificados

| Entrada HTTP | Caminho de serviço | Natureza |
|---|---|---|
| POST /usuario/solicitar-acesso | solicitarAcesso → preencherDadosSolicitacao | Senha inicial de uma nova conta |
| POST /usuario | salvarUsuario → preencherDadosAdministrativos | Senha inicial de cadastro administrativo |
| PUT /usuario/{id} | atualizarUsuarioPorId → preencherDadosAdministrativos | Alteração de senha de conta existente quando fornecida |
| POST /auth/recuperar-senha/redefinir | redefinirSenha → atualizarSenhaUsuario | Alteração por recuperação |

Referências da leitura posterior:

- UsuarioServiceImpl.java:549: gravação da senha inicial da solicitação.
- UsuarioServiceImpl.java:588–596: gravação administrativa compartilhada por cadastro e edição.
- RecuperacaoSenhaServiceImpl.java:754–774: gravação da senha na recuperação.
- AuthServiceImpl.java:78–79: única chamada de emissão JWT encontrada nessa leitura.

Solicitar recuperação e validar código não alteram a senha.

A confirmação de senha utilizada no zeramento de conferência patrimonial não constitui alteração de credencial.

### 4.4. Mecanismo proposto de revogação

Adicionar a Usuario uma versão de credencial persistida, conceitualmente:

credencialVersao: inteiro de 64 bits.

Fluxo proposto:

1. Inicializar a versão dos usuários em 0.
2. Incluir a versão no JWT assinado durante o login.
3. Incrementar a versão em toda alteração efetiva de senha.
4. Persistir senha e incremento na mesma transação.
5. Comparar, no filtro, a versão do JWT com a versão atual do usuário no banco.
6. Recusar autenticação quando a versão divergir, estiver ausente ou tiver formato inválido.
7. Preservar as verificações de assinatura, expiração, identidade, atividade e liberação.

O claim de identidade também deverá corresponder ao usuário efetivamente carregado. O JWT já contém um claim id; sua coerência com a conta deve ser verificada para evitar aceitar outra identidade em eventual reutilização de matrícula.

Não inserir senha ou hash de senha no JWT.

### 4.5. Precisão temporal

A revogação proposta não depende de comparar iat com uma data de alteração de senha.

Uma versão inteira permite distinguir alterações sucessivas mesmo quando:

- o token e a troca são produzidos no mesmo segundo;
- duas trocas acontecem no mesmo segundo;
- aplicação, JWT e banco utilizam precisões temporais diferentes.

dataModificacao não será usada como mecanismo principal de revogação, pois também é alterada em operações sem troca de senha.

### 4.6. Regras de incremento

| Operação | Comportamento proposto |
|---|---|
| Cadastro de usuário | Inicializar versão |
| Edição administrativa sem senha ou com campo vazio | Não incrementar |
| Edição administrativa que grava senha | Incrementar |
| Recuperação concluída com sucesso | Incrementar |
| Gravação explícita da mesma senha anterior | Incrementar |
| Solicitação de recuperação | Não incrementar |
| Código incorreto, expirado ou rejeitado | Não incrementar |
| Alteração comum de perfil sem senha | Não incrementar a versão de credencial |

A recuperação só deverá confirmar conjuntamente a nova senha, o incremento e o consumo do código quando todo o fluxo for bem-sucedido.

### 4.7. Distinção entre revogação e controle de concorrência

São mecanismos diferentes:

| Mecanismo | Responsabilidade |
|---|---|
| Usuario.credencialVersao | Invalidar JWTs emitidos com uma versão anterior da credencial |
| Eventual Usuario.versaoRegistro com @Version | Detectar gravações concorrentes sobre uma versão antiga da entidade |

@Version sozinho não revoga JWTs. Para revogação, é necessário incluir e verificar uma versão de credencial no token.

A proposta anterior desta sessão recomendou um campo separado de controle otimista em Usuario, conceitualmente:

versaoRegistro: inteiro de 64 bits, gerenciado pelo JPA com @Version.

Esse campo não deve ser confundido com credencialVersao.

Usar diretamente o contador genérico do JPA como versão do JWT faria alterações comuns de cadastro revogarem sessões. Esse efeito adicional não foi proposto como regra do Achado 04.

O controle de concorrência precisa impedir:

- perda de incrementos da versão de credencial;
- confirmação silenciosa de alterações de senha incompatíveis;
- sobrescrita da nova senha ou versão por uma edição concorrente baseada em estado antigo.

A estratégia definitiva de concorrência permanece sujeita à aprovação. O uso de @Version em Usuario é a proposta registrada, não uma implementação existente nem uma alteração autorizada.

### 4.8. Concorrência entre login e troca de senha

A senha verificada no login e a versão colocada no JWT devem vir da mesma leitura consistente da conta.

Comportamento esperado:

- Login que verificou a credencial antiga emite a versão antiga. Após o commit da troca, seu token será recusado, mesmo que a resposta do login chegue depois.
- Login que leu a credencial nova precisa validar a nova senha e emitir a nova versão.
- Não verificar uma senha antiga e depois buscar apenas a versão mais recente para emitir o token.

O marco operacional da revogação é o commit da alteração seguido da verificação atualizada no filtro.

Uma requisição que já tenha sido autenticada antes desse commit pode estar em andamento. A proposta não promete desfazer operações já autorizadas ou executadas.

A garantia depende de a verificação consultar estado atual, sem cache ou réplica atrasada que mantenha uma versão antiga.

### 4.9. Concorrência entre gravações de usuário

Se aprovado o controle otimista:

- Duas gravações baseadas na mesma versão antiga não devem confirmar silenciosamente.
- Um conflito deve provocar rollback da transação conflitante.
- Não repetir automaticamente a troca de senha sem revalidar suas condições.
- A resposta de conflito deve ser controlada e não expor SQL, credenciais ou detalhes internos.
- Edições concorrentes de perfil, nível ou status devem ser incluídas nos testes para garantir que não restaurem senha ou versão antigas.

### 4.10. Compatibilidade com tokens existentes

A proposta padrão é recusar JWTs sem o novo claim de versão, exigindo novo login após a implantação.

Não interpretar silenciosamente um claim ausente como versão 0 sem uma decisão explícita de compatibilidade.

A implantação precisa impedir que instâncias antigas continuem aceitando tokens revogados enquanto outras já verificam a versão.

Não é necessário alterar URLs ou o formato da resposta de login: o JWT permanece no mesmo campo.

### 4.11. Arquivos envolvidos na implementação futura

Caminhos relativos a:

conferencia-api/src/main/java/br/com/rpmont/conferencia/.

| Arquivo | Alteração proposta |
|---|---|
| model/Usuario.java | Mapear versão de credencial e, se aprovado, campo separado de controle otimista |
| security/JwtService.java | Emitir e extrair claim de versão, com validação de formato |
| security/JwtAuthenticationFilter.java | Comparar identidade e versão com o estado atual, preservando bloqueio/liberação |
| service/AuthServiceImpl.java | Garantir uso da mesma leitura de senha e versão na emissão |
| service/UsuarioServiceImpl.java | Inicializar versão nos cadastros e incrementar na alteração administrativa de senha |
| service/RecuperacaoSenhaServiceImpl.java | Confirmar senha, incremento e consumo do código atomicamente |
| exception/GlobalExceptionHandler.java | Tratar conflito de concorrência de forma controlada, se necessário |
| Testes de autenticação, usuário e recuperação | Cobrir revogação, concorrência e regressões |

A proposta não requer alteração de MaterialPatrimonial, dos comandos patrimoniais, do CORS, do Docker ou das permissões administrativas.

### 4.12. Alteração de esquema — somente proposta

Caso aprovada a proposta com campos separados, a tabela usuarios_sistema receberia:

- credencialVersao BIGINT NOT NULL, inicializado em 0.
- versaoRegistro BIGINT NOT NULL, inicializado em 0, para controle otimista.

É necessário planejar o preenchimento dos registros existentes e a compatibilidade com o mapeamento JPA.

Nome do arquivo e mecanismo de migration permanecem pendentes de definição.

Nenhuma migration ou alteração de banco está autorizada ou foi executada nesta preparação.

### 4.13. Preservação das correções dos Achados 02 e 03

#### Achado 02 — recuperação de senha

Na leitura posterior, foram identificados:

- @Transactional(noRollbackFor = RecuperacaoSenhaRejeitadaException.class).
- Busca do usuário por e-mail com bloqueio pessimista.

Essas proteções devem ser preservadas.

Critérios de regressão:

- Código incorreto continua persistindo tentativas.
- Rejeição de recuperação não altera senha nem versão de credencial.
- Recuperação bem-sucedida confirma senha, incremento e consumo do código conjuntamente.
- Falha de persistência ou conflito de concorrência provoca rollback.
- Não ampliar noRollbackFor para exceções genéricas.
- Não classificar conflitos de persistência como rejeições esperadas de código.

#### Achado 03 — bloqueio de usuário

A verificação de versão deve ser adicional às verificações atuais de atividade e liberação.

Critérios de regressão:

- Usuário bloqueado não autentica mesmo com versão correta.
- Usuário inativo não autentica mesmo com versão correta.
- Troca de senha invalida tokens anteriores mesmo após posterior desbloqueio.
- As verificações de nível e autorização existentes permanecem preservadas.

A proposta do Achado 04 não declara encerrados outros achados.

### 4.14. Testes necessários — planejados, não executados

1. JWT anterior recusado após recuperação bem-sucedida.
2. JWT anterior recusado após edição administrativa de senha.
3. Nova senha aceita em novo login e token novo utilizável.
4. Emissão e alteração no mesmo segundo revogam corretamente o token anterior.
5. Duas alterações sucessivas no mesmo segundo não reutilizam versão de credencial.
6. Edição sem senha preserva tokens.
7. Regravação explícita da mesma senha revoga tokens.
8. Login concorrente não combina senha antiga com versão nova.
9. Duas alterações concorrentes não perdem incrementos.
10. Recuperação concorrente com edição administrativa não confirma estados incompatíveis.
11. Edição concorrente de perfil, nível ou status não restaura senha ou versão antiga.
12. Código inválido preserva tentativas, sem revogar sessões.
13. Falha transacional não confirma parcialmente senha, versão ou consumo do código.
14. JWT sem claim de versão é recusado conforme a política de implantação.
15. Claim inválido, versão divergente ou identidade incompatível não estabelece autenticação.
16. Assinatura inválida e token expirado continuam recusados.
17. Usuário bloqueado ou inativo permanece recusado com versão correta.
18. Tokens de outros usuários não são revogados pela alteração da conta alvo.
19. Cadastro inicializa corretamente os campos propostos.
20. Conflitos de concorrência produzem resposta controlada e rollback integral.
21. Testes HTTP confirmam o comportamento pela cadeia real de segurança.
22. Testes transacionais em banco de homologação confirmam concorrência e estado persistido, quando expressamente autorizados.
23. Implantação não mantém instâncias antigas aceitando tokens incompatíveis.

## 5. Estado e limites desta preparação

- Os 23 achados da seção 2 são registros históricos preservados.
- As integrações da seção 3 foram informadas pelo usuário.
- A análise da seção 4 deriva da leitura posterior já realizada nesta sessão.
- A solução da seção 4 é proposta, não implementação.
- O Achado 04 não foi declarado encerrado.
- Não foi realizada nova auditoria dos demais achados.
- Correções parciais não encerram automaticamente outros registros.
- Nenhuma proposta de versionamento patrimonial integra o Achado 04.
- A geração deste conteúdo para cópia não executou comandos nem alterou arquivos.
- Não foram executados testes, builds, migrations ou conexões de rede/banco para esta resposta.
- Não houve consulta a credenciais, acesso ao Aiven, commit, push ou merge.
