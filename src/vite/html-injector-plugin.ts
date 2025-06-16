import {} from '@babel/core';
import { DEFAULT_ATTRIBUTES } from '../core/constants.js';

// 转为驼峰属性
function toDatasetKey(dataAttr: string, charText = '-') {
  return dataAttr
    .replace(/^data-/, '') // 去掉data-
    .split(charText)
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

// 获取当前文件名
function getCurrentFileName() {
  const url = window.location.href;
  const path = new URL(url).pathname;
  const segments = path.split('/');
  const fileName = segments[segments.length - 1];

  return fileName || 'index.html'; // 如果没有文件名，默认为index.html
}

// 获取HTML内容的行和列信息
function getLineAndColumn(element: Element) {
  // 获取整个HTML内容
  const html = document.documentElement.outerHTML;

  // 构建元素的outerHTML
  const elementHtml = element.outerHTML;

  // 查找元素在HTML中的位置
  const index = html.indexOf(elementHtml);

  if (index === -1) {
    return { line: 0, column: 0, endLine: 0, endColumn: 0 };
  }

  // 计算起始行和列
  const linesBefore = html.substring(0, index).split('\n');
  const startLine = linesBefore.length;
  const startColumn = linesBefore[linesBefore.length - 1].length + 1;

  // 计算结束行和列
  const endIndex = index + elementHtml.length;
  const linesToEnd = html.substring(0, endIndex).split('\n');
  const endLine = linesToEnd.length;
  const endColumn = linesToEnd[linesToEnd.length - 1].length + 1;

  return { startLine, startColumn, endLine, endColumn };
}

function createHTMLInjectorPlugin() {
  // 获取当前文件名
  const fileName = getCurrentFileName();

  // 获取body中的所有元素
  const elements = document.body.querySelectorAll('*');

  // 遍历并标记每个元素
  elements.forEach((element: Element) => {
    try {
      // 获取行和列信息
      const { startLine, startColumn, endLine, endColumn } = getLineAndColumn(element as Element);

      // 获取元素信息
      const tagName = element.tagName.toLowerCase();
      const id = element.id || '无';
      const className = element.className || '无';
      const childCount = element.children.length;

      // 创建信息对象
      const elementInfo: Record<string, string> = {};

      elementInfo[DEFAULT_ATTRIBUTES['uniqueId']] = encodeURIComponent(
        `${fileName}:${startLine}:${startColumn}:${endLine}:${endColumn}`
      );
      elementInfo[DEFAULT_ATTRIBUTES['filePath']] = encodeURIComponent(`${fileName}`);
      elementInfo[DEFAULT_ATTRIBUTES['fileName']] = encodeURIComponent(`${fileName}`);
      elementInfo[DEFAULT_ATTRIBUTES['startLocationNumber']] = encodeURIComponent(`${startLine}:${startColumn}`);
      elementInfo[DEFAULT_ATTRIBUTES['endLocationNumber']] = encodeURIComponent(`${endLine}:${endColumn}`);
      elementInfo[DEFAULT_ATTRIBUTES['tagName']] = encodeURIComponent(tagName);

      // 将信息存储在自定义属性中
      for (const key in elementInfo) {
        const datasetKey = toDatasetKey(key);
        // 确保元素有dataset属性
        if ('dataset' in element) {
          (element as HTMLElement).dataset[datasetKey] = elementInfo[key];
        }
      }
    } catch (error) {
      console.error('Error processing element:', error);
    }
  });
}

export default createHTMLInjectorPlugin;
