# Permissions et modes de permission

> Source: https://derob98.github.io/ailmanac/fr/docs/claude-code/permissions · AILmanac (CC BY 4.0) · last verified 2026-08-18

Règles allow/ask/deny et modes — moins de confirmations sans perdre en sécurité.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-08-18" source="https://code.claude.com/docs/en/whats-new/2026-w32">
La syntaxe exacte des règles et les noms des modes évoluent — vérifiez-les dans la documentation officielle de Claude Code sur les permissions et les modes de permission. **Depuis la v2.1.283 :** `auto` est le mode de démarrage intégré des sessions interactives en terminal et dans VS Code, sur tous les forfaits et chez tous les fournisseurs (voir plus bas).
</VerifyNote>

<Callout type="objectives" items={["Ce que signifient les trois verdicts de permission (allow / ask / deny)", "Comment les règles de permission associent un outil à un motif", "Les six modes de permission et quand utiliser chacun", "Pourquoi le mode auto est désormais le mode de démarrage des sessions interactives — et comment s'en désinscrire", "Comment le mode auto remplace les confirmations par un classifieur de sécurité", "Comment construire une allowlist de départ raisonnable qui réduit les confirmations sans perdre en sécurité", "Où stocker les règles de permission du projet et les règles personnelles"]} />

Les permissions décident de **ce que Claude Code peut faire sans s'arrêter pour vous demander**. Bien réglées, elles vous donnent de la fluidité sans perte de contrôle ; mal réglées, vous validez tout à l'aveugle ou vous croulez sous les confirmations.

## Les trois verdicts

Chaque action possible aboutit à l'un de ces verdicts :

<Flashcards cards={[{front: "allow", back: "L'exécuter, sans confirmation."}, {front: "ask", back: "Faire une pause et vous demander — le comportement par défaut pour tout ce qui n'est pas explicitement autorisé ou refusé."}, {front: "deny", back: "Jamais, même si vous le demandez."}]} />

Les règles associent généralement un outil à un motif, par exemple allow `Bash(npm run test:*)` ou deny `Read(./.env)`.

<PromptCard title="Autoriser un outil + un motif">{`Bash(npm run test:*)`}</PromptCard>

<PromptCard title="Refuser un outil + un motif">{`Read(./.env)`}</PromptCard>

## Modes de permission

Un mode définit la posture générale d'une session. Il y en a six. Parcourez les plus courants avec `Shift+Tab`, ou définissez `permissions.defaultMode` dans les paramètres.

| Mode | S'exécute sans demander | À utiliser quand |
|---|---|---|
| **`default`** (affiché **Manual**) | Lectures uniquement | Travail quotidien, modifications sensibles |
| **`acceptEdits`** | Lectures, modifications de fichiers, commandes courantes du système de fichiers | Une session d'édition de confiance et bien délimitée |
| **`plan`** | Lectures, plus les commandes approuvées par le classifieur quand le mode auto est disponible ; ne modifie jamais votre code source | Tâches importantes ou risquées — voir [Plan Mode](/docs/claude-code/plan-mode) |
| **`auto`** *(le mode de démarrage des sessions interactives depuis la v2.1.283)* | Tout, filtré par un classifieur de sécurité | Longues tâches où la lassitude des confirmations est le vrai risque |
| **`dontAsk`** | Lectures de fichiers dans vos répertoires de travail et outils pré-approuvés ; tout ce qui demanderait une confirmation est refusé | CI et scripts verrouillés |
| **`bypassPermissions`** | Tout, sans aucun contrôle | Bacs à sable/conteneurs uniquement — **jamais** sur une machine contenant des secrets |

### Le mode auto est désormais le mode par défaut de Claude Code

Depuis Claude Code **v2.1.283**, `auto` est le mode de démarrage intégré des sessions interactives en terminal et dans VS Code sur **tous les forfaits et chez tous les fournisseurs**. Dans les versions antérieures, il n'était le mode par défaut des nouvelles sessions que sur les forfaits Pro, Max et Team, à partir du 14 août 2026. Justification d'Anthropic (issue de ses propres tests auprès de plus de 1 000 utilisateurs payants) : le classifieur a intercepté **89 %** des actions nuisibles contre **13,6 %** pour la revue manuelle — car, par habitude, les utilisateurs acceptaient environ 97 % des confirmations manuelles sans les lire.

Deux exceptions préservent l'intention :

- Si **vous** avez défini `permissions.defaultMode` dans vos paramètres utilisateur, il reste en place, sauf si vous acceptez une invite de basculement ponctuelle dans l'application.
- Si **votre organisation** gère le mode par défaut (paramètres gérés Team/Enterprise), rien ne change automatiquement.

Vous pouvez toujours changer de mode en cours de session avec `Shift+Tab`. Un changement connexe déjà en vigueur sur ces forfaits : les appels au classifieur effectués par le mode auto **ne comptent plus dans vos limites d'utilisation**.

<PromptCard title="Activer tôt (avant le 14 août) — définir auto comme mode par défaut">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "auto"
  }
}`}</PromptCard>

<PromptCard title="Garder l'ancien comportement avec confirmations après le 14 août">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "default"
  }
}`}</PromptCard>

### Comment fonctionne réellement le mode auto

`auto` est le juste milieu entre tout confirmer et désactiver la sécurité. Au lieu de vous demander, un **modèle classifieur** distinct examine chaque action avant son exécution et bloque tout ce qui dépasse ce que vous avez demandé, touche une infrastructure qu'il ne reconnaît pas, ou semble dicté par un contenu hostile que Claude vient de lire. Les règles `ask` explicites continuent de s'arrêter et de vous demander.

Il bloque notamment `curl | bash`, les force push, les déploiements et migrations en production, `rm -rf` sur des variables non résolues, la falsification de la transcription, les commandes git destructrices qui écartent un travail non commité, et l'envoi de secrets vers des points de terminaison externes — tout en laissant passer le travail courant (modifications locales, installation de dépendances déclarées, HTTP en lecture seule, push sur votre propre branche). Si la même action est bloquée à répétition, le mode auto se met en pause et vous redonne la main sur les confirmations.

Le mode auto n'est pas une garantie de sécurité — il réduit les confirmations, mais ne supprime pas la nécessité de relire les opérations sensibles. Sa disponibilité dépend de votre forfait, du modèle et (sur Team/Enterprise) d'un réglage administrateur. Si vous travaillez vraiment sans surveillance (cron, sessions cloud, CI), associez-le à [Hardening Autonomous Runs](/docs/security/hardening-autonomous-runs) — auto n'est toujours pas `bypassPermissions`.

<Callout type="warning" items={["bypassPermissions a sa place dans un bac à sable. Travailler sur votre vraie machine avec toutes les confirmations désactivées, c'est ainsi qu'un agent finit par toucher à ce qu'il ne devrait pas. Réservez-le aux environnements jetables — si ce que vous voulez vraiment, c'est moins de confirmations, utilisez plutôt le mode auto. Voir Hardening Autonomous Runs sur /docs/security/hardening-autonomous-runs."]} />

## Une allowlist de départ raisonnable

L'objectif : pré-autoriser ce qui est sûr et répétitif ; garder ce qui est destructeur en **ask** ou **deny**.

<Steps items={[{title: "Autoriser ce qui est sûr et répétitif", body: "Lire des fichiers, lancer vos commandes de test/lint/build, git status/diff."}, {title: "Demander avant ce qui présente un risque moyen", body: "Installer des dépendances, écrire des fichiers hors du projet, appels réseau."}, {title: "Refuser ce qui est destructeur", body: "Lire des fichiers secrets (.env, fichiers de clés), force-push, rm -rf."}]} />

Stockez les règles du projet dans [`settings.json`](/docs/claude-code/settings) (partagé) et vos surcharges personnelles dans `settings.local.json`.

<Callout type="tip" items={["Laissez-le apprendre de vos confirmations : approuvez la même commande sûre quelques fois et vous saurez exactement quoi ajouter à votre allowlist — pour transformer des confirmations répétées en une règle posée une fois pour toutes."]} />

<Callout type="takeaways" items={["Trois verdicts : allow (sans confirmation), ask (par défaut — pause et confirmation), deny (jamais).", "Les règles associent un outil à un motif, comme Bash(npm run test:*) ou Read(./.env).", "Six modes définissent la posture de la session : default (Manual), acceptEdits, plan, auto, dontAsk, bypassPermissions.", "Depuis la v2.1.283, auto est le mode de démarrage des sessions interactives en terminal et dans VS Code sur tous les forfaits ; un defaultMode que vous avez défini reste en place, et les modes par défaut gérés par l'organisation ne sont pas touchés.", "Le mode auto filtre chaque action avec un classifieur de sécurité au lieu de vous solliciter — c'est l'outil contre la lassitude des confirmations, pas bypassPermissions.", "Construisez une allowlist : allow pour ce qui est sûr et répétitif, ask pour le risque moyen, deny pour le destructeur.", "Les règles partagées vont dans settings.json ; les surcharges personnelles dans settings.local.json."]} />

<Quiz title="Testez-vous" questions={[{q: "Que fait le verdict par défaut 'ask' pour une action qui n'est ni explicitement autorisée ni refusée ?", options: ["Elle s'exécute silencieusement", "Il fait une pause et vous demande de confirmer", "Elle est bloquée définitivement"], answer: 1, explain: "ask est le comportement par défaut pour tout ce qui n'est pas explicitement autorisé ou refusé — il fait une pause et vous demande."}, {q: "Quel mode de permission n'est sûr QUE dans des bacs à sable ou des conteneurs, jamais sur une machine contenant des secrets ?", options: ["plan", "acceptEdits", "bypassPermissions"], answer: 2, explain: "bypassPermissions supprime entièrement les confirmations et les contrôles de sécurité ; réservez-le aux environnements jetables — jamais sur une machine contenant des secrets."}, {q: "Vous voulez beaucoup moins de confirmations sur une longue tâche, tout en gardant un filet de sécurité. Quel mode ?", options: ["bypassPermissions — il saute toutes les confirmations", "auto — un classifieur filtre chaque action et bloque les actions risquées", "dontAsk — il ne vous interrompt jamais"], answer: 1, explain: "Le mode auto remplace les confirmations par un classifieur qui bloque les escalades comme curl | bash, les force push et les déploiements en production. bypassPermissions supprime le filet de sécurité ; dontAsk refuse simplement tout ce qui n'est pas pré-approuvé."}, {q: "Où stocker les règles de permission partagées du projet par rapport aux surcharges personnelles ?", options: ["Les deux dans settings.local.json", "Règles du projet dans settings.json ; surcharges personnelles dans settings.local.json", "Règles du projet dans settings.local.json ; surcharges personnelles dans settings.json"], answer: 1, explain: "Les règles du projet vont dans settings.json (partagé) ; les surcharges personnelles vont dans settings.local.json."}, {q: "Lequel de ces éléments a sa place dans la liste 'deny' d'une allowlist de départ raisonnable ?", options: ["git status / diff", "rm -rf et la lecture de .env", "Lancer vos commandes de test/lint/build"], answer: 1, explain: "Refusez ce qui est destructeur : lire des fichiers secrets (.env, fichiers de clés), force-push et rm -rf."}, {q: "Le 14 août 2026, que se passe-t-il sur un forfait Pro si vous aviez déjà défini permissions.defaultMode sur 'default' dans vos paramètres utilisateur ?", options: ["Il est automatiquement écrasé par 'auto'", "Il reste 'default', sauf si vous acceptez une invite de basculement ponctuelle dans l'application", "Le mode auto est quand même appliqué silencieusement à chaque nouvelle session"], answer: 1, explain: "Un defaultMode que vous avez défini vous-même dans les paramètres utilisateur est préservé ; Claude Code propose une invite de basculement ponctuelle mais n'écrase pas votre choix. Les modes par défaut gérés par l'organisation ne sont pas non plus touchés."}]} />

## Suite

- [settings.json : le système de configuration](/docs/claude-code/settings)
- [Hooks](/docs/claude-code/hooks) — appliquer les règles de façon déterministe, au-delà d'allow/deny
- [Sandbox Credential Masking](/docs/claude-code/sandbox-credential-masking) — laisser `gh`, `npm` et `aws` s'authentifier sans que la commande en bac à sable détienne jamais le vrai secret
- [Sécurité et usage responsable](/docs/security/responsible-use)
