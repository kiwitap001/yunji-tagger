// src\webpack\react-plugin-taro.ts
import ReactBabelPlugin from '../babel/react-plugin.js';
import checkPeerDeps from '../core/checkPeerDeps.js';
import TagInjector from '../core/injectorReact.js';

// 导出 Babel 插件版本
export const ReactInjectorBabelPlugin = ReactBabelPlugin;

// 导出注入器
export { TagInjector };

// 创建并导出配置好的 Babel 插件实例
export function createBabelPluginTaro(options = {}) {
  checkPeerDeps(['@babel/preset-typescript', '@babel/preset-react', '@babel/core'], 'yunji-tagger');
  
  const tagInjector = new TagInjector(options);
  return [ReactBabelPlugin, { injector: tagInjector }];
}
