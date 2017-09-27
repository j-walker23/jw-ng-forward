import '../tests/frameworks'
import { directiveControllerFactory } from './directive-controller'

describe('createDirectiveController', function () {

  class MyComponent {
    private bar = 'bar';

    constructor() {
    }

    foo() {
      return 'foo';
    }
  }

  class MockInjector {
    invoke() {
    }
  }

  class MockScope {
    $on() {
    }
  }

  it('should create an instance that inherits from the given Controller constructor', function () {
    let ng1Instance = new MyComponent();
    let mockInjector = new MockInjector();
    let mockElement = [{}];
    let mockScope = new MockScope();

    let instance = directiveControllerFactory(ng1Instance, [], MyComponent, {}, mockInjector, {
      $element: mockElement,
      $scope: mockScope
    });

    instance.should.not.equal(ng1Instance);
    instance.bar.should.eql('bar');
    instance.foo().should.eql('foo');
  });
});
