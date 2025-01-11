// plugins/sample-plugin.ts
import {Plugin} from "../src/plugin.ts";
import {Command} from "../src/core.ts";

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
