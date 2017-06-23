import parseSelector from '../util/parse-selector'
import { providerStore, componentStore, bundleStore } from '../writers'
import { Providers } from './providers'
import { Module } from '../classes/module'
import { writeMapMulti } from './input-output'
import { inputsMap } from '../properties/inputs-builder'
import { events } from '../events/events'
import { createConfigErrorMessage } from '../util/helpers'
import { directiveControllerFactory } from '../util/directive-controller';
import { componentHooks, CompType } from './component'

const TYPE = 'dircomp';


// ## Decorator Definition
export function DirComp({
                          selector,
                          controllerAs,
                          template,
                          templateUrl,
                          transclude = true,
                          providers = [],
                          inputs = [],
                          outputs = [],
                          pipes = [],
                          directives = []
                        }: CompType) {
  return function(t: any) {
    // The only required config is a selector. If one wasn't passed, throw immediately
    if (!selector) {
      throw new Error(`Component Decorator Error in "${t.name}": Component selector must be provided`);
    }

    // Grab the provider name and selector type by parsing the selector
    let { name, type: restrict } = parseSelector(selector);

    // Setup provider information using the parsed selector
    providerStore.set('name', name, t);
    providerStore.set('type', TYPE, t);

    // The appWriter needs the raw selector. This lets it bootstrap the root component
    bundleStore.set('selector', selector, t);

    // Grab the providers from the config object, parse them, and write the metadata
    // to the target.
    Providers(...providers)(t, `while analyzing Component '${t.name}' providers`);

    // Restrict type must be 'element'
    componentStore.set('restrict', restrict, t);

    // Components should always create an isolate scope
    componentStore.set('scope', {}, t);

    // Since components must have a template, set transclude to true
    componentStore.set('transclude', transclude, t);

    // Inputs should always be bound to the controller instance, not
    // to the scope
    componentStore.set('bindToController', true, t);

    // Must perform some basic shape checking on the config object
    [
      ['inputs', inputs],
      ['providers', providers],
      ['directives', directives],
      ['outputs', outputs]
    ].forEach(([propName, propVal]) => {
      if (propVal !== undefined && !Array.isArray(propVal)) {
        throw new TypeError(`Component Decorator Error in "${t.name}": Component ${propName} must be an array`);
      }
    });

    writeMapMulti(t, inputs, 'inputMap');

    let outputMap = writeMapMulti(t, outputs, 'outputMap');
    Object.keys(outputMap).forEach(key => events.add(key));


    // Allow for renaming the controllerAs
    if (controllerAs === '$auto') {
      // ControllerAs is the parsed selector. For example, `app` becomes `app` and
      // `send-message` becomes `sendMessage`
      componentStore.set('controllerAs', name, t);
    } else if (controllerAs) {
      // set to what was provided
      componentStore.set('controllerAs', controllerAs, t);
    } else {
      // set to default of 'ctrl'
      componentStore.set('controllerAs', 'ctrl', t);
    }

    // Set a link function
    if (t.link) {
      componentStore.set('link', t.link, t);
    }

    // Set a compile function
    if (t.compile) {
      componentStore.set('compile', t.compile, t);
    }

    if (templateUrl) {
      componentStore.set('templateUrl', templateUrl, t);
    }
    else if (template) {
      componentStore.set('template', template, t);
    }
    else {
      throw new Error(`@Component config must include either a template or a template url for component with selector ${selector} on ${t.name}`);
    }

    Providers(...directives)(t, `while analyzing Component '${t.name}' directives`);
    Providers(...pipes)(t, `while analyzing Component '${t.name}' pipes`);

  }
}

Module.addProvider(TYPE, (target: any, name: string, injects: string[], ngModule: angular.IModule) => {
  // First create an empty object to contain the directive definition object
  let ddo: any = {};

  // Loop through the key/val pairs of metadata and assign it to the DDO
  componentStore.forEach((val, key) => ddo[key] = val, target);

  // Get the inputs bindings ahead of time
  let bindProp = 'bindToController'
  ddo[bindProp] = inputsMap(ddo.inputMap);

  // If the selector type was not an element, throw an error. Components can only
  // be elements in Angular 2, so we want to enforce that strictly here.
  if (ddo.restrict !== 'E') {
    throw new Error(createConfigErrorMessage(target, ngModule,
      `@Component selectors can only be elements. ` +
      `Perhaps you meant to use @Directive?`));
  }

  // Component controllers must be created from a factory. Checkout out
  // util/directive-controller.js for more information about what's going on here
  controller.$inject = ['$scope', '$element', '$attrs', '$transclude', '$injector'];

  function controller($scope: any, $element: any, $attrs: any, $transclude: any, $injector: any): any {
    let locals = { $scope, $element, $attrs, $transclude };

    return directiveControllerFactory(this, injects, target, ddo, $injector, locals);
  }

  ddo.controller = controller;

  if (typeof target.prototype.ngAfterViewInit === 'function') {
    ddo.link = () => ddo.ngAfterViewInitBound();
  }

  if (ddo.template && ddo.template.replace) {
    ddo.template = ddo.template.replace(/ng-content/g, 'ng-transclude')
  }

  componentHooks._extendDDO.forEach(hook => hook(ddo, target, name, injects, ngModule));

  // Finally add the component to the raw module
  ngModule.directive(name, () => ddo);

  componentHooks._after.forEach(hook => hook(target, name, injects, ngModule));
});
