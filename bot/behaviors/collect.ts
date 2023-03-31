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
  let before = undefined;
  let messages: { prompt: string; completion: string }[] = [];
  let totalWrites = 0;

  console.log(
    `Collect messages from ${user.username}#${user.discriminator} in ${channel.name}`
  );

  while (true) {
    const fetched: Collection<string, Message> = await channel.messages.fetch({
      limit: 100,
      before,
    });
    console.log("Fetched", fetched.lastKey(), messages.length);
    if (fetched.size == 0) break;

    // Progressively write out messages
    if (totalWrites++ % 10 == 0) {
      const filename = `./${user.username.replace(/[^a-zA-Z0-9]/g, "")}${
        user.discriminator
      }.json`;
      await fs.writeFile(filename, JSON.stringify(messages, null, 2));
      console.log("Wrote", messages.length, "messages to", filename);
    }

    before = fetched.lastKey();
    const fetchedMessages = fetched.filter(
      (m) => m.author.id == userId && !!m.reference?.messageId
    );

    for (const [key, message] of fetchedMessages) {
      const repliedMessage = await channel.messages.cache.get(
        message.reference?.messageId!
      );
      if (!repliedMessage) {
        continue;
      }

      messages.push({
        prompt: repliedMessage.content,
        completion: message.content,
      });
    }
  }
}
