# Exécuter des modèles d'IA en local avec Ollama

> Source: https://derob98.github.io/ailmanac/fr/docs/models/run-models-locally-ollama · AILmanac (CC BY 4.0) · last verified 2026-10-21

Exécutez des modèles open-weight (Llama, Mistral, Qwen…) sur votre propre machine — privé, hors ligne, gratuit à l'usage — avec Ollama. Installation, CLI et appel depuis le code.

<LevelBadge level="intermediate" />

Les modèles de pointe vivent dans le cloud, mais toute une classe de modèles **open-weight** — Llama, Mistral, Qwen, DeepSeek, Gemma — peut être téléchargée et exécutée sur votre propre ordinateur portable ou serveur. [Ollama](https://ollama.com/) est le moyen le plus simple d'y arriver : une installation, une commande, et un modèle tourne en local. Cette page vous mène de zéro à un modèle en marche, vous montre comment l'appeler depuis le code et expose les compromis, pour que vous n'attendiez pas d'un modèle local de 7B qu'il se comporte comme un modèle de pointe.

<Callout type="objectives" items={[
  "Savoir POURQUOI exécuter un modèle en local — et les compromis honnêtes par rapport aux modèles de pointe dans le cloud",
  "Installer Ollama et exécuter votre premier modèle en deux commandes",
  "Utiliser la CLI de base : pull, run, list, ps, rm, stop",
  "Appeler votre modèle local depuis le code via l'API d'Ollama compatible OpenAI",
  "Comprendre les besoins en RAM, les tailles de modèles et la quantification — pour choisir un modèle que votre machine peut réellement exécuter",
  "Savoir quand LM Studio (une interface graphique) est le meilleur point de départ",
]} />

## Pourquoi exécuter un modèle en local (et quand ne pas le faire)

Exécuter un modèle sur votre propre matériel vous apporte quatre choses :

- **Confidentialité** — vos prompts et vos données ne quittent jamais votre machine. C'est la raison pour laquelle les équipes de domaines réglementés ou sensibles se tournent vers les modèles locaux. (Voir l'embranchement confidentialité/auto-hébergement dans [Choisir un modèle](/docs/models/choosing-a-model).)
- **Hors ligne** — pas d'internet, pas d'API, pas de dépendance aux pannes. Le modèle est un fichier sur votre disque.
- **Coût** — pas de facture au token. Une fois téléchargé, l'exécuter est « gratuit » (vous payez en électricité et en matériel, pas en dépenses d'API). Si les [dépenses en tokens](/docs/power-user/token-economy) sont votre contrainte à grande échelle, le local peut l'emporter.
- **Contrôle** — figer une version exacte, personnaliser le comportement et intégrer sans limites de débit ni mauvaises surprises dans les conditions d'utilisation.

Les compromis honnêtes :

- **Écart de capacité.** Un modèle que vous pouvez exécuter sur un portable (1B–14B paramètres) n'est **pas** dans la même catégorie qu'un modèle de pointe dans le cloud pour le raisonnement difficile, le long contexte ou les tâches agentiques. Pour beaucoup de tâches courantes, l'écart est faible ; pour les plus difficiles, il est grand.
- **Matériel.** Les modèles plus gros et plus capables demandent plus de RAM/VRAM que n'en a une machine typique. Vous choisissez souvent le *plus gros modèle que votre matériel peut exécuter*, pas le meilleur qui existe.
- **Vous l'exploitez.** Pas de mise à l'échelle gérée, pas de mises à niveau automatiques — c'est le prix du contrôle.

Un schéma courant et durable : **prototyper et choisir** avec une petite évaluation (même méthode que pour les modèles cloud — voir [Choisir un modèle](/docs/models/choosing-a-model)), utiliser le local pour le travail privé/hors ligne/économique à grande échelle, et recourir à une API de pointe quand la tâche exige vraiment la capacité supplémentaire.

## Installer Ollama et exécuter votre premier modèle

<Steps items={[
  {title: "Installer Ollama", body: "macOS et Windows : téléchargez l'installateur sur ollama.com/download et lancez-le. Linux : utilisez le script d'installation officiel (ci-dessous). Cela installe la commande ollama et un service local en arrière-plan."},
  {title: "Exécuter un modèle", body: "ollama run <model> télécharge le modèle à la première utilisation (cela peut représenter plusieurs Go), puis vous place dans un chat interactif. La première exécution est lente car elle récupère les poids ; les suivantes sont instantanées."},
  {title: "Discuter, puis quitter", body: "Saisissez un prompt et appuyez sur Entrée. Pour quitter la session interactive, tapez /bye (ou appuyez sur Ctrl+D). Le modèle reste en cache sur le disque pour la prochaine fois."},
  {title: "Gérer ce que vous avez téléchargé", body: "Utilisez ollama list pour voir les modèles installés et ollama rm <model> pour en supprimer un et récupérer de l'espace disque."},
]} />

Installation sous Linux (macOS/Windows utilisent plutôt l'installateur téléchargé) :

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

<PromptCard title="Télécharger et exécuter un petit modèle (bon premier choix)">{`ollama run gemma4:e2b`}</PromptCard>

Cette unique commande télécharge `gemma4:e2b` — le modèle par lequel commence le guide de démarrage rapide d'Ollama, une variante Gemma 4 de taille edge d'environ 2,3B paramètres *effectifs* et de quelques Go sur disque — et lance un chat interactif. Pour télécharger sans discuter tout de suite, utilisez plutôt `ollama pull`.

<VerifyNote lastVerified="2026-10-21" source="https://docs.ollama.com/quickstart">
Les **noms de modèles, tailles de paramètres disponibles et tags exacts changent souvent** au fil des nouvelles versions. Les noms utilisés sur cette page — `gemma4:e2b`, `qwen3`, `deepseek-r1`, `gemma3`, `mistral`, `llama3.2` — figuraient dans la bibliothèque d'Ollama à la date de vérification, aux côtés de nouveautés comme `qwen3.5` et des tags plus gros `12b`/`26b`/`31b` de `gemma4`. Considérez tout nom ou toute taille précise comme périssable : consultez la bibliothèque actuelle sur <a href="https://ollama.com/library">ollama.com/library</a> pour les noms de pull et tailles d'aujourd'hui.
</VerifyNote>

## La CLI de base

Une poignée de commandes couvre presque tout. Lancez `ollama --help` pour la liste complète.

```bash
# Download a model without starting a chat
ollama pull qwen3

# Start an interactive chat (downloads first if needed)
ollama run qwen3

# One-shot: pass the prompt inline, get the answer, exit
ollama run qwen3 "Summarize the CAP theorem in two sentences."

# List models you've downloaded
ollama list

# Show models currently loaded in memory
ollama ps

# Stop a running/loaded model (frees memory)
ollama stop qwen3

# Delete a downloaded model to reclaim disk
ollama rm qwen3
```

Dans une session interactive `ollama run`, tapez `/bye` pour quitter et `/?` pour voir les commandes de session. Le service en arrière-plan qui sert réellement les modèles est démarré par `ollama serve` (l'application de bureau le démarre automatiquement pour vous).

## L'appeler depuis le code (API compatible OpenAI)

C'est la partie qui rend les modèles locaux vraiment utiles dans les applications. Le service Ollama en arrière-plan expose une API HTTP locale sur **`http://localhost:11434`**, sur le port par défaut **11434**. Elle possède ses propres points d'accès natifs (`/api/generate`, `/api/chat`) **et** une couche **compatible OpenAI** sur `/v1` — ainsi, la plupart du code écrit pour le SDK OpenAI fonctionne avec votre modèle local en changeant deux lignes.

HTTP brut avec `curl` (point d'accès natif) :

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4:e2b",
  "messages": [
    { "role": "user", "content": "Why is the sky blue?" }
  ],
  "stream": false
}'
```

Depuis Python avec le SDK OpenAI officiel — il suffit de pointer `base_url` vers Ollama et de passer n'importe quelle `api_key` non vide (Ollama exige le champ mais ignore sa valeur) :

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # required by the SDK, ignored by Ollama
)

response = client.chat.completions.create(
    model="gemma4:e2b",
    messages=[
        {"role": "system", "content": "You are a concise assistant."},
        {"role": "user", "content": "Explain gradient descent in two sentences."},
    ],
)

print(response.choices[0].message.content)
```

Comme elle est compatible OpenAI, les mêmes schémas que vous utiliseriez avec une API hébergée s'appliquent — y compris le streaming et l'[utilisation d'outils / function calling](/docs/api/tool-use), qui fonctionnent en local comme dans le cloud (à condition que le modèle soit réellement bon pour cela). La couche `/v1` d'Ollama couvre `/v1/chat/completions`, `/v1/completions`, `/v1/responses`, `/v1/models` (et `/v1/models/{model}`) ainsi que `/v1/embeddings`.

## Matériel, tailles de modèles et quantification

Le nombre que vous voyez associé à un modèle — **1B, 7B, 8B, 70B** — est son **nombre de paramètres** (en milliards). Plus de paramètres signifie généralement plus capable *et* plus gourmand en mémoire. La limite pratique de ce que vous pouvez exécuter, c'est la **RAM** (et, sur un GPU, la **VRAM**).

La **quantification** est l'astuce clé qui rend cela réalisable sur des machines ordinaires. Les poids du modèle sont à l'origine stockés en haute précision (p. ex. 16 bits), mais ils peuvent être compressés à ~4 bits pour un faible coût en qualité, souvent à peine perceptible. Ollama livre la plupart des modèles quantifiés par défaut — c'est pourquoi un modèle de plusieurs milliards de paramètres peut tenir en quelques Go. Une règle empirique approximative (à vérifier sur la page du modèle concerné) :

- Modèles **~1B–3B** : tournent confortablement sur la plupart des portables récents (quelques Go de RAM).
- Modèles **~7B–8B** : le juste milieu entre capable et exécutable ; prévoyez plusieurs Go de RAM libre.
- Modèles **~13B–14B** : demandent une machine plutôt bien équipée.
- Modèles **~70B+** : demandent une station de travail/un serveur avec beaucoup de RAM ou un GPU puissant — pas le terrain d'un portable typique.

Une recette pratique : commencez par un petit modèle (`gemma4:e2b`), validez le flux de bout en bout, puis montez en taille jusqu'au plus gros modèle qui tourne encore confortablement sur votre matériel — pas le plus gros qui existe.

<Flashcards title="Vocabulaire des modèles locaux" cards={[
  {front: "Poids (weights)", back: "Les nombres appris (paramètres) qui SONT le modèle. Exécuter un modèle en local, c'est charger son fichier de poids en mémoire et calculer avec."},
  {front: "Modèle open-weight", back: "Un modèle dont vous pouvez télécharger les poids et que vous pouvez exécuter vous-même (Llama, Mistral, Qwen, DeepSeek, Gemma) — le prérequis pour pouvoir l'exécuter en local."},
  {front: "Paramètres (p. ex. 7B)", back: "Le nombre de poids, en milliards. Plus il est élevé = généralement plus capable et plus gourmand en mémoire. Le principal levier pour savoir si votre machine peut l'exécuter."},
  {front: "Quantification", back: "Compresser les poids à une précision inférieure (p. ex. 16 bits → 4 bits) pour que le modèle tienne dans beaucoup moins de RAM, avec un faible coût en qualité. C'est pourquoi des modèles de plusieurs milliards de paramètres tiennent en quelques Go."},
  {front: "Fenêtre de contexte", back: "Le nombre de tokens (prompt + sortie) que le modèle peut considérer à la fois. Les modèles locaux ont souvent un contexte utilisable plus petit que les modèles de pointe, et un contexte plus grand coûte plus de mémoire."},
  {front: "Tag de quantification (p. ex. q4)", back: "Une étiquette sur une variante de modèle indiquant son compromis précision/taille — moins de bits = plus petit et plus rapide, plus de bits = plus proche de la qualité complète."},
]} />

## LM Studio : une alternative graphique

Si la ligne de commande n'est pas votre truc, **[LM Studio](https://lmstudio.ai/)** est une application de bureau (macOS, Windows, Linux) qui fait le même travail via une interface graphique : parcourir et télécharger des modèles ouverts, discuter avec eux dans une interface intégrée et — comme Ollama — lancer un **serveur local compatible OpenAI** pour que votre code puisse lui parler. C'est la porte d'entrée la plus facile pour les non-développeurs ou ceux qui préfèrent le pointer-cliquer au terminal ; Ollama l'emporte plutôt quand vous voulez une CLI scriptable et un service léger en arrière-plan. Les deux exécutent les mêmes types de modèles open-weight, donc les concepts de cette page se transposent directement.

<Quiz title="Testez-vous" questions={[
  {q: "Quel est le plus grand compromis honnête de l'exécution d'un modèle en local par rapport à un modèle de pointe dans le cloud ?", options: ["Les modèles locaux ne peuvent pas être appelés depuis le code", "Un modèle local de taille portable est moins capable sur les tâches difficiles", "Les modèles locaux coûtent plus cher par token"], answer: 1, explain: "L'écart de capacité est le vrai compromis : les modèles assez petits pour tourner en local sont à la traîne des modèles de pointe dans le cloud sur les tâches de raisonnement/agentiques les plus difficiles. L'accès depuis le code et le coût par token sont en réalité des avantages du local."},
  {q: "Quelle commande télécharge un modèle (si nécessaire) ET commence à discuter avec ?", options: ["ollama pull gemma4:e2b", "ollama serve gemma4:e2b", "ollama run gemma4:e2b"], answer: 2, explain: "ollama run télécharge à la première utilisation, puis ouvre une session interactive. ollama pull ne fait que télécharger ; ollama serve démarre le service en arrière-plan."},
  {q: "Pour appeler votre modèle local depuis du code utilisant le SDK OpenAI, que définissez-vous ?", options: ["Une vraie clé d'API OpenAI payante", "base_url sur http://localhost:11434/v1 et n'importe quelle api_key non vide", "Rien — cela fonctionne automatiquement avec api.openai.com"], answer: 1, explain: "Pointez base_url vers le point d'accès local /v1 d'Ollama et passez n'importe quelle api_key non vide (Ollama exige le champ mais ignore sa valeur)."},
  {q: "Pourquoi un modèle de plusieurs milliards de paramètres peut-il tenir dans quelques Go de RAM seulement ?", options: ["Les paramètres sont diffusés depuis le cloud", "La quantification compresse les poids à une précision inférieure", "Ollama ne charge qu'une partie du modèle"], answer: 1, explain: "La quantification stocke les poids à une précision inférieure (p. ex. 4 bits au lieu de 16), réduisant l'empreinte mémoire avec un faible coût en qualité."},
]} />

<Callout type="takeaways" items={[
  "Local = confidentialité + hors ligne + pas de coût par token + contrôle ; le compromis est un réel écart de capacité et des limites matérielles.",
  "Deux commandes suffisent : installer Ollama, puis ollama run gemma4:e2b.",
  "CLI de base : pull (télécharger), run (discuter), list, ps, stop, rm — c'est l'essentiel.",
  "L'appeler depuis le code via le point d'accès compatible OpenAI : base_url http://localhost:11434/v1, n'importe quelle api_key non vide.",
  "Le nombre de paramètres + la quantification décident si votre machine peut exécuter un modèle — commencez petit, puis montez à ce qui tourne confortablement.",
  "Vous préférez une interface graphique ? LM Studio fait le même travail en pointer-cliquer et expose aussi un serveur local compatible OpenAI.",
]} />

## Sources et pour aller plus loin

- [Ollama](https://ollama.com/) — site officiel et téléchargements.
- [Bibliothèque de modèles Ollama](https://ollama.com/library) — modèles actuels et leurs noms/tailles de pull exacts.
- [Référence de la CLI Ollama](https://docs.ollama.com/cli) · [Documentation de l'API Ollama](https://docs.ollama.com/api) — référence faisant autorité pour les commandes et points d'accès.
- [Billet de blog d'Ollama sur la compatibilité OpenAI](https://ollama.com/blog/openai-compatibility) — le point d'accès `/v1` et l'usage des SDK.
- [Ollama sur GitHub](https://github.com/ollama/ollama) — code source, issues et documentation détaillée.
- [LM Studio](https://lmstudio.ai/) — alternative graphique pour exécuter des modèles locaux.

## Suite

- Avant de donner l'accès aux outils à un modèle téléchargé → [Poids ouverts piégés : la chaîne d'approvisionnement des modèles « abliterated »](/docs/security/backdoored-open-weights) — le GGUF que vous téléchargez est généralement le 3e maillon d'une chaîne de confiance à trois parties
- Vous déplacez un gros prompt système de Claude vers un modèle local ? → [Pourquoi un prompt système de 35 Ko casse sur un modèle local](/docs/models/large-system-prompts-on-local-models)
- Jusqu'où la quantification peut-elle descendre sous les 4 bits ? → [La quantification ternaire en pratique : Bonsai 2 27B en 5,95 Go](/docs/models/ternary-quantization-bonsai-2-27b) — 1,75 bit par poids, et pourquoi Ollama ne peut pas le charger
- Décider local ou cloud pour une tâche → [Choisir un modèle](/docs/models/choosing-a-model)
- Faire fonctionner les outils en local aussi → [Utilisation d'outils](/docs/api/tool-use)
- Surveiller ce que coûte réellement l'exécution des modèles → [Économie des tokens](/docs/power-user/token-economy)
