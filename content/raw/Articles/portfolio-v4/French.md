---
name: Nouvelle version du portfolio
banner: portfolio_v4_mockup.fr.webp
Post_ReleaseDate: 2026-03-29
Post_Date: 2026 - Présent
Post_Theme: Tailwind CSS, Obsidian, Multilingue, Roc
Post_Author: Johan
Link_SourceCode: https://github.com/johan-perso/portfolio
Link_Demo: https://johanstick.fr
---
La [précédente version](https://web.archive.org/web/20260328224020/https://johanstick.fr/) avait été commencée en 2023 à une période où je commençais *selon moi* à produire un code lisible et un design propre. Au cours des trois dernières années, mes projets ont évolué, mon niveau en design aussi, et ce site ne reflétait plus vraiment qui j’étais.

Cette nouvelle version marque un vrai renouveau avec une base de code reconstruite de zéro, en utilisant des outils modernes que j’utilise déjà ailleurs, et de manière à mettre en avant le travail graphique de mes projets récents.

# Blog intégré ^blog

Un des ajouts les plus importants de cette version, c’est la possibilité d’écrire des articles pour parler de mes projets de manière plus complète qu’à travers un fichier README sur GitHub, et surtout, d’une façon plus agréable à partager.

Les [articles](https://johanstick.fr/articles/) peuvent être traduits dans plusieurs langues, disposent d’une meilleure présentation (liens de téléchargement mis en avant pour les apps, date de publication, détails clés, table des matières) et peuvent être écrits même pour des projets qui ne sont pas disponibles sur GitHub.

> READ: [[Portfolio/Articles/escive/French]]

# Quelques détails ^details

## Switch Humain / Machine ^human-machine

Le site possède un mode alternatif activable via un bouton dans la sidebar de la page d’accueil. Une fois activé, toute la mise en page bascule vers un autre format : police d’écriture monospace (style éditeur de code), thème sombre, suppression des éléments décoratifs.

Tous les détails superflus sont retirés pour ne garder que l’essentiel, ce qui offre un résumé express du site. C’est également une référence directe à la fonctionnalité « Ouvrir dans … » qui permet de demander un résumé à une IA.

![[portfolio_v4_machine_mode_presentation.mp4]]

## Compatibilité avec les IA ^ai-integration

À l’heure actuelle, les IA génératives sont de plus en plus présentes dans nos vies, et bien que certaines plateformes les placent de manière trop intrusive (mis en avant alors qu’elles servent à rien), elles restent utiles dans *certain* cas.

Pour cela, ce nouveau portfolio inclut un fichier [`llms.txt`](https://johanstick.fr/llms.txt) qui résume parfaitement chaque point clé de la page d’accueil du site, optimisé pour les LLMs.
Il inclut aussi un bouton « Ouvrir dans … » qui permet de poser des questions à ChatGPT, Claude ou Grok, à propos de la page en cours.

Pour revenir sur le précédent point, le « Switch Humain / Machine » est une représentation visuelle de ces deux fonctionnalités.

## Retours haptiques et audios ^feedback

Chaque interaction sur ce site déclenche un retour : une vibration sur téléphone et un petit son pour les autres appareils. Un autre petit détail qui ne se remarque pas forcément, mais maintenant que vous le savez, montez le son (ou prenez un iPhone pour encore plus d’immersion) et explorez *à nouveau* la [page d’accueil](https://johanstick.fr).

# Développement ^dev

## Obsidian comme CMS

L’ensemble des articles de ce site est écrit dans [Obsidian](https://obsidian.md) et synchronisé avec le dépôt GitHub du portfolio via mon propre plugin [Obsidian GitPush](https://github.com/johan-perso/obsidian-gitpush). Pas de dashboard, pas de base de données, juste des fichiers Markdown lus lors de la [compilation du site](https://github.com/johan-perso/portfolio/blob/main/Dockerfile) et transformés en fichiers JSON et HTML.

![[portfolio_v4_obsidiancms.jpeg|775]]

J’ai également dû [écrire un parser](https://github.com/johan-perso/portfolio/blob/main/scripts/compileMarkdown.js), basé sur celui que j’ai écrit pour [MarkDocs](https://markdocs.johanstick.fr/), qui va convertir les fichiers Markdown qu’il rencontre, en fichiers HTML supportant les fonctionnalités d’Obsidian ([Liens internes](https://obsidian.md/help/links#Link+to+a+file), [tableaux](https://obsidian.md/help/advanced-syntax#Tables), …) et celles que j’ai décidé d’implémenter en supplément.
Les différentes redirections que le site supporte sont aussi gérées via Obsidian avec l’extension tierce [Sheet Plus](https://github.com/ljcoder2015/obsidian-sheet-plus) supporté par le même parser.

## Multilingue ^multilingual

Le site est entièrement disponible en français et en anglais. Ce besoin de traduction s’est imposé naturellement au fil du temps par mon envie de cibler un public international, tout en gardant ma communauté française.

La langue qui est utilisée dépend de celle de votre navigateur, et un *fallback* est disponible pour les posts qui ne seraient pas disponible dans votre langue. Vous pouvez utiliser ces liens pour consulter cet article [en français](/fr/portfolio-v4/) ou [en anglais](/en/portfolio-v4/).

## Framework maison ^roc

Le site est développé avec [`roc-framework`](https://npmjs.com/package/roc-framework), un projet que j’ai développé pour me faciliter la création de mes sites. Il gère le rendu côté serveur (SSR), les composants réutilisables, [Tailwind CSS](https://tailwindcss.com/), et surtout un système de routing dynamique qui me permet d’ajouter des routes pendant le runtime (c’est-à-dire pendant que le serveur est déjà démarré) et qui peuvent retourner des réponses différentes selon le contexte.

Vous pouvez en apprendre plus sur ce projet via [son dépôt GitHub](https://github.com/johan-perso/roc-framework) (je ne cherche pas spécialement à toucher un large public, le projet va sûrement rester utilisé par moi seul, et c’est peut-être pas plus mal).

## Open Source ^open-source

Contrairement aux versions précédentes, j’assume *enfin* de publier l’intégralité du code source sur GitHub : le [portfolio lui-même](https://github.com/johan-perso/portfolio), le [framework qu’il utilise](https://github.com/johan-perso/roc-framework), le plugin [Obsidian GitPush](https://github.com/johan-perso/obsidian-gitpush).
Le dernier commit du dépôt principal est d’ailleurs affiché dans le pied de page avec un lien vers celui-ci, un petit détail qui apporte une touche de transparence.
