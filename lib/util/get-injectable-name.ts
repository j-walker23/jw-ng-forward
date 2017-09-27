import { providerStore } from '../writers';
// ## Intro
// Import the `@Injectable` decorator. We'll apply it to functions/classes that are
// injected that are missing provider metadata. Convenience!
import { Injectable } from '../decorators/injectable';
import { OpaqueToken } from '../classes/opaque-token';

export const getInjectableName = (injectable: any) => {
  // Return it if it is already a string like `'$http'` or `'$state'`
  if(typeof injectable === 'string' || injectable instanceof OpaqueToken) {
    return injectable.toString();
  }
  // If the injectable is not a string but has provider information, use
  // the provider name. This is set by the collection of provider decorators
  else if(providerStore.has('type', injectable)) {
    return providerStore.get('name', injectable);
  }
};

export const getInjectableNameWithJitCreation = (injectable: any) => {
  let name = getInjectableName(injectable);

  if (name) {
    return name;
  }

  // If it is a function but is missing provider information, apply the Injectable
  // provider decorator to the function to turn it into a service.
  if (typeof injectable === 'function') {
    Injectable(injectable);
    return providerStore.get('name', injectable);
  }
};