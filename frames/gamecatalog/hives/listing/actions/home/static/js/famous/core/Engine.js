/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {

    /**
     * The singleton object initiated upon process
     *   startup which manages all active Context instances, runs
     *   the render dispatch loop, and acts as a listener and dispatcher
     *   for events.
     *
     * On static initialization, window.requestAnimationFrame is called with
     *   the event loop function, step().
     *
     * Note: Any window in which Engine runs will prevent default
     *   scrolling behavior on the 'touchmove' event.
     *
     * @static
     * @class Engine
     */
    var Context = require('./Context');
    var EventHandler = require('./EventHandler');
    var OptionsManager = require('./OptionsManager');

    var Engine = {};

    var contexts = [];
    var nextTickQueue = [];
    var deferQueue = [];

    var lastTime = Date.now();
    var frameTime;
    var frameTimeLimit;
    var loopEnabled = true;
    var eventForwarders = {};
    var eventHandler = new EventHandler();

    var options = {
        containerType: 'div',
        containerClass: 'famous-container',
        fpsCap: undefined,
        runLoop: true
    };
    var optionsManager = new OptionsManager(options);

    /** @const */
    var MAX_DEFER_FRAME_TIME = 10;

    /**
     * Inside requestAnimationFrame loop, step() is called, which:
     *   - calculates current FPS (throttling loop if it is over limit set in setFPSCap)
     *   - emits dataless 'prerender' event on start of loop
     *   - calls in order any one-shot functions registered by nextTick on last loop.
     *   - calls Context.update on all Context objects registered.
     *   - emits dataless 'postrender' event on end of loop
     *
     * @static
     * @private
     * @method step
     *
     */
    Engine.step = function step() {
        var currentTime = Date.now();

        // skip frame if we're over our framerate cap
        if (frameTimeLimit && currentTime - lastTime < frameTimeLimit) return;

        var i = 0;

        frameTime = currentTime - lastTime;
        lastTime = currentTime;

        eventHandler.emit('prerender');

        // empty the queue
        for (i = 0; i < nextTickQueue.length; i++) nextTickQueue[i].call(this);
        nextTickQueue.splice(0);

        // limit total execution time for deferrable functions
        while (deferQueue.length && (Date.now() - currentTime) < MAX_DEFER_FRAME_TIME) {
            deferQueue.shift().call(this);
        }

        for (i = 0; i < contexts.length; i++) contexts[i].update();

        eventHandler.emit('postrender');
    };

    // engage requestAnimationFrame
    function loop() {
        if (options.runLoop) {
            Engine.step();
            requestAnimationFrame(loop);
        }
        else loopEnabled = false;
    }
    requestAnimationFrame(loop);

    //
    // Upon main document window resize (unless on an "input" HTML element)
    //   - scroll to the top left corner of the window
    //   - For each managed {@link Context}: emit the 'resize' event and update its size
    // @param {Object=} event document event
    //
    function handleResize(event) {
        if (document.activeElement && document.activeElement.nodeName === 'INPUT') {
            document.activeElement.addEventListener('blur', function deferredResize() {
                this.removeEventListener('blur', deferredResize);
                handleResize(event);
            });
            return;
        }
        window.scrollTo(0, 0);
        for (var i = 0; i < contexts.length; i++) {
            contexts[i].emit('resize');
        }
        eventHandler.emit('resize');
    }
    window.addEventListener('resize', handleResize, false);
    handleResize();

    // prevent scrolling via browser
    window.addEventListener('touchmove', function(event) {
        event.preventDefault();
    }, true);


    /**
     * Add handler object to set of downstream handlers.
     *
     * @static
     * @method pipe
     *
     * @param {EventHandler} target downstream event handlers
     * @return {EventHandler} event handler object (for chaining)
     */
    Engine.pipe = function pipe(target) {
        if (target.subscribe instanceof Function) return target.subscribe(Engine);
        else return eventHandler.pipe(target);
    };

    /**
     * Stop piping all events at the Engine level to a target emitter
     *   object.  Undoes the work of {@link pipe}.
     *
     * @static
     * @method unpipe
     *
     * @param {emitterObject} target target emitter object
     */
    Engine.unpipe = function unpipe(target) {
        if (target.unsubscribe instanceof Function) return target.unsubscribe(Engine);
        else return eventHandler.unpipe(target);
    };

    /**
     * Bind a handler function to an event type handled by this object.
     * The document events to which Engine
     *   listens by default include: 'touchstart', 'touchmove', 'touchend',
     *   'touchcancel',
     *   'click', 'keydown', 'keyup', 'keypress', 'mousemove',
     *   'mouseover', 'mouseout'.
     *
     * @static
     * @method on&nbsp;
     *
     * @param {string} type event type key (for example, 'click')
     * @param {function(string, Object)} handler callback
     * @return {EventHandler} internal event handler
     */
    Engine.on = function on(type, handler) {
        if (!(type in eventForwarders)) {
            eventForwarders[type] = eventHandler.emit.bind(eventHandler, type);
            document.body.addEventListener(type, eventForwarders[type]);
        }
        return eventHandler.on(type, handler);
    };

    /**
     * Trigger an event, sending to all downstream handlers
     *   matching provided 'type' key.
     *
     * @static
     * @method emit
     *
     * @param {string} type event type key (for example, 'click')
     * @param {Object} event event data
     */
    Engine.emit = function emit(type, event) {
        return eventHandler.emit(type, event);
    };


    /**
     * Unbind an event by type and handler.
     *   This undoes the work of "on()".
     *
     * @static
     * @method removeListener
     *
     * @param {string} type event type key (for example, 'click')
     * @param {function} handler function object to remove
     * @return {EventHandler} internal event handler object (for chaining)
     */
    Engine.removeListener = function removeListener(type, handler) {
        return eventHandler.removeListener(type, handler);
    };

    /**
     * Return the current calculated frames per second of the Engine.
     *
     * @static
     * @method getFPS
     *
     * @return {Number} calculated fps
     */
    Engine.getFPS = function getFPS() {
        return 1000 / frameTime;
    };

    /**
     * Set the maximum fps at which the system should run. If internal render
     *    loop is called at a greater frequency than this FPSCap, Engine will
     *    throttle render and update until this rate is achieved.
     *
     * @static
     * @method setFPSCap
     *
     * @param {Number} fps maximum frames per second
     */
    Engine.setFPSCap = function setFPSCap(fps) {
        frameTimeLimit = Math.floor(1000 / fps);
    };

    // TODO: OptionsManager can only take one argument, so why use "arguments"?
    /**
     * Return engine options
     *
     * @static
     * @method getOptions
     * @param {string} key
     * @return {Object} engine options
     */
    Engine.getOptions = function getOptions() {
        return optionsManager.getOptions.apply(optionsManager, arguments);
    };

    /**
     * Set engine options
     *
     * @static
     * @method setOptions
     *
     * @param {Object} [options] overrides of default options
     * @param {Number} [options.fpsCap]  maximum fps at which the system should run
     * @param {boolean} [options.runLoop] whether the run loop should continue
     */
    Engine.setOptions = function setOptions(options) {
        return optionsManager.setOptions.apply(optionsManager, arguments);
    };

    /**
     * Creates a new Context for Famo.us rendering and event handling with
     *    provided document element as top of each tree. This will be tracked by the
     *    process-wide Engine.
     *
     * @static
     * @method createContext
     *
     * @param {Node} el Top of document tree
     * @return {Context} new Context within el
     */
    Engine.createContext = function createContext(el) {
        if (el === undefined) {
            el = document.createElement(options.containerType);
            el.classList.add(options.containerClass);
            document.body.appendChild(el);
        }
        else if (!(el instanceof Element)) {
            el = document.createElement(options.containerType);
            throw new Error('Tried to create context on non-existent element');
        }
        var context = new Context(el);
        Engine.registerContext(context);
        return context;
    };

    /**
     * Registers a context to be updated within the run loop.
     *
     * @static
     * @method registerContext
     *
     * @param {Context} context Context to register
     * @return {FamousContext} provided context
     */
    Engine.registerContext = function registerContext(context) {
        contexts.push(context);
        return context;
    };

    /**
     * Queue a function to be executed on the next tick of the {@link
     *    Engine}.  The function's only argument will be the
     *    JS window object.
     *
     * @static
     * @method nextTick
     *
     * @param {Function} fn
     */
    Engine.nextTick = function nextTick(fn) {
        nextTickQueue.push(fn);
    };

    /**
     * Queue a function to be executed sometime soon, at a time that is
     *    unlikely to affect frame rate.
     *
     * @static
     * @method defer
     *
     * @param {Function} fn
     */
    Engine.defer = function defer(fn) {
        deferQueue.push(fn);
    };

    optionsManager.on('change', function(data) {
        if (data.id === 'fpsCap') Engine.setFPSCap(data.value);
        else if (data.id === 'runLoop') {
            // kick off the loop only if it was stopped
            if (!loopEnabled && data.value) {
                loopEnabled = true;
                requestAnimationFrame(loop);
            }
        }
    });

    module.exports = Engine;
});