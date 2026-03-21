---
slug: bachero
Post_ReleaseDate: 2026-03-11
Post_Date: 2022 - 2024
Post_Author: Johan
---
Bachero était un bot Discord qui avait pour but de proposer une alternative puissante aux autres robots disponibles sur la plateforme. Son principal atout était la possibilité de l’héberger soi-même pour sa propre communauté, avec une personnalisation maximale.

Lorsque j’ai pensé à créer ce projet, il n’existait quasiment aucune solution équivalente, et encore moins gratuite et open source. Bachero est alors né pour « révolutionner » ça. Enfin, il aurait dû...

# Objectif initial ^initialgoal

Pendant l’été 2022, lorsque j’étais encore au collège, je commençais à développer de vrais projets *légèrement* intéressants. J’avais déjà par le passé développé de nombreux bots Discord, mais l’API avait évolué et les possibilités s’étaient multipliées. J’ai donc décidé de laisser tomber mes anciennes réalisations pour me lancer dans cette nouvelle aventure, et tout a commencé avec une dernière commande.

![[bachero_finac.png|555]]

Sous un certain angle, Bachero était un simple bot vide, avec des APIs internes et quelques utilitaires pouvant être utilisés par des « [modules](https://bachero.johanstick.fr/docs/preinstalled) » pour rajouter des fonctionnalités. Ce choix permettait de faciliter le développement tout en ayant une base de code propre, et de permettre à quiconque qui héberge le bot de rajouter les siennes sans grandes difficultés, et même de les partager à la communauté.

Parmi les fonctionnalités et APIs implémentées *dans* le bot figuraient une [base de données](https://bachero.johanstick.fr/docs/database) (locale ou dans le cloud via MongoDB), une configuration [interne au bot](https://bachero.johanstick.fr/docs/configuration/botconfig) et à [chaque module](https://bachero.johanstick.fr/docs/configuration/module), la création et la réception de [rapports d’erreurs](https://bachero.johanstick.fr/docs/modules/ref#reportcreatecontext-error-moreinfos-interaction), la traduction automatique des commandes slash en [commandes textuelles](https://bachero.johanstick.fr/docs/slashtotext), des méthodes pour gérer les [cooldowns](https://bachero.johanstick.fr/docs/modules/guide#aller-plus-loin--cooldown) et un système de [logging](https://bachero.johanstick.fr/docs/modules/ref#showlogtype-content-id-showinconsole-hidedetails) avancé.
Évidemment, des modules étaient [préinstallés](https://bachero.johanstick.fr/docs/preinstalled) par défaut pour fournir une expérience simple dès la première utilisation.

# Pourquoi ça n’a pas marché ^why

Un total de 32 modules avaient été développés au fil des 13 versions bêta, et cela ne devait s’agir que du début : de nombreuses fonctionnalités prévues et même annoncées n’auront jamais pu voir le jour, comme l’économie ou le classement des membres les plus actifs d’un serveur.

![[bachero_modulestodo.png|882]]

En réalité, et sans le savoir, Bachero n’allait clairement pas être ma priorité. Au fil de ces mois *(plutôt années)* passés à le développer, mon niveau s’est amélioré et j’ai réalisé que le développement de bots pour cette plateforme était tout sauf ce que j’aimais. J’ai alloué de moins en moins de temps et d’efforts à celui-ci, et il est rapidement tombé dans l’oubli pour moi, et pour les autres. *Et, honnêtement, j’ai bien fait. Étant donné que Discord prend de plus en plus de mauvaises décisions, que ce n’est plus aussi fun qu’avant, et que je ne vois plus d’intérêt dans le fait d’interagir sur des serveurs en tant que tels.*

# Ce qu’il va devenir ^now

L’instance principale qui était hébergée par moi-même pour permettre à tout le monde de tester le robot est éteinte. Les dépôts GitHub sont archivés et la documentation ne sera plus mise à jour *(et sûrement supprimée un jour ou l’autre)*. Le [serveur Discord](https://discord.gg/SWkh4mk) reste ouvert mais sera évidemment inactif.

À plus tard 🔥🔥
