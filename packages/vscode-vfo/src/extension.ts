/*
 * @Author: fofo
 * @Date: 2026-04-30 15:33:54
 * @LastEditTime: 2026-04-30 15:38:28
 * @LastEditors: fofo
 * @Description: 
 * @FilePath: /fojs/packages/vscode-vfo/src/extension.ts
 */
import * as path from 'node:path';

const vscode: any = require('vscode');
const lsp: any = require('vscode-languageclient/node');

let client: any;

function resolveTsdk() {
  const tsdkSetting = vscode.workspace.getConfiguration('typescript')?.get('tsdk');
  const folders = vscode.workspace.workspaceFolders;
  const root = folders?.[0]?.uri?.fsPath;
  if (typeof tsdkSetting === 'string' && tsdkSetting.length > 0) {
    if (path.isAbsolute(tsdkSetting)) return tsdkSetting;
    if (root) return path.join(root, tsdkSetting);
  }
  try {
    return path.join(__dirname, '..', 'node_modules', 'typescript', 'lib');
  } catch {
    return;
  }
}

export async function activate(context: any) {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));
  const tsdk = resolveTsdk();
  const args = tsdk ? [`--tsdk=${tsdk}`] : [];
  const clientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'vue' },
      { scheme: 'file', language: 'vfo' },
    ],
  };

  client = new lsp.LanguageClient(
    'vfo',
    'VFO Language Server',
    {
      run: { module: serverModule, transport: lsp.TransportKind.ipc, args },
      debug: { module: serverModule, transport: lsp.TransportKind.ipc, args },
    },
    clientOptions as any,
  );

  context.subscriptions.push(
    new vscode.Disposable(() => {
      void client?.stop();
    }),
  );

  await client.start();
}

export async function deactivate() {
  await client?.stop();
}
