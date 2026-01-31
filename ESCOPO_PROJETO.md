# ESCOPO DO PROJETO - Sistema CRM de Follow-up

**Documento para Anexo ao Contrato de Prestação de Serviços**

---

## 1. Visão Geral do Sistema

### Descrição

Sistema web interno de gestão de relacionamento com clientes (CRM) especializado em follow-up contínuo para corretoras. O sistema garante que nenhum cliente fique sem acompanhamento através de uma regra de negócio fundamental.

### Regra de Negócio Core (Inegociável)

**Todo atendimento DEVE gerar um próximo follow-up.**

É impossível finalizar um atendimento sem agendar a próxima interação. Esta regra garante o ciclo contínuo de relacionamento com os clientes.

### Público-alvo

Corretoras com múltiplos usuários que necessitam organizar e garantir follow-up sistemático com sua carteira de clientes.

---

## 2. Stack Tecnológica (Não Negociável)

A stack abaixo foi escolhida e **não será alterada** durante o desenvolvimento:

- **Arquitetura**: Monorepo com pnpm + Turborepo
- **Frontend**: Vite + React + TypeScript + TanStack Router + shadcn/ui
- **Backend**: oRPC (similar ao tRPC para comunicação type-safe)
- **Autenticação**: Better Auth
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Containerização**: Docker (ambiente de desenvolvimento)

Qualquer sugestão de mudança de tecnologia será considerada fora de escopo.

---

## 3. Funcionalidades Incluídas no Projeto

Todas as funcionalidades listadas abaixo estão incluídas no escopo do projeto.

### 3.1 Gestão de Campos Customizáveis

O administrador pode configurar quais campos de informação os clientes terão no sistema.

**Funcionalidades:**
- Criação de campos personalizados por tipo:
  - Texto (input livre)
  - Número (valores numéricos)
  - Data (seletor de data)
  - Seleção (dropdown com opções predefinidas)
  - Checkbox (verdadeiro/falso)
- Definição de campos obrigatórios
- Reordenação da ordem de exibição (drag-and-drop)
- Ativação/desativação de campos
- Interface de configuração visual com preview

**Regras:**
- Tipo do campo é imutável após criação
- Campos desativados não aparecem em novos cadastros mas preservam dados históricos
- Opções de campos de seleção podem ser adicionadas, não removidas

### 3.2 Sistema de Tags

Sistema livre de categorização de clientes através de tags (etiquetas).

**Funcionalidades:**
- Criação de tags por qualquer usuário
- Customização de cores para identificação visual
- Vinculação de múltiplas tags por cliente
- Interface de gestão centralizada para administradores
- Busca e filtro de tags
- Remoção de tags com confirmação

**Regras:**
- Nome da tag é único (case insensitive)
- Tags removidas são desvinculadas de todos os clientes
- Histórico de interações preserva tags do momento do registro

### 3.3 Gestão de Clientes

CRUD completo de clientes com campos flexíveis.

**Funcionalidades:**
- Cadastro de clientes com:
  - WhatsApp obrigatório (formato internacional E.164)
  - Campos customizáveis configurados pelo admin
  - Tags múltiplas
  - Notas gerais (campo de texto longo)
  - Atribuição a usuário responsável (definido pelo admin)
- Listagem com paginação (20 por página)
- Busca simples por nome/empresa (campos texto)
- Filtros por tags (lógica OR)
- Edição de dados do cliente
- **Criação automática do primeiro atendimento** ao cadastrar

**Regras:**
- WhatsApp é obrigatório
- Campos marcados como obrigatórios devem ser preenchidos
- Cliente não pode ser excluído, apenas desativado
- Lista ordenada por próximo atendimento (mais urgente primeiro)

### 3.4 Gestão de Usuários

Administração da equipe de atendimento.

**Funcionalidades:**
- Criação de usuários pelo admin:
  - Nome completo
  - Email único
  - Senha inicial
- Listagem de usuários com métricas:
  - Quantidade de clientes atribuídos
  - Quantidade de atendimentos pendentes (status OPEN)
- Edição de dados do usuário
- Desativação/reativação de usuários
- Reset de senha
- Reatribuição de clientes entre usuários (individual ou em massa)

**Regras:**
- Email único no sistema
- Apenas admin gerencia usuários
- Usuário não pode desativar a si mesmo
- Ao desativar, clientes permanecem atribuídos (admin deve reatribuir)
- Histórico de interações do usuário permanece intacto

### 3.5 Calendário de Atendimentos

Visualização temporal dos atendimentos agendados.

**Funcionalidades:**
- **Três visualizações:**
  - Mensal: grade de dias com quantidade de atendimentos
  - Semanal: horários do dia em colunas por dia da semana
  - Diária: lista de horários com detalhes dos atendimentos
- Navegação temporal (anterior/próximo/hoje)
- Indicadores visuais por status:
  - Aberto (cor primária)
  - Concluído (verde)
  - Cancelado (vermelho/cinza)
- Destaque especial para atendimentos atrasados (passados + status aberto)
- Lista do dia com:
  - Ordenação por horário
  - Contador de pendentes
  - Seção destacada de atrasados
  - Ações rápidas (WhatsApp, detalhes, finalizar)

**Regras:**
- Calendário inicia no dia atual
- Visão padrão: semanal
- Atendimentos atrasados sempre aparecem primeiro na lista

### 3.6 Fluxo Core de Atendimento

**Esta é a funcionalidade mais crítica do sistema.**

#### Modal de Detalhes do Atendimento

**Funcionalidades:**
- Exibição completa de:
  - Status do atendimento
  - Data/hora agendada
  - Dados atuais do cliente (campos customizáveis, tags, notas)
  - Histórico das últimas 5-10 interações
  - Próximo atendimento agendado (se houver)
- Botão "Abrir WhatsApp" (abre wa.me com número)
- Botão "Editar Cliente" (acesso direto)
- Ações contextuais por status

#### Fluxo de Finalização (Operação Atômica)

**Funcionalidades:**
1. Botão "Iniciar Atendimento" (registra hora de início)
2. Durante atendimento:
   - WhatsApp disponível
   - Dados do cliente visíveis
   - Histórico acessível
3. Formulário de finalização com campos obrigatórios:
   - **Resumo** (texto): o que foi conversado
   - **Resultado/Outcome** (texto): conclusão do atendimento
   - **Data e hora do próximo follow-up** (futuro obrigatório)
4. Ao confirmar, sistema executa em **operação única (tudo ou nada)**:
   - Cria registro de interação com snapshot completo dos dados
   - Marca atendimento atual como DONE
   - Cria novo atendimento OPEN na data definida
5. Modal de confirmação de sucesso

**Regras Críticas:**
- É **impossível** finalizar sem agendar próximo follow-up
- Data do próximo follow-up deve ser futura
- Operação é atômica: se uma etapa falhar, nenhuma é salva (rollback)
- Snapshot captura: dados do cliente + tags + valores de campos customizáveis
- Interação registra duração (hora fim - hora início)
- Cliente não pode ter dois atendimentos OPEN simultaneamente

#### Cancelamento de Atendimento

**Funcionalidades:**
- Opção de cancelar disponível no modal e lista
- Modal de confirmação com:
  - Campo obrigatório: motivo do cancelamento
  - Confirmação explícita
- Registro de quem cancelou e quando

**Regras:**
- Motivo é obrigatório
- Apenas atendimentos OPEN podem ser cancelados
- Cancelamento não cria próximo atendimento automaticamente
- Cancelamento é irreversível
- Cliente fica sem atendimento agendado

### 3.7 Histórico de Interações

Visualização completa do relacionamento com cada cliente.

**Funcionalidades:**
- Timeline de todas as interações (mais recente primeiro)
- Para cada interação:
  - Data e hora
  - Usuário que realizou
  - Resumo e resultado
  - Duração
  - **Snapshot dos dados do cliente naquele momento** (campos + tags)
- Filtros:
  - Por período
  - Por usuário (para admin)
  - Por resultado/outcome
- Expansão de detalhes para ver snapshot completo
- Paginação para clientes com muitas interações
- Acesso via modal do atendimento ou página do cliente

**Regras:**
- Interações são imutáveis (não podem ser editadas)
- Snapshot preserva dados mesmo se campos forem removidos
- Tags removidas ainda aparecem no histórico daquela interação
- Preservação completa para auditoria

### 3.8 Administração

Interfaces de configuração para administradores.

**Funcionalidades:**

#### Configuração de Campos Customizáveis
- Lista de campos com drag-and-drop para reordenar
- Formulário de criação/edição
- Preview em tempo real do formulário de cliente
- Indicadores de status (ativo/inativo, obrigatório)

#### Gestão de Tags
- Lista completa de tags do sistema
- Quantidade de clientes usando cada tag
- Criador e data de criação
- Busca por nome
- Edição de nome e cor
- Remoção com confirmação (mostra quantidade afetada)

#### Métricas por Usuário
- Clientes atribuídos
- Atendimentos pendentes (OPEN)
- Visualização em lista de usuários

---

## 4. Exclusões Explícitas do Projeto

As funcionalidades abaixo **NÃO estão incluídas** neste escopo e, se desejadas, requerem orçamento adicional:

- ❌ Sistema de permissões granulares (no projeto tudo é liberado)
- ❌ Dashboard com gráficos e métricas avançadas
- ❌ Notificações push ou por email
- ❌ Lembretes automáticos de atendimento
- ❌ Assistente de IA / integração com Gemini
- ❌ Importação/exportação de dados (CSV, Excel)
- ❌ Relatórios customizáveis e impressão
- ❌ API pública para integrações externas
- ❌ Aplicativo mobile nativo (iOS/Android)
- ❌ Integração com WhatsApp Business API (apenas botão wa.me)
- ❌ Campos calculados ou fórmulas
- ❌ Sistema de anexos de arquivos
- ❌ Multi-tenancy (suporte a múltiplas corretoras em uma instalação)
- ❌ Infraestrutura de produção
- ❌ Deploy em servidor
- ❌ Configuração de domínio e SSL
- ❌ Backup automatizado

---

## 5. Regras de Negócio Críticas

Comportamentos fundamentais que garantem a integridade do sistema:

1. **Follow-up obrigatório**: É impossível finalizar um atendimento sem agendar o próximo. Não existe botão ou caminho que permita isso.

2. **Operação atômica**: A finalização de atendimento (criar interação + marcar DONE + criar próximo OPEN) é tudo-ou-nada. Se qualquer etapa falhar, nenhuma alteração é salva e o sistema faz rollback.

3. **Snapshot histórico**: Em cada interação, o sistema "fotografa" os dados do cliente exatamente como estão. Isso inclui campos customizáveis e tags. Alterações futuras não afetam o histórico.

4. **Appointment único por cliente**: Um cliente só pode ter um atendimento com status OPEN por vez. Isto evita duplicações e confusão na agenda.

5. **Primeiro atendimento automático**: Ao cadastrar um novo cliente, o sistema cria automaticamente o primeiro atendimento para a data/hora definida no cadastro.

6. **Interações imutáveis**: Uma vez registrada, uma interação não pode ser editada ou excluída. Isto garante integridade e auditoria do histórico.

---

## 6. Entregáveis

Ao final da implementação do projeto, o contratante receberá:

### 6.1 Código-fonte Completo
- Repositório Git com histórico completo de commits
- README detalhado com instruções de instalação
- Scripts automatizados de setup do ambiente
- Código organizado seguindo boas práticas

### 6.2 Banco de Dados
- Schema Prisma documentado
- Migrations versionadas e testadas
- Seeds com dados de exemplo (clientes, usuários, atendimentos)

### 6.3 Documentação Técnica
- Estrutura de pastas explicada
- Instruções de como rodar em ambiente de desenvolvimento
- Lista de variáveis de ambiente necessárias
- Comandos principais (dev, build, test)

### 6.4 Ambiente de Desenvolvimento
- Docker Compose configurado (PostgreSQL)
- Scripts npm/pnpm prontos para uso
- Configuração de linting e formatação (Biome)
- Hot reload funcional

### 6.5 Testes
- Testes unitários das regras de negócio críticas
- Testes E2E dos fluxos principais:
  - Finalização de atendimento (operação atômica)
  - Snapshot de dados
  - Validações de follow-up obrigatório
  - Cancelamento
  - Reatribuição de clientes

---

## 7. Limites e Revisões

### Revisões Incluídas
- **2 rodadas de ajustes** por feature implementada
- Ajustes são refinamentos dentro do escopo definido (layout, textos, comportamentos descritos)

### Mudanças de Escopo
- Qualquer funcionalidade **não listada na seção 3** será considerada adicional
- Mudanças que alterem estrutura de dados ou comportamento core requerem novo orçamento
- Exemplo de fora de escopo: "quero que o sistema envie email" ou "adicionar campo de foto"

### Bugs
- **Bugs críticos** (impedem uso básico de funcionalidade) serão corrigidos sem custo adicional
- **Bugs menores** (visuais, edge cases raros) após entrega oficial serão orçados separadamente
- Prazo para reporte de bugs críticos: 7 dias corridos após entrega

### Não Incluído
- Treinamento de usuários (pode ser adicionado separadamente)
- Suporte pós-entrega (pode ser contratado por período)
- Manutenção evolutiva (novas funcionalidades após projeto)

---

## 8. Premissas e Responsabilidades

### Cliente deve Fornecer

- **Feedback estruturado** em até 3 dias úteis por entrega parcial
- **Informações de negócio** quando necessário para validação
- **Acesso a recursos** (se aplicável: Figma, documentos, servidor para testes)
- **Disponibilidade** para reuniões de alinhamento (máximo 1h por semana)

### Desenvolvedor se Responsabiliza Por

- **Código funcional** conforme especificado neste documento
- **Boas práticas** de desenvolvimento (clean code, padrões, documentação)
- **Comunicação proativa** sobre bloqueios, riscos ou dúvidas
- **Entregas parciais** conforme cronograma acordado separadamente
- **Testes** das funcionalidades implementadas

### Explicitamente Não Incluído

- **Infraestrutura de produção** (servidor, domínio, SSL, hospedagem)
- **Serviços de terceiros** (WhatsApp Business API, serviços de email)
- **Manutenção de servidores** e monitoramento
- **Backup** de dados de produção
- **Suporte a usuários finais** após entrega
- **Configurações de firewall, DNS, CDN**

---

## 9. Critérios de Aceitação

O projeto será considerado **concluído e entregue** quando todos os critérios abaixo forem atendidos:

### 9.1 Funcionalidades Implementadas
✓ Todas as funcionalidades da **seção 3** estão implementadas e funcionais

### 9.2 Regra Core Validada
✓ Fluxo de follow-up obrigatório funciona corretamente:
- Não é possível finalizar sem agendar próximo
- Operação atômica funciona (tudo ou nada)
- Snapshot dos dados é preservado

### 9.3 Testes Passando
✓ Todos os testes unitários e E2E passam sem erros
✓ Testes críticos cobrem:
- Finalização atômica
- Snapshot de dados
- Validações de negócio

### 9.4 Ambiente Funcional
✓ Sistema roda em ambiente de desenvolvimento local
✓ Docker Compose inicia PostgreSQL sem erros
✓ Comandos de setup funcionam conforme documentado
✓ Hot reload funciona no frontend e backend

### 9.5 Documentação Completa
✓ README com instruções claras de instalação
✓ Variáveis de ambiente documentadas
✓ Estrutura de código explicada
✓ Seeds disponíveis para dados de exemplo

### 9.6 Código Versionado
✓ Repositório Git com histórico organizado
✓ Commits descritivos
✓ Sem credenciais ou dados sensíveis commitados

---

## 10. Considerações Finais

Este documento define de forma clara e inequívoca o escopo do projeto do Sistema CRM de Follow-up. 

**Qualquer funcionalidade, tecnologia ou serviço não explicitamente listado na seção 3 (Funcionalidades Incluídas) é considerado fora de escopo** e requer negociação e orçamento adicional.

O objetivo deste documento é proteger ambas as partes contra mal-entendidos e garantir que as expectativas estejam alinhadas desde o início.

### Mudanças no Escopo

Caso o contratante deseje adicionar, remover ou modificar funcionalidades após assinatura do contrato:

1. A solicitação deve ser feita por escrito
2. O desenvolvedor avaliará impacto e fornecerá novo orçamento
3. Ambas as partes devem concordar antes de qualquer alteração
4. Prazo de entrega pode ser ajustado conforme complexidade

---

**Data de Criação**: ___/___/______

**Versão**: 1.0

**Validade**: Este escopo é válido para o projeto descrito e perde validade se houver mudanças estruturais solicitadas pelo contratante.

---

## Referências Técnicas

Documentação detalhada de cada feature está disponível em:
- `.docs/plan/00-overview.md` - Visão geral da arquitetura
- `.docs/plan/01-schema-base.md` a `.docs/plan/18-admin-tags-ui.md` - Features detalhadas em formato BDD

Esta documentação técnica serve como referência para implementação e validação.
