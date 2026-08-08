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

O frontend também pode ser executado como aplicativo Android utilizando Capacitor.

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
React / Aplicação Android
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
- integração com Android;
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

## Status do projeto

Projeto em desenvolvimento contínuo, com implementação e evolução de novos módulos, regras de negócio, consultas e integrações.

---

## Autor

**Willames Pereira de Lima**

Desenvolvedor Full Stack

GitHub: [WillamesLima01](https://github.com/WillamesLima01)
