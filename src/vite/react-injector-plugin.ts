// plugins/react-plugin.ts
import { transformAsync } from '@babel/core';
import { createFilter } from '@rollup/pluginutils';
import TagInjector from '../core/injectorReact.js';
import checkPeerDeps from '../core/checkPeerDeps.js';
import ReactBabelPlugin from '../babel/react-plugin.js';

import { type DefaultPluginOptionsType } from '../core/constants.js';

const createReactInjectorPlugin = (options: DefaultPluginOptionsType = {}) => {
  console.log('createReactInjectorPlugin started');
  // 检查必需的 peerDependencies 是否存在
  checkPeerDeps(['@babel/preset-typescript', '@babel/preset-react', '@babel/core'], 'yunji-tagger');

  const filter = createFilter(options.include || /\.(jsx|tsx)$/, options.exclude || /node_modules/);

  const injector = new TagInjector(options);

  return {
    name: 'vite-react-yunji-tagger',
    enforce: 'pre',
    async transform(code: string, id: string) {
      if (!filter(id)) return;

      try {
        const result: any = await transformAsync(code, {
          filename: id,
          presets: [
            [
              '@babel/preset-typescript',
              {
                isTSX: true,
                allExtensions: true,
                parserOpts: {
                  throwIfNamespace: false,
                },
              },
            ],
            ['@babel/preset-react', { runtime: 'automatic' }],
          ],
          parserOpts: {
            throwIfNamespace: false,
          },
          plugins: [
            // function taggerPlugin() {
            //   return {
            //     visitor: {
            //       JSXOpeningElement(path: any, state: any) {
            //         const name = path.node.name;
            //         if (name.type === 'JSXIdentifier' && name.name !== 'Fragment') {
            //           path.node.attributes.push({
            //             type: 'JSXAttribute',
            //             name: { type: 'JSXIdentifier', name: 'data-test' },
            //             value: { type: 'StringLiteral', value: 'injected' },
            //           });
            //         }
            //         // injector.processReactNode(path.node, state);
            //       },
            //     },
            //   };
            // },
            [ReactBabelPlugin, { injector }],
          ],
          ast: true,
          code: true,
          babelrc: false,
          configFile: false,
        } as any);

        return {
          code: result?.code || code,
          map: result?.map || null,
        };
      } catch (error) {
        // 错误处理
        console.error(`[vite-react-yunji-tagger] Error processing ${id}:`);
        return null;
      }
    },
  };
};

export default createReactInjectorPlugin;
