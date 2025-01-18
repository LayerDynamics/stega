
        export default {
            metadata: {
                name: "DependentPlugin",
                version: "1.0.0",
                description: "A plugin that depends on TestPlugin",
                dependencies: ["TestPlugin"]
            },
            init: (cli) => {
                cli.register({
                    name: "dependent",
                    description: "Dependent command",
                    action: () => {}
                });
            }
        };
    