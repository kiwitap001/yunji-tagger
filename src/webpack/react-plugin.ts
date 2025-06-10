import TagInjector from '../core/injectorReact.js';
import ReactBabelPlugin from '../babel/react-plugin.js';

class ReactTagInjectorPlugin {

  options: any = null;
  injector: any = null;
  constructor(options: any = {}) {
    this.options = options;
    this.injector = new TagInjector(options);
  }

  apply(compiler: any) {
    compiler.hooks.compilation.tap('ReactTagInjectorPlugin', (compilation: any) => {
      compilation.hooks.buildModule.tap('ReactTagInjectorPlugin', (module: any) => {
        if (module.loaders) {
          module.loaders.forEach((loader: any) => {
            if (loader.loader.includes('babel-loader')) {
              loader.options = loader.options || {};
              loader.options.plugins = loader.options.plugins || [];
              
              // 添加Babel插件
              loader.options.plugins.push([
                ReactBabelPlugin, 
                { injector: this.injector }
              ]);
            }
          });
        }
      });
    });
  }
}

export default ReactTagInjectorPlugin;