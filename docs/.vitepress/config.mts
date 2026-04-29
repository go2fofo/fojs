/*
 * @Author: fofo
 * @Date: 2026-04-29 11:32:35
 * @LastEditTime: 2026-04-29 11:51:47
 * @LastEditors: fofo
 * @Description: 
 * @FilePath: /fojs/docs/.vitepress/config.mts
 */
export default {
  lang: 'zh-CN',
  title: 'fojs',
  description: 'React 的外壳，Vue 的灵魂 —— 基于 .fo 的前端 DSL',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide' },
      { text: '功能', link: '/feature' },
      { text: 'fo-ui', link: '/fo-ui' },
      { text: 'Playground', link: '/playground' },
      { text: '基准测试', link: '/benchmark' },
    ],
    sidebar: [
      { text: '开始', items: [
        { text: '介绍', link: '/' },
        { text: '指南', link: '/guide' },
      ]},
      { text: '参考', items: [
        { text: '功能与变更', link: '/feature' },
        { text: 'fo-ui', link: '/fo-ui' },
        { text: 'Playground', link: '/playground' },
        { text: '基准测试', link: '/benchmark' },
      ]},
    ],
  },
}
