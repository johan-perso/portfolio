---
slug: blog-demo-features
visibility: hidden
Post_ReleaseDate: 2026-03-03
Post_EditDate: 2026-03-10
Post_Author: Johan
---
# Headers

```md
# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

# Header ^header-id
*(to set a custom anchor to this section)*
```

# Basic texts

- Insert [hyperlink](https://example.com): `[hyperlink](https://example.com)`.
- Insert mention in text: `[@johan-perso](https://github.com/johan-perso)` (auto-detect image for GitHub profiles).
- Insert blockquote: `> Content`.
- Insert blog post: `> READ: [[Blog demo]]`
- You can also insert `code` and `codeblock`.
- *Italic*.
- **Bold**.
- __Underline__.
- ~~Strikethrough~~.
- Images, videos and tables can be added through basic markdown methods.

1. You can also use
2. Numbered list.

# Frontmatter

| Key                | Value                                                                                              | Example                                  |
| ------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `slug`             | Unique ID for this post, will be shown to users in the access URL                                  | `blog-demo-features`                     |
| `visibility`       | Allows to hide this post from search engines and from the internal "Blog posts list"               | `hidden`, `<nothing>`                    |
| `banner`           | Local path for the banner of this blog post                                                        |                                          |
| `Post_Author`      | Main writer of this blog post, can include hyperlinks                                              | `Johan`                                  |
| `Post_Date`        | Epoch for this project (if the post is about a project), format: `year - year` or `year - Present` | `2024 - Present`                         |
| `Post_Theme`       | Themes of this post / project                                                                      |                                          |
| `Post_ReleaseDate` | When did this post was written/published                                                           | `03/03/2026`                             |
| `Post_EditDate`    | When was the last edit of this post.                                                               | `10/03/2026`                             |
| `Post_CoAuthors`   | People who helped with this project or this blog post, can include hyperlinks, separated by commas |                                          |
| `Download_Android` | Download link for Android, if the post is about an Android app                                     | `https://dl.bassinecorp.fr/…?os=android` |
| `Download_iOS`     | Download link for iOS, if the post is about an iOS app                                             | `https://dl.bassinecorp.fr/…?os=ios`     |
| `Download_macOS`   | Download link for macOS, if the post is about a macOS app                                          |                                          |
| `Download_Windows` | Download link for Windows, if the post is about a Windows app                                      |                                          |
| `Download_Linux`   | Download link for Linux, if the post is about a Linux app                                          |                                          |
| `Link_Demo`        | Link to test the app without having to install it                                                  |                                          |
| `Link_SourceCode`  | GitHub link to find the source code related to this post or project                                |                                          |

