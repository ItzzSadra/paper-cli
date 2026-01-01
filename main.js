#!/usr/bin/env node

import { Command } from "commander";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import prompts from "prompts";

/* ===== Handle Ctrl+C ===== */
process.on("SIGINT", () => {
  console.log("\n🛑 Process interrupted by user");
  process.exit(0);
});

/* ===== CLI ===== */
const program = new Command();

program
  .command("init")
  .description("Create a Minecraft server interactively")
  .action(async () => {
    /* STEP 1: NAME + TYPE */
    const base = await prompts([
      {
        type: "text",
        name: "name",
        message: "Server name",
        initial: "lobby",
      },
      {
        type: "select",
        name: "type",
        message: "Server type",
        choices: [
          { title: "Paper (backend server)", value: "paper" },
          { title: "Velocity (proxy)", value: "velocity" },
        ],
      },
    ]);

    if (!base.name) process.exit(0);

    /* STEP 2: MINECRAFT VERSION (Paper only) */
    let mc = null;
    if (base.type === "paper") {
      const versionAnswer = await prompts({
        type: "text",
        name: "mc",
        message: "Minecraft version",
        initial: "1.21.1",
        validate: async (value) => {
          const res = await fetch(
            `https://api.papermc.io/v2/projects/paper/versions/${value}`
          );
          return res.ok || `Paper does not support ${value}`;
        },
      });
      mc = versionAnswer.mc;
    }

    /* STEP 3: RAM */
    const ramAnswer = await prompts({
      type: "select",
      name: "ram",
      message: "Max RAM",
      choices: [
        { title: "1 GB", value: "1G" },
        { title: "2 GB", value: "2G" },
        { title: "4 GB", value: "4G" },
        { title: "Custom", value: "custom" },
      ],
    });

    let ram = ramAnswer.ram;

    if (ram === "custom") {
      const custom = await prompts({
        type: "text",
        name: "ram",
        message: "Enter RAM (e.g. 6G)",
        initial: "5G",
        validate: (v) => /^[0-9]+G$/.test(v) || "Use format like 4G",
      });
      ram = custom.ram;
    }

    /* STEP 4: PORT */
    const portAnswer = await prompts({
      type: "number",
      name: "port",
      message: "Server port",
      initial: 25565,
    });

    const { name, type } = base;
    const { port } = portAnswer;

    const dir = path.join(process.cwd(), name);
    fs.mkdirSync(dir, { recursive: true });

    let jarName = "";

    /* ===== DOWNLOAD SERVER ===== */
    if (type === "paper") {
      console.log("📦 Fetching Paper builds...");

      const res = await fetch(
        `https://api.papermc.io/v2/projects/paper/versions/${mc}`
      );
      const data = await res.json();
      const build = data.builds.at(-1);

      const jarUrl = `https://api.papermc.io/v2/projects/paper/versions/${mc}/builds/${build}/downloads/paper-${mc}-${build}.jar`;
      jarName = "paper.jar";

      console.log(`⬇️  Downloading Paper ${mc} build ${build}`);

      const jarRes = await fetch(jarUrl);
      const fileStream = fs.createWriteStream(path.join(dir, jarName));
      await new Promise((resolve) => {
        jarRes.body.pipe(fileStream);
        jarRes.body.on("end", resolve);
      });

      fs.writeFileSync(
        path.join(dir, "server.properties"),
        `server-port=${port}
online-mode=false
motd=${name} Server
`
      );

      fs.writeFileSync(path.join(dir, "eula.txt"), "eula=true\n");
    }

    if (type === "velocity") {
      console.log("📦 Fetching Velocity versions...");

      const versionsRes = await fetch(
        "https://api.papermc.io/v2/projects/velocity"
      );
      const versionsData = await versionsRes.json();
      const latestVersion = versionsData.versions.at(-1);

      const buildsRes = await fetch(
        `https://api.papermc.io/v2/projects/velocity/versions/${latestVersion}`
      );
      const buildsData = await buildsRes.json();
      const latestBuild = buildsData.builds.at(-1);

      const jarUrl = `https://api.papermc.io/v2/projects/velocity/versions/${latestVersion}/builds/${latestBuild}/downloads/velocity-${latestVersion}-${latestBuild}.jar`;
      jarName = "velocity.jar";

      console.log(
        `⬇️  Downloading Velocity ${latestVersion} build ${latestBuild}`
      );

      const jarRes = await fetch(jarUrl);
      const fileStream = fs.createWriteStream(path.join(dir, jarName));

      await new Promise((resolve) => {
        jarRes.body.pipe(fileStream);
        jarRes.body.on("end", resolve);
      });
    }

    /* ===== START SCRIPTS (CROSS-PLATFORM) ===== If anyone is on macos/linux or windows*/
    fs.writeFileSync(
      path.join(dir, "start.sh"),
      `#!/bin/sh
java -Xms${ram} -Xmx${ram} -jar ${jarName} nogui
`
    );

    fs.writeFileSync(
      path.join(dir, "start.bat"),
      `@echo off
java -Xms${ram} -Xmx${ram} -jar ${jarName} nogui
pause
`
    );

    try {
      fs.chmodSync(path.join(dir, "start.sh"), 0o755);
    } catch {}

    console.log("✅ Server created successfully!");
  });

program.parse();
