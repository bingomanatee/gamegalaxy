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
     * @class Handles piped in two-finger touch events to increase or decrease scale via pinching / expanding.
     *        Outputs an object with position, velocity, touch ids, and distance.
     * @description
     * @extends TwoFingerSync
     * @name ScaleSync
     * @constructor
     * @example
     * define(function(require, exports, module) {
     *     var Engine = require('famous/core/Engine');
     *     var ScaleSync = require('famous/input/ScaleSync');
     *     var Surface = require('famous/core/Surface');
     *     var Modifier = require('famous/core/Modifier');
     *     var FM = require('famous/core/Matrix');
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
     *     var scale = 1;
     *     var sync = new ScaleSync(function(){
     *         return scale;
     *     }, {direction: ScaleSync.DIRECTION_Y});
     *
     *     surface.pipe(sync);
     *     sync.on('update', function(data) {
     *         scale = data.p;
     *         modifier.setTransform(FM.scale(scale, scale, scale));
     *         surface.setContent('scale' + scale + '<br>' + 'velocity' + data.v.toFixed(2) + '<br>' + 'distance' + data.distance);
     *     });
     *     Context.link(modifier).link(surface);
     * });
     */
    function ScaleSync(targetSync,options) {
        TwoFingerSync.call(this,targetSync,options);
        this._startDist = undefined;
        this._prevScale = undefined;
        this.input.on('pipe', _reset.bind(this));
    }

    ScaleSync.prototype = Object.create(TwoFingerSync.prototype);

    function _calcDist(posA, posB) {
        var diffX = posB[0] - posA[0];
        var diffY = posB[1] - posA[1];
        return Math.sqrt(diffX * diffX + diffY * diffY);
    }

    function _reset() {
        this.touchAId = undefined;
        this.touchBId = undefined;
    }

    ScaleSync.prototype._startUpdate = function _startUpdate(event) {
        this._prevScale = 1;
        this._startDist = _calcDist(this.posA, this.posB);
        this._vel = 0;
        this.output.emit('start', {count: event.touches.length, touches: [this.touchAId, this.touchBId], distance: this._startDist});
    };

    ScaleSync.prototype._moveUpdate = function _moveUpdate(diffTime) {
        var currDist = _calcDist(this.posA, this.posB);
        var currScale = currDist / this._startDist;
        var diffScale = currScale - this._prevScale;
        var veloScale = diffScale / diffTime;

        var prevPos = this.targetGet();
        var scale = this.options.scale;
        this.output.emit('update', {p: prevPos + scale * diffScale, v: scale * veloScale, touches: [this.touchAId, this.touchBId], distance: currDist});

        this._prevScale = currScale;
        this._vel = veloScale;
    };

    module.exports = ScaleSync;
});
