import { IModule } from 'angular'

// # Directive Decorator
//
// ## Usage
//
// ## Setup
// `parseSelector` takes some simple CSS selector and returns a camelCased version
// of the selector as well as the type of selector it was (element, attribute, or
// CSS class).
import parseSelector from '../util/parse-selector'
import { bundleStore, componentStore, providerStore } from '../writers'
import { Providers } from './providers'
import { Module } from '../classes/module'
import { createConfigErrorMessage } from '../util/helpers'
import { directiveControllerFactory } from '../util/directive-controller'
// `providerStore` sets up provider information, `componentStore` writes the DDO,
// and `appWriter` sets up app traversal/bootstrapping information.
// Takes the information from `config.providers` and turns it into the actual metadata
// needed during app traversal
// Provider parser will need to be registered with Module

// The type for right now is `directive`. In angular-decorators there was very little
// difference between `@Component` and `@Directive` so they shared a common provider
// parser defined in `../../util/decorate-directive.js`
const TYPE = 'directive';

export interface DirType {
  selector: string,
  providers?: any[],
  directives?: any[],

  [key: string]: any
}

// ## Decorator Definition
export function Directive(obj: DirType) {

  let { selector, providers = [] } = obj

  return function(t: any) {
    // The only required config is a selector. If one wasn't passed, throw immediately
    if (!selector) {
      throw new Error('Directive selector must be provided');
    }

    // Grab the provider name and selector type by parsing the selector
    let { name, type: restrict } = parseSelector(selector);

    if (providers !== undefined && !Array.isArray(providers)) {
      throw new TypeError(`Directive providers must be an array`);
    }

    // Setup provider information using the parsed selector
    providerStore.set('name', name, t);
    providerStore.set('type', TYPE, t);
    bundleStore.set('selector', selector, t);

    // Grab the providers from the config object, parse them, and write the metadata
    // to the target.
    Providers(...providers)(t, `while analyzing Directive '${t.name}' providers`);

    // Restrict type must be 'element'
    componentStore.set('restrict', restrict, t);
    let keys = Object.keys(obj).filter(k => ['selector', 'providers'].indexOf(k) < 0)
    keys.forEach(k => componentStore.set(k, obj[k], t))
  }
}

// ## Component Provider Parser
Module.addProvider(TYPE, (target: any, name: string, injects: string[], ngModule: IModule) => {
  // First create an empty object to contain the directive definition object
  let ddo: any = {};

  // Loop through the key/val pairs of metadata and assign it to the DDO
  componentStore.forEach((val, key) => ddo[key] = val, target);
  // if (name == 'uniqueInput')
  //   console.log('ddo', ddo)

  // If the selector type was not an element, throw an error. Components can only
  // be elements in Angular 2, so we want to enforce that strictly here.
  if (ddo.restrict !== 'A') {
    throw new Error(createConfigErrorMessage(target, ngModule,
      `@Directive selectors can only be attributes, e.g. selector: '[my-directive]'`));
  }

  // Finally add the directive to the raw module
  ngModule.directive(name, ['$injector', ($injector: angular.auto.IInjectorService) => {
    // Component controllers must be created from a factory. Checkout out
    // util/directive-controller.js for more information about what's going on here
    ddo.link = function($scope: any, $element: any, $attrs: any, $requires: any, $transclude: any) {
      let locals = { $scope, $element, $attrs, $transclude, $requires };
      return directiveControllerFactory(this, injects, target, ddo, $injector, locals);
    };

    return ddo;
  }]);
});
