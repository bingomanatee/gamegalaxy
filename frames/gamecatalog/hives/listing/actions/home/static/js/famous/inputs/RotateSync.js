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
     * @class Handles piped in two-finger touch events to support rotation.
     *        Outputs an object with position, velocity, touch ids, and angle.
     * @description
     * @extends TwoFingerSync
     * @name RotateSync
     * @constructor
     * @example
     * define(function(require, exports, module) {
     *     var Engine = require('famous/core/Engine');
     *     var RotateSync = require('famous/input/RotateSync');
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
     *     var position = 0;
     *     var sync = new RotateSync(function(){
     *         return position;
     *     }, {direction: RotateSync.DIRECTION_Y});
     *
     *     surface.pipe(sync);
     *     sync.on('update', function(data) {
     *         position = data.p;
     *         modifier.setTransform(FM.rotateZ(position));
     *         surface.setContent('position' + position + '<br>' + 'velocity' + data.v.toFixed(2) + '<br>' + 'distance' + data.distance);
     *     });
     *     Context.link(modifier).link(surface);
     * });
     */
    function RotateSync(targetSync,options) {
        TwoFingerSync.call(this,targetSync,options);
        this._angle = undefined;
    }

    RotateSync.prototype = Object.create(TwoFingerSync.prototype);

    function _calcAngle(posA, posB) {
        var diffX = posB[0] - posA[0];
        var diffY = posB[1] - posA[1];
        return Math.atan2(diffY, diffX);
    }

    RotateSync.prototype._startUpdate = function _startUpdate(event) {
        this._angle = _calcAngle(this.posA, this.posB);
        this._vel = 0;
        this.output.emit('start', {count: event.touches.length, touches: [this.touchAId, this.touchBId], angle: this._angle});
    };

    RotateSync.prototype._moveUpdate = function _moveUpdate(diffTime) {
        var currAngle = _calcAngle(this.posA, this.posB);
        var diffTheta = currAngle - this._angle;
        var velTheta = diffTheta / diffTime;

        var prevPos = this.targetGet();
        var scale = this.options.scale;
        this.output.emit('update', {p: prevPos + scale * diffTheta, v: scale * velTheta, touches: [this.touchAId, this.touchBId], angle: currAngle});

        this._angle = currAngle;
        this._vel = velTheta;
    };

    module.exports = RotateSync;
});
