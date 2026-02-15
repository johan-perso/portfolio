---
slug: sideload-ios
banner:
Post_ReleaseDate: 2026-02-15
Post_Author: Johan
---
Il est possible d'installer des applications sur un iPhone même lorsqu’elles ne sont pas disponibles sur l'App Store, en utilisant un fichier d'installation `.ipa` fourni par le développeur ou par un tiers. Ici, nous verrons différentes méthodes pour installer ces apps sur votre téléphone.

> 🤓 Cet article ne parlera pas des nouvelles méthodes de sideloading proposées par Apple pour les membres de l'Union Européenne puisqu'elles ne sont pas assez intéressantes à l'heure actuelle. De multiples autres solutions sont disponibles, mais les suivantes font partie des plus simples à mettre en œuvre.

| Logiciel                                              | Catégorie              | Avantages                                                                                                                                                                                                                                      | Désavantages                                                                                                                                                                                                                          | Prérequis        |
| ----------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| [SideStore](#install-sidestore)                       | Magasin d’apps         | Supporte les sources<br>- Permet d’installer des apps natives depuis votre iPhone<br>- Refresh automatique des apps via l’app Raccourcis                                                                                                       |                                                                                                                                                                                                                                       | Un PC ou Mac     |
| [SideStore + Live Container](#install-live-container) | Magasin d’apps hybride | - Supporte les sources<br>- Permet d’installer des apps natives depuis votre iPhone<br>- Permet d’installer des apps dans des conteneurs (évite la limite de temps et de nombre d’apps)<br>- Refresh automatique des apps via l’app Raccourcis | Les apps qui sont dans un conteneur prennent plus de temps à s’ouvrir, et certaines peuvent rencontrer des problèmes et crash (vous pourrez les installer hors du conteneur, mais elles seront soumises à la limite du nombre d’apps) | - Un PC ou Mac   |
| [Impactor](#install-impactor)                         | Installateur d’apps    | - Installe une app rapidement                                                                                                                                                                                                                  | - Vous devez fournir un fichier d’installation pour chaque app<br>- Les apps expirent au bout de 7 jours<br>- Vous devez passer par un ordinateur pour chaque installation<br>                                                        | - Un PC ou Mac   |
| [Sideloadly](#install-sideloadly)                     | Installateur d’apps    | - Installe une app rapidement                                                                                                                                                                                                                  | - Vous devez fournir un fichier d’installation pour chaque app<br>- Les apps expirent au bout de 7 jours<br>- Vous devez passer par un ordinateur pour chaque installation                                                            | - Un PC ou Mac   |
| [AltStore World / Classic](#install-alstore)          | Magasin d’apps         | - Supporte les sources<br>- Permet d’installer des apps natives depuis votre iPhone<br>- Refresh automatique des apps via l’app Raccourcis                                                                                                     | Un ordinateur avec le logiciel AltServer doit être présent sur votre réseau lors de l’installation et du refresh d’apps                                                                                                               | - Un PC ou Mac   |
| Feather + Certificats                                 | Magasin d’apps         | - Supporte les sources<br>- Permet d’installer des apps natives depuis votre iPhone<br>- Évite la limite de 3 apps par appareil<br>- Aucun délai d’expiration pour les apps                                                                    | Vous devez passer par un certificat payant vendu par un tiers (qui peut être révoqué à tout moment), ou une licence Apple Developer (99$/an).                                                                                         |                  |
| AltStore PAL / Europe                                 | Magasin d’apps         |                                                                                                                                                                                                                                                | Tout.                                                                                                                                                                                                                                 | - Être dans l’UE |

# Prérequis ^prerequis

Si la méthode que vous souhaitez utiliser exige un PC, et que le vôtre utilise Windows, vous aurez besoin d’installer iTunes depuis le site d’Apple. La version disponible sur le Microsoft Store ne fonctionnera pas.

- Téléchargement [iTunes 64-bits](https://www.apple.com/itunes/download/win64/)
- Téléchargement [iTunes 32-bits](https://www.apple.com/itunes/download/win32/)

Si vous êtes sur iOS 16 ou supérieur, vous aurez besoin d’activer le mode développeur dans *Réglages → Confidentialité et sécurité → Mode développeur*. Cette étape vous demandera de redémarrer votre appareil, elle n’est à effectuer qu’une seule fois et aucune donnée ne sera effacée de l’iPhone.

> 👨‍💼 Vous aurez également besoin d’un compte Apple à utiliser sur les logiciels pour leur permettre de communiquer avec les serveurs d’Apple. Dans ce cas, vous pouvez utiliser un compte secondaire/poubelle, même s’il n’a jamais été connecté à votre appareil.

# Définitions ^definitions

## Source ^source

Une source est un moyen d’ajouter une liste d’applications dynamiques à un magasin d’apps tiers. Cette fonctionnalité permet notamment l’installation de mises à jour plus rapidement. Les magasins comme AltStore et SideStore permettent l’ajout de sources à partir d’une URL. Par exemple, vous pouvez [accéder à mes apps ici](https://stikstore.app/altdirect/?url=https://dl.bassinecorp.fr/altstore.json).

![[147_1x_shots_so.png|960]]

## Limites d’apps et de temps ^limitations-def

Si vous n'utilisez pas de compte Apple Developer payant (99 $/an) ou de certificat tiers, vous êtes soumis aux restrictions d'Apple concernant l'installation d'applications hors App Store.

1. 3 applications actives : chaque appareil est restreint à un maximum de 3 applications installées via sideloading. Les magasins d’apps (comme AltStore ou SideStore) comptent eux-mêmes au sein de cette limite, ce qui vous laisse que deux emplacements pour vos fichiers `.ipa`.
   Avec Live Container, vous pouvez faire tourner des applications à l’intérieur de lui-même, contournant partiellement cette limitation.
2. 7 jours avant expiration : une semaine après l’installation d’une app, celle-ci expirera et refusera de s’ouvrir. Pour éviter cela, vous devrez la « refresh » avant la fin de ce délai. Cette étape peut être automatisée si vous utilisez un magasin d’apps.

# Disclaimer ^disclaimer

Le sideloading ouvre la porte à des applications qu’Apple a refusées, ou même bannies, et c’est *parfois* pour une bonne raison. Des failles de sécurité peuvent toujours être présentes sur iOS et les apps peuvent les exploiter sans même que vous ne leur accordiez une permission.

1. Soyez vigilant si votre modèle d’iPhone ou votre version d’iOS est ancienne (ex: [iOS 26.0 qui inclut une faille dans l’iTunes Store](https://x.com/blackorbird/status/1989904744236945494)).
2. Vérifier les apps et sources que vous installez. Privilégiez les projets disponibles sur GitHub plutôt que des apps déjà présentes sur l’App Store et qui sont closed-source.
3. Utilisez un compte Apple secondaire pour éviter tout problème avec votre compte principal, bien que cela ne devrait pas se produire.

> 🔕 Certaines fonctionnalités des apps ne seront pas disponibles, telles que l’accès aux notifications push, aux Live Activities ou à l’ajout de widgets sur l’écran d’accueil.

# Quelle méthode choisir ? ^which-method-to-use

| Si vous voulez…                                                              | La solution idéale est      |
| ---------------------------------------------------------------------------- | --------------------------- |
| La simplicité absolue (1 seule app pour un court moment)                     | Impactor ou Sideloadly      |
| Ne jamais avoir à se connecter à son PC                                      | SideStore                   |
| Ne jamais avoir à se connecter à son PC, et installer un grand nombre d’apps | SideStore + Live Container  |
| Aucune contrainte                                                            | Feather + Certificat Payant |

# Tutoriels pas-à-pas pour chaque méthode ^tutorials

## Installer SideStore ^install-sidestore

SideStore est un « fork » d’AltStore qui présente un avantage majeur : une fois installé, vous n’avez plus besoin d’ordinateur pour installer ou rafraîchir vos apps. Il utilise un VPN local pour tromper l’iPhone et lui faire croire qu’il communique avec un serveur de développement. *Tiré de [ce tutoriel](https://gist.github.com/sinceohsix/688637ac04695d1ff38f844acc8ba7f3)*.

1. Sur votre PC, téléchargez et ouvrez le logiciel [iloader](https://github.com/nab138/iloader/releases/latest). Celui-ci permettra d’installer SideStore dans un premier temps.
2. Dans iloader, entrez vos identifiants Apple ID dans le champ dédié, et cliquez sur « Login ». ![[iossideloading_iloader.png]]
3. Branchez votre iPhone à votre ordinateur et cliquez sur son nom dans la liste d’appareils pour le sélectionner comme cible. S’il n’apparait pas, vous pouvez utiliser le bouton « Refresh » pour actualiser la liste d’appareils.
4. Sous « Installers », choisissez « SideStore (Stable) » et procédez à l’installation.
5. En parallèle, vous pouvez télécharger [LocalDevVPN depuis l’App Store](https://apps.apple.com/fr/app/localdevvpn/id6755608044) sur votre iPhone. Vous devrez ouvrir cette app et l’activer à chaque fois que vous installez ou rafraîchissez une app.
6. Pour autoriser SideStore à s’ouvrir, vous devrez ouvrir l’app Réglages et vous rendre dans *Général → VPN et gestion de l’appareil → votre adresse mail → Vérifier l’app*.
7. Ouvrez LocalDevVPN et cliquez sur « Connect », puis autorisez l’ajout d’une nouvelle configuration VPN. ![[iossideloading_localdevvpn.png]]
8. Ouvrez maintenant SideStore et naviguez dans « My Apps ». Vous devriez voir que SideStore expire dans « 7 DAYS ». Lancez votre premier refresh en cliquant sur ce bouton et connectez vous avec le même compte Apple que dans iloader.

SideStore est prêt à être utilisé ! Vous pouvez à présent installer les apps que vous voulez, dans la limite des deux emplacements restants. Pour installer autant d’apps que vous souhaitez, dans des conteneurs, vous pouvez le remplacer par [Live Container](#install-live-container).

> 💡 Pour ne pas penser au rafraîchissement de SideStore, vous pouvez utiliser l’app Raccourcis pour créer une automatisation qui le fait à votre place à une certaine heure par exemple. Pour cela, vous devrez activer « Background Refresh » dans les réglages de SideStore.

## Remplacer SideStore par Live Container ^install-live-container

1. Si vous n’avez pas déjà [installé SideStore](#install-sidestore), revenez en arrière et effectuez toutes les étapes nécessaires.
2. Sur votre iPhone, téléchargez « [LiveContainer+SideStore.ipa](https://github.com/LiveContainer/LiveContainer/releases/latest/) » depuis le [dépôt GitHub](https://github.com/LiveContainer/LiveContainer/) de Live Container. La version « Nightly » contient plus de fonctionnalités comme les sources, mais est expérimentale et n’est pas recommandée pour tout le monde.
3. Ouvrez SideStore et naviguez dans « My Apps ». Utilisez le bouton « + » situé en haut à gauche pour installer le fichier précédemment téléchargé.
4. Si un message vous demande de choisir de garder ou non les *App Extensions*, choisissez « Keep App Extensions (Use Main Profile) ».
5. Une fois l’installation terminée, ouvrez Live Container depuis l’écran d’accueil de votre téléphone.
6. Ouvrez SideStore depuis l’icône en haut à gauche de Live Container. Un « pairing file » vous sera demandé : vous pourrez le retrouver en naviguant dans vos fichiers vers « Sur mon iPhone → SideStore », et en sélectionnant `ALTPairingFile.mobiledevicepairing`.
7. Connectez vous à nouveau à votre compte Apple, le même que dans iloader, et patientez pendant que SideStore se remplace par Live Container.
8. Une fois terminé, fermez complètement Live Container et ouvrez-le à nouveau pour changer de conteneur. Naviguez vers « Settings » et faites « Import Certificate from SideStore ».
9. Vérifiez que le remplacement s’est correctement déroulé avec « JIT-Less Mode Diagnose » puis « Test JIT-Less Mode ».
10. Vous pouvez désormais installer les apps que vous souhaitez dans Live Container, sans limites, et dans SideStore, avec limites.

## Installer avec Impactor ^install-impactor

1. Téléchargez [Impactor](https://github.com/khcrysalis/Impactor/releases) sur votre ordinateur depuis leur dépôt GitHub.
2. Une fois l’app ouverte, glissez-y un fichier d’installation en `.ipa` et sélectionnez votre iPhone dans la liste en haut à droite. ![[iossideloading_impactor_home.png]]
3. Cliquez sur « Install » et renseignez les informations de votre compte Apple pour pouvoir continuer avec l’installation de votre app. Cette étape est nécessaire pour permettre au logiciel de demander aux serveurs d’Apple de générer une signature pour l’appli que vous êtes en train d’installer. ![[iossideloading_impactor_login.png]]
4. Quelques minutes plus tard, vous pourrez retrouver l’application sur l’écran d’accueil de votre iPhone. Dans le cas contraire, une erreur s’affichera sur le logiciel, libre à vous d’effectuer des recherches (ou de changer de méthode).
5. Avant d’ouvrir l’app, vous devrez ouvrir les Réglages et vous rendre dans *Général → VPN et gestion de l’appareil → votre adresse mail* puis appuyer sur *Vérifier l’app*.

> L’application expirera au bout de 7 jours. Passé ce délai, vous ne pourrez plus l’ouvrir sans la réinstaller avec Impactor ou un autre logiciel. Une fonctionnalité expérimentale est présente dans Impactor pour tenter un refresh automatique lorsque votre ordinateur est allumé et connecté à Internet, mais celle-ci ne garantit pas un renouvellement sûr.

## Installer avec Sideloadly ^install-sideloadly

1. Téléchargez et ouvrez Sideloadly sur votre PC : [Windows 64-bits](https://sideloadly.io/SideloadlySetup64.exe) ; [Windows 32-bits](https://sideloadly.io/SideloadlySetup32.exe) ; [macOS](https://sideloadly.io/SideloadlySetup.dmg).
2. Branchez votre iPhone à votre PC et sélectionnez-le dans la liste en bas de « iDevice ». Cliquez sur le bouton « IPA » et sélectionnez le fichier d’installation IPA. Saisissez l’adresse e-mail d’un compte Apple dans « Apple ID » (même s’il n’a jamais été connecté à votre appareil), puis cliquez sur « Start ». ![[iossideloading_sideloadly.png]]
3. Une fenêtre s’affichera pour vous demander le mot de passe de votre compte Apple. Cette étape est nécessaire pour permettre au logiciel de demander aux serveurs d’Apple de générer une signature pour l’appli que vous comptez installer. Vous pouvez utiliser un compte secondaire/poubelle si vous le souhaitez.
4. Quelques minutes plus tard, l’application sera installée sur votre iPhone. Dans le cas contraire, une erreur s’affichera sur le logiciel Sideloadly, libre à vous d’effectuer des recherches (ou de changer de méthode).
5. Avant d’ouvrir l’app, vous devrez ouvrir les Réglages et vous rendre dans *Général → VPN et gestion de l’appareil → votre adresse mail* puis appuyer sur *Vérifier l’app*.

> L’application expirera au bout de 7 jours. Passé ce délai, vous ne pourrez plus l’ouvrir sans la réinstaller avec Sideloadly ou un autre logiciel.

## Installer AltStore ^install-altstore

1. Téléchargez AltServer (World) pour [Windows](https://cdn.altstore.io/file/altstore/altinstaller.zip) (10 et supérieur) ou [macOS](https://cdn.altstore.io/file/altstore/altserver.zip) (Big Sur et supérieur).
2. Une fois installé, exécutez-le sur votre ordinateur, puis branchez votre iPhone. Vous devrez accepter la demande de connexion en saisissant le code de votre téléphone si demandé.
3. Localisez et cliquez sur l'icône dans la barre des tâches/de menu sur votre ordinateur.
4. Passez votre curseur sur « Install AltStore » et sélectionnez votre iPhone dans la liste. ![[iossideloading_altstore_install.png]]
5. *AltServer* vous demandera de saisir l’adresse mail et le mot de passe de votre identifiant Apple. Cette étape est nécessaire pour permettre au logiciel de demander aux serveurs d’Apple de générer une signature pour l’installation d’*AltStore* sur votre iPhone. Vous pouvez utiliser un compte secondaire/poubelle si vous le souhaitez. ![[iossideloading_altstore_login.png]]
6. Patientez 30 secondes jusqu’à ce qu’AltStore s’affiche sur votre écran d’accueil. Laissez votre iPhone branché à votre ordinateur. Une fois que l’icône est visible, ouvrez l’app Réglages et rendez vous dans *Général → VPN et gestion de l’appareil → votre adresse mail → Vérifier l’app*.
7. Vous allez désormais pouvoir ouvrir AltStore sur votre téléphone. À la première installation, l’app pourra vous redemander de vous connecter à votre compte Apple, le même que celui renseigné dans AltServer sur votre PC.

> Au bout de 7 jours, il ne sera plus possible d’ouvrir les apps installées. Vous pouvez contrer cette limitation depuis l’app AltStore en utilisant le bouton Refresh sur la page « My Apps », à condition que votre PC soit toujours allumé et connecté au même réseau.
