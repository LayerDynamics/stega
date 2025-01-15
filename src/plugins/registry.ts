export const PLUGIN_REGISTRY = {
    '@stega/core': {
        import: () => import('./core.ts'),
        version: '1.0.0'
    },
    '@stega/templates': {
        import: () => import('./templates.ts'),
        version: '1.0.0'
    }
} as const;

export type PluginKey = keyof typeof PLUGIN_REGISTRY;
