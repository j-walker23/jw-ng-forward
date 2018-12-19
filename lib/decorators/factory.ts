import { IModule } from 'angular'
import { Providers } from './providers'
import { providerStore } from '../writers'
import { Module } from '../classes/module'
export interface IFactoryDecorator {
  name?: string
  providers?: any[]
}

const TYPE = 'factory'

export function Factory(opts?: IFactoryDecorator) {

  return function(t: Function) {
    let { name = t.name, providers = [] } = opts
    Providers(...providers)(t, `while analyzing Config '${name}' providers`);
    providerStore.set('type', TYPE, t);
    providerStore.set('name', name, t);
  }
}


Module.addProvider(TYPE, (target: any, name: string, injects: string[], module: IModule) => {

  module.factory(name, [...injects, target])

});

