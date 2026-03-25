---
name: "eScive : roulez mieux en trottinette électrique"
banner: escive_app_banner.jpg
Post_ReleaseDate: 2025-08-17
Post_Date: 2025 - Présent
Post_Theme: Flutter, Bluetooth Low Energy, Reverse Engineer, Mapbox
Post_Author: Johan
Post_CoAuthors: "[el2zay](https://github.com/el2zay)"
Download_Android: https://dl.bassinecorp.fr/escive?os=android
Download_iOS: https://dl.bassinecorp.fr/escive?os=ios
Link_Demo: https://escive-demo.johanstick.fr
Link_SourceCode: https://github.com/johan-perso/escive
---
L'application eScive est disponible ! Elle offre une meilleure expérience de conduite pour les utilisateurs de trottinettes électriques de certaines marques dotées de capacités Bluetooth. Elle remplace les apps officielles en offrant plus de fonctionnalités, avec une meilleure interface, sans tracking, et sans publicités.

# Téléchargement de l'app ^download

Étant donné que ce concept d'application n'intéresse pas assez d'utilisateurs (peut-être dû au faible nombre de marques supportées pour le moment, peut-être un peu trop niche aussi), l'équipe du Google Play Store a refusé deux fois la publication de l'app. Quant à Apple, les frais de publication sont bien trop importants pour un projet de ce style.

Cependant, vous pouvez tout de même l'utiliser sur Android via un [fichier APK](https://dl.bassinecorp.fr/escive?os=android), et sur iOS, à condition d'effectuer quelques étapes complexes à l'aide d'outils de sideloading et du [fichier d'installation (IPA)](https://dl.bassinecorp.fr/escive?os=ios) d'eScive.

> READ: [[Portfolio/Articles/sideload-ios/French]]

# Compatibilité ^compatibility

Pour l'instant, eScive n'est compatible qu'avec la gamme "i10" de chez iScooter (aucune affiliation, j'en pouvais juste plus de l'app officiel). Le code étant conçu avec une facilité d'ajout d'autres modèles à l'esprit, la liste d'appareils supportés pourrait venir à évoluer au fil du temps.

Il est possible de développer ses propres "bridges", permettant de relier un appareil à l'app en utilisant le Bluetooth, à condition d'être suffisamment motivé dans le reverse engineer.

# Contexte / motivation, fonctionnalités ^features

En concevant eScive, j'ai voulu offrir à moi et aux autres utilisateurs une expérience beaucoup plus pratique qu'avec n'importe quelle app officielle.

D'abord, l'app est faite pour être utilisée très peu de temps : l'ouvrir un court instant pour afficher les statistiques du dernier parcours, ou pour déverrouiller sa trottinette.
Mais, elle est également faite pour être affichée à l'écran tout le long d'un parcours, lorsque le téléphone est attachée au guidon : l'affichage principal inclut un compteur de vitesse en temps réel, une représentation des alentours, et des détails sur la musique en cours de lecture (sur Android). Le mode paysage est capable de tout afficher à l'écran, sans aucune interaction, pour éviter plus de distractions.

Pour vous faire perdre le moins de temps possible, eScive s'ouvre et se connecte rapidement à votre appareil, en vous laissant la possibilité d'en configurer plusieurs. Pour aller encore plus loin, j’ai intégré des outils pour faciliter la création d’automatisations et raccourcis, permettant d’accélérer encore plus chacune de vos actions avec votre véhicule.

*Également, l'app officielle iScooter plante une fois sur trois sur Android, demande un accès à la localisation exacte de votre téléphone, vous force à attendre dix secondes avant de vous autoriser à déverrouiller votre véhicule, et dispose de contrôles vraiment pas intuitifs. Ça fait aussi partie des motivations.*

# Automatisation ^automation

L'app possède deux fonctionnalités pour vous aider à implémenter vos propres automatisations, afin de rendre votre expérience encore plus pratique.
1. "Protocole" : effectuer des actions au sein de l'app, depuis une autre app ou un tag NFC.
2. "Variables Kustom" : afficher des informations tirées d'eScive dans vos propres widgets (uniquement sur Android).

Ces deux éléments vous permettent, par exemple, de configurer un tag NFC posé sur votre guidon, prêt à activer ou désactiver le verrouillage intégré de la trottinette lorsque vous passez votre téléphone près de celui-ci.

> 🤓 Vous pouvez en apprendre davantage dans le [fichier README](https://github.com/johan-perso/escive/blob/main/README.fr.md#automatisation) disponible sur GitHub.

# Design et développement ^design

Le design avait d’abord été conçu rapidement sur Figma par mes soins (enfin, façon de parler…) afin de visualiser avec [@el2zay](https://github.com/el2zay) les idées que j’avais en tête. On a ensuite itéré avec des modifications liées aux composants de base de l’app, afin de la rendre plus intuitive pour tous les utilisateurs. Ces choix ont permis de proposer une interface claire, sans distractions, et qui vous permet d’effectuer n’importe quelle action en un instant.

![[escive_design_evolution.webp]]

Quant au développement de l’app, [Flutter](https://flutter.dev/) a été utilisé pour concevoir rapidement une app disponible sur différentes plateformes (Android et iOS, ainsi qu’une expérimentation pour navigateur). Les trottinettes sont connectées en utilisant une imitation de leur protocole Bluetooth originel, basée sur le code décompilé des apps officielles, et sur des analyses des paquets BLE envoyés et reçus, ce qui limite l’utilisation de l’app à un seul constructeur pour le moment.
