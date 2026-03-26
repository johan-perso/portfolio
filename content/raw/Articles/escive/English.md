---
name: "eScive : next level controls for your electric scooter"
banner: escive_app_banner.en.jpg
Post_ReleaseDate: 2025-08-17
Post_Date: 2025 - Present
Post_Theme: Flutter, Bluetooth Low Energy, Reverse Engineering, Mapbox
Post_Author: Johan
Post_CoAuthors: "[el2zay](https://github.com/el2zay)"
Download_Android: https://dl.bassinecorp.fr/escive?os=android
Download_iOS: https://dl.bassinecorp.fr/escive?os=ios
Link_Demo: https://escive-demo.johanstick.fr
Link_SourceCode: https://github.com/johan-perso/escive
---
The eScive app is now available! It offers a better experience for users of electric scooters from certain brands with Bluetooth capabilities. It replaces official apps by offering more features in a better interface, with no tracking and no ads.

# Download the app ^download

Since this type of app doesn't attract enough users (possibly due to the small number of supported brands for now, and perhaps being a bit too niche), the Google Play Store team has rejected the app's publication twice. As for Apple, the publishing fees are far too high for a project of this kind. However, you can still use it on Android via an [APK file](https://dl.bassinecorp.fr/escive?os=android), and on iOS by following a few *quite complex* steps using sideloading tools and eScive's [installation file (IPA)](https://dl.bassinecorp.fr/escive?os=ios).

> READ: [[Portfolio/Articles/sideload-ios/French]]

# Compatibility ^compatibility

For now, eScive is only compatible with the "i10" range from iScooter (no affiliation, I just couldn't stand the official app anymore). Since the code was designed with easy addition of other models in mind, the list of supported devices may grow over time.

It is possible to develop your own "bridges" to connect a device to the app via Bluetooth, as long as you're motivated enough to do some reverse engineering.

# Context / motivation, features ^features

When designing eScive, I wanted to offer myself and other users a much more convenient experience than any official app provides.

First, the app is built to be used very briefly: open it for a moment to check the stats from your last ride, or to unlock your scooter.
But it's also designed to stay on screen throughout a ride, when your phone is mounted on the handlebars: the main display includes a real-time speedometer, a map of the surroundings, and details about the currently playing music (on Android). Landscape mode can display everything on screen without any interaction, to minimize distractions.

To save you as much time as possible, eScive opens and connects to your device quickly, while letting you configure multiple devices. To go even further, I've integrated tools to make it easier to create automations and shortcuts, speeding up every interaction with your vehicle.

*Also, the official iScooter app crashes one out of three times on Android, requires access to your exact location, forces you to wait ten seconds before letting you unlock your vehicle, and has really unintuitive controls. That was also part of the motivation.*

# Automation ^automation

The app has two features to help you create your own automations, making your experience even more convenient.
1. "Protocol" : perform actions within the app, from another app or from an NFC tag.
2. "Kustom Variables" : display information from eScive in your own widgets (Android only).

These two features allow you, for example, to set up an NFC tag on your handlebars, ready to securely disable or enable the scooter’s built-in lock whenever you tap your phone against it.

> 🤓 You can learn more in the [README file](https://github.com/johan-perso/escive/?tab=readme-ov-file#automation) available on GitHub.

# Design and development ^design

The design was initially sketched out quickly in Figma to share my ideas visually with [@el2zay](https://github.com/el2zay). We then iterated with changes tied to the app's core components to make it more intuitive for all users. These choices led to a clean, distraction-free interface that lets you perform any action in an instant.

![[escive_design_evolution.webp|800]]
*Design evolution across iterations*

As for the app's development, [Flutter](https://flutter.dev/) was used to quickly build an app available across multiple platforms (Android and iOS, along with a browser experiment). Scooters are connected by mimicking their original Bluetooth protocol, based on decompiled code from the official apps and analysis of sent and received BLE packets, which currently limits the app to a single manufacturer.
