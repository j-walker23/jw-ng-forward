import {expect, sinon} from '../tests/frameworks';
import {Component} from '../decorators/component';
import {Inject} from '../decorators/inject';
import {Injectable} from '../decorators/injectable';
import {ng} from '../tests/angular';
import {providers, TestComponentBuilder} from './index';
import {ComponentFixture} from './test-component-builder';
import {By} from "../util/jqlite-extensions";

describe('Test Utils', () => {

  let tcb;
  let angular;
  let SomeService;
  let SomeOtherService;
  let SomeComponent;
  let TestComponent;

  beforeEach(() => {
    tcb = new TestComponentBuilder();
    angular = ng.useReal();

    @Injectable()
    class _SomeService {
      getData() { return 'real success' }
    }
    SomeService = _SomeService;

    @Injectable()
    class _SomeOtherService {
      getData() { return 'real other' }
    }
    SomeOtherService = _SomeOtherService;

    @Component({
      selector: 'some-component',
      inputs: ['foo', 'baz:bar'],
      bindings: [SomeService],
      template: `{{ctrl.foo}} {{ctrl.baz}} {{ctrl.quux()}} {{ctrl.local}}`
    })
    @Inject(SomeService, SomeOtherService, '$http', '$timeout')
    class _SomeComponent {
      private local = 'a';
      constructor(private SomeService, private SomeOtherService, private $http, private $timeout) {
        $http.get('/api');
        $timeout(() => this.local = 'c', 1000);
      }
      quux() { return `${this.SomeService.getData()} ${this.SomeOtherService.getData()}` }
    }
    SomeComponent = _SomeComponent;

    @Component({
      selector: 'test',
      template: `<some-component foo="Hello" [bar]="ctrl.bar" class="test"></some-component>`,
      directives: [SomeComponent]
    })
    class _TestComponent {
      private bar = "World";
      constructor() {}
    }
    TestComponent = _TestComponent;
  });

  describe('Test Component Builder Sync', () => {
    let mockSomeService;
    let mockSomeOtherService;
    let $http;
    let $timeout;
    let $rootScope;
    let fixture;
    let fixtureEl;
    let someComponentEl;

    // test the bindings call composed with the beforeEach fn
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

    // testing adding more bindings in an additional beforeEach
    beforeEach(() => {

      // test the bindings call inside the beforeEach fn
      providers(provide => {
        mockSomeOtherService = {
          getData: sinon.stub().returns('mock other')
        };

        return [
          provide(SomeOtherService, { useValue: mockSomeOtherService })
        ];
      });

    });

    beforeEach(() => {
      fixture = tcb.create(TestComponent);
      fixtureEl = fixture.debugElement;
      someComponentEl = fixture.debugElement.componentViewChildren[0];
    });

    // todo: write a custom inject function for ng-forward
    // currently I'm just using angular.mock.inject
    beforeEach(inject((_$timeout_, _$rootScope_) => {
      $timeout = _$timeout_;
      $rootScope = _$rootScope_;
    }));

    it('should bootstrap the test module', () => {
      expect(angular.module('test.module')).to.exist;
    });

    it('should return a root test component and decorated jqlite', () => {
      expect(fixture).to.be.an.instanceOf(ComponentFixture);

      // debugElement is an angular.element decorated with extra properties, see next lines
      expect(fixture.debugElement)
          .to.be.an.instanceOf(angular.element);

      // nativeElement is an alias to the [0] index raw dom element
      expect(fixture.nativeElement)
          .to.be.an.instanceOf(HTMLElement);

      // The actual class instance hosted by the element
      expect(fixture.componentInstance)
          .to.be.an.instanceOf(TestComponent);

      // nativeElement is an alias to the [0] index raw dom element
      expect(fixture.debugElement.nativeElement)
          .to.be.an.instanceOf(HTMLElement);

      // The actual class instance hosted by the element
      expect(fixture.debugElement.componentInstance)
          .to.be.an.instanceOf(TestComponent);

      // componentViewChildren is an alias to .children()
      expect(fixture.debugElement.componentViewChildren[0])
          .to.be.an.instanceOf(angular.element);

      // getLocal is an alias to $injector
      expect(fixture.debugElement.getLocal('$q'))
          .to.contain.all.keys(['resolve', 'reject', 'defer']);

      // Checking to be sure even nested jqlite elements are decorated
      expect(someComponentEl.nativeElement)
          .to.be.an.instanceOf(HTMLElement);

      expect(someComponentEl.componentInstance)
          .to.be.an.instanceOf(SomeComponent);

      expect(someComponentEl.componentViewChildren).to.be.empty;

      expect(someComponentEl.getLocal('$q'))
          .to.contain.all.keys(['resolve', 'reject', 'defer']);

      // queryAll()

      fixture.debugElement.queryAll(By.all())
          .should.have.length(1);

      fixture.debugElement.queryAll(By.css('.test'))
          .should.have.length(1);

      fixture.debugElement.queryAll(By.css('.invalid'))
          .should.have.length(0);

      fixture.debugElement.queryAll(By.directive(SomeComponent))
          .should.have.length(1);

      fixture.debugElement.queryAll(By.directive(SomeComponent))[0].componentInstance
          .should.be.an.instanceOf(SomeComponent);

      // query()

      fixture.debugElement.query(By.all()).componentInstance
          .should.be.an.instanceOf(SomeComponent);

      fixture.debugElement.query(By.css('.test')).componentInstance
          .should.be.an.instanceOf(SomeComponent);

      expect(fixture.debugElement.query(By.css('.invalid')))
          .to.be.null;

      fixture.debugElement.query(By.directive(SomeComponent)).componentInstance
          .should.be.an.instanceOf(SomeComponent);
    });

    it('should allow mock decorated class components and services via bindings() method', () => {
      expect(mockSomeService.getData).to.have.been.called;
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other a");
    });

    it('should allow mock angular 1 services via bindings() method', () => {
      expect($http.get).to.have.been.called;
    });

    it('should allow angular.mock special services (e.g. $timeout.flush)', () => {
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other a");
      $timeout.flush();
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other c");
    });

    it('should detect changes on root test component instance ', () => {
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other a");

      fixtureEl.componentInstance.bar = "Angular 2";
      fixture.detectChanges();

      expect(someComponentEl.text()).to.equal("Hello Angular 2 mock success mock other a");
    });

    it('should detect changes on component instance under test', () => {
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other a");

      someComponentEl.componentInstance.local = "b";
      fixture.detectChanges();

      expect(someComponentEl.text()).to.equal("Hello World mock success mock other b");
    });
  });

  describe('Test Component Builder Async', () => {
    let mockSomeService;
    let mockSomeOtherService;
    let $http;
    let $timeout;
    let fixture;
    let fixtureEl;
    let someComponentEl;

    // test the bindings call composed with the beforeEach fn
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

    // testing adding more bindings in an additional beforeEach
    beforeEach(() => {

      // test the bindings call inside the beforeEach fn
      providers(provide => {
        mockSomeOtherService = {
          getData: sinon.stub().returns('mock other')
        };

        return [
          provide(SomeOtherService, { useValue: mockSomeOtherService })
        ];
      });

    });

    beforeEach(function(done) {
      tcb.createAsync(TestComponent).then(f => {
        fixture = f;
        fixtureEl = fixture.debugElement;
        someComponentEl = fixture.debugElement.componentViewChildren[0];
        done();
      });
    });

    // todo: write a custom inject function for ng-forward
    // currently I'm just using angular.mock.inject
    beforeEach(inject(_$timeout_ => {
      $timeout = _$timeout_;
    }));

    it('should bootstrap the test module', () => {
      expect(angular.module('test.module')).to.exist;
    });

    it('should return a root test component and decorated jqlite', () => {
      expect(fixture).to.be.an.instanceOf(ComponentFixture);

      // debugElement is an angular.element decorated with extra properties, see next lines
      expect(fixture.debugElement)
          .to.be.an.instanceOf(angular.element);

      // nativeElement is an alias to the [0] index raw dom element
      expect(fixture.nativeElement)
          .to.be.an.instanceOf(HTMLElement);

      // The actual class instance hosted by the element
      expect(fixture.componentInstance)
          .to.be.an.instanceOf(TestComponent);

      // nativeElement is an alias to the [0] index raw dom element
      expect(fixture.debugElement.nativeElement)
          .to.be.an.instanceOf(HTMLElement);

      // The actual class instance hosted by the element
      expect(fixture.debugElement.componentInstance)
          .to.be.an.instanceOf(TestComponent);

      // componentViewChildren is an alias to .children()
      expect(fixture.debugElement.componentViewChildren[0])
          .to.be.an.instanceOf(angular.element);

      // getLocal is an alias to $injector
      expect(fixture.debugElement.getLocal('$q'))
          .to.contain.all.keys(['resolve', 'reject', 'defer']);

      // Checking to be sure even nested jqlite elements are decorated
      expect(someComponentEl.nativeElement)
          .to.be.an.instanceOf(HTMLElement);

      expect(someComponentEl.componentInstance)
          .to.be.an.instanceOf(SomeComponent);

      expect(someComponentEl.componentViewChildren).to.be.empty;

      expect(someComponentEl.getLocal('$q'))
          .to.contain.all.keys(['resolve', 'reject', 'defer']);
    });

    it('should allow mock decorated class components and services via bindings() method', () => {
      expect(mockSomeService.getData).to.have.been.called;
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other a");
    });

    it('should allow mock angular 1 services via bindings() method', () => {
      expect($http.get).to.have.been.called;
    });

    it('should allow angular.mock special services (e.g. $timeout.flush)', () => {
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other a");
      $timeout.flush();
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other c");
    });

    it('should detect changes on root test component instance ', () => {
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other a");

      fixtureEl.componentInstance.bar = "Angular 2";
      fixture.detectChanges();

      expect(someComponentEl.text()).to.equal("Hello Angular 2 mock success mock other a");
    });

    it('should detect changes on component instance under test', () => {
      expect(someComponentEl.text()).to.equal("Hello World mock success mock other a");

      someComponentEl.componentInstance.local = "b";
      fixture.detectChanges();

      expect(someComponentEl.text()).to.equal("Hello World mock success mock other b");
    });
  });
});