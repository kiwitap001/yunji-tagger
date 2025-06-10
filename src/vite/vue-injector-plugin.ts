import MagicString from 'magic-string';
import { createFilter } from '@rollup/pluginutils';
import type { TemplateChildNode, NodeTransform, ElementNode, RootNode, CompilerOptions } from '@vue/compiler-dom';
import { parse, transform } from '@vue/compiler-dom';
import checkPeerDeps from '../core/checkPeerDeps.js';
import TagInjector from '../core/injectorVue.js';

import { type DefaultPluginOptionsType } from '../core/constants.js';

const VueElementType = 1;

const createVueInjectorPlugin = (options: DefaultPluginOptionsType = {}) => {
  console.log('createVueInjectorPlugin started');
  // 检查必需的 peerDependencies 是否存在
  checkPeerDeps(['@rollup/pluginutils', '@vue/compiler-dom', '@rollup/pluginutils', 'magic-string'], 'yunji-tagger');

  const filter = createFilter(options.include || /\.vue$/, options.exclude || /node_modules/);

  const injector = new TagInjector(options);

  // 用于存储是否应该生成 sourcemap
  let shouldGenerateSourcemap = true;

  return {
    name: 'vite-vue-yunji-tagger',
    enforce: 'pre',

    // 在配置解析后获取 sourcemap 设置
    configResolved(config: any) {
      // 保存 sourcemap 配置
      shouldGenerateSourcemap = config.command === 'serve' || (config.build && config.build.sourcemap);
    },

    transform(code: string, id: string) {
      if (!filter(id)) return;

      try {
        let prefixSubstring = '',
          suffixSubstring = '';
        const s = new MagicString(code);
        const ast = parse(code, {
          comments: true,
        });

        // 判断是否为 Pug 模版
        const templateNode = ast.children.find(
          (node) => node.type === VueElementType && node.tag === 'template'
        ) as ElementNode;

        transform(ast, {
          nodeTransforms: [
            ((node: TemplateChildNode) => {
              if (node.type === VueElementType) {
                const insertPosition = node.loc.start.offset + node.tag.length + 1;
                const addition: string = injector.processVueNode(node, {
                  filename: id,
                });
                s.prependLeft(insertPosition, addition);
              }
            }) as NodeTransform,
          ],
        });

        let result = s.toString();
        const ss = s.toString().slice(prefixSubstring.length, result.length - suffixSubstring.length);

        return {
          code: result,
          map: null,
        };
      } catch (error) {
        // 错误处理
        console.error(`[vite-vue-yunji-tagger] Error processing ${id}:`);
        return null;
      }
    },
  };
};

export default createVueInjectorPlugin;
