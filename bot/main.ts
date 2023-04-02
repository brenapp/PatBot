import { Client, Intents, TextChannel } from "discord.js";
import {
  COMMANDS,
  deployApplicationCommands,
  deployGuildCommands,
  handleCommand,
} from "~lib/command";
import {
  token as DISCORD_TOKEN,
  developmentGuild,
  channel as channelId,
  owner,
} from "~secret/discord.json";
import log from "./lib/log";

// Register all of the commands
import "./commands";
import respond from "behaviors/respond";

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
  partials: ["CHANNEL"],
});

client.on("ready", () => {
  log(
    "info",
    `${client.user?.username}#${client.user?.discriminator} is ready!`
  );

  if (process.env.NODE_ENV === "development") {
    log("info", `deploying ${COMMANDS.size} commands to development guild...`);
    deployGuildCommands(developmentGuild);
  } else {
    log("info", `deploying ${COMMANDS.size} commands to GLOBAL list...`);
    deployApplicationCommands();
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channelId != channelId) return;

  if (
    message.mentions.users.has(client.user!.id) ||
    message.content.toLowerCase().includes("pat")
  ) {
    respond(client, message);
  } else if (Math.random() < 0.05) {
    respond(client, message);
  }
});

client.on("interactionCreate", handleCommand);
client.login(DISCORD_TOKEN);
