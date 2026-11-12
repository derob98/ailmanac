# O imposto de tokens do MCP

> Source: https://derob98.github.io/ailmanac/pt-BR/docs/claude-code/mcp-token-cost · AILmanac (CC BY 4.0) · last verified 2026-11-10

Por que conectar servidores MCP pode queimar de 50k a 150k tokens antes da sua primeira requisição — e as três correções: Tool Search, execução de código e saber quando uma chamada de CLI vence.

<LevelBadge level="advanced" />

<VerifyNote lastVerified="2026-11-10" source="https://www.anthropic.com/engineering/advanced-tool-use">
Os números de tokens e os nomes dos recursos (`defer_loading`, Tool Search Tool, Programmatic Tool Calling) vêm dos posts de engenharia da Anthropic. O comportamento de busca de ferramentas do próprio Claude Code — que ela vem ativada por padrão, os valores de `ENABLE_TOOL_SEARCH`, o piso de modelo e os limites de descrição — vem da [documentação de MCP do Claude Code](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search), que é onde essa parte muda. Confirme as duas fontes antes de citar números exatos.
</VerifyNote>

Há uma briga que reaparece no Hacker News e no X: *por que queimar dezenas de milhares de tokens numa única operação MCP quando a mesma coisa via CLI custa algumas centenas?* Parece um ataque ao MCP. Não é. Quem argumenta mais alto são justamente os que amam agentes — eles só acabaram de conhecer a conta. Esta página é o guia prático dessa conta: para onde os tokens realmente vão, os dois custos que quase ninguém separa e as três correções que transformam um fluxo de 150.000 tokens em um de 2.000.

<Callout type="objectives" items={["Separar os DOIS custos de tokens distintos do MCP: o carregamento das definições de ferramentas e os resultados intermediários", "Entender por que o custo dos schemas é pago a cada conversa, e não uma única vez", "Usar defer_loading e a Tool Search Tool para carregar os schemas das ferramentas sob demanda", "Usar execução de código / Programmatic Tool Calling para manter resultados grandes fora do contexto", "Decidir, tarefa a tarefa, quando uma ferramenta MCP vale a pena e quando uma simples chamada de CLI vence"]} />

## Dois custos, não um

Quando você conecta um servidor MCP, o cliente pede a ele `tools/list` e recebe de volta **todas as ferramentas com seu schema JSON completo**. Esse bloco inteiro é injetado no contexto do modelo. A maioria das pessoas para a contabilidade mental aí. Mas existem dois impostos separados, e o segundo costuma ser maior.

**Custo 1 — Definições de ferramentas.** O nome, a descrição e o schema de parâmetros de cada ferramenta conectada ficam no contexto. A formulação da própria Anthropic: *"Quando os agentes estão conectados a milhares de ferramentas, eles precisam processar centenas de milhares de tokens antes de ler uma requisição."* Um único servidor corporativo pode publicar de dezenas a centenas de ferramentas; análises de terceiros estimam um servidor de 400 ferramentas em cerca de 400.000 tokens só de schema — o dobro de uma janela de 200k e ainda 40% de uma de 1M, gastos antes da primeira requisição. (Tamanhos de janela por modelo: [Modelos e preços](/docs/whats-new/models-and-pricing).)

**Custo 2 — Resultados intermediários.** Quando o modelo chama uma ferramenta diretamente, **todo resultado volta a passar pelo contexto do modelo**, inclusive as partes que você nunca quis que ele lesse. O exemplo da Anthropic: você puxa a transcrição de uma reunião de duas horas de uma ferramenta e a passa para outra, e a transcrição completa atravessa o modelo *duas vezes* — potencialmente ~50.000 tokens — só para produzir um resumo de uma linha.

<Callout type="warning" items={["O Custo 1 é pago a CADA turno até o prompt caching entrar em ação — os schemas são reenviados a cada requisição da conversa, não carregados uma vez. Um catálogo grande de ferramentas é um imposto sobre a sessão inteira, não uma taxa única. Esse é o custo de uma ferramenta cuja definição está CARREGADA; adiá-la (abaixo) é o que a tira da conta por turno.", "O Custo 2 escala com os seus DADOS, não com o número de ferramentas. Dez ferramentas pequenas podem sair mais baratas que uma ferramenta que devolve um blob gigante."]} />

### Os números, das fontes primárias

| Correção | Tarefa | Antes | Depois | Redução |
| --- | --- | --- | --- | --- |
| Execução de código com MCP | Fluxo Google Drive → Salesforce | 150,000 | 2,000 | **98.7%** |
| Tool Search Tool | Carregar definições antes de o trabalho começar | ~77,000 | ~8,700 | **85%** |
| Programmatic Tool Calling | Tarefa de pesquisa complexa | 43,588 | 27,297 | **37%** |

As três linhas são números publicados pela Anthropic. O surpreendente não é o custo, e sim a **precisão**: com a Tool Search Tool, a precisão na escolha de ferramentas *subiu* (o Opus 4.5 foi de 79,5% para 88,1%; o Opus 4 foi de 49% para 74%). Menos ferramentas disputando espaço no contexto significa que o modelo escolhe a certa com mais frequência. Aqui custo e qualidade andam na mesma direção, o que é raro.

## Correção 1 — Carregar os schemas das ferramentas sob demanda

Em vez de injetar todos os schemas de saída, marque-os com `defer_loading: true`. O Claude então vê apenas um índice leve; quando precisa do GitHub, chama a **Tool Search Tool**, que devolve *somente* os schemas do GitHub que combinam — não as mais de 50 ferramentas de todos os outros servidores. A Anthropic informa que isso preserva ~191.300 tokens de contexto contra ~122.800 com tudo pré-carregado.

### No Claude Code, isso já vem ligado

Você está vendo esse padrão agora mesmo se usa o Claude Code com servidores MCP. **A busca de ferramentas vem ativada por padrão**: só os *nomes* das ferramentas e as instruções do servidor são carregados no início da sessão, e o Claude busca um schema completo por meio de uma chamada `ToolSearch` quando uma tarefa precisa dele. Então adicionar mais um servidor custa os nomes das ferramentas dele, não os schemas — o Claude Code não impõe um teto de ferramentas por servidor e diz que o limite prático é o orçamento da sua janela de contexto.

Vale corrigir uma afirmação muito repetida, porque ela está meio certa. O limite de "~10% da janela de contexto" é real, mas **não** é o gatilho padrão — é um modo opcional da variável de ambiente `ENABLE_TOOL_SEARCH`:

| `ENABLE_TOOL_SEARCH` | Comportamento |
| --- | --- |
| *(não definida)* — o padrão | Toda ferramenta MCP adiada, carregada sob demanda |
| `true` | Igual a não definida |
| `auto` | Modo de limite. As ferramentas adiáveis são carregadas **de antemão** enquanto suas definições somarem menos de 10% da janela de contexto; com 10% ou mais, a busca de ferramentas é ligada |
| `auto:N` | Modo de limite com a sua própria porcentagem (`N` vai de 0 a 100), p. ex. `auto:5` |
| `false` | Toda ferramenta MCP carregada de antemão, sem adiamento |

Então, se você contava com as ferramentas carregadas de antemão abaixo de 10%, você entendeu o padrão ao contrário — nada é carregado de antemão a menos que você peça `auto`. E o `auto` é **pegajoso**: depois que o total cruza o limite e a busca de ferramentas liga, essas ferramentas podem continuar adiadas mesmo depois que o total volta a ficar abaixo dele.

<Callout type="warning" items={["Três coisas desligam a busca de ferramentas e ignoram o ENABLE_TOOL_SEARCH por completo: CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS (a partir do Claude Code v2.1.227 uma organização pode mantê-la ligada por meio de configurações gerenciadas), uma sessão que recebe a configuração HIPAA (sem nenhuma substituição) e implantações do Microsoft Foundry hospedadas no Azure, que a rejeitam no servidor. Negar a ferramenta ToolSearch nas permissões também carrega tudo de antemão.", "Existe um piso de modelo: o Claude Code usa a busca de ferramentas no Claude Opus 4, Sonnet 4, Haiku 4.5 e posteriores. Em modelos anteriores tudo é carregado de antemão e ENABLE_TOOL_SEARCH=true NÃO muda isso. No Agent Platform do Google Cloud o piso é mais alto — Opus 4.5, Sonnet 4.5, Haiku 4.5 e posteriores."]} />

Se você escreve servidores MCP, o adiamento também muda o seu orçamento de descrição, e de forma assimétrica: uma ferramenta carregada **de antemão** é cortada em 4.096 caracteres (o mesmo teto das instruções do servidor); uma carregada **pela busca de ferramentas**, em 16.384. Mas a busca em si só compara com o limite menor, então as palavras que o Claude usaria para procurar precisam estar perto do início nos dois casos.

<Steps items={[{title: "Audite o que você conectou", body: "Liste os servidores ativos e, grosso modo, quantas ferramentas cada um publica. Rode /context: ele rotula as ferramentas como (deferred) ou (loaded on-demand) quando a busca de ferramentas cuida delas, para você ver quais servidores estão de fato gastando tokens de schema e quais só estão gastando nomes."}, {title: "Desconecte o que esta tarefa não precisa", body: "A correção mais barata é ter menos servidores. Conecte os dois ou três que a tarefa realmente usa, não o catálogo inteiro — mesmo adiado, cada servidor ainda contribui com nomes de ferramentas e instruções do servidor a cada turno."}, {title: "Adie o resto", body: "No Claude Code isso já é o padrão. Em outros lugares, prefira um cliente/configuração que suporte defer_loading + Tool Search, para que os schemas só sejam carregados quando forem buscados."}]} />

## Correção 2 — Manter os resultados fora do contexto com execução de código

A correção mais profunda mira o Custo 2. Em vez de o modelo chamar as ferramentas uma a uma com cada resultado passando por ele, o modelo **escreve código** que chama as ferramentas, e os dados intermediários ficam no ambiente de execução. A Anthropic expõe os servidores MCP como uma **árvore de arquivos de ferramentas** que o agente explora como um sistema de arquivos, carregando só as definições de que precisa — e *"os resultados intermediários ficam no ambiente de execução por padrão… o agente só vê o que você registra ou retorna explicitamente."*

Essa única mudança de projeto é o que faz o fluxo Drive→Salesforce cair de 150.000 para 2.000 tokens: os registros se movem pelo código, e só a contagem final volta ao modelo. Na Developer Platform a mesma ideia chega como **Programmatic Tool Calling** — o Claude escreve Python que orquestra várias ferramentas e filtra as saídas antes que cheguem ao contexto dele.

<Callout type="tip" items={["Regra prática: se uma ferramenta RETORNA algo grande (uma transcrição, um dump de consulta, um arquivo), você quer execução de código para que o blob seja processado fora do contexto. Se a ferramenta apenas FAZ algo pequeno (criar uma issue, enviar uma linha), uma chamada direta basta."]} />

## Correção 3 — Saber quando uma chamada de CLI simplesmente vence

Às vezes a resposta certa não é uma configuração melhor de MCP, e sim nenhum MCP. A discussão do HN/X tem um ponto real: um comando de shell como `gh pr list` ou `psql -c '…'` custa algumas centenas de tokens de ida e volta, enquanto o caminho equivalente por MCP paga pelos schemas mais um resultado estruturado. Se o agente já tem um terminal e a CLI existe, esse costuma ser o caminho mais enxuto.

<PromptCard title="Prefira a CLI quando a ferramenta já é uma CLI">
{`# Instead of connecting a GitHub MCP server for read-only work,
# let the agent use the gh CLI it already has:
gh pr list --state open --json number,title,author

# ~200 tokens of command + compact output, no schema tax,
# no server to keep connected across the session.`}
</PromptCard>

O MCP compensa o seu custo adicional quando você precisa de uma capacidade **tipada, com permissões e multissuperfície** — um banco de dados com um papel somente leitura, um navegador que ele possa controlar, uma API SaaS com OAuth — ou quando as mesmas ferramentas são reutilizadas em muitos turnos e o caching dilui o custo dos schemas. Recorra a uma CLI quando a capacidade for pontual, já automatizável por script e devolver algo pequeno. Nenhuma das duas é "melhor"; são pontos diferentes numa curva de custo.

<Callout type="takeaways" items={["O MCP tem dois custos de tokens: os schemas de definição de ferramentas (pagos ~a cada turno) e os resultados intermediários (escalam com os seus dados).", "Tool Search + defer_loading cortam o custo dos schemas em ~85% E elevam a precisão na escolha de ferramentas — carregue os schemas só quando forem buscados.", "No Claude Code a busca de ferramentas vem LIGADA por padrão: só os nomes das ferramentas são carregados no início da sessão. O limite de ~10% que as pessoas citam é o modo opcional ENABLE_TOOL_SEARCH=auto, não o padrão.", "Execução de código / Programmatic Tool Calling mantêm resultados grandes no ambiente de execução; só chega ao modelo o que você registra ou retorna (150k → 2k no exemplo da Anthropic).", "A otimização mais barata é conectar menos servidores por tarefa.", "Quando a capacidade é pontual, devolve algo pequeno e já tem uma CLI, uma chamada de shell (~200 tokens) vence uma ida e volta por MCP."]} />

<Flashcards title="Termos da economia do MCP" cards={[{front: "O imposto de tokens do MCP", back: "Tokens gastos em schemas de ferramentas + resultados intermediários, e não no trabalho em si — o custo oculto de conectar servidores."}, {front: "defer_loading", back: "Uma flag que mantém o schema de uma ferramenta FORA do contexto até que o Claude o procure pela Tool Search Tool."}, {front: "Tool Search Tool", back: "Permite que o Claude descubra ferramentas sob demanda; buscar 'github' devolve só os schemas do GitHub em vez de todas as ferramentas conectadas. Corte de ~85% nos tokens de schema segundo os números da Anthropic."}, {front: "Programmatic Tool Calling", back: "O Claude escreve código que orquestra ferramentas; os resultados intermediários são filtrados no ambiente de execução, então só a saída final entra no contexto."}, {front: "Divulgação progressiva", back: "Padrão geral: expor de início um índice leve de ferramentas e buscar os schemas completos só quando necessário."}, {front: "ENABLE_TOOL_SEARCH", back: "O controle do Claude Code. Não definida ou true = tudo adiado (o padrão). auto / auto:N = carregar de antemão até as definições passarem de N% da janela (10% por padrão), então ligar e continuar ligado. false = tudo de antemão."}]} />

<Quiz title="Teste-se" questions={[{q: "Por que o custo das definições de ferramentas é pior que uma taxa única?", options: ["Os schemas ficam armazenados em disco e são relidos lentamente", "Os schemas são reenviados a cada requisição da conversa até o prompt caching se aplicar", "Cada chamada de ferramenta dobra o tamanho do schema"], answer: 1, explain: "Os schemas das ferramentas vivem no contexto enviado a cada turno, então um catálogo grande taxa a sessão inteira — não só a primeira mensagem — até o caching entrar em ação."}, {q: "Uma ferramenta puxa uma transcrição de 2 horas e a entrega a uma ferramenta de resumo por chamadas diretas. Qual é o custo oculto?", options: ["Nenhum — só o resumo consome tokens", "A transcrição completa passa pelo contexto do modelo, potencialmente ~50k tokens, mesmo que você só quisesse um resumo", "A transcrição é cobrada uma vez no servidor, não no modelo"], answer: 1, explain: "Com chamadas diretas de ferramentas, todo resultado intermediário flui pelo modelo. A execução de código mantém a transcrição no ambiente de execução, e só o resumo volta."}, {q: "Você precisa de um único 'listar PRs abertos' somente leitura durante uma sessão de programação, e o agente tem um terminal. Qual é a opção mais enxuta?", options: ["Conectar um servidor MCP completo do GitHub", "Rodar a gh CLI diretamente — ~200 tokens, sem imposto de schema, nada para manter conectado", "Carregar todas as ferramentas do GitHub com defer_loading desligado"], answer: 1, explain: "Para algo pontual que devolve pouco e já tem uma CLI, uma chamada de shell evita por completo o imposto de schema. O MCP compensa o custo em capacidades reutilizadas, tipadas e com permissões."}, {q: "O que surpreendente acontece com a precisão na escolha de ferramentas quando você usa a Tool Search Tool?", options: ["Ela cai, porque o Claude vê menos ferramentas", "Fica igual; só o custo muda", "Ela sobe — menos ferramentas disputando o contexto significa que o Claude escolhe a certa com mais frequência"], answer: 2, explain: "A Anthropic informa que a precisão SUBIU (Opus 4.5: 79,5% → 88,1%) com o Tool Search. Custo e qualidade andaram na mesma direção."}]} />

## Relacionado no AILmanac

- [Servidores MCP no Claude Code](/docs/claude-code/mcp) — como adicionar, delimitar o escopo e proteger servidores.
- [A economia de tokens](/docs/power-user/token-economy) — comprimir a saída dos comandos antes que ela chegue ao modelo.
- [Dynamic Workflows](/docs/claude-code/dynamic-workflows) — onde o custo de orquestração aparece e como fatiar para medir o gasto.
- [Uso de ferramentas na API](/docs/api/tool-use) — o formato de requisição/resposta por trás de tudo isso.
- [Playwright MCP: o guia prático aprofundado](/docs/api/playwright-mcp-deep-guide) — exemplo prático do servidor individual mais pesado que as pessoas conectam (~3.500 tokens de imposto de schema), e quando o caminho Skill/CLI vence.
- [Tool Search e carregamento adiado](/docs/api/tool-search-and-deferred-loading) — o mergulho em nível de API: regex vs BM25, os cinco 400 e por que o corpo da requisição não fica menor.

## Fontes e leituras adicionais

- [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) — Anthropic Engineering. Fonte do número de 150.000 → 2.000 tokens (98,7%) e do padrão "os resultados intermediários ficam no ambiente de execução".
- [Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use) — Anthropic Engineering. Tool Search Tool (`defer_loading`, redução de ~85%, ganhos de precisão) e Programmatic Tool Calling (43.588 → 27.297 tokens).
- [Documentação de MCP do Claude Code](https://code.claude.com/docs/en/mcp) — referência oficial para conectar e delimitar o escopo de servidores. A seção [Scale with MCP tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search) é a fonte de a busca de ferramentas ser o padrão, da tabela de `ENABLE_TOOL_SEARCH`, do piso de modelo e dos tetos de descrição de 4.096 / 16.384 caracteres.
- [modelcontextprotocol — Progressive Tool Discovery discussion](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1923) — conversa de design da comunidade sobre carregamento de ferramentas sob demanda.
- [MCP Progressive Disclosure](https://www.solo.io/blog/mcp-progressive-disclosure) (Solo.io) — passo a passo de terceiros do padrão de índice leve / buscar o schema sob demanda.


## Próximo

- [Acessibilidade](/docs/claude-code/accessibility)
