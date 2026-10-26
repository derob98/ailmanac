# Kimi K2 para Usuários do Claude

> Source: https://derob98.github.io/ailmanac/pt-BR/docs/models/kimi-k2-for-claude-users · AILmanac (CC BY 4.0) · last verified 2026-07-11

Fluente em Claude, curioso sobre o Kimi K2 da Moonshot? O modelo agêntico de pesos abertos para o qual você pode realmente apontar o Claude Code — porque a Moonshot oferece um endpoint compatível com a Anthropic. O que é genuinamente diferente, e o que se transfere.

<LevelBadge level="intermediate" />

Você já pensa em Claude. Então o r/LocalLLaMA não para de falar sobre o **Kimi K2** — o modelo de pesos abertos e agent-first da Moonshot AI, que enfileira chamadas de ferramenta ao longo de centenas de passos sem perder o fio da meada, por uma fração dos preços de fronteira. Aqui está a parte que o torna diferente de toda outra história de "mude para X": como a Moonshot oferece um **endpoint compatível com a Anthropic**, você pode apontar seu **Claude Code** existente para o Kimi K2 mudando duas variáveis de ambiente. Nada mais no seu fluxo de trabalho se move. Esta página mapeia seu modelo mental de Claude sobre o Kimi K2, mostra a troca exata e sinaliza o punhado de coisas que genuinamente diferem.

<Callout type="objectives" items={[
  "Traduzir conceitos de Claude para seus equivalentes no Kimi K2 (o app Kimi, a API da Moonshot, K2-Instruct vs K2 Thinking, pesos abertos)",
  "Entender a única grande diferença estrutural: o Kimi K2 é de pesos abertos (Modified MIT) e MoE, não um modelo de fronteira fechado",
  "Apontar o Claude Code para o Kimi K2 via o endpoint compatível com a Anthropic da Moonshot com uma troca de duas variáveis",
  "Conhecer as divergências reais e as ressalvas antes de confiar na camada de compatibilidade",
  "Saber quando o Kimi K2 tende a ser a melhor escolha — execuções agênticas longas, programação sensível a custos e auto-hospedagem",
]} />

<VerifyNote lastVerified="2026-07-11" source="https://huggingface.co/moonshotai">
Variantes de modelo, tamanhos de janela de contexto, pontuações de benchmark e **preços mudam rápido** na Moonshot — a linha K2 iterou repetidamente (Base, Instruct, Instruct-0905, Thinking e lançamentos pontuais mais recentes). Os números de benchmark abaixo são os valores **auto-reportados** pela Moonshot nos cartões de modelo oficiais no momento da escrita. Esta página ensina o mapeamento de conceitos duradouro e a mecânica de configuração; para qualquer número, nome de variante ou preço específico, consulte as próprias páginas atuais da Moonshot (linkadas nas Fontes) em vez de confiar em um valor aqui — e sempre re-execute sua própria avaliação.
</VerifyNote>

## O mapa de conceitos em 60 segundos

Se você só ler uma seção, leia esta. Veja como as coisas que você conhece em Claude se alinham com o mundo do Kimi:

| Em Claude você chama de… | No mundo do Kimi é… | Mesma ideia? |
| --- | --- | --- |
| Claude.ai (o app de chat) | O **app Kimi** (kimi.com / mobile) | Sim — a superfície de consumidor/assistente |
| Seletor de modelo (Opus / Sonnet / Haiku) | Variantes do K2 — **K2-Instruct** (agêntico rápido) e **K2 Thinking** (raciocínio profundo) | Sim — escolha por velocidade vs. profundidade de raciocínio |
| Pensamento estendido | A cadeia de raciocínio intercalada com chamadas de ferramenta do **K2 Thinking** | Sim — o raciocínio aqui é uma variante, não apenas um interruptor |
| API Anthropic Messages | A API nativa da Moonshot **e** um endpoint compatível com a Anthropic | Em parte — a camada de compatibilidade fala o *seu* dialeto |
| Uso de ferramentas | A **chamada de ferramenta nativa** do Kimi (agent-first por design) | Sim — o mesmo loop de declarar→chamar→executar→retornar |
| Pesos fechados, apenas hospedado | **Pesos abertos** no Hugging Face (Modified MIT) | Não — este é o grande; você pode auto-hospedar |
| Claude Code | Claude Code **apontado para o Kimi**, ou o próprio Kimi CLI da Moonshot | Em grande parte — o mesmo harness, um modelo diferente por trás |

A linha mais importante de todas é a penúltima: **o Kimi K2 é de pesos abertos.** Tudo o que vem depois — auto-hospedagem, o preço baixo, a licença permissiva — decorre disso.

## O que o Kimi K2 realmente é

O Kimi K2 é um modelo **Mixture-of-Experts**: aproximadamente **1T de parâmetros totais com ~32B ativos por token** (384 experts, 8 selecionados por token). Foi pré-treinado em ~15,5T tokens e é lançado sob uma **Modified MIT License** — pesos genuinamente abertos que você pode baixar, inspecionar e executar. A Moonshot o construiu agent-first: o cartão de modelo o descreve como "especificamente projetado para uso de ferramentas, raciocínio e resolução autônoma de problemas".

Duas variantes importam mais para você:

- **K2-Instruct** — o modelo agêntico/chat de encaixe direto. Contexto de 128K. **65,8% auto-reportado no SWE-bench Verified**, 53,7% no LiveCodeBench, 89,5% no MMLU. Este é o seu cavalo de batalha diário no formato Sonnet.
- **K2 Thinking** — o agente de raciocínio. Ele intercala a cadeia de raciocínio com chamadas de função de ponta a ponta e permanece estável ao longo de **200–300 chamadas de ferramenta sequenciais** — a característica pela qual as pessoas se entusiasmam para agentes de longo horizonte. INT4 nativo, **contexto de 256K**. **71,3% auto-reportado no SWE-bench Verified**, 44,9% no Humanity's Last Exam (com ferramentas), 60,2% no BrowseComp. Este é o seu análogo do Opus com pensamento estendido.

<Callout type="info" items={[
  "Pesos abertos mudam o que 'trocar' significa. Com Grok ou Gemini você aluga uma caixa-preta; com o Kimi K2 você também pode baixá-lo, executá-lo no seu próprio hardware e nunca enviar um token para fora. Essa é a mesma razão pela qual ele ancora nossas páginas de modelos abertos e agentes locais.",
]} />

## O recurso matador para usuários do Claude: aponte o Claude Code para o Kimi

Ao contrário da maioria das alternativas, você não precisa abandonar seu harness. A Moonshot expõe um **endpoint compatível com a Anthropic** (`/anthropic/v1/messages`), então o Claude Code — que fala a API Anthropic Messages — pode conversar com o Kimi K2 ao sobrescrever duas variáveis de ambiente.

<Steps items={[
  {title: "Obtenha uma chave de API da Moonshot", body: "Crie uma conta na plataforma de desenvolvedores da Moonshot (platform.moonshot.ai, ou platform.moonshot.cn na China continental) e gere uma chave de API. Ela começa com sk-."},
  {title: "Sobrescreva duas variáveis de ambiente", body: "Aponte a base URL da Anthropic e o token de autenticação do Claude Code para a Moonshot em vez da Anthropic. Nada mais na sua configuração do Claude Code — CLAUDE.md, skills, servidores MCP, slash commands — precisa mudar."},
  {title: "Escolha um id de modelo Kimi atual", body: "Defina o modelo para um id Kimi atual (ex.: um id kimi-k2 preview/datado). Os ids de modelo rotacionam — leia a lista de modelos atual da Moonshot em vez de fixar um antigo no código."},
  {title: "Execute o Claude Code como de costume — depois avalie", body: "Inicie o claude e opere normalmente. Trate isto como um novo modelo por trás de um volante familiar: re-execute suas próprias tarefas e compare. Mesmo harness ≠ mesmo comportamento."},
]} />

<PromptCard title="Aponte o Claude Code para o Kimi K2 (shell)">{`# Route Claude Code to Moonshot's Anthropic-compatible endpoint
export ANTHROPIC_BASE_URL="https://api.moonshot.ai/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-your-moonshot-api-key"

# Then just run Claude Code as normal:
claude

# (In mainland China, use https://api.moonshot.cn/anthropic instead.)`}</PromptCard>

<Callout type="warning" items={[
  "A camada de compatibilidade é próxima, não idêntica. A interface compatível com a Anthropic da Moonshot não implementa todos os recursos da Anthropic (por exemplo, o parâmetro document), e há divergências conhecidas em torno do campo thinking que podem surgir com subagentes ou requisições de saída estruturada. Se um recurso se comportar de forma estranha, suspeite da camada de compatibilidade antes da sua configuração — e consulte a documentação de compatibilidade atual da Moonshot.",
]} />

## Além do Claude Code: a API bruta e a auto-hospedagem

Se você está escrevendo sua própria integração em vez de operar o Claude Code, tem três caminhos:

- **Endpoint compatível com a Anthropic** — reutilize seu cliente no formato Claude/Messages mudando a base URL e a chave (como acima). Menor atrito se seu código já estiver no formato Anthropic.
- **API nativa da Moonshot** — a Moonshot também oferece uma superfície compatível com a OpenAI, então código no formato OpenAI migra por troca de base-URL + chave também. Útil se sua stack veio do lado da OpenAI.
- **Auto-hospede os pesos** — baixe do Hugging Face e sirva com um motor de inferência que suporte o parsing de ferramentas nativo do Kimi (vLLM, SGLang e afins). Este é o objetivo final de privacidade/custo: nenhum token deixa sua infraestrutura. Veja [Rode Modelos Localmente com Ollama](/docs/models/run-models-locally-ollama) e [Stack de IA Privada e Local](/docs/models/private-local-ai-stack) para o caminho local.

## O que se transfere sem mudanças

Quase todo o seu ofício com Claude se transfere, porque o Kimi K2 é agent-first e nativo de ferramentas como o Claude:

- **Hábitos de prompting.** Instruções claras, restrições explícitas, exemplos e enquadramento de papel funcionam todos. Veja [Fundamentos de Prompting](/docs/prompting/basics) e [Portando Prompts Entre Modelos](/docs/models/porting-prompts-across-models).
- **Disciplina de uso de ferramentas.** O loop de declarar→chamar→executar→retornar tem o mesmo formato que o [Uso de Ferramentas](/docs/api/tool-use) do Claude. O Kimi é feito para isso e se sustenta ao longo de cadeias de ferramentas muito longas.
- **Engenharia de contexto.** Contexto enxuto, boa recuperação e entradas estruturadas importam tanto — indiscutivelmente mais em execuções agênticas longas. Veja [Engenharia de Contexto](/docs/frontiers/context-engineering).
- **Habilidades de conduzir agentes.** Delimitar tarefas, revisar diffs e manter as execuções nos trilhos se transferem diretamente para qualquer harness — incluindo o Claude Code apontado para o Kimi. Veja [O que é o Claude Code?](/docs/claude-code/what-is-claude-code) e [Harnesses de Agente de Longa Duração](/docs/frontiers/long-running-agent-harnesses).

## Quando o Kimi K2 tende a brilhar

- **Execuções agênticas de longo horizonte.** A característica de destaque é a estabilidade ao longo de centenas de chamadas de ferramenta sequenciais — recorra ao K2 Thinking quando uma tarefa for uma maratona de uso de ferramentas, não uma resposta única.
- **Programação sensível a custos em escala.** Resultados fortes auto-reportados no SWE-bench com economia de pesos abertos o tornam um alvo natural de A/B para agentes de programação de alto volume.
- **Privacidade e auto-hospedagem.** Pesos abertos significam que você pode executá-lo totalmente no seu próprio hardware — a única coisa que nenhum modelo de fronteira fechado pode oferecer.
- **Manter a memória muscular do seu Claude Code.** Quando você quer um modelo mais barato ou auto-hospedado *sem* reaprender um fluxo de trabalho, a troca de duas variáveis é difícil de superar.

A resposta honesta na maioria das vezes: **o que vencer sua avaliação na tarefa que importa — e o que suas restrições de privacidade e orçamento permitirem.** A habilidade é portátil; a configuração e a avaliação são o trabalho de verdade. Para a forma neutra em relação a fornecedores de escolher, veja [Escolhendo um Modelo](/docs/models/choosing-a-model) e [Quanto Custa a IA Entre Fornecedores](/docs/models/what-ai-costs-across-providers).

<Flashcards title="Vocabulário Kimi para Claude" cards={[
  {front: "Kimi K2", back: "O modelo MoE de pesos abertos e agent-first da Moonshot AI (~1T total / ~32B params ativos, Modified MIT). Projetado para uso de ferramentas e execuções autônomas longas."},
  {front: "K2-Instruct", back: "A variante agêntica/chat de encaixe direto, contexto de 128K. Seu cavalo de batalha diário no formato Sonnet."},
  {front: "K2 Thinking", back: "A variante de raciocínio: intercala a cadeia de raciocínio com chamadas de ferramenta, estável ao longo de 200–300 chamadas sequenciais, contexto de 256K. Seu análogo do Opus com pensamento estendido."},
  {front: "Endpoint compatível com a Anthropic", back: "A superfície /anthropic/v1/messages da Moonshot. Permite ao Claude Code (que fala a API Messages) conversar com o Kimi ao sobrescrever ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN."},
  {front: "Pesos abertos (Modified MIT)", back: "A diferença estrutural em relação a Grok/Gemini/GPT: você pode baixar, inspecionar e auto-hospedar o Kimi K2. A fonte do seu custo baixo e da sua história de privacidade."},
  {front: "Chamada de ferramenta nativa", back: "O Kimi é agent-first — o mesmo loop de declarar→chamar→executar→retornar do uso de ferramentas do Claude, ajustado para se sustentar ao longo de cadeias de ferramentas muito longas."},
]} />

<Quiz title="Teste você mesmo" questions={[
  {q: "Você quer experimentar o Kimi K2 sem abandonar sua configuração do Claude Code. Qual é a jogada duradoura e de menor atrito?", options: ["Reescrever seu projeto para usar o SDK proprietário da Moonshot", "Sobrescrever ANTHROPIC_BASE_URL para o endpoint /anthropic da Moonshot e ANTHROPIC_AUTH_TOKEN para sua chave da Moonshot, depois executar o Claude Code normalmente", "Você não pode — o Claude Code só funciona com a própria API da Anthropic"], answer: 1, explain: "A Moonshot oferece um endpoint compatível com a Anthropic, então o Claude Code pode conversar com o Kimi K2 ao sobrescrever apenas a base URL e o token de autenticação. Seu CLAUDE.md, skills e configuração de MCP ficam no lugar — mas re-execute suas avaliações, já que é um modelo diferente."},
  {q: "Qual é a única maior diferença estrutural entre o Kimi K2 e modelos fechados como Grok ou Gemini?", options: ["O Kimi K2 tem uma janela de contexto maior que qualquer outra coisa", "O Kimi K2 é de pesos abertos (Modified MIT) — você pode baixá-lo e auto-hospedá-lo, ao contrário dos modelos de fronteira fechados", "O Kimi K2 não pode usar ferramentas"], answer: 1, explain: "Pesos abertos são a diferença de raiz: auto-hospedagem, licenciamento permissivo e o preço baixo decorrem todos disso. Grok, Gemini e GPT são caixas-pretas apenas para aluguel."},
  {q: "O endpoint compatível com a Anthropic funciona, mas um recurso de upload de documento do qual você depende se comporta mal. Qual é o instinto certo?", options: ["Assumir que sua instalação do Claude Code está quebrada e reinstalá-la", "Suspeitar primeiro da camada de compatibilidade — o endpoint da Moonshot não implementa todos os recursos da Anthropic, e há divergências conhecidas a verificar", "Concluir que o Kimi K2 não consegue fazer trabalho agêntico"], answer: 1, explain: "A camada de compatibilidade é próxima, mas não idêntica — alguns recursos da Anthropic (ex.: o parâmetro document) e comportamentos do campo thinking divergem. Consulte a documentação de compatibilidade da Moonshot antes de culpar sua própria configuração."},
]} />

<Callout type="takeaways" items={[
  "O Kimi K2 é o modelo MoE de pesos abertos e agent-first da Moonshot (~1T total / ~32B ativos, Modified MIT) — os pesos abertos são a história toda: auto-hospedagem, custo baixo, licença permissiva.",
  "Duas variantes mapeiam limpamente sobre seu modelo mental de Claude: K2-Instruct (agêntico rápido ≈ Sonnet) e K2 Thinking (raciocínio profundo + chamadas de ferramenta intercaladas ≈ Opus com pensamento estendido).",
  "O destaque para usuários do Claude: o endpoint compatível com a Anthropic da Moonshot permite apontar o Claude Code para o Kimi ao sobrescrever duas variáveis de ambiente — sem mudança de fluxo de trabalho.",
  "A camada de compatibilidade é próxima, não idêntica — alguns recursos da Anthropic (ex.: document) e comportamentos do campo thinking divergem; consulte a documentação atual da Moonshot quando algo der problema.",
  "Recorra ao Kimi K2 em execuções agênticas longas, programação sensível a custos e privacidade/auto-hospedagem — mas nomes de variantes, pontuações e preços ficam desatualizados rápido, então verifique e avalie.",
]} />

## Fontes e leitura adicional

- [moonshotai/Kimi-K2-Instruct · Hugging Face](https://huggingface.co/moonshotai/Kimi-K2-Instruct) — o cartão de modelo oficial do K2-Instruct: arquitetura, licença e benchmarks auto-reportados.
- [moonshotai/Kimi-K2-Thinking · Hugging Face](https://huggingface.co/moonshotai/Kimi-K2-Thinking) — o cartão de modelo do K2 Thinking: raciocínio intercalado + chamadas de ferramenta, contexto e pontuações.
- [moonshotai no Hugging Face](https://huggingface.co/moonshotai) — a organização de modelos completa da Moonshot, incluindo lançamentos pontuais mais recentes e a variante Base.
- [MoonshotAI/Kimi-K2 · GitHub](https://github.com/MoonshotAI/Kimi-K2) — o repositório do K2, incluindo a discussão do endpoint compatível com a Anthropic e notas de implantação.
- [Apresentando o Kimi K2 Thinking](https://moonshotai.github.io/Kimi-K2/thinking.html) — o próprio enquadramento da Moonshot para o agente de raciocínio.
- [Plataforma de desenvolvedores da Moonshot AI](https://platform.moonshot.ai/) — chaves de API, ids de modelo atuais e preços (o lugar autoritativo para qualquer número específico).

## Próximo

- A forma neutra em relação a fornecedores de escolher → [Escolhendo um Modelo](/docs/models/choosing-a-model)
- O campo mais amplo de pesos abertos → [Modelos Abertos DeepSeek & Qwen](/docs/models/deepseek-qwen-open-models) · [Quanto Custa a IA Entre Fornecedores](/docs/models/what-ai-costs-across-providers)
- Auto-hospede os pesos → [Rode Modelos Localmente com Ollama](/docs/models/run-models-locally-ollama) · [Stack de IA Privada e Local](/docs/models/private-local-ai-stack)
- Vindo dos outros assistentes também? → [ChatGPT para Usuários do Claude](/docs/models/chatgpt-for-claude-users) · [Gemini para Usuários do Claude](/docs/models/gemini-for-claude-users) · [Grok para Usuários do Claude](/docs/models/grok-for-claude-users)
- Faça longas cadeias de ferramentas se comportarem → [Harnesses de Agente de Longa Duração](/docs/frontiers/long-running-agent-harnesses) · [Engenharia de Contexto](/docs/frontiers/context-engineering)
