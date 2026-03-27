---
name: Portfolio v4
banner: portfolio_v4_mockup.fr.webp
Post_ReleaseDate: 2026-03-27
Post_Date: 2026 - Présent
Post_Theme: Tailwind CSS, Obsidian, Multilingue, Roc
Post_Author: Johan
Link_SourceCode: https://github.com/johan-perso/portfolio
Link_Demo: https://johanstick.fr
---
%%TODO: vérifier comment ça rend sur le site et relire%%
%%TODO: vérifier tout les liens%%
%%TODO: vérifier le rendu des images/des vidéos sur mobile%%
%%TODO: traduire en anglais%%

# Pourquoi une nouvelle « version » ? ^why-v4

La v2 et la v3 avaient été commencé en 2021 et 2023, et elles représentaient mes tout premiers sites relativement complexe (avec frontend et backend) entièrement design et développé par moi même, et ça se voit très bien cinq ans plus tard.

La base de code est difficile à maintenir et si moche que j’ai jamais réellement voulu la rendre publique, il y a même un système de connexion caché (avec un dashboard pour gérer les comptes) qui date d’une lointaine époque où tous mes projets passaient par un même compte (la v3 avait été redéveloppé de zéro mais cette partie là avait simplement été copié collé).

![[portfolio_v2_dashboard_screenshot_discord.png|522]]

Au fil du temps, mes projets ont évolué, mon niveau en design aussi, et le site ne reflétait plus du tout ce que je voulais montrer. Cette nouvelle version est un renouveau avec une base de code reconstruite de zéro, avec des outils modernes que j’utilise ailleurs, un design qui met en avant le travail graphique de mes projets récents, et de nombreux changements internes pour me rendre la tâche plus facile lors des futures modifications.

# Blog intégré ^blog

Un des ajouts les plus importants de cette version, c’est la possibilité pour moi d’écrire des articles pour parler de mes projets de manière plus complète qu’à travers un fichier README lisible sur GitHub, et surtout, d’une façon plus agréable à partager.

Les [articles](https://johanstick.fr/articles/) peuvent être traduits dans plusieurs langues, disposent d’une meilleure présentation (liens de téléchargement mis en avant pour les apps, date et détails clés, table de contenu) et peuvent être écrits même pour des projets qui ne sont pas disponibles sur GitHub.

*Exemple :*
> READ: [[Portfolio/Articles/escive/French]]

# Quelques détails ^details

## Switch Humain / Machine ^human-machine

Le site possède un mode alternatif qu’on peut activer via un petit bouton dans la sidebar sur la page d’accueil, lorsqu’il est activé, toute la mise en page bascule vers un autre format : police d’écriture style code, thème sombre, suppression des éléments décoratifs.

Tous les détails superflus sont retirés pour ne garder que l’essentiel, ce qui offre un résumé express du site. C’est également une référence directe à la fonctionnalité « Ouvrir dans … » qui permet de demander un résumé à une IA.

%%TODO: utiliser screen studio pr faire une vidéo où j’active le switch et on voit la feature en mode machine, on reste qlqs secondes (5-6?) sur le mode machine, et on garde l’audio du site%%

## Compatibilité avec les IA ^ai-integration

À l’heure actuelle, les IA génératives sont de plus en plus présents dans nos vies, et bien que certaines plateformes les placent de manière trop intrusive (grave mis en avant alors qu’ils servent à rien), elles restent utile dans *certain* cas.

Pour cela, ce nouveau portfolio inclut un fichier [`llms.txt`](https://johanstick.fr/llms.txt) qui résume parfaitement chaque point clé de la page d’accueil du site, optimisé pour une lecture par un LLM.
Il inclut aussi un bouton « Ouvrir dans … » qui permet de poser des questions à ChatGPT, Claude ou Grok, à propos de la page sur laquelle on est.

Pour revenir sur le précédent point, le « Switch Humain / Machine » est une représentation visuelle de ces deux fonctionnalités.

## Retours haptiques et audios ^feedback

Chaque interaction sur ce site déclenche un retour : une vibration sur téléphone et un petit son pour les autres appareils. Un autre petit détail qui ne se remarque pas forcément, mais maintenant vous le savez, alors montez le son (ou prenez un iPhone pour encore plus d’immersion) et explorer *à nouveau* la [page d’accueil](https://johanstick.fr).

# Développement ^dev

## Obsidian comme CMS

L’ensemble des articles de ce site sont écrits depuis [Obsidian](https://obsidian.md) et synchronisé avec le dépôt GitHub du portfolio via mon propre plugin [Obsidian GitPush](https://github.com/johan-perso/obsidian-gitpush). Pas de dashboard, pas de base de données, juste des fichiers Markdown lu au moment de [compiler le serveur](https://github.com/johan-perso/portfolio/blob/main/Dockerfile) et transformés en fichiers JSON et HTML.

![[portfolio_v4_obsidiancms.jpeg|775]]

J’ai également dû [écrire un parser](https://github.com/johan-perso/portfolio/blob/main/scripts/compileMarkdown.js), basé sur celui que j’ai écrit pour [MarkDocs](https://markdocs.johanstick.fr/), qui va convertir les fichiers Markdown qu’il rencontre, en fichiers HTML supportant les fonctionnalités d’Obsidian ([Liens internes](https://obsidian.md/help/links#Link+to+a+file), [tableaux](https://obsidian.md/help/advanced-syntax#Tables), …) et celles que j’ai décidé d’implémenter en supplément.
Les différentes redirections que le site supporte sont aussi gérés via Obsidian avec l’extension tierce [Sheet Plus](https://github.com/ljcoder2015/obsidian-sheet-plus) supporté par le même parser.

## Multilingue ^multilingual

Le site est entièrement disponible en français et en anglais. Ce besoin de traduction s’est imposé naturellement au fil du temps par mon envie de cibler un public international, tout en gardant ma communauté française.

La langue qui est utilisée diffère selon celle de votre navigateur, et un *fallback* est disponible pour les posts qui ne seraient pas disponible dans votre langue. Vous pouvez utiliser ces liens pour consulter cet article [en français](/fr/portfolio-v4/) ou [en anglais](/en/portfolio-v4/).

## Framework maison ^roc

Le site est développé avec [`roc-framework`](https://npmjs.com/package/roc-framework), un projet que j’ai développé pour me faciliter la création de mes sites. Il gère le rendu côté serveur (SSR), les composants réutilisables, [Tailwind CSS](https://tailwindcss.com/), et surtout un système de routing dynamique qui me permet d’ajouter des routes pendant le runtime (c’est-à-dire pendant que le serveur est déjà démarré) et qui ne retourneront pas la même réponse en permanence.

Vous pouvez en apprendre plus sur ce projet via [son dépôt Github](https://github.com/johan-perso/roc-framework), ~~exclusivement en français (tbh je cherche même pas de public du tout, le projet va sûrement rester utilisé par moi seul)~~.

## Open Source ^open-source

Contrairement aux versions précédentes, j’assume *enfin* de publier l’intégralité du code source sur GitHub : le [portfolio lui-même](https://github.com/johan-perso/portfolio), le [framework roc](https://github.com/johan-perso/roc-framework), le plugin [Obsidian GitPush](https://github.com/johan-perso/obsidian-gitpush). Le dernier commit du dépôt principal est d’ailleurs affiché dans le pied de page avec un lien vers celui-ci, un petit détail qui forme une touche de transparence.
