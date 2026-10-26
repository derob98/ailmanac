# APIs Multiagente Nativas: o Beta Multiagente da Responses da OpenAI vs. Construir por Conta Própria

> Source: https://derob98.github.io/ailmanac/pt-BR/docs/models/native-multi-agent-apis · AILmanac (CC BY 4.0) · last verified 2026-08-01

Em 9 de julho de 2026, a OpenAI lançou o beta multiagente da Responses API e o Sol Ultra Mode — o primeiro fornecedor de ponta a tornar 'o modelo cria e sintetiza N subagentes em uma única requisição HTTP' uma primitiva de primeira classe. O que realmente foi lançado, o formato da API, as contas de custo, o que a Anthropic faz em vez disso e quando a primitiva nativa supera um fan-out feito por você.

<LevelBadge level="advanced" />

Por dezoito meses, "multiagente" significou que *você* escrevia o fan-out. Você escrevia o prompt do coordenador, disparava N chamadas em paralelo, mesclava os JSONs e tratava as novas tentativas. Em **9 de julho de 2026**, a OpenAI reduziu isso a um parâmetro de requisição: **`multi_agent.enabled: true`** na Responses API, embalado num recurso para o consumidor chamado **Sol Ultra Mode**. O próprio modelo decide quantos subagentes criar, executa-os em paralelo e sintetiza o resultado — tudo dentro de uma única chamada HTTP. Nenhum outro fornecedor de ponta lançou uma primitiva simétrica. Esta página mapeia o que de fato foi lançado, os números por trás, o que a Anthropic oferece em vez disso e — a parte que importa — as três cargas de trabalho em que a primitiva nativa compensa o custo e as duas em que um fan-out feito por você ainda vence.

<Callout type="objectives" items={[
  "Ler o corpo exato da requisição multiagente da Responses API e saber o que max_concurrent_subagents de fato limita",
  "Fazer a conta de custo: o que 'o modelo cria 4 subagentes' realmente cobra de você aos preços do Sol",
  "Mapear o mesmo território do lado da Anthropic — Cowork, Managed Agents e subagentes do Claude Code — e enxergar a lacuna de primitivas",
  "Escolher a primitiva certa por carga de trabalho: multiagente nativo, fan-out próprio, A2A ou um único turno longo",
  "Evitar os quatro modos de falha que transformam uma chamada Ultra de 4 agentes numa conta 4x maior sem ganho de acurácia"
]} />

<VerifyNote lastVerified="2026-08-01" source="https://developers.openai.com/api/docs/guides/responses-multi-agent">
A superfície multiagente da Responses API ainda é beta (cabeçalho <code>OpenAI-Beta: responses_multi_agent=v1</code>). Os nomes dos campos, o valor padrão de <code>max_concurrent_subagents</code> e quais parâmetros são mutuamente exclusivos com o modo multiagente mudaram desde o lançamento de 9 de julho de 2026. Reverifique o formato da requisição e a lista de incompatibilidades na documentação vinculada antes de publicar.
</VerifyNote>

## A versão em uma frase

**O Ultra Mode é uma camada de consumo sobre `multi_agent.enabled: true` na Responses API** — uma primitiva nativa que permite ao modelo criar subagentes em paralelo dentro de uma requisição, sintetizar suas saídas e devolver uma única resposta. Ela compra um ganho de acurácia pequeno, porém real, em tarefas paralelizáveis (Terminal-Bench 2.1: **88,8% → 91,9%**), com uma conta de tokens que cresce de forma aproximadamente linear com o número de subagentes que o modelo escolhe criar.

## O que realmente foi lançado em 9 de julho de 2026

Duas coisas chegaram no mesmo lançamento, e vale separá-las:

- **Ultra Mode** — um botão de *produto* dentro do ChatGPT e do Codex. Disponível na faixa principal (Sol). Quando ativado, tarefas difíceis são decompostas em execuções paralelas de subagentes antes da síntese. Divulgado como "cria 4+ agentes"; alguns gráficos de benchmark GA da própria OpenAI também mostram configurações de 16 agentes no BrowseComp e no SEC-Bench Pro, mas quatro é o padrão de trabalho.
- **Beta multiagente da Responses API** — uma primitiva para *desenvolvedores*. A mesma capacidade subjacente, exposta como `multi_agent.enabled: true` em `client.beta.responses.create()`. É o que você usaria para construir a sua própria experiência no estilo Ultra.

A confusão que o marketing deixou é real: desenvolvedores continuam perguntando "como chamo o Ultra Mode pela API?". A resposta é que você não chama — você ativa o beta multiagente, que é a primitiva por baixo do recurso do produto.

## A requisição multiagente da Responses API

Concretamente, este é o formato (SDK Python):

<PromptCard title="Chamada mínima multiagente à Responses API">
{`from openai import OpenAI

client = OpenAI()

resp = client.beta.responses.create(
    model="gpt-5.6-sol",
    input="Audit this repo for auth-bypass patterns and write a report.",
    multi_agent={
        "enabled": True,
        "max_concurrent_subagents": 3,
    },
    tools=[...],  # your MCP tools, function tools, etc.
    extra_headers={"OpenAI-Beta": "responses_multi_agent=v1"},
)`}
</PromptCard>

Quatro coisas nesse formato não são óbvias:

- **`max_concurrent_subagents` não é um orçamento total.** Ele limita os turnos de subagentes *ativos* em toda a árvore em um dado momento — raiz mais descendentes. O modelo pode criar um número *total* muito maior de subagentes ao longo da vida da requisição; só não pode ter mais de N em execução ao mesmo tempo.
- **A profundidade é ilimitada.** Um subagente pode, ele próprio, criar subagentes. Não há limite fixo para a profundidade da árvore nem para o total de subagentes por execução. Sua superfície de custo não é "N chamadas" — é uma árvore que o modelo molda em tempo de execução.
- **A raiz sintetiza.** O agente raiz é responsável por mesclar as respostas dos subagentes na resposta final. Você não recebe de volta um objeto estruturado `{subagents: [...]}`; recebe uma resposta, e os turnos intermediários dos agentes são opacos para o seu código.
- **Alguns parâmetros são desativados silenciosamente.** `reasoning.summary` e `max_tool_calls` não são suportados com o multiagente ativado, e o endpoint de compactação não é suportado para respostas multiagente. Se você depende de resumos de raciocínio para observabilidade, perde-os assim que ativa isso.

## A conta de custo que ninguém imprime na página de marketing

Ao preço GA do Sol, de **US$ 5 de entrada / US$ 30 de saída por milhão de tokens**, a aritmética é implacável. Segundo os relatos de desenvolvedores que fizeram engenharia reversa de execuções reais do Ultra:

- **Uma tarefa que o Ultra decompõe em 2 subagentes** ≈ 2x o custo de tokens de saída de uma única chamada ao Sol — porque ambos os subagentes geram saída, e a raiz ainda gera a síntese por cima.
- **Uma tarefa para a qual o Ultra cria 5 subagentes** ≈ 5x — mesmo raciocínio, mais um replay proporcionalmente maior de tokens de entrada pela árvore.
- **Os gráficos do BrowseComp / SEC-Bench com configurações de 16 agentes** não são almoço grátis: são uma demonstração de nível de pesquisa, não um padrão. Com 16 subagentes concorrentes no Sol, você está diante de um valor de dois dígitos médios em dólares por consulta difícil só em tokens de saída.

O jeito de pensar: **você está pagando por um Monte Carlo de chamadas ao Sol mais uma passada de síntese por cima.** Às vezes isso compra acurácia suficiente para importar. Às vezes é só uma conta 4x maior por uma tarefa que uma única chamada teria resolvido.

## O que a acurácia realmente compra

Os ganhos publicados nas avaliações paralelizáveis — as cargas de trabalho para as quais o Ultra Mode foi projetado — são reais, mas modestos:

| Benchmark | Sol (único) | Sol Ultra | Delta | O que a avaliação mede |
| --- | --- | --- | --- | --- |
| Terminal-Bench 2.1 | 88,8% | 91,9% | +3,1 | Planejamento de linha de comando em várias etapas, coordenação de ferramentas |
| BrowseComp | 87,5% | 92,2% | +4,7 | Pesquisa e síntese na web com várias fontes |
| SEC-Bench Pro | — | 74,3% | (número do modo único não publicado) | Raciocínio sobre documentos regulatórios em grandes corpora |

Três pontos sobre esta tabela:

- A faixa de +3–5 pontos é coerente com o que a amostragem paralela historicamente comprou em outras fronteiras (best-of-N, self-consistency). A primitiva é genuinamente útil; o delta não é uma mudança de patamar.
- Estes são o *melhor caso* — avaliações escolhidas para exibir o modo. Em tarefas sequenciais (uma edição linear de código, a reescrita de um único arquivo, um chat curto), o Ultra acrescenta latência de síntese e custo sem mexer na acurácia.
- No mesmo gráfico do Terminal-Bench 2.1, o Opus 4.8 da Anthropic marcou 78,9% — ou seja, a liderança do Sol Ultra vem *tanto* do modelo-base melhor *quanto* do ganho multiagente empilhado por cima. Se você migrar do Opus para o Sol Ultra, não atribua toda a diferença à primitiva multiagente.

## O que a Anthropic faz em vez disso

A Anthropic não lançou uma primitiva de API simétrica. As analogias mais próximas resolvem, cada uma, uma fatia diferente do mesmo problema:

- **[Cowork](/docs/api/cowork-and-agent-teams)** — uma superfície de *produto*. Um espaço de trabalho agêntico de desktop em que um agente faz trabalho sustentado em várias etapas ao lado do usuário. Comparável ao Ultra Mode como *recurso*, mas não como primitiva de API.
- **[Managed Agents](/docs/api/managed-agents) e [managed-agents memory stores](/docs/api/managed-agents-memory-stores)** — um loop de agente hospedado com estado persistente e agendamento. Ocupa o espaço do "agente de segundo plano de longa duração", não o do "criar 4 em paralelo e mesclar".
- **[Subagentes do Claude Code](/docs/claude-code/subagents) e os [limites de frota de subagentes](/docs/claude-code/subagent-fleet-limits)** — uma primitiva de subagente de primeira classe, mas restrita à CLI do Claude Code. Documentada, pode ser criada em paralelo e é a analogia *mais próxima* de `multi_agent.enabled` — com a diferença importante de que você mesmo escreve o prompt do coordenador.
- **[Construindo agentes](/docs/api/building-agents) na Messages API** — o caminho por conta própria. Você dispara N chamadas `messages.create` em paralelo, escreve o prompt de síntese e trata as novas tentativas. Mesmo resultado, mais código.

A lacuna: **nenhuma superfície da API da Anthropic permite hoje virar um único booleano e fazer o próprio modelo decidir quantos subagentes criar e mesclar o trabalho deles.** Se você quer esse comportamento com o Claude, você o constrói — veja [Cowork e Agent Teams](/docs/api/cowork-and-agent-teams) para a história do lado do produto e [Managed Agents](/docs/api/managed-agents) para a primitiva de loop hospedado.

## Escolhendo a primitiva certa por carga de trabalho

<Steps items={[
  {title: "A tarefa é genuinamente paralelizável?", body: "Se as subtarefas podem rodar sem esperar o resultado umas das outras — auditar um repositório, pesquisar um tema em muitas fontes, refatorar N arquivos de forma independente — um formato de fan-out compensa o custo. Se a tarefa é sequencial (editar A, depois ler o resultado de A, depois editar B), qualquer primitiva multiagente só acrescenta sobrecarga de síntese sem ganho."},
  {title: "Você precisa inspecionar os turnos intermediários?", body: "O multiagente nativo (Ultra, beta multiagente da Responses) esconde os turnos dos subagentes do seu código. Se você precisa de trilhas de auditoria, atribuição de custo por subagente ou da capacidade de intervir no meio da execução — construa o fan-out você mesmo. Os subagentes do Claude Code dão visibilidade; o beta multiagente da Responses API não."},
  {title: "Os subagentes cruzam uma fronteira de confiança?", body: "Se as subtarefas pertencem a organizações, nuvens ou fornecedores diferentes, você está fora do escopo de qualquer primitiva de um único fornecedor. Use A2A — veja /docs/models/a2a-protocol-agent-to-agent. O multiagente nativo é intramodelo; o A2A é entre agentes."},
  {title: "O custo é limitado ou aberto?", body: "As árvores do multiagente nativo são moldadas em tempo de execução: você não consegue prever a conta de tokens a partir da requisição. Se o seu app tem um SLA de custo por requisição, prefira o fan-out próprio, em que você controla a largura — ou defina um teto rígido de max_output_tokens na raiz."},
  {title: "Você precisa dos +3–5 pontos de acurácia?", body: "Se a sua avaliação diz que a tarefa é 85% resolvível com uma única chamada e 90% é a diferença entre publicar ou não, o multiagente nativo é uma forma de baixo atrito de comprá-los. Se uma única chamada ao Sol ou ao Opus já resolve a tarefa, o Ultra é uma conta 4x maior por um ganho de 0 ponto."}
]} />

## Quatro modos de falha que transformam o Ultra numa conta 4x maior por nada

- **Ativá-lo em tarefas sequenciais.** O modelo ainda decompõe e sintetiza mesmo quando a tarefa não paraleliza. Você paga a sobrecarga de coordenação por um trabalho que nunca precisou dela. Regra prática: se você não consegue dizer o que o segundo subagente estaria fazendo enquanto o primeiro roda, não ative o multiagente.
- **Deixar a observabilidade de resumo de raciocínio no seu painel.** `reasoning.summary` não é suportado, silenciosamente, com o multiagente. Se o seu monitoramento depende dele, você verá campos vazios e achará que o modelo não está pensando. Publique uma mudança de schema *antes* de ligar a flag.
- **Usar `max_tool_calls` como limite de segurança.** Também é desativado silenciosamente com o multiagente. A garantia de segurança que você achava ter — "no máximo 20 chamadas de ferramenta por requisição" — some. Imponha tetos de chamadas de ferramenta na camada do adaptador de ferramentas, não pelo parâmetro da requisição.
- **Supor que `max_concurrent_subagents` é um teto de custo.** Ele limita os subagentes *ativos* em um instante, não o total criado ao longo da requisição. Uma única chamada Ultra pode criar dezenas de subagentes em sequência e ainda respeitar um limite `max_concurrent_subagents: 3`. Se o custo é o seu teto, adicione um max_output_tokens no nível da requisição.

## O que o "multiagente nativo" não é

Duas primitivas vizinhas costumam ser confundidas com ele:

- **Não é amostragem com `n > 1`.** O parâmetro `n`, mais antigo na OpenAI, amostra várias completions e devolve todas; você escolhe uma. O multiagente executa subagentes diferentes *fazendo trabalhos diferentes* e sintetiza as saídas. O primeiro é amostragem por temperatura; o segundo é decomposição de tarefas.
- **Não é inferência em lote.** A [API de lotes](/docs/api/message-batches) processa muitas requisições independentes em segundo plano. O multiagente são muitos subagentes *coordenados* dentro de *uma* requisição interativa. O lote é orientado a vazão; o multiagente é orientado a resultado.

## Para onde isto está indo

O protocolo A2A (veja [A2A: o protocolo Agent-to-Agent](/docs/models/a2a-protocol-agent-to-agent)) cobre o multiagente *entre fornecedores*. `multi_agent.enabled: true` cobre o multiagente *intramodelo*. A lacuna em aberto é uma primitiva **entre fornecedores** — o modelo do fornecedor A cria um subagente no fornecedor B e mescla o resultado — e ainda não há especificação pública para ela. Quando chegar, virá como A2A + um verbo nativo de transferência, não como uma nova API de nenhum dos lados. Fique de olho nesse espaço.

<Quiz questions={[
  {
    q: "O que max_concurrent_subagents limita no beta multiagente da Responses?",
    options: [
      "O número total de subagentes que a requisição pode criar",
      "O número de turnos de subagentes ativos em um dado momento em toda a árvore, excluindo a raiz",
      "A profundidade da árvore (quão fundo os subagentes podem criar seus próprios subagentes)",
      "O número de chamadas de ferramenta que cada subagente pode fazer"
    ],
    answer: 1,
    explain: "É um limite de concorrência sobre os turnos de subagentes ativos em toda a árvore em um dado momento, e exclui a raiz. Não há limite fixo para o total de subagentes por requisição nem para a profundidade da árvore — o modelo molda a árvore em tempo de execução."
  },
  {
    q: "Você ativa o multiagente e o painel de monitoramento de repente mostra campos de resumo de raciocínio vazios. O que aconteceu?",
    options: [
      "O modelo falhou silenciosamente — tente a requisição de novo",
      "reasoning.summary não é suportado quando multi_agent está ativado; a API o descarta silenciosamente",
      "Os subagentes rodaram, mas a passada de síntese expirou",
      "O seu cabeçalho beta está errado"
    ],
    answer: 1,
    explain: "reasoning.summary e max_tool_calls são desativados silenciosamente com o multiagente ativado, e a compactação não é suportada. Se a observabilidade ou a segurança dependem desses parâmetros, publique uma mudança de schema antes de ligar a flag."
  },
  {
    q: "Você precisa de subagentes paralelos que rodem em contas de clientes diferentes entre dois fornecedores. Qual primitiva é a correta?",
    options: [
      "Beta multiagente da OpenAI Responses API com max_concurrent_subagents: 2",
      "Subagentes do Claude Code",
      "O protocolo A2A, com cada fornecedor expondo um Agent Card",
      "GPT-5.6 Ultra Mode pelo ChatGPT"
    ],
    answer: 2,
    explain: "O multiagente nativo (Ultra, beta da Responses, subagentes do Claude Code) é intramodelo ou intrarruntime. Quando os subagentes cruzam uma fronteira de organização, nuvem ou fornecedor, você precisa do A2A — veja /docs/models/a2a-protocol-agent-to-agent."
  },
  {
    q: "Qual destes é um mau candidato para o Ultra Mode / multi_agent.enabled?",
    options: [
      "Auditar uma grande base de código em busca de uma classe de vulnerabilidade em muitos arquivos",
      "Pesquisa web com várias fontes em que cada fonte pode ser lida de forma independente",
      "Uma reescrita de código em um único arquivo em que cada edição depende da anterior",
      "Comparar documentos regulatórios de muitas empresas"
    ],
    answer: 2,
    explain: "Tarefas sequenciais — em que o passo B precisa da saída do passo A — não paralelizam. O multiagente ainda decompõe e sintetiza, acrescentando latência e 2x+ tokens sem ganho de acurácia. Regra prática: se você não consegue dizer o que o segundo subagente estaria fazendo enquanto o primeiro roda, não o ative."
  }
]} />

<Flashcards items={[
  {front: "Multiagente nativo (a definição desta página)", back: "Uma primitiva de API de primeira classe em que o próprio modelo cria e sintetiza N subagentes em paralelo dentro de uma requisição HTTP. Em agosto de 2026, a OpenAI é o único fornecedor de ponta que lança uma — via multi_agent.enabled no beta da Responses API."},
  {front: "Ultra Mode vs beta multi_agent", back: "A mesma primitiva subjacente, duas superfícies. O Ultra Mode é o botão de consumo no ChatGPT/Codex; o beta multiagente é a API para desenvolvedores. Você não chama 'Ultra' pelo código — você ativa o multiagente."},
  {front: "max_concurrent_subagents", back: "Limita quantos turnos de subagentes podem estar ativos ao mesmo tempo em toda a árvore, excluindo a raiz. Não é um limite de total nem de profundidade. O modelo pode criar muitos mais subagentes ao longo da vida da requisição."},
  {front: "Incompatibilidades silenciosas de parâmetros", back: "Com multi_agent.enabled: reasoning.summary não é suportado, max_tool_calls não é suportado e o endpoint de compactação não é suportado. Os três são silenciosos — a API aceita a requisição e descarta a restrição."},
  {front: "Delta do Sol Ultra no Terminal-Bench 2.1", back: "88,8% (único) → 91,9% (Ultra), um ganho de +3,1 pontos. Coerente com os ganhos de best-of-N que a amostragem paralela historicamente comprou. Real, porém modesto."},
  {front: "Regra de escala de custo", back: "O multiagente nativo cobra de forma aproximadamente linear com o número de subagentes que o modelo cria, mais uma passada de síntese. Dois subagentes ≈ 2x tokens de saída; cinco ≈ 5x. Ative quando o ganho de acurácia justificar o multiplicador, não por padrão."},
  {front: "A resposta da Anthropic para o mesmo território", back: "Nenhuma API simétrica única. O Cowork é a superfície de produto, o Managed Agents é o loop hospedado, os subagentes do Claude Code são a primitiva de primeira classe dentro da CLI, e o fan-out próprio na Messages API é a alternativa flexível. Todos exigem que você escreva o prompt do coordenador."},
  {front: "Quando usar A2A em vez disso", back: "Quando os subagentes cruzam uma fronteira de fornecedor, nuvem ou organização. O multiagente nativo é intramodelo; o A2A é entre agentes. Eles se combinam — você pode ter um endpoint A2A cuja implementação usa multiagente internamente para responder à tarefa delegada."}
]} />

## Fontes e leitura complementar

- [Multi-agent — OpenAI API guide](https://developers.openai.com/api/docs/guides/responses-multi-agent) — a referência oficial do beta multiagente da Responses: formato da requisição, semântica de `max_concurrent_subagents`, lista de parâmetros não suportados e o cabeçalho beta.
- [GPT-5.6: Frontier intelligence that scales with your ambition — OpenAI](https://openai.com/index/gpt-5-6/) — post de lançamento do Sol, Terra, Luna e Ultra Mode, com o posicionamento da família.
- [Previewing GPT-5.6 Sol — OpenAI](https://openai.com/index/previewing-gpt-5-6-sol/) — a página de prévia anterior, útil para a metodologia dos benchmarks.
- [GPT-5.6 Sol Ultra Mode: 64 Subagents on One Problem — Digital Applied](https://www.digitalapplied.com/blog/gpt-5-6-sol-ultra-mode-64-subagents-2026) — a conta de custo linear por trás dos números 2x/5x ("N agentes podem queimar até N vezes os tokens de uma execução de agente único ao mesmo preço por token"), além do padrão de trabalho de 4 agentes e seu teto de tokens de "até 4x a linha de base".
- [How to Use GPT-5.6 Ultra Mode: Multi-Agent Coordination for Complex Tasks — MindStudio](https://www.mindstudio.ai/blog/gpt-5-6-ultra-mode-multi-agent-coordination) — o detalhe do padrão de 4 agentes e dos 16 agentes em alguns gráficos.
- [OpenAI Releases GPT-5.6 (Sol, Terra, Luna) — MarkTechPost](https://www.marktechpost.com/2026/07/09/openai-releases-gpt-5-6-a-three-tier-model-family-with-programmatic-tool-calling/) — cobertura do lançamento e da primitiva Programmatic Tool Calling lançada junto com o multiagente.
- [GPT-5.6 e ChatGPT Work para usuários do Claude](/docs/models/gpt-5-6-sol-terra-luna) — a página irmã do AILmanac sobre a família de modelos em si.
- [Cowork e Agent Teams](/docs/api/cowork-and-agent-teams) — a analogia de superfície de produto da Anthropic.
- [Managed Agents](/docs/api/managed-agents) — a primitiva de loop hospedado no Claude.
- [Subagentes do Claude Code](/docs/claude-code/subagents) e [Limites de frota de subagentes](/docs/claude-code/subagent-fleet-limits) — a primitiva de subagente de primeira classe dentro da CLI.
- [A2A: o protocolo Agent-to-Agent](/docs/models/a2a-protocol-agent-to-agent) — a irmã entre fornecedores; use quando os subagentes cruzam uma fronteira de confiança.
- [Programmatic Tool Calling](/docs/api/programmatic-tool-calling) — uma primitiva diferente que também foi lançada no mesmo anúncio da OpenAI (a versão deles em JS) e a versão do Claude em sandbox Python.


## Próximos passos

- [OpenAI Agents API vs Claude Managed Agents](/docs/models/openai-agents-api-vs-managed-agents) — a camada de setembro de 2026 acima desta: sessões duráveis e sandboxes, comparadas ao loop hospedado da Anthropic
- [A2A: o protocolo Agent-to-Agent](/docs/models/a2a-protocol-agent-to-agent)
