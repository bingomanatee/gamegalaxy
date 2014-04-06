/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var EventHandler = require('famous/core/EventHandler');
    var TouchSync = require('./TouchSync');
    var ScrollSync = require('./ScrollSync');

    var defaultClasses = [TouchSync, ScrollSync];

    /**
     * @class Combines multiple types of event handling (e.g. touch, trackpad
     *     scrolling) into one standardized interface for inclusion in
     *     widgets. TouchSync and ScrollSync are enabled by default.
     * @description
     * @name GenericSync
     * @constructor
     * @example
     * define(function(require, exports, module) {
     *     var Engine = require('famous/core/Engine');
     *     var Surface = require('famous/core/Surface');
     *     var Modifier = require('famous/core/Modifier');
     *     var FM = require('famous/core/Matrix');
     *     var GenericSync = require('famous/inputs/GenericSync');
     *     var Context = Engine.createContext();
     *
     *     var surface = new Surface({
     *         size: [200,200],
     *         properties: {
     *             backgroundColor: 'red'
     *         }
     *     });
     *
     *     var modifier = new Modifier({
     *         transform: undefined
     *     });
     *
     *     var position = 0;
     *     var sync = new GenericSync(function(){
     *         return position;
     *     }, {direction: GenericSync.DIRECTION_Y});
     *
     *     surface.pipe(sync);
     *     sync.on('update', function(data) {
     *         var edge = window.innerHeight - (surface.getSize()[1])
     *         if (data.p > edge) {
     *             position = edge;
     *         } else if (data.p < 0) {
     *             position = 0;
     *         } else {
     *             position = data.p;
     *         }
     *         modifier.setTransform(FM.translate(0, position, 0));
     *         surface.setContent('position' + position + '<br>' + 'velocity' + data.v.toFixed(2));
     *     });
     *     Context.link(modifier).link(surface);
     * });
     */

    function GenericSync(targetGet, options) {
        this.targetGet = targetGet || null;

        this.eventInput = new EventHandler();
        EventHandler.setInputHandler(this, this.eventInput);

        this.eventOutput = new EventHandler();
        EventHandler.setOutputHandler(this, this.eventOutput);

        this._handlers = undefined;

        this.options = {
            syncClasses: defaultClasses
        };

        this._handlerOptions = this.options;

        if (options) this.setOptions(options);
        if (!this._handlers) _updateHandlers.call(this);
    }

    GenericSync.register = function register(syncClass) {
        if (defaultClasses.indexOf(syncClass) < 0) defaultClasses.push(syncClass);
    };
    /** @const */ GenericSync.DIRECTION_X = 0;
    /** @const */ GenericSync.DIRECTION_Y = 1;
    /** @const */ GenericSync.DIRECTION_Z = 2;

    function _updateHandlers() {
        var SyncClass = null;
        var i = 0;
        if (this._handlers) {
            for (i = 0; i < this._handlers.length; i++) {
                this.eventInput.unpipe(this._handlers[i]);
                this._handlers[i].unpipe(this.eventOutput);
            }
        }
        this._handlers = [];
        for (i = 0; i < this.options.syncClasses.length; i++) {
            SyncClass = this.options.syncClasses[i];
            this._handlers[i] = new SyncClass(this.targetGet, this._handlerOptions);
            this.eventInput.pipe(this._handlers[i]);
            this._handlers[i].pipe(this.eventOutput);
        }
    }

    GenericSync.prototype.setOptions = function setOptions(options) {
        this._handlerOptions = options;
        if (options.syncClasses) {
            this.options.syncClasses = options.syncClasses;
            _updateHandlers.call(this);
        }
        if (this._handlers) {
            for (var i = 0; i < this._handlers.length; i++) {
                this._handlers[i].setOptions(this._handlerOptions);
            }
        }
    };

    module.exports = GenericSync;
});
