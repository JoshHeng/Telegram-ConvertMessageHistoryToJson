# Telegram - Get Message History As Json

A program which converts Telegram message history from the exported HTML format to JSON

## Prerequisites
* Telegram Desktop
* Node.js

## Usage
1. Export the chat history using the Telegram desktop app
   * Do not export any media
2. Move the folder into this directory, and rename it `ChatExport`
3. Run `npm install` and `node converter`
4. The parsed JSON file will be found in `history.json`