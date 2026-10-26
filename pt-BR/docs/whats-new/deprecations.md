# Acompanhamento de Descontinuações e Migrações

> Source: https://derob98.github.io/ailmanac/pt-BR/docs/whats-new/deprecations · AILmanac (CC BY 4.0) · last verified 2026-10-25

Modelos aposentados, flags renomeadas e mudanças incompatíveis com notas de migração.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-10-25" source="https://platform.claude.com/docs/en/about-claude/model-deprecations">
Os cronogramas de descontinuação e os detalhes de migração vêm da Anthropic e mudam — sempre confirme datas e substituições na documentação oficial antes de migrar.
</VerifyNote>

Modelos são aposentados, parâmetros são renomeados, comportamentos mudam. Esta página acompanha as **mudanças incompatíveis** para que as atualizações não te peguem de surpresa. Se você constrói sobre a API, dê uma olhada periodicamente.

## Por que isso importa

Um ID de modelo fixado acabará sendo **descontinuado** e depois **removido**. Código que o codifica de forma rígida quebra. Um pouco de higiene evita surpresas às 2 da manhã.

## Regras de sobrevivência

- **Leia os IDs de modelo a partir da configuração**, nunca espalhe literais pela base de código — assim a migração vira uma mudança de uma linha.
- **Acompanhe os anúncios** sobre datas de descontinuação e substituições recomendadas.
- **Reexecute suas [avaliações](/docs/foundations/evals)** quando trocar de modelo — o comportamento pode mudar mesmo em um modelo "mais novo e melhor".
- **Teste antes do prazo final**, não depois da remoção.

## Tipos comuns de mudança

| Mudança | Exemplo | O que fazer |
|---|---|---|
| Modelo aposentado | Um ID de modelo mais antigo para de funcionar | Migre para o sucessor recomendado; reavalie |
| Parâmetro substituído | Um controle de raciocínio/budget substituído por `effort` | Atualize as chamadas; veja [Thinking e Effort](/docs/api/thinking-and-effort) |
| Mudança de padrão | Um novo modelo/comportamento padrão | Fixe intencionalmente; verifique se seus prompts ainda funcionam |
| Atualização de endpoint/SDK | Nova versão major do SDK | Leia o guia de migração; atualize deliberadamente |

## Acompanhamento atual

O cronograma autoritativo fica na [página oficial de descontinuação de modelos](https://platform.claude.com/docs/en/about-claude/model-deprecations) — confirme as datas lá antes de migrar. A Anthropic dá pelo menos 60 dias de aviso antes de aposentar um modelo lançado publicamente.

### Modelos descontinuados

Um modelo Claude lançado publicamente está na janela "descontinuado, mas ainda não aposentado" (verificado em 25 de outubro de 2026): **o `claude-sonnet-4-5-20250929` (Sonnet 4.5) foi descontinuado em 30 de setembro de 2026 e será aposentado em 30 de novembro de 2026.** A substituição recomendada pela Anthropic é `claude-sonnet-5-5`. As chamadas continuam funcionando até a data de aposentadoria e falham depois dela — se você ainda fixa esse ID no código, essa é a sua migração, e a janela agora tem cerca de cinco semanas.

Também descontinuado: o `claude-mythos-preview`, disponível apenas por convite (descontinuado em 9 de junho de 2026, data de aposentadoria a ser anunciada) — migre para o modelo atual com verificação prévia, `claude-mythos-5-1`. (O `claude-mythos-5` ainda está Active, mas tem seu próprio guia de migração apontando para o 5.1, então migrar duas vezes é trabalho desperdiçado.)

O `claude-haiku-4-5-20251001` é o próximo ID a acompanhar, e agora é o único modelo da linha que **passou** da sua data de aposentadoria mais antecipada possível: esse piso era **15 de outubro de 2026**, e já passou (o próximo é o do Opus 4.5, em 24 de novembro de 2026). Ele também aparece entre os **modelos legados** na visão geral de modelos, com um sucessor direto no `claude-haiku-5-5` (lançado em 7 de outubro de 2026). Em 25 de outubro de 2026, a tabela de status oficial ainda o lista como **Active**, sem nenhuma descontinuação anunciada, então as duas leituras não entram em conflito: no vocabulário de ciclo de vida da própria Anthropic, "legado" significa *não recebe mais atualizações e pode ser descontinuado no futuro*, um degrau antes de "descontinuado". Uma data "não antes de" ser alcançada é um sinal para planejar, não uma queda — a Anthropic se compromete a avisar com no mínimo 60 dias de antecedência, e essa contagem começa quando o aviso sai, não quando a data mínima é superada. O Sonnet 4.5 é o exemplo concreto: seu piso era 29 de setembro de 2026, o aviso de descontinuação veio em 30 de setembro, e a aposentadoria real é dois meses depois. Se você fixa esse ID, agora vale agendar a migração em vez de só acompanhar — e não é uma simples troca de ID: veja [Claude Haiku 5.5: o penhasco de preço dos 100K](/docs/models/haiku-5-5-the-100k-price-cliff) para as cinco mudanças que retornam 400 e as seis que retornam 200. Confirme na [tabela de status oficial dos modelos](https://platform.claude.com/docs/en/about-claude/model-deprecations#model-status) antes de migrar.

### Aposentados recentemente

- O `claude-opus-4-1-20250805` (Opus 4.1) foi **aposentado em 5 de agosto de 2026** — migre para `claude-opus-4-8` (ou direto para `claude-opus-5`).
- O `claude-opus-4-20250514` (Opus 4) e o `claude-sonnet-4-20250514` (Sonnet 4) foram **aposentados em 15 de junho de 2026** — os substitutos indicados pela Anthropic são `claude-opus-4-8` e `claude-sonnet-4-6`, respectivamente (ou vá direto para `claude-opus-5` / `claude-sonnet-5`).

Chamadas a qualquer ID aposentado agora retornam um erro de API. Se o seu código ainda fixa um deles, é a primeira coisa a corrigir.

### Descontinuações de parâmetros

Os controles de amostragem `temperature`, `top_p` e `top_k` estão a caminho da saída, e **agora há duas regras diferentes dependendo da versão de API que você envia.**

- **Com `anthropic-version: 2023-06-01`** (o que toda major do SDK lançada antes de 21 de outubro de 2026 envia): nos **modelos da geração Claude 4.7 e posteriores** — Opus 4.7, Opus 4.8, Opus 5, Opus 5.5, Sonnet 5, Sonnet 5.5, Haiku 5.5, Fable 5, Fable 5.1, Mythos 5, Mythos 5.1 — **e no Claude Mythos Preview**, definir qualquer um deles com um valor **diferente do padrão** retorna um **erro 400**. Valores padrão são aceitos, e modelos mais antigos continuam aceitando valores não padrão. Atente aos números de versão, não aos nomes: o **Haiku 5.5 rejeita** valores de amostragem não padrão, enquanto o **Haiku 4.5**, mais antigo, **ainda os aceita**, assim como o Opus 4.6 e o Sonnet 4.6.
- **Com `anthropic-version: 2026-10-21`**: os três parâmetros foram **removidos**. Enviar qualquer um retorna **400 em todos os modelos, mesmo com o valor padrão do parâmetro**. As majors mais novas do SDK e a CLI `ant` os eliminaram de seus tipos de requisição e flags.

Nos dois casos a correção é a mesma: omita os três e direcione o comportamento com [prompting](/docs/prompting/prompting-claude) e [Thinking e Effort](/docs/api/thinking-and-effort). O único caso sem substituto é uma temperatura *deliberadamente reduzida* em um modelo mais antigo que ainda a respeita — as opções documentadas pela Anthropic nesse caso são parar de enviar o parâmetro ou manter essa requisição em `2023-06-01`. Detalhamento completo de qual versão você está usando e o que mais muda com ela: [API Version 2026-10-21](/docs/api/api-version-2026-10-21).

Sempre confirme seus IDs de modelo na tabela de [Modelos e Preços Atuais](/docs/whats-new/models-and-pricing); se você estiver em um ID mais antigo, planeje uma migração.

## Próximos passos

- [Erros, Limites de Taxa e Confiabilidade](/docs/api/errors-and-rate-limits)
- [Modelos e Preços Atuais](/docs/whats-new/models-and-pricing)
- [Avaliando a Qualidade da IA (Evals)](/docs/foundations/evals)
