import { Ng1ViewDeclaration } from '@uirouter/angularjs'
import { IModule } from 'angular'
import { createConfigErrorMessage, flatten } from '../util/helpers'
import { bundleStore, componentStore, providerStore } from '../writers'
import { componentHooks } from './component'
import { Providers } from './providers'

const childConfigsKey = 'ui-router.stateChildConfigs'
const annotatedResolvesKey = 'ui-router.annotatedResolves'
const resolvedMapKey = 'ui-router.resolvedMap'


export interface IComponentState extends Ng1ViewDeclaration {
  component: any;
}

/**
 *
 * @param stateConfigs an array of state config objects
 * @example
 *
 * // Assume we also had two other components: Inbox and Compose
 *
 * @Component({ selector: 'app', template: '<ui-view></ui-view>' })
 * @StateConfig([
 *   { name: 'inbox', url: '/', component: Inbox, resolve: ... },
 *   { name: 'compose', url: '/compose', component: Compose }
 * ])
 * class App {}
 */
export function StateConfig(stateConfigs: IComponentState[]) {
  return function(t: any) {

    // Add all routed components as providers to this parent component so they are included in the bundle
    Providers(...flatten(stateConfigs.map(sc => sc.component)))(t, `while analyzing StateConfig '${t.name}' state components`)
    componentStore.set(childConfigsKey, stateConfigs, t)
  }
}

function targetIsStaticFn(t) {
  return t.name !== undefined && t.constructor.name === 'Function'
}


/**
 *
 * @param resolveName if you'd like to rename the resolve, otherwise it will use the name of the static method
 * @example
 *
 * @Component({ selector: 'inbox', template: '...' })
 * // Don't forget to also inject your resolve into your constructor with another @Inject up here, use a string for resolves.
 * @Inject('messages')
 * class Inbox {
 *
 *   // The resolve function must be static. You can optionally inject with @Inject
 *   @Resolve()
 *   @Inject('$http')
 *   static messages($http) {
 *      return $http.get('/api/messages);
 *   }
 *
 *   constructor(public messages) { }
 * }
 *
 * @Component({ selector: 'app', template: '<ui-view></ui-view>' })
 * @StateConfig([
 *   { name: 'inbox', url: '/', component: Inbox. }
 * ])
 * class App {}
 */
export function Resolve(resolveName: string = null) {
  return function(target: any, resolveFnName: string, { value: resolveFn }) {
    if (!targetIsStaticFn(target)) {
      throw new Error('@Resolve target must be a static method.')
    }

    componentStore.merge(annotatedResolvesKey, { [resolveName || resolveFnName]: resolveFn }, target)
  }
}

componentHooks.extendDDO((ddo: any) => {
  if (ddo.template && ddo.template.replace) {
    // Just a little sugar... so folks can write 'ng-outlet' if they want
    ddo.template = ddo.template.replace(/ng-outlet/g, 'ui-view')
  }
})

componentHooks.after((target: any, name: string, injects: string[], ngModule: IModule) => {
  const childStateConfigs: IComponentState[] = componentStore.get(childConfigsKey, target)

  if (childStateConfigs) {
    if (!Array.isArray(childStateConfigs)) {
      throw new TypeError(createConfigErrorMessage(target, ngModule, '@StateConfig param must be an array of state objects.'))
    }

    ngModule.config(['$stateRegistryProvider', function($stateRegistry) {
      // if (!$stateProvider) return

      function setupConfig(config) {
        if (!config.component) return null

        // You can add resolves in two ways: a 'resolve' property on the StateConfig, or via
        // the @Resolve decorator. These lines handle merging of the two (@Resolve takes precedence)
        // Also if a resolve function needs to be injected with @Inject we make sure to add $inject
        // to that function so it works.
        const annotatedResolves = componentStore.get(annotatedResolvesKey, config.component) || {}
        Object.keys(annotatedResolves).forEach(resolveName => {
          const resolveFn = annotatedResolves[resolveName]
          const fnInjects = bundleStore.get('$inject', resolveFn)
          resolveFn.$inject = fnInjects
        })
        config.resolve = Object.assign({}, config.resolve, annotatedResolves)

        let name = providerStore.get('name', config.component)

        if (config.root) {
          config.component = name
        } else {
          let root = config.name.split('.')[0]
          config.views = { [`@${root}`]: name }
          delete config.component
        }

        return config
      }

      childStateConfigs.forEach((config: IComponentState) => {
        let conf = setupConfig(Object.assign({}, config))
        if (conf) $stateRegistry.register(conf)
      })
    }])
  }
})

componentHooks.beforeCtrlInvoke((caller: any, injects: string[], controller: any, ddo: any, $injector: any, locals: any) => {
  // Here we just grab the already resolved values and add them as locals before the component's
  // controller is invoked
  const resolvesMap = componentStore.get(resolvedMapKey, controller)
  Object.assign(locals, resolvesMap)
})


