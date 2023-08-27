import { Client, Collection, Message, TextChannel } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import { token as OPENAI_TOKEN } from "~secret/openai.json";
import { promises as fs } from "fs";
import { channel as channelId } from "~secret/discord.json";

const GUILD_ID = "386585461285715968";

export async function collect(client: Client, userId: string) {
  const user = await client.users.fetch(userId);
  const guild = await client.guilds.fetch(GUILD_ID);
  const channel = (await guild.channels.fetch(channelId)) as TextChannel;

  // Get user's messages in that channel
  let messages: { message: Message; chain: Message[] }[] = [];

  console.log(
    `Collect messages from ${user.username}#${user.discriminator} in #${channel.name}`
  );

  const file = JSON.parse(await fs.readFile(`./${user.username}.json`, "utf8"));

  let before: string | undefined = undefined;
  if (file.before) {
    before = file.before;
  }

  messages = file.messages;

  let message = await channel.messages
    .fetch({ limit: 1, before })
    .then((messagePage) => (messagePage.size === 1 ? messagePage.at(0) : null));

  while (message) {
    const batch = await channel.messages.fetch({
      limit: 100,
      before: message.id,
    });

    console.log(
      `Fetched ${batch.size} messages from ${message.id} to ${
        batch.at(batch.size - 1)!.id
      } [${messages.length} PAT messages]`
    );

    for (const [id, msg] of batch) {
      if (msg.author.id !== userId) continue;
      if (msg.type !== "REPLY") continue;

      let chain = [];
      let prev = msg;

      try {
        while (prev.reference) {
          const prevMsg = await prev.fetchReference();
          chain.push(prevMsg);
          prev = prevMsg;
        }
        if (chain.length > 0) {
          messages.push({ message: msg, chain });
        }
      } catch (e) {
        console.error(`Failed to fetch message ${prev.id}`);
        console.error(e);
      }
    }

    console.log(`Saving ${messages.length} messages...`);
    await fs.writeFile(
      `./${user.username}.json`,
      JSON.stringify({ messages, before: message.id }, null, 2),
      "utf8"
    );

    message = 0 < batch.size ? batch.at(batch.size - 1) : null;
  }
}
