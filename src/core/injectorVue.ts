import path from 'path';
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

  // 处理Vue AST节点
  processVueNode(node: any, context: any): string {
    try {
      const { tag, loc, props: nodeProps } = node;
      const { filename } = context;
      const { includeTags, excludeTags, attributes } = this.options;

      // 检查是否子啊排除列表中
      if (excludeTags?.includes(tag)) return '';
      if (includeTags && includeTags.length > 0 && !includeTags.includes(tag)) return '';

      let result = '';
      let additionJSON: any = {};

      // 获取文件路径（相对路径或绝对路径）
      const projectRoot = process.cwd();
      // 获取相对路径
      const relativePath = path.relative(projectRoot, filename);

      if (nodeProps.length > 0) {
        for (let itemProp of nodeProps) {
          if (itemProp.type === 7 && itemProp.name === 'for') {
            additionJSON['data-plugin-component-for'] = 'for';
          }
        }
      }

      // 添加文件位置信息
      const filePathAttr = attributes?.filePath as string;
      if (filePathAttr && !additionJSON[filePathAttr]) {
        additionJSON[filePathAttr] = relativePath || 'unknown';
      }

      // 添加位置信息
      if (loc) {
        
        const uniqueIdAttr = attributes?.uniqueId as string;
        if (uniqueIdAttr && !additionJSON[uniqueIdAttr]) {
          const uniqueId = `${relativePath}:${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}`;
          additionJSON[uniqueIdAttr] = uniqueId;
        }

        const { line: startLine, column: startColumn } = loc.start;
        const { line: endLine, column: endColumn } = loc.end;
        const startLocationNumberAttr = attributes?.startLocationNumber as string;
        if (startLocationNumberAttr && !additionJSON[startLocationNumberAttr]) {
          additionJSON[startLocationNumberAttr] = `${startLine}:${startColumn}`.toString();
        }

        const endLocationNumberAttr = attributes?.endLocationNumber as string;
        if (endLocationNumberAttr && !additionJSON[endLocationNumberAttr]) {
          additionJSON[endLocationNumberAttr] = `${endLine}:${endColumn}`.toString();
        }
      }

      // 添加标签名信息
      const tagNameAttr = attributes?.tagName as string;
      if (attributes?.tagName && !additionJSON[tagNameAttr]) {
        additionJSON[tagNameAttr] = tag;
      }

      // 添加自定义属性
      // @ts-ignore
      if (attributes?.custom && additionJSON[attributes?.custom]) {
        Object.entries(attributes?.custom).forEach(([name, value]) => {
          additionJSON[attributes[name] as string] = value;
        });
      }

      for (const [name, value] of Object.entries(additionJSON)) {
        result += ` ${name}="${encodeURIComponent(value as string)}"`;
      }

      return result;
    } catch (error) {
      console.error('error', error);
      return '';
    }
  }
}

export default TagInjector;
