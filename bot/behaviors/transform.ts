import { Client, Collection, Message, TextChannel } from "discord.js";
import { promises as fs } from "fs";

const GUILD_ID = "386585461285715968";

export async function transform(client: Client, userId: string) {
  const user = await client.users.fetch(userId);

  const { messages, before } = await fs
    .readFile(`./${user.username}.json`, "utf8")
    .then(JSON.parse);

  console.log(`Preparing ${messages.length} messages for fine-tuning...`);

  let content = "";

  const maxThread = new Map<string, number>();

  for (const thread of messages) {
    for (const msg of thread.chain) {
      maxThread.set(
        msg.id,
        Math.max(maxThread.get(msg.id) ?? 0, thread.chain.length)
      );
    }
  }

  for (const thread of messages) {
    const valid = thread.chain.every(
      (m: Message) => maxThread.get(m.id) === thread.chain.length
    );
    if (!valid) continue;

    console.log(`   ${thread.message.id}`);

    const response = {
      role: "assistant",
      content: `${userId}: ${thread.message.content}`,
    };

    let prompt = [];
    for (const message of thread.chain) {
      try {
        prompt.push({
          role: message.authorId === userId ? "assistant" : "user",
          content: `${message.authorId}: ${message.content}`,
        });
      } catch (e) {
        console.error(e);
      }
    }

    content +=
      JSON.stringify({
        messages: [...prompt.reverse(), response],
      }) + "\n";
  }

  await fs.writeFile(`./${user.username}-transformed.jsonl`, content, "utf8");
}
