# Sistema de Gestão e Conferência de Materiais

Sistema Full Stack desenvolvido para gerenciamento, conferência, movimentação e controle de materiais patrimoniais, estoque de feno e ração, transferências entre unidades e integração com aplicação mobile.

O projeto foi construído com foco em regras de negócio reais, segurança, rastreabilidade de movimentações, controle de acesso e integração entre frontend, backend, banco de dados e dispositivos móveis.

---

## Tecnologias utilizadas

### Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- JWT
- Maven
- API REST

### Frontend

- React
- JavaScript
- HTML
- CSS
- Vite

### Banco de Dados

- MySQL
- JPA / Hibernate

### Mobile

- Capacitor
- Android
- iOS
- Leitura de QR Code
- Leitura de código de barras

### Ferramentas

- Git
- GitHub
- Docker
- IntelliJ IDEA
- VS Code
- DBeaver
- Insomnia
- Android Studio

---

## Principais funcionalidades

### Conferência patrimonial

- Cadastro e gerenciamento de materiais patrimoniais.
- Conferência de materiais por número de série.
- Leitura de QR Code e código de barras.
- Consulta de materiais por setor e unidade.
- Transferência de materiais entre setores e unidades.
- Registro de descarte.
- Registro de extravio.
- Registro de furto.
- Baixa de materiais.
- Reativação de materiais.
- Histórico completo de movimentações.
- Consultas avançadas com filtros.
- Zeramento controlado da conferência.

### Controle de acesso

- Autenticação de usuários com JWT.
- Autorização baseada em níveis de acesso.
- Controle de permissões por unidade.
- Controle de permissões por setor.
- Validação da situação de acesso do usuário.

Perfis implementados:

- Administrador Master.
- Administrador.
- Usuário comum.

---

## Módulo de Feno e Ração

O sistema possui um módulo específico para gerenciamento do estoque utilizado na alimentação dos equinos.

### Produtos controlados

- Feno.
- Ração Adulto Premium.
- Ração Adulto Manutenção.
- Ração Potro Premium.
- Ração Potro Manutenção.

### Funcionalidades

- Cadastro de entradas de estoque.
- Controle de produtos por lote.
- Controle de quantidade disponível.
- Controle de peso por unidade.
- Controle de validade.
- Cancelamento de entradas.
- Registro de movimentações.
- Transferências entre unidades.
- Solicitações de transferência.
- Aprovação ou negativa de solicitações.
- Notificações entre unidades.
- Histórico de transferências.
- Consultas de estoque.
- Geração de relatórios em PDF.

---

## Transferência utilizando múltiplos lotes

O módulo de Feno e Ração possui planejamento automático para transferências.

Quando um único lote não possui saldo suficiente para atender uma solicitação, o sistema pode distribuir automaticamente a quantidade entre vários lotes.

A regra prioriza os lotes mais antigos, contribuindo para melhor utilização do estoque e redução do risco de envelhecimento dos produtos.

Exemplo:

```text
Solicitação: 10 unidades

Lote A
Saldo disponível: 8 unidades
Quantidade utilizada: 8

Lote B
Saldo disponível: 5 unidades
Quantidade utilizada: 2

Resultado da transferência:
Etapa 1 -> 8 unidades do Lote A
Etapa 2 -> 2 unidades do Lote B
```

O sistema registra individualmente os saldos anteriores e posteriores de cada lote utilizado.

---

## Aplicação Mobile

O frontend também pode ser executado como aplicação mobile utilizando Capacitor, com suporte para Android e iOS.

A integração mobile permite utilizar a câmera do dispositivo para realizar leitura de:

- QR Code.
- Código de barras.

Com isso, a conferência pode ser realizada diretamente no local onde o material está armazenado.

---

## Segurança

A aplicação utiliza Spring Security e autenticação baseada em JWT.

Entre os controles implementados estão:

- autenticação de usuários;
- autorização por perfil;
- validação de acesso por unidade;
- validação de acesso por setor;
- proteção de endpoints;
- validação de requisições;
- restrição de operações administrativas;
- controle de acesso a movimentações e transferências.

---

## Banco de Dados

O sistema utiliza banco de dados relacional MySQL.

A camada de persistência utiliza:

- Spring Data JPA;
- Hibernate;
- entidades relacionais;
- relacionamentos entre tabelas;
- consultas customizadas;
- validações de integridade;
- operações transacionais.

Entre as informações armazenadas estão:

- usuários;
- materiais patrimoniais;
- movimentações;
- produtos;
- lotes;
- estoque;
- transferências;
- solicitações;
- notificações;
- histórico de operações.

---

## Arquitetura

O projeto é dividido em duas aplicações principais:

```text
conferencia-de-material---app
│
├── conferencia-api
│   └── Backend Java / Spring Boot
│
└── rpmont-conferencia-app
    └── Frontend React / Vite / Capacitor
```

Fluxo simplificado da aplicação:

```text
React / Aplicação Mobile
          |
          v
       REST API
          |
          v
    Spring Boot
          |
          v
 Spring Security / JWT
          |
          v
   Hibernate / JPA
          |
          v
        MySQL
```

---

## Organização do projeto

### Backend

`conferencia-api`

Responsável por:

- regras de negócio;
- autenticação;
- autorização;
- APIs REST;
- persistência de dados;
- movimentações;
- transferências;
- estoque;
- validações.

### Frontend

`rpmont-conferencia-app`

Responsável por:

- interface web;
- consumo das APIs;
- autenticação do usuário;
- consultas;
- formulários;
- relatórios;
- integração com aplicações mobile Android e iOS;
- leitura de QR Code e código de barras.

---

## Objetivo do projeto

O projeto tem como objetivo aplicar conceitos de desenvolvimento Full Stack em um sistema com regras de negócio reais.

Durante o desenvolvimento são aplicados conhecimentos relacionados a:

- desenvolvimento frontend;
- desenvolvimento backend;
- APIs REST;
- arquitetura de software;
- orientação a objetos;
- segurança;
- autenticação e autorização;
- banco de dados relacional;
- modelagem de dados;
- transações;
- controle de estoque;
- desenvolvimento mobile;
- versionamento de código;
- debugging;
- resolução de problemas;
- integração entre sistemas.

---

## Timeouts de e-mail do backend

O backend aplica limites de conexão, leitura e escrita para os transportes SMTP e SMTPS.
Os valores são inteiros em **milissegundos**, com padrão de **5.000 ms** para cada operação:

| Variável de ambiente | Operação | Padrão |
|---|---|---|
| `RPMONT_SMTP_CONNECTION_TIMEOUT_MS` | Conexão do socket | `5000` |
| `RPMONT_SMTP_READ_TIMEOUT_MS` | Leitura do socket | `5000` |
| `RPMONT_SMTP_WRITE_TIMEOUT_MS` | Escrita do socket | `5000` |

As variáveis são opcionais e devem ser fornecidas ao processo Java pelo ambiente de
execução, IDE ou contêiner. Use valores positivos e finitos. O funcionamento é o mesmo
no Windows e no macOS; Android e iOS continuam acessando a API, sem configuração SMTP
nos aplicativos. As configurações existentes de perfil, servidor, autenticação e TLS
permanecem independentes desses limites. Propriedades específicas de perfil ou externas
podem substituir os padrões; confirme os valores efetivos do transporte em cada ambiente.

Esses limites são por operação de rede e não representam um prazo total para a requisição.
O envio continua dentro da transação: uma falha SMTP provoca rollback das alterações no
banco, mas não permite desfazer uma mensagem que já tenha sido aceita pelo servidor.
Esta mitigação não oferece garantia de entrega nem elimina essa ambiguidade.

Não registre credenciais, códigos de recuperação ou propriedades completas da sessão
de e-mail nos logs. Os testes de configuração utilizam apenas dados fictícios e não
abrem conexão SMTP; os testes de rollback usam envio simulado e o MySQL local de homologação.

---

## Empacotamento seguro e perfis do backend

O JAR inclui as classes compiladas e o `application.properties` público. Configurações
locais ou de produção com segredos, arquivos `.env` e chaves não devem fazer parte do
artefato. Os recursos filtrados e não filtrados possuem exclusões explícitas; o JAR usa
uma lista de recursos permitidos e é recriado antes do reempacotamento, inclusive sem
`clean`. Recursos legítimos adicionais precisam ser aprovados no POM e na verificação.
Certificados públicos também precisam dessa aprovação; contêineres de chaves devem
permanecer externos. Essas regras não apagam arquivos antigos de `target/classes`.

Não existe perfil ativo fixado na configuração pública. Selecione o ambiente de forma
explícita. Os comandos abaixo devem ser executados a partir de `conferencia-api` e não
contêm credenciais. Use JDK 25.

### Desenvolvimento no Windows (PowerShell)

```powershell
$env:SPRING_PROFILES_ACTIVE = 'local'
$env:SPRING_CONFIG_ADDITIONAL_LOCATION = 'file:./src/main/resources/'
.\mvnw.cmd spring-boot:run
```

### Desenvolvimento no macOS

```sh
SPRING_PROFILES_ACTIVE=local \
SPRING_CONFIG_ADDITIONAL_LOCATION=file:./src/main/resources/ \
sh ./mvnw spring-boot:run
```

O diretório adicional permite que o Spring leia a configuração local existente como
arquivo externo, sem copiá-la para o JAR. Na IDE, configure as mesmas variáveis e use
`conferencia-api` como diretório de trabalho. Não ative simultaneamente `local` e `prod`.

### Produção

Defina `SPRING_PROFILES_ACTIVE=prod` no ambiente de implantação. Forneça as configurações
necessárias por variáveis de ambiente ou por um diretório externo protegido, indicado
por `SPRING_CONFIG_ADDITIONAL_LOCATION`. Não reutilize o diretório de desenvolvimento
em produção. Não é obrigatório existir `application-prod.properties` dentro do JAR.
O perfil Maven de build e o perfil Spring de execução são mecanismos diferentes.

### Validação do artefato

Após autorização para builds e testes, executar no PowerShell:

```powershell
.\mvnw.cmd "-Dtest=EmpacotamentoSeguroTest" "-Djunit.jupiter.execution.parallel.enabled=false" verify
```

No macOS, substituir `.\mvnw.cmd` por `sh ./mvnw`. O comando seleciona somente os novos
testes unitários de empacotamento; o Failsafe verifica o JAR final depois do `repackage`.
Não inicia a aplicação, não abre conexão com banco ou SMTP e não executa `clean`.
Os relatórios dos 123 testes anteriores não são apagados por essa seleção. Preserve as
evidências antes de qualquer limpeza ou nova execução dos mesmos testes.

Somente `package` não executa a checagem final: o artefato de liberação deve passar por
`verify`. A inspeção usa nomes de entradas e informa apenas a regra violada, sem ler
valores de configuração. Ela não procura segredos dentro de arquivos permitidos,
bytecode ou bibliotecas dependentes; a revisão desses conteúdos continua necessária.
Não publique o JAR simples `.jar.original` nem diretórios de build ou configurações externas.

---

## Status do projeto

Projeto em desenvolvimento contínuo, com implementação e evolução de novos módulos, regras de negócio, consultas e integrações.

---

## Autor

**Willames Pereira de Lima**

Desenvolvedor Full Stack

GitHub: [WillamesLima01](https://github.com/WillamesLima01)
