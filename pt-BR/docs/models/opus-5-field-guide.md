# Claude Opus 5: o guia prático

> Source: https://derob98.github.io/ailmanac/pt-BR/docs/models/opus-5-field-guide · AILmanac (CC BY 4.0) · last verified 2026-07-25

O Opus 5 foi lançado em 24 de julho de 2026 como o quarto modelo da Anthropic em dois meses: o mesmo preço de $5/$25 do Opus 4.8, mas mais que o dobro da pontuação no Frontier-Bench, 3× no ARC-AGI-3 sobre o segundo melhor modelo e um novo nível de esforço xhigh/max. Os benchmarks que importam, os dois erros 400 que quebram migrações ingênuas e quando o Opus 5 substitui o Fable 5 na sua stack.

<LevelBadge level="intermediate" />

Em **24 de julho de 2026** a Anthropic lançou o **Claude Opus 5** (`claude-opus-5`) — o quarto modelo em dois meses, depois do Sonnet 5 (30 de junho) e do Fable 5 / Mythos 5 (9 de junho). A manchete é chata de propósito: **o mesmo preço de $5 de entrada / $25 de saída por MTok do Opus 4.8**, o mesmo contexto de 1M, o mesmo teto de saída de 128k. O interessante é o que esses números inalterados passam a comprar: **44,4% no Frontier-Bench v0.1 contra 18,7% do Opus 4.8** (mais que o dobro), **96,0% no SWE-bench Verified** e **30,16% no ARC-AGI-3 — cerca de três vezes os 7,78% do GPT-5.6 Sol e vinte vezes os 1,52% do Opus 4.8**. O Opus 5 agora é o **modelo padrão do Claude Max** e o mais forte disponível no Claude Pro.

Esta página é o guia prático: o que os números realmente significam para a sua stack, as duas mudanças de contrato da API que vão causar erro 400 numa migração ingênua, quando o Opus 5 substitui legitimamente o Fable 5 (e quando não) e o novo nível de esforço `xhigh` / `max`.

<Callout type="objectives" items={[
  "Saber o que é o Opus 5: contexto de 1M, saída de 128k, $5 de entrada / $25 de saída por MTok — o mesmo formato do Opus 4.8, com números sensivelmente melhores",
  "Entender as duas restrições da API que quebram migrações ingênuas: as limitações para desativar o thinking em esforço alto e o thinking ligado por padrão consumindo o seu orçamento de max_tokens",
  "Ler os benchmarks como os líderes de times de agentes os leem — Frontier-Bench, ARC-AGI-3, SWE-bench Pro, OSWorld 2.0 — e saber quais são relevantes para a sua carga de trabalho",
  "Fazer a conta de preço com honestidade: quando o Opus 5 em esforço max vence o Fable 5 em custo por tarefa resolvida e quando não vence",
  "Escolher o nível de esforço certo — os novos níveis xhigh e max se pagam no Frontier-Bench e no ARC-AGI-3 e desperdiçam tokens no resto",
  "Planejar a migração do Opus 4.1 para o Opus 5 antes da data de aposentadoria, 5 de agosto de 2026",
]} />

<VerifyNote lastVerified="2026-07-25" source="https://www.anthropic.com/news/claude-opus-5">
Data de lançamento, ID do modelo, preços, limites de contexto/saída, níveis de esforço e números de benchmark verificados em 25 de julho de 2026 no post de lançamento da Anthropic, na visão geral de modelos do Claude Platform e no guia de migração Opus 4.8 → Opus 5. O preço promocional de lançamento **não** se aplica ao Opus 5 — preço padrão de $5 de entrada / $25 de saída por MTok desde o lançamento. O modo rápido é uma superfície de modelo separada a $10 / $50 por MTok, ~2,5× mais rápido em tempo real. A Batch API tem 50% de desconto ($2,50 / $12,50). Acertos de cache de prompt custam $0,50/MTok e escritas de 5 min custam $6,25. O Opus 4.1 (`claude-opus-4-1-20250805`) é aposentado em **5 de agosto de 2026** — migre antes dessa data. Confira a tabela de [Current Models & Pricing](/docs/whats-new/models-and-pricing) antes de fixar um modelo.
</VerifyNote>

## A versão em um parágrafo

O Opus 5 é um **ganho de capacidade sem mudança de preço**, não um reajuste. Os mesmos $5 / $25 por MTok do Opus 4.8, a mesma janela de 1M de tokens, a mesma saída máxima de 128k na Messages API síncrona, a mesma data de corte de conhecimento confiável, deslocada para **maio de 2026**. O que mudou foi o que esses tokens fazem: no Frontier-Bench v0.1 (a avaliação de agentes de código mais difícil da própria Anthropic) o Opus 5 marca **44,4% em esforço `xhigh`** contra 18,7% do Opus 4.8 — mais que o dobro pelo mesmo preço de tabela. No ARC-AGI-3, a resolução de problemas inéditos salta de 1,52% para 30,16%. Duas mudanças de contrato vão quebrar migrações ingênuas: o adaptive thinking vem ligado por padrão e divide o seu orçamento de `max_tokens` com a resposta, e `thinking: {"type": "disabled"}` agora retorna **400** nos novos níveis de esforço `xhigh` ou `max`. O Opus 5 é o novo padrão do Claude Max, o modelo mais forte disponível no Claude Pro e está disponível pela Claude API, Bedrock (`anthropic.claude-opus-5`), Google Cloud (`claude-opus-5`), Microsoft Foundry e Claude Platform on AWS.

## O que realmente mudou em relação ao Opus 4.8

O Opus 4.8 foi lançado em abril de 2026 como o primeiro Opus com janela de contexto de 1M e adaptive thinking ligado por padrão. O Opus 5 mantém todos esses padrões, então, na rede, o formato da requisição e da resposta é quase idêntico. Quatro coisas mudaram:

- **Os números.** O Frontier-Bench v0.1 foi de 18,7% para 44,4% (xhigh) / 43,3% (max). O SWE-bench Multimodal de 38,4% para 59,4%. O OSWorld 2.0 de 55,7% para 70,57%. O Zapier AutomationBench de 17,0% para 26,0%. O ARC-AGI-3 de 1,52% para 30,16% em esforço alto.
- **Um novo nível de esforço `max`** fica acima do `xhigh`, e `thinking: {"type": "disabled"}` deixou de funcionar em `xhigh` ou `max` (erro 400). A ideia é que, nesses níveis, você está pagando explicitamente por raciocínio, então desativá-lo em silêncio agora é um bug, e não uma preferência.
- **A autoverificação agora é comportamento padrão**, não um hábito induzido pelo prompt. O guia de migração da Anthropic avisa explicitamente para **remover instruções manuais de "confira o seu trabalho"** — do contrário você tem verificação dupla e tokens queimados. Essa é a surpresa mais comum no primeiro dia rodando no Opus 5 um código que antes rodava no Opus 4.8.
- **O cache de prompt não é mais invalidado por mudanças de ferramentas no meio da conversa** (beta). Se o seu loop de agente troca a lista de ferramentas a cada passo, o prefixo do cache agora sobrevive; no Opus 4.8 você pagava uma escrita nova a cada vez.

## Os dois erros 400 que vão quebrar a migração

<Steps items={[
  {title: "thinking: disabled com xhigh ou max retorna 400", body: "O Opus 4.8 permitia desativar o thinking em qualquer nível de esforço. O Opus 5 só permite thinking: {\"type\": \"disabled\"} em esforço high ou menor. Combiná-lo com xhigh ou max é um erro duro. Se você tem um wrapper que sempre desativa o thinking (algumas equipes fazem isso para manter as respostas enxutas), ou reduza o esforço para high ou apague o campo thinking e deixe o adaptive thinking rodar."},
  {title: "O adaptive thinking consome o seu orçamento de max_tokens", body: "A mesma armadilha da migração para o Sonnet 5. max_tokens é um teto rígido sobre toda a saída: blocos de thinking mais o texto da resposta. Se você dimensionou max_tokens para 'só a resposta' no Opus 4.8 com o thinking desativado e não o desativa no Opus 5, verá respostas truncadas com stop_reason: 'max_tokens'. Aumente max_tokens, reduza o esforço para medium ou desative explicitamente o thinking em high ou menor."},
  {title: "O extended thinking manual continua dando 400", body: "Herdado do Opus 4.7 — thinking: {type: 'enabled', budget_tokens: N} retorna 400. Use effort. Se você calculava um orçamento por requisição, troque essa lógica por um seletor de esforço; o controlador adaptativo agora decide quanto pensar conforme a dificuldade da tarefa."},
  {title: "A autoverificação é padrão — remova a sua verificação no prompt", body: "Não é um 400, mas uma regressão silenciosa de custo. O Opus 5 itera e se autoverifica sem ser pedido. Qualquer andaime do tipo 'agora verifique sua resposta passo a passo' que você adicionou no 4.6 ou 4.8 vai disparar uma segunda passada de verificação e aproximadamente dobrar os tokens de thinking em prompts difíceis. Apague essas instruções e rode a sua avaliação de novo."}
]} />

<PromptCard title="Migração mínima e segura — Opus 4.8 para Opus 5">
{`# Before (Opus 4.8) — worked
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=4096,
    extra_body={"effort": "max"},
    thinking={"type": "disabled"},           # allowed on 4.8 at any effort
    system="After answering, verify your work step by step.",
    messages=[...],
)

# After (Opus 5) — three edits
response = client.messages.create(
    model="claude-opus-5",
    max_tokens=16384,                        # thinking now shares this budget
    extra_body={"effort": "max"},
    # thinking={"type": "disabled"}          # 400 at xhigh/max — remove it
    system="Answer the question.",           # drop the verify instruction — Opus 5 self-verifies
    messages=[...],
)`}
</PromptCard>

## Os benchmarks que realmente importam

A Anthropic publicou muitos números no dia do lançamento. Três são decisivos para cargas de trabalho reais, um é um troféu de marketing e dois merecem leitura cuidadosa porque mostram onde o Opus 5 *não* é a melhor escolha.

- **Frontier-Bench v0.1 — 44,4% (xhigh) contra 18,7% do Opus 4.8.** É a avaliação de programação agêntica mais difícil da Anthropic — tarefas de longo horizonte que exigem que o modelo execute ferramentas, itere e se autocorrija. O salto de 2,4× pelo mesmo preço é o motivo mais forte para migrar.
- **SWE-bench Verified — 96,0%.** Perto do teto. Se você usava o Opus 4.8 ou o Fable 5 para correções de bugs no estilo SWE-bench, o Opus 5 é um upgrade direto. Mas o SWE-bench Verified já é um benchmark saturado — pequenas diferenças não discriminam os modelos como antes.
- **OSWorld 2.0 — 70,57% contra 55,7% do Opus 4.8.** Benchmark de uso de computador. Se você roda Claude for Chrome, o modo navegador do Claude Cowork ou qualquer coisa que clique numa interface real, este é o número a acompanhar.
- **ARC-AGI-3 — 30,16% (esforço alto) contra 7,78% do GPT-5.6 Sol e 1,52% do Opus 4.8.** O troféu de marketing. O ARC-AGI-3 testa a resolução de problemas inéditos que resistem à memorização, e o Opus 5 tem cerca de 3× o segundo melhor modelo. Sinal relevante se a sua carga tem novidade de verdade; menos relevante se forem variações de coisas que a internet já resolveu.
- **SWE-bench Pro — 79,2% contra 80,0% do Fable 5.** O Fable 5 ainda supera o Opus 5 por 0,8 pp no SWE-bench Pro, mais difícil. Não basta para justificar o dobro do preço do Fable 5 para a maioria das equipes, mas, se você está no decil superior de complexidade de código e cada ponto importa, anote isso.
- **Exploração em cibersegurança — o Opus 5 fica atrás do Mythos 5.** A Anthropic diz explicitamente que o Opus 5 *não* é o melhor modelo de cibersegurança. Se você faz trabalho de ciberdefesa e a sua organização é verificada pelos programas de verificação da Anthropic, o Mythos continua sendo a escolha.

## Quando o Opus 5 substitui o Fable 5 (e quando não)

A pergunta interessante que este lançamento força: **quando você realmente precisa do preço de $10 / $50 do Fable 5?** A alegação da própria Anthropic é que o Opus 5 chega a 0,5% do pico do Fable 5 no CursorBench 3.2 pela metade do custo e iguala o resultado do Fable 5 no OSWorld 2.0 por "pouco mais de um terço do custo". Essa é a versão forte do argumento. A versão honesta:

- **Escolha o Opus 5** para programação agêntica, uso de computador, automação de negócios, raciocínio em ciências da vida e qualquer caso em que o custo por tarefa resolvida importe mais que os últimos 1-3 pp de qualidade. Isso é >90% das cargas de produção.
- **Escolha o Fable 5** quando a carga for (a) agentes de longa duração em que a execução *marginal* realmente se beneficia do último ponto percentual (a Anthropic apresenta o Fable 5 como "inteligência de próxima geração para agentes de longa duração"), (b) tarefas de código difíceis no estilo SWE-bench Pro em que você mediu uma diferença real, ou (c) qualquer carga que já esteja na parte da curva precisão-custo em que pagar o dobro compra qualidade real.
- **Escolha o Mythos** para trabalho de ciberdefesa, se a sua organização for verificada. Desde 6 de outubro de 2026 a porta de entrada é uma candidatura ao [Cyber Verification Program](https://support.claude.com/en/articles/14604842) — o sucessor do [Project Glasswing](https://anthropic.com/glasswing), que era só por convite — e o que os seus níveis concedem é o Mythos 5.1.

<PromptCard title="Honest cost-per-solved-task math">
{`# Fable 5 on a hard agentic task
#   ~500k input tokens, ~50k output tokens
#   500 * $10/M + 50 * $50/M = $5.00 + $2.50 = $7.50 per run
#   Fable 5 solve rate: ~46% (Frontier-Bench v0.1, xhigh)
#   Cost per solved task: $7.50 / 0.46 = ~$16.30

# Opus 5 on the same task
#   Same token budget
#   500 * $5/M + 50 * $25/M = $2.50 + $1.25 = $3.75 per run
#   Opus 5 solve rate: ~44.4% (Frontier-Bench v0.1, xhigh)
#   Cost per solved task: $3.75 / 0.444 = ~$8.45

# Opus 5 wins on cost-per-solved-task by ~48% at near-parity quality.
# Break-even: Fable 5 would need to be 2x cheaper per successful run,
# i.e. Opus 5 would have to drop below ~23% solve rate for Fable 5 to win.`}
</PromptCard>

## O novo nível max — quando ele se paga

O Opus 5 introduz o `max` como um nível explícito acima do `xhigh`. O adaptive thinking agora cobre `low → medium → high → xhigh → max`, e `high` é o padrão na Claude API e no Claude Code. Duas observações dos benchmarks de lançamento:

- No Frontier-Bench v0.1, o `xhigh` na verdade marca 44,4% contra 43,3% do `max` — o max *não* é estritamente melhor. Ele queima mais tokens por tentativa, mas o raciocínio extra nem sempre se converte em acertos nessa avaliação.
- Em tarefas que premiam deliberação longa — ARC-AGI-3, problemas de pesquisa inéditos, raciocínio matemático difícil (nível medalha de ouro da IMO 2026, 42/42) — os níveis mais altos se justificam.

A regra prática: **use `high` por padrão, suba para `xhigh` quando a sua avaliação mostrar ganhos mensuráveis e use `max` apenas em cargas em que você verificou que a profundidade de raciocínio importa mais que a vazão.** Não ligue o `max` na esperança de que dê certo; meça.

## Ciências da vida, segurança e postura em ciber

Três números que vale fixar:

- **Ciências da vida.** O Opus 5 está +10,2 pontos percentuais acima do Opus 4.8 em química orgânica e +7,7 pp em predição de proteínas. Se você constrói agentes para biologia estrutural, bioinformática ou planejamento de síntese, é um salto real — não uma melhora dentro do ruído.
- **Resistência a prompt injection.** No benchmark da Gray Swan, o sucesso do atacante cai de 5,5% do Opus 4.8 para **2,0%**. Nos ambientes de navegador do Claude Cowork, as salvaguardas do modo automático levam o sucesso de prompt injection no navegador a **0%** nas medições da Anthropic. Relevante para quem lança agentes no estilo Claude-for-Chrome.
- **Classificadores de ciber.** As salvaguardas de ciber do Opus 5 intervêm **~85% menos vezes do que no Fable 5** — como o Opus 5 deliberadamente não é o melhor modelo de ciber, a taxa de intervenção foi reduzida. Se você via recusas de segurança espúrias em prompts legítimos de pesquisa de segurança no Fable 5, o Opus 5 vai parecer bem menos de gatilho fácil.

## Cronograma de aposentadorias para planejar

- **Opus 4.1 (`claude-opus-4-1-20250805`)** é aposentado em **5 de agosto de 2026** — onze dias após o lançamento do Opus 5. Se alguma superfície de produção ainda fixa o Opus 4.1, migre esta semana.
- **Opus 4.5 / 4.6 / 4.7 / 4.8** continuam disponíveis como "Legacy models" na visão geral da plataforma, mas espere os ciclos padrão de depreciação de 12 meses. Trate o Opus 5 como alvo de migração para tudo que for novo.
- **O ID de modelo do Opus 5 é um snapshot fixado**, não um ponteiro sempre atualizado. Desde a geração 4.6, o formato de ID sem data continua significando "snapshot fixo". Um futuro `claude-opus-5-1` seria um ID novo, não uma atualização silenciosa do `claude-opus-5`.

## Experimente — um comando

<PromptCard title="Run Opus 5 with the recommended defaults">
{`# Python — Claude SDK
from anthropic import Anthropic
client = Anthropic()

response = client.messages.create(
    model="claude-opus-5",
    max_tokens=8192,                    # room for adaptive thinking + response
    extra_body={"effort": "high"},      # default; move to xhigh only if evals justify
    system="You are a senior engineer. Answer directly and iterate until the task is complete.",
    messages=[{"role": "user", "content": "..."}],
)

# Claude Code
claude --model claude-opus-5

# For fast mode (2.5x speed, 2x cost)
# model="claude-opus-5-fast"  # separate model ID, $10/$50 per MTok`}
</PromptCard>

## Cola rápida

<Flashcards cards={[
  {front: "Preço da API do Opus 5", back: "$5 por MTok de entrada, $25 por MTok de saída — idêntico ao Opus 4.8. A Batch API tem 50% de desconto ($2,50 / $12,50). Acertos de cache de prompt a $0,50/MTok."},
  {front: "Opus 5 vs Opus 4.8 no Frontier-Bench v0.1", back: "44,4% em xhigh (Opus 5) contra 18,7% (Opus 4.8). Mais que dobrou pelo mesmo preço."},
  {front: "Opus 5 vs Fable 5 em custo por tarefa resolvida", back: "O Opus 5 resolve com qualidade quase equivalente por cerca de metade do custo em tokens. Para o Fable 5 vencer em custo, a taxa de resolução do Opus 5 teria de cair abaixo de ~23%."},
  {front: "O novo nível de esforço", back: "max — fica acima do xhigh. No Frontier-Bench v0.1, o xhigh (44,4%) na verdade supera o max (43,3%). Use o max apenas onde se verificou que a profundidade de raciocínio importa."},
  {front: "A armadilha da autoverificação", back: "O Opus 5 se autoverifica por padrão. Instruções do tipo 'verifique sua resposta passo a passo' do Opus 4.6/4.8 agora disparam verificação dupla e aproximadamente dobram os tokens de thinking em prompts difíceis. Apague-as."},
  {front: "Os dois erros 400 na migração", back: "(1) thinking: disabled com xhigh ou max. (2) O budget_tokens manual de thinking continua dando 400 (herdado do 4.7). O adaptive thinking ligado por padrão também consome o seu max_tokens — aumente o teto."},
  {front: "Resultado no ARC-AGI-3", back: "30,16% em esforço alto — ~3× os 7,78% do GPT-5.6 Sol e ~20× os 1,52% do Opus 4.8. Troféu de marketing, mas sinal real em tarefas genuinamente inéditas."},
  {front: "Aposentadoria do Opus 4.1", back: "5 de agosto de 2026 — migre antes disso qualquer superfície de produção fixada em claude-opus-4-1-20250805."}
]} />

## Teste o que você aprendeu

<Quiz questions={[
  {
    q: "Você migra para o Opus 5 um wrapper que fixava `model=\"claude-opus-4-8\"`, `effort: \"max\"` e `thinking: {\"type\": \"disabled\"}`. O que acontece?",
    options: [
      "Roda normalmente — mesmo comportamento, números melhores.",
      "Retorna um erro 400 porque o thinking não pode ser desativado em esforço max no Opus 5.",
      "Ignora em silêncio o flag de desativação e roda com adaptive thinking.",
      "Rebaixa automaticamente para esforço xhigh."
    ],
    answer: 1,
    explain: "O Opus 5 só permite thinking: {\"type\": \"disabled\"} em esforço high ou menor. Combiná-lo com xhigh ou max retorna um 400 duro. Reduza o esforço para high ou remova o campo thinking e deixe o adaptive thinking rodar."
  },
  {
    q: "O seu prompt do Opus 4.8 termina com 'Agora verifique sua resposta passo a passo.' Você troca para o Opus 5 e vê aproximadamente o dobro do custo em tokens de thinking em prompts difíceis. Por quê?",
    options: [
      "O Opus 5 tem um bug no caminho de verificação.",
      "O tokenizador do Opus 5 é diferente, então as instruções de verificação custam mais.",
      "O Opus 5 se autoverifica por padrão; a instrução do prompt dispara uma segunda passada de verificação.",
      "O adaptive thinking está desativado no Opus 5."
    ],
    answer: 2,
    explain: "O guia de migração da Anthropic avisa explicitamente para remover a verificação induzida pelo prompt. O Opus 5 itera e se autoverifica sem ser pedido, então o andaime antigo causa verificação dupla. Apague a instrução e rode a sua avaliação de novo."
  },
  {
    q: "Para uma carga de produção de programação agêntica em que a taxa de resolução importa e o custo é uma restrição real, qual modelo os dados de lançamento do Opus 5 sustentam com mais força?",
    options: [
      "Fable 5 — vence no SWE-bench Pro por 0,8 pp, então a qualidade domina.",
      "Opus 5 — qualidade quase equivalente no Frontier-Bench e no CursorBench pela metade do preço de tabela do Fable 5.",
      "Sonnet 5 — a opção mais barata é sempre o padrão certo.",
      "Mythos 5 — o modelo de nível mais alto disponível."
    ],
    answer: 1,
    explain: "O Opus 5 chega a 0,5% do pico do Fable 5 no CursorBench 3.2 pela metade do custo. No Frontier-Bench, a conta de custo por tarefa resolvida mostra o Opus 5 vencendo por ~48% com qualidade quase equivalente. O Fable 5 só vence quando os últimos 1-3 pp de qualidade valem o dobro da conta de tokens."
  },
  {
    q: "Você define `effort: \"max\"` em toda requisição esperando qualidade estritamente melhor que a do `xhigh`. O que os dados de lançamento da Anthropic sugerem?",
    options: [
      "max é sempre estritamente melhor que xhigh — vale os tokens extras.",
      "max é pior que xhigh em todos os benchmarks — nunca use.",
      "max ajuda em algumas tarefas (raciocínio inédito, matemática difícil), mas no Frontier-Bench v0.1 o xhigh na verdade marca mais (44,4% contra 43,3%).",
      "max só funciona em tarefas de uso de computador."
    ],
    answer: 2,
    explain: "max não é estritamente melhor. No Frontier-Bench v0.1, o xhigh supera o max. Os níveis mais altos se justificam no ARC-AGI-3, em matemática nível IMO e em tarefas com problemas inéditos — meça antes de tornar o max o padrão."
  },
  {
    q: "Qual destas é a data de aposentadoria que você deve planejar após o lançamento do Opus 5?",
    options: [
      "O Opus 4.5 é aposentado em 5 de agosto de 2026.",
      "O Opus 4.1 (claude-opus-4-1-20250805) é aposentado em 5 de agosto de 2026.",
      "O Opus 4.8 é aposentado em 31 de dezembro de 2026.",
      "Não há aposentadorias ativas ligadas ao lançamento do Opus 5."
    ],
    answer: 1,
    explain: "O Opus 4.1 é aposentado em 5 de agosto de 2026 — onze dias após o lançamento do Opus 5. Qualquer superfície de produção ainda fixada em claude-opus-4-1-20250805 deve migrar antes dessa data."
  }
]} />

## Para onde ir a seguir

- [Claude Sonnet 5: The Field Guide](/docs/models/sonnet-5-field-guide) — o nível equilibrado e padrão do Claude Code; migrar do Sonnet 4.6 tem suas próprias armadilhas 400
- [Fable 5 & Mythos 5: The Flagship Field Guide](/docs/models/fable-5-mythos-5-flagship) — quando o nível de topo realmente vale o dobro do custo
- [Choosing a Model in 2026](/docs/models/choosing-a-model) — a árvore de decisão de toda a linha da Anthropic
- [Adaptive Thinking & Effort Tuning](/docs/api/thinking-and-effort) — como o esforço se traduz em gasto real de tokens
- [Prompt Caching Economics](/docs/frontiers/prompt-caching-economics) — a conta de acertos de cache que transforma o preço de manchete do Opus 5 na sua fatura real
- [Current Models & Pricing](/docs/whats-new/models-and-pricing) — a tabela sempre atual; consulte antes de fixar um modelo

## Fontes e leitura adicional

- [Introducing Claude Opus 5 — Anthropic (24 July 2026)](https://www.anthropic.com/news/claude-opus-5) — o post de lançamento, as tabelas de benchmark e as notas de segurança
- [Claude Platform docs — Models overview](https://platform.claude.com/docs/en/models/overview) — tabelas de preço, IDs de snapshot, identificadores de Bedrock/GCP, padrões de esforço
- [Migration guide — Opus 4.8 to Opus 5](https://platform.claude.com/docs/en/about-claude/models/migration-guide) — a lista oficial de mudanças de contrato e o aviso sobre autoverificação
- [MarkTechPost — Opus 5 launch coverage (24 July 2026)](https://www.marktechpost.com/2026/07/24/meet-the-new-claude-opus-5-frontier-class-agentic-coding-and-computer-use-at-unchanged-opus-pricing/) — detalhamento benchmark a benchmark, incluindo SWE-bench, ARC-AGI-3 e Chartography
- [Interesting Engineering — Opus 5 coding coverage](https://interestingengineering.com/culture/anthropic-claude-opus-5-coding-performance) — enfoque em custo por tarefa
- [TheNextWeb — Opus 5 launch analysis](https://thenextweb.com/news/anthropic-claude-opus-5-launch-frontier-bench-coding) — cadência de lançamentos e comparação com o Fable 5
- [BigGo Finance — Opus 5 pricing analysis](https://finance.biggo.com/news/f43fc4c1-53fd-4f49-9e0e-4246307a0391) — economia do modo rápido e mudanças no cache de prompt
- [Model deprecations — Anthropic](https://platform.claude.com/docs/en/about-claude/model-deprecations) — a data de aposentadoria do Opus 4.1 e a política geral de ciclo de vida


## Próximo

- [Claude Opus 5.5: The Field Guide](/docs/models/opus-5-5-field-guide) — o sucessor, lançado em 22 de setembro de 2026: $4/$20, leituras de cache numa faixa de 5% e mais quatro mudanças incompatíveis além das acima
- [Claude Sonnet 5: The Field Guide](/docs/models/sonnet-5-field-guide)
