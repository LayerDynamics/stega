// plugins/sample-plugin.ts
import {Plugin} from "../plugin.ts";
import {Command} from "../core/core.ts";

const samplePlugin: Plugin={
  init: (cli) => {
    const newCommand: Command = {
      name: "plugincmd",
      description: "Command added by sample plugin",
      action: () => {
        console.log("Plugin command executed.");
      },
    };
    cli.register(newCommand);
  },
  metadata: {
    name: "Sample Plugin",
    version: ""
  }
};

export default samplePlugin;
