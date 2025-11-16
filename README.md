# Plugin Version Links

A tiny Stash plugin that turns plugin version entries into clickable links to the plugin's URL (for example, a GitHub repository) on the **Settings → Plugins → Available Plugins** page.

## Features

- Detects the **Available Plugins** table in the Stash UI.
- Looks up each plugin's URL column.
- Converts the plain-text version value into a link pointing at the plugin URL.
- Only links GitHub URLs (ignores non-GitHub URLs and empty values).

## Installation

1. Download the latest release ZIP from the GitHub releases page:
   - `https://github.com/frcooper/stash-plugin-version-links/releases`
2. Follow the Stash documentation to install a plugin from a ZIP file.
3. Enable the plugin in Stash if it is not enabled automatically.

## Usage

1. Open Stash and go to **Settings → Plugins → Available Plugins**.
2. For any plugin row that has a GitHub URL configured, the **Version** cell will become a clickable link that opens the plugin URL in a new tab.

No additional configuration is required.

## Development

- Core script: `main.js`
- Manifest: `plugin-version-links.yml`
- Build / release index: `index.yml`

You can use `build.sh` to help with packaging or releasing, if you already have a suitable environment configured.

## License

This project is licensed under the WTFPL (Do What The Fuck You Want To Public License). See `LICENSE` (if present) or the official license text for details.
