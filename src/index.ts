import path from 'path'
import { transformSync } from '@babel/core'
import { readFileSync, writeFileSync } from 'fs'
import babelPresetTypescript from '@babel/preset-typescript'
import babelPluginTransformModulesCommonjs from '@babel/plugin-transform-modules-commonjs'
import babelPluginTransformModulesUMD from '@babel/plugin-transform-modules-umd'
import babelPluginTransformModulesAMD from '@babel/plugin-transform-modules-amd'
import babelPluginTransformModulesSystemjs from '@babel/plugin-transform-modules-systemjs'
import minimatch from 'minimatch'
import globby from 'globby'
import { PluginOptions, ModuleType, BabelPluginsParams } from './types'

export class GenerateModulesWebpackPlugin {
    private options: PluginOptions[]

    private babelPluginsParams: BabelPluginsParams = {
        commonjs: {
            plugin: babelPluginTransformModulesCommonjs,
            ext: '.common.js',
        },
        umd: {
            plugin: babelPluginTransformModulesUMD,
            ext: '.umd.js',
        },
        amd: {
            plugin: babelPluginTransformModulesAMD,
            ext: '.amd.js',
        },
        systemjs: {
            plugin: babelPluginTransformModulesSystemjs,
            ext: '.system.js',
        },
    }

    public constructor(options: PluginOptions | PluginOptions[]) {
        this.options = Array.isArray(options) ? options : [options]
    }

    private apply(compiler) {
        const { cwd } = process
        const { options, btfs } = this
        this.transformFiles(globby.sync(options.map(({ pattern }) => pattern)))
        compiler.hooks.watchRun.tap('WatchRun', (comp) => {
            if (comp.modifiedFiles) {
                const modifiedFiles: string[] = Array.from(comp.modifiedFiles)
                modifiedFiles.forEach((modifiedFile) => {
                    const patternOptions = options.find(({ pattern }) => {
                        const target = btfs(path.normalize(modifiedFile))
                        const resolvedPattern = btfs(path.resolve(cwd(), pattern))
                        return minimatch(target, resolvedPattern)
                    })
                    if (patternOptions) {
                        this.transformModules(modifiedFile, patternOptions)
                    }
                })
            }
        })
    }

    private btfs(path: string): string {
        return path.replace(/\\/g, '/')
    }

    private transformFiles(files: string[]) {
        const { options } = this
        files.forEach((file) => {
            const patternOptions = options.find(({ pattern }) => minimatch(file, pattern))
            if (patternOptions) {
                this.transformModules(file, patternOptions)
            }
        })
    }

    private transformModules(filepath: string, { into }: PluginOptions) {
        try {
            const moduleTypes = typeof into === 'string' ? [into] : into
            const { dir, name, base } = path.parse(filepath)
            const fileContent = readFileSync(filepath, { encoding: 'utf8' })
            Object.entries(this.babelPluginsParams)
                .filter(([type]) => moduleTypes.includes(type as ModuleType))
                .forEach(([_, { plugin, ext }]) => {
                    const transformedFileContent = transformSync(fileContent, {
                        presets: [babelPresetTypescript],
                        plugins: [plugin],
                        filename: base,
                    }).code
                    const contentWithComments = `/**
 * This file is auto-generated by GenerateModulesWebpackPlugin.
 * Check this file into source control.
 * Do not edit this file.
 */\n${transformedFileContent}\n/* End of auto-generated content. */\n`
                    writeFileSync(path.join(dir, name) + ext, contentWithComments)
                })
        } catch (e) {
            console.error(`TransformModulesWebpackPlugin: Couldn't transform module (${filepath}) - ${e.message}`)
        }
    }
}

module.exports = GenerateModulesWebpackPlugin
