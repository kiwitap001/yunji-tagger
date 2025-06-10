import { types as t, NodePath } from '@babel/core';
import type { JSXAttribute, JSXElement, JSXOpeningElement, JSXIdentifier, JSXNamespacedName } from '@babel/types';

// 定义 injector 对象的接口
interface Injector {
  processReactNode: (node: any, state: any) => void;
}

// 定义插件选项接口
interface PluginOptions {
  injector?: Injector;
}

// 定义插件状态接口
interface PluginState {
  opts: PluginOptions;
}

const ReactBabelPlugin = (babel: { types: typeof t }) => {
  const { types: t } = babel;

  return {
    name: "babel-react-yunji-tagger",
    visitor: {
      JSXAttribute(path: NodePath<JSXAttribute>) {
        // console.log(`${new Date().toISOString()} path = `, JSON.stringify(path.node));
        // 确保 path.node.name 是一个 JSXIdentifier
        if (!path.node?.name) return;

        let attributeName;
        
        // 获取属性名（兼容 JSXIdentifier 和 JSXNamespacedName）
        if (path.node.name.type === 'JSXIdentifier') {
          attributeName = path.node.name.name;
        } else if (path.node.name.type === 'JSXNamespacedName') {
          // 如果是命名空间属性（如 xmlns:xlink），转换为驼峰式
          attributeName = `${path.node.name.namespace.name}:${path.node.name.name.name}`;
        } else {
          return; // 其他情况跳过
        }

        // console.log(attributeName, attributeName.includes(':'));
        // 如果属性名包含冒号（:），转换为驼峰式
        if (attributeName.includes(':')) {
          const camelCaseName = attributeName
            .split(':')
            .map((part: any, i: any) => 
              i > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part
            )
            .join('');

          // 修改节点属性名
          path.node.name = {
            type: 'JSXIdentifier',
            name: camelCaseName,
          };
        }
      },
      // 处理 JSXElement 节点
      JSXElement(path: NodePath<JSXElement>, state: any) {
        const { injector } = state.opts;
        if (!injector) return;
        
        // 保存整个 JSXElement 节点到路径的状态中
        injector.processReactNode(path.node, state);
      },
      JSXOpeningElement(path: NodePath<JSXOpeningElement>, state: any) {
        const { injector } = state.opts;
        if (!injector) return;
        
        injector.processReactNode(path.node, state);
      }
    }
  };
}

export default ReactBabelPlugin;