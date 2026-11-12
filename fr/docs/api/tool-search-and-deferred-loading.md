# Tool Search & chargement différé

> Source: https://derob98.github.io/ailmanac/fr/docs/api/tool-search-and-deferred-loading · AILmanac (CC BY 4.0) · last verified 2026-09-29

Passer à l'échelle de milliers d'outils sans gonfler le contexte : comment defer_loading et l'outil de recherche d'outils fonctionnent réellement, les cinq erreurs 400 qu'ils produisent, et pourquoi le corps de votre requête ne rétrécit pas.

<LevelBadge level="advanced" />

<Callout type="objectives" items={[
  "Comprendre la chose que presque tout le monde se trompe sur defer_loading : il ne rend pas votre requête plus petite",
  "Choisir entre les variantes de recherche regex et BM25, et connaître le plafond de longueur de requête de chacune",
  "Lire le trio de blocs server_tool_use / tool_search_tool_result / tool_reference et savoir exactement quoi renvoyer en écho",
  "Éviter les cinq formes de requête qui renvoient une 400, y compris le conflit avec cache_control",
  "Brancher le chargement différé sur un toolset de connecteur MCP, et remplacer la recherche intégrée par vos propres embeddings"
]} />

<VerifyNote lastVerified="2026-09-29" source="https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool">
Les chaînes de version des outils (`tool_search_tool_regex_20251119`, `tool_search_tool_bm25_20251119`), le tableau de support des modèles et les limites chiffrées ci-dessous sont des faits datés. Le mécanisme (différer, chercher, déployer) est stable depuis le lancement. Revérifiez les identifiants et la liste des modèles avant de livrer.
</VerifyNote>

## Les deux problèmes, et pourquoi un seul concerne l'argent

Charger toutes les définitions d'outils d'emblée casse de deux façons distinctes à mesure que le catalogue grossit.

La première est évidente. L'exemple d'Anthropic lui-même : une configuration MCP à cinq serveurs (GitHub, Slack, Sentry, Grafana, Splunk) brûle environ **55k tokens en définitions d'outils avant que Claude ne fasse le moindre travail**. C'est une taxe que vous payez à chaque tour de la conversation.

La seconde est celle qui change vraiment votre architecture : **la précision de sélection des outils se dégrade au-delà de 30 à 50 outils disponibles.** Passé ce seuil, plus d'outils ne veut pas dire plus de capacité : cela veut dire un modèle qui choisit dans un menu surchargé. Le chargement différé règle le problème de coût et le problème de précision d'un seul geste, parce que le modèle ne voit jamais que les 3 à 5 outils pertinents pour la requête en cours. Anthropic rapporte une réduction de contexte de **plus de 85 pour cent** sur cette configuration multiserveur.

Pour l'économie et les écarts de précision publiés, AILmanac les traite dans [Coût en tokens de MCP](/docs/claude-code/mcp-token-cost). Cette page porte sur le câblage.

## Le modèle mental que l'on se trompe

Voici l'idée reçue à corriger avant d'écrire du code :

> `defer_loading` ne réduit **pas** ce que vous envoyez. Vous mettez toujours la définition complète de chaque outil (noms, descriptions, `input_schema` complet) dans le tableau `tools` à **chaque requête**, y compris les outils différés.

Le corps de votre requête HTTP ne rétrécit pas. Votre bande passante montante ne change pas. L'API a besoin de ces définitions côté serveur pour exécuter la recherche et déployer les références trouvées.

Ce qui change, c'est ce qui entre dans la **fenêtre de contexte**, et donc ce qui vous est facturé. Les définitions différées sont exclues du préfixe du prompt système. Quand Claude en découvre une, l'API ajoute un bloc `tool_reference` en ligne dans la conversation et le déploie en définition complète avant que le modèle ne la voie.

Ce détail d'ajout en ligne est la deuxième chose peu évidente : parce que le déploiement se fait *dans la conversation* et non dans le préfixe, **le préfixe en cache n'est jamais invalidé**. Le chargement différé et le prompt caching se composent. Il en va de même pour l'[utilisation stricte des outils](/docs/api/tool-use) : la grammaire qui contraint la sortie des appels d'outils est construite à partir du toolset complet, donc rien n'est recompilé quand un outil arrive en cours de conversation.

## L'activer

<Steps items={[
  {title: "Ajouter un outil de recherche au tableau tools", body: "Choisissez une variante : tool_search_tool_regex_20251119 ou tool_search_tool_bm25_20251119. C'est un outil serveur : il s'exécute sur l'infrastructure d'Anthropic et ne demande aucun en-tête bêta."},
  {title: "Marquer l'essentiel de votre catalogue defer_loading: true", body: "Par définition d'outil, à côté de name / description / input_schema. C'est le flag qui garde une définition hors du préfixe."},
  {title: "Laisser vos 3 à 5 outils les plus utilisés non différés", body: "Tout ce qui est appelé à la plupart des requêtes doit se charger d'emblée. Payer un aller-retour de recherche pour atteindre un outil dont on a toujours besoin est un mauvais échange. Au moins un outil DOIT rester non différé, normalement l'outil de recherche lui-même."},
  {title: "Envoyer quand même chaque définition, à chaque requête", body: "Y compris les différées, et y compris aux tours suivants après un tool_result. Si vous en retirez une, un tool_reference qui la pointe devient une 400."},
  {title: "Renvoyer les blocs de recherche tels quels", body: "À la requête suivante, repassez le contenu de l'assistant sans modification, server_tool_use et tool_search_tool_result compris. L'API redéploie les références sur tout l'historique, si bien que Claude réutilise les outils découverts aux tours suivants sans rechercher à nouveau."}
]} />

<PromptCard title="Minimal working request — one search tool, two deferred tools">
{`curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-opus-5-5",
    "max_tokens": 2048,
    "messages": [{"role": "user", "content": "What is the weather in San Francisco?"}],
    "tools": [
      {
        "type": "tool_search_tool_regex_20251119",
        "name": "tool_search_tool_regex"
      },
      {
        "name": "get_weather",
        "description": "Get the weather at a specific location",
        "input_schema": {
          "type": "object",
          "properties": {
            "location": {"type": "string"},
            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
          },
          "required": ["location"]
        },
        "defer_loading": true
      },
      {
        "name": "search_files",
        "description": "Search through files in the workspace",
        "input_schema": {
          "type": "object",
          "properties": {
            "query": {"type": "string"},
            "file_types": {"type": "array", "items": {"type": "string"}}
          },
          "required": ["query"]
        },
        "defer_loading": true
      }
    ]
  }'`}
</PromptCard>

Notez ce que l'outil de recherche vous coûte dans le préfixe : rien d'autre que sa propre entrée. Les deux définitions différées sont dans le corps mais pas dans le contexte.

## Regex ou BM25

Les deux variantes cherchent dans les quatre mêmes champs, **noms d'outils, descriptions, noms d'arguments et descriptions d'arguments**, et les deux sont disponibles sur chaque modèle qui prend en charge la fonctionnalité. Elles ne diffèrent que par ce que Claude écrit dans la requête.

| | `tool_search_tool_regex_20251119` | `tool_search_tool_bm25_20251119` |
|---|---|---|
| Claude écrit | des motifs Python `re.search()` | des requêtes en langage naturel |
| Champ d'entrée | `pattern` | `query` |
| Longueur max | 200 caractères | 500 caractères |
| Correspondance | insensible à la casse | classement BM25 |
| Convient quand | vos noms sont préfixés par espace de noms (`github_`, `slack_`) | vos descriptions se lisent comme de la prose |

La variante regex est celle que l'on configure mal, parce que son nom suggère une recherche par mots-clés et ce n'en est pas une. Claude écrit de vrais motifs : `"weather"`, `"get_.*_data"`, `"database.*query|query.*database"`. Si le modèle ne trouve pas un outil que vous attendez, testez le motif vous-même avant d'accuser le modèle :

<PromptCard title="Reproduce a failed regex match locally">
{`import re
# Claude writes broad patterns, e.g. ".*weather.*" — not exact names.
# Search the same four fields the API searches.
haystacks = ["get_weather", "Get the weather at a specific location", "location", "unit"]
print(any(re.search(r"weather", h, re.IGNORECASE) for h in haystacks))`}
</PromptCard>

La correction pratique d'une correspondance manquée n'est presque jamais un motif plus astucieux : ce sont des **mots-clés dans la description**. Écrivez les mots que vos utilisateurs emploieraient. Préfixez vos noms d'outils par service, pour qu'un seul motif balaie tout un groupe.

## Lire la réponse

Une recherche réussie produit trois nouveaux types de blocs dans le tour de l'assistant, dans cet ordre :

```json
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "I'll search for tools to help with the weather information." },
    {
      "type": "server_tool_use",
      "id": "srvtoolu_01ABC123",
      "name": "tool_search_tool_regex",
      "input": { "pattern": "weather", "limit": 10 }
    },
    {
      "type": "tool_search_tool_result",
      "tool_use_id": "srvtoolu_01ABC123",
      "content": {
        "type": "tool_search_tool_search_result",
        "tool_references": [{ "type": "tool_reference", "tool_name": "get_weather" }]
      }
    },
    {
      "type": "tool_use",
      "id": "toolu_01XYZ789",
      "name": "get_weather",
      "input": { "location": "San Francisco", "unit": "fahrenheit" }
    }
  ],
  "stop_reason": "tool_use"
}
```

Trois règles pour le traiter :

1. **Ne renvoyez jamais de `tool_result` pour l'ID `srvtoolu_...`.** La recherche a déjà tourné sur les serveurs d'Anthropic. Si vous y répondez, l'API rejette la requête. Votre `tool_result` va uniquement à l'ID `toolu_...` : usage d'outil ordinaire à partir de là.
2. **Ne déployez jamais vous-même les blocs `tool_reference`.** L'API le fait, tant que la définition correspondante est présente dans `tools`.
3. **Gardez `tool_search_tool_result` tel quel dans l'historique.** C'est ainsi que les tours suivants savent quels outils sont déjà découverts.

Une recherche qui ne correspond à rien n'est **pas** une erreur : vous obtenez un `tool_search_tool_search_result` avec un tableau `tool_references` vide, et Claude décide de la suite.

Un détail discret sur `limit` : il vaut **5** résultats par défaut, mais Claude peut mettre n'importe quelle valeur de 1 à 10 000 dans sa propre entrée de recherche. Vous ne le contrôlez pas directement. Si vous avez besoin d'un plafond strict sur le nombre de définitions qui peuvent affluer, c'est un argument en faveur de l'implémentation personnalisée plus bas.

## Les cinq erreurs 400

Quatre d'entre elles sont des erreurs de forme de requête qui surviennent avant toute inférence, et une est le conflit que personne n'attend.

<Steps items={[
  {title: "Tous les outils différés", body: "« At least one tool must have defer_loading=false. All tools cannot be deferred. » La cause habituelle est une boucle qui applique defer_loading: true sur tout le tableau, outil de recherche compris. Ne différez jamais l'outil de recherche."},
  {title: "Une référence sans définition", body: "« Tool reference 'unknown_tool' not found in available tools. » Causée par le retrait des définitions différées des requêtes de suivi pour économiser des octets. Envoyez le tableau complet à chaque tour."},
  {title: "defer_loading avec cache_control sur le même outil", body: "Un outil différé ne peut pas porter de point d'arrêt de cache : l'API renvoie une 400. Placez plutôt le point d'arrêt sur un outil non différé. C'est celle qui mord les équipes dont le caching était déjà réglé."},
  {title: "defer_loading au niveau de l'entrée du toolset", body: "Les toolsets computer use et browser use (computer_toolset_20260801, browser_toolset_20260801) prennent defer_loading par outil membre dans l'objet configs de l'entrée. Le régler sur l'entrée elle-même est rejeté."},
  {title: "Des membres d'un même toolset en désaccord", body: "Comme un toolset se diffère et se déploie en bloc, defer_loading doit avoir la même valeur sur chaque membre activé. Découvrez le toolset et tous ses membres activés se chargent d'un coup : il n'y a pas de déploiement partiel."}
]} />

Les échecs de recherche *pendant* l'exécution sont différents : ils reviennent avec un HTTP **200** et l'erreur dans un objet `tool_search_tool_result_error`.

| `error_code` | Ce qui s'est passé |
|---|---|
| `invalid_tool_input` | Regex malformée, ou motif dépassant la limite de 200 caractères |
| `unavailable` | La recherche n'a pas pu s'exécuter : timeout ou service indisponible |
| `too_many_requests` | Limite de débit sur les opérations de recherche d'outils spécifiquement |
| `execution_time_exceeded` | La recherche a dépassé sa limite de temps d'exécution |

Traitez-les comme récupérables : la conversation est intacte, et le bon réflexe est généralement de laisser Claude réessayer avec un autre motif plutôt que de faire échouer tout le tour. Voir [Erreurs & limites de débit](/docs/api/errors-and-rate-limits) pour la politique de retry environnante.

## Prompt caching

L'essentiel est bon : les définitions différées vivent hors du préfixe en cache, donc ajouter et découvrir des outils en cours de conversation ne l'invalide pas. Voir [Prompt caching](/docs/api/prompt-caching) pour les règles de préfixe, et [Diagnostics du cache](/docs/api/cache-diagnostics) si vous devez prouver un hit.

Le piège est celui listé plus haut : `defer_loading: true` et `cache_control` s'excluent mutuellement sur un même outil. Si votre point d'arrêt se trouve actuellement sur le dernier outil d'un long tableau et que vous différez ensuite ce tableau, vous êtes passé discrètement de « en cache » à « 400 ». Ancrez le point d'arrêt sur un outil que vous comptiez de toute façon garder chargé.

## Connecteur MCP : à régler sur le toolset, pas sur l'outil

Avec des outils qui arrivent de serveurs distants via le [connecteur MCP](/docs/api/mcp), vous ne touchez pas aux définitions individuelles : elles ne vous appartiennent pas. Configurez-le sur l'entrée `mcp_toolset` : une fois pour tout le serveur via `default_config`, ou par outil dans `configs`.

<PromptCard title="Defer a whole MCP server except the one tool you always need">
{`{
  "type": "mcp_toolset",
  "mcp_server_name": "observability",
  "default_config": { "defer_loading": true },
  "configs": {
    "search_events": { "defer_loading": false }
  }
}`}
</PromptCard>

C'est la forme qui rapporte le plus vite en pratique : agréger plusieurs serveurs est exactement la situation de plus de 200 outils pour laquelle la fonctionnalité existe, et vous avez presque toujours un ou deux outils d'entrée qui valent la peine d'être gardés chauds.

## Remplacer la recherche par la vôtre

Les deux variantes intégrées sont lexicales. Si vos outils se trouvent mieux par le sens que par la formulation, implémentez la recherche vous-même : définissez un outil personnalisé ordinaire et renvoyez des blocs `tool_reference` dans un `tool_result` normal.

<PromptCard title="A client-side search result the API will expand">
{`{
  "type": "tool_result",
  "tool_use_id": "toolu_your_tool_id",
  "content": [
    { "type": "tool_reference", "tool_name": "discovered_tool_name" }
  ]
}`}
</PromptCard>

Chaque nom que vous référencez a toujours besoin de sa définition complète dans le tableau `tools` de premier niveau, normalement avec `defer_loading: true`. Le chemin de déploiement est identique : vous n'avez fait que remplacer la récupération. Notez la différence de format : `tool_search_tool_result` est la forme *côté serveur*, interne aux variantes intégrées. Votre outil personnalisé renvoie la forme `tool_result` standard montrée ci-dessus. Anthropic publie une [recette d'embeddings détaillée](https://platform.claude.com/cookbook/tool-use-tool-search-with-embeddings).

C'est aussi votre échappatoire au problème de `limit` : votre propre recherche décide combien de références reviennent.

## Quand s'en passer

Le chargement différé ne vous apporte rien, et vous coûte un aller-retour de recherche, quand la prémisse ne tient pas. Utilisez-le quand **l'un quelconque** de ces points est vrai :

- 10 outils disponibles ou plus
- définitions d'outils au-dessus d'environ 10k tokens
- précision de sélection qui baisse visiblement à mesure que le catalogue grossit
- plusieurs serveurs MCP agrégés (plus de 200 outils)
- une bibliothèque d'outils qui ne cesse de grandir

Restez sur l'appel d'outils ordinaire si vous avez moins de 10 outils, ou si chaque outil est utilisé à chaque requête, ou si tout le catalogue fait moins d'environ 100 tokens. Et notez la forme de la facturation : **la recherche d'outils n'est pas mesurée comme un outil serveur distinct.** Il n'y a pas de champ de recherche d'outils dans `usage.server_tool_use`. Les seuls tokens qu'elle coûte sont les définitions qu'elle tire dans le contexte, facturées comme n'importe quelle autre définition d'outil.

Les plafonds stricts, pour la planification de capacité : **10 000 outils différés par requête**, motifs regex de 200 caractères, requêtes BM25 de 500 caractères.

## Mises en garde par plateforme

Deux notes de déploiement qui font facilement perdre une journée. Sur **Amazon Bedrock**, la recherche d'outils côté serveur ne fonctionne que via l'API InvokeModel, pas via l'API Converse. Sur **Claude Platform on AWS**, elle se comporte exactement comme l'API Claude, parce que ce chemin utilise directement l'API Messages et n'a pas de séparation InvokeModel/Converse. Claude Opus 4.1 et les versions antérieures ne prennent pas du tout la fonctionnalité en charge.

<Flashcards title="Vocabulaire de la recherche d'outils" cards={[
  {front: "defer_loading", back: "Booléen par outil. Garde une définition hors du préfixe du prompt système jusqu'à ce que Claude la découvre par la recherche. NE change PAS ce que vous uploadez : vous envoyez toujours chaque définition à chaque requête."},
  {front: "tool_reference", back: "Un pointeur léger que l'API ajoute en ligne dans la conversation quand une recherche correspond. L'API le déploie en définition complète avant que Claude ne la voie. Vous ne le déployez jamais vous-même."},
  {front: "server_tool_use", back: "L'appel de Claude à l'outil de recherche, avec un ID srvtoolu_. Il s'est déjà exécuté sur les serveurs d'Anthropic : renvoyer un tool_result pour cet ID fait rejeter votre requête par l'API."},
  {front: "tool_search_tool_result", back: "Le bloc de résultats de recherche, enveloppant un objet tool_search_tool_search_result avec un tableau tool_references. Renvoyez-le tel quel : c'est ainsi que les tours suivants réutilisent les outils découverts."},
  {front: "Variante regex vs BM25", back: "regex_20251119 : Claude écrit des motifs Python re.search(), 200 caractères max, insensible à la casse. bm25_20251119 : requêtes en langage naturel, 500 caractères max. Les deux cherchent dans les noms, descriptions, noms d'arguments et descriptions d'arguments."},
  {front: "Le conflit avec cache_control", back: "Un outil ne peut pas à la fois être defer_loading: true et porter cache_control : 400. Placez le point d'arrêt de cache sur un outil qui reste chargé."},
  {front: "defer_loading sur un toolset", back: "computer_toolset_20260801 / browser_toolset_20260801 prennent le flag par membre dans configs, jamais sur l'entrée. Il doit être identique sur les membres activés, et tout le toolset se déploie d'un coup."},
  {front: "limit", back: "Entier optionnel dans l'entrée de recherche de Claude, de 1 à 10 000, défaut 5. Plafonne le nombre d'outils correspondants qu'une recherche renvoie. Vous ne le réglez pas : c'est Claude."}
]} />

<Quiz title="Vérifiez vos connaissances" questions={[
  {q: "Vous mettez defer_loading: true sur 400 de vos 405 outils. Que devient la taille du JSON que vous POSTez ?", options: ["Elle baisse d'environ 99 pour cent : les définitions différées sont omises", "Elle est inchangée : vous envoyez toujours chaque définition complète, différée ou non", "Elle baisse seulement sur les requêtes de suivi après la première recherche"], answer: 1, explain: "defer_loading contrôle ce qui entre dans la fenêtre de contexte, pas ce que vous transmettez. L'API a besoin de chaque définition côté serveur pour exécuter la recherche et déployer les références. Vos tokens d'entrée facturés baissent ; le corps de votre requête, non."},
  {q: "Une boucle applique defer_loading: true sur tout votre tableau d'outils. Que renvoie l'API ?", options: ["200, avec l'outil de recherche silencieusement non différé pour vous", "Une 400 : au moins un outil doit avoir defer_loading=false", "200, mais Claude ne peut jamais trouver aucun outil"], answer: 1, explain: "« At least one tool must have defer_loading=false. All tools cannot be deferred. » Normalement, l'outil non différé est l'outil de recherche lui-même : ne le différez jamais."},
  {q: "Votre réponse contient un bloc server_tool_use d'id srvtoolu_01ABC et un bloc tool_use d'id toolu_01XYZ. Que renvoyez-vous ?", options: ["Un tool_result pour chaque ID", "Un tool_result pour srvtoolu_01ABC seulement", "Un tool_result pour toolu_01XYZ seulement, en renvoyant les blocs de recherche tels quels"], answer: 2, explain: "La recherche a déjà tourné sur l'infrastructure d'Anthropic. Renvoyer un tool_result pour l'ID srvtoolu_ fait rejeter la requête par l'API. Renvoyez server_tool_use et tool_search_tool_result tels quels et ne répondez qu'au vrai appel d'outil."},
  {q: "Vous aviez déjà un point d'arrêt de cache sur le dernier outil de votre tableau. Vous différez maintenant ce tableau. Qu'est-ce qui casse ?", options: ["Rien : les outils différés sont mis en cache séparément", "Une 400 : defer_loading et cache_control ne peuvent pas coexister sur un même outil", "Le cache cesse silencieusement de répondre"], answer: 1, explain: "Un outil différé ne peut pas porter cache_control ; l'API renvoie une 400. Déplacez le point d'arrêt sur un outil qui reste non différé. Les définitions différées se trouvent de toute façon hors du préfixe en cache, ce qui préserve votre cache à travers les découvertes."},
  {q: "Claude n'arrive pas à trouver vos outils Grafana avec la variante regex. Quel est le meilleur premier réflexe ?", options: ["Passer à un motif à correspondance exacte", "Ajouter dans les descriptions d'outils les mots-clés que les utilisateurs disent vraiment, et préfixer les noms par grafana_", "Relever la limit au-dessus de 5"], answer: 1, explain: "La recherche couvre les noms, descriptions, noms d'arguments et descriptions d'arguments, et Claude écrit des motifs larges comme « .*grafana.* », pas des correspondances exactes. La découvrabilité est un problème d'écriture : mettez le vocabulaire de l'utilisateur dans la description et préfixez les noms pour qu'un seul motif balaie le groupe."},
  {q: "Comment la recherche d'outils est-elle facturée ?", options: ["À la recherche, comme la recherche web", "Non mesurée séparément : vous ne payez que les définitions qu'elle charge dans le contexte", "Un forfait mensuel par outil différé"], answer: 1, explain: "Il n'y a pas de champ de recherche d'outils dans usage.server_tool_use. Le seul coût est celui des définitions d'outils que la recherche tire dans le contexte, facturées comme n'importe quels autres tokens d'entrée."}
]} />

## Sources & pour aller plus loin

- [Tool search tool — docs Claude Platform](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) — les deux variantes et leurs chaînes de version, la sémantique de `defer_loading`, le chiffre de ~55k tokens en multiserveur et la réduction de 85 pour cent, le plafond de précision à 30–50 outils, les formes de blocs de réponse, les cinq 400, les quatre valeurs de `error_code`, le plafond de 10 000 outils, la mise en garde Bedrock InvokeModel et le tableau de support des modèles.
- [Tool use with prompt caching — docs Claude Platform](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-use-with-prompt-caching) — ce qui invalide un cache de définitions d'outils, et pourquoi l'ensemble différé se trouve hors du préfixe.
- [MCP connector — docs Claude Platform](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) — la forme de `mcp_toolset`, `default_config` et `configs` par outil.
- [Tool reference — docs Claude Platform](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference) — les toolsets client et le format `configs` qu'exigent les toolsets computer/browser.
- [Tool search with embeddings — cookbook Anthropic](https://platform.claude.com/cookbook/tool-use-tool-search-with-embeddings) — une implémentation sémantique personnalisée complète qui renvoie des blocs `tool_reference`.
- [Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use) — Anthropic Engineering, l'article de lancement derrière les chiffres de tokens et de précision publiés.
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — le principe de récupération juste-à-temps dont le chargement différé est une instance.
- Voir aussi sur AILmanac : [Tool Use / Function Calling](/docs/api/tool-use) · [Programmatic Tool Calling](/docs/api/programmatic-tool-calling) · [MCP](/docs/api/mcp) · [Coût en tokens de MCP](/docs/claude-code/mcp-token-cost) · [Prompt caching](/docs/api/prompt-caching) · [Diagnostics du cache](/docs/api/cache-diagnostics)

## Suite

- [Programmatic Tool Calling](/docs/api/programmatic-tool-calling) — l'autre moitié de l'usage avancé des outils : la recherche trouve le bon outil, l'appel programmatique l'exécute sans traîner les résultats à travers le contexte.
- [Coût en tokens de MCP](/docs/claude-code/mcp-token-cost) — l'économie et les écarts de précision publiés derrière cette fonctionnalité.
- [Mémoire & édition du contexte](/docs/api/memory-and-context-editing) — que faire des *résultats* qui remplissent votre contexte, une fois les définitions réglées.
