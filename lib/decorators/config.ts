import { IModule } from 'angular'
import { providerStore } from '../writers'
import { Module } from '../classes/module'
import { Providers } from './providers'
export interface IConfigDecorator {
  providers?: any[]
}

const TYPE = 'config'

export function Config(opts: IConfigDecorator = {}) {

  return function(t: Function) {
    let { providers = [] } = opts
    Providers(...providers)(t, `while analyzing Config '${t.name}' providers`);
    providerStore.set('type', TYPE, t);
    providerStore.set('name', t.name, t);
  }
}


Module.addProvider(TYPE, (target: any, name: string, injects: string[], module: IModule) => {

  module.config([...injects, target.factory])

});


export function Run(opts: IConfigDecorator = {}) {
  return function(t: Function) {
    let { providers = [] } = opts
    Providers(...providers)(t, `while analyzing Run '${t.name}' providers`);
    providerStore.set('type', 'run', t);
    providerStore.set('name', t.name, t);
  }
}

Module.addProvider('run', (target: any, name: string, injects: string[], module: IModule) => {
  module.run([...injects, target.factory])
});
