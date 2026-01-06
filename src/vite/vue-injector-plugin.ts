import MagicString from "magic-string";
import { createFilter } from "@rollup/pluginutils";
import type {
  TemplateChildNode,
  NodeTransform,
  ElementNode,
  RootNode,
  CompilerOptions,
} from "@vue/compiler-dom";
import { parse, transform } from "@vue/compiler-dom";
import checkPeerDeps from "../core/checkPeerDeps.js";
import TagInjector from "../core/injectorVue.js";

import {
  CHART_COMPONENT_MODULES_VUE,
  SVG_COMPONENT_MODULES_VUE,
  type DefaultPluginOptionsType,
} from "../core/constants.js";
import { toPascalCase } from '../core/utils.js';

const VueElementType = 1;
const createVueInjectorPlugin = (options: DefaultPluginOptionsType = {}) => {
  // 检查必需的 peerDependencies 是否存在
  checkPeerDeps(
    [
      "@rollup/pluginutils",
      "@vue/compiler-dom",
      "@rollup/pluginutils",
      "magic-string",
    ],
    "yunji-tagger"
  );

  const filter = createFilter(
    options.include || /\.vue$/,
    options.exclude || /node_modules/
  );

  const injector = new TagInjector(options);

  // 用于存储是否应该生成 sourcemap
  let shouldGenerateSourcemap = true;

  return {
    name: "vite-vue-yunji-tagger",
    enforce: "pre",

    // 在配置解析后获取 sourcemap 设置
    configResolved(config: any) {
      // 保存 sourcemap 配置
      shouldGenerateSourcemap =
        config.command === "serve" || (config.build && config.build.sourcemap);
    },

    transform(code: string, id: string) {
      if (!filter(id)) return;

      // 1. 建立导入映射表
      const importTagMap = new Map<string, "SVG" | "CHART">();

      // 2. 扫描显式导入 (lucide, element-plus, etc.)
      // 核心逻辑说明：
      // 1. (?:import\s+([\w\s,]+?)\s*,\s*)?  --> 匹配可选的默认导入部分，如 "VChart, "
      // 2. \{([\s\S]+?)\}                     --> 匹配大括号内的具名导入（支持换行）
      // 3. from\s+['"](.+?)['"]               --> 匹配模块路径
      const importRegex =
        /import\s+(?:([\w\s,]+?)\s*,\s*)?\{([\s\S]+?)\}\s+from\s+['"](.+?)['"]/g;
      let match;
      while ((match = importRegex.exec(code)) !== null) {
        const [, defaultPart, namedPart, moduleName] = match;
        let type: "SVG" | "CHART" | null = null;
        if (SVG_COMPONENT_MODULES_VUE.includes(moduleName)) {
          type = "SVG";
        } else if (
          CHART_COMPONENT_MODULES_VUE.includes(moduleName) ||
          moduleName.includes("echarts")
        ) {
          type = "CHART";
        }

        if (type) {
          // 1. 处理默认导入 (如 VChart)
          if (defaultPart) {
            importTagMap.set(defaultPart.trim(), type);
          }

          // 2. 处理大括号内的具名导入 (如 { TitleComponent as TC })
          namedPart.split(",").forEach((item) => {
            const localName = item
              .trim()
              .split(/\s+as\s+/)
              .pop();
            if (localName) importTagMap.set(localName, type);
          });
        }
      }

      try {
        let prefixSubstring = "";
        let suffixSubstring = "";
        const s = new MagicString(code);
        const ast = parse(code, {
          comments: true,
        });

        // 判断是否为 Pug 模版
        const templateNode = ast.children.find(
          (node) => node.type === VueElementType && node.tag === "template"
        ) as ElementNode;

        transform(ast, {
          nodeTransforms: [
            ((node: TemplateChildNode) => {
              if (node.type === VueElementType) {
                // 优先从 map 获取，如果没有（可能是自动导入），则进入 injector 的兜底正则逻辑
                const tagType = importTagMap.get(toPascalCase(node.tag)); // 识别当前标签类型
                
                const addition: string = injector.processVueNode(node, {
                  filename: id,
                  tagType,
                  parentHasVFor: false, // 顶层默认无 v-for
                });

                if (addition) {
                  const insertPosition = node.loc.start.offset + node.tag.length + 1;
                  s.prependLeft(insertPosition, addition);
                }
              }
            }) as NodeTransform,
          ],
        });

        let result = s.toString();
        const ss = s
          .toString()
          .slice(
            prefixSubstring.length,
            result.length - suffixSubstring.length
          );

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
