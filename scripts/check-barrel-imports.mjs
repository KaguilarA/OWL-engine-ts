import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

/**
 * Validates barrel-only local imports and grouped import declarations.
 * @class BarrelImportChecker
 */
export default new class {
  errors = [];

  /**
   * Runs the command-line validation after the anonymous checker is initialized.
   * @constructor
   * @returns {void}
   */
  constructor() {
    this.run();
  }

  /**
   * Checks the source tree and reports violations with file locations.
   * @returns {void}
   */
  run() {
    this.errors = [];
    this.inspect(resolve('src'));
    if (this.errors.length) {
      process.stderr.write(`${this.errors.join('\n')}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write('All local TypeScript imports use barrels; no duplicate import declarations.\n');
    }
  }

  /**
   * Inspects imports in each TypeScript file below a directory.
   * @param {string} folder Absolute directory path to inspect.
   * @returns {void}
   */
  inspect(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = join(folder, entry.name);
      if (entry.isDirectory()) { this.inspect(file); continue; }
      if (extname(file) !== '.ts' || basename(file) === 'index.ts') continue;
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const enginePath = resolve('src/engine');
      const interfacesPath = resolve('src/engine/interfaces');
      if (file.startsWith(enginePath) && !file.endsWith('.test.ts')) {
        const declarations = source.statements.filter(ts.isInterfaceDeclaration);
        for (const declaration of declarations) {
          const location = source.getLineAndCharacterOfPosition(declaration.getStart(source));
          if (dirname(file) !== interfacesPath) {
            this.errors.push(`${relative(process.cwd(), file)}:${location.line + 1}: Engine interfaces belong in src/engine/interfaces.`);
          } else {
            const barrel = readFileSync(join(interfacesPath, 'index.ts'), 'utf8');
            const exported = declaration.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
            const name = declaration.name.text;
            const barrelExport = new RegExp(`export type \\{[^}]*\\b${name}\\b[^}]*\\} from '\\./${basename(file, '.ts')}';`);
            if (!exported || !barrelExport.test(barrel)) {
              this.errors.push(`${relative(process.cwd(), file)}:${location.line + 1}: Export ${name} through src/engine/interfaces/index.ts.`);
            }
          }
        }
      }
      const imports = new Set();
      const reportDeclaration = (node, message) => {
        const location = source.getLineAndCharacterOfPosition(node.getStart(source));
        this.errors.push(`${relative(process.cwd(), file)}:${location.line + 1}: ${message}`);
      };
      if (!file.endsWith('.test.ts')) {
        for (const declaration of source.statements) {
          if (!ts.isClassDeclaration(declaration) && !ts.isFunctionDeclaration(declaration)) continue;
          const exported = declaration.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
          const isDefault = declaration.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword);
          if (exported && (declaration.name || !isDefault)) {
            reportDeclaration(declaration, 'Export an anonymous default class or function; assign its public name in the barrel.');
          }
          if (!exported && declaration.name) {
            const localName = declaration.name.text;
            const exportedThroughAssignment = source.statements.some(statement => ts.isExportAssignment(statement)
              && new RegExp(`\\b${localName}\\b`).test(statement.expression.getText(source)));
            if (exportedThroughAssignment) {
              reportDeclaration(declaration, 'Use an anonymous class or function for the default export.');
            }
          }
        }
      }
      const check = (specifier, node, declaration = false) => {
        const location = source.getLineAndCharacterOfPosition(node.getStart(source));
        const report = (message) => this.errors.push(`${relative(process.cwd(), file)}:${location.line + 1}: ${message}`);
        if (declaration) {
          if (imports.has(specifier)) report(`Group imports from '${specifier}' into one declaration.`);
          imports.add(specifier);
        }
        if (!specifier.startsWith('.')) return;
        const target = resolve(dirname(file), specifier);
        const implementation = extname(target) === '.ts' ? target : `${target}.ts`;
        if (existsSync(implementation) && statSync(implementation).isFile()
          && basename(implementation) !== 'index.ts') {
          report(`Import '${specifier}' through its directory barrel.`);
        }
      }
      function visit(node) {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          check(node.moduleSpecifier.text, node, true);
        }
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
          && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
          check(node.arguments[0].text, node);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
}();
