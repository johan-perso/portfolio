---
name: The portfolio I wish I'd built sooner
banner: portfolio_v4_mockup.en.webp
Post_ReleaseDate: 2026-03-29
Post_Date: 2026 - Present
Post_Theme: Tailwind CSS, Obsidian, Multilingue, Roc
Post_Author: Johan
Link_SourceCode: https://github.com/johan-perso/portfolio
Link_Demo: https://johanstick.fr
---
The [previous version](https://web.archive.org/web/20260328224020/https://johanstick.fr/) was started in 2023, at a time when I felt like I was *finally* writing readable code and creating clean designs. Over the past three years, my projects evolved, my design skills improved, and my portfolio no longer reflected who I really was.

This new version is a major refresh with a codebase rebuilt from scratch, using modern tools I’m already comfortable with, designed to properly showcase the visual side of my recent projects.

# Built-in blog ^blog

One of the most important additions in this version is the ability to write articles about my projects, with much more depth than simply sharing a README link of a GitHub repo.

[Articles](https://johanstick.fr/articles/) can be translated into multiple languages, come with a better presentation (download links for apps, publication date and custom details, table of contents), and can be written even for projects that aren't available on GitHub.

> READ: [[Portfolio/Articles/escive/English]]

# A few details ^details

## Human / Machine switch ^human-machine

This site has an alternative mode that can be activated via a small button in the sidebar on the home page. When enabled, the entire layout switches to a different format: monospace font, dark theme, decorative elements removed.

All non-essential details are stripped away to keep only what really matters, offering a quick summary of the site. It's also a direct reference to the "Open in…" feature, which lets you ask an AI for a summary.

![[portfolio_v4_machine_mode_presentation.mp4]]

## AI integration ^ai-integration

Generative AI is increasingly present in our lives, and while some platforms push it too aggressively, it can still be genuinely helpful in certain cases *(this post was mainly translated from French to English with Claude tbh)*.

With that in mind, this new portfolio includes an [`llms.txt`](https://johanstick.fr/llms.txt) file that summarizes every key point from the home page, optimized for LLMs.
It also includes an "Open in…" button that lets you ask questions about the page you're currently viewing to ChatGPT, Claude, or Grok.

To return to the previous point, the "Human / Machine switch" is kind of a visual representation of these two features.

## Haptic and audio feedback ^feedback

Every interaction on this site triggers feedback: a vibration on phones and a small sound on other devices. Another little detail you might not have noticed at first, but now you know, so turn up the volume (or grab an iPhone for even more immersion) and take another look at the [home page](https://johanstick.fr).

# Development ^dev

## Obsidian as a CMS

All the articles on this site are written in [Obsidian](https://obsidian.md) and synced with the portfolio's GitHub repository via my own plugin, [Obsidian GitPush](https://github.com/johan-perso/obsidian-gitpush). No dashboard, no database, just Markdown files read when [building the server](https://github.com/johan-perso/portfolio/blob/main/Dockerfile) and converted into JSON and HTML files.

![[portfolio_v4_obsidiancms.jpeg|775]]

I also had to [write a custom parser](https://github.com/johan-perso/portfolio/blob/main/scripts/compileMarkdown.js), based on the one I wrote for [MarkDocs](https://markdocs.johanstick.fr/), which converts Markdown files into HTML files supporting Obsidian-specific features ([internal links](https://obsidian.md/help/links#Link+to+a+file), [tables](https://obsidian.md/help/advanced-syntax#Tables), …) as well as additional ones I chose to implement on top.
The various redirects the site supports are also managed in Obsidian via the third-party [Sheet Plus](https://github.com/ljcoder2015/obsidian-sheet-plus) plugin, and handled by the same parser.

## Multilingual ^multilingual

The site is fully available in both French and English. The need for translation grew naturally over time from my desire to reach an international audience while still serving my French-speaking community.

The language used is determined by your browser's settings, and a fallback is available for posts that are not available in your language. You can use these links to view this article [in French](/fr/portfolio-v4/) or [in English](/en/portfolio-v4/).

## Homemade framework ^roc

The site is developed with [`roc-framework`](https://npmjs.com/package/roc-framework), a project I created to make building my own sites easier. It handles server-side rendering (SSR), reusable components, [Tailwind CSS](https://tailwindcss.com/), and most importantly, a dynamic routing system that lets me add routes at runtime (while the server is already running) that can return different responses depending on the context.

You can learn more about the project on [its GitHub repository](https://github.com/johan-perso/roc-framework) (exclusively in French; I'm not even looking for an audience, this project will probably remain only used by me).

## Open Source ^open-source

Unlike previous versions, I'm *finally* publishing the entire source code on GitHub: the [portfolio itself](https://github.com/johan-perso/portfolio), the [framework it uses](https://github.com/johan-perso/roc-framework), and the [Obsidian GitPush](https://github.com/johan-perso/obsidian-gitpush) plugin. The latest commit from the main repository is even displayed in the footer with a direct link to it, a small detail that adds a nice touch of transparency.
