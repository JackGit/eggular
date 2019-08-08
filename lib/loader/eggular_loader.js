const egg = require('egg')
const path = require('path')

class EggularLoader extends egg.AppWorkerLoader {

  loadConfig () {
    console.log("EggularLoader -> loadConfig()")
    this.loadModule()
    super.loadConfig()
  }

  load () {
    console.log("EggularLoader -> load()")
    this.loadModuleController()
    this.loadModuleRouter()
    super.load()
  }

  /**
   * override getLoadUnits
   * add modules
   */
  getLoadUnits () {
    if (this.dirs) {
      return this.dirs
    }
    
    super.getLoadUnits()
    // this.dirs.push()
    
    console.log('EggularLoader.allModules', this.allModules)
    
    Object.values(this.allModules).forEach(({ path }) => {
      this.dirs.push({ path, type: 'module' })
    })

    // add module dirs [{ path, type: 'module' }]

    console.log('EggularLoader -> getLoadUnits()', this.dirs )


    return this.dirs
  }

  /**
   * override loadToApp
   * add reuseTarget option
   */
  loadToApp (directory, property, opt) {
    const target = (this.app[property] && opt.reuseTarget)
      ? this.app[property]
      : this.app[property] = {}
    opt = Object.assign({}, {
      directory,
      target,
      inject: this.app
    }, opt)
    new this.FileLoader(opt).load()
  }

}

;[
  require('./mixin/module')
].forEach(loader => Object.assign(EggularLoader.prototype, loader))

module.exports = EggularLoader