import { Client, Intents } from "discord.js";
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
} from "~secret/discord.json";
import log from "./lib/log";

// Register all of the commands
import "./commands";
import respond from "behaviors/respond";
import { collect } from "behaviors/collect";

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
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

  // console.log(message.content);

  // if (message.mentions.users.has(client.user!.id)) {
  //   respond(client, message)
  // } else if (Math.random() < 0.20) {
  //   respond(client, message)
  // }

  respond(client, message);
});

client.on("interactionCreate", handleCommand);
client.login(DISCORD_TOKEN);
