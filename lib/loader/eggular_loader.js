const egg = require('egg')
const path = require('path')

class EggularLoader extends egg.AppWorkerLoader {
  load () {
    console.log("EggularLoader -> load()")
    super.load()
    this.loadModule()
  }

  // loadToModule(dir, 'controller') => module.controller = {}
  loadToModule () {

  }

  _load () {
    const appModuleConfigPath = path.join(this.options.baseDir, 'config/module')
    const config = this.loadFile(appModuleConfigPath)
    Object.keys(config).forEach(name => {
      const { path: modulePath } = config[name]
      const serviceDir = path.join(modulePath, 'service')
      this.loadToContext([serviceDir], Symbol.for(`service#${name}`), {
        call: true,
        caseStyle: 'lower',
        fieldClass: 'serviceClasses',
      })

      const controllerDir = path.join(modulePath, 'controller')
      const routerDir = path.join(modulePath, 'router')
    })
  }

  loadModule () {
    this._load()
    return
    const { FileLoader } = this
    const appModuleConfigPath = path.join(this.options.baseDir, 'config/module')
    const config = this.loadFile(appModuleConfigPath)
    
    const dependencyModules = []
    const allModuleNames = []
    Object.keys(config).forEach(name => {
      allModuleNames.push(name)
    })

    Object.keys(config).forEach(name => {
      const { path: modulePath } = config[name]

      const dir = path.join(modulePath, 'service')
      console.log('------ loade service path', dir)
      const target = {}
      new FileLoader({
        directory: dir,
        target,
        call: true,
        override: false,
        inject: 'injected value',
        caseStyle: 'lower'
      }).load()
      console.log(' ==== target', target)
      new target.status('123')

      return 
      // load service to app.module.<name>
      const serviceDir = path.join(modulePath, 'service')
      this.loadToApp(serviceDir, '')

      // load controller to app.module.<name>
      const controllerDir = path.join(modulePath, 'controller');
      this.loadToApp(controllerDir, 'module.controller')


      // load router to app.module.<name>
      const routerPath = path.join(modulePath, 'router.js')
      this.loadFile(routerPath)
    })
  }
}

;[
  // require('./mixin/module')
].forEach(loader => Object.assign(EggularLoader.prototype, loader))

module.exports = EggularLoader