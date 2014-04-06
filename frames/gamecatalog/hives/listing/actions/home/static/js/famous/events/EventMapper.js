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
     * EventMapper routes events to various event destinations
     *  based on custom logic.
     *
     * @class EventMapper
     * @constructor
     *
     * @param {function} mapping function to determine where
     *  events are routed to
     */
    function EventMapper(mappingFunction) {
        EventHandler.call(this);
        this._mappingFunction = mappingFunction;
    }
    EventMapper.prototype = Object.create(EventHandler.prototype);
    EventMapper.prototype.constructor = EventMapper;

    EventMapper.prototype.subscribe = null;
    EventMapper.prototype.unsubscribe = null;

    /**
     * Emit determines where to send events based on the return
     *  value of it's mapping function when passed the event
     *  type and associated data.
     *
     * @method emit
     * @param {string} type name of the event
     * @param {object} data associated data
     */
    EventMapper.prototype.emit = function(type, data) {
        var target = this._mappingFunction.apply(this, arguments);
        if(target && (target.emit instanceof Function)) target.emit(type, data);
    };

    /**
     * An alias of emit. Trigger determines where to send events
     *  based on the return value of it's mapping function when
     *  passed the event type and associated data.
     *
     * @method trigger
     * @param {string} type name of the event
     * @param {object} data associated data
     */
    EventMapper.prototype.trigger = EventMapper.prototype.emit;

    module.exports = EventMapper;
});
