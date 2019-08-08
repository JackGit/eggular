const fs = require('fs')
const path = require('path')
const debug = require('debug')('eggular:module')

module.exports = {
  
  loadModuleController () {
    this.getLoadUnits()
      .filter(u => u.type === 'module')
      .map(u => path.join(u.path, 'app/controller'))
      .forEach(controllerDir => {
        this.loadController({
          directory: controllerDir,
          reuseTarget: true, // 这里重写了 loadToApp，直接重用 app.controller 作为 target
        })
      })
  },

  loadModuleRouter () {
    this.getLoadUnits()
      .filter(u => u.type === 'module')
      .map(u => path.join(u.path, 'app/router'))
      .forEach(routerDir => {
        this.loadFile(routerDir, this.app)
      })
  },

  /**
   * ```js
   * {
   *    'user': {
   *      enable: true,
   *      path: '',
   *      package: '',
   *      env: []
   *    }
   * }
   * ```
   */
  loadModule () {
    this.timing.start('Load Module')

    // load modules from application
    const appModules = this.readModuleConfigs(path.join(this.options.baseDir, 'config/module.default'))
    debug('Loaded app modules: %j', Object.keys(appModules))
    this.allModules = appModules


    return

    // load modules from framework
    const eggModuleConfigPaths = this.eggPaths.map(eggPath => path.join(eggPath, 'config/module.default'))
    const eggModules = this.readModuleConfigs(eggModuleConfigPaths)
    debug('Loaded egg modules: %j', Object.keys(eggModules))

    this.allModules = {}
    this.appModules = appModules
    this.eggModules = eggModules

    this._extendModules(this.allModules, eggModules)
    this._extendModules(this.allModules, appModules)

    const enabledModuleNames = []
    const modules = {}
    const env = this.serverEnv
    for (const name in this.allModules) {
      const module = this.allModules[name]
      module.path = this.getModulePath(module)

      if (env && module.env.length && module.env.includes(env)) {
        this.options.logger.info(
          `Module %s is disabled by env unmatched, require env(%s) but got env is %s`,
          name, module.env, env
        )
        module.enable = false
        continue
      }

      modules[name] = module
      if (module.enable) {
        enabledModuleNames.push(name)
      }
    }

    const enableModules = {}
    enabledModuleNames.forEach(name => {
      enableModules[name] = modules[name]
    })
    debug('Loaded modules: %j', Object.keys(enableModules))

    this.modules = enableModules
    this.timing.end('Load Module')
  },

  readModuleConfigs (configPaths) {
    if (!Array.isArray(configPaths)) {
      configPaths = [configPaths]
    }

    // Get all module configurations
    // module.default.js
    // module.${scope}.js
    // module.${env}.js
    // module.${scope}_${env}.js
    const newConfigPaths = []
    ;this.getTypeFiles('module').forEach(filename => {
      configPaths.forEach(configPath => {
        configPath = path.join(path.dirname(configPath), filename)
        newConfigPaths.push(configPath)
      })
    })

    const modules = {}
    newConfigPaths.forEach(configPath => {
      let filepath = this.resolveModule(configPath)

      // let module.js compatible
      if (configPath.endsWith('module.default') && !filepath) {
        filepath = this.resolveModule(configPath.replace(/module\.default$/, 'module'))
      }

      if (!filepath) {
        return
      }

      const config = this.loadFile(filepath)
      for (const name in config) {
        this.normalizeModuleConfig(config, name, filepath)
      }

      this._extendModules(modules, config)
    })

    return modules
  },

  normalizeModuleConfig (modules, name, configPath) {
    const module = modules[name]
    if (typeof module === 'boolean') {
      modules[name] = {
        name,
        enable: module,
        // dependencies: [],
        env: [],
        from: configPath
      }
      return
    }

    if (!('enable' in module)) {
      module.enable = true
    }
    module.name = name
    // module.dependencies = module.dependencies || module.dep || []
    module.env = module.env || []
    module.from = configPath
  },

  getModulePath (module) {
    if (module.path) {
      return module.path
    }

    const name = module.package || module.name
    const lookupDirs = []
    lookupDirs.push(path.join(this.options.baseDir, 'node_modules'))

    for (let i = this.eggPaths.length - 1; i >=0; i--) {
      const eggPath = this.eggPaths[i]
      lookupDirs.push(path.join(eggPath, 'node_modules'))
    }

    lookupDirs.push(path.join(process.cwd(), 'node_modules'))

    for (let dir of lookupDirs) {
      dir = path.join(dir, name)
      if (fs.existsSync(dir)) {
        return fs.realpathSync(dir)
      }
    }

    throw new Error(`Can not find module ${name} in "${lookupDirs.join(',')}"`)
  },

  _extendModules (target, modules) {
    if (!modules) {
      return
    }
    for (const name in modules) {
      const module = modules[name]
      let targetModule = target[name]
      if (!targetModule) {
        targetModule = target[name] = {}
      }
      if (targetModule.package && targetModule.package === module.package) {
        this.options.logger.warn(
          'module %s has been defined that is %j, but you define again in %s',
          name, targetModule, module.from
        )
      }
      if (module.path || module.package) {
        delete targetModule.path
        delete targetModule.package
      }
      for (const prop in module) {
        if (module[prop] === undefined) {
          continue
        }
        if (targetModule[prop] && Array.isArray(module[prop]) && !module[prop].length) {
          continue
        }
        targetModule[prop] = module[prop]
      }
    }
  }
}