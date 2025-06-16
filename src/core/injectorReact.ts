import path from 'path';
import { types } from '@babel/core';
import {
  JSXAttribute,
  JSXElement,
  JSXIdentifier,
  JSXText,
  JSXExpressionContainer,
  StringLiteral,
  ConditionalExpression,
} from '@babel/types';
import { DEFAULT_PLUGIN_OPTIONS, type DefaultPluginOptionsType } from './constants.js';

class TagInjector {
  options: DefaultPluginOptionsType = {};
  constructor(options: DefaultPluginOptionsType = {}) {
    this.options = {
      ...DEFAULT_PLUGIN_OPTIONS,
      ...options,
      attributes: {
        ...DEFAULT_PLUGIN_OPTIONS.attributes,
        ...(options?.attributes || {}),
      },
    };
  }

  // 处理React JSX节点
  processReactNode(node: any, state: any) {
    const { filename, root } = state.file.opts;
    const { loc } = node;
    const tagName = node.name?.name || '';
    const { includeTags, excludeTags, attributes } = this.options;

    // 跳过不处理的标签
    if (excludeTags?.includes(tagName)) return;
    if (includeTags && includeTags?.length > 0 && !includeTags?.includes(tagName)) return;

    const newAttributes: JSXAttribute[] = [];
    const existingAttrNames = new Set();

    // 提取并添加标签的文本内容
    // console.log('content', JSON.stringify(node));
    if (attributes?.tagContent) {
      if (node.type === 'JSXElement') {
        const content = this.extractTextContent(node);
        if (content) {
          newAttributes.push(this.createJSXAttribute(attributes?.tagContent, encodeURIComponent(content)));
          node.openingElement.attributes.push(...newAttributes);
        }

        return;
      }
    }

    for (const attr of node.attributes) {
      if (attr.type === 'JSXAttribute') {
        existingAttrNames.add(attr.name?.name);
      }
      if (attr?.name?.name === 'key') {
        if (!existingAttrNames.has('data-plugin-component-map')) {
          newAttributes.push(this.createJSXAttribute('data-plugin-component-map', 'map'));
        }
      }
    }

    // 获取相对路径
    const relativePath = path.relative(root, filename);
    const fileName = path.basename(filename);

    // 添加 filePath
    if (attributes?.filePath && !existingAttrNames.has(attributes?.filePath)) {
      newAttributes.push(this.createJSXAttribute(attributes?.filePath, encodeURIComponent(relativePath || 'unknown')));
    }

    // 添加文件名
    if (attributes?.fileName && !existingAttrNames.has(attributes?.fileName)) {
      newAttributes.push(this.createJSXAttribute(attributes?.fileName, encodeURIComponent(fileName)));
    }

    if (loc) {
      const { line: stratLine, column: startColumn } = loc.start;
      const { line: endLine, column: endColumn } = loc.end;

      // 添加唯一标识符
      if (attributes?.uniqueId && !existingAttrNames.has(attributes?.uniqueId)) {
        const uniqueId = `${relativePath}:${stratLine}:${startColumn}:${endLine}:${endColumn}`;
        newAttributes.push(this.createJSXAttribute(attributes?.uniqueId, encodeURIComponent(uniqueId)));
      }

      // 添加开始位置
      if (attributes?.startLocationNumber && !existingAttrNames.has(attributes?.startLocationNumber)) {
        newAttributes.push(
          this.createJSXAttribute(attributes?.startLocationNumber, encodeURIComponent(`${stratLine}:${startColumn}`))
        );
      }

      // 添加结束位置
      if (attributes?.endLocationNumber && !existingAttrNames.has(attributes?.endLocationNumber)) {
        newAttributes.push(
          this.createJSXAttribute(attributes?.endLocationNumber, encodeURIComponent(`${endLine}:${endColumn}`))
        );
      }
    }

    // 添加标签名
    if (attributes?.tagName && tagName && !existingAttrNames.has(attributes?.tagName)) {
      newAttributes.push(this.createJSXAttribute(attributes?.tagName, tagName));
    }

    // 提取并添加上下文信息
    if (attributes?.contextInfo && !existingAttrNames.has(attributes?.contextInfo)) {
      const context = this.extractContextInfo(node, state);
      if (context) {
        newAttributes.push(
          this.createJSXAttribute(attributes?.contextInfo, encodeURIComponent(JSON.stringify(context)))
        );
      }
    }

    // 自定义属性
    if (attributes?.custom) {
      Object.entries(attributes?.custom).forEach(([name, value]) => {
        if (!existingAttrNames.has(name)) {
          newAttributes.push(this.createJSXAttribute(name, encodeURIComponent(value)));
        }
      });
    }

    // 查找第一个 JSXSpreadAttribute 的索引（如果存在）
    const firstSpreadIndex = node.attributes.findIndex((attr: any) => attr.type === 'JSXSpreadAttribute');

    if (firstSpreadIndex === -1) {
      // 没有展开属性，直接追加
      node.attributes.push(...newAttributes);
    } else {
      // 在第一个展开属性前插入
      node.attributes.splice(firstSpreadIndex, 0, ...newAttributes);
    }
  }

  // 提取上下文信息的辅助方法
  extractContextInfo(node: any, state: any) {
    const context: Record<string, string | number> = {};

    const attributes = node.attributes.reduce((acc: any, attr: any) => {
      const attrName = attr?.name?.name;
      if (attr.type === 'JSXAttribute') {
        if (attr.value?.type === 'StringLiteral') {
          acc[attrName] = attr.value.value;
        } else if (attr.value?.type === 'JSXExpressionContainer') {
          if (attr.value.expression.type === 'StringLiteral') {
            acc[attrName] = attr.value.expression.value;
          } else if (attr.value.expression.type === 'ConditionalExpression') {
            acc[attr.value.expression.type] = attrName;
            acc[`${attrName}-consequent`] = attr.value.expression.consequent.value;
            acc[`${attrName}-alternate`] = attr.value.expression.alternate.value;
          }
        }
      }
      return acc;
    }, {});

    if (attributes.placeholder) {
      context.placeholder = attributes.placeholder;
    }
    if (attributes.className) {
      context.className = attributes.className;
    }
    if (attributes.id) {
      context.id = attributes.id;
    }
    if (attributes.href) {
      context.href = attributes.href;
    }
    if (attributes.src) {
      context.src = attributes.src;
    }
    if (attributes.ConditionalExpression) {
      context[`${attributes.ConditionalExpression}-consequent`] =
        attributes[`${attributes.ConditionalExpression}-consequent`];
      context[`${attributes.ConditionalExpression}-alternate`] =
        attributes[`${attributes.ConditionalExpression}-alternate`];
      context[`ConditionalExpression`] = attributes.ConditionalExpression;
    }

    return Object.keys(context).length > 0 ? context : null;
  }

  // 提取文本内容的辅助方法
  extractTextContent(node: any) {
    if (!node.children || !Array.isArray(node.children)) return '';

    const textParts = node.children
      .map((child: any) => {
        if (child.type === 'JSXText') {
          return child.value.trim();
        } else if (child.type === 'JSXExpressionContainer') {
          if (child.expression.type === 'StringLiteral') {
            return child.expression.value;
          }
        }
        return '';
      })
      .filter(Boolean);

    return textParts.join(' ').trim();
  }

  // 创建JSX属性
  createJSXAttribute(name: any, value: any) {
    return types.jsxAttribute(types.jsxIdentifier(name), types.stringLiteral(value));
  }
}

export default TagInjector;
