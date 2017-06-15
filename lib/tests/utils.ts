import {ng} from './angular';
import '../util/jqlite-extensions';
import * as tcb from '../testing/test-component-builder';
import {Component} from '../decorators/component';

export function quickFixture({
      providers=[],
      directives=[],
      template='<div></div>'
    }){

  ng.useReal();

  @Component({ selector: 'test', template, directives, providers })
  class Test {}

  let builder =  new tcb.TestComponentBuilder();
  
  //noinspection TypeScriptUnresolvedFunction
  return builder.create(Test);
};