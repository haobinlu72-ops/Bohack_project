import type * as ts from 'typescript';
import type { RawVueCompilerOptions, VueCompilerOptions, VueLanguagePlugin } from './types';
export interface ParsedCommandLine extends Omit<ts.ParsedCommandLine, 'fileNames'> {
    vueOptions: VueCompilerOptions;
}
export declare const createParsedCommandLineByJson: (ts: typeof import("typescript"), host: Omit<ts.ParseConfigHost, "readDirectory">, rootDir: string, json: any, configFileName?: string | undefined) => ParsedCommandLine;
export declare const createParsedCommandLine: (ts: typeof import("typescript"), host: Omit<ts.ParseConfigHost, "readDirectory">, configFileName: string) => ParsedCommandLine;
export declare class CompilerOptionsResolver {
    fileExists?: ((path: string) => boolean) | undefined;
    options: Omit<RawVueCompilerOptions, 'target' | 'globalTypesPath' | 'plugins'>;
    target: number | undefined;
    globalTypesPath: string | undefined;
    plugins: VueLanguagePlugin[];
    constructor(fileExists?: ((path: string) => boolean) | undefined);
    addConfig(options: RawVueCompilerOptions, rootDir: string): void;
    build(defaults?: VueCompilerOptions): VueCompilerOptions;
    private findNodeModulesRoot;
}
export declare function getDefaultCompilerOptions(target?: number, lib?: string, strictTemplates?: boolean): VueCompilerOptions;
export declare function createGlobalTypesWriter(vueOptions: VueCompilerOptions, writeFile: (fileName: string, data: string) => void): (fileName: string) => string | void;
/**
 * @deprecated use `createGlobalTypesWriter` instead
 */
export declare function writeGlobalTypes(vueOptions: VueCompilerOptions, writeFile: (fileName: string, data: string) => void): void;
