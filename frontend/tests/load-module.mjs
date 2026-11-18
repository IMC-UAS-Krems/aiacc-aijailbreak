// Test the actual TypeScript source using the compiler already used by the app.
// These two leaf modules have no runtime imports, so an in-memory module suffices.
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

export async function loadModule(name) {
  const source = await readFile(new URL(`../src/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
