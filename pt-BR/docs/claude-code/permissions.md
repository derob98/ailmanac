# Permissões e Modos de Permissão

> Source: https://derob98.github.io/ailmanac/pt-BR/docs/claude-code/permissions · AILmanac (CC BY 4.0) · last verified 2026-08-18

Regras allow/ask/deny e modos — reduza prompts sem perder segurança.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-08-18" source="https://code.claude.com/docs/en/whats-new/2026-w32">
A sintaxe exata das regras e os nomes dos modos evoluem — confirme na documentação oficial de permissões e modos de permissão do Claude Code. **Desde a v2.1.283:** o `auto` é o modo inicial integrado das sessões interativas de terminal e do VS Code em todos os planos e provedores (veja abaixo).
</VerifyNote>

<Callout type="objectives" items={["O que significam os três veredictos de permissão (allow / ask / deny)", "Como uma regra de permissão associa uma ferramenta a um padrão", "Os seis modos de permissão e quando usar cada um", "Por que o modo auto agora é o modo inicial das sessões interativas — e como desativá-lo", "Como o modo auto substitui os prompts por um classificador de segurança", "Como montar uma allowlist inicial sensata que reduz prompts sem perder segurança", "Onde armazenar as regras de permissão do projeto versus as pessoais"]} />

As permissões decidem **o que o Claude Code pode fazer sem parar para perguntar a você**. Ajuste-as bem e você obtém fluidez sem perder o controle; ajuste-as mal e você acaba aprovando tudo automaticamente ou se afogando em prompts.

## Os três veredictos

Toda ação potencial se resolve em um destes:

<Flashcards cards={[{front: "allow", back: "Faça, sem prompt."}, {front: "ask", back: "Pause e pergunte a você — o padrão para qualquer coisa não explicitamente permitida ou negada."}, {front: "deny", back: "Nunca, nem mesmo se for solicitado."}]} />

As regras geralmente associam uma ferramenta a um padrão, por exemplo, permitir `Bash(npm run test:*)` ou negar `Read(./.env)`.

<PromptCard title="Permitir uma ferramenta + padrão">{`Bash(npm run test:*)`}</PromptCard>

<PromptCard title="Negar uma ferramenta + padrão">{`Read(./.env)`}</PromptCard>

## Modos de permissão

Um modo define a postura geral de uma sessão. São seis. Alterne entre os mais comuns com `Shift+Tab` ou defina `permissions.defaultMode` nas configurações.

| Modo | Executa sem perguntar | Use quando |
|---|---|---|
| **`default`** (exibido como **Manual**) | Somente leituras | Trabalho do dia a dia, mudanças sensíveis |
| **`acceptEdits`** | Leituras, edições de arquivo, comandos comuns de sistema de arquivos | Uma sessão de edição confiável e bem delimitada |
| **`plan`** | Leituras, mais comandos aprovados pelo classificador quando o modo auto está disponível; nunca edita o seu código-fonte | Tarefas grandes/arriscadas — veja [Plan Mode](/docs/claude-code/plan-mode) |
| **`auto`** *(o modo inicial das sessões interativas desde a v2.1.283)* | Tudo, filtrado por um classificador de segurança | Tarefas longas em que a fadiga de prompts é o risco real |
| **`dontAsk`** | Leituras de arquivos nos seus diretórios de trabalho e ferramentas pré-aprovadas; tudo o que geraria um prompt é negado | CI e scripts em ambiente restrito |
| **`bypassPermissions`** | Tudo, sem verificações | Apenas sandboxes/contêineres — **nunca** em uma máquina com segredos |

### O modo auto agora é o padrão do Claude Code

Desde o Claude Code **v2.1.283**, o `auto` é o modo inicial integrado das sessões interativas de terminal e do VS Code em **todos os planos e provedores**. Nas versões anteriores, ele era o padrão para novas sessões apenas nos planos Pro, Max e Team, a partir de 14 de agosto de 2026. A justificativa da Anthropic (a partir de testes próprios com mais de 1.000 usuários pagantes): o classificador pegou **89%** das ações prejudiciais contra **13,6%** da revisão manual — porque usuários habituados aceitavam cerca de 97% dos prompts manuais sem lê-los.

Duas exceções preservam a sua intenção:

- Se **você** definiu `permissions.defaultMode` nas suas configurações de usuário, ele permanece como está, a menos que você aceite um prompt único de troca no aplicativo.
- Se **a sua organização** gerencia o padrão (configurações gerenciadas do Team/Enterprise), nada muda automaticamente.

Você sempre pode alternar os modos no meio da sessão com `Shift+Tab`. Mudança relacionada que já está em vigor nesses planos: as chamadas ao classificador que o modo auto faz **não contam mais para os seus limites de uso**.

<PromptCard title="Ative antes (antes de 14 de ago) — defina auto como padrão">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "auto"
  }
}`}</PromptCard>

<PromptCard title="Mantenha o comportamento antigo de prompts depois de 14 de ago">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "default"
  }
}`}</PromptCard>

### Como o modo auto realmente funciona

O `auto` é o meio-termo entre perguntar sobre tudo e desligar a segurança. Em vez de perguntar a você, um **modelo classificador** separado revisa cada ação antes de ela ser executada e bloqueia qualquer coisa que escale além do que você pediu, toque em infraestrutura que ele não reconhece ou pareça motivada por conteúdo hostil que o Claude acabou de ler. Regras explícitas de `ask` continuam parando e perguntando a você.

Ele bloqueia coisas como `curl | bash`, force pushes, deploys e migrações em produção, `rm -rf` em variáveis não resolvidas, adulteração de transcrições, comandos git destrutivos que descartam alterações não commitadas e envio de segredos para endpoints externos — enquanto deixa o trabalho rotineiro (edições locais, instalação de dependências declaradas, HTTP somente leitura, push para a sua própria branch) passar direto. Se ele bloquear a mesma ação repetidamente, o modo auto pausa e devolve os prompts a você.

O modo auto não é uma garantia de segurança — ele reduz os prompts, não elimina a necessidade de revisar operações sensíveis. A disponibilidade depende do seu plano, do modelo e (no Team/Enterprise) de uma opção habilitada pelo administrador. Se você roda de forma realmente autônoma (cron, sessões na nuvem, CI), combine-o com [Fortalecendo Execuções Autônomas](/docs/security/hardening-autonomous-runs) — o auto ainda não é o `bypassPermissions`.

<Callout type="warning" items={["O bypassPermissions pertence a uma sandbox. Rodar com todos os prompts desligados na sua máquina real é como um agente acaba tocando em algo que não deveria. Reserve isso para ambientes descartáveis — se o que você realmente quer é menos prompts, use o modo auto. Veja Fortalecendo Execuções Autônomas em /docs/security/hardening-autonomous-runs."]} />

## Uma allowlist inicial sensata

O objetivo: pré-permitir as coisas seguras e repetitivas; manter as coisas destrutivas em **ask** ou **deny**.

<Steps items={[{title: "Permita o seguro + repetitivo", body: "Ler arquivos, executar seus comandos de teste/lint/build, git status/diff."}, {title: "Pergunte antes do risco médio", body: "Instalar dependências, escrever arquivos fora do projeto, chamadas de rede."}, {title: "Negue o destrutivo", body: "Ler arquivos secretos (.env, arquivos de chave), force-push, rm -rf."}]} />

Armazene as regras do projeto em [`settings.json`](/docs/claude-code/settings) (compartilhado) e as substituições pessoais em `settings.local.json`.

<Callout type="tip" items={["Deixe-o aprender com seus prompts: aprove o mesmo comando seguro algumas vezes e você saberá exatamente o que adicionar à sua allowlist — transformando prompts repetidos em uma regra única."]} />

<Callout type="takeaways" items={["Três veredictos: allow (sem prompt), ask (padrão — pause e confirme), deny (nunca).", "As regras associam uma ferramenta a um padrão, como Bash(npm run test:*) ou Read(./.env).", "Seis modos definem a postura da sessão: default (Manual), acceptEdits, plan, auto, dontAsk, bypassPermissions.", "Desde a v2.1.283, o auto é o modo inicial das sessões interativas de terminal e do VS Code em todos os planos; um defaultMode definido por você permanece, e os padrões gerenciados pela organização não são alterados.", "O modo auto filtra cada ação por um classificador de segurança em vez de perguntar a você — essa é a ferramenta contra a fadiga de prompts, não o bypassPermissions.", "Monte uma allowlist: permita o seguro + repetitivo, pergunte para o risco médio, negue o destrutivo.", "As regras compartilhadas vão em settings.json; as substituições pessoais em settings.local.json."]} />

<Quiz title="Teste-se" questions={[{q: "O que o veredicto padrão 'ask' faz para uma ação que não é explicitamente permitida nem negada?", options: ["Executa silenciosamente", "Pausa e pede que você confirme", "Bloqueia permanentemente"], answer: 1, explain: "ask é o padrão para qualquer coisa não explicitamente permitida/negada — ele pausa e pergunta a você."}, {q: "Qual modo de permissão é seguro APENAS em sandboxes ou contêineres, nunca em uma máquina com segredos?", options: ["plan", "acceptEdits", "bypassPermissions"], answer: 2, explain: "bypassPermissions pula os prompts e as verificações de segurança inteiramente; reserve-o para ambientes descartáveis — nunca em uma máquina com segredos."}, {q: "Você quer bem menos prompts de permissão em uma tarefa longa, mas ainda quer uma rede de segurança. Qual modo?", options: ["bypassPermissions — ele pula todos os prompts", "auto — um classificador filtra cada ação e bloqueia as arriscadas", "dontAsk — ele nunca interrompe você"], answer: 1, explain: "O modo auto substitui os prompts por um classificador que bloqueia escaladas como curl | bash, force pushes e deploys em produção. O bypassPermissions remove a rede de segurança; o dontAsk simplesmente nega qualquer coisa não pré-aprovada."}, {q: "Onde você deve armazenar as regras de permissão compartilhadas do projeto versus as substituições pessoais?", options: ["Ambas em settings.local.json", "Regras do projeto em settings.json; substituições pessoais em settings.local.json", "Regras do projeto em settings.local.json; substituições pessoais em settings.json"], answer: 1, explain: "As regras do projeto vão em settings.json (compartilhado); as substituições pessoais vão em settings.local.json."}, {q: "Qual destas pertence à lista 'deny' em uma allowlist inicial sensata?", options: ["git status / diff", "rm -rf e ler .env", "Executar seus comandos de teste/lint/build"], answer: 1, explain: "Negue as coisas destrutivas: ler arquivos secretos (.env, arquivos de chave), force-push e rm -rf."}, {q: "Em 14 de agosto de 2026, o que acontece em um plano Pro se você já tinha definido permissions.defaultMode como 'default' nas suas configurações de usuário?", options: ["Ele é sobrescrito para 'auto' automaticamente", "Permanece 'default', a menos que você aceite um prompt único de troca no aplicativo", "O modo auto é aplicado silenciosamente a toda nova sessão mesmo assim"], answer: 1, explain: "Um defaultMode que você mesmo definiu nas configurações de usuário é preservado; o Claude Code oferece um prompt único de troca, mas não sobrescreve a sua escolha. Os padrões gerenciados pela organização também não são alterados."}]} />

## Próximos passos

- [settings.json: O Sistema de Configuração](/docs/claude-code/settings)
- [Hooks](/docs/claude-code/hooks) — imponha regras de forma determinística, além de allow/deny
- [Mascaramento de Credenciais no Sandbox](/docs/claude-code/sandbox-credential-masking) — deixe `gh`, `npm` e `aws` se autenticarem sem que o comando em sandbox jamais detenha o segredo real
- [Segurança e Uso Responsável](/docs/security/responsible-use)
