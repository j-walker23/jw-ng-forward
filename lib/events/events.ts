import { IParseService, IScope } from 'angular'
import { Directive } from '../decorators/directive'
import { Inject } from '../decorators/inject'
import parseSelector from '../util/parse-selector'
import { dasherize } from '../util/helpers'

let eventList = new Set([
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mouseover',
  'mouseout',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'keydown',
  'keyup',
  'keypress',
  'submit',
  'focus',
  'blur',
  'copy',
  'cut',
  'paste',
  'change',
  'dragstart',
  'drag',
  'dragenter',
  'dragleave',
  'dragover',
  'drop',
  'dragend',
  'error',
  'input',
  'load',
  'wheel',
  'scroll'
]);

function resolve(): any[] {
  let directives: any[] = [];

  eventList.forEach(event => {
    const selector = `[(${dasherize(event)})]`;
    @Directive({ selector })
    @Inject('$parse', '$element', '$attrs', '$scope')
    class EventHandler {
      public expression: any;

      constructor($parse: IParseService, public $element: JQuery, $attrs: angular.IAttributes, public $scope: IScope) {
        let { name: attrName } = parseSelector(selector);
        this.expression = $parse($attrs[attrName]);
        $element.on(event, e => this.eventHandler(e));
        $scope.$on('$destroy', () => this.onDestroy());
      }

      eventHandler($event: any = {}) {
        if ($event.detail && $event.detail._output !== undefined) {
          $event = $event.detail._output;
        }

        if ($event.originalEvent && $event.originalEvent.detail && $event.originalEvent.detail._output) {
          $event = $event.detail._output;
        }

        this.expression(this.$scope, { $event });
        this.$scope.$applyAsync();
      }

      onDestroy() {
        this.$element.off(event);
      }
    }

    directives.push(EventHandler);
  });

  return directives;
}

function add(...customEvents: string[]) {
  customEvents.forEach(event => eventList.add(event));
}

export const events = { resolve, add };
