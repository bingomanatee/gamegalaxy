/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var FEH = require('famous/core/EventHandler');

    /**
     * @class Handles piped in mouse drag events. Outputs an object with two
     *        properties, position and velocity.
     * @description
     * @name MouseSync
     * @constructor
     * @example
     * define(function(require, exports, module) {
     *     var Engine = require('famous/core/Engine');
     *     var Surface = require('famous/core/Surface');
     *     var Modifier = require('famous/core/Modifier');
     *     var FM = require('famous/core/Matrix');
     *     var MouseSync = require('famous/inputs/MouseSync');
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
     *     var sync = new MouseSync(function(){
     *         return position;
     *     }, {direction: MouseSync.DIRECTION_Y});
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
    function MouseSync(targetGet, options) {
        this.targetGet = targetGet || null;

        this.options =  {
            direction: undefined,
            rails: false,
            scale: 1,
            stallTime: 50,
            propogate: true           //events piped to document on mouseleave
        };

        if (options) this.setOptions(options);
        else this.setOptions(this.options);

        this.input = new FEH();
        this.output = new FEH();

        FEH.setInputHandler(this, this.input);
        FEH.setOutputHandler(this, this.output);

        this._prevCoord = undefined;
        this._prevTime = undefined;
        this._prevVel = undefined;

        this.input.on('mousedown', _handleStart.bind(this));
        this.input.on('mousemove', _handleMove.bind(this));
        this.input.on('mouseup', _handleEnd.bind(this));

        if (this.options.propogate) this.input.on('mouseleave', _handleLeave.bind(this));
        else this.input.on('mouseleave', _handleEnd.bind(this));
    }

    /** @const */ MouseSync.DIRECTION_X = 0;
    /** @const */ MouseSync.DIRECTION_Y = 1;

    function _handleStart(e) {
        e.preventDefault(); // prevent drag
        this._prevCoord = [e.clientX, e.clientY];
        this._prevTime = Date.now();
        this._prevVel = (this.options.direction !== undefined) ? 0 : [0, 0];
        this.output.emit('start');
    }

    function _handleMove(e) {
        if (!this._prevCoord) return;

        var prevCoord = this._prevCoord;
        var prevTime = this._prevTime;
        var currCoord = [e.clientX, e.clientY];

        var currTime = Date.now();

        var diffX = currCoord[0] - prevCoord[0];
        var diffY = currCoord[1] - prevCoord[1];

        if (this.options.rails) {
            if (Math.abs(diffX) > Math.abs(diffY)) diffY = 0;
            else diffX = 0;
        }

        var diffTime = Math.max(currTime - prevTime, 8); // minimum tick time

        var velX = diffX / diffTime;
        var velY = diffY / diffTime;

        var prevPos = this.targetGet ? this.targetGet() : 0;
        var scale = this.options.scale;
        var nextPos;
        var nextVel;

        if (this.options.direction === MouseSync.DIRECTION_X) {
            nextPos = prevPos + scale * diffX;
            nextVel = scale * velX;
        }
        else if (this.options.direction === MouseSync.DIRECTION_Y) {
            nextPos = prevPos + scale * diffY;
            nextVel = scale * velY;
        }
        else {
            nextPos = [prevPos[0] + scale * diffX, prevPos[1] + scale * diffY];
            nextVel = [scale * velX, scale * velY];
        }

        this.output.emit('update', {p: nextPos, v: nextVel});

        this._prevCoord = currCoord;
        this._prevTime = currTime;
        this._prevVel = nextVel;
    }

    function _handleEnd() {
        if (!this._prevCoord) return;

        var prevTime = this._prevTime;
        var currTime = Date.now();

        if (currTime - prevTime > this.options.stallTime) this._prevVel = (this.options.direction === undefined) ? [0, 0] : 0;

        var pos = this.targetGet();

        this.output.emit('end', {p: pos, v: this._prevVel});

        this._prevCoord = undefined;
        this._prevTime = undefined;
        this._prevVel = undefined;
    }

    function _handleLeave() {
        if (!this._prevCoord) return;

        var boundMove = _handleMove.bind(this);
        var boundEnd = function(e) {
            _handleEnd.call(this, e);
            document.removeEventListener('mousemove', boundMove);
            document.removeEventListener('mouseup', boundEnd);
        }.bind(this);

        document.addEventListener('mousemove', boundMove);
        document.addEventListener('mouseup', boundEnd);
    }

    MouseSync.prototype.getOptions = function getOptions() {
        return this.options;
    };

    MouseSync.prototype.setOptions = function setOptions(options) {
        if (options.direction !== undefined) this.options.direction = options.direction;
        if (options.rails !== undefined) this.options.rails = options.rails;
        if (options.scale !== undefined) this.options.scale = options.scale;
        if (options.stallTime !== undefined) this.options.stallTime = options.stallTime;
        if (options.propogate !== undefined) this.options.propogate = options.propogate;
    };

    module.exports = MouseSync;
});
