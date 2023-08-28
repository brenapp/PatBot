import { Client, Message, TextChannel } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import { token as OPENAI_TOKEN, model } from "~secret/openai.json";

const configuration = new Configuration({
  apiKey: OPENAI_TOKEN,
});

const openai = new OpenAIApi(configuration);

export default async function respond(client: Client, message: Message) {
  const prompt = message.content;

  let chain = [];
  let prev = message;

  let start = performance.now();

  try {
    while (prev.reference) {
      const prevMsg = await prev.fetchReference();
      chain.push(prevMsg);
      prev = prevMsg;
    }
  } catch (e) {
    console.error(`Failed to fetch message ${prev.id}`);
    console.error(e);
  }

  const messages = [
    ...chain.reverse().map((msg) => {
      return {
        content: msg.content,
        role: msg.author.id === client.user!.id ? "assistant" : "user",
      } as const;
    }),
    {
      content: prompt,
      role: "user",
    } as const,
  ];

  let collectMessages = performance.now();
  console.log(`Collect messages: ${collectMessages - start}ms`);

  message.channel.sendTyping();

  const completion = await openai.createChatCompletion({
    model,
    messages,
  });

  let complete = performance.now();

  console.log(`OpenAI: ${complete - collectMessages}ms`);
  console.log(`Complete: ${complete - collectMessages}ms`);

  console.log(messages, completion.data.choices);

  // Remove everything after END
  for (const choice of completion.data.choices) {
    if (!choice.message) continue;

    // Split message into groups of at most 2000 characters
    const split = choice.message.content.split(" ");
    const groups = [];

    let group = "";
    for (const word of split) {
      if (group.length + word.length + 1 > 2000) {
        groups.push(group);
        group = "";
      }
      group += `${word} `;
    }

    groups.push(group);

    for (const group of groups) {
      if (group.length > 0) {
        try {
          await message.reply(group);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}
