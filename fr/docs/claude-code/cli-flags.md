# La CLI claude : les flags qui changent le résultat

> Source: https://derob98.github.io/ailmanac/fr/docs/claude-code/cli-flags · AILmanac (CC BY 4.0) · last verified 2026-10-07

Une visite assumée de la ligne de commande de Claude Code — le contrat à cinq flags pour les exécutions sans surveillance, le piège du prompt système enregistré, et les différences entre --bare, --safe-mode et --restricted.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-10-07" source="https://code.claude.com/docs/en/cli-reference">
Chaque commande, flag, valeur par défaut et version minimale ci-dessous provient de la [référence CLI](https://code.claude.com/docs/en/cli-reference) officielle, consultée le 2026-10-07. Les flags apparaissent et changent d'une version à l'autre, et la référence précise que `claude --help` **ne liste pas tous les flags** — un flag absent de `--help` n'est donc pas forcément absent de votre build. Fiez-vous à la référence, pas au texte d'aide, et vérifiez votre version avec `claude -v`.
</VerifyNote>

La plupart des gens apprennent trois choses sur la ligne de commande de Claude Code — `claude`, `claude -c` et `claude -p` — et s'arrêtent là. C'est un bon endroit pour s'arrêter si vous l'utilisez toujours assis devant. Dès que vous placez Claude Code dans un script, un job de CI, une file d'attente en arrière-plan ou entre les mains d'un collègue, les flags cessent d'être des commodités et font la différence entre une exécution qui coûte un dollar et une qui reste bloquée une heure.

Cette page n'est pas une seconde copie du tableau de référence. C'est **l'ordre dans lequel apprendre la surface**, les flags qui changent vraiment ce qui se passe, et les quatre pièges qui coûtent du temps réel.

<Callout type="objectives" items={["Les six types de session que vous pouvez démarrer, et quel flag choisit chacun","Le contrat à cinq flags qui rend une exécution sans surveillance bornée, avec réponse possible et analysable","Pourquoi modifier --append-system-prompt puis relancer --continue semble ne rien faire — la règle du prompt enregistré","En quoi --bare, --safe-mode et --restricted diffèrent, et lequel choisir selon le cas","Piloter des sessions en arrière-plan depuis le shell : agents, attach, logs, respawn, rm, daemon","Les paires de flags que l'on confond : --tools vs --allowedTools vs --disallowedTools"]} />

## Commencez par la question : de quel type de session s'agit-il ?

Toutes les autres décisions en découlent. Claude Code peut démarrer six choses sensiblement différentes, et le flag qui en choisit une est généralement la première chose que vous tapez.

| Vous voulez | Flag | Cela vous donne |
| --- | --- | --- |
| Une conversation que vous suivez | *(aucun)* | Une session interactive dans ce terminal |
| Une réponse, puis la sortie | `-p` / `--print` | Une exécution non interactive, sortie sur stdout |
| Un travail qui survit à ce terminal | `--bg` / `--background` | Une session en arrière-plan ; elle affiche son ID et comment la gérer |
| Une branche isolée pour expérimenter | `-w` / `--worktree` | Un worktree git sous `<repo>/.claude/worktrees/<name>` |
| Un travail sur les machines d'Anthropic | `--cloud` | Une session cloud, ou un suivi mis en file dans une session existante |
| Piloter cette session depuis votre téléphone | `--rc` / `--remote-control` | Une session interactive également contrôlable depuis claude.ai ou l'app Claude |

Deux d'entre elles sont incompatibles : `--bg` et `-p` s'excluent mutuellement, car l'une rend la main immédiatement et l'autre attend une réponse. Si vous voulez lancer en arrière-plan une commande shell plutôt qu'une session Claude, associez `--bg` à `--exec` :

<PromptCard title="Lancer la suite de tests comme un job en arrière-plan, pas comme une session Claude">
{`claude --bg --exec 'pytest -x'`}
</PromptCard>

Et `--bg` vérifie la confiance accordée à l'espace de travail pour le répertoire avant de démarrer — une session en arrière-plan dans un dépôt non approuvé échoue donc dès le départ plutôt qu'à mi-chemin.

## Le contrat à cinq flags pour les exécutions sans surveillance

C'est la chose la plus utile de cette page. Une exécution `claude -p` sans surveillance peut mal tourner de trois façons qu'une session interactive ne connaît tout simplement pas : elle peut **se bloquer** sur des demandes de permission auxquelles personne n'est là pour répondre, elle peut **boucler** bien plus longtemps que prévu, et elle peut **émettre de la prose** alors que votre script attendait des données. Cinq flags referment ces trois risques.

<Steps items={[
  {title: "Exécuter en mode non interactif — -p", body: "`claude -p \"query\"` affiche la réponse puis quitte. Tout ce qui suit ne vaut qu'en mode print ; ce flag est donc la porte d'entrée de tout le reste."},
  {title: "Décider qui répond aux demandes de permission — --permission-prompts", body: "La valeur par défaut est `host` : les demandes sont envoyées à l'hôte de l'Agent SDK ou à un `--permission-prompt-tool`. Passez `--permission-prompts none` quand personne ne peut répondre, comme dans un cron job ou une étape de CI : l'exécution cesse de consulter un hôte ou de l'attendre, tout ce qui déclencherait une demande est refusé sauf si un hook `PermissionRequest` l'autorise, et Claude reçoit la consigne de ne pas réessayer. Une exécution `-p` sans aucun hôte refuse déjà ces demandes ; dans ce cas, le flag sert surtout à empêcher les nouvelles tentatives. Nécessite la v2.1.259 ou ultérieure. Associez-le à des règles `--allowedTools` étroites pour que les refus restent rares plutôt que constants."},
  {title: "Borner la boucle — --max-turns", body: "Il n'y a pas de limite de tours par défaut. `--max-turns 3` se termine avec une erreur quand la limite est atteinte. Utilisez-le comme fil piège contre les boucles agentiques qui s'emballent, pas comme un budget."},
  {title: "Borner la dépense — --max-budget-usd", body: "`--max-budget-usd 5.00` s'arrête dès que l'estimation de coût côté client atteint le plafond. La dépense des sous-agents y compte ; une fois atteint, le lancement d'un autre sous-agent échoue avec `Budget limit reached` et les sous-agents en arrière-plan en cours sont arrêtés. L'application du plafond nécessite la v2.1.217 ou ultérieure."},
  {title: "Rendre la sortie analysable — --output-format ou --json-schema", body: "`--output-format json` vous donne une enveloppe structurée. `--json-schema '<schema>'` va plus loin : Claude Code valide la réponse finale par rapport à votre schéma JSON et signale d'emblée une erreur si le schéma est invalide, de sorte que votre script n'a jamais à analyser de la prose avec des regex."}
]} />

<PromptCard title="Une étape de CI qui ne peut ni se bloquer, ni boucler à l'infini, ni trop dépenser">
{`claude -p "Review the staged diff and list bugs" \\
  --permission-prompts none \\
  --allowedTools "Read" "Bash(git diff *)" \\
  --max-turns 6 \\
  --max-budget-usd 2.00 \\
  --output-format json`}
</PromptCard>

<Callout type="warning" title="--max-budget-usd est une estimation, pas votre facture" items={["Claude Code compare le plafond à sa propre estimation de coût côté client, qui peut différer de ce qui vous est facturé.","Quand vous reprenez une conversation avec --continue ou --resume, les totaux restaurés des exécutions précédentes ne comptent pas dans le plafond — trois exécutions reprises sous un plafond de 2 $ peuvent donc dépenser plus de 2 $ au total.","Voyez-le comme un disjoncteur pour une exécution. Pour un vrai plafond sur un compte ou un projet entier, voir Hard Spend Caps."]} />

Pour toute la posture à adopter quand on laisse une exécution se dérouler sans humain — quoi autoriser, quoi masquer, quoi journaliser — voir [Durcir les exécutions autonomes](/docs/security/hardening-autonomous-runs) et [Mode headless et Agent SDK](/docs/claude-code/headless-and-agent-sdk). Pour les plafonds au niveau du fournisseur, [Hard Spend Caps](/docs/models/hard-spend-caps).

## La famille du prompt système, et le piège qu'elle contient

Cinq flags façonnent le prompt système. Quatre en fixent le texte ; le cinquième décide si la conversation conserve le texte avec lequel elle a démarré.

| Flag | Ce qu'il fait |
| --- | --- |
| `--system-prompt` | Remplace tout le prompt par défaut par votre texte |
| `--system-prompt-file` | Le remplace par le contenu d'un fichier |
| `--append-system-prompt` | Ajoute votre texte au prompt par défaut |
| `--append-system-prompt-file` | Ajoute le contenu d'un fichier au prompt par défaut |
| `--system-prompt-snapshot` | `off` reconstruit le prompt à chaque requête ; `on` (la valeur par défaut) réutilise celui qui a été enregistré |

Choisir entre *ajouter* et *remplacer* revient à choisir une identité. Ajouter conserve les consignes d'outils, les instructions de sécurité et les conventions de code par défaut de Claude Code, et superpose vos règles — idéal pour des instructions propres à une exécution, un format de sortie ou un contexte de projet. Remplacer abandonne **tout cela**, y compris les consignes d'outils, ce qui ne se justifie que lorsque la surface n'est vraiment pas un assistant de code : un agent non-code dans un pipeline que personne ne surveille. Si vous remplacez, vous êtes responsable de tout ce dont la tâche a encore besoin.

Vous pouvez les combiner. Passer un flag d'ajout avec un flag de remplacement remplace la valeur par défaut puis ajoute votre texte. Depuis la v2.1.283, vous pouvez aussi passer un flag avec sa propre forme fichier — `--append-system-prompt` *et* `--append-system-prompt-file` — et Claude Code utilise les deux, le contenu du fichier venant en premier quel que soit l'ordre tapé.

<Callout type="warning" title="Le piège : une conversation reprise réutilise le prompt avec lequel elle est née" items={["Claude Code construit le prompt système une fois, à la première requête d'une conversation, et l'enregistre dans la session.","Tant que la conversation n'est pas compactée, chaque requête suivante utilise ce prompt enregistré — y compris après --resume ou --continue.","Vous modifiez donc votre texte --append-system-prompt, relancez claude --continue, et rien ne change. Le flag n'est pas cassé ; la conversation utilise encore l'enregistrement.","Le nouveau texte prend effet une fois la conversation compactée, ou dans une toute nouvelle conversation.","Pour itérer sur la formulation d'une exécution --continue à l'autre, passez --system-prompt-snapshot off et le prompt est reconstruit à chaque requête. Nécessite la v2.1.257 ou ultérieure."]} />

Il reste une astuce utile dans un prompt de remplacement qui mêle instructions stables et contexte propre à chaque exécution. Placez entre les deux une ligne contenant uniquement `__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__` : Claude Code coupe à la première ligne de ce type et la supprime, de sorte que la partie du dessus reste en cache pendant que celle du dessous change. Nécessite la v2.1.275 ou ultérieure. Pourquoi cela compte pour votre facture, c'est le sujet de [Prompt Caching](/docs/api/prompt-caching).

Et pour les charges de travail scriptées multi-utilisateurs, `--exclude-dynamic-system-prompt-sections` déplace le contexte propre à l'utilisateur, comme l'emplacement de la mémoire automatique, du prompt système vers le premier message utilisateur — la même tâche sur des machines différentes partage ainsi un seul préfixe en cache. Il ne s'applique qu'au prompt par défaut et est ignoré quand vous définissez `--system-prompt` ou `--system-prompt-file`.

## Trois flags qui désactivent des choses, et ce n'est pas la même chose

On les prend volontiers l'un pour l'autre, puis on s'étonne que le symptôme ne bouge pas. Ils résolvent trois problèmes différents.

| | `--bare` | `--safe-mode` | `--restricted` |
| --- | --- | --- | --- |
| Le problème qu'il résout | Le démarrage est trop lent pour un appel scripté | Ma configuration est cassée et je ne sais pas quelle partie | Un harnais d'évaluation ne doit pas toucher cette machine partagée |
| CLAUDE.md, skills, commandes, sous-agents, plugins, MCP, mémoire automatique | Non découverts | Non chargés | Seuls les paramètres gérés et `--settings` sont chargés |
| Outils intégrés | Bash, lecture de fichier, édition de fichier | Fonctionnent normalement | Les outils d'exécution de commandes/code et WebFetch sont **retirés** sauf s'ils sont nommés individuellement dans `--tools` |
| Accès aux fichiers | Normal | Normal | Confiné aux répertoires de travail |
| `bypassPermissions` | Autorisé | Autorisé | **Refusé** |
| Politique gérée | S'applique | S'applique toujours, y compris les hooks de politique et la ligne d'état | S'applique |
| Effet de bord | Définit `CLAUDE_CODE_SIMPLE` | Définit `CLAUDE_CODE_SAFE_MODE` | Refuse de créer des sessions cloud |

Lisez le tableau comme une progression d'intentions : `--bare` vise la **vitesse**, `--safe-mode` le **diagnostic**, `--restricted` le **confinement**. Un détail utile : les skills d'un répertoire que vous passez avec `--add-dir` se chargent quand même sous `--bare`, ce qui permet de conserver exactement une capacité dans une exécution par ailleurs dépouillée.

`--safe-mode` est le premier réflexe quand quelque chose se comporte mal et que vous ne savez pas si c'est Claude Code ou votre propre configuration — y compris quand vous cherchez à savoir si une personnalisation déclenche le repli automatique de modèle. Associez-le à `claude doctor`, qui affiche des diagnostics d'installation et de paramètres en lecture seule sans démarrer de session. (La commande `/doctor` dans la session est autre chose : elle peut aussi appliquer des correctifs.) Plus de débogage par symptôme dans [Dépanner Claude Code](/docs/claude-code/troubleshooting). `--restricted` nécessite la v2.1.248 ou ultérieure.

## Piloter des sessions en arrière-plan depuis le shell

Dès que vous démarrez des sessions avec `--bg`, le terminal devient un plan de contrôle. Tout le cycle de vie a sa commande, et rien n'exige d'ouvrir l'interface interactive.

<Steps items={[
  {title: "Voir ce qui tourne — claude agents", body: "Ouvre la vue des agents pour surveiller et répartir des sessions en arrière-plan en parallèle. Pour les scripts, `--json` affiche les sessions actives sous forme de tableau JSON, et `--json --all` inclut celles qui sont terminées. `--cwd <path>` restreint aux sessions démarrées sous ce répertoire. Ouvrir la vue elle-même demande un terminal interactif ; la forme JSON, non."},
  {title: "Regarder à l'intérieur de l'une d'elles — claude logs", body: "`claude logs <id|name>` affiche la sortie récente d'une session en arrière-plan. Depuis la v2.1.290, vous pouvez passer une partie du nom d'une session en cours au lieu de son ID — `claude logs auth` suffit donc généralement."},
  {title: "En prendre la main — claude attach", body: "`claude attach <id|name>` ramène une session en arrière-plan dans ce terminal. La correspondance par nom partiel nécessite aussi la v2.1.290 ou ultérieure."},
  {title: "La redémarrer — claude respawn", body: "`claude respawn <id>` redémarre une session, en cours ou arrêtée, avec sa conversation intacte. `--all` redémarre toutes les sessions en cours — le bon réflexe après une mise à jour du binaire Claude Code."},
  {title: "Arrêter et nettoyer — claude stop, claude rm", body: "`claude stop <id>` (aussi `claude kill`) arrête une session. `claude rm <id>` la retire de la liste ; la transcription reste sur votre machine et reste accessible via `claude --resume`. Si la suppression est refusée à cause du worktree de la session, le refus affiche le flag exact à passer ensuite — `--discard-unpushed` (v2.1.260+) ou `--force-remove-worktree` (v2.1.268+)."},
  {title: "Quand tout est coincé — claude daemon", body: "Les sessions en arrière-plan sont hébergées par un processus superviseur. `claude daemon status` affiche son état, sa version, le répertoire du socket et le nombre de workers, et se termine avec le code 1 s'il ne tourne pas. `claude daemon logs` suit `~/.claude/daemon.log`. `claude daemon stop --any --keep-workers` redémarre le superviseur en laissant les sessions vivantes pour que le suivant s'y reconnecte."}
]} />

Le pendant depuis l'intérieur d'une session — comment le travail passe en arrière-plan, et ce qui est conservé quand c'est le cas — se trouve dans [Tâches en arrière-plan, /loop et planification](/docs/claude-code/background-tasks).

## Les paires de flags que l'on comprend de travers

<Callout type="warning" title="Six confusions à prévenir" items={["--tools restreint quels outils intégrés existent. --allowedTools dit quels appels sautent la demande de permission. --disallowedTools refuse des appels. Ce sont trois métiers différents, et passer le mauvais est la cause la plus fréquente de « pourquoi me redemande-t-il encore ».","--tools n'affecte pas du tout les outils MCP. Pour les retirer aussi, ajoutez --disallowedTools \"mcp__*\".","Un nom seul dans --disallowedTools retire l'outil du contexte de Claude ; une règle ciblée comme Bash(rm *) laisse l'outil disponible et ne refuse que les appels correspondants.","--dangerously-skip-permissions démarre en bypassPermissions. --allow-dangerously-skip-permissions ajoute seulement ce mode au cycle Shift+Tab, pour que vous puissiez démarrer en plan mode et changer plus tard. Le second est presque toujours ce que vous vouliez vraiment.","--add-dir accorde l'accès aux fichiers, mais Claude Code ne découvre pas la plupart de la configuration .claude/ de ces répertoires. Ajouter un répertoire n'est pas adopter sa configuration.","--desktop ne prend ni prompt ni autres flags à part --verbose et les flags --debug, car l'application Desktop démarre elle-même la session. Nécessite la v2.1.285 ou ultérieure."]} />

Un petit détail de confort : si vous faites une faute de frappe dans une sous-commande, Claude Code suggère la plus proche et quitte sans démarrer de session — `claude udpate` affiche `Did you mean claude update?` au lieu d'ouvrir une conversation que vous ne vouliez pas.

## Vérifiez vos acquis

<Quiz questions={[
  {
    q: "Votre job nocturne exécute `claude -p` dans une application Agent SDK dont le callback `canUseTool` interroge une personne, et la nuit il reste bloqué jusqu'au timeout. Quel flag manque le plus probablement ?",
    options: [
      "--max-turns, car l'agent boucle",
      "--permission-prompts none, car personne n'est là pour répondre à une demande de permission",
      "--output-format json, car l'analyseur bloque",
      "--bare, car le démarrage est lent"
    ],
    answer: 1,
    explain: "En mode print, les demandes de permission vont par défaut à l'hôte — ici votre callback SDK, et l'exécution attend sa réponse. `--permission-prompts none` cesse de consulter l'hôte : tout ce qui déclencherait une demande est refusé sauf si un hook PermissionRequest l'autorise, et Claude reçoit la consigne de ne pas réessayer, si bien que le job se termine. Une exécution `-p` simple sans aucun hôte refuse déjà ces demandes. `--max-turns` borne une boucle, ce qui est un autre symptôme."
  },
  {
    q: "Vous modifiez votre texte --append-system-prompt, relancez `claude --continue`, et le comportement est inchangé. Pourquoi ?",
    options: [
      "Les flags d'ajout ne fonctionnent qu'avec -p",
      "La conversation réutilise le prompt système enregistré à sa première requête jusqu'à ce qu'elle soit compactée",
      "--continue ignore silencieusement tous les flags de prompt système",
      "Le texte est ajouté mais placé après le message de l'utilisateur"
    ],
    answer: 1,
    explain: "Claude Code construit le prompt une fois, à la première requête de la conversation, et l'enregistre. Les requêtes suivantes — y compris après --continue ou --resume — réutilisent l'enregistrement jusqu'à ce que la conversation soit compactée. Passez --system-prompt-snapshot off pour le reconstruire à chaque requête pendant que vous itérez."
  },
  {
    q: "Une personnalisation casse votre session et vous ne savez pas laquelle. Quel flag l'isole tout en laissant vos outils et vos permissions fonctionner normalement ?",
    options: [
      "--bare",
      "--restricted",
      "--safe-mode",
      "--disable-slash-commands"
    ],
    answer: 2,
    explain: "--safe-mode désactive les personnalisations — CLAUDE.md, skills, plugins, hooks, serveurs MCP, commandes, agents, styles de sortie, ligne d'état, mémoire automatique — tandis que l'authentification, le choix du modèle, les outils intégrés et les permissions continuent de fonctionner. --bare sert la vitesse de démarrage et --restricted le confinement sur une machine partagée."
  }
]} />

<Flashcards cards={[
  {front: "--bg vs -p", back: "Mutuellement exclusifs. --bg rend la main immédiatement avec un ID de session ; -p attend et affiche la réponse. Associez --bg à --exec pour mettre en arrière-plan une commande shell plutôt qu'une session Claude."},
  {front: "--max-budget-usd", back: "Plafond du mode print, comparé à l'estimation de coût côté client de Claude Code, pas à votre facture. La dépense des sous-agents compte ; les totaux restaurés par --continue/--resume, non. v2.1.217+."},
  {front: "--system-prompt-snapshot off", back: "Reconstruit le prompt système à chaque requête au lieu de réutiliser celui enregistré à la première requête de la conversation. v2.1.257+."},
  {front: "__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__", back: "Une ligne contenant uniquement ce marqueur coupe un prompt système de remplacement : la partie du dessus reste en cache, celle du dessous change à chaque exécution. v2.1.275+."},
  {front: "--tools vs --allowedTools", back: "--tools décide quels outils intégrés existent. --allowedTools décide quels appels s'exécutent sans demande de permission. Aucun des deux n'affecte les outils MCP."},
  {front: "claude doctor vs /doctor", back: "`claude doctor` affiche des diagnostics d'installation et de paramètres en lecture seule sans démarrer de session. La commande `/doctor` dans la session peut aussi appliquer des correctifs."},
  {front: "claude respawn --all", back: "Redémarre toutes les sessions en arrière-plan en cours avec leurs conversations intactes — le bon réflexe après une mise à jour du binaire Claude Code."},
  {front: "--add-dir", back: "Accorde l'accès en lecture/édition à un autre répertoire. Cela ne fait pas découvrir à Claude Code la plupart de la configuration .claude/ qui s'y trouve."}
]} />

<Callout type="takeaways" items={["Choisissez d'abord le type de session — le flag qui le fait contraint tous les autres flags que vous pouvez passer.","Une exécution sans surveillance a besoin de cinq flags, pas d'un seul : -p, --permission-prompts none, --max-turns, --max-budget-usd et un format de sortie structuré.","Voyez --max-budget-usd comme un disjoncteur pour une exécution, pas comme un plafond de facture. C'est une estimation côté client et les totaux repris lui échappent.","Les conversations enregistrent leur prompt système à la première requête. Si une modification du prompt semble ignorée, c'est pour cela — utilisez --system-prompt-snapshot off pendant que vous itérez.","--bare, c'est la vitesse ; --safe-mode, le diagnostic ; --restricted, le confinement. Choisir le mauvais fait perdre un après-midi.","--help est incomplet par conception. La référence CLI fait foi, et les versions minimales comptent — vérifiez claude -v avant d'accuser un flag."]} />

## Suite

- [Mode headless et Agent SDK](/docs/claude-code/headless-and-agent-sdk) — que construire quand un simple appel `-p` ne suffit plus
- [settings.json : le système de configuration](/docs/claude-code/settings) — le foyer durable des flags que vous retapez sans cesse
- [Dépanner Claude Code](/docs/claude-code/troubleshooting) — débogage par symptôme, en commençant par `--safe-mode`
