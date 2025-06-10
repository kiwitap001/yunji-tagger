import TagInjector from '../core/injectorReact.js';
import { VueLoaderPlugin } from 'vue-loader';
import { compile } from '@vue/compiler-dom';

class VueTagInjectorPlugin {

  options: any = null;
  injector: any = null;
  constructor(options = {}) {
    this.options = options;
    this.injector = new TagInjector(options);
  }

  apply(compiler: any) {
    compiler.hooks.compilation.tap('VueTagInjectorPlugin', (compilation: any) => {
      
      // 确保vue-loader已经应用
      if (!compilation.hooks.vueLoaderOptions) {
        new VueLoaderPlugin().apply(compiler);
      }
      
      compilation.hooks.vueLoaderOptions.tap('VueTagInjectorPlugin', (options: any) => {
        const originalCompiler = options.compilerOptions?.compiler;
        const self = this;
        
        options.compilerOptions = options.compilerOptions || {};
        options.compilerOptions.compiler = {
          ...(originalCompiler || {}),
          compile(template: any, compileOptions: any) {
            const result = compile(template, {
              ...compileOptions,
              nodeTransforms: [
                ...(compileOptions.nodeTransforms || []),
                (node) => {
                  if (node.type === 1) { // ELEMENT
                    self.injector.processVueNode(node, {
                      filename: compileOptions.filename
                    });
                  }
                }
              ]
            });
            return result;
          }
        };
        return options;
      });
    });
  }
}

export default VueTagInjectorPlugin;