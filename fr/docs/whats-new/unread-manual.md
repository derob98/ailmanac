# Claude n'a jamais vu 68 % de la documentation de Claude Code

> Source: https://derob98.github.io/ailmanac/fr/docs/whats-new/unread-manual · AILmanac (CC BY 4.0) · last verified 2026-10-15

Nous avons rejoué 15 mois de la documentation officielle de Claude Code, semaine par semaine. 68 % de ce qu'elle dit aujourd'hui a été écrit après juin 2026, la date limite d'entraînement de tous les modèles Claude actuels. Voici ce que chaque modèle a manqué, et un plugin qui le lui dit.

import {UnreadHeadline, ModelBars, LearnedSlider, CohortChart, SurvivalChart, NewIdentifiers} from '@site/src/components/DocsDecay';

<VerifyNote lastVerified="2026-10-15" source="https://platform.claude.com/docs/en/about-claude/models/overview">
Les dates limites d'entraînement proviennent de la page de chaque modèle dans la documentation de la Claude Platform. L'historique de la documentation de Claude Code provient d'un miroir communautaire qui copie les pages officielles plusieurs fois par jour. Les chiffres sont un instantané au 15 octobre 2026 ; le script qui les produit est lié ci-dessous, donc n'importe qui peut le relancer.
</VerifyNote>

Chaque modèle Claude a appris Claude Code à partir de la documentation telle qu'elle était à sa date limite d'entraînement. Ensuite, la documentation a continué d'évoluer. Nous avons rejoué son historique, semaine par semaine, pour mesurer l'écart creusé entre les deux.

<UnreadHeadline />

Les modèles les plus récents, Fable 5.1, Opus 5.5, Sonnet 5.5 et Haiku 5.5, ont une date limite de connaissances fiable en juin 2026. Entre fin juin et le 15 octobre, la documentation est passée de 107 à 164 pages, et l'essentiel de ce qu'elle dit aujourd'hui a été écrit pendant ces trois mois et demi. En comptant plus strictement, au mot près plutôt que par faits, la part monte à 72 %. Sans les exemples de code, elle est de 70 %. Quelle que soit la façon de compter, Claude n'a jamais vu la plus grande partie de son propre manuel.

## Ce que chaque modèle n'a jamais vu

Plus la date limite est ancienne, moins le modèle a pu lire de la documentation d'aujourd'hui. Tous ces modèles restent disponibles via la Claude API.

<ModelBars />

Claude Haiku 4.5, dont la date limite est février 2025, précède presque tout : Claude Code est sorti en aperçu de recherche ce mois-là, et la quasi-totalité de la documentation actuelle est venue après.

## Choisissez la semaine où vous avez appris Claude Code

Le même calcul s'applique aux personnes. Déplacez le curseur sur la semaine où vous avez lu la documentation, ou sur la date du tutoriel que vous suivez.

<LearnedSlider />

## La documentation est refaite, pas seulement agrandie

La croissance explique l'essentiel de l'écart, mais pas tout. Les pages sont aussi réécrites. Chaque bande ci-dessous représente le texte écrit pendant un trimestre ; une bande s'amincit à mesure que ses phrases sont supprimées ou modifiées.

<CohortChart />

En juillet 2025, la documentation comptait 29 pages. Aujourd'hui, elle en compte 164, avec 21 fois plus de phrases et de lignes de code. De la documentation telle qu'elle était en juillet 2025, 30,5 % tient toujours ; le reste a été supprimé, ou réécrit avec un nombre, un flag ou un nom différent. Même la documentation de juin 2026, celle que les modèles les plus récents ont vue, a perdu 26,9 % de ses faits en moins de quatre mois.

## Combien de temps dure une phrase

Suivez chaque phrase depuis la semaine où elle apparaît jusqu'à celle où elle disparaît, et la moitié a disparu ou été reformulée en 196 jours. Si une reformulation ne compte que lorsqu'elle change un nombre, un flag, un chemin ou un nom, la moitié des faits a disparu en 266 jours : environ neuf mois.

<SurvivalChart />

## Ce que votre modèle n'a jamais entendu

Ce sont les identifiants présents aujourd'hui dans les tableaux de référence et qui n'existaient pas à la date limite d'un modèle : flags de la CLI, commandes slash, événements de hook et variables d'environnement. Interrogez Claude sur l'un d'eux et il ne peut que deviner.

<NewIdentifiers />

« Documenté depuis » ne veut pas dire « livré depuis » : quelques-uns existaient plus tôt et ne sont arrivés dans la documentation que plus tard. Dans les deux cas, le modèle n'avait aucune page pour les apprendre.

## Donnez la liste à Claude

Le [plugin since-cutoff](https://github.com/derob98/ailmanac/tree/main/plugins/since-cutoff) place ces listes devant Claude. Au démarrage d'une session, un hook lit quel modèle tourne et ajoute à son contexte une courte note : les flags, commandes et événements de hook documentés après la date limite de ce modèle, et une consigne de vérifier la documentation avant de se fier à sa mémoire ou de dire qu'une fonctionnalité n'existe pas.

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install since-cutoff@ailmanac
```

Le hook tient en quelques lignes de shell POSIX : pas de Node, pas de réseau, environ 400 à 750 tokens par session. Quand Claude Code ne transmet pas le modèle au hook, comme dans notre test headless `-p`, la note liste ce qui a changé depuis juin 2026, ce qui est vrai pour tous les modèles Claude. Dans ce test, la session a reçu la note et Claude l'a citée mot pour mot.

## Que faire de tout cela

- **Ne vous fiez pas à la mémoire de Claude sur Claude Code.** Pour les flags, les paramètres, les hooks et les commandes, faites-lui lire la page. Claude Code fournit un agent guide pour les questions sur lui-même, et la documentation publie un index sur [code.claude.com/docs/llms.txt](https://code.claude.com/docs/llms.txt).
- **Datez vos tutoriels.** Un guide vieux de six mois a perdu plus d'un tiers de ses faits. Vérifiez tout ce qui est plus ancien dans la documentation avant d'en copier des commandes.
- **Préférez les pages qui indiquent quand elles ont été vérifiées.** Chaque page de ce site porte la date de sa dernière vérification ; le [tableau de bord de fraîcheur](/docs/whats-new/freshness) les liste toutes, et [Deprecation & Migration Watch](/docs/whats-new/deprecations) suit ce qui a été retiré.

## Comment nous l'avons mesuré

- **Historique.** [web3dev1337/claude-code-docs](https://github.com/web3dev1337/claude-code-docs) est un fork d'un miroir de documentation bien connu qui a conservé tout l'historique de synchronisation : 3 604 synchronisations entre juillet 2025 et octobre 2026. Nous avons pris la dernière synchronisation de chaque semaine, soit 67 instantanés au total.
- **Périmètre.** Toutes les pages de Claude Code sauf le changelog et les digests hebdomadaires, qui consignent l'historique par conception, et les pages de l'Agent SDK, arrivées en 2026 depuis un autre site de documentation et qui compteraient sinon comme nouvelles.
- **Unités.** Chaque page est découpée en phrases, lignes de tableau et lignes de code, liens et balisage retirés. Une ligne qui apparaît sur cinq pages ou plus à la fois, comme une bannière ou une ligne de code générique, est écartée. Il est resté 90 674 unités distinctes à suivre.
- **Disparitions.** Une unité est considérée comme disparue dès qu'elle manque à deux instantanés hebdomadaires consécutifs, ou au dernier, de sorte qu'une page qui a échoué une synchronisation ne compte pas.
- **Faits.** Une nouvelle phrase qui en remplace une supprimée la même semaine est traitée comme le même fait lorsqu'au moins 60 % de leurs mots coïncident et que chaque nombre, flag, chemin et identifiant est identique. 7 965 reformulations ont été reliées ainsi.
- **Dates limites.** Chaque modèle est comparé au dernier instantané hebdomadaire situé au plus tard le dernier jour du mois de sa date limite, la lecture la plus généreuse. Les dates limites antérieures à juillet 2025 utilisent le premier instantané, qui contient déjà plus que ce que ces modèles pouvaient avoir vu : leurs parts sont des bornes inférieures.
- **Survie.** Estimations de Kaplan–Meier sur toutes les unités nées après le premier instantané, les unités encore présentes aujourd'hui étant comptées comme censurées.

Le miroir n'est pas officiel : s'il a manqué ou déformé une page, les chiffres en héritent. Nous avons vérifié les semaines des dates limites à la recherche de pages disparues le temps d'une synchronisation et n'en avons trouvé aucune. L'analyse compare du texte, pas le comportement du produit.

## Reproduisez-le

Le script et sa sortie se trouvent dans le dépôt de ce site : [scripts/research/docs-decay.mjs](https://github.com/derob98/ailmanac/blob/main/scripts/research/docs-decay.mjs) et [data/research/claude-code-docs-decay.json](https://github.com/derob98/ailmanac/blob/main/data/research/claude-code-docs-decay.json). Il nécessite Node et git, et s'exécute en une quinzaine de secondes :

```bash
git clone https://github.com/web3dev1337/claude-code-docs
git clone https://github.com/derob98/ailmanac
node ailmanac/scripts/research/docs-decay.mjs claude-code-docs
```
