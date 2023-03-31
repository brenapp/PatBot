import { Client, Message, TextChannel } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import { token as OPENAI_TOKEN, model } from "~secret/openai.json";

const configuration = new Configuration({
  apiKey: OPENAI_TOKEN,
});

const openai = new OpenAIApi(configuration);

export default async function respond(client: Client, message: Message) {
  const prompt = message.content + "\n\n###\n\n";

  const completion = await openai.createCompletion({
    model,
    prompt,
  });

  // Remove everything after END
  for (const choice of completion.data.choices) {
    if (!choice.text) continue;
    const end = choice.text.indexOf("END");

    let text = "";
    if (end != -1) {
      text = choice.text.substring(0, end);
    } else {
      text = choice.text;
    }

    message.reply(text);
  }
}
