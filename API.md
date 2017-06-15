# API Reference

#### Table of Contents

Methods:
- [bootstrap](#bootstrap)
- [bundle](#bundle)
- [provide](#provide)

Decorators:
- [@Component](#component)
    - [Inputs / Outputs](#inputs-and-outputs)
    - [Life Cycle Hooks](#component-life-cycle-hooks)
- [@Directive](#directive)
- [@Input](#input)
- [@Output](#output)
- [@Injectable](#injectable)
- [@Inject](#inject)
- [@Pipe](#pipe)
- [@StateConfig](#stateconfig)
- [@Resolve](#resolve)

[Testing](#testing):
- [providers](#providers)
- [TestComponentBuilder](#testcomponentbuilder)
- [ComponentFixture](#componentfixture)
- [Extended Angular Element](#extended-angular-element)

Other:
- [The Dependency Tree](#the-dependency-tree)
- [EventEmitter](#eventemitter)

## bootstrap

Used to bootstrap your ng-forward application. Pass it your entry point component and it'll [bundle](#bundle) up your app and then bootstrap it. Do **not** use the `ng-app` directive.

Example:

```js
import { bootstrap, Component } from 'ng-forward';

@Component({ selector: 'app', template: 'Hello World!' })
class App { }

bootstrap(App);
```

###### Parameters

- **`component`**  **class**  Any class that has been decorated with [`@Component`](#component).
- **`otherProviders`**  **[Array&lt;[IProvidable](#iprovidable)&gt;]**  An array of other providers that you want to include in the bundle.

Returns the `injector` from the bootstrapped auto-bundled module.

###### Behind the Scenes

[`bundle`](#bundle) is called to auto-create an angular module and then `angular.bootstrap` is called on the page element that matches the component's selector.

## bundle

*Note: Not really necessary if you are starting a project from scratch. Useful when you are migrating portions of an existing app over to ng-forward. `bundle` is not an Angular 2 method, it's just for ng-forward usage.*

Used to create (aka 'bundle up') an angular 1 module by tracing the provider tree of an entry point provider. Ng-Forward doesn't create an angular module until bundle or bootstrap is called. This differs from typical angular 1 where a module is usually created and then appended to with services and directives.

Example:

```js
import { bundle, Component } from 'ng-forward';

@Component({ selector: 'app', template: 'Hello World!',
    providers: [...otherProvidersToIncludeInTheBundle],
    directives: [...otherDirectivesToIncludeInTheBundle]
})
class App { }

export bundle('my.app', App).publish(); // Will export the bundled angular 1 module 'my.app'
```

###### Parameters

- **`moduleName`** **string** The name of the module to be created
- **`provider`** **class** The entry point provider whose dependencies (providers, directives) will be traced and bundled.
- **`otherProviders`**  **[Array&lt;[IProvidable](#iprovidable)&gt;]**  An array of other providers that you want to include in the bundle.

Returns a [`DecoratedModule`](#decoratedmodule).

###### Behind The Scenes

`angular.module` is called. All string-based providers are considered ng 1 modules and passed as deps to `angular.module`. All other providers are added as whatever is appropriate: [`@Component`](#component) calls `module.directive`, [`@Pipe`](#pipe) calls `module.filter`, [`@Injectable`](#injectable) calls `module.service`, etc.

#### The Dependency Tree

**Important! - please read**

It's important that you tell us what dependencies your component relies on and what it needs to be bundled up with it. This allows us to trace all the dependencies in your application and do our fancy just-in-time angular module creation. If you've left out a dependency it will not be included in the module.

There are various ways to specify dependencies:

```js
// Your component relies on another component? Add it to 'directives'.
@Component()
class MyOtherComponent {}

@Component({
  selector: 'my-component',
  directives: [MyOtherComponent],
  template: '<my-other-component></my-other-component>'
})
class MyComponent {}

// Your component relies on a directive? Add it to 'directives'.
@Directive()
class MyDirective {}

@Component({
  selector: 'my-component',
  directives: [MyDirective],
  template: '<div my-directive></div>'
})
class MyComponent {}

// Your component relies on a pipe? Add it to 'pipes'.
@Pipe()
class MyPipe {}

@Component({
  selector: 'my-component',
  pipes: [MyPipe],
  template: '<div>{{ ctrl.foo | myPipe }}</div>'
})
class MyComponent {}

// Your component relies on a service? Add it to 'providers' and/or @Inject it.
@Injectable()
class MyOtherService {}

@Component({
  selector: 'my-component',
  providers: [MyOtherService]
})
@Inject(MyOtherService)
class MyComponent {}

// Your component relies on an ng1 service? @Inject it as a string.
@Component()
@Inject('$http')
class MyComponent {
    constructor($http) {}
}

// Your component relies on an ng1 module? Add it to 'providers' as a string.
@Component({
  selector: 'my-component',
  providers: ['ui.router']
})
class MyComponent {}

// Your service relies on another service? Just @Inject it.
@Injectable()
class MyOtherService {}

@Injectable()
@Inject(MyOtherService)
class MyService {}
```

## @Component

A decorator for adding component metadata to a class. Components are essentially angular 1 directives with both a template and controller. If you are looking to only modify the host element in some way, you should use [@Directive](#directive).

Example:

```js
import { Component } from 'ng-forward';

@Component({
    selector: 'app',
    template: `Hello {{ctrl.place}}!`,
    providers: [...providers],
    directives: [...directives]
    pipes: [...pipes]
})
class App {
    constructor() {
        this.place = "World";
    }
}
```

###### Parameters

- **`selector`**  **string**  The component's selector. It must be a css tag selector, for example `'app'` or `'my-thing'` are **valid**, but `'[my-attr]'` or `'.my-class'` are **invalid**.
- **`template`**  **[string]**  The template string for the component. You can bind to class instance properties by prepending your bindings with the selector in camel-case form, e.g. `<h1>My Component's Name is: {{myComponent.name}}</h1>`.
- **`templateUrl`**  **[string]**  Path to an external html template file. Either `template` or `templateUrl` **must** be provided.
- **`providers`**  **[Array&lt;[IProvidable](#iprovidable)&gt;]**  Any providers that this component or any of it's children depends on.
- **`directives`**  **[Array&lt;[IProvidable](#iprovidable)&gt;]**  Any directives or components that this component or any of it's children depends on.
- **`pipes`**  **[Array&lt;[IProvidable](#iprovidable)&gt;]**  Any [pipes](#pipe) that this component or any of it's children depends on.
- **`inputs`**  **[Array&lt;string&gt;]**  An array of strings naming what class properties you want to expose in `bindToController` (or `scope` if angular 1.3). For example, `inputs: ['foo']` will connect the class property `foo` to the input `foo`. You can also rename the input, for example `inputs: ['foo:theFoo']` will connect the class property `foo` to the input `the-foo`.
- **`outputs`**  **[Array&lt;string&gt;]**  An array of strings naming what class properties you want to expose as outputs. For example, `outputs: ['fooChange']` will notify the app that this component can fire a `'fooChange'` event. If there is a class property `fooChange` that is an `EventEmitter` it can trigger this event via `this.fooChange.emit()`. Otherwise the event can also be triggered with a regular DOM event of name `'fooChange'`. You can also rename the output, for example `inputs: ['fooChange:theFooChange']` will notify of a 'theFooChange' event, but will still look for a `fooChange` property on the class.
- **`controllerAs`**  **[string='ctrl']**  The controller name used in the template. By default uses 'ctrl'. We wanted to use something consistent across all components to make migration to Angular 2 easier later. When migrating you'll only need to do a simple find and replace of all 'ctrl.' and remove them. If you want the controllerAs name to match the selector (camel-cased) then set controllerAs to '$auto'.

## Inputs and Outputs

Inputs and Outputs are the public API of a component. There are two ways to specify them.
- The `inputs` and `outputs` config property on @Component
- The [@Input](#input) and [@Output](#output) decorators

If you had a component `MenuDropdown` like so:

```js
@Component({
    selector: 'menu-dropdown',
    template: `
    <label>{{ctrl.name}}</label>
    <a ng-repeat="option in ctrl.options" ng-href="{{option.action}}">{{option.name}}</a>
    `,
    // You can do it this way, or...
    inputs: ['options'],
    outputs: ['optionSelect']
})
class MenuDropdown {
    // Or you can use decorators instead of the config properties above
    @Input() options;
    @Output() optionSelect = new EventEmitter;
}
```

Then I could use that component in another component's template like so, passing in 'inputs' and listening for 'outputs'.

```html
@Component({
    selector: 'main-menu',
    template: `
    <div ng-repeat="menu in ctrl.menus">
        <menu [options]="menu.options" (option-select)="menu.optionSelected($event)"></menu>
    </div>
    `
})
class MainMenu {}
```

###### Input Usage

Every input can be bound in three different ways, just like Angular 2:

- String-based `foo="some string"`. Will pass the raw string into the input.
- One-way binding `[foo]="someObj.property"`. Will one-way bind the expression to the input. The input can be changed locally but if the expression ever changes it will overwrite the input with the latest value.
- Two-way binding `[(foo)]="someObj.property"`. Will two-way bind the expression to the input. If either the input or expression changes, the other will change to match.

**Important:** We do **not** support the optional `bind-foo` and `bind-on-foo` syntax. We decided it may impact performance.

###### Output Usage

Every output can be listened for using the `(event)="handler()"` syntax. The `$event` var can be used your expression like this, `(event)="handler($event)"`, and will either be a reference to your output's payload for custom outputs, or a reference to the DOM event object for standard DOM events.

**Important:** We do **not** support the optional `on-event` syntax.

Trigger an output via an [EventEmitter](#eventemitter) instance. This is the preferred method, but it [does not bubble](https://github.com/angular/angular/issues/2296#issuecomment-164289758).

```js
import { Component, Output, EventEmitter } from 'ng-forward';

@Component({ ... })
class MenuDropdown {
    // Initialize your output as an EventEmitter
    @Output() optionSelect = new EventEmitter();

    triggerEventViaEventEmitter() {
        // You can optionally pass along a payload
        this.optionSelect.emit(selectedOption);
    }
}
```

Then you'd use it like so:
```html
<menu-dropdown (option-select)="ctrl.optionSelected($event)"></menu-dropdown>
```

## Component Life Cycle Hooks

Life cycle hooks are methods added to a Component or Directive. If the hook is present then it will be fired at the designated time. Read about each hook and when and why you would use it.

#### `ngOnInit()`

Implement this method to execute custom initialization logic after your directive's data-bound properties have been initialized and after the constructor. It is invoked only once when the directive is instantiated.

Example:
```js
import { Component, Input } from 'ng-forward';

@Component({ ... })
class MyComponent {
  @Input() foo;

  constructor() {
    console.log("this.foo", this.foo); // not ready :(
  }

  ngOnInit() {
    console.log("ngOnInit");
    console.log("this.foo", this.foo); // ready to go!
  }
}
```

#### `ngAfterViewInit()`

Implement this interface to get notified when your component's view has been fully initialized. All children components in the view will have their controller instances ready at this time.

Example:
```js
import { Component, Inject } from 'ng-forward';

@Component({
    selector: 'child',
    template: 'x'
})
class Child {}

@Component({
    selector: 'parent',
    directives: [Child],
    template: `<child></child>`
})
@Inject('$element')
class Parent {
    constructor($element) {
        this.$element = $element;
        console.log(this.$element.find('child').componentInstance); // not ready :(
    }

    ngAfterViewInit() {
        console.log(this.$element.find('child').componentInstance); // ready to go!
    }
}
```

#### `ngOnDestroy()`

Implement this interface to get notified when your directive is destroyed.

ngOnDestroy callback is typically used for any custom cleanup that needs to occur when the instance is destroyed.

Example:
```js
import { Component } from 'ng-forward';

@Component({ ... })
class MyComponent {
  ngOnDestroy() {
    console.log("ngOnDestroy");
  }
}
```

###### Transclusion

Transclusion is always enabled. Just add `<ng-content></ng-content>` (converted to ng-transclude during pre-compilation) or `<ng-transclude></ng-tranclude>` to mark your transclusion point.

###### Behind the Scenes

At [bootstrap](#bootstrap) time, a call to `angular.directive` is made. Angular 1 directive properties are set as follows:

- `template` is set via the @Component config template property (`templateUrl` can also be used)
- `controller` is set to the class instance, but it not instantiated until after the link phase so that child directives are available in the DOM. `$scope`, `$element`, `$attrs`, and `$transclude` are injectable as locals.
- `restrict` is set to 'E' since components must use tag-based selectors.
- `controllerAs` is set to 'ctrl' but can be overridden if you prefer 'vm' or something else. Or you can set it to '$auto' which will set it to a camel-cased version of the selector.
- `scope` and `bindToController`:
    - If angular 1.3, inputs are set on an isolated `scope` and `bindToController` to `true`.
    - If angular 1.4+, `scope` is set to an isolate scope with `{}` and inputs are set on `bindToController` object.
- `transclude` is always set to `true`
- `link` and `compile` are not set but you can optionally set them if needed via the decorator.
- For each output we create a directive of `'(outputName)'` that is listening for a DOM event or rx event of the same name.
- Ng-forward does not differentiate between the `providers`, `directives` or `pipes` config properties; they're all used to define dependencies for the bundle. However in Angular 2 their unique usage matters, so you should use the properties properly to ease migration to Angular 2.

## @Directive

A decorator for adding directive metadata to a class. Directives differ from Components in that they don't have templates; they only modify the host element.

Example:

```js
import { Directive } from 'ng-forward';

@Directive({
    selector: '[foo-class]',
    providers: [...providers],
})
@Inject('$element')
class FooClass {
    constructor($element) {
        $element.addClass('foo');
    }
}
```

###### Parameters

- **`selector`**  **string**  The component's selector. It must be a css attribute selector, for example `'[my-thing]'` is **valid**, but `'my-component'` or `'.my-class'` are **invalid**.
- **`providers`**  **[Array&lt;IProvidable&gt;]**  Any providers that this component or any of it's children depends on.

###### Behind the Scenes

At [bootstrap](#bootstrap) time, a call to `angular.directive` is made. Angular 1 directive properties are set as follows:

- `template` is not set.
- `controller` is set to the class instance, but it not instantiated until after the link phase so that child directives are available in the DOM. `$scope`, `$element`, `$attrs`, and `$transclude` are injectable as locals.
- `restrict` is set to 'A' since directives must use attribute-based selectors.
- `scope` is not set and so is not isolated.
- `link` and `compile` are not set and are not able to be set.

## @Input

An alternative a preferred method to using the `inputs` property on [@Component](#component).

Example:

```js
@Component({ ... })
class MenuDropdown {
    @Input() options;
}
```

###### Parameters

- **`exposedName`**  **[string]**  If provided, then it will be the name of the input when setting on the html element.

## @Output

An alternative and preferred method to using the `outputs` property on [@Component](#component). Example: `@Input('fooPublic') fooLocal;`.

Example:

```js
@Component({ ... })
class MenuDropdown {
    @Output() optionSelect = new EventEmitter();

    someMethod() {
        this.optionSelect.emit('payload');
    }
}
```

###### Parameters

- **`exposedName`**  **[string]**  If provided, then it will be the name of the output when listening on the html element. Example: `@Output('fooChangePublic') fooChangeLocal;`.

## EventEmitter

Extends RxJS [Subject](https://github.com/ReactiveX/RxJS/blob/master/src/Subject.ts). Really we have this specifically for [Outputs](#output) but could be used for your own general purpose event emitter as well.

#### `subscribe()`

`subscribe(generatorOrNext?: any, error?: any, complete?: any): any`

We use this method behind the scenes to subscribe to your output events. You most likely will not use this method.

###### Parameters

- **`generatorOrNext`**  **Object | Function**  If **Function**, then it's a callback that is called everytime the Subject triggers 'next'.
- **`generatorOrNext.next`**  **[Function]**  Callback that is called everytime the Subject triggers 'next'.
- **`generatorOrNext.error`**  **[Function]**  Callback that is called when the Subject has an 'error'.
- **`generatorOrNext.complete`**  **[Function]**  Callback that is called when the Subject is 'completed'.
- **`error`**  **[Function]**  Callback that is called when the Subject has an 'error'.
- **`complete`**  **[Function]**  Callback that is called when the Subject is 'completed'.

#### `emit()`

`emit(value: any)`

Will trigger all subscriber's next callbacks, passing along the value. This is the main way to trigger an EventEmitter-based output.

###### Parameters

- **`value`**  **[any]**  A value to pass along to the next callback of any event subscribers.

## @Injectable

A decorator that marks a class as injectable. It can then be injected into other annotated classes via the [@Inject](#inject) decorator.

Example:

```js
import { Injectable, Inject } from 'ng-forward';

@Injectable()
class MyService {
    getData() {}
}

@Injectable()
@Inject(MyService)
class MyOtherService {
    constructor(myService) {
        this.data = myService.getData();
    }
}
```

###### Behind the Scenes

At bootstrap time, a call to `module.service` is made. The service name is auto-generated as you should not need to access manually. If you must access it, use the [getInjectableName()](#getinjectablename) utility method.

## @Inject

A decorator that declares the dependencies to be injected in to the class' constructor or a static method.

Example:
```js
import { Component, Inject } from 'ng-forward';
import { MyService } from './my-service.js';

@Component()
class MyParentComponent {}

@Component()
@Inject('$q', '$element', MyService, MyParentComponent)
class MyChildComponent {
    constructor($q, $element, myService, myParent) { }

    // also works on static methods
    @Inject('$q', '$element', MyService)
    static foo($q, $element, myService) {}
}
```

###### Parameters

- **`injectables`**  **string | class**  One or more injectables. Can be of type **string** or **class**.
    - If **string**, then it's considered a core angular service such as $q or $http. It could also be a special 'local', for example component's can inject `$element`, `$attrs` or `$scope`.
    - If **class**, then it's considered to be an annotated class that is injectable, for example via the [@Injectable](#injectable) decorator or a parent component class. Parent components can only be injected into the constructor of another component. Also currently this only works when the child is transcluded into the parent.

###### Behind the Scenes

The injectables are added to the `$inject` property of the class constructor function. Parent components will be injected as locals.

## provide

Creates a new provider to be bundled with your application and available for injection. This can be used in similar fashion to `module.value`, `module.constant`, `module.factory`, `module.service` and also to overwrite existing dependecies during testing.

Example:

```js
import { Component, provide } from 'ng-forward';

const MY_CONSTANT = new OpaqueToken('myConstant');

class MyClass {}
class MyOtherClass {}

@Injectable()
class MyService {
    getData() {}
}

@Component({
    selector: 'app',
    template: '...',
    providers: [
        provide('myValue',  { useValue: 100 }),
        provide(MY_CONSTANT,{ useConstant: 0 }),
        provide(MyClass,    { useClass: MyOtherClass }),
        provide(MyData,     { useFactory: myService => myService.getData(), deps: [MyService] })
    ]
})
@Inject('configVal')
class App {
    constructor(configVal) {
        this.configVal = configVal;
    }
}
```

###### Parameters

- **`token`**  **string | class | [OpaqueToken](#opaquetoken)**  A token that will be used when asking for the dependency. Whatever you use, string, class or OpaqueToken, you must use that same object when injecting the dependency with [@Inject](#inject). If you pass a class, it does not need to be already annotated since it's simply used as a token key.
- **`provideType`**  **Object**  An object with various options on how to provide the dependency. Only one of the following should be used:
    - **`provideType.useValue`**  **[any]**  If used, the value is provided when the token is requested from the injector.
    - **`provideType.useConstant`**  **[any]**  If used, the constant is provided when the token is requested from the injector.
    - **`provideType.useClass`**  **[class]**  If used, the class is provided when the token is requested from the injector. This is equivalent to adding [@Injectable](#injectable) to a class. But could be useful to overwrite an existing @Injectable with a new provided class.
    - **`providerType.useFactory`**  **[Function]**  If used, the return value of the factory function is provided when the token is requested from the injector. You can also inject the function by supplying an array of dependencies to `providerType.deps`.
    - **`providerType.deps`**  **[Array&lt;[IProvidable](#iprovidable)&gt;]**  Only used along with `useFactory` to inject dependencies.

Returns a [Provider](#provider).

###### Provider

A generic dependency that is fulfilled by either value, constant, class or factory based on a unique token. To create Providers, use [provide](#provide).

###### OpaqueToken

Used to create a object to be used as a token with [`provide`](#provide)

Example:

```js
import { provide, OpaqueToken } from 'ng-forward';

const CONFIG_VAL = new OpaqueToken('configVal');

@Component({
    ...
    providers: [
        provide(CONFIG_VAL, { useConstant: 100 })
    ]
})
@Inject(CONFIG_VAL)
class App {}
```

###### Behind the Scenes

- `useValue` spurs a call to `module.value`
- `useConstant` spurs a call to `module.constant`
- `useClass` spurs a call to `module.service`
- `useFactory` spurs a call to `module.factory`

## IProvidable

Anything that can be passed as a provider that you want to include in the bundle. Can be of type **string**, **class**, or **Provider**.

- If **string**, will be considered an angular 1 legacy module. E.g. 'ui-router', 'my-other-ng1-module'.
- If **class**, must be an [@Injectable](#injectable) and will add that 'service' to the bundle. Regular ES6 classes will throw an error.
- If [**Provider**](#provider), will be included in bundle as specified.

## @Pipe

A decorator for adding pipe metadata to a class. Pipes are essentially the same as angular 1 filters.

Example:
```js
import { Pipe, Component } from 'ng-forward';

@Pipe
class FirstLetter {

    // Mandatory
    transform(input, changeTo) {
        input[0] = changeTo;
        return input;
    }

    // Optional
    supports(input) {
        return typeof input === 'string';
    }
}

@Component({
    pipes: [FirstLetter],
    template: `{{ 'foo' | firstLetter:'z' }}` // Will change to 'zoo'
})
class Thing {}
```

###### Behind the Scenes

`module.filter` is called

## @StateConfig

A decorator for adding ui-router state configurations.

Example:
```js
import { Component, StateConfig } from 'ng-forward';
import uiRouter from 'ui-router';

@Component({
    selector: 'childA',
    template: '{{ ctrl.text }}' // will be 'A resolved!'
})
@Inject('resolveA')
class ChildA {
    constructor(resolveA) {
        this.text = resolveA;
    }
}

@Component({
    selector: 'parent',
    providers: [uiRouter],
    template: `<ng-outlet></ng-outlet>` // or <ui-view>
})
@StateConfig([
    { name: 'childA', url: '/childA', component: ChildA, resolve: { resolveA: () => 'A resolved!' } },
    { name: 'childZ', url: '/childZ', component: ChildZ }
])
class Parent {}
```

###### Parameters

- **`stateConfigs`**  **Array&lt;Object&gt;**  An array of state configurations, [see ui-router docs](http://angular-ui.github.io/ui-router/site/#/api/ui.router.state.$stateProvider#methods_state).
- **`stateConfigs[].component`**  **class**  In addition to all the normal config properties, you can route to a @Component class. The component will populate the `ui-view` when the state becomes active.

###### Behind the Scenes

Calls to `$stateProvider.state` are made. All `resolve`'s are added as locals for injection on the @Component's constructor.

## @Resolve

A decorator to be used in place of the `resolve` ui-router state property. You place this decorator on a static function and it will add that function to the state's resolve map. It is convenient because you can store the Resolve information alongside the component that needs it, instead of the parent. If you need to inject dependencies into the resolve method, use [@Inject](https://github.com/ngUpgraders/ng-forward/blob/master/API.md#inject).

Example:

```js
import { Component, StateConfig } from 'ng-forward';
import uiRouter from 'ui-router';

@Component({
    selector: 'childA',
    template: '{{ ctrl.text }}' // will be 'A resolved!'
})
@Inject('resolveA')
class ChildA {

    @Resolve()
    static resolveA() {
        return 'A resolved!';
    }

    // If you need injection, use @Inject
    @Resolve()
    @Inject('$q')
    static resolveA($q) {
        return $q.resolve('A resolved!');
    }

    constructor(resolveA) {
        this.text = resolveA;
    }
}

@Component({
    selector: 'parent',
    providers: [uiRouter],
    template: `<ng-outlet></ng-outlet>` // or <ui-view>
})
@StateConfig([
    { name: 'childA', url: '/childA', component: ChildA },
    { name: 'childZ', url: '/childZ', component: ChildZ }
])
class Parent {}
```

###### Parameters

- **`resolveName`**  **[string]**  If provided, you will use this name when requesting the resolve from the injector.

## DecoratedModule

A wrapper around the angular 1 module. This is mostly private and you shouldn't need to use it unless you are creating a plugin.

#### `add()`

Add an annotated class to the angular module.

###### Parameters

- **`providers`**  **...class**  One or more annotated classes to add to the module. Annotated classes need to have previously registered a parser with Module via `Module.addProvider` (an internal method used for adding decorators).

Returns the `DecoratedModule`.

#### `publish()`

Returns the raw angular 1 module.

#### `config()`

Adds a config function to the module. We hope to soon add a special @Config annotation that can be added to any component.

###### Parameters

- **`configFn`** **Function** A function to be ran during config phase of the angular module

#### `run()`

Adds a run function to the module. We hope to soon add a special @Run annotation that can be added to any component.

###### Parameters

- **`runFn`** **Function** A function to be ran during run phase of the angular module

## getInjectableName

A utility function that can be used to get the angular 1 injectable's name. Needed for some cases, since injectable names are auto-created.

Example:
```js
import { Injectable, getInjectableName } from 'ng-forward';

// this is given some random name like 'MyService48' when it's created with `module.service`
@Injectable
class MyService {}

console.log(getInjectableName(MyService)); // 'MyService48'

```

# Testing

Testing in ng-forward is very, very close to testing in Angular 2. We wanted your test migrations to be as minimal as possible.

## providers

A testing helper to help with mocking out dependencies, typically in a `beforeEach` block.

Example:

```js
beforeEach(providers(provide => {
  mockSomeService = {
    getData: sinon.stub().returns('mock success')
  };

  $http = { get: sinon.stub() };

  return [
    provide(SomeService, { useValue: mockSomeService }),
    provide('$http', { useValue: $http })
  ];
}));
```

###### Parameters

- **`provideFn`**  **Function**  A function that must return an array of [Providers](#provider). The function is passed the [provide](#provide) method for you to use.

## TestComponentBuilder

A testing helper specially designed to help you test [Components](#component).

You use the TestComponentBuilder to create a test bed component. Use the test bed component to test the actual component you want to test. Do this by including the component under test in the test component's view. Since you may not want the same usage every time, you can create a test component with generic view and then use `overrideTemplate` to set a specific view for a specific test case.

Example:

```js
import {Component} from 'ng-forward';
import {TestComponentBuilder} from 'ng-forward/testing';
import {MyComponent} from './my-component';

// Instantiate the Builder, this part is different than ng2.
// In ng2 you inject tcb.
const tcb = new TestComponentBuilder();

// Create your test bed
@Component({ selector: 'test-cmp')
class Test {}

describe('MyComponent', () => {
    it('does something', done => {
        let html = '<my-component name="mine"></my-component>';

        // Use tcb to override templates and providers, then create your fixture.
        tcb
            .overrideTemplate(Test, html)
            .createAsync(Test).then(fixture => {
                let myComponent = fixture.debugElement.componentViewChildren[0];
                expect(myComponent.name).to.equal('mine');
                done();
            });
    });
})

```

#### `createAsync()`

`createAsync(rootComponent: `[`Component`](#component)`): Promise<`[`ComponentFixture`](#componentfixture)`>`

Creates a [ComponentFixture](#componentfixture) out of a [Component](#component). This method is called last, after all desired override methods are called.

In ng-forward this is not really async. But we are polyfilling Angular 2 which is async. Be sure to call `done()` in your tests.

Example:
```js
it('tests something', done => {
    tcb.createAsync(TestComponent).then(fixture => {
        // ... test some stuff ...
        done();
    });
});
```

###### Parameters

- **`rootComponent`**  **class**  A @Component annotated class that you want to serve as the test bed. Typically this is not the actual component under test, but instead a container for your test.

Returns a `Promise<`[`ComponentFixture`](#componentfixture)`>`. The fixture's debugElement is set to the rootComponent as an `angular.element`.

#### `overrideTemplate()`

`overrideTemplate(component: `[`Component`](#component)`, template: string): TestComponentBuilder`

Override just the html of the test bed component. Set it to something relevant for your current test or test block. Use this method before calling `createAsync()`.

Returns the TestComponentBuilder for easy chaining.

#### `overrideProviders()`

`overrideProviders(component: `[`Component`](#component)`, providers: (`[`Component`](#component)`| string )[]): TestComponentBuilder`

Overrides one or more injectables configured via `providers` metadata property of a directive or component. Very useful when certain providers need to be mocked out. Use this method before calling `createAsync()`.

Returns the TestComponentBuilder for easy chaining.

#### `overrideView()`

`overrideView(component: `[`Component`](#component)`, config: { template?: string, templateUrl?: string, pipes?: any[], directives?: `[`IProvidable`](#iprovidable)`[] }): TestComponentBuilder`

Use this method before calling `createAsync()` to override the view of the test bed component. Similar to `overrideTemplate` but also allows setting other view properties.

Returns the TestComponentBuilder for easy chaining.

#### `overrideDirective()`

Not Yet Implemented.

#### `overrideViewProviders()`

Not Yet Implemented.

## ComponentFixture

A fixture for debugging and testing a component. Use the [TestComponentBuilder's](#testcomponentbuilder) `createAsync()` method to create one. You'll also use the [jqlite extensions](#extended-angular-element) pretty heavily.

Example:

```js
import {Component} from 'ng-forward';
import {TestComponentBuilder} from 'ng-forward/testing';
import {MyComponent} from './my-component';
import {MyService} from './my-service';

const tcb = new TestComponentBuilder();

@Component({ selector: 'test-cmp')
class Test {}

describe('MyComponent', () => {
    it('does something', done => {
        let html = '<my-component name="mine"></my-component>';

        tcb
            .overrideTemplate(Test, html)
            .createAsync(Test).then(fixture => {
                // debugElement is just an angular.element that has all the jqlite extensions
                fixture.debugElement.nativeElement; // Reference to <test-cmp> as a raw DOM element
                fixture.debugElement.componentInstance; // Reference to Test class instance attached to linked to nativeElement

                // There's also proxies of the two above properties added directly to the fixture.
                fixture.nativeElement;
                fixture.componentInstance;

                // There's more on debugElement
                fixture.debugElement.componentViewChildren; // An array of direct children within <test-cmp>. Each child is it's own jqlite object.
                let myComponent = fixture.debugElement.componentViewChildren[0]; // This is a debugElement but now wrapping <my-component>
                myComponent.nativeElement; // Reference to <my-component> as a raw DOM element
                myComponent.componentInstance; // Reference to MyComponent class instance attached to linked to nativeElement

                // There's also a helper on debugElement to get things from the injector attached to the fixture
                fixture.debugElement.getLocal('$q'); // Returns the $q service
                fixture.debugElement.getLocal(MyService); // Returns the MyService service

                // Since debugElements are just jqlite elements, you can use jqlite methods too
                // BUT BE CAREFUL!! You are probably going to make it harder to migrate later!!
                let myComponent = fixture.debugElement.find('my-component').componentInstance;
                
                done(); // be sure to tell the test that you are done.
            });
    });
})
```

#### `detectChanges()`

An alias to $rootScope.$apply() for the fixture's scope.

#### `debugElement`

An [Extended Angular Element](#extended-angular-element) wrapped around the test bed element. Read about the [properties and methods](#extended-angular-element) this object has.

#### `nativeElement`

A proxy to `debugElement.nativeElement` for convenience.

#### `componentInstance`

A proxy to `debugElement.componentInstance` for convenience.

## Extended Angular Element

An `angular.element` that has been extended with additional properties and methods. All JQlite and JQuery elements are extended by ng-forward automatically. Ng-Forward adds the following extensions to the JQLite / JQuery object returned by angular.element. These extensions mimic features found in Angular 2. These extensions serve as helpful methods for your convenience. All of these methods work on the 0 index element if the jq collection has more than one element.

#### `nativeElement`

**read-only** The native DOM element.

Example:
```js
constructor($element) {
  $element.nativeElement; // Alias to $element[0]
}
```

#### `componentInstance`

**read-only** The component's class instance.

Example:
```js
constructor($element) {
  $element.componentInstance; // Alias to $element.controller()
}
```

#### `componentViewChildren`

**read-only** An array of all child elements as Extended Angular Elements.

Example:
```js
constructor($element) {
  $element.componentViewChildren; // Roughly an alias to $element.children(), but all children are themselves an angular element.
}
```

#### `query(predicate)`

A method for finding the first descendant that matches a predicate. Valid values for predicate are `By.all()`, `By.css()`, or `By.directive()`.

Example:
```js
import {By} from 'ng-forward';

constructor($element) {
  $element.query(By.all()); // finds first descendant
  $element.query(By.css('.some-class')); // find first descendants matching the css selector
  $element.query(By.directive(SomeChildComponent)); // find first descendant that is instance of the directive
}
```

#### `queryAll(predicate)`

A method for querying the children of the element. Valid values for predicate are `By.all()`, `By.css()`, or `By.directive()`.

Example:
```js
import {By} from 'ng-forward';

constructor($element) {
  $element.queryAll(By.all()); // finds all descendants
  $element.queryAll(By.css('.some-class')); // finds all descendants matching the css selector
  $element.queryAll(By.directive(SomeChildComponent)); // finds all descendants that are instances of the directive
}
```

#### `getLocal(injectable)`

An easy way to ask the injector for a dependency. You can pass either string or annotated class.

Example:
```js
constructor($element) {
  $element.getLocal('$q'); // Alias to $element.injector().get('$q')
  $element.getLocal(SomeClass); // Unique to ng-forward. You can get a dep by class.
}
```

###### Parameters

- **`injectable`**  **string | class**  The string or annotated class you'd like to retrieve from the injector.
