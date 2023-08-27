import Command, { Permissions } from "~lib/command";
import { owner } from "~secret/discord.json";
import { collect } from "behaviors/collect";

const CollectCommand = Command({
  names: ["collect"],
  documentation: {
    description: "Pong!",
  },
  check: Permissions.user(owner),

  async exec(interaction) {
    await collect(interaction.client, interaction.user.id);
  },
});

export default CollectCommand;
