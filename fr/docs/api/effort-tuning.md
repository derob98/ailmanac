# Régler l'effort : 5 niveaux, valeurs par défaut par modèle et le piège du cache

> Source: https://derob98.github.io/ailmanac/fr/docs/api/effort-tuning · AILmanac (CC BY 4.0) · last verified 2026-10-19

Le paramètre effort de juillet 2026 comporte cinq niveaux — low, medium, high, xhigh, max — et se place dans output_config, pas au premier niveau. Il agit sur les appels d'outils (pas seulement sur la réflexion), invalide le cache de prompt s'il change en cours de conversation, et chaque modèle a un point de départ recommandé différent. Le guide pratique de réglage.

<LevelBadge level="intermediate" />

Le **22 juillet 2026**, Anthropic a intégré `effort` à la configuration du modèle de Claude Managed Agents, bouclant la boucle sur un contrôle que la Messages API a discrètement fait passer à cinq niveaux. Si vous recopiez encore `effort="high"` au premier niveau de `messages.create` depuis un article de début 2026, votre requête semble valide, mais Claude peut ne pas honorer le champ que vous croyez : le paramètre vit désormais dans `output_config`, et l'API n'applique que les niveaux documentés sur la fiche du modèle.

Voici le guide pratique de réglage : où va réellement `effort` dans une requête, ce que font vraiment les cinq niveaux (ils changent le nombre d'appels d'outils, pas seulement la profondeur de réflexion), les valeurs par défaut par modèle qui surprennent, et le piège qui fait discrètement exploser la dépense — changer l'effort en cours de conversation invalide le cache de prompt.

<Callout type="objectives" items={[
  "Placer correctement le champ effort — dans output_config sur la Messages API, dans l'objet model sur Managed Agents, via /effort ou CLAUDE_CODE_EFFORT_LEVEL dans Claude Code",
  "Choisir un niveau de départ par modèle — high est le défaut de l'API sur la plupart des modèles mais PAS sur Opus 5.5 et Haiku 5.5, qui utilisent medium, et l'effort de départ recommandé varie encore (Sonnet 5.5 medium pour le code agentique, Sonnet 4.6 medium, Opus 4.7/4.8 xhigh, Fable 5.1 high)",
  "Comprendre que l'effort affecte TOUS les tokens — texte, appels d'outils et (quand elle est active) réflexion — donc baisser l'effort réduit le nombre d'appels d'outils, pas seulement la verbosité",
  "Éviter le piège du cache — faire varier l'effort dans une même conversation invalide le prompt caching et peut doubler la facture sans bruit",
  "Connaître la surface d'effort de Claude Code — /effort, ultrathink (un seul tour), ultracode (xhigh + permission multiagent permanente), surcharge par la variable d'environnement CLAUDE_CODE_EFFORT_LEVEL",
]} />

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/build-with-claude/effort">
Vérifié sur la documentation officielle d'Anthropic consacrée à l'effort. Les valeurs par défaut par modèle, les listes de disponibilité de `xhigh`/`max`, ainsi que le statut bêta et la couverture de modèles de l'effort par message changent d'une version à l'autre — revérifiez la source avant de figer un comportement en production.
</VerifyNote>

## Les cinq niveaux (et la place d'« ultracode »)

L'échelle d'effort au 22 juillet 2026 compte **cinq** valeurs acceptées par l'API :

| Niveau | Ce qu'il fait | Quand l'utiliser |
|---|---|---|
| `low` | Le plus efficace. Économie de tokens notable avec une certaine baisse de capacité. Moins d'appels d'outils, confirmations laconiques, aucun préambule. | Classification simple, charges à gros volume, chat, UX sensible à la latence, sous-agents sur des tâches circonscrites |
| `medium` | Équilibré. Économie de tokens modérée par rapport à high. | Tâches agentiques demandant un équilibre entre vitesse, coût et qualité ; palier économique en dessous de high |
| `high` | Haute capacité. **Équivaut à omettre le paramètre — sur tous les modèles sauf Opus 5.5 et Haiku 5.5, dont le défaut est `medium`.** | Raisonnement complexe, code difficile, tâches agentiques où la qualité compte plus que la vitesse |
| `xhigh` | Capacité étendue pour le travail au long cours. Attendez-vous à une consommation de tokens nettement supérieure à high. | Tâches agentiques et de code longues (30+ min), budgets de tokens en millions, refactorings profonds sur plusieurs fichiers |
| `max` | Capacité maximale absolue, sans contrainte sur la dépense de tokens. | Uniquement les vrais problèmes de pointe. Peut sur-réfléchir sur les tâches à sortie structurée. |

Ni `max` ni `xhigh` ne sont universels — vérifiez le niveau par rapport au modèle avant de livrer. `xhigh` est pris en charge sur **Fable 5.1, Mythos 5.1, Fable 5, Mythos 5, Opus 5.5, Opus 5, Opus 4.8, Opus 4.7, Sonnet 5.5, Sonnet 5 et Haiku 5.5**. `max` couvre tous ceux-là plus **Mythos Preview, Opus 4.6 et Sonnet 4.6**. Opus 4.5 prend en charge l'effort mais aucun des deux niveaux supérieurs. Selon les mots d'Anthropic : "Not every model that supports `max` supports `xhigh`."

<Callout type="tip" items={[
  "Régler l'effort sur la valeur par défaut du modèle produit exactement le même comportement qu'omettre le paramètre — c'est 'high' sur la plupart des modèles, mais 'medium' sur Opus 5.5 et Haiku 5.5. Ne le définissez pas « pour être explicite » dans une conversation en cache, car écrire le champ sur certaines requêtes et pas sur d'autres invalide le cache.",
  "'ultracode' n'est pas un sixième niveau. C'est xhigh + une permission permanente pour Claude Code de lancer des workflows multiagents, accordée par des messages système en cours de conversation. L'API accepte cinq valeurs.",
]} />

## La structure du champ que la plupart des articles ont faux

Les articles de début 2026 sur le paramètre effort montrent un champ au premier niveau :

```python
# WRONG on current models — silently ignored or 400
client.messages.create(
    model="claude-opus-4-8",
    effort="medium",
    ...
)
```

L'API actuelle place `effort` dans un objet `output_config`, passé comme frère de `messages`/`model` :

<PromptCard title="Bon emplacement d'effort — Messages API">
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

Sur Claude Managed Agents (le changement du 22 juillet 2026), `effort` se place dans l'objet `model` de l'agent à sa création. La session ne le définit pas — c'est la version de l'agent qui le fait.

<PromptCard title="Bon emplacement d'effort — Managed Agents (POST /v1/agents)">
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

## L'effort n'est pas un contrôle de la réflexion

C'est la seconde grande idée reçue. L'effort fonctionne **que la réflexion soit activée ou non**, et il modifie les tokens que Claude dépense sur des parties de la réponse qui ne sont pas de la réflexion :

- **Appels d'outils.** Effort plus bas → moins d'appels d'outils. Claude regroupe les opérations en un seul appel, saute l'exploration facultative et passe à l'action sans préambule.
- **Longueur du texte.** Effort plus bas → sortie plus concise. Confirmations laconiques après les appels d'outils plutôt que résumés détaillés. Moins de commentaires dans le code.
- **Profondeur de réflexion** (quand la réflexion est active). Effort plus bas → saute entièrement la réflexion sur les prompts faciles ; réfléchit encore sur les vraiment difficiles, mais moins.

Ce dernier point compte : à effort `low`, Claude réfléchira quand même sur un problème de démonstration, parce que la tâche l'exige. L'effort est un *signal comportemental*, pas un budget de tokens strict. N'attendez pas de plafond ferme.

Le paramètre `thinking` et le paramètre `effort` répondent à des questions différentes. `thinking` décide si Claude produit des blocs de réflexion. `effort` décide de la quantité de travail investie dans toute la réponse — y compris la fréquence et la profondeur de la réflexion quand l'adaptive thinking est actif. Passer `effort="adaptive"` est une erreur fréquente ; `adaptive` est un *mode de réflexion*, pas un niveau d'effort.

<Callout type="tip">
Sur <strong>Opus 4.5</strong> — le seul modèle à réflexion étendue uniquement qui prend en charge l'effort — vous réglez l'effort <em>et</em> `budget_tokens` ensemble. Choisissez le niveau d'effort adapté à votre tâche, puis dimensionnez le budget de tokens de réflexion selon la profondeur de raisonnement voulue. Tous les autres modèles compatibles avec l'effort utilisent l'adaptive thinking et n'acceptent pas `budget_tokens`.
</Callout>

## Points de départ par modèle qui surprennent les équipes

Le défaut de l'API est `high` sur la plupart des modèles compatibles avec l'effort — **mais pas tous. Opus 5.5 et Haiku 5.5 utilisent `medium` par défaut.** En plus, l'*effort de départ recommandé* par Anthropic varie selon le modèle, et c'est dans cet écart que les équipes sur- ou sous-dépensent.

<Steps items={[
  {title: "Opus 5.5 — le défaut est medium, pas high", body: "Opus 5.5 est le seul Opus dont le défaut est medium : une requête qui omet l'effort tourne donc un niveau PLUS BAS que le même code sur Opus 5. Si la qualité a baissé après migration, vérifiez cela en premier. L'adaptive thinking est toujours actif et ne peut pas être désactivé (thinking: {type: 'disabled'} renvoie 400 à tous les niveaux) : l'effort est donc votre seul contrôle sur la quantité de raisonnement et le coût de la requête. Refaites un balayage d'effort plutôt que de reporter les réglages — à niveau égal, il réfléchit davantage par tour que Opus 5."},
  {title: "Haiku 5.5 — également medium par défaut, et low est le niveau d'économie", body: "L'autre modèle dont le défaut est medium, et le premier Haiku à prendre en charge l'effort. Partez de medium pour la plupart des tâches, y compris le code agentique. Utilisez low — le moins cher et le plus rapide — pour le chat, les courtes tâches avec outils et les requêtes simples à gros volume, mais sachez le compromis : dans de longs prompts d'agent à low, il est plus susceptible de sauter une recherche, de s'arrêter tôt ou d'omettre une vérification. Passez à high pour le travail de connaissance, les tâches d'agent plus longues et le respect strict des consignes. Comparez xhigh/max à Sonnet 5.5 en coût et en vitesse avant de vous engager."},
  {title: "Fable 5.1 et Sonnet 5.5 — high reste le défaut", body: "Les deux ont high par défaut et prennent en charge les cinq niveaux. Sur Fable 5.1, partez de high, montez à xhigh/max pour le travail agentique et de code le plus sensible à la capacité, et descendez à medium/low quand vos évaluations montrent que la qualité tient. Les niveaux de Sonnet 5.5 sont RECALIBRÉS par rapport à Sonnet 5 — un niveau n'achète plus la même quantité de réflexion, donc refaites un balayage. Pour le code agentique sur Sonnet 5.5, partez de medium pour les tâches bien spécifiées et passez à high pour les plus difficiles ; pour le code agentique, réglez max_tokens à 128 000, le maximum du modèle, et utilisez le streaming."},
  {title: "Sonnet 5 — partez de high (le défaut)", body: "Sonnet 5 a high par défaut, sur l'API comme dans Claude Code, et la recommandation est la même. Ne montez à xhigh que pour les tâches de code et agentiques les plus difficiles. Descendez à medium pour économiser — Sonnet 5 medium est comparable à Sonnet 4.6 high. Utilisez low pour le chat et les charges hors code sensibles à la latence."},
  {title: "Sonnet 4.6 — partez de medium, surchargez le défaut", body: "Sonnet 4.6 a high par défaut, mais les conseils d'Anthropic eux-mêmes recommandent medium comme défaut équilibré pour la plupart des applications, y compris le code agentique. Définissez explicitement effort='medium' — sinon vous héritez de high et payez une latence que vous n'avez pas demandée."},
  {title: "Opus 4.7 et 4.8 — partez de xhigh pour le code, de high pour tout le reste", body: "Le défaut est high, mais la recommandation pour le code et le travail agentique est xhigh. Utilisez high comme minimum pour les charges sensibles à l'intelligence. Ne passez à medium que lorsque vos évaluations montrent que la qualité tient. Réservez max aux vrais problèmes de pointe — sur la plupart des charges, max ajoute un coût important pour de petits gains de qualité, et sur les tâches à sortie structurée il peut sur-réfléchir."},
  {title: "Opus 4.7 respecte low/medium plus strictement — demandez de la profondeur dans le prompt si besoin", body: "Opus 4.7 (et 4.8) cadrent le travail plus étroitement à low/medium qu'Opus 4.6. Si vous observez un raisonnement superficiel sur un prompt complexe à low, augmentez l'effort plutôt que de le contourner par le prompt. Si la latence vous oblige à rester à low, ajoutez une ligne ciblée comme 'This task involves multistep reasoning. Think carefully before responding.'"},
  {title: "Fable 5 et Mythos 5 — high est le contrôle principal", body: "L'effort est le principal levier d'intelligence/latence/coût sur Fable 5. Partez de high (le défaut), utilisez xhigh pour le travail le plus sensible à la capacité, et descendez à medium ou low pour les tâches courantes — les niveaux plus bas sur Fable 5 dépassent encore les modèles précédents à xhigh. Réglez un max_tokens élevé à high/xhigh, car il plafonne la réflexion et le texte de réponse réunis."},
  {title: "Opus 4.7/4.8 à xhigh ou max — portez max_tokens à au moins 64k", body: "Les deux modèles peuvent dépenser beaucoup à travers les sous-agents et les appels d'outils à xhigh/max. Anthropic recommande de partir de max_tokens à 64k puis d'ajuster. Laissez-le à 4096 et vous obtiendrez une réponse tronquée avec stop_reason='max_tokens' après un début prometteur."},
]} />

## Le piège du cache — celui qui double la facture sans bruit

Le prompt caching offre des lectures de cache à une fraction du prix d'entrée standard (un dixième sur la plupart des modèles, moins sur les plus récents — voir [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)). Changer le `output_config.effort` **de premier niveau** entre deux requêtes de la même conversation **invalide le cache**, exactement comme un changement de modèle : l'effort de premier niveau façonne le prompt rendu, donc une nouvelle valeur signifie qu'aucun préfixe en cache ne correspond. Sur un long contexte, c'est une relecture à plein tarif de tout votre historique, à chaque tour suivant.

### L'échappatoire : l'effort par message (bêta)

Les modèles les plus récents permettent de changer l'effort *sans* perdre le cache. Ajoutez un message `role: "system"` avec un `content` vide portant le nouveau niveau dans `output_config.effort`, et tout ce qui précède reste identique à l'octet près — le préfixe en cache correspond donc toujours.

<PromptCard title="Changer l'effort en cours de conversation sans défaut de cache">
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

Disponibilité au 19 octobre 2026 : sur la Claude API et Google Cloud, cela fonctionne sur **Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Sonnet 5.5 et Haiku 5.5** ; sur Amazon Bedrock, uniquement **Fable 5.1, Mythos 5.1 et Opus 5.5**. Il faut l'en-tête bêta `mid-conversation-output-config-2026-07-01` — sans lui, un `output_config` par message renvoie `400 messages.N.output_config: Extra inputs are not permitted`. Avec l'en-tête mais un modèle non pris en charge (dont Fable 5), vous obtenez `400 output_config.effort requires a model that supports per-turn effort; this model does not`.

Deux modèles refusent de changer l'effort par tour une fois la réflexion figée : **Sonnet 5.5 avec `thinking: {"type": "between_tools"}`** et **Haiku 5.5 avec `thinking: {"type": "disabled"}`** renvoient 400 si un niveau par message diffère de celui en vigueur. Utilisez l'adaptive thinking pour faire varier l'effort dans ces cas.

Pour tout le reste, l'ancienne règle s'applique toujours — choisissez un niveau et tenez-vous-y :

<Callout type="tip" items={[
  "Sur les modèles sans effort par message, faites varier l'effort ENTRE charges de travail, pas À L'INTÉRIEUR d'une conversation en cache. Choisissez le niveau au début de la conversation et gardez-le constant jusqu'à /clear.",
  "Préférez l'effort par message à un changement de premier niveau même quand les deux fonctionnent : sur Fable 5.1, un basculement de premier niveau oriente aussi moins fiablement le modèle, car ses réponses précédentes ont été écrites au niveau précédent et il tend à rester cohérent avec elles.",
  "Dans Claude Code, /effort en cours de session équivaut à changer de modèle — attendez-vous à un gros défaut de cache au tour suivant.",
  "Si vous devez monter en profondeur pour un seul tour, utilisez 'ultrathink' dans Claude Code (un coup de pouce de raisonnement plus profond pour un tour) plutôt que /effort xhigh — cela évite de modifier la configuration de la session.",
  "Si vous devez monter pour le reste de la session, faites-le tôt. Un changement au tour 3 coûte peu ; un changement au tour 30 relit 30 tours de contexte à plein tarif.",
]} />

Le corollaire : définir `effort="high"` explicitement sur certaines requêtes en cache et l'omettre sur d'autres invalide le cache de la même façon — car les deux sont *équivalents en comportement* mais *différents dans le texte*. Choisissez une convention (toujours définir, ou toujours omettre) et tenez-vous-y.

## Claude Code — la surface en CLI

Claude Code expose l'effort sous forme de commande interactive, de drapeau de lancement et de variable d'environnement (la priorité la plus haute l'emporte, dans l'ordre inverse) :

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

Deux commandes connexes méritent d'être connues, car ce ne sont pas des niveaux d'effort mais elles se comportent de façon voisine :

- **`ultrathink`** — un coup de pouce de raisonnement plus profond pour un seul tour qui ne change *pas* l'effort de la session. Utilisez-le quand vous voulez que le prochain tour réfléchisse davantage sans invalider le cache de tous les tours suivants.
- **`ultracode`** — règle `xhigh` pour toute la session **et** accorde à Claude Code la permission permanente de lancer des workflows multiagents (via des messages système en cours de conversation). L'API n'a pas de valeur `ultracode` — c'est une commodité de la CLI qui compose `xhigh` avec une permission d'orchestration.

Règles de persistance à retenir : `low`, `medium`, `high` et `xhigh` persistent d'une session Claude Code à l'autre une fois définis. `max` ne s'applique qu'à la session en cours — il faut le réappliquer la fois suivante.

## Un pas-à-pas de réglage — un prompt, trois efforts

Pour calibrer l'intuition, exécutez le *même* prompt à trois niveaux et comparez la forme de la sortie :

<PromptCard title="Prompt de calibrage (à lancer à low, high, xhigh)">
{`Task: Review this pull request for security issues.

<pr_diff>
[paste a real diff — 300+ lines, multi-file, at least one auth-touching change]
</pr_diff>

Report: severity-tagged findings + a one-line fix per finding.
Do not restate what the diff does.`}
</PromptCard>

Attendez-vous à peu près à ceci :

- **low** — repère les problèmes évidents de haute gravité (concaténation de chaînes SQL, entrée utilisateur non vérifiée dans un en-tête). Manque les bugs de logique subtils. 1 à 2 appels d'outils si des outils sont disponibles. Sortie courte. Rapide.
- **high** — analyse complète. Repère la plupart des vulnérabilités, y compris subtiles. Plusieurs appels d'outils ciblés pour lire les fichiers liés. Constats structurés. C'est là que la plupart des équipes s'arrêtent.
- **xhigh** — exhaustif. Envisage des vecteurs d'attaque inédits et la défense en profondeur. Lit des fichiers adjacents que low/high n'ont pas touchés. Beaucoup plus d'appels d'outils. Consommation de tokens nettement supérieure.

Si vos évaluations montrent que `high` et `xhigh` produisent les mêmes constats sur votre base de code, livrez à `high`. La valeur de xhigh apparaît précisément quand la tâche profite d'appels d'outils répétés et d'une exploration détaillée — exactement quand Anthropic le recommande.

## Sonnet 5 a décalé la calibration — ne portez pas les niveaux à l'aveugle

Si vous faisiez tourner Sonnet 4.6 à `high` et avez migré vers Sonnet 5, conserver le même niveau fait dépenser à Sonnet 5 quelque chose de proche de ce que Sonnet 4.6 dépensait à `max` — l'échelle d'effort de Sonnet 5 est *décalée*. Le conseil d'Anthropic lui-même : **Sonnet 5 medium ≈ Sonnet 4.6 high**. C'est un écart de coût par requête à vérifier si vous avez rejoué du trafic sans ajuster l'effort. Voir le [guide de terrain de Sonnet 5](/docs/models/sonnet-5-field-guide) pour toute l'histoire de la migration.

## Ancrez-le

<Flashcards cards={[
  {front: "Où va le champ effort sur la Messages API ?", back: "Dans un objet output_config au premier niveau de messages.create — output_config: {effort: 'medium'}. Pas dans un argument effort de premier niveau."},
  {front: "Quels sont les cinq niveaux d'effort ?", back: "low, medium, high, xhigh, max. high est le défaut sur la plupart des modèles — mais Opus 5.5 et Haiku 5.5 utilisent medium."},
  {front: "Quels modèles ont medium plutôt que high comme effort par défaut ?", back: "Opus 5.5 et Haiku 5.5. Sur Opus 5.5, cela signifie que le code migré depuis Opus 5 tourne un niveau PLUS BAS à moins de définir l'effort explicitement."},
  {front: "L'effort affecte-t-il autre chose que la réflexion ?", back: "Oui — il affecte TOUS les tokens de la réponse : texte, appels d'outils (effort plus bas → moins d'appels) et réflexion quand elle est active."},
  {front: "Que se passe-t-il si vous changez l'effort en cours de conversation ?", back: "Un changement de PREMIER NIVEAU invalide le prompt caching, comme un changement de modèle. La forme par message — un message role:'system' au content vide avec le nouveau output_config.effort, derrière l'en-tête bêta mid-conversation-output-config-2026-07-01 — préserve le cache sur Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Sonnet 5.5 et Haiku 5.5."},
  {front: "« ultracode » est-il un sixième niveau d'effort ?", back: "Non. Ultracode est une commodité de la CLI de Claude Code qui règle xhigh ET accorde la permission permanente d'orchestration multiagent. L'API n'accepte que les cinq niveaux documentés."},
  {front: "Quel est l'effort recommandé pour Opus 4.7/4.8 sur les tâches de code ?", back: "xhigh — et portez max_tokens à au moins 64k pour que le modèle ait la place de raisonner et d'appeler des outils à travers les sous-agents."},
  {front: "Comment l'échelle d'effort de Sonnet 5 se compare-t-elle à celle de Sonnet 4.6 ?", back: "Décalée. Sonnet 5 medium équivaut à peu près à Sonnet 4.6 high. Ne portez pas les niveaux d'effort 1:1 lors de la migration."},
  {front: "Où va l'effort sur Claude Managed Agents ?", back: "Dans l'objet model de la configuration d'agent versionnée à la création (POST /v1/agents) — pas par session. Déployé le 22 juillet 2026."},
]} />

<Quiz title="Testez-vous" questions={[
  {q: "Laquelle de ces valeurs n'est PAS une valeur d'effort valide sur la Messages API ?", options: ["low", "medium", "adaptive", "xhigh"], answer: 2, explain: "'adaptive' est un mode de réflexion, pas un niveau d'effort. Les cinq valeurs valides sont low, medium, high, xhigh, max."},
  {q: "Vous menez une conversation en cache de 20 tours et basculez l'effort de PREMIER NIVEAU de high à xhigh au tour 21. Que se passe-t-il ?", options: ["Rien — l'effort est un indice d'exécution qui ne touche pas le cache", "La requête suivante coûte un peu plus car Claude réfléchit davantage", "La requête suivante invalide le cache et relit les 20 tours précédents au plein prix d'entrée", "L'API renvoie 400 car l'effort ne peut pas changer en cours de conversation"], answer: 2, explain: "L'effort de premier niveau façonne le prompt rendu : le changer invalide le prompt caching comme un changement de modèle. Sur un long historique, cela peut multiplier par 10 la facture d'entrée du tour suivant. La forme par message (un message role:'system' derrière la bêta mid-conversation-output-config-2026-07-01) l'évite sur les modèles les plus récents."},
  {q: "Vous êtes sur Opus 5.5 et omettez entièrement le paramètre effort. Quel niveau s'exécute ?", options: ["high — le défaut de l'API sur tous les modèles", "medium — Opus 5.5 est l'un des deux modèles dont le défaut est medium", "low — omettre l'effort minimise la dépense", "xhigh — les modèles Opus ont xhigh par défaut pour le code"], answer: 1, explain: "Opus 5.5 et Haiku 5.5 ont medium par défaut ; tous les autres modèles compatibles avec l'effort ont high. Le code migré depuis Opus 5 tourne donc un niveau plus bas qu'avant, sauf si vous définissez l'effort explicitement."},
  {q: "Vous êtes dans Claude Code et voulez que seul le tour SUIVANT raisonne plus fort sans toucher au réglage d'effort de la session. Meilleure option ?", options: ["/effort max, puis /effort auto après le tour", "Utiliser ultrathink pour ce seul tour", "Redémarrer Claude Code avec --effort xhigh", "Définir CLAUDE_CODE_EFFORT_LEVEL=max dans un sous-shell"], answer: 1, explain: "ultrathink fait exactement cela — un coup de pouce de raisonnement plus profond pour un seul tour qui ne change pas l'effort de la session, et n'invalide donc pas le cache des tours suivants."},
  {q: "Sur Opus 4.8 avec effort='xhigh', vos réponses se tronquent sans cesse avec stop_reason='max_tokens' après une longue réflexion. Correctif le plus probable ?", options: ["Baisser l'effort à high", "Augmenter max_tokens à 64k ou plus", "Désactiver la réflexion", "Passer à Opus 4.7"], answer: 1, explain: "max_tokens plafonne la réflexion et le texte de réponse réunis. À xhigh, Anthropic recommande de partir de max_tokens à 64k. Une limite dimensionnée pour « juste la réponse » tronque les réponses qui impliquent un raisonnement interne intense."},
  {q: "Où va l'effort lors de la création d'un agent Claude Managed Agents (la mise à jour de juillet 2026) ?", options: ["Sur chaque session à POST /v1/sessions", "Comme champ de premier niveau sur POST /v1/agents", "Dans l'objet model sur POST /v1/agents", "Dans le message système en cours de conversation"], answer: 2, explain: "La mise à jour du 22 juillet 2026 permet de passer 'effort' dans l'objet model à la création de l'agent. Les sessions héritent de l'effort de la version d'agent épinglée — vous ne le définissez pas à chaque exécution."},
  {q: "Quel changement fait que Sonnet 5 'medium' se comporte le plus comme Sonnet 4.6 à 'high' ?", options: ["Sonnet 5 utilise une fenêtre de contexte plus petite", "L'échelle d'effort s'est décalée entre les deux modèles", "Sonnet 5 désactive l'usage des outils à medium", "medium a été renommé sur Sonnet 5"], answer: 1, explain: "Le conseil d'Anthropic lui-même : Sonnet 5 medium ≈ Sonnet 4.6 high. Ne portez pas les niveaux d'effort 1:1 lors de la migration."}
]} />

## Sources et lectures complémentaires

- [Anthropic — Effort (build-with-claude/effort)](https://platform.claude.com/docs/en/build-with-claude/effort) — référence faisant autorité pour les cinq niveaux, `output_config.effort` et les recommandations par modèle
- [Anthropic — Thinking (build-with-claude/thinking)](https://platform.claude.com/docs/en/build-with-claude/thinking) — comment l'effort interagit avec l'adaptive thinking et quand choisir l'un ou l'autre contrôle
- [Notes de version de la Anthropic Platform — entrée du 22 juillet 2026](https://platform.claude.com/docs/en/release-notes/overview) — le déploiement de `effort` sur Managed Agents et les changements de webhooks et de seeding de session livrés le même jour
- [Prompting Claude Sonnet 5 — calibrer l'effort et la profondeur de réflexion](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5) — le décalage de l'échelle d'effort de Sonnet 5 et quand recourir à xhigh
- [Anthropic — Task budgets](https://platform.claude.com/docs/en/build-with-claude/task-budgets) — budgets de tokens indicatifs pour des boucles agentiques entières, un complément à l'effort pour les longues exécutions
- [AILmanac — Extended Thinking & Effort](/docs/api/thinking-and-effort) — le cadrage introductif que suppose cette page
- [AILmanac — Claude Sonnet 5 : le guide de terrain](/docs/models/sonnet-5-field-guide) — l'histoire de la migration et de la recalibration
- [AILmanac — Prompt caching](/docs/api/prompt-caching) — l'économie du cache qui rend si coûteux le changement d'effort en cours de conversation


## Suite

- [L'outil advisor : Sonnet fait le travail, Fable réfléchit](/docs/api/advisor-tool)
