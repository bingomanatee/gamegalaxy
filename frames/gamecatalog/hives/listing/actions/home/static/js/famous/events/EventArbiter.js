/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var EventHandler = require('famous/core/EventHandler');

    /**
     * A switch which wraps several event destinations and
     *  redirects received events to at most one of them.
     *  Setting the 'mode' of the object dictates which one
     *  of these destinations will receive events.
     *
     * @class EventArbiter
     * @constructor
     *
     * @param {number | string} startMode initial setting of switch,
     */
    function EventArbiter(startMode) {
        this.dispatchers = {};
        this.currMode = undefined;
        this.setMode(startMode);
    };

    /**
     * Set switch to this mode, passing events to the corresopnding
     *   EventHandler.  If mode has changed, emits 'unpipe'
     *   event to the  old mode's handler and a 'pipe' event and 'change'
     *   event to the new mode's handler, passing along object {from: startMode, to: endMode}.
     *
     * @method setMode
     *
     * @param {string | number} mode indicating which event handler to send to.
     */
    EventArbiter.prototype.setMode = function(mode) {
        if(mode != this.currMode) {
            var startMode = this.currMode;
            if(this.dispatchers[this.currMode]) this.dispatchers[this.currMode].emit('unpipe');
            this.currMode = mode;
            if(this.dispatchers[mode]) this.dispatchers[mode].emit('pipe');
            this.emit('change', {from: startMode, to: mode});
        }
    };

    /**
     * Return the existing EventHandler corresponding to this
     *   mode, creating one if it doesn't exist.
     *
     * @method forMode
     *
     * @param {string | number} mode mode to which this eventHandler corresponds
     *
     * @return {EventHandler} eventHandler behind this mode's "switch"
     */
    EventArbiter.prototype.forMode = function(mode) {
        if(!this.dispatchers[mode]) this.dispatchers[mode] = new EventHandler();
        return this.dispatchers[mode];
    };

    /**
     * Send event to currently selected handler.
     *
     * @method emit
     *
     * @param {string} eventType
     * @param {object} event
     *
     * @return {boolean} true if the event was handled by at a leaf handler.
     */
    EventArbiter.prototype.emit = function(eventType, event) {
        if(this.currMode == undefined) return false;
        if(!event) event = {};
        var dispatcher = this.dispatchers[this.currMode];
        if(dispatcher) return dispatcher.emit(eventType, event);
    };

    module.exports = EventArbiter;
});
