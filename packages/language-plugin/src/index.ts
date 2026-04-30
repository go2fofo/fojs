import type { CodeInformation } from '@volar/language-core';
import type { SFCParseResult, Sfc, VueLanguagePlugin } from '@vue/language-core';

type CssExport = {
  id: string;
  lang: string;
  content: string;
  contentStart: number;
};

const allCodeFeatures: CodeInformation = {
  verification: true,
  completion: true,
  semantic: true,
  navigation: true,
  structure: true,
  format: true,
};

const cssExportCache = new WeakMap<Sfc, CssExport[]>();

function createFullScriptSfc(fileName: string, content: string): SFCParseResult {
  const lines = content.split(/\r?\n/g);
  const endLine = lines.length;
  const endColumn = lines[endLine - 1]?.length + 1;

  const loc = {
    source: content,
    start: { line: 1, column: 1, offset: 0 },
    end: { line: endLine, column: endColumn, offset: content.length },
  };

  const script = {
    type: 'script' as const,
    content,
    loc,
    attrs: { lang: 'tsx' as const },
    lang: 'tsx' as const,
  };

  return {
    descriptor: {
      filename: fileName,
      source: content,
      comments: [],
      template: null,
      script,
      scriptSetup: null,
      styles: [],
      customBlocks: [],
      cssVars: [],
      slotted: false,
      shouldForceReload: () => false,
    } as any,
    errors: [],
  };
}

function getDefaultInjectionHeader() {
  return [
    `import {`,
    `  ref, reactive, computed, watch, watchEffect,`,
    `  onMounted, onUnmounted, onUpdated,`,
    `  defineComponent, h, Fragment, Transition,`,
    `  useAttrs, useSlots, toRef, toRefs,`,
    `} from 'vue';`,
    `import type { ToRefs } from 'vue';`,
    ``,
    `declare function defineProps<T extends Record<string, any> = Record<string, any>>(defaults?: T): T;`,
    `declare function defineEmits<T extends (...args: any[]) => any = (...args: any[]) => any>(): T;`,
    ``,
    `declare function useFoStore<T extends Record<string, any>>(key?: string, init?: T | (() => T)): T;`,
    `declare function useFoEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;`,
    `declare function useVModel<T = any>(props: any, key: string): import('vue').ComputedRef<T>;`,
    ``,
    `declare function $ref<T>(value: T): import('vue').UnwrapRef<T>;`,
    `declare function $computed<T>(getter: () => T): T;`,
    `declare function $$<T = any>(value: T): T;`,
    ``,
  ].join('\n');
}

function findCssExports(source: string): CssExport[] {
  const results: CssExport[] = [];
  const re = /export\s+const\s+(css|style|scss|less)\s*=\s*`/g;

  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(source))) {
    const langRaw = match[1];
    const lang = langRaw === 'style' ? 'css' : langRaw;

    const startTickIndex = match.index + match[0].length - 1;
    if (source[startTickIndex] !== '`') continue;

    let j = startTickIndex + 1;
    let hasInterpolation = false;
    while (j < source.length) {
      const ch = source[j];
      if (ch === '\\') {
        j += 2;
        continue;
      }
      if (ch === '$' && source[j + 1] === '{') {
        hasInterpolation = true;
      }
      if (ch === '`') break;
      j++;
    }
    if (j >= source.length) continue;
    if (hasInterpolation) continue;

    const contentStart = startTickIndex + 1;
    const contentEnd = j;
    const content = source.slice(contentStart, contentEnd);

    results.push({
      id: `vfojs_css_${i++}`,
      lang,
      content,
      contentStart,
    });

    re.lastIndex = j + 1;
  }

  return results;
}

type Replacement = { start: number; end: number; newText: string };

function getWritableTsExpression(ts: any, node: any): any | undefined {
  let cur = node;
  while (true) {
    if (ts.isParenthesizedExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (ts.isNonNullExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (ts.isAsExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (ts.isTypeAssertionExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (typeof ts.isSatisfiesExpression === 'function' && ts.isSatisfiesExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    break;
  }

  if (ts.isIdentifier(cur) || ts.isPropertyAccessExpression(cur) || ts.isElementAccessExpression(cur)) {
    return cur;
  }
}

function applyReplacements(text: string, replacements: Replacement[]) {
  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  let out = text;
  for (const r of sorted) {
    out = out.slice(0, r.start) + r.newText + out.slice(r.end);
  }
  return out;
}

function wrapSetupReturnToRender(ts: any, sourceFile: any, sourceText: string, fnNode: any): string {
  const fnStart = fnNode.getStart(sourceFile);
  const fnEnd = fnNode.end;
  const local: Replacement[] = [];

  if (ts.isArrowFunction(fnNode) && !ts.isBlock(fnNode.body)) {
    const body = fnNode.body;
    if (!(ts.isArrowFunction(body) || ts.isFunctionExpression(body))) {
      const bodyStart = body.getStart(sourceFile);
      const bodyEnd = body.end;
      const bodyText = sourceText.slice(bodyStart, bodyEnd);
      local.push({
        start: bodyStart - fnStart,
        end: bodyEnd - fnStart,
        newText: `() => (${bodyText})`,
      });
    }
  }

  const visit = (node: any, currentFunction: any) => {
    if (ts.isFunctionLike(node) && node !== currentFunction) {
      ts.forEachChild(node, (c: any) => visit(c, node));
      return;
    }

    if (ts.isReturnStatement(node) && currentFunction === fnNode) {
      const expr = node.expression;
      if (expr && !(ts.isArrowFunction(expr) || ts.isFunctionExpression(expr))) {
        const exprStart = expr.getStart(sourceFile);
        const exprEnd = expr.end;
        const exprText = sourceText.slice(exprStart, exprEnd);
        local.push({
          start: exprStart - fnStart,
          end: exprEnd - fnStart,
          newText: `() => (${exprText})`,
        });
      }
    }

    ts.forEachChild(node, (c: any) => visit(c, currentFunction));
  };
  visit(fnNode, fnNode);

  return applyReplacements(sourceText.slice(fnStart, fnEnd), local);
}

function collectReplacements(ts: any, sourceFile: any, sourceText: string): Replacement[] {
  const replacements: Replacement[] = [];

  function record(start: number, end: number, newText: string) {
    if (start >= 0 && end >= start) replacements.push({ start, end, newText });
  }

  function visit(node: any) {
    if (ts.isVariableDeclaration(node)) {
      if (
        ts.isObjectBindingPattern(node.name) &&
        node.initializer &&
        ts.isIdentifier(node.initializer) &&
        node.initializer.text === 'props'
      ) {
        record(node.initializer.getStart(sourceFile), node.initializer.end, 'toRefs(props)');
      }
    }

    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      const exprNode = node.expression;
      const exprText =
        ts.isArrowFunction(exprNode) || ts.isFunctionExpression(exprNode)
          ? wrapSetupReturnToRender(ts, sourceFile, sourceText, exprNode)
          : sourceText.slice(exprNode.getStart(sourceFile), exprNode.end);
      const newText =
        `const __vfojs__setup = ${exprText};\n` +
        `export default defineComponent({ setup: __vfojs__setup as any });`;
      record(node.getStart(sourceFile), node.end, newText);
    }

    if (ts.isFunctionDeclaration(node) && node.modifiers?.some((m: any) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
      const transformedFullText = wrapSetupReturnToRender(ts, sourceFile, sourceText, node);
      const functionIndex = transformedFullText.indexOf('function');
      if (functionIndex >= 0) {
        const functionExprText = transformedFullText.slice(functionIndex);
        const newText =
          `const __vfojs__setup = ${functionExprText};\n` +
          `export default defineComponent({ setup: __vfojs__setup as any });`;
        record(node.getStart(sourceFile), node.end, newText);
      }
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name;
      const attrName = ts.isIdentifier(name) ? name.text : undefined;
      if (attrName === '$value') {
        const openingElement = node.parent?.parent;
        const tagName = openingElement?.tagName;
        const tagText =
          tagName && ts.isIdentifier(tagName)
            ? tagName.text
            : undefined;
        const isIntrinsic = !!tagText && tagText[0] === tagText[0].toLowerCase();

        const initializer = node.initializer;
        const expr = initializer && ts.isJsxExpression(initializer) ? initializer.expression : undefined;
        const exprText = expr ? sourceText.slice(expr.getStart(sourceFile), expr.end) : 'undefined';
        const writableExpr = expr ? getWritableTsExpression(ts, expr) : undefined;
        const targetText = writableExpr ? sourceText.slice(writableExpr.getStart(sourceFile), writableExpr.end) : exprText;

        let updateHandler = `() => {}`;
        if (expr && writableExpr) {
          if (isIntrinsic) {
            const attrs = openingElement.attributes?.properties ?? [];
            let inputType: string | undefined;
            for (const a of attrs) {
              if (ts.isJsxAttribute(a) && ts.isIdentifier(a.name) && a.name.text === 'type') {
                const init = a.initializer;
                if (init && ts.isStringLiteral(init)) inputType = init.text;
                if (init && ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)) {
                  inputType = init.expression.text;
                }
              }
            }

            inputType = inputType?.toLowerCase();
            const isCheckbox = tagText === 'input' && inputType === 'checkbox';
            const isRadio = tagText === 'input' && inputType === 'radio';
            const readProp = (isCheckbox || isRadio) ? 'checked' : 'value';
            updateHandler = `(e: any) => (${targetText} = (e?.target as any)?.${readProp})`;
          } else {
            updateHandler = `(v: any) => (${targetText} = v)`;
          }
        }

        let newText: string;
        if (isIntrinsic) {
          let valueProp = 'value';
          let eventProp = 'onInput';
          if (tagText === 'input') {
            const attrs = openingElement.attributes?.properties ?? [];
            let inputType: string | undefined;
            for (const a of attrs) {
              if (ts.isJsxAttribute(a) && ts.isIdentifier(a.name) && a.name.text === 'type') {
                const init = a.initializer;
                if (init && ts.isStringLiteral(init)) inputType = init.text;
                if (init && ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)) {
                  inputType = init.expression.text;
                }
              }
            }
            inputType = inputType?.toLowerCase();
            const isCheckbox = inputType === 'checkbox';
            const isRadio = inputType === 'radio';
            if (isCheckbox || isRadio) {
              valueProp = 'checked';
              eventProp = 'onChange';
            }
          } else if (tagText === 'select') {
            eventProp = 'onChange';
          }
          newText = `${valueProp}={${exprText}} ${eventProp}={${updateHandler}}`;
        } else {
          newText = `modelValue={${exprText}} onUpdate:modelValue={${updateHandler}}`;
        }

        record(node.getStart(sourceFile), node.end, newText);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  replacements.sort((a, b) => a.start - b.start);
  const nonOverlapping: Replacement[] = [];
  let lastEnd = -1;
  for (const r of replacements) {
    if (r.start >= lastEnd) {
      nonOverlapping.push(r);
      lastEnd = r.end;
    }
  }
  return nonOverlapping;
}

function buildVirtualScriptContent(ts: any, sfc: Sfc) {
  const sourceName = sfc.script?.name ?? 'script';
  const sourceText = sfc.script?.content ?? sfc.content;
  const sourceFile = ts.createSourceFile(
    sfc.script?.name ?? 'vfojs.vfo',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const replacements = collectReplacements(ts, sourceFile, sourceText);
  const codes: any[] = [];

  codes.push(getDefaultInjectionHeader());

  let pos = 0;
  for (const r of replacements) {
    if (r.start > pos) {
      const chunk = sourceText.slice(pos, r.start);
      codes.push([chunk, sourceName, pos, allCodeFeatures]);
    }
    codes.push(r.newText);
    pos = r.end;
  }
  if (pos < sourceText.length) {
    const chunk = sourceText.slice(pos);
    codes.push([chunk, sourceName, pos, allCodeFeatures]);
  }

  return codes;
}

export const createVfojsLanguagePlugin: VueLanguagePlugin = (ctx) => {
  const ts = ctx.modules.typescript as any;

  const parserPlugin = {
    version: 2.2 as const,
    name: 'vfojs-parser',
    order: -1,

    getLanguageId(fileName: string) {
      if (fileName.endsWith('.vfo')) return 'vue';
    },

    isValidFile(fileName: string, languageId: string) {
      return languageId === 'vue' && fileName.endsWith('.vfo');
    },

    parseSFC2(fileName: string, languageId: string, content: string) {
      if (languageId !== 'vue') return;
      if (!fileName.endsWith('.vfo')) return;
      return createFullScriptSfc(fileName, content);
    },

    getEmbeddedCodes(fileName: string, sfc: Sfc) {
      if (!fileName.endsWith('.vfo')) return [];
      const cssExports = findCssExports(sfc.content);
      cssExportCache.set(sfc, cssExports);
      return cssExports.map(e => ({ id: e.id, lang: e.lang }));
    },

    resolveEmbeddedCode(fileName: string, sfc: Sfc, embeddedFile: any) {
      if (!fileName.endsWith('.vfo')) return;

      const cssExports = cssExportCache.get(sfc) ?? findCssExports(sfc.content);
      const css = cssExports.find(e => e.id === embeddedFile.id);
      if (css) {
        const sourceName = sfc.script?.name ?? 'script';
        embeddedFile.content.push([css.content, sourceName, css.contentStart, allCodeFeatures]);
      }
    },
  };

  const scriptPlugin = {
    version: 2.2 as const,
    name: 'vfojs-script',
    order: 1,

    resolveEmbeddedCode(fileName: string, sfc: Sfc, embeddedFile: any) {
      if (!fileName.endsWith('.vfo')) return;

      if (/^script_(js|jsx|ts|tsx)$/.test(embeddedFile.id)) {
        embeddedFile.content = buildVirtualScriptContent(ts, sfc);
      }
    },
  };

  return [parserPlugin as any, scriptPlugin as any];
};

export default createVfojsLanguagePlugin;
