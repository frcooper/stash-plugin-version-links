# Plugin Version Links

A tiny Stash plugin that turns plugin version entries into clickable links to the plugin's URL (for example, a GitHub repository) on the **Settings → Plugins → Available Plugins** page.

## Features

- Detects the **Available Plugins** table in the Stash UI.
- Looks up each plugin's URL column.
- Converts the plain-text version value into a link pointing at the plugin URL.
- Only links GitHub URLs (ignores non-GitHub URLs and empty values).

## Installation

You can install this plugin by adding this repository as a plugin source in Stash:

1. In Stash, go to **Settings → Plugins**.
2. In the plugin sources / indexes section, add a new source that points to this repository's plugin index URL, for example:
   - `https://raw.githubusercontent.com/frcooper/stash-plugin-version-links/main/index.yml`
3. Save the new source, then refresh the Available Plugins list.
4. Install **Plugin Version Links** from the list.
5. Enable the plugin in Stash if it is not enabled automatically.

## License

This project is licensed under the WTFPL (Do What The Fuck You Want To Public License). See `LICENSE` (if present) or the official license text for details.
