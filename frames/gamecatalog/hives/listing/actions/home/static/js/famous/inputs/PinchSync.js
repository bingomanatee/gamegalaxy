/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var TwoFingerSync = require('./TwoFingerSync');

    /**
     * @class Handles piped in two-finger touch events to change position via pinching / expanding.
     *        Outputs an object with position, velocity, touch ids, and distance.
     * @description
     * @extends TwoFingerSync
     * @name ScaleSync
     * @constructor
     * @example
     * define(function(require, exports, module) {
     *     var Engine = require('famous/core/Engine');
     *     var Surface = require('famous/core/Surface');
     *     var Modifier = require('famous/core/Modifier');
     *     var FM = require('famous/core/Matrix');
     *     var PinchSync = require('famous/input/PinchSync');
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
     *     var sync = new PinchSync(function(){
     *         return position;
     *     }, {direction: PinchSync.DIRECTION_Y});
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
    function PinchSync(targetSync,options) {
        TwoFingerSync.call(this,targetSync,options);
        this._dist = undefined;
    }

    PinchSync.prototype = Object.create(TwoFingerSync.prototype);

    function _calcDist(posA, posB) {
        var diffX = posB[0] - posA[0];
        var diffY = posB[1] - posA[1];
        return Math.sqrt(diffX * diffX + diffY * diffY);
    }

    PinchSync.prototype._startUpdate = function _startUpdate(event) {
        this._dist = _calcDist(this.posA, this.posB);
        this._vel = 0;
        this.output.emit('start', {count: event.touches.length, touches: [this.touchAId, this.touchBId], distance: this._dist});
    };

    PinchSync.prototype._moveUpdate = function _moveUpdate(diffTime) {
        var currDist = _calcDist(this.posA, this.posB);
        var diffZ = currDist - this._dist;
        var veloZ = diffZ / diffTime;

        var prevPos = this.targetGet();
        var scale = this.options.scale;
        this.output.emit('update', {p: prevPos + scale * diffZ, v: scale * veloZ, touches: [this.touchAId, this.touchBId], distance: currDist});

        this._dist = currDist;
        this._vel = veloZ;
    };

    module.exports = PinchSync;
});
