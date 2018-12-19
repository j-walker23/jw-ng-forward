import { IModule } from 'angular'
import { bundleStore, providerStore } from '../writers';
import {Module} from './module';
import {Inject} from '../decorators/inject';
import {getInjectableNameWithJitCreation} from '../util/get-injectable-name';
import {Providers} from '../decorators/providers';
import {INJECTABLE} from '../decorators/injectable';
import {OpaqueToken} from "./opaque-token";

const TYPE = 'provider';

/**
 * A binding from a token to a value (only one implemented currently), class, existing, or factory
 */
export class Provider {
  public isProvider = true;
  public token: any;
  public useClass: any;
  public useValue: any;
  public useConstant: any;
  public useFactory: any;
  private _dependencies: string[] = [];
  private _type: string;

  constructor(token: string|OpaqueToken|Function,
    {
      useClass,
      useValue,
      useConstant,
      useFactory,
      deps
    } :
    {
      useClass?: any,
      useValue?: any,
      useConstant?: any,
      useFactory?: any,
      deps?: any[]
    }
  ) {
    try { this.token = getInjectableNameWithJitCreation(token); }
    catch (e) { throw new Error(`new Provider() Error: Invalid token ${token}`); }

    Object.assign(this, {useClass, useValue, useConstant, useFactory});

    if (!useClass && !useValue && !useConstant && !useFactory) {
      throw new Error(`new Provider(${token}) Error: No usage provided (i.e. useClass, useValue, useConstant, useFactory)`)
    }

    if (deps) {
      // Simulate having both an @Inject and provide: [] on the factory function
      Inject(...deps)(this.useFactory);
      Providers(...deps.filter(d => typeof d !== 'string'))(this.useFactory, `while analyzing Provider '${this.token}' useFactory deps`);
      this._dependencies = bundleStore.get('$inject', this.useFactory);
    }

    // Setup provider information using the parsed selector
    providerStore.set('name', this.token, this);
    providerStore.set('type', TYPE, this);
  }

  get type(): string {
    if (this._type) return this._type;

    this._type = Object.keys(this).find((k: string) : boolean => k.startsWith('use') && this[k] !== undefined);

    return this._type;
  }

  get dependencies(): string[]{
    return this._dependencies;
  }
}


// ## Provider Parser
Module.addProvider(TYPE, (provider: Provider, name: string, injects: string[], ngModule: IModule) => {
  switch (provider.type) {
    case 'useValue':
        ngModule.value(provider.token, provider.useValue);
        break;
    case 'useConstant':
        ngModule.constant(provider.token, provider.useConstant);
        break;
    case 'useClass':
        injects = bundleStore.get('$inject', provider.useClass) || [];
        Module.getParser(INJECTABLE)(provider.useClass, provider.token, injects, ngModule);
        break;
    case 'useFactory':
        ngModule.factory(provider.token, [...provider.dependencies, provider.useFactory]);
        break;
    default:
        break;
  }
});


/**
 * Sugar for creating a new binding.
 * @param token
 */
export const provide = (token: string|OpaqueToken|Function,
    {
      useClass,
      useValue,
      useConstant,
      useFactory,
      deps
    } :
    {
      useClass?: any,
      useValue?: any,
      useConstant?: any,
      useFactory?: any,
      deps?: any[]
    }
  ) : Provider => {
  return new Provider(token, {useClass, useValue, useConstant, useFactory, deps});
};
