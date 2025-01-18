
        export default {
            metadata: {
                name: "TestPlugin",
                version: "1.0.0",
                description: "A test plugin",
                dependencies: []
            },
            init: (cli) => {
                cli.register({
                    name: "test",
                    description: "Test command",
                    action: () => {}
                });
            }
        };
    