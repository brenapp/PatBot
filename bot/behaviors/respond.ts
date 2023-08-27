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

  message.channel.sendTyping();

  const completion = await openai.createChatCompletion({
    model,
    messages,
  });

  let complete = performance.now();

  console.log(`Collect messages: ${collectMessages - start}ms`);
  console.log(`OpenAI: ${complete - collectMessages}ms`);
  console.log(`Complete: ${complete - collectMessages}ms`);

  // Remove everything after END
  for (const choice of completion.data.choices) {
    if (!choice.message) continue;
    message.reply(choice.message);
  }
}
