# @itzzsadra/papercli

A simple CLI tool to create **Minecraft servers** interactively, supporting both **Paper (backend server)** and **Velocity (proxy)**. Automatically downloads the latest builds, sets up configuration, and generates cross-platform start scripts.

---

## Installation

You can install the CLI globally using `pnpm` or `npm`:

```bash
pnpm add -g @itzzsadra/papercli
# or
npm install -g @itzzsadra/papercli

## Usage
Create a new server

Run the CLI:

`paper init`


The CLI will guide you through:

Server name and type

Name your server (default: lobby)

Choose server type:

Paper (backend server)

Velocity (proxy)

Minecraft version (Paper only)

Enter a Minecraft version.

The CLI validates if the version exists on PaperMC.

RAM allocation

Choose from preset RAM options (1G, 2G, 4G) or enter a custom value (e.g., 6G).

Server port

Default is 25565.

The CLI will create a directory with your server name, download the appropriate .jar, generate server.properties (for Paper), eula.txt, and cross-platform start scripts (start.sh and start.bat).

Example
paper init
# Follow prompts:
# Server name: lobby
# Server type: Paper
# Minecraft version: 1.21.1
# Max RAM: 2G
# Server port: 25565


Result:

lobby/
├─ paper.jar
├─ server.properties
├─ eula.txt
├─ start.sh
└─ start.bat


Start your server:

# Linux / macOS
./start.sh

# Windows
start.bat
```
