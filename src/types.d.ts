export type ModuleType = 'commonjs' | 'umd' | 'amd' | 'systemjs'
export interface PluginOptions {
    into: ModuleType | ModuleType[]
    pattern: string
}
export type BabelPluginsParams = {
    [key in ModuleType]: {
        plugin: any
        ext: string
    }
}
