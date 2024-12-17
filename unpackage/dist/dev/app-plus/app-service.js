if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = { ...defaultSettings };
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        }
      };
      hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
        if (pluginId === this.plugin.id) {
          this.fallbacks.setSettings(value);
        }
      });
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && pluginDescriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(pluginDescriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * vuex v4.1.0
   * (c) 2022 Evan You
   * @license MIT
   */
  var storeKey = "store";
  function forEachValue(obj, fn) {
    Object.keys(obj).forEach(function(key) {
      return fn(obj[key], key);
    });
  }
  function isObject(obj) {
    return obj !== null && typeof obj === "object";
  }
  function isPromise(val) {
    return val && typeof val.then === "function";
  }
  function assert(condition, msg) {
    if (!condition) {
      throw new Error("[vuex] " + msg);
    }
  }
  function partial(fn, arg) {
    return function() {
      return fn(arg);
    };
  }
  function genericSubscribe(fn, subs, options) {
    if (subs.indexOf(fn) < 0) {
      options && options.prepend ? subs.unshift(fn) : subs.push(fn);
    }
    return function() {
      var i = subs.indexOf(fn);
      if (i > -1) {
        subs.splice(i, 1);
      }
    };
  }
  function resetStore(store2, hot) {
    store2._actions = /* @__PURE__ */ Object.create(null);
    store2._mutations = /* @__PURE__ */ Object.create(null);
    store2._wrappedGetters = /* @__PURE__ */ Object.create(null);
    store2._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    var state = store2.state;
    installModule(store2, state, [], store2._modules.root, true);
    resetStoreState(store2, state, hot);
  }
  function resetStoreState(store2, state, hot) {
    var oldState = store2._state;
    var oldScope = store2._scope;
    store2.getters = {};
    store2._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    var wrappedGetters = store2._wrappedGetters;
    var computedObj = {};
    var computedCache = {};
    var scope = vue.effectScope(true);
    scope.run(function() {
      forEachValue(wrappedGetters, function(fn, key) {
        computedObj[key] = partial(fn, store2);
        computedCache[key] = vue.computed(function() {
          return computedObj[key]();
        });
        Object.defineProperty(store2.getters, key, {
          get: function() {
            return computedCache[key].value;
          },
          enumerable: true
          // for local getters
        });
      });
    });
    store2._state = vue.reactive({
      data: state
    });
    store2._scope = scope;
    if (store2.strict) {
      enableStrictMode(store2);
    }
    if (oldState) {
      if (hot) {
        store2._withCommit(function() {
          oldState.data = null;
        });
      }
    }
    if (oldScope) {
      oldScope.stop();
    }
  }
  function installModule(store2, rootState, path, module2, hot) {
    var isRoot = !path.length;
    var namespace = store2._modules.getNamespace(path);
    if (module2.namespaced) {
      if (store2._modulesNamespaceMap[namespace] && true) {
        console.error("[vuex] duplicate namespace " + namespace + " for the namespaced module " + path.join("/"));
      }
      store2._modulesNamespaceMap[namespace] = module2;
    }
    if (!isRoot && !hot) {
      var parentState = getNestedState(rootState, path.slice(0, -1));
      var moduleName = path[path.length - 1];
      store2._withCommit(function() {
        {
          if (moduleName in parentState) {
            console.warn(
              '[vuex] state field "' + moduleName + '" was overridden by a module with the same name at "' + path.join(".") + '"'
            );
          }
        }
        parentState[moduleName] = module2.state;
      });
    }
    var local = module2.context = makeLocalContext(store2, namespace, path);
    module2.forEachMutation(function(mutation, key) {
      var namespacedType = namespace + key;
      registerMutation(store2, namespacedType, mutation, local);
    });
    module2.forEachAction(function(action, key) {
      var type = action.root ? key : namespace + key;
      var handler = action.handler || action;
      registerAction(store2, type, handler, local);
    });
    module2.forEachGetter(function(getter, key) {
      var namespacedType = namespace + key;
      registerGetter(store2, namespacedType, getter, local);
    });
    module2.forEachChild(function(child, key) {
      installModule(store2, rootState, path.concat(key), child, hot);
    });
  }
  function makeLocalContext(store2, namespace, path) {
    var noNamespace = namespace === "";
    var local = {
      dispatch: noNamespace ? store2.dispatch : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._actions[type]) {
            console.error("[vuex] unknown local action type: " + args.type + ", global type: " + type);
            return;
          }
        }
        return store2.dispatch(type, payload);
      },
      commit: noNamespace ? store2.commit : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._mutations[type]) {
            console.error("[vuex] unknown local mutation type: " + args.type + ", global type: " + type);
            return;
          }
        }
        store2.commit(type, payload, options);
      }
    };
    Object.defineProperties(local, {
      getters: {
        get: noNamespace ? function() {
          return store2.getters;
        } : function() {
          return makeLocalGetters(store2, namespace);
        }
      },
      state: {
        get: function() {
          return getNestedState(store2.state, path);
        }
      }
    });
    return local;
  }
  function makeLocalGetters(store2, namespace) {
    if (!store2._makeLocalGettersCache[namespace]) {
      var gettersProxy = {};
      var splitPos = namespace.length;
      Object.keys(store2.getters).forEach(function(type) {
        if (type.slice(0, splitPos) !== namespace) {
          return;
        }
        var localType = type.slice(splitPos);
        Object.defineProperty(gettersProxy, localType, {
          get: function() {
            return store2.getters[type];
          },
          enumerable: true
        });
      });
      store2._makeLocalGettersCache[namespace] = gettersProxy;
    }
    return store2._makeLocalGettersCache[namespace];
  }
  function registerMutation(store2, type, handler, local) {
    var entry = store2._mutations[type] || (store2._mutations[type] = []);
    entry.push(function wrappedMutationHandler(payload) {
      handler.call(store2, local.state, payload);
    });
  }
  function registerAction(store2, type, handler, local) {
    var entry = store2._actions[type] || (store2._actions[type] = []);
    entry.push(function wrappedActionHandler(payload) {
      var res = handler.call(store2, {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store2.getters,
        rootState: store2.state
      }, payload);
      if (!isPromise(res)) {
        res = Promise.resolve(res);
      }
      if (store2._devtoolHook) {
        return res.catch(function(err) {
          store2._devtoolHook.emit("vuex:error", err);
          throw err;
        });
      } else {
        return res;
      }
    });
  }
  function registerGetter(store2, type, rawGetter, local) {
    if (store2._wrappedGetters[type]) {
      {
        console.error("[vuex] duplicate getter key: " + type);
      }
      return;
    }
    store2._wrappedGetters[type] = function wrappedGetter(store22) {
      return rawGetter(
        local.state,
        // local state
        local.getters,
        // local getters
        store22.state,
        // root state
        store22.getters
        // root getters
      );
    };
  }
  function enableStrictMode(store2) {
    vue.watch(function() {
      return store2._state.data;
    }, function() {
      {
        assert(store2._committing, "do not mutate vuex store state outside mutation handlers.");
      }
    }, { deep: true, flush: "sync" });
  }
  function getNestedState(state, path) {
    return path.reduce(function(state2, key) {
      return state2[key];
    }, state);
  }
  function unifyObjectStyle(type, payload, options) {
    if (isObject(type) && type.type) {
      options = payload;
      payload = type;
      type = type.type;
    }
    {
      assert(typeof type === "string", "expects string as the type, but found " + typeof type + ".");
    }
    return { type, payload, options };
  }
  var LABEL_VUEX_BINDINGS = "vuex bindings";
  var MUTATIONS_LAYER_ID = "vuex:mutations";
  var ACTIONS_LAYER_ID = "vuex:actions";
  var INSPECTOR_ID = "vuex";
  var actionId = 0;
  function addDevtools(app, store2) {
    setupDevtoolsPlugin(
      {
        id: "org.vuejs.vuex",
        app,
        label: "Vuex",
        homepage: "https://next.vuex.vuejs.org/",
        logo: "https://vuejs.org/images/icons/favicon-96x96.png",
        packageName: "vuex",
        componentStateTypes: [LABEL_VUEX_BINDINGS]
      },
      function(api) {
        api.addTimelineLayer({
          id: MUTATIONS_LAYER_ID,
          label: "Vuex Mutations",
          color: COLOR_LIME_500
        });
        api.addTimelineLayer({
          id: ACTIONS_LAYER_ID,
          label: "Vuex Actions",
          color: COLOR_LIME_500
        });
        api.addInspector({
          id: INSPECTOR_ID,
          label: "Vuex",
          icon: "storage",
          treeFilterPlaceholder: "Filter stores..."
        });
        api.on.getInspectorTree(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            if (payload.filter) {
              var nodes = [];
              flattenStoreForInspectorTree(nodes, store2._modules.root, payload.filter, "");
              payload.rootNodes = nodes;
            } else {
              payload.rootNodes = [
                formatStoreForInspectorTree(store2._modules.root, "")
              ];
            }
          }
        });
        api.on.getInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            makeLocalGetters(store2, modulePath);
            payload.state = formatStoreForInspectorState(
              getStoreModule(store2._modules, modulePath),
              modulePath === "root" ? store2.getters : store2._makeLocalGettersCache,
              modulePath
            );
          }
        });
        api.on.editInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            var path = payload.path;
            if (modulePath !== "root") {
              path = modulePath.split("/").filter(Boolean).concat(path);
            }
            store2._withCommit(function() {
              payload.set(store2._state.data, path, payload.state.value);
            });
          }
        });
        store2.subscribe(function(mutation, state) {
          var data = {};
          if (mutation.payload) {
            data.payload = mutation.payload;
          }
          data.state = state;
          api.notifyComponentUpdate();
          api.sendInspectorTree(INSPECTOR_ID);
          api.sendInspectorState(INSPECTOR_ID);
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: Date.now(),
              title: mutation.type,
              data
            }
          });
        });
        store2.subscribeAction({
          before: function(action, state) {
            var data = {};
            if (action.payload) {
              data.payload = action.payload;
            }
            action._id = actionId++;
            action._time = Date.now();
            data.state = state;
            api.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: action._time,
                title: action.type,
                groupId: action._id,
                subtitle: "start",
                data
              }
            });
          },
          after: function(action, state) {
            var data = {};
            var duration = Date.now() - action._time;
            data.duration = {
              _custom: {
                type: "duration",
                display: duration + "ms",
                tooltip: "Action duration",
                value: duration
              }
            };
            if (action.payload) {
              data.payload = action.payload;
            }
            data.state = state;
            api.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: Date.now(),
                title: action.type,
                groupId: action._id,
                subtitle: "end",
                data
              }
            });
          }
        });
      }
    );
  }
  var COLOR_LIME_500 = 8702998;
  var COLOR_DARK = 6710886;
  var COLOR_WHITE = 16777215;
  var TAG_NAMESPACED = {
    label: "namespaced",
    textColor: COLOR_WHITE,
    backgroundColor: COLOR_DARK
  };
  function extractNameFromPath(path) {
    return path && path !== "root" ? path.split("/").slice(-2, -1)[0] : "Root";
  }
  function formatStoreForInspectorTree(module2, path) {
    return {
      id: path || "root",
      // all modules end with a `/`, we want the last segment only
      // cart/ -> cart
      // nested/cart/ -> cart
      label: extractNameFromPath(path),
      tags: module2.namespaced ? [TAG_NAMESPACED] : [],
      children: Object.keys(module2._children).map(
        function(moduleName) {
          return formatStoreForInspectorTree(
            module2._children[moduleName],
            path + moduleName + "/"
          );
        }
      )
    };
  }
  function flattenStoreForInspectorTree(result, module2, filter, path) {
    if (path.includes(filter)) {
      result.push({
        id: path || "root",
        label: path.endsWith("/") ? path.slice(0, path.length - 1) : path || "Root",
        tags: module2.namespaced ? [TAG_NAMESPACED] : []
      });
    }
    Object.keys(module2._children).forEach(function(moduleName) {
      flattenStoreForInspectorTree(result, module2._children[moduleName], filter, path + moduleName + "/");
    });
  }
  function formatStoreForInspectorState(module2, getters, path) {
    getters = path === "root" ? getters : getters[path];
    var gettersKeys = Object.keys(getters);
    var storeState = {
      state: Object.keys(module2.state).map(function(key) {
        return {
          key,
          editable: true,
          value: module2.state[key]
        };
      })
    };
    if (gettersKeys.length) {
      var tree = transformPathsToObjectTree(getters);
      storeState.getters = Object.keys(tree).map(function(key) {
        return {
          key: key.endsWith("/") ? extractNameFromPath(key) : key,
          editable: false,
          value: canThrow(function() {
            return tree[key];
          })
        };
      });
    }
    return storeState;
  }
  function transformPathsToObjectTree(getters) {
    var result = {};
    Object.keys(getters).forEach(function(key) {
      var path = key.split("/");
      if (path.length > 1) {
        var target = result;
        var leafKey = path.pop();
        path.forEach(function(p) {
          if (!target[p]) {
            target[p] = {
              _custom: {
                value: {},
                display: p,
                tooltip: "Module",
                abstract: true
              }
            };
          }
          target = target[p]._custom.value;
        });
        target[leafKey] = canThrow(function() {
          return getters[key];
        });
      } else {
        result[key] = canThrow(function() {
          return getters[key];
        });
      }
    });
    return result;
  }
  function getStoreModule(moduleMap, path) {
    var names = path.split("/").filter(function(n) {
      return n;
    });
    return names.reduce(
      function(module2, moduleName, i) {
        var child = module2[moduleName];
        if (!child) {
          throw new Error('Missing module "' + moduleName + '" for path "' + path + '".');
        }
        return i === names.length - 1 ? child : child._children;
      },
      path === "root" ? moduleMap : moduleMap.root._children
    );
  }
  function canThrow(cb) {
    try {
      return cb();
    } catch (e) {
      return e;
    }
  }
  var Module = function Module2(rawModule, runtime) {
    this.runtime = runtime;
    this._children = /* @__PURE__ */ Object.create(null);
    this._rawModule = rawModule;
    var rawState = rawModule.state;
    this.state = (typeof rawState === "function" ? rawState() : rawState) || {};
  };
  var prototypeAccessors$1 = { namespaced: { configurable: true } };
  prototypeAccessors$1.namespaced.get = function() {
    return !!this._rawModule.namespaced;
  };
  Module.prototype.addChild = function addChild(key, module2) {
    this._children[key] = module2;
  };
  Module.prototype.removeChild = function removeChild(key) {
    delete this._children[key];
  };
  Module.prototype.getChild = function getChild(key) {
    return this._children[key];
  };
  Module.prototype.hasChild = function hasChild(key) {
    return key in this._children;
  };
  Module.prototype.update = function update(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  };
  Module.prototype.forEachChild = function forEachChild(fn) {
    forEachValue(this._children, fn);
  };
  Module.prototype.forEachGetter = function forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  };
  Module.prototype.forEachAction = function forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  };
  Module.prototype.forEachMutation = function forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  };
  Object.defineProperties(Module.prototype, prototypeAccessors$1);
  var ModuleCollection = function ModuleCollection2(rawRootModule) {
    this.register([], rawRootModule, false);
  };
  ModuleCollection.prototype.get = function get(path) {
    return path.reduce(function(module2, key) {
      return module2.getChild(key);
    }, this.root);
  };
  ModuleCollection.prototype.getNamespace = function getNamespace(path) {
    var module2 = this.root;
    return path.reduce(function(namespace, key) {
      module2 = module2.getChild(key);
      return namespace + (module2.namespaced ? key + "/" : "");
    }, "");
  };
  ModuleCollection.prototype.update = function update$1(rawRootModule) {
    update2([], this.root, rawRootModule);
  };
  ModuleCollection.prototype.register = function register(path, rawModule, runtime) {
    var this$1$1 = this;
    if (runtime === void 0)
      runtime = true;
    {
      assertRawModule(path, rawModule);
    }
    var newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      var parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }
    if (rawModule.modules) {
      forEachValue(rawModule.modules, function(rawChildModule, key) {
        this$1$1.register(path.concat(key), rawChildModule, runtime);
      });
    }
  };
  ModuleCollection.prototype.unregister = function unregister(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    var child = parent.getChild(key);
    if (!child) {
      {
        console.warn(
          "[vuex] trying to unregister module '" + key + "', which is not registered"
        );
      }
      return;
    }
    if (!child.runtime) {
      return;
    }
    parent.removeChild(key);
  };
  ModuleCollection.prototype.isRegistered = function isRegistered(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    if (parent) {
      return parent.hasChild(key);
    }
    return false;
  };
  function update2(path, targetModule, newModule) {
    {
      assertRawModule(path, newModule);
    }
    targetModule.update(newModule);
    if (newModule.modules) {
      for (var key in newModule.modules) {
        if (!targetModule.getChild(key)) {
          {
            console.warn(
              "[vuex] trying to add a new module '" + key + "' on hot reloading, manual reload is needed"
            );
          }
          return;
        }
        update2(
          path.concat(key),
          targetModule.getChild(key),
          newModule.modules[key]
        );
      }
    }
  }
  var functionAssert = {
    assert: function(value) {
      return typeof value === "function";
    },
    expected: "function"
  };
  var objectAssert = {
    assert: function(value) {
      return typeof value === "function" || typeof value === "object" && typeof value.handler === "function";
    },
    expected: 'function or object with "handler" function'
  };
  var assertTypes = {
    getters: functionAssert,
    mutations: functionAssert,
    actions: objectAssert
  };
  function assertRawModule(path, rawModule) {
    Object.keys(assertTypes).forEach(function(key) {
      if (!rawModule[key]) {
        return;
      }
      var assertOptions = assertTypes[key];
      forEachValue(rawModule[key], function(value, type) {
        assert(
          assertOptions.assert(value),
          makeAssertionMessage(path, key, type, value, assertOptions.expected)
        );
      });
    });
  }
  function makeAssertionMessage(path, key, type, value, expected) {
    var buf = key + " should be " + expected + ' but "' + key + "." + type + '"';
    if (path.length > 0) {
      buf += ' in module "' + path.join(".") + '"';
    }
    buf += " is " + JSON.stringify(value) + ".";
    return buf;
  }
  function createStore(options) {
    return new Store(options);
  }
  var Store = function Store2(options) {
    var this$1$1 = this;
    if (options === void 0)
      options = {};
    {
      assert(typeof Promise !== "undefined", "vuex requires a Promise polyfill in this browser.");
      assert(this instanceof Store2, "store must be called with the new operator.");
    }
    var plugins = options.plugins;
    if (plugins === void 0)
      plugins = [];
    var strict = options.strict;
    if (strict === void 0)
      strict = false;
    var devtools = options.devtools;
    this._committing = false;
    this._actions = /* @__PURE__ */ Object.create(null);
    this._actionSubscribers = [];
    this._mutations = /* @__PURE__ */ Object.create(null);
    this._wrappedGetters = /* @__PURE__ */ Object.create(null);
    this._modules = new ModuleCollection(options);
    this._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    this._subscribers = [];
    this._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    this._scope = null;
    this._devtools = devtools;
    var store2 = this;
    var ref = this;
    var dispatch2 = ref.dispatch;
    var commit2 = ref.commit;
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch2.call(store2, type, payload);
    };
    this.commit = function boundCommit(type, payload, options2) {
      return commit2.call(store2, type, payload, options2);
    };
    this.strict = strict;
    var state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    resetStoreState(this, state);
    plugins.forEach(function(plugin) {
      return plugin(this$1$1);
    });
  };
  var prototypeAccessors = { state: { configurable: true } };
  Store.prototype.install = function install(app, injectKey) {
    app.provide(injectKey || storeKey, this);
    app.config.globalProperties.$store = this;
    var useDevtools = this._devtools !== void 0 ? this._devtools : true;
    if (useDevtools) {
      addDevtools(app, this);
    }
  };
  prototypeAccessors.state.get = function() {
    return this._state.data;
  };
  prototypeAccessors.state.set = function(v) {
    {
      assert(false, "use store.replaceState() to explicit replace store state.");
    }
  };
  Store.prototype.commit = function commit(_type, _payload, _options) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload, _options);
    var type = ref.type;
    var payload = ref.payload;
    var options = ref.options;
    var mutation = { type, payload };
    var entry = this._mutations[type];
    if (!entry) {
      {
        console.error("[vuex] unknown mutation type: " + type);
      }
      return;
    }
    this._withCommit(function() {
      entry.forEach(function commitIterator(handler) {
        handler(payload);
      });
    });
    this._subscribers.slice().forEach(function(sub) {
      return sub(mutation, this$1$1.state);
    });
    if (options && options.silent) {
      console.warn(
        "[vuex] mutation type: " + type + ". Silent option has been removed. Use the filter functionality in the vue-devtools"
      );
    }
  };
  Store.prototype.dispatch = function dispatch(_type, _payload) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload);
    var type = ref.type;
    var payload = ref.payload;
    var action = { type, payload };
    var entry = this._actions[type];
    if (!entry) {
      {
        console.error("[vuex] unknown action type: " + type);
      }
      return;
    }
    try {
      this._actionSubscribers.slice().filter(function(sub) {
        return sub.before;
      }).forEach(function(sub) {
        return sub.before(action, this$1$1.state);
      });
    } catch (e) {
      {
        console.warn("[vuex] error in before action subscribers: ");
        console.error(e);
      }
    }
    var result = entry.length > 1 ? Promise.all(entry.map(function(handler) {
      return handler(payload);
    })) : entry[0](payload);
    return new Promise(function(resolve, reject) {
      result.then(function(res) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.after;
          }).forEach(function(sub) {
            return sub.after(action, this$1$1.state);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in after action subscribers: ");
            console.error(e);
          }
        }
        resolve(res);
      }, function(error) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.error;
          }).forEach(function(sub) {
            return sub.error(action, this$1$1.state, error);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in error action subscribers: ");
            console.error(e);
          }
        }
        reject(error);
      });
    });
  };
  Store.prototype.subscribe = function subscribe(fn, options) {
    return genericSubscribe(fn, this._subscribers, options);
  };
  Store.prototype.subscribeAction = function subscribeAction(fn, options) {
    var subs = typeof fn === "function" ? { before: fn } : fn;
    return genericSubscribe(subs, this._actionSubscribers, options);
  };
  Store.prototype.watch = function watch$1(getter, cb, options) {
    var this$1$1 = this;
    {
      assert(typeof getter === "function", "store.watch only accepts a function.");
    }
    return vue.watch(function() {
      return getter(this$1$1.state, this$1$1.getters);
    }, cb, Object.assign({}, options));
  };
  Store.prototype.replaceState = function replaceState(state) {
    var this$1$1 = this;
    this._withCommit(function() {
      this$1$1._state.data = state;
    });
  };
  Store.prototype.registerModule = function registerModule(path, rawModule, options) {
    if (options === void 0)
      options = {};
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
      assert(path.length > 0, "cannot register the root module by using registerModule.");
    }
    this._modules.register(path, rawModule);
    installModule(this, this.state, path, this._modules.get(path), options.preserveState);
    resetStoreState(this, this.state);
  };
  Store.prototype.unregisterModule = function unregisterModule(path) {
    var this$1$1 = this;
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    this._modules.unregister(path);
    this._withCommit(function() {
      var parentState = getNestedState(this$1$1.state, path.slice(0, -1));
      delete parentState[path[path.length - 1]];
    });
    resetStore(this);
  };
  Store.prototype.hasModule = function hasModule(path) {
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    return this._modules.isRegistered(path);
  };
  Store.prototype.hotUpdate = function hotUpdate(newOptions) {
    this._modules.update(newOptions);
    resetStore(this, true);
  };
  Store.prototype._withCommit = function _withCommit(fn) {
    var committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
  };
  Object.defineProperties(Store.prototype, prototypeAccessors);
  var mapState = normalizeNamespace(function(namespace, states) {
    var res = {};
    if (!isValidMap(states)) {
      console.error("[vuex] mapState: mapper parameter must be either an Array or an Object");
    }
    normalizeMap(states).forEach(function(ref) {
      var key = ref.key;
      var val = ref.val;
      res[key] = function mappedState() {
        var state = this.$store.state;
        var getters = this.$store.getters;
        if (namespace) {
          var module2 = getModuleByNamespace(this.$store, "mapState", namespace);
          if (!module2) {
            return;
          }
          state = module2.context.state;
          getters = module2.context.getters;
        }
        return typeof val === "function" ? val.call(this, state, getters) : state[val];
      };
      res[key].vuex = true;
    });
    return res;
  });
  function normalizeMap(map) {
    if (!isValidMap(map)) {
      return [];
    }
    return Array.isArray(map) ? map.map(function(key) {
      return { key, val: key };
    }) : Object.keys(map).map(function(key) {
      return { key, val: map[key] };
    });
  }
  function isValidMap(map) {
    return Array.isArray(map) || isObject(map);
  }
  function normalizeNamespace(fn) {
    return function(namespace, map) {
      if (typeof namespace !== "string") {
        map = namespace;
        namespace = "";
      } else if (namespace.charAt(namespace.length - 1) !== "/") {
        namespace += "/";
      }
      return fn(namespace, map);
    };
  }
  function getModuleByNamespace(store2, helper, namespace) {
    var module2 = store2._modulesNamespaceMap[namespace];
    if (!module2) {
      console.error("[vuex] module namespace not found in " + helper + "(): " + namespace);
    }
    return module2;
  }
  const store = createStore({
    state: {
      userInfo: null,
      currentSendUserId: null,
      isRegister: false,
      // 是否注册完成,通过这个参数 判断 是否可以 发送消息
      chatUserList: [],
      // 聊天的用户列表
      chatHistoryList: [],
      // 聊天记录
      closeUserObj: null,
      // 客服id;用于 页面关闭主动 关闭与客服的聊天;保存客服头像
      pagingObj: {
        pageNum: 1,
        // 记录分页信息
        refresherEnabled: true
        // 是否可开启下拉
      },
      triggered: false,
      // 设置当前下拉刷新状态，true 表示下拉刷新已经被触发，false 表示下拉刷新未被触发
      newsObj: null
      // 发送的消息
    },
    mutations: {
      SET_USERINFO(state, payload) {
        state.userInfo = payload;
      },
      SET_CURRENT_SEND_USERID(state, payload) {
        formatAppLog("log", "at store/index.js:22", "设置当前消息发送人==", payload);
        state.currentSendUserId = payload;
      },
      SET_IS_REGISTER(state, payload) {
        state.isRegister = payload;
      },
      SET_CHAT_USER_LIST(state, payload) {
        const newArr = payload;
        newArr.sort((a, b) => new Date(b.sendTime) - new Date(a.sendTime));
        state.chatUserList = newArr;
      },
      SET_CHAT_HISTORY_LIST(state, payload) {
        const arr = state.chatHistoryList;
        if (payload.type == "push") {
          arr.push(payload.message);
        }
        if (payload.type == "unshift") {
          arr.unshift(...payload.message);
        }
        const newArr = arr.reduce((acc, curr) => {
          if (!acc.some((item) => item.msgId === curr.msgId)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        newArr.sort((a, b) => new Date(a.sendTime) - new Date(b.sendTime));
        state.chatHistoryList = newArr;
        if (payload.type == "clear") {
          state.chatHistoryList = [];
        }
      },
      SET_CLOSE_USER_OBJ(state, payload) {
        state.closeUserObj = payload;
      },
      SET_PAGING_OBG(state, payload) {
        state.pagingObj = payload;
      },
      SET_TRIGGERD(state, payload) {
        state.triggered = payload;
      },
      SET_NEWS_OBJ(state, payload) {
        state.newsObj = payload;
      }
    },
    actions: {
      asyncRegisterUser({ commit }, payload) {
        commit("SET_USERINFO", payload);
      }
    }
  });
  function findObjectWithId(list, userId) {
    return list.find((item) => item.sendUser === userId);
  }
  const generateRandomString = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return (/* @__PURE__ */ new Date()).getTime() + result;
  };
  const emote = [
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😌",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤢",
    "🤮",
    "🤧",
    "😵",
    "🤯",
    "🤠",
    "😎",
    "🤓",
    "🧐",
    "😕",
    "😟",
    "🙁",
    "😮",
    "😯",
    "😲",
    "😳",
    "😦",
    "😧",
    "😨",
    "😰",
    "😥",
    "😢",
    "😭",
    "😱",
    "😖",
    "😣",
    "😞",
    "😓",
    "😩",
    "😫",
    "😤",
    "😡",
    "😠",
    "🤬",
    "😀",
    "👋",
    "🤚",
    "🖐",
    "✋",
    "🖖",
    "👌",
    "✌",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🙏",
    "✍",
    "💅",
    "🤳",
    "💪"
  ];
  const getPlatformType = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (userAgent.indexOf("Android") > -1) {
      return "Android";
    }
    if (/iPad|iPhone|iPod/i.test(userAgent)) {
      return "iOS";
    }
    if (/Macintosh/i.test(userAgent) || /Mac OS X/i.test(userAgent)) {
      return "macOS";
    }
    return "unknown";
  };
  const globalSendMessage = (typeObj) => {
    formatAppLog("log", "at utils/index.js:162", "这是一个全局方法", JSON.stringify(typeObj));
    const GLOBAL_SYSTEM = getPlatformType();
    const windowObj = window;
    try {
      if (GLOBAL_SYSTEM == "iOS" || GLOBAL_SYSTEM == "macOS") {
        windowObj.webkit.messageHandlers.encryptMessages.postMessage(JSON.stringify(typeObj));
      } else if (GLOBAL_SYSTEM == "Android") {
        windowObj.JsBridge.encryptMessages(JSON.stringify(typeObj));
      }
    } catch (error) {
    }
  };
  function parseTime(time, pattern) {
    if (arguments.length === 0 || !time) {
      return null;
    }
    const format = pattern || "{y}-{m}-{d} {h}:{i}:{s}";
    let date;
    if (typeof time === "object") {
      date = time;
    } else {
      if (typeof time === "string" && /^[0-9]+$/.test(time)) {
        time = parseInt(time);
      } else if (typeof time === "string") {
        time = time.replace(new RegExp(/-/gm), "/").replace("T", " ").replace(new RegExp(/\.[\d]{3}/gm), "");
      }
      if (typeof time === "number" && time.toString().length === 10) {
        time = time * 1e3;
      }
      date = new Date(time);
    }
    const formatObj = {
      y: date.getFullYear(),
      m: date.getMonth() + 1,
      d: date.getDate(),
      h: date.getHours(),
      i: date.getMinutes(),
      s: date.getSeconds(),
      a: date.getDay()
    };
    const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
      let value = formatObj[key];
      if (key === "a") {
        return ["日", "一", "二", "三", "四", "五", "六"][value];
      }
      if (result.length > 0 && value < 10) {
        value = "0" + value;
      }
      return value || 0;
    });
    return time_str;
  }
  const CS1001 = {
    t: 100,
    //消息类型
    a: 1001,
    d: {}
  };
  const CS4001 = {
    t: 400,
    a: 4001,
    d: {}
  };
  const CS4002 = {
    t: 400,
    a: 4002,
    u: null,
    d: {}
  };
  const CS4005 = {
    t: 400,
    a: 4005,
    d: {
      // requestId: '', // 本次请求ID，原样返回
      pageNum: 1,
      //可选，查询第一页
      pageSize: 10
      //可选，每次返回数量
    }
  };
  function handleChatUserList(obj) {
    formatAppLog("log", "at utils/response.js:16", "store.state.currentSendUserId==", store.state.currentSendUserId);
    var chatUserList = store.state.chatUserList;
    if (!findObjectWithId(chatUserList, obj.sendUser)) {
      chatUserList.push(obj);
    }
    const newChat = chatUserList.map((item) => {
      if (obj.chatType == 1) {
        if (obj.sendUser == item.sendUser) {
          return {
            ...obj,
            ...item,
            message: obj.message,
            time: parseTime(obj.sendTime, "{y}-{m}-{d} {h}:{i}"),
            sendTime: obj.sendTime,
            isNew: true
          };
        }
      } else {
        if (obj.receiveUser == item.receiveUser) {
          return {
            obj,
            ...item,
            message: obj.message,
            time: parseTime(obj.sendTime, "{y}-{m}-{d} {h}:{i}"),
            sendTime: obj.sendTime
          };
        }
      }
      return item;
    });
    formatAppLog("log", "at utils/response.js:46", "newChatnewChatnewChatnewChatnewChat", newChat);
    store.commit("SET_CHAT_USER_LIST", newChat);
  }
  function response(resData) {
    const {
      data
    } = resData;
    if (data && data == "ping") {
      formatAppLog("log", "at utils/response.js:56", "心跳=======>>>>", data);
    } else {
      const parseData = JSON.parse(data);
      const {
        t,
        a,
        d
      } = parseData;
      formatAppLog("log", "at utils/response.js:64", "响应动作=======>>>>", JSON.parse(data));
      switch (a) {
        case 1002:
          formatAppLog("log", "at utils/response.js:67", "注册成功响应：1002");
          if (store.state.userInfo.isCustomerService == 0) {
            CS4001.d = {
              requestId: generateRandomString(),
              msgType: "1"
            };
            sendSocketMessage(CS4001);
          } else {
            if (d && d.chatUserList && d.chatUserList.length > 0) {
              const result = d.chatUserList.map((item) => {
                item.time = parseTime(item.sendTime, "{y}-{m}-{d} {h}:{i}");
                return item;
              });
              store.commit("SET_CHAT_USER_LIST", result);
            }
            if (d && d.token) {
              store.dispatch("asyncRegisterUser", {
                ...store.state.userInfo,
                Authorization: d.token
              });
            }
          }
          store.commit("SET_IS_REGISTER", true);
          store.commit("SET_TRIGGERD", false);
          break;
        case 1003:
          formatAppLog("log", "at utils/response.js:95", "注册鉴权失败响应：1003");
          store.commit("SET_IS_REGISTER", false);
          break;
        case 1004:
          formatAppLog("log", "at utils/response.js:99", "其他异常响应：1004");
          store.commit("SET_IS_REGISTER", false);
          break;
        case 4004:
          formatAppLog("log", "at utils/response.js:103", "发起客服聊天响应动作=4004");
          if (d.message === "")
            return;
          if (d && d.sendUser && d.receiveUser) {
            const newD = {
              ...d,
              type: 0,
              msgId: generateRandomString(),
              logo: d.sendAvatar
            };
            if (store.state.userInfo.isCustomerService == 1) {
              handleChatUserList(newD);
            }
            if (newD.chatType == 1 && store.state.currentSendUserId == newD.sendUser || newD.chatType != 1) {
              store.commit("SET_CHAT_HISTORY_LIST", {
                type: "push",
                message: newD
              });
              store.commit("SET_CLOSE_USER_OBJ", {
                csUserId: newD.sendUser,
                custUserId: newD.receiveUser,
                logo: d.sendAvatar
              });
            }
          } else {
            store.commit("SET_IS_REGISTER", false);
            store.commit("SET_PAGING_OBG", {
              pageNum: store.state.pagingObj.pageNum,
              refresherEnabled: true
            });
            uni.showToast({
              title: d.message,
              icon: "none",
              duration: 5e3
            });
          }
          break;
        case 4006:
          formatAppLog("log", "at utils/response.js:148", "响应客服离线聊天=4006", d);
          store.commit("SET_TRIGGERD", false);
          const {
            content
          } = d;
          if (content && content.length > 0) {
            store.commit("SET_PAGING_OBG", {
              pageNum: store.state.pagingObj.pageNum += 1,
              refresherEnabled: true
            });
            const newNewsData = content.map((item) => {
              if (item.chatType == 1) {
                item.type = store.state.userInfo.isCustomerService == 0 ? 1 : 0;
                item.logo = item.sendAvatar;
                item.requestId = item.msgId;
              }
              if (item.chatType == 2) {
                item.type = store.state.userInfo.isCustomerService == 0 ? 0 : 1;
                item.logo = item.sendAvatar;
                item.requestId = item.msgId;
              }
              return item;
            });
            formatAppLog("log", "at utils/response.js:174", "4006,newNewsData", JSON.stringify(newNewsData));
            store.commit("SET_CHAT_HISTORY_LIST", {
              type: "unshift",
              message: newNewsData.reverse()
            });
          } else {
            store.commit("SET_PAGING_OBG", {
              pageNum: store.state.pagingObj.pageNum,
              refresherEnabled: false
            });
          }
          break;
        case 4007:
          formatAppLog("log", "at utils/response.js:188", "响应发送完成的消息=4007", d);
          let newsObj = store.state.newsObj;
          if (d && newsObj) {
            if (d.requestId == newsObj.requestId) {
              newsObj = {
                ...newsObj,
                ...d,
                msgId: d.msgId
              };
              store.commit("SET_NEWS_OBJ", null);
              store.commit("SET_IS_REGISTER", true);
              store.commit("SET_CHAT_HISTORY_LIST", {
                type: "push",
                message: newsObj
              });
              uni.hideLoading();
              if (store.state.userInfo.isCustomerService == 1) {
                handleChatUserList(newsObj);
              }
            }
          }
          break;
        default:
          formatAppLog("log", "at utils/response.js:215", "default");
      }
    }
  }
  let socketOpen = false;
  function initSocketControl() {
    uni.connectSocket({
      url: window.WS_BASEURL,
      success(res) {
        formatAppLog("log", "at utils/socketControl.js:11", "链接成功=======>>>>", res);
      },
      fail(err) {
        formatAppLog("log", "at utils/socketControl.js:14", "链接失败=======>>>>", err);
      }
    });
    uni.onSocketOpen(function(res) {
      formatAppLog("log", "at utils/socketControl.js:19", "onSocketOpen", res);
      socketOpen = true;
      receiveMessage();
      formatAppLog("log", "at utils/socketControl.js:22", "WebSocket连接已打开！");
      handleSendCS1001();
    });
    uni.onSocketError(function(res) {
      formatAppLog("log", "at utils/socketControl.js:26", "WebSocket连接打开失败，请检查！", res);
    });
  }
  function handleSendCS1001() {
    formatAppLog("log", "at utils/socketControl.js:31", "handleSendCS1001", store.state);
    if (store.state && store.state.userInfo) {
      CS1001.d = store.state.userInfo;
      sendSocketMessage(CS1001);
    }
  }
  function receiveMessage() {
    uni.onSocketMessage(function(res) {
      response(res);
    });
    uni.onSocketError(function(res) {
      formatAppLog("log", "at utils/socketControl.js:46", "WebSocket连接打开失败，请检查！", res);
    });
  }
  function sendSocketMessage(reqType) {
    if (socketOpen) {
      uni.sendSocketMessage({
        data: JSON.stringify(reqType),
        complete(res) {
          formatAppLog("log", "at utils/socketControl.js:56", JSON.stringify(reqType), "发送完成=======>>>>", res);
        },
        fail(err) {
          formatAppLog("log", "at utils/socketControl.js:59", "发送失败=======>>>>", err);
          store.commit("SET_IS_REGISTER", false);
          store.commit("SET_PAGING_OBG", { pageNum: store.state.pagingObj.pageNum, refresherEnabled: false });
          uni.hideLoading();
          uni.showToast({
            title: "发送失败",
            icon: "none"
          });
        }
      });
    }
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$2 = {
    data() {
      return {
        enabled: true
      };
    },
    computed: {
      ...mapState(["userInfo", "triggered", "chatUserList"])
    },
    onShow: function() {
      this.enabled = true;
    },
    methods: {
      // 下拉刷新
      onRefresh() {
        if (this.enabled) {
          formatAppLog("log", "at pages/index/index.vue:55", "下拉刷新...onRefreshonRefresh");
          this.$store.commit("SET_TRIGGERD", true);
          handleSendCS1001();
        }
      },
      // 拼接图片
      getHttpImagedUrl(str) {
        return `${window.IMAGE_BASEURL}${str}`;
      },
      hnadleJump(item) {
        let a, b;
        if (item.chatType == 1) {
          a = item.sendUser;
          b = item.sendName;
        } else {
          a = item.receiveUser;
          b = item.receiveName;
        }
        this.enabled = false;
        this.$store.commit("SET_CURRENT_SEND_USERID", item.sendUser);
        uni.navigateTo({
          url: `/pages/chat/chat?custUserId=${a}&sendName=${b}`
        });
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("scroll-view", {
        "scroll-y": "",
        ref: "scrollView",
        "refresher-enabled": $data.enabled,
        "refresher-triggered": _ctx.triggered,
        "refresher-background": "#f3f3f3",
        onRefresherrefresh: _cache[0] || (_cache[0] = (...args) => $options.onRefresh && $options.onRefresh(...args)),
        style: { height: "100vh" }
      }, [
        vue.createElementVNode("view", { class: "list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList(_ctx.chatUserList, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "list_item",
                key: item.msgId,
                onClick: ($event) => $options.hnadleJump(item)
              }, [
                vue.createCommentVNode(" // chatType 聊天类型:0=正常聊天,1=客户发送给客服,2客服回复客户 "),
                vue.createCommentVNode(' <image :src="getHttpImagedUrl(item.sendAvatar)" mode="aspectFill" class="avatar"></image> '),
                vue.createElementVNode("image", {
                  src: $options.getHttpImagedUrl(item.chatType == 1 ? item.sendAvatar : item.receiveAvatar),
                  mode: "aspectFill",
                  class: "avatar"
                }, null, 8, ["src"]),
                vue.createElementVNode("view", { class: "info" }, [
                  vue.createElementVNode("view", { class: "top" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "top_name" },
                      vue.toDisplayString(item.chatType == 1 ? item.sendName : item.receiveName),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "top_time" },
                      vue.toDisplayString(item.time),
                      1
                      /* TEXT */
                    ),
                    vue.createCommentVNode(' <text class="top_name">{{ item.receiveName }}</text>\r\n              <text class="top_time">{{ item.receiveTime }}</text> ')
                  ]),
                  vue.createElementVNode("view", { class: "top grayTxtColor" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(item.message),
                      1
                      /* TEXT */
                    ),
                    item.isNew ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 0,
                      class: "badge",
                      style: {}
                    }, "●")) : vue.createCommentVNode("v-if", true)
                  ])
                ])
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          _ctx.chatUserList && _ctx.chatUserList.length == 0 ? (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 0,
              class: "empty grayTxtColor"
            },
            vue.toDisplayString(_ctx.userInfo && _ctx.userInfo.language == "zh" ? "暂无新消息" : "No new news at the moment"),
            1
            /* TEXT */
          )) : vue.createCommentVNode("v-if", true)
        ])
      ], 40, ["refresher-enabled", "refresher-triggered"])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "/Users/cch/Desktop/TJPT/temp/service-custom/pages/index/index.vue"]]);
  const _imports_0 = "/static/back.png";
  const _imports_1 = "/static/emote.png";
  const _imports_2 = "/static/add.png";
  const _imports_3 = "/static/img.png";
  const _sfc_main$1 = {
    data() {
      return {
        title: null,
        custUserId: null,
        scrollViewHeight: 0,
        // 存储动态计算的 scroll-view 高度
        scrollTop: 0,
        emoteArr: emote,
        content: "",
        isFocus: false,
        // 输入框聚焦
        isEmote: false,
        // 是否开启表情
        isAdd: false,
        // 是否开启 图片 拍照
        uploading: false,
        // 上传状态
        uploadSuccess: false,
        // 上传成功
        uploadError: false
        // 上传失败
      };
    },
    computed: {
      ...mapState({
        userInfo: (state) => state.userInfo,
        isRegister: (state) => state.isRegister,
        chatHistoryList: (state) => state.chatHistoryList,
        closeUserObj: (state) => state.closeUserObj,
        pagingObj: (state) => state.pagingObj,
        triggered: (state) => state.triggered
      }),
      getScrollViewHeight: function() {
        return this.scrollViewHeight;
      }
    },
    onLoad(options) {
      formatAppLog("log", "at pages/chat/chat.vue:114", options.custUserId, "options");
      if (this.userInfo && this.userInfo.isCustomerService == 1 && options.custUserId) {
        this.getHistoryMsg(options.custUserId);
        this.title = options.sendName;
        this.custUserId = options.custUserId;
      }
    },
    mounted() {
      this.updateHeight();
    },
    updated() {
    },
    methods: {
      goBack() {
        uni.navigateBack();
        this.$store.commit("SET_CHAT_HISTORY_LIST", { type: "clear" });
        this.$store.commit("SET_PAGING_OBG", { pageNum: 1, refresherEnabled: true });
      },
      // 获取 ref 元素的高度
      updateHeight() {
        const screenHeight = uni.getSystemInfoSync().screenHeight;
        let tabBarHeight = 0;
        this.$nextTick(() => {
          formatAppLog("log", "at pages/chat/chat.vue:149", "this.$refs.fixedView", this.$refs.fixedView);
          if (this.$refs.fixedView) {
            const query = uni.createSelectorQuery().in(this);
            query.select(".box-2").boundingClientRect((rect) => {
              formatAppLog("log", "at pages/chat/chat.vue:158", "box-2 固定定位元素的高度:", rect.height);
              tabBarHeight = rect.height + 40;
            }).exec();
          }
          if (this.userInfo && this.userInfo.isCustomerService == 1) {
            tabBarHeight += 40;
          }
          this.scrollToBottom();
          this.$set(this, "scrollViewHeight", screenHeight - tabBarHeight);
          formatAppLog("log", "at pages/chat/chat.vue:170", "scrollViewHeight", this.scrollViewHeight);
        });
        this.scrollToBottom();
      },
      // 上拉加载更多数据
      onRefresh() {
        formatAppLog("log", "at pages/chat/chat.vue:177", "加载更多数据...");
        this.getHistoryMsg();
      },
      // 获取历史消息
      getHistoryMsg(custUserId) {
        formatAppLog("log", "at pages/chat/chat.vue:182", "getHistoryMsg");
        this.$store.commit("SET_TRIGGERD", true);
        if (custUserId) {
          CS4005.d.custUserId = custUserId;
        }
        if (this.chatHistoryList && this.chatHistoryList.length > 0) {
          CS4005.d.sendTime = this.chatHistoryList[0].sendTime;
        } else {
          CS4005.d.sendTime = "";
        }
        CS4005.d.requestId = generateRandomString();
        CS4005.d.pageNum = this.pagingObj.pageNum;
        sendSocketMessage(CS4005);
      },
      // 滚动到最底部
      scrollToBottom() {
        const query = uni.createSelectorQuery().in(this);
        query.select(".box-1").boundingClientRect((rect) => {
          formatAppLog("log", "at pages/chat/chat.vue:204", "box-1的高度:", rect.height);
          this.$set(this, "scrollTop", rect.height);
        }).exec();
      },
      // 拼接图片
      getHttpImagedUrl(str) {
        return `${window.IMAGE_BASEURL}${str}`;
      },
      // 预览图片
      previewImage(str) {
        uni.previewImage({
          current: 0,
          // 当前展示的图片索引
          urls: [this.getHttpImagedUrl(str)]
          // 图片列表
        });
      },
      // 处理表情
      handleEmote(emote2) {
        this.content += emote2;
      },
      // 发送信息
      send() {
        if (!this.content) {
          uni.showToast({
            title: "请输入有效的内容",
            icon: "none"
          });
          return;
        }
        uni.showLoading({
          title: "正在发送"
        });
        this.handleSendCS4002(1);
      },
      // 处理 input @focus
      handleInputFocus() {
        this.isFocus = true;
        this.isEmote = false;
        this.isAdd = false;
        this.updateHeight();
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      // 处理 input @blur
      handleInputBlur() {
        setTimeout(() => {
          this.isFocus = false;
          this.isEmote = false;
          this.isAdd = false;
          this.updateHeight();
        }, 0);
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      // 处理 emote @click 事件 延时处理
      handleBtnEmote() {
        setTimeout(() => {
          this.isFocus = false;
          this.isEmote = true;
          this.isAdd = false;
          this.updateHeight();
        }, 10);
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      // 处理 add @click 事件 延时处理
      handleBtnAdd() {
        setTimeout(() => {
          this.isFocus = false;
          this.isEmote = false;
          this.isAdd = true;
          this.updateHeight();
          this.scrollToBottom();
        }, 10);
        this.$nextTick(() => {
        });
      },
      handleSendCS4002(type, imgUrl) {
        uni.showLoading({
          title: "正在发送"
        });
        CS4002.u = this.closeUserObj && this.closeUserObj.csUserId || this.custUserId;
        CS4002.d = {
          requestId: generateRandomString(),
          type: 1,
          //此为消息类别，设 1 为发出去的消息，0 为收到对方的消息,
          sendTime: (/* @__PURE__ */ new Date()).getTime(),
          logo: this.userInfo.logo
          // 头像
        };
        if (type == 1) {
          CS4002.d.msgType = 1;
          CS4002.d.message = this.content;
        }
        formatAppLog("log", "at pages/chat/chat.vue:316", "imgUrl,", imgUrl);
        if (type == 3) {
          CS4002.d.msgType = 3;
          CS4002.d.message = imgUrl.data;
        }
        this.$store.commit("SET_NEWS_OBJ", CS4002.d);
        this.$store.commit("SET_IS_REGISTER", false);
        sendSocketMessage(CS4002);
        this.$nextTick(() => {
          this.content = "";
          this.scrollToBottom();
        });
      },
      // 选择图片
      chooseImage() {
        const maxSize = 5 * 1024 * 1024;
        uni.chooseImage({
          count: 1,
          // 选择一张图片
          success: (res) => {
            const tempFilePath = res.tempFilePaths[0];
            if (tempFilePath.size > maxSize) {
              uni.showToast({
                title: "图片大小不能超过 5MB",
                icon: "none"
              });
              return;
            }
            this.imageUrl = tempFilePath;
            this.uploadImage(tempFilePath);
          },
          fail: (err) => {
            formatAppLog("log", "at pages/chat/chat.vue:356", "选择图片失败", err);
          }
        });
      },
      // 上传图片
      uploadImage(filePath) {
        this.uploading = true;
        uni.uploadFile({
          url: `${window.API_BASEURL}/app/uploadFile`,
          // 替换为你的上传接口地址
          filePath,
          // 图片文件路径
          name: "file",
          // 后端接收文件的字段名
          formData: {
            type: "chat"
            // 上传聊天图片
          },
          header: {
            Authorization: this.userInfo.Authorization,
            // 自定义请求头，例如 Authorization
            ContentType: "multipart/form-data"
            // 可选，通常上传文件时可以设置为 multipart/form-data
          },
          success: (uploadFileRes) => {
            this.uploading = false;
            this.uploadSuccess = true;
            const result = JSON.parse(uploadFileRes.data);
            formatAppLog("log", "at pages/chat/chat.vue:379", result, "result");
            if (result.code == 0) {
              formatAppLog("log", "at pages/chat/chat.vue:381", "上传成功");
              this.handleSendCS4002(3, JSON.parse(uploadFileRes.data));
            } else {
              formatAppLog("log", "at pages/chat/chat.vue:384", "上传失败");
              uni.showToast({
                title: result.message,
                icon: "error",
                duration: 2e3
              });
            }
            this.handleInputBlur();
          },
          fail: (error) => {
            this.uploading = false;
            this.uploadError = true;
            formatAppLog("log", "at pages/chat/chat.vue:398", "上传失败", error);
          }
        });
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      _ctx.userInfo && _ctx.userInfo.isCustomerService == 1 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "go_back"
      }, [
        vue.createElementVNode("image", {
          src: _imports_0,
          mode: "aspectFill",
          class: "back",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
        }),
        vue.createElementVNode(
          "view",
          { class: "title" },
          vue.toDisplayString($data.title),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", { class: "back" })
      ])) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("scroll-view", {
        "scroll-y": "",
        ref: "scrollView",
        "refresher-enabled": _ctx.pagingObj.refresherEnabled,
        "refresher-triggered": _ctx.triggered,
        "refresher-background": "#f3f3f3",
        onRefresherrefresh: _cache[1] || (_cache[1] = (...args) => $options.onRefresh && $options.onRefresh(...args)),
        onClick: _cache[2] || (_cache[2] = (...args) => $options.handleInputBlur && $options.handleInputBlur(...args)),
        "scroll-top": $data.scrollTop,
        style: vue.normalizeStyle({
          height: $data.scrollViewHeight + "px",
          paddingTop: _ctx.userInfo && _ctx.userInfo.isCustomerService == 1 ? "40px" : "0"
        })
      }, [
        vue.createElementVNode("view", {
          class: "box-1",
          id: "list-box"
        }, [
          vue.createElementVNode("view", { class: "talk-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(_ctx.chatHistoryList, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index,
                  id: `msg-${item.requestId}`
                }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass(["item flex_col", item.type == 1 ? "push" : "pull"])
                    },
                    [
                      vue.createElementVNode("image", {
                        src: $options.getHttpImagedUrl(item.logo),
                        mode: "aspectFill",
                        class: "pic"
                      }, null, 8, ["src"]),
                      vue.createElementVNode("view", { class: "content" }, [
                        item.msgType == 1 ? (vue.openBlock(), vue.createElementBlock(
                          "text",
                          { key: 0 },
                          vue.toDisplayString(item.message),
                          1
                          /* TEXT */
                        )) : vue.createCommentVNode("v-if", true),
                        item.msgType == 3 ? (vue.openBlock(), vue.createElementBlock("image", {
                          key: 1,
                          class: "image_box",
                          src: $options.getHttpImagedUrl(item.message),
                          mode: "aspectFill",
                          onClick: ($event) => $options.previewImage(item.message)
                        }, null, 8, ["src", "onClick"])) : vue.createCommentVNode("v-if", true)
                      ])
                    ],
                    2
                    /* CLASS */
                  )
                ], 8, ["id"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ])
      ], 44, ["refresher-enabled", "refresher-triggered", "scroll-top"]),
      vue.createCommentVNode(' <transition name="fade"> '),
      _ctx.isRegister || _ctx.userInfo && _ctx.userInfo.isCustomerService == 0 && _ctx.closeUserObj && _ctx.closeUserObj.csUserId && _ctx.closeUserObj.custUserId ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 1,
          ref: "fixedView",
          class: "box-2"
        },
        [
          vue.createElementVNode("view", { class: "flex_col" }, [
            vue.createElementVNode("view", { class: "flex_grow" }, [
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  type: "text",
                  class: "content",
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.content = $event),
                  placeholder: "请输入",
                  "placeholder-style": "color:#DDD;",
                  "cursor-spacing": 6,
                  onFocus: _cache[4] || (_cache[4] = ($event) => $options.handleInputFocus()),
                  onBlur: _cache[5] || (_cache[5] = ($event) => $options.handleInputBlur()),
                  onConfirm: _cache[6] || (_cache[6] = ($event) => $options.send())
                },
                null,
                544
                /* NEED_HYDRATION, NEED_PATCH */
              ), [
                [vue.vModelText, $data.content]
              ])
            ]),
            vue.createElementVNode("image", {
              class: "btn_icon",
              src: _imports_1,
              onClick: _cache[7] || (_cache[7] = ($event) => $options.handleBtnEmote())
            }),
            vue.withDirectives(vue.createElementVNode(
              "image",
              {
                class: "btn_icon",
                src: _imports_2,
                onClick: _cache[8] || (_cache[8] = ($event) => $options.handleBtnAdd())
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vShow, !$data.isFocus && !$data.isEmote]
            ]),
            vue.withDirectives(vue.createElementVNode(
              "button",
              {
                class: "send",
                onClick: _cache[9] || (_cache[9] = (...args) => $options.send && $options.send(...args))
              },
              "发送",
              512
              /* NEED_PATCH */
            ), [
              [vue.vShow, $data.isFocus || $data.isEmote]
            ])
          ]),
          vue.withDirectives(vue.createElementVNode(
            "view",
            { class: "emote_box" },
            [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($data.emoteArr, (emoteItem) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "emote_box_item",
                    key: emoteItem,
                    onClick: ($event) => $options.handleEmote(emoteItem)
                  }, vue.toDisplayString(emoteItem), 9, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ],
            512
            /* NEED_PATCH */
          ), [
            [vue.vShow, !$data.isFocus && !$data.isAdd && $data.isEmote]
          ]),
          vue.withDirectives(vue.createElementVNode(
            "view",
            { class: "more_box" },
            [
              vue.createElementVNode("image", {
                onClick: _cache[10] || (_cache[10] = vue.withModifiers((...args) => $options.chooseImage && $options.chooseImage(...args), ["stop"])),
                src: _imports_3
              })
            ],
            512
            /* NEED_PATCH */
          ), [
            [vue.vShow, !$data.isFocus && !$data.isEmote && $data.isAdd]
          ])
        ],
        512
        /* NEED_PATCH */
      )) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" </transition> ")
    ]);
  }
  const PagesChatChat = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__file", "/Users/cch/Desktop/TJPT/temp/service-custom/pages/chat/chat.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/chat/chat", PagesChatChat);
  !function(e, n) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define(n) : (e = e || self).uni = n();
  }(void 0, function() {
    try {
      var e = {};
      Object.defineProperty(e, "passive", {
        get: function() {
        }
      }), window.addEventListener("test-passive", null, e);
    } catch (e2) {
    }
    var n = Object.prototype.hasOwnProperty;
    function i(e2, i2) {
      return n.call(e2, i2);
    }
    var t = [];
    function r() {
      return window.__dcloud_weex_postMessage || window.__dcloud_weex_;
    }
    var o = function(e2, n2) {
      var i2 = { options: { timestamp: +/* @__PURE__ */ new Date() }, name: e2, arg: n2 };
      if (r()) {
        if ("postMessage" === e2) {
          var o2 = { data: [n2] };
          return window.__dcloud_weex_postMessage ? window.__dcloud_weex_postMessage(o2) : window.__dcloud_weex_.postMessage(JSON.stringify(o2));
        }
        var a2 = { type: "WEB_INVOKE_APPSERVICE", args: { data: i2, webviewIds: t } };
        window.__dcloud_weex_postMessage ? window.__dcloud_weex_postMessageToService(a2) : window.__dcloud_weex_.postMessageToService(JSON.stringify(a2));
      }
      if (!window.plus)
        return window.parent.postMessage({ type: "WEB_INVOKE_APPSERVICE", data: i2, pageId: "" }, "*");
      if (0 === t.length) {
        var d2 = plus.webview.currentWebview();
        if (!d2)
          throw new Error("plus.webview.currentWebview() is undefined");
        var s2 = d2.parent(), w2 = "";
        w2 = s2 ? s2.id : d2.id, t.push(w2);
      }
      if (plus.webview.getWebviewById("__uniapp__service"))
        plus.webview.postMessageToUniNView({ type: "WEB_INVOKE_APPSERVICE", args: { data: i2, webviewIds: t } }, "__uniapp__service");
      else {
        var u2 = JSON.stringify(i2);
        plus.webview.getLaunchWebview().evalJS('UniPlusBridge.subscribeHandler("'.concat("WEB_INVOKE_APPSERVICE", '",').concat(u2, ",").concat(JSON.stringify(t), ");"));
      }
    }, a = {
      navigateTo: function() {
        var e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, n2 = e2.url;
        o("navigateTo", { url: encodeURI(n2) });
      },
      navigateBack: function() {
        var e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, n2 = e2.delta;
        o("navigateBack", { delta: parseInt(n2) || 1 });
      },
      switchTab: function() {
        var e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, n2 = e2.url;
        o("switchTab", { url: encodeURI(n2) });
      },
      reLaunch: function() {
        var e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, n2 = e2.url;
        o("reLaunch", { url: encodeURI(n2) });
      },
      redirectTo: function() {
        var e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, n2 = e2.url;
        o("redirectTo", { url: encodeURI(n2) });
      },
      getEnv: function(e2) {
        r() ? e2({ nvue: true }) : window.plus ? e2({ plus: true }) : e2({ h5: true });
      },
      postMessage: function() {
        var e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
        o("postMessage", e2.data || {});
      }
    }, d = /uni-app/i.test(navigator.userAgent), s = /Html5Plus/i.test(navigator.userAgent), w = /complete|loaded|interactive/;
    var u = window.my && navigator.userAgent.indexOf(["t", "n", "e", "i", "l", "C", "y", "a", "p", "i", "l", "A"].reverse().join("")) > -1;
    var g = window.swan && window.swan.webView && /swan/i.test(navigator.userAgent);
    var v = window.qq && window.qq.miniProgram && /QQ/i.test(navigator.userAgent) && /miniProgram/i.test(navigator.userAgent);
    var c = window.tt && window.tt.miniProgram && /toutiaomicroapp/i.test(navigator.userAgent);
    var m = window.wx && window.wx.miniProgram && /micromessenger/i.test(navigator.userAgent) && /miniProgram/i.test(navigator.userAgent);
    var p = window.qa && /quickapp/i.test(navigator.userAgent);
    var f = window.ks && window.ks.miniProgram && /micromessenger/i.test(navigator.userAgent) && /miniProgram/i.test(navigator.userAgent);
    var l = window.tt && window.tt.miniProgram && /Lark|Feishu/i.test(navigator.userAgent);
    var _ = window.jd && window.jd.miniProgram && /micromessenger/i.test(navigator.userAgent) && /miniProgram/i.test(navigator.userAgent);
    var E = window.xhs && window.xhs.miniProgram && /xhsminiapp/i.test(navigator.userAgent);
    for (var h, P = function() {
      window.UniAppJSBridge = true, document.dispatchEvent(new CustomEvent("UniAppJSBridgeReady", { bubbles: true, cancelable: true }));
    }, b = [
      function(e2) {
        if (d || s)
          return window.__dcloud_weex_postMessage || window.__dcloud_weex_ ? document.addEventListener("DOMContentLoaded", e2) : window.plus && w.test(document.readyState) ? setTimeout(e2, 0) : document.addEventListener("plusready", e2), a;
      },
      function(e2) {
        if (m)
          return window.WeixinJSBridge && window.WeixinJSBridge.invoke ? setTimeout(e2, 0) : document.addEventListener("WeixinJSBridgeReady", e2), window.wx.miniProgram;
      },
      function(e2) {
        if (v)
          return window.QQJSBridge && window.QQJSBridge.invoke ? setTimeout(e2, 0) : document.addEventListener("QQJSBridgeReady", e2), window.qq.miniProgram;
      },
      function(e2) {
        if (u) {
          document.addEventListener("DOMContentLoaded", e2);
          var n2 = window.my;
          return {
            navigateTo: n2.navigateTo,
            navigateBack: n2.navigateBack,
            switchTab: n2.switchTab,
            reLaunch: n2.reLaunch,
            redirectTo: n2.redirectTo,
            postMessage: n2.postMessage,
            getEnv: n2.getEnv
          };
        }
      },
      function(e2) {
        if (g)
          return document.addEventListener("DOMContentLoaded", e2), window.swan.webView;
      },
      function(e2) {
        if (c)
          return document.addEventListener("DOMContentLoaded", e2), window.tt.miniProgram;
      },
      function(e2) {
        if (p) {
          window.QaJSBridge && window.QaJSBridge.invoke ? setTimeout(e2, 0) : document.addEventListener("QaJSBridgeReady", e2);
          var n2 = window.qa;
          return {
            navigateTo: n2.navigateTo,
            navigateBack: n2.navigateBack,
            switchTab: n2.switchTab,
            reLaunch: n2.reLaunch,
            redirectTo: n2.redirectTo,
            postMessage: n2.postMessage,
            getEnv: n2.getEnv
          };
        }
      },
      function(e2) {
        if (f)
          return window.WeixinJSBridge && window.WeixinJSBridge.invoke ? setTimeout(e2, 0) : document.addEventListener("WeixinJSBridgeReady", e2), window.ks.miniProgram;
      },
      function(e2) {
        if (l)
          return document.addEventListener("DOMContentLoaded", e2), window.tt.miniProgram;
      },
      function(e2) {
        if (_)
          return window.JDJSBridgeReady && window.JDJSBridgeReady.invoke ? setTimeout(e2, 0) : document.addEventListener("JDJSBridgeReady", e2), window.jd.miniProgram;
      },
      function(e2) {
        if (E)
          return window.xhs.miniProgram;
      },
      function(e2) {
        return document.addEventListener("DOMContentLoaded", e2), a;
      }
    ], y = 0; y < b.length && !(h = b[y](P)); y++)
      ;
    h || (h = {});
    var B = "undefined" != typeof uni ? uni : {};
    if (!B.navigateTo)
      for (var S in h)
        i(h, S) && (B[S] = h[S]);
    return B.webView = h, B;
  });
  const _sfc_main = {
    computed: {
      ...mapState({
        closeUserObj: "closeUserObj"
      })
    },
    onLaunch: function() {
      formatAppLog("log", "at App.vue:14", "App Launch:::发送消息给App");
      globalSendMessage({ type: "CUSTOMER_SERVICE" });
      document.addEventListener(
        "UniAppJSBridgeReady",
        function() {
          formatAppLog("log", "at App.vue:21", "进入::: ===>>> UniAppJSBridgeReady");
          uni.webView.getEnv(function(res) {
            formatAppLog("log", "at App.vue:23", "当前环境：" + JSON.stringify(res));
          });
          uni.webView.postMessage({
            data: {
              action: "message",
              type: "CUSTOMER_SERVICE"
            }
          });
        },
        false
      );
    },
    mounted() {
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:38", "App Show:::接收APP消息 并 初始化 socket");
      window["CUSTOMER_SERVICE_MESSAGES"] = (data) => {
        const appMessagesData = JSON.parse(data);
        formatAppLog("log", "at App.vue:51", "这里是 app 传递给我的消息", appMessagesData);
        appMessagesData.isCustomerService = Number(appMessagesData.isCustomerService);
        appMessagesData.Authorization = `Bearer ${appMessagesData.Authorization.replace(/"/g, "")}`;
        this.$store.dispatch("asyncRegisterUser", appMessagesData);
        initSocketControl();
      };
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:59", "App Hide");
    },
    onUnload() {
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "/Users/cch/Desktop/TJPT/temp/service-custom/App.vue"]]);
  window.WS_BASEURL = "ws://39.105.130.26:8022/director";
  window.API_BASEURL = "http://39.105.130.26:8900/api";
  window.IMAGE_BASEURL = "http://39.105.130.26:8050/";
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(store);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
