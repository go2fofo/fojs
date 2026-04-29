// @ts-ignore
import type { PluginObj } from '@babel/core';
// @ts-ignore
import * as t from '@babel/types';

/**
 * fojs 的 Babel 插件：
 * - 将 `export default () => { ... }` 包装为 `defineComponent({ setup })`
 * - 将 `return <div />` 这种 JSX 返回值转换为 `return () => <div />`（Vue Render Function）
 * - 支持响应式解构：`const { a } = props` 转为可写的 ref（支持跨组件双向绑定）
 * - 支持指令语法糖：`<input $value={x} />` 转为 `modelValue/onUpdate:modelValue`
 * - 支持 Scoped CSS：提取 `export const css = \`...\`` 并注入到页面，同时给根节点挂载作用域类名
 * - 支持属性透传：将 attrs 合并到根节点，确保 class/style/id 等行为稳定可控
 */
export default function babelPluginFojs(): PluginObj {
  const FOJS_MAIN = '__fojs_main';
  const FOJS_SCOPE_CLASS = '__fojs_scope_class';
  const FOJS_ATTRS = '__fojs_attrs';

  /**
   * 生成一个稳定的短哈希（用于作用域类名与 HMR id 的稳定性）
   */
  const hash32 = (input: string) => {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  };

  /**
   * 根据文件路径生成 Scoped CSS 的作用域类名
   */
  const getScopeClassByFilename = (filename: string | undefined) => {
    const base = filename || 'fojs';
    return `fo-s-${hash32(base)}`;
  };

  /**
   * 提取无插值模板字符串的文本内容（如果包含插值表达式则返回 null）
   */
  const getTemplateLiteralText = (tpl: t.TemplateLiteral) => {
    if (tpl.expressions.length > 0) return null;
    return tpl.quasis.map(q => q.value.cooked ?? '').join('');
  };

  let scopedCssText: string | null = null;
  let scopeClassName: string | null = null;
  let usedComponentNames = new Set<string>();

  const isNativeTagName = (name: string) => {
    const c = name[0] || '';
    return c >= 'a' && c <= 'z';
  };

  const ensureBlockBody = (fn: t.ArrowFunctionExpression | t.FunctionExpression) => {
    if (t.isBlockStatement(fn.body)) return;
    fn.body = t.blockStatement([t.returnStatement(fn.body as any)]);
  };

  const injectSetupPreamble = (
    fn: t.ArrowFunctionExpression | t.FunctionExpression,
    options?: { 将Props映射到Attrs?: boolean; 原参数?: any; 原Ctx参数?: any },
  ) => {
    ensureBlockBody(fn);
    const body = fn.body as t.BlockStatement;
    const stmts = body.body;

    const findAttrsDeclIndex = () => {
      for (let i = 0; i < stmts.length; i++) {
        const s = stmts[i];
        if (!t.isVariableDeclaration(s)) continue;
        for (const d of s.declarations) {
          if (!t.isVariableDeclarator(d)) continue;
          if (t.isIdentifier(d.id) && d.id.name === FOJS_ATTRS) return i;
        }
      }
      return -1;
    };

    let attrsIndex = findAttrsDeclIndex();
    if (attrsIndex === -1) {
      stmts.unshift(
        t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier(FOJS_ATTRS),
            t.callExpression(t.identifier('useAttrs'), []),
          ),
        ]),
      );
      attrsIndex = 0;
    }

    if (!options?.将Props映射到Attrs) return;

    const hasBinding = (name: string) => {
      return stmts.some(s => {
        return (
          t.isVariableDeclaration(s) &&
          s.declarations.some(d => t.isVariableDeclarator(d) && t.isIdentifier(d.id) && d.id.name === name)
        );
      });
    };

    const normalizePattern = (p: any): any | null => {
      if (!p) return null;
      if (t.isAssignmentPattern(p)) return p.left as any;
      if (t.isIdentifier(p) || t.isObjectPattern(p) || t.isArrayPattern(p) || t.isRestElement(p)) return p;
      return null;
    };

    const inserts: t.Statement[] = [];
    if (!hasBinding('props')) {
      inserts.push(
        t.variableDeclaration('const', [
          t.variableDeclarator(t.identifier('props'), t.identifier(FOJS_ATTRS)),
        ]),
      );
    }

    const rawProps = normalizePattern(options?.原参数);
    if (rawProps) {
      if (t.isIdentifier(rawProps)) {
        const rawName = rawProps.name;
        if (rawName !== 'props' && rawName !== FOJS_ATTRS && !hasBinding(rawName)) {
          inserts.push(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(rawName), t.identifier('props')),
            ]),
          );
        }
      } else if (t.isObjectPattern(rawProps) || t.isArrayPattern(rawProps)) {
        inserts.push(
          t.variableDeclaration('const', [
            t.variableDeclarator(rawProps as any, t.identifier('props')),
          ]),
        );
      }
    }

    const rawCtx = normalizePattern(options?.原Ctx参数);
    if (rawCtx) {
      if (!hasBinding('ctx')) {
        inserts.push(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('ctx'),
              t.objectExpression([
                t.objectProperty(t.identifier('slots'), t.callExpression(t.identifier('useSlots'), [])),
                t.objectProperty(t.identifier('attrs'), t.identifier(FOJS_ATTRS)),
              ]),
            ),
          ]),
        );
      }

      if (t.isIdentifier(rawCtx)) {
        const rawName = rawCtx.name;
        if (rawName !== 'ctx' && rawName !== FOJS_ATTRS && !hasBinding(rawName)) {
          inserts.push(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(rawName), t.identifier('ctx')),
            ]),
          );
        }
      } else if (t.isObjectPattern(rawCtx) || t.isArrayPattern(rawCtx)) {
        inserts.push(
          t.variableDeclaration('const', [
            t.variableDeclarator(rawCtx as any, t.identifier('ctx')),
          ]),
        );
      }
    }

    if (inserts.length > 0) {
      stmts.splice(attrsIndex + 1, 0, ...inserts);
    }
  };

  const wrapReturnToRender = (fnPath: any, fnNode: t.Node) => {
    fnPath.traverse({
      ReturnStatement(returnPath: any) {
        const functionParent = returnPath.getFunctionParent();
        if (!functionParent || functionParent.node !== fnNode) return;

        const arg = returnPath.node.argument;
        if (!arg) return;
        if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) return;

        let vnodeExpr: t.Expression = arg;

        if (scopedCssText) {
          vnodeExpr = t.callExpression(t.identifier('__fojs__attachScope'), [
            vnodeExpr,
            t.identifier(FOJS_SCOPE_CLASS),
          ]);
        }

        vnodeExpr = t.callExpression(t.identifier('__fojs__applyAttrs'), [
          vnodeExpr,
          t.identifier(FOJS_ATTRS),
        ]);

        returnPath.node.argument = t.arrowFunctionExpression([], vnodeExpr);
      },
    });
  };

  return {
    name: 'babel-plugin-fojs',
    visitor: {
      Program: {
        enter(path, state: any) {
          scopedCssText = null;
          scopeClassName = getScopeClassByFilename(state?.file?.opts?.filename);
          usedComponentNames = new Set<string>();

          path.traverse({
            JSXOpeningElement(p: any) {
              const n = p.node.name;
              if (!t.isJSXIdentifier(n)) return;
              if (!n.name) return;
              if (isNativeTagName(n.name)) return;
              usedComponentNames.add(n.name);
            },
          });
        },
        exit(path) {
          if (!scopedCssText || !scopeClassName) return;

          const cssText = scopedCssText;
          const scopeClass = scopeClassName;

          const scopeDecl = t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier(FOJS_SCOPE_CLASS), t.stringLiteral(scopeClass)),
          ]);

          const cssDecl = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('__fojs_scoped_css'),
              t.stringLiteral(cssText),
            ),
          ]);

          const injectCall = t.expressionStatement(
            t.callExpression(t.identifier('__fojs__injectStyle'), [
              t.identifier(FOJS_SCOPE_CLASS),
              t.identifier('__fojs_scoped_css'),
            ]),
          );

          const body = path.node.body;
          let insertIndex = 0;
          while (insertIndex < body.length && t.isImportDeclaration(body[insertIndex])) insertIndex++;
          body.splice(insertIndex, 0, scopeDecl, cssDecl, injectCall);
        },
      },

      ExportNamedDeclaration(path) {
        const decl = path.node.declaration;
        if (!decl || !t.isVariableDeclaration(decl)) return;

        const only = decl.declarations.length === 1 ? decl.declarations[0] : null;
        if (!only || !t.isVariableDeclarator(only)) return;
        if (!t.isIdentifier(only.id)) return;

        const name = only.id.name;
        if (name !== 'css' && name !== 'style') return;
        if (!only.init || !t.isTemplateLiteral(only.init)) return;

        const text = getTemplateLiteralText(only.init);
        if (text == null) return;

        scopedCssText = text;
        path.remove();
      },

      VariableDeclaration(path) {
        const decls = path.node.declarations;
        const replacements: t.Statement[] = [];
        let changed = false;

        for (const d of decls) {
          if (!t.isVariableDeclarator(d)) continue;
          if (!t.isObjectPattern(d.id)) continue;
          if (!d.init || !t.isIdentifier(d.init) || d.init.name !== 'props') continue;

          for (const p of d.id.properties) {
            if (t.isRestElement(p)) continue;
            if (!t.isObjectProperty(p)) continue;

            const key = p.key;
            const value = p.value;

            if (!t.isIdentifier(key)) continue;

            if (t.isIdentifier(value)) {
              replacements.push(
                t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier(value.name),
                    t.callExpression(t.identifier('__fojs__toModelRef'), [
                      t.identifier('props'),
                      t.stringLiteral(key.name),
                    ]),
                  ),
                ]),
              );
              changed = true;
              continue;
            }

            if (t.isAssignmentPattern(value) && t.isIdentifier(value.left)) {
              replacements.push(
                t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier(value.left.name),
                    t.callExpression(t.identifier('__fojs__toModelRef'), [
                      t.identifier('props'),
                      t.stringLiteral(key.name),
                    ]),
                  ),
                ]),
              );
              changed = true;
              continue;
            }
          }
        }

        if (!changed) return;

        if (decls.length === 1) {
          path.replaceWithMultiple(replacements);
          return;
        }

        const remain = decls.filter(d => {
          if (!t.isVariableDeclarator(d)) return true;
          if (!t.isObjectPattern(d.id)) return true;
          if (!d.init || !t.isIdentifier(d.init) || d.init.name !== 'props') return true;
          return false;
        });

        const remainStmt = remain.length > 0 ? t.variableDeclaration(path.node.kind, remain) : null;
        path.replaceWithMultiple([...(remainStmt ? [remainStmt] : []), ...replacements]);
      },

      VariableDeclarator(path: any) {
        const id = path.node.id;
        const init = path.node.init;
        if (!t.isIdentifier(id)) return;
        if (!usedComponentNames.has(id.name)) return;

        const decl = path.parentPath;
        const stmt = decl?.parentPath;
        if (!stmt || !stmt.isProgram?.()) return;

        if (!init) return;
        if (t.isCallExpression(init) && t.isIdentifier(init.callee) && init.callee.name === 'defineComponent') return;
        if (!t.isArrowFunctionExpression(init) && !t.isFunctionExpression(init)) return;

        const rawParam0 = init.params[0];
        const rawParam1 = init.params[1];

        init.params = [];
        injectSetupPreamble(init as any, { 将Props映射到Attrs: true, 原参数: rawParam0 as any, 原Ctx参数: rawParam1 as any });
        wrapReturnToRender(path.get('init'), init);

        const props: t.ObjectProperty[] = [
          t.objectProperty(t.identifier('inheritAttrs'), t.booleanLiteral(false)),
          t.objectProperty(t.identifier('setup'), init as any),
        ];

        path.node.init = t.callExpression(
          t.identifier('defineComponent'),
          [t.objectExpression(props)],
        );
      },

      JSXOpeningElement(path) {
        const attrs = path.node.attributes;
        const nextAttrs: (t.JSXAttribute | t.JSXSpreadAttribute)[] = [];

        const nameNode = path.node.name;
        const tagName = t.isJSXIdentifier(nameNode) ? nameNode.name : null;
        const isNativeTag = !!tagName && isNativeTagName(tagName);

        const getAttrStringLiteral = (n: string) => {
          for (const a of attrs) {
            if (!t.isJSXAttribute(a) || !t.isJSXIdentifier(a.name) || a.name.name !== n) continue;
            if (!a.value || !t.isStringLiteral(a.value)) return null;
            return a.value.value;
          }
          return null;
        };

        for (const a of attrs) {
          if (!t.isJSXAttribute(a) || !t.isJSXIdentifier(a.name)) {
            nextAttrs.push(a as any);
            continue;
          }

          if (a.name.name !== '$value') {
            nextAttrs.push(a);
            continue;
          }

          const v = a.value;
          if (!v || !t.isJSXExpressionContainer(v)) {
            continue;
          }

          const expr = v.expression as any;
          if (!t.isIdentifier(expr) && !t.isMemberExpression(expr)) {
            continue;
          }

          if (isNativeTag) {
            const inputType = tagName === 'input' ? (getAttrStringLiteral('type') || '').toLowerCase() : '';

            const isCheckbox = tagName === 'input' && inputType === 'checkbox';
            const isRadio = tagName === 'input' && inputType === 'radio';
            const isSelect = tagName === 'select';

            const valueProp = (isCheckbox || isRadio) ? 'checked' : 'value';
            const eventProp = (isCheckbox || isRadio || isSelect) ? 'onChange' : 'onInput';

            nextAttrs.push(
              t.jsxAttribute(t.jsxIdentifier(valueProp), v),
            );

            const e = t.identifier('e');
            const target = t.cloneNode(expr, true) as any;
            const nextValueExpr = (isCheckbox || isRadio)
              ? t.memberExpression(t.memberExpression(e, t.identifier('target')), t.identifier('checked'))
              : t.memberExpression(t.memberExpression(e, t.identifier('target')), t.identifier('value'));

            nextAttrs.push(
              t.jsxAttribute(
                t.jsxIdentifier(eventProp),
                t.jsxExpressionContainer(
                  t.arrowFunctionExpression(
                    [e],
                    t.assignmentExpression('=', target, nextValueExpr as any),
                  ),
                ),
              ),
            );
          } else {
            nextAttrs.push(
              t.jsxAttribute(t.jsxIdentifier('modelValue'), v),
            );

            const param = t.identifier('v');
            const target = t.cloneNode(expr, true) as any;
            nextAttrs.push(
              t.jsxAttribute(
                t.jsxIdentifier('onUpdate:modelValue'),
                t.jsxExpressionContainer(
                  t.arrowFunctionExpression(
                    [param],
                    t.assignmentExpression('=', target, param),
                  ),
                ),
              ),
            );
          }
        }

        path.node.attributes = nextAttrs;
      },

      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration;

        if (t.isIdentifier(declaration) && declaration.name === FOJS_MAIN) {
          return;
        }

        /**
         * 将各种函数写法统一转换为 FunctionExpression，便于写入 defineComponent({ setup })
         */
        const toFunctionExpression = (
          node: t.ArrowFunctionExpression | t.FunctionDeclaration | t.FunctionExpression,
        ) => {
          if (t.isFunctionExpression(node)) return node;
          if (t.isArrowFunctionExpression(node)) {
            const fn = t.functionExpression(null, node.params, t.isBlockStatement(node.body) ? node.body : t.blockStatement([t.returnStatement(node.body as any)]), node.generator, node.async);
            return fn;
          }
          return t.functionExpression(
            node.id,
            node.params,
            node.body,
            node.generator,
            node.async,
          );
        };

        if (t.isIdentifier(declaration)) {
          const inserted = path.insertBefore(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(FOJS_MAIN), declaration),
            ]),
          );
          const declPath = Array.isArray(inserted) ? inserted[0] : inserted;
          if (declPath && (declPath as any).isVariableDeclaration?.()) {
            path.scope.registerDeclaration(declPath as any);
          }
          path.node.declaration = t.identifier(FOJS_MAIN);
          return;
        }

        if (
          t.isArrowFunctionExpression(declaration) ||
          t.isFunctionDeclaration(declaration) ||
          t.isFunctionExpression(declaration)
        ) {
          const fnExpr = toFunctionExpression(declaration as any);
          const rawParam0 = (fnExpr as any).params?.[0];
          const rawParam1 = (fnExpr as any).params?.[1];
          (fnExpr as any).params = [];
          injectSetupPreamble(fnExpr, { 将Props映射到Attrs: true, 原参数: rawParam0, 原Ctx参数: rawParam1 });
          wrapReturnToRender(path.get('declaration'), declaration);

          const props: t.ObjectProperty[] = [
            t.objectProperty(t.identifier('inheritAttrs'), t.booleanLiteral(false)),
            t.objectProperty(t.identifier('setup'), fnExpr),
          ];

          const defineComponentCall = t.callExpression(
            t.identifier('defineComponent'),
            [t.objectExpression(props)],
          );

          const inserted = path.insertBefore(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(FOJS_MAIN), defineComponentCall),
            ]),
          );
          const declPath = Array.isArray(inserted) ? inserted[0] : inserted;
          if (declPath && (declPath as any).isVariableDeclaration?.()) {
            path.scope.registerDeclaration(declPath as any);
          }
          path.node.declaration = t.identifier(FOJS_MAIN);
          return;
        }
      }
    }
  };
}
