import QUnit, { test } from 'qunit';
import $ from 'jquery';
import TextField from '@ember/component/text-field';
import { on } from '@ember/object/evented';
import Component from '@ember/component';
import EmberObject from '@ember/object';
import EmberService, { inject as service } from '@ember/service';
import hasEmberVersion from 'ember-test-helpers/has-ember-version';
import { TestModuleForIntegration } from 'ember-test-helpers';
import { setResolverRegistry, createCustomResolver } from '../helpers/resolver';
import qunitModuleFor from '../helpers/qunit-module-for';
import hbs from 'htmlbars-inline-precompile';

const Service = EmberService || EmberObject;

function moduleForIntegration(description, callbacks) {
  var module = new TestModuleForIntegration(description, callbacks);
  qunitModuleFor(module);
}

moduleForIntegration('Component Integration Tests', {
  beforeSetup() {
    setResolverRegistry({
      'template:components/my-component': hbs`<span>{{name}}</span>`,
    });
  },
});

test('it can render a template', function(assert) {
  this.render(hbs`<span>Hello</span>`);
  assert.equal(this.$('span').text(), 'Hello');
});

if (hasEmberVersion(1, 11)) {
  test('it can render a link-to', function(assert) {
    this.render(hbs`{{link-to 'Hi' 'index'}}`);
    assert.ok(true, 'it renders without fail');
  });
}

test('it complains if you try to use bare render', function(assert) {
  var self = this;
  assert.throws(function() {
    self.render();
  }, /in a component integration test you must pass a template to `render\(\)`/);
});

test('it can access the full container', function(assert) {
  this.set('myColor', 'red');
  this.render(hbs`{{my-component name=myColor}}`);
  assert.equal(this.$('span').text(), 'red');
  this.set('myColor', 'blue');
  assert.equal(this.$('span').text(), 'blue');
});

test('it can handle actions', function(assert) {
  var handlerArg;
  this.render(hbs`<button {{action "didFoo" 42}} />`);
  this.on('didFoo', function(thing) {
    handlerArg = thing;
  });
  this.$('button').click();
  assert.equal(handlerArg, 42);
});

test('it accepts precompiled templates', function(assert) {
  this.render(hbs`<span>Hello</span>`);
  assert.equal(this.$('span').text(), 'Hello');
});

test('it supports DOM events', function(assert) {
  setResolverRegistry({
    'component:my-component': Component.extend({
      value: 0,
      layout: hbs`<span class='target'>Click to increment!</span><span class='value'>{{value}}</span>`,
      incrementOnClick: on('click', function() {
        this.incrementProperty('value');
      }),
    }),
  });
  this.render(hbs`{{my-component}}`);
  this.$('.target').click();
  assert.equal(this.$('.value').text(), '1');
});

test('it supports updating an input', function(assert) {
  setResolverRegistry({
    'component:my-input': TextField.extend({
      value: null,
    }),
  });
  this.render(hbs`{{my-input value=value}}`);
  this.$('input')
    .val('1')
    .change();
  assert.equal(this.get('value'), '1');
});

test('it supports dom triggered focus events', function(assert) {
  setResolverRegistry({
    'component:my-input': TextField.extend({
      _onInit: on('init', function() {
        this.set('value', 'init');
      }),
      focusIn() {
        this.set('value', 'focusin');
      },
      focusOut() {
        this.set('value', 'focusout');
      },
    }),
  });
  this.render(hbs`{{my-input}}`);
  assert.equal(this.$('input').val(), 'init');

  this.$('input').trigger('focusin');
  assert.equal(this.$('input').val(), 'focusin');

  this.$('input').trigger('focusout');
  assert.equal(this.$('input').val(), 'focusout');
});

test('`toString` returns the test name', function(assert) {
  assert.equal(
    this.toString(),
    'test context for: Component Integration Tests',
    'toString returns `test context for: name`'
  );
});

moduleForIntegration('TestModuleForIntegration | render during setup', {
  beforeSetup() {
    setResolverRegistry({
      'component:my-component': Component.extend({
        value: 0,
        layout: hbs`<span class='target'>Click to increment!</span><span class='value'>{{value}}</span>`,
        incrementOnClick: on('click', function() {
          this.incrementProperty('value');
        }),
      }),
    });
  },
  setup() {
    this.render(hbs`{{my-component}}`);
  },
});

test('it has working events', function(assert) {
  this.$('.target').click();
  assert.equal(this.$('.value').text(), '1');
});

moduleForIntegration('TestModuleForIntegration | context', {
  beforeSetup() {
    setResolverRegistry({
      'component:my-component': Component.extend({
        layout: hbs`<span class="foo">{{foo}}</span><span class="bar">{{bar}}</span>`,
      }),
    });
  },
});

test('it can set and get properties', function(assert) {
  var setResult = this.set('foo', 1);

  if (hasEmberVersion(2, 0)) {
    assert.equal(setResult, '1');
  } else {
    assert.equal(setResult, undefined);
  }

  this.render(hbs`{{my-component foo=foo}}`);
  assert.equal(this.get('foo'), '1');
  assert.equal(this.$('.foo').text(), '1');
});

test('it can setProperties and getProperties', function(assert) {
  var hash = {
    foo: 1,
    bar: 2,
  };
  var setResult = this.setProperties(hash);

  if (hasEmberVersion(2, 0)) {
    assert.deepEqual(setResult, hash);
  } else {
    assert.equal(setResult, undefined);
  }

  this.render(hbs`{{my-component foo=foo bar=bar}}`);
  var properties = this.getProperties('foo', 'bar');
  assert.equal(properties.foo, '1');
  assert.equal(properties.bar, '2');
  assert.equal(this.$('.foo').text(), '1');
  assert.equal(this.$('.bar').text(), '2');
});

moduleForIntegration('TestModuleForIntegration | register and inject', {});

test('can register a component', function(assert) {
  this.register(
    'component:x-foo',
    Component.extend({
      classNames: ['i-am-x-foo'],
    })
  );
  this.render(hbs`{{x-foo}}`);
  assert.equal(this.$('.i-am-x-foo').length, 1, 'found i-am-x-foo');
});

test('can register a service', function(assert) {
  this.register(
    'component:x-foo',
    Component.extend({
      unicorn: service(),
      layout: hbs`<span class="x-foo">{{unicorn.sparkliness}}</span>`,
    })
  );
  this.register(
    'service:unicorn',
    Service.extend({
      sparkliness: 'extreme',
    })
  );
  this.render(hbs`{{x-foo}}`);
  assert.equal(
    this.$('.x-foo')
      .text()
      .trim(),
    'extreme'
  );
});

test('can inject a service directly into test context', function(assert) {
  this.register(
    'component:x-foo',
    Component.extend({
      unicorn: service(),
      layout: hbs`<span class="x-foo">{{unicorn.sparkliness}}</span>`,
    })
  );
  this.register(
    'service:unicorn',
    Service.extend({
      sparkliness: 'extreme',
    })
  );
  this.inject.service('unicorn');
  this.render(hbs`{{x-foo}}`);
  assert.equal(
    this.$('.x-foo')
      .text()
      .trim(),
    'extreme'
  );
  this.set('unicorn.sparkliness', 'amazing');
  assert.equal(
    this.$('.x-foo')
      .text()
      .trim(),
    'amazing'
  );
});

test('can inject a service directly into test context, with aliased name', function(
  assert
) {
  this.register(
    'component:x-foo',
    Component.extend({
      unicorn: service(),
      layout: hbs`<span class="x-foo">{{unicorn.sparkliness}}</span>`,
    })
  );
  this.register(
    'service:unicorn',
    Service.extend({
      sparkliness: 'extreme',
    })
  );
  this.inject.service('unicorn', { as: 'hornedBeast' });
  this.render(hbs`{{x-foo}}`);
  assert.equal(
    this.$('.x-foo')
      .text()
      .trim(),
    'extreme'
  );
  this.set('hornedBeast.sparkliness', 'amazing');
  assert.equal(
    this.$('.x-foo')
      .text()
      .trim(),
    'amazing'
  );
});

moduleForIntegration('TestModuleForIntegration | willDestoryElement', {
  beforeSetup() {
    setResolverRegistry({
      'component:my-component': Component.extend({
        willDestroyElement() {
          var stateIndicatesInDOM = this._state === 'inDOM';
          var actuallyInDOM = $.contains(document, this.$()[0]);

          QUnit.config.current.assert.ok(
            actuallyInDOM === true && stateIndicatesInDOM === true,
            'component should still be in the DOM'
          );
        },
      }),
    });
  },
});

test('still in DOM in willDestroyElement', function(assert) {
  assert.expect(1);
  this.render(hbs`{{my-component}}`);
});

moduleForIntegration(
  'TestModuleForIntegration: force willDestroyElement via clearRender',
  {
    beforeSetup() {
      setResolverRegistry({});
    },
  }
);

test('still in DOM in willDestroyElement', function(assert) {
  assert.expect(1);

  let willDestroyCalled = false;
  this.register(
    'component:x-button',
    Component.extend({
      willDestroyElement() {
        willDestroyCalled = true;
      },
    })
  );

  this.render(hbs`{{x-button}}`);
  this.clearRender();

  assert.ok(
    willDestroyCalled,
    'can add assertions after willDestroyElement is called'
  );
});

moduleForIntegration('TestModuleForIntegration | custom resolver', {
  resolver: createCustomResolver({
    'component:y-foo': Component.extend({
      name: 'Y u no foo?!',
    }),
    'template:components/y-foo': hbs`<span class="name">{{name}}</span>`,
  }),
});

test('can render with a custom resolver', function(assert) {
  this.render(hbs`{{y-foo}}`);
  assert.equal(this.$('.name').text(), 'Y u no foo?!', 'rendered properly');
});