import { DEFAULT_ATTRIBUTES } from './core/constants.js';

// * vite 插件
import VueInjectorVitePlugin from './vite/vue-injector-plugin.js';
import ReactInjectorVitePlugin from './vite/react-injector-plugin.js';
import createHTMLInjectorPlugin from './vite/html-injector-plugin.js'

// TODO webpack
import ReactInjectorWebpackPlugin from './webpack/react-plugin.js';
import { createBabelPluginTaro, TagInjector, ReactInjectorBabelPlugin } from './webpack/react-plugin-taro.js';
// import VueInjectorWebpackPlugin from './webpack/vue-plugin.js';

export {
  
  // * vite
  // Vue插件
  VueInjectorVitePlugin,
  // React插件
  ReactInjectorVitePlugin,
  createHTMLInjectorPlugin,

  // TODO webpack
  // VueWebpackPlugin,
  ReactInjectorWebpackPlugin,
  // Taro插件
  createBabelPluginTaro,
  TagInjector,
  ReactInjectorBabelPlugin,
  
  // 默认配置
  DEFAULT_ATTRIBUTES
};