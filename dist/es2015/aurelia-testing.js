import { bootstrap } from 'aurelia-bootstrapper';
import { View } from 'aurelia-templating';
import { Aurelia } from 'aurelia-framework';

export const StageComponent = {
  withResources(resources) {
    return new ComponentTester().withResources(resources);
  }
};

export let ComponentTester = class ComponentTester {
  constructor() {
    this._resources = [];

    this._configure = aurelia => aurelia.use.standardConfiguration();
  }

  bootstrap(configure) {
    this._configure = configure;
  }

  withResources(resources) {
    this._resources = resources;
    return this;
  }

  inView(html) {
    this._html = html;
    return this;
  }

  boundTo(bindingContext) {
    this._bindingContext = bindingContext;
    return this;
  }

  manuallyHandleLifecycle() {
    this._prepareLifecycle();
    return this;
  }

  create() {
    return bootstrap(aurelia => {
      return Promise.resolve(this._configure(aurelia)).then(() => {
        aurelia.use.globalResources(this._resources);
        return aurelia.start().then(a => {
          let host = document.createElement('div');
          host.innerHTML = this._html;
          document.body.appendChild(host);
          aurelia.enhance(this._bindingContext, host);
          this._rootView = aurelia.root;
          this.element = host.firstElementChild;
          this.viewModel = this.element.au.controller.viewModel;
          this.dispose = () => host.parentNode.removeChild(host);
          return new Promise(resolve => setTimeout(() => resolve(), 0));
        });
      });
    });
  }

  _prepareLifecycle() {
    const bindPrototype = View.prototype.bind;
    View.prototype.bind = () => {};
    this.bind = bindingContext => new Promise(resolve => {
      View.prototype.bind = bindPrototype;
      if (bindingContext !== undefined) {
        this._bindingContext = bindingContext;
      }
      this._rootView.bind(this._bindingContext);
      setTimeout(() => resolve(), 0);
    });

    const attachedPrototype = View.prototype.attached;
    View.prototype.attached = () => {};
    this.attached = () => new Promise(resolve => {
      View.prototype.attached = attachedPrototype;
      this._rootView.attached();
      setTimeout(() => resolve(), 0);
    });

    this.detached = () => new Promise(resolve => {
      this._rootView.detached();
      setTimeout(() => resolve(), 0);
    });

    this.unbind = () => new Promise(resolve => {
      this._rootView.unbind();
      setTimeout(() => resolve(), 0);
    });
  }
};