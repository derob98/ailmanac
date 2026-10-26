# Ajuste de esforço: 5 níveis, padrões por modelo e a armadilha do cache

> Source: https://derob98.github.io/ailmanac/pt-BR/docs/api/effort-tuning · AILmanac (CC BY 4.0) · last verified 2026-10-19

O parâmetro effort de julho de 2026 tem cinco níveis — low, medium, high, xhigh, max — e fica dentro de output_config, não no nível superior. Ele afeta as chamadas de ferramentas (não só o raciocínio), invalida o cache de prompt quando mudado no meio da conversa, e cada modelo tem um ponto de partida recomendado diferente. O guia prático de ajuste.

<LevelBadge level="intermediate" />

Em **22 de julho de 2026**, a Anthropic incorporou o `effort` à configuração de modelo do Claude Managed Agents, fechando o ciclo de um controle que a Messages API discretamente ampliou para cinco níveis. Se você ainda copia `effort="high"` no nível superior de `messages.create` de um post de blog do início de 2026, sua requisição parece válida, mas o Claude pode não estar respeitando o campo que você imagina — o parâmetro agora fica dentro de `output_config`, e a API só aplica os níveis documentados na ficha do modelo.

Este é o guia prático de ajuste: onde o `effort` realmente entra em uma requisição, o que os cinco níveis fazem de fato (eles mudam o número de chamadas de ferramentas, não apenas a profundidade do raciocínio), os padrões por modelo que vão te surpreender e a armadilha que silenciosamente dispara o gasto — mudar o esforço no meio da conversa invalida o cache de prompt.

<Callout type="objectives" items={[
  "Posicionar o campo effort corretamente — dentro de output_config na Messages API, no objeto model nos Managed Agents, via /effort ou CLAUDE_CODE_EFFORT_LEVEL no Claude Code",
  "Escolher um nível inicial por modelo — high é o padrão da API na maioria dos modelos, mas NÃO no Opus 5.5 e no Haiku 5.5, que usam medium por padrão, e o esforço inicial recomendado ainda varia por cima disso (Sonnet 5.5 medium para programação agêntica, Sonnet 4.6 medium, Opus 4.7/4.8 xhigh, Fable 5.1 high)",
  "Entender que o esforço afeta TODOS os tokens — texto, chamadas de ferramentas e (quando ativo) o raciocínio — então reduzir o esforço diminui o número de chamadas de ferramentas, não só a verbosidade",
  "Evitar a armadilha do cache — variar o esforço dentro de uma mesma conversa invalida o prompt caching e pode dobrar sua conta sem aviso",
  "Conhecer a superfície de esforço do Claude Code — /effort, ultrathink (um turno), ultracode (xhigh + permissão permanente para multiagente), variável de ambiente CLAUDE_CODE_EFFORT_LEVEL",
]} />

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/build-with-claude/effort">
Verificado com a documentação oficial de effort da Anthropic. Os padrões por modelo, as listas de disponibilidade de `xhigh`/`max` e o status beta e a cobertura de modelos do esforço por mensagem mudam entre versões — confira a fonte antes de fixar um comportamento em produção.
</VerifyNote>

## Os cinco níveis (e onde entra o "ultracode")

A escala de esforço em 22 de julho de 2026 tem **cinco** valores que a API aceita:

| Nível | O que faz | Quando usar |
|---|---|---|
| `low` | O mais eficiente. Economia significativa de tokens com alguma redução de capacidade. Menos chamadas de ferramentas, confirmações curtas, sem preâmbulo. | Classificação simples, cargas de alto volume, chat, UX sensível à latência, subagentes com tarefas delimitadas |
| `medium` | Equilibrado. Economia moderada de tokens em relação ao high. | Tarefas agênticas que precisam equilibrar velocidade, custo e qualidade; redução consciente de custo a partir do high |
| `high` | Alta capacidade. **Equivale a omitir o parâmetro — em todos os modelos, exceto Opus 5.5 e Haiku 5.5, que usam `medium` por padrão.** | Raciocínio complexo, programação difícil, tarefas agênticas em que a qualidade importa mais que a velocidade |
| `xhigh` | Capacidade estendida para trabalho de longo prazo. Espere um uso de tokens bem maior que o high. | Tarefas agênticas e de programação longas (30+ min), orçamentos de tokens na casa dos milhões, refatorações profundas em vários arquivos |
| `max` | Capacidade máxima absoluta, sem limite de gasto de tokens. | Apenas problemas realmente de fronteira. Pode pensar demais em tarefas de saída estruturada. |

Nem `max` nem `xhigh` são universais — confira o nível contra o modelo antes de publicar. O `xhigh` é suportado no **Fable 5.1, Mythos 5.1, Fable 5, Mythos 5, Opus 5.5, Opus 5, Opus 4.8, Opus 4.7, Sonnet 5.5, Sonnet 5 e Haiku 5.5**. O `max` cobre todos esses mais **Mythos Preview, Opus 4.6 e Sonnet 4.6**. O Opus 4.5 suporta effort, mas nenhum dos dois níveis mais altos. Nas palavras da Anthropic: "Not every model that supports `max` supports `xhigh`."

<Callout type="tip" items={[
  "Definir o esforço como o padrão do próprio modelo produz exatamente o mesmo comportamento que omitir o parâmetro — isso é 'high' na maioria dos modelos, mas 'medium' no Opus 5.5 e no Haiku 5.5. Não o defina 'só para ser explícito' em uma conversa com cache, porque escrever o campo em algumas requisições e não em outras invalida o cache.",
  "'ultracode' não é um sexto nível. É xhigh + uma permissão permanente para o Claude Code iniciar fluxos multiagente, concedida por mensagens de sistema no meio da conversa. A API aceita cinco valores.",
]} />

## A estrutura do campo que a maioria dos posts erra

Os textos do início de 2026 sobre o parâmetro effort mostram um campo no nível superior:

```python
# WRONG on current models — silently ignored or 400
client.messages.create(
    model="claude-opus-4-8",
    effort="medium",
    ...
)
```

A API atual coloca o `effort` dentro de um objeto `output_config`, e o passa como irmão de `messages`/`model`:

<PromptCard title="Posicionamento correto do effort — Messages API">
{`import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=4096,
    output_config={"effort": "medium"},
    messages=[{
        "role": "user",
        "content": "Analyse the trade-offs between microservices and monoliths."
    }],
)

print(response.content[0].text)`}
</PromptCard>

No Claude Managed Agents (a mudança de 22 de julho de 2026), o `effort` vai dentro do objeto `model` do agente, no momento da criação. A sessão não o define — quem define é a versão do agente.

<PromptCard title="Posicionamento correto do effort — Managed Agents (POST /v1/agents)">
{`# Effort travels with the versioned agent config,
# not the per-run session. Every session pinned to
# this agent version runs at xhigh.

POST https://api.anthropic.com/v1/agents
{
  "name": "code-reviewer",
  "model": {
    "id": "claude-opus-4-8",
    "effort": "xhigh"
  },
  "system_prompt": "You review pull requests for security issues.",
  "tools": [...],
  "mcp_servers": [...]
}`}
</PromptCard>

## Esforço não é um controle de raciocínio

Este é o segundo grande equívoco. O esforço funciona **com o raciocínio ligado ou não**, e muda os tokens que o Claude gasta em partes da resposta que não são raciocínio:

- **Chamadas de ferramentas.** Menos esforço → menos chamadas de ferramentas. O Claude combina operações em chamadas únicas, pula explorações opcionais e parte para a ação sem preâmbulo.
- **Tamanho do texto.** Menos esforço → saída mais enxuta. Confirmações curtas após as chamadas de ferramentas, em vez de resumos detalhados. Menos comentários no código.
- **Profundidade do raciocínio** (quando o raciocínio está ativo). Menos esforço → pula o raciocínio por completo em prompts fáceis; ainda raciocina nos realmente difíceis, só que menos.

Este último ponto importa: no esforço `low`, o Claude ainda vai raciocinar diante de um problema de demonstração, porque a tarefa exige. O esforço é um *sinal de comportamento*, não um orçamento rígido de tokens. Não espere um teto fixo.

O parâmetro `thinking` e o parâmetro `effort` respondem a perguntas diferentes. O `thinking` decide se o Claude produz blocos de raciocínio. O `effort` decide quanto trabalho vai para a resposta inteira — incluindo com que frequência e com que profundidade o Claude raciocina quando o raciocínio adaptativo está ativo. Passar `effort="adaptive"` é um erro comum; `adaptive` é um *modo de raciocínio*, não um nível de esforço.

<Callout type="tip">
No <strong>Opus 4.5</strong> — o único modelo só de raciocínio estendido que suporta effort — você define o esforço <em>e</em> `budget_tokens` juntos. Escolha o nível de esforço para a sua tarefa e depois dimensione o orçamento de tokens de raciocínio para a profundidade desejada. Todos os outros modelos compatíveis com effort usam raciocínio adaptativo e não aceitam `budget_tokens`.
</Callout>

## Pontos de partida por modelo que surpreendem as equipes

O padrão da API é `high` na maioria dos modelos compatíveis com effort — **mas não em todos. Opus 5.5 e Haiku 5.5 usam `medium` por padrão.** Além disso, o *esforço inicial recomendado* pela Anthropic varia por modelo, e é nessa diferença que as equipes gastam a mais ou a menos.

<Steps items={[
  {title: "Opus 5.5 — o padrão é medium, não high", body: "O Opus 5.5 é o único Opus que usa medium por padrão, então uma requisição que omite o effort roda um nível ABAIXO do mesmo código no Opus 5. Se você migrou e a qualidade caiu, essa é a primeira coisa a verificar. O raciocínio adaptativo está sempre ligado e não pode ser desativado (thinking: {type: 'disabled'} retorna 400 em todos os níveis), então o esforço é o seu único controle sobre quanto ele raciocina e quanto a requisição custa. Faça uma nova varredura de esforço em vez de levar as configurações antigas — em um dado nível, ele raciocina mais por turno do que o Opus 5."},
  {title: "Haiku 5.5 — também usa medium por padrão, e low é o nível da economia", body: "O outro modelo com padrão medium, e o primeiro Haiku a suportar effort. Comece em medium para a maior parte do trabalho, incluindo programação agêntica. Use low — o mais barato e rápido — para chat, tarefas curtas com ferramentas e requisições simples de alto volume, mas saiba o preço: em prompts longos de agente no low, ele tem mais chance de pular uma busca, parar cedo ou pular uma verificação. Suba para high em trabalho de conhecimento, tarefas de agente mais longas e seguimento estrito de instruções. Compare xhigh/max com o Sonnet 5.5 em custo e velocidade antes de se comprometer."},
  {title: "Fable 5.1 e Sonnet 5.5 — high continua sendo o padrão", body: "Ambos usam high por padrão e suportam os cinco níveis. No Fable 5.1, comece em high, suba para xhigh/max no trabalho agêntico e de programação mais sensível à capacidade, e desça para medium/low quando suas avaliações mostrarem que a qualidade se mantém. Os níveis do Sonnet 5.5 foram RECALIBRADOS em relação ao Sonnet 5 — um nível não compra mais a mesma quantidade de raciocínio, então refaça a varredura. Para programação agêntica no Sonnet 5.5, comece em medium para tarefas bem especificadas e passe para high nas mais difíceis; para programação agêntica, defina max_tokens como 128.000, o máximo do modelo, e use streaming."},
  {title: "Sonnet 5 — comece em high (o padrão)", body: "O Sonnet 5 usa high por padrão tanto na API quanto no Claude Code, e a recomendação coincide. Suba para xhigh apenas nas tarefas mais difíceis de programação e agentes. Desça para medium como medida de economia — o medium do Sonnet 5 é comparável ao Sonnet 4.6 em high. Use low para chat e cargas sem programação e sensíveis à latência."},
  {title: "Sonnet 4.6 — comece em medium, sobrescreva o padrão", body: "O Sonnet 4.6 usa high por padrão, mas a própria orientação da Anthropic recomenda medium como padrão equilibrado para a maioria das aplicações, incluindo programação agêntica. Defina explicitamente effort='medium' — caso contrário você herda o high e paga por uma latência que não pediu."},
  {title: "Opus 4.7 e 4.8 — comece em xhigh para programação, high para o resto", body: "O padrão é high, mas a recomendação para programação e trabalho agêntico é xhigh. Use high como mínimo em cargas sensíveis à inteligência. Desça para medium apenas quando suas avaliações mostrarem que a qualidade se mantém. Reserve o max para problemas realmente de fronteira — na maioria das cargas, o max acrescenta um custo significativo por ganhos pequenos de qualidade, e em tarefas de saída estruturada pode pensar demais."},
  {title: "O Opus 4.7 respeita low/medium com mais rigor — peça profundidade no prompt se precisar", body: "O Opus 4.7 (e o 4.8) delimitam o trabalho de forma mais estreita em low/medium do que o Opus 4.6. Se você notar raciocínio raso em um prompt complexo no low, aumente o esforço em vez de tentar contornar no prompt. Se a latência o obrigar a ficar no low, acrescente uma linha direcionada como 'This task involves multistep reasoning. Think carefully before responding.'"},
  {title: "Fable 5 e Mythos 5 — high é o controle principal", body: "O esforço é a principal alavanca de inteligência/latência/custo no Fable 5. Comece em high (o padrão), use xhigh para o trabalho mais sensível à capacidade e desça para medium ou low em tarefas de rotina — os níveis mais baixos no Fable 5 ainda superam modelos anteriores no xhigh. Defina um max_tokens grande em high/xhigh, já que ele limita raciocínio e texto da resposta combinados."},
  {title: "Opus 4.7/4.8 em xhigh ou max — aumente o max_tokens para pelo menos 64k", body: "Os dois modelos podem gastar muito entre subagentes e chamadas de ferramentas em xhigh/max. A Anthropic recomenda começar o max_tokens em 64k e ajustar a partir daí. Deixe em 4096 e você receberá uma resposta truncada com stop_reason='max_tokens' depois de um início promissor."},
]} />

## A armadilha do cache — a que dobra sua conta em silêncio

O prompt caching oferece leituras de cache por uma fração do preço padrão de entrada (um décimo na maioria dos modelos, menos nos mais novos — veja [Preços](https://platform.claude.com/docs/en/about-claude/pricing)). Mudar o `output_config.effort` de **nível superior** entre requisições da mesma conversa **invalida o cache**, exatamente como trocar de modelo: o esforço de nível superior molda o prompt renderizado, então um valor novo significa que nenhum prefixo em cache corresponde. Em um contexto longo, isso é uma releitura a preço cheio de todo o seu histórico, em cada turno seguinte.

### A saída de emergência: esforço por mensagem (beta)

Os modelos mais novos permitem mudar o esforço *sem* perder o cache. Adicione uma mensagem `role: "system"` com `content` vazio carregando o novo nível em `output_config.effort`, e tudo o que vem antes continua idêntico byte a byte — então o prefixo em cache ainda corresponde.

<PromptCard title="Mudar o effort no meio da conversa sem perder o cache">
{`# Beta header required:
#   anthropic-beta: mid-conversation-output-config-2026-07-01

{
  "model": "claude-fable-5-1",
  "max_tokens": 4096,
  "output_config": {"effort": "high"},
  "messages": [
    {"role": "user", "content": "Plan a migration from SQLite to PostgreSQL."},
    {"role": "assistant", "content": "1. Export... 2. Create schema... 3. Import."},
    {"role": "system", "content": [], "output_config": {"effort": "low"}},
    {"role": "user", "content": "Summarize the plan in one sentence."}
  ]
}`}
</PromptCard>

Disponibilidade em 19 de outubro de 2026: na Claude API e no Google Cloud, funciona no **Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Sonnet 5.5 e Haiku 5.5**; no Amazon Bedrock, apenas no **Fable 5.1, Mythos 5.1 e Opus 5.5**. Exige o cabeçalho beta `mid-conversation-output-config-2026-07-01` — sem ele, um `output_config` por mensagem retorna `400 messages.N.output_config: Extra inputs are not permitted`. Com o cabeçalho, mas com um modelo sem suporte (o Fable 5 entre eles), você recebe `400 output_config.effort requires a model that supports per-turn effort; this model does not`.

Dois modelos se recusam a mudar o esforço por turno quando o raciocínio está fixado: o **Sonnet 5.5 com `thinking: {"type": "between_tools"}`** e o **Haiku 5.5 com `thinking: {"type": "disabled"}`** retornam 400 se um nível por mensagem for diferente do que está em vigor. Use o raciocínio adaptativo para variar o esforço nesses casos.

Em todo o resto, a regra antiga continua valendo — escolha um nível e mantenha:

<Callout type="tip" items={[
  "Em modelos sem esforço por mensagem, varie o esforço ENTRE cargas de trabalho, não DENTRO de uma conversa com cache. Escolha o nível no início da conversa; mantenha-o constante até dar /clear.",
  "Prefira o esforço por mensagem a uma mudança de nível superior mesmo quando ambos funcionam: no Fable 5.1, uma troca no nível superior também direciona o modelo de forma menos confiável, porque as respostas anteriores foram escritas no nível antigo e ele tende a manter a coerência com elas.",
  "No Claude Code, /effort no meio da sessão equivale a trocar de modelo — espere um grande cache miss no turno seguinte.",
  "Se você precisa aprofundar o raciocínio em um único turno, use 'ultrathink' no Claude Code (um reforço de raciocínio mais profundo por um turno) em vez de /effort xhigh — isso evita mudar a configuração da sessão.",
  "Se precisar escalar pelo resto da sessão, faça isso cedo. Uma troca no turno 3 é barata; uma troca no turno 30 relê 30 turnos de contexto a preço cheio.",
]} />

O corolário: definir `effort="high"` explicitamente em algumas requisições com cache e omiti-lo em outras invalida o cache da mesma forma — porque os dois são *equivalentes no comportamento*, mas *diferentes no texto*. Escolha uma convenção (sempre definir, ou sempre omitir) e mantenha.

## Claude Code — a superfície da CLI

O Claude Code expõe o esforço como um comando interativo, uma flag de inicialização e uma variável de ambiente (vence a de maior prioridade, nessa ordem inversa):

```bash
# In-session (interactive slider, or direct)
/effort
/effort xhigh
/effort auto           # reset to model default

# At launch
claude --effort low

# Environment (overrides everything else)
CLAUDE_CODE_EFFORT_LEVEL=high claude
```

Dois comandos relacionados merecem atenção porque não são níveis de esforço, mas se comportam de forma parecida:

- **`ultrathink`** — um reforço de raciocínio mais profundo por um turno que *não* muda o esforço da sessão. Use quando quiser que o próximo turno pense mais sem invalidar o cache de todos os turnos seguintes.
- **`ultracode`** — define `xhigh` para a sessão inteira **e** concede permissão permanente para o Claude Code iniciar fluxos multiagente (via mensagens de sistema no meio da conversa). A API não tem um valor `ultracode` — é uma conveniência da CLI que combina `xhigh` com uma permissão de orquestração.

Regras de persistência para lembrar: `low`, `medium`, `high` e `xhigh` persistem entre sessões do Claude Code depois de definidos. O `max` vale só para a sessão atual — você precisa reaplicá-lo na próxima.

## Um passo a passo de ajuste — um prompt, três esforços

Para calibrar a intuição, rode o *mesmo* prompt em três níveis e compare o formato da saída:

<PromptCard title="Prompt de calibração de ajuste (rode em low, high, xhigh)">
{`Task: Review this pull request for security issues.

<pr_diff>
[paste a real diff — 300+ lines, multi-file, at least one auth-touching change]
</pr_diff>

Report: severity-tagged findings + a one-line fix per finding.
Do not restate what the diff does.`}
</PromptCard>

Espere, aproximadamente:

- **low** — pega os problemas óbvios de alta severidade (concatenação de strings SQL, entrada do usuário sem verificação em um cabeçalho). Deixa passar bugs de lógica sutis. 1-2 chamadas de ferramentas, se houver ferramentas. Saída curta. Rápido.
- **high** — análise completa. Pega a maioria das vulnerabilidades, inclusive as sutis. Várias chamadas de ferramentas direcionadas para ler arquivos relacionados. Achados estruturados. É onde a maioria das equipes para.
- **xhigh** — exaustivo. Considera vetores de ataque novos e defesa em profundidade. Lê arquivos adjacentes que low/high não tocaram. Muito mais chamadas de ferramentas. Uso de tokens bem maior.

Se suas avaliações mostrarem que `high` e `xhigh` produzem os mesmos achados na sua base de código, publique com `high`. O valor do xhigh aparece especificamente quando a tarefa se beneficia de chamadas repetidas de ferramentas e exploração detalhada — que é exatamente quando a Anthropic o recomenda.

## O Sonnet 5 deslocou a calibração — não porte níveis às cegas

Se você rodava o Sonnet 4.6 em `high` e migrou para o Sonnet 5, manter o mesmo nível faz o Sonnet 5 gastar algo mais próximo do que o Sonnet 4.6 gastava em `max` — a escala de esforço do Sonnet 5 foi *deslocada*. A orientação da própria Anthropic: **Sonnet 5 medium ≈ Sonnet 4.6 high**. É uma variação de custo por requisição que vale conferir se você reproduziu o tráfego sem ajustar o esforço. Veja o [guia de campo do Sonnet 5](/docs/models/sonnet-5-field-guide) para a história completa da migração.

## Fixe o aprendizado

<Flashcards cards={[
  {front: "Onde fica o campo effort na Messages API?", back: "Dentro de um objeto output_config no nível superior de messages.create — output_config: {effort: 'medium'}. Não é um argumento effort de nível superior."},
  {front: "Quais são os cinco níveis de esforço?", back: "low, medium, high, xhigh, max. high é o padrão na maioria dos modelos — mas Opus 5.5 e Haiku 5.5 usam medium por padrão."},
  {front: "Quais modelos usam esforço medium em vez de high por padrão?", back: "Opus 5.5 e Haiku 5.5. No Opus 5.5, isso significa que o código migrado do Opus 5 roda um nível ABAIXO, a menos que você defina o effort explicitamente."},
  {front: "O esforço afeta algo além do raciocínio?", back: "Sim — afeta TODOS os tokens da resposta: texto, chamadas de ferramentas (menos esforço → menos chamadas) e raciocínio, quando ativo."},
  {front: "O que acontece se você muda o esforço no meio da conversa?", back: "Uma mudança de NÍVEL SUPERIOR invalida o prompt caching, exatamente como trocar de modelo. A forma por mensagem — uma mensagem role:'system' com content vazio e o novo output_config.effort, atrás do cabeçalho beta mid-conversation-output-config-2026-07-01 — preserva o cache no Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Sonnet 5.5 e Haiku 5.5."},
  {front: "'ultracode' é um sexto nível de esforço?", back: "Não. Ultracode é uma conveniência da CLI do Claude Code que define xhigh E concede permissão permanente para orquestração multiagente. A API aceita apenas os cinco níveis documentados."},
  {front: "Qual é o esforço recomendado para Opus 4.7/4.8 em tarefas de programação?", back: "xhigh — e aumente o max_tokens para pelo menos 64k, para que o modelo tenha espaço para raciocinar e chamar ferramentas entre subagentes."},
  {front: "Como a escala de esforço do Sonnet 5 se compara à do Sonnet 4.6?", back: "Deslocada. O medium do Sonnet 5 equivale aproximadamente ao Sonnet 4.6 em high. Não porte os níveis de esforço 1:1 na migração."},
  {front: "Onde fica o effort no Claude Managed Agents?", back: "Dentro do objeto model da configuração versionada do agente, na criação do agente (POST /v1/agents) — não por sessão. Lançado em 22 de julho de 2026."},
]} />

<Quiz title="Teste a si mesmo" questions={[
  {q: "Qual destes NÃO é um valor de effort válido na Messages API?", options: ["low", "medium", "adaptive", "xhigh"], answer: 2, explain: "'adaptive' é um modo de raciocínio, não um nível de esforço. Os cinco valores válidos são low, medium, high, xhigh, max."},
  {q: "Você está em uma conversa de 20 turnos com cache e muda o effort de NÍVEL SUPERIOR de high para xhigh no turno 21. O que acontece?", options: ["Nada — o effort é uma dica de execução que não toca o cache", "A próxima requisição custa um pouco mais porque o Claude pensa mais", "A próxima requisição invalida o cache e relê os 20 turnos anteriores a preço cheio de entrada", "A API retorna 400 porque o effort não pode mudar no meio da conversa"], answer: 2, explain: "O effort de nível superior molda o prompt renderizado, então mudá-lo invalida o prompt caching como a troca de modelo. Em um histórico longo, isso pode multiplicar por 10 a conta de entrada do turno seguinte. A forma por mensagem (uma mensagem role:'system' atrás do beta mid-conversation-output-config-2026-07-01) evita isso nos modelos mais novos."},
  {q: "Você está no Opus 5.5 e omite o parâmetro effort por completo. Qual nível roda?", options: ["high — o padrão da API em todos os modelos", "medium — o Opus 5.5 é um de dois modelos com padrão medium", "low — omitir o effort minimiza o gasto", "xhigh — os modelos Opus usam xhigh por padrão para programação"], answer: 1, explain: "Opus 5.5 e Haiku 5.5 usam medium por padrão; todos os outros modelos compatíveis com effort usam high. O código migrado do Opus 5 roda, portanto, um nível abaixo do que rodava, a menos que você defina o effort explicitamente."},
  {q: "Você está no Claude Code e quer que apenas o PRÓXIMO turno raciocine mais, sem mexer na configuração de esforço da sessão. Melhor jogada?", options: ["/effort max, depois /effort auto após o turno", "Usar ultrathink nesse único turno", "Reiniciar o Claude Code com --effort xhigh", "Definir CLAUDE_CODE_EFFORT_LEVEL=max em um subshell"], answer: 1, explain: "O ultrathink é exatamente isso — um reforço de raciocínio mais profundo por um turno que não muda o esforço da sessão, então não invalida o cache nos turnos seguintes."},
  {q: "No Opus 4.8 com effort='xhigh', suas respostas continuam truncando com stop_reason='max_tokens' depois de um raciocínio longo. Correção mais provável?", options: ["Baixar o effort para high", "Aumentar o max_tokens para 64k ou mais", "Desligar o raciocínio", "Trocar para o Opus 4.7"], answer: 1, explain: "O max_tokens limita raciocínio e texto da resposta combinados. No xhigh, a Anthropic recomenda começar o max_tokens em 64k. Um limite dimensionado para 'só a resposta' trunca respostas que envolvem muito raciocínio interno."},
  {q: "Onde vai o effort ao criar um agente no Claude Managed Agents (a atualização de julho de 2026)?", options: ["Em cada sessão, em POST /v1/sessions", "Como campo de nível superior em POST /v1/agents", "Dentro do objeto model em POST /v1/agents", "Na mensagem de sistema no meio da conversa"], answer: 2, explain: "A atualização de 22 de julho de 2026 permite passar 'effort' dentro do objeto model na criação do agente. As sessões herdam o effort da versão do agente fixada — você não o define a cada execução."},
  {q: "Qual mudança faz o 'medium' do Sonnet 5 se comportar de forma mais próxima ao Sonnet 4.6 em 'high'?", options: ["O Sonnet 5 usa uma janela de contexto menor", "A escala de esforço foi deslocada entre os dois modelos", "O Sonnet 5 desativa o uso de ferramentas no medium", "O medium foi renomeado no Sonnet 5"], answer: 1, explain: "A orientação da própria Anthropic: Sonnet 5 medium ≈ Sonnet 4.6 high. Não porte os níveis de esforço 1:1 na migração."}
]} />

## Fontes e leitura complementar

- [Anthropic — Effort (build-with-claude/effort)](https://platform.claude.com/docs/en/build-with-claude/effort) — referência oficial dos cinco níveis, de `output_config.effort` e das recomendações por modelo
- [Anthropic — Thinking (build-with-claude/thinking)](https://platform.claude.com/docs/en/build-with-claude/thinking) — como o effort interage com o raciocínio adaptativo e quando usar cada controle
- [Notas de versão da plataforma Anthropic — entrada de 22 de julho de 2026](https://platform.claude.com/docs/en/release-notes/overview) — o lançamento do `effort` nos Managed Agents e as mudanças de webhook / sessão inicial entregues no mesmo dia
- [Prompting Claude Sonnet 5 — calibrando esforço e profundidade de raciocínio](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5) — o deslocamento da escala de esforço do Sonnet 5 e quando usar xhigh
- [Anthropic — Task budgets](https://platform.claude.com/docs/en/build-with-claude/task-budgets) — orçamentos de tokens consultivos para ciclos agênticos completos, um complemento ao effort em execuções longas
- [AILmanac — Raciocínio Estendido & Esforço](/docs/api/thinking-and-effort) — a introdução que esta página pressupõe
- [AILmanac — Claude Sonnet 5: O Guia de Campo](/docs/models/sonnet-5-field-guide) — a história de migração e recalibração
- [AILmanac — Prompt caching](/docs/api/prompt-caching) — a economia do cache que torna a mudança de esforço no meio da conversa tão cara


## Próximo

- [A ferramenta advisor: o Sonnet faz o trabalho, o Fable faz o raciocínio](/docs/api/advisor-tool)
