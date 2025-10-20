import TagInjector from '../core/injectorReact.js';
import ReactBabelPlugin from '../babel/react-plugin.js';

class ReactTagInjectorPlugin {
  options: any = null;
  injector: any = null;
  constructor(options: any = {}) {
    this.options = options;
    this.injector = new TagInjector(options);
  }

  // apply(compiler: any) {
  //   compiler.hooks.compilation.tap('ReactTagInjectorPlugin', (compilation: any) => {
  //     console.log('compilation hook triggered for ReactTagInjectorPlugin', compilation);
  //     return;
  //     compilation.hooks.buildModule.tap('ReactTagInjectorPlugin', (module: any) => {
  //       if (module.loaders) {
  //         module.loaders.forEach((loader: any) => {
  //           if (loader.loader.includes('babel-loader')) {
  //             loader.options = loader.options || {};
  //             loader.options.plugins = loader.options.plugins || [];

  //             // 添加Babel插件
  //             loader.options.plugins.push([
  //               ReactBabelPlugin,
  //               { injector: this.injector }
  //             ]);
  //           }
  //         });
  //       }
  //     });
  //   });
  // }

  //   apply(compiler: any) {
  // // 方法1: 使用更安全的钩子
  //     compiler.hooks.afterPlugins.tap('ReactTagInjectorPlugin', () => {
  //       this.patchBabelLoader(compiler);
  //     });

  //     // 方法2: 在emit阶段输出结果
  //     compiler.hooks.emit.tapAsync('ReactTagInjectorPlugin', (compilation: any, callback: any) => {
  //       this.outputResults(compilation);
  //       callback();
  //     });
  //   }

  //   patchBabelLoader(compiler: any) {
  //     const config = compiler.options;

  //     // 遍历所有规则，找到babel-loader
  //     if (config.module && config.module.rules) {
  //       config.module.rules.forEach((rule: any) => {
  //         this.processRule(rule);
  //       });
  //     }
  //   }

  //   processRule(rule: any) {
  //     if (rule.use) {
  //       if (Array.isArray(rule.use)) {
  //         rule.use.forEach((useEntry: any) => {
  //           this.processUseEntry(useEntry);
  //         });
  //       } else {
  //         this.processUseEntry(rule.use);
  //       }
  //     }

  //     if (rule.oneOf) {
  //       rule.oneOf.forEach((oneOfRule: any) => {
  //         this.processRule(oneOfRule);
  //       });
  //     }
  //   }

  //   processUseEntry(useEntry: any) {
  //     if (typeof useEntry === 'object' &&
  //         useEntry.loader &&
  //         useEntry.loader.includes('babel-loader')) {

  //       useEntry.options = useEntry.options || {};
  //       useEntry.options.plugins = useEntry.options.plugins || [];

  //       // 添加Babel插件
  //       useEntry.options.plugins.push([
  //         ReactBabelPlugin,
  //         { injector: this.injector }
  //       ]);
  //     }
  //   }

  //   outputResults(compilation: any) {
  //     // 在这里输出收集到的标签信息
  //     const results = this.injector.getResults(); // 假设你的injector有这个方法

  //     compilation.assets['tag-info.json'] = {
  //       source: () => JSON.stringify(results, null, 2),
  //       size: () => JSON.stringify(results, null, 2).length
  //     };
  //   }

  apply(compiler: any) {
    // 只在非预编译阶段执行
    if (this.isPrebundlePhase(compiler)) {
      console.log('ReactTagInjectorPlugin: 跳过预编译阶段');
      return;
    }

    // 使用更晚的钩子
    compiler.hooks.afterEnvironment.tap('ReactTagInjectorPlugin', () => {
      this.safePatchBabelLoader(compiler);
    });

    compiler.hooks.emit.tapAsync('ReactTagInjectorPlugin', (compilation: any, callback: any) => {
      this.outputResults(compilation);
      callback();
    });
  }

  isPrebundlePhase(compiler: any) {
    // 检查是否是预编译阶段
    return compiler.options.plugins.some(
      (plugin: any) =>
        plugin.constructor.name.includes('Prebundle') ||
        (plugin.constructor.name === 'TaroWebpackPlugin' &&
          compiler.context &&
          compiler.context.includes('node_modules'))
    );
  }

  safePatchBabelLoader(compiler: any) {
    try {
      const config = compiler.options;

      if (!config.module?.rules) return;

      config.module.rules.forEach((rule: any) => {
        if (rule && typeof rule === 'object') {
          this.traverseRule(rule);
        }
      });
    } catch (error: any) {
      console.warn('ReactTagInjectorPlugin: 修改babel-loader配置失败', error.message);
    }
  }

  traverseRule(rule: any) {
    if (!rule) return;

    // 处理use数组
    if (rule.use && Array.isArray(rule.use)) {
      rule.use.forEach((useEntry: any) => {
        if (useEntry && typeof useEntry === 'object') {
          this.patchBabelLoaderConfig(useEntry);
        }
      });
    }

    // 处理oneOf数组
    if (rule.oneOf && Array.isArray(rule.oneOf)) {
      rule.oneOf.forEach((oneOfRule: any) => {
        this.traverseRule(oneOfRule);
      });
    }

    // 处理规则本身
    this.patchBabelLoaderConfig(rule);
  }

  patchBabelLoaderConfig(config: any) {
    if (!config.loader && !config.use) return;

    const loader = config.loader || (config.use && typeof config.use === 'object' ? config.use.loader : null);

    if (loader && loader.includes('babel-loader')) {
      config.options = config.options || {};
      config.options.plugins = config.options.plugins || [];

      // 检查是否已经添加过
      const alreadyAdded = config.options.plugins.some(
        (plugin: any) => Array.isArray(plugin) && plugin[0] === ReactBabelPlugin
      );

      if (!alreadyAdded) {
        config.options.plugins.push([ReactBabelPlugin, { injector: this.injector }]);
      }
    }
  }

  outputResults(compilation: any) {
    try {
      const results = this.injector.getResults();

      compilation.assets['tag-info.json'] = {
        source: () =>
          JSON.stringify(
            {
              generatedAt: new Date().toISOString(),
              ...results,
            },
            null,
            2
          ),
        size: () => JSON.stringify(results, null, 2).length,
      };

      console.log('ReactTagInjectorPlugin: 标签信息已生成');
    } catch (error: any) {
      console.error('ReactTagInjectorPlugin: 输出结果失败', error);
    }
  }
}

export default ReactTagInjectorPlugin;
