#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * 输出使用说明
 */
function printHelp() {
  console.log(`
create-fojs <项目目录> [选项]

选项：
  --tailwind     集成 Tailwind CSS
  --router       集成 Vue Router
  -h, --help     显示帮助
`);
}

/**
 * 解析命令行参数（极简实现）
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith('-')));
  const rest = args.filter(a => !a.startsWith('-'));

  return {
    dir: rest[0],
    tailwind: flags.has('--tailwind'),
    router: flags.has('--router'),
    help: flags.has('-h') || flags.has('--help'),
  };
}

/**
 * 递归复制目录
 */
async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const from = path.join(src, e.name);
    const to = path.join(dst, e.name);
    if (e.isDirectory()) {
      await copyDir(from, to);
    } else if (e.isFile()) {
      await fs.copyFile(from, to);
    }
  }
}

/**
 * 读取并写回 JSON 文件
 */
async function updateJson(filePath, updater) {
  const raw = await fs.readFile(filePath, 'utf8');
  const json = JSON.parse(raw);
  const next = updater(json) || json;
  await fs.writeFile(filePath, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

/**
 * 覆盖写入文本文件
 */
async function writeText(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

async function main() {
  const { dir, tailwind, router, help } = parseArgs(process.argv);
  if (help || !dir) {
    printHelp();
    process.exit(help ? 0 : 1);
  }

  const targetDir = path.resolve(process.cwd(), dir);
  
  // 兼容 Deno 远程运行的路径获取方式
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFilePath);
  
  // 指向 packages/create-fojs 目录
  const pkgRoot = path.resolve(currentDir, '..');
  const templateRoot = path.join(pkgRoot, 'templates', 'base');

  


  await copyDir(templateRoot, targetDir);

  if (tailwind) {
    await updateJson(path.join(targetDir, 'package.json'), (pkg) => {
      pkg.devDependencies = pkg.devDependencies || {};
      pkg.devDependencies.tailwindcss = '^3.4.0';
      pkg.devDependencies.postcss = '^8.4.0';
      pkg.devDependencies.autoprefixer = '^10.4.0';
      pkg.scripts = pkg.scripts || {};
      return pkg;
    });

    await writeText(
      path.join(targetDir, 'tailwind.config.cjs'),
      `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,vue,fo}'],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}\n`,
    );

    await writeText(
      path.join(targetDir, 'postcss.config.cjs'),
      `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n`,
    );

    await writeText(
      path.join(targetDir, 'src/style.css'),
      `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
    );
  }

  if (router) {
    await updateJson(path.join(targetDir, 'package.json'), (pkg) => {
      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies['vue-router'] = '^4.5.0';
      return pkg;
    });

    await writeText(
      path.join(targetDir, 'src/router/index.ts'),
      `import { createRouter, createWebHistory } from 'vue-router'\n\nimport Home from '../pages/Home.fo'\n\nexport const router = createRouter({\n  history: createWebHistory(),\n  routes: [\n    {\n      path: '/',\n      component: Home,\n    },\n  ],\n})\n`,
    );

    await writeText(
      path.join(targetDir, 'src/pages/Home.fo'),
      `export const css = \`\n.page {\n  padding: 24px;\n}\n\`\n\nexport default () => {\n  return (\n    <div class=\"page\">\n      <h2>首页</h2>\n      <p>这是由 create-fojs 生成的页面组件。</p>\n    </div>\n  )\n}\n`,
    );

    await writeText(
      path.join(targetDir, 'src/App.fo'),
      `export default () => {\n  return (\n    <div>\n      <h1>fojs + Vue Router</h1>\n      <router-view />\n    </div>\n  )\n}\n`,
    );

    await writeText(
      path.join(targetDir, 'src/main.ts'),
      `import { createApp } from 'vue'\nimport './style.css'\nimport App from './App.fo'\nimport { router } from './router'\n\ncreateApp(App).use(router).mount('#app')\n`,
    );
  }

  console.log(`已创建项目：${targetDir}`);
  console.log('下一步：');
  console.log(`  cd ${dir}`);
  console.log('  fnm use');
  console.log('  npm i');
  console.log('  npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

