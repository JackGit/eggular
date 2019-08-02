const path = require('path')
const egg = require('egg')
const EGG_PATH = Symbol.for('egg#eggPath')
const EGG_LOADER = Symbol.for('egg#loader')
const EggularLoader = require('./loader/eggular_loader')

class Application extends egg.Application {
  get [EGG_PATH]() {
    return path.dirname(__dirname)
  }

  get [EGG_LOADER]() {
    return EggularLoader
  }
}

class Agent extends egg.Agent {
  get [EGG_PATH]() {
    return path.dirname(__dirname)
  }
}

module.exports = Object.assign(egg, {
  Application,
  Agent,
  AppWorkerLoader: EggularLoader
})
