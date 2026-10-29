import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

/**
 * Checks JSDoc coverage, multiline formatting, and callable parameter and return tags.
 * @class JSDocChecker
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
   * Validates the source tree and reports actionable file locations.
   * @returns {void}
   */
  run() {
    this.errors = [];
    this.checkDirectory(resolve('src'));
    if (this.errors.length) {
      process.stderr.write(`${this.errors.join('\n')}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write('Production declarations have multiline JSDoc with parameter and return tags.\n');
    }
  }

  /**
   * Visits TypeScript sources in a directory and its descendants.
   * @param {string} directory Absolute path to the directory being inspected.
   * @returns {void}
   */
  checkDirectory(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) this.checkDirectory(path);
      else if (extname(path) === '.ts') this.checkSource(path);
    }
  }

  /**
   * Inspects actual comment tokens without treating strings as documentation.
   * @param {string} path Absolute path to the TypeScript source file.
   * @returns {void}
   */
  checkSource(path) {
    const text = readFileSync(path, 'utf8');
    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text);
    for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
      if (token !== ts.SyntaxKind.MultiLineCommentTrivia) continue;
      const comment = scanner.getTokenText();
      if (!comment.startsWith('/**') || comment.includes('\n')) continue;
      const position = source.getLineAndCharacterOfPosition(scanner.getTokenPos());
      this.errors.push(`${relative(process.cwd(), path)}:${position.line + 1}: Use multiline JSDoc with the applicable tags.`);
    }
    if (!path.endsWith('.test.ts') && !path.endsWith('index.ts')
      && !path.replaceAll('\\', '/').includes('/test-support/')) {
      this.checkDeclarations(path, source);
    }
  }

  /**
   * Requires documentation for production declarations and their callable contracts.
   * Test bodies, import declarations, local variables, and barrel exports are not API declarations.
   * @param {string} path Absolute path used when reporting a violation.
   * @param {ts.SourceFile} source Parsed source with parent links enabled.
   * @returns {void}
   */
  checkDeclarations(path, source) {
    const report = (node, message) => {
      const position = source.getLineAndCharacterOfPosition(node.getStart(source));
      this.errors.push(`${relative(process.cwd(), path)}:${position.line + 1}: ${message}`);
    };
    const visit = node => {
      const callable = ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)
        || ts.isMethodSignature(node) || ts.isConstructorDeclaration(node)
        || ts.isGetAccessor(node) || ts.isSetAccessor(node);
      const declaration = callable || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)
        || ts.isTypeAliasDeclaration(node) || ts.isPropertyDeclaration(node)
        || ts.isPropertySignature(node) || (ts.isVariableStatement(node) && ts.isSourceFile(node.parent));
      if (declaration) {
        const doc = node.jsDoc?.at(-1);
        if (!doc || !ts.getTextOfJSDocComment(doc.comment)?.trim()) {
          report(node, 'Add multiline JSDoc explaining the declaration responsibility.');
        }
        if (callable && doc) {
          const tags = doc.tags ?? [];
          const documented = new Set(tags.filter(ts.isJSDocParameterTag).map(tag => tag.name.getText(source)));
          for (const parameter of node.parameters) {
            if (ts.isIdentifier(parameter.name) && parameter.name.text !== 'this'
              && !documented.has(parameter.name.text)) {
              report(node, `Document parameter ${parameter.name.text} with @param.`);
            }
          }
          if (!tags.some(tag => tag.tagName.text === 'returns' || tag.tagName.text === 'return')) {
            report(node, 'Document the return value with @returns, including void.');
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}();
