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
     * @class Handles piped in mousewheel events. Can be used as delegate of
     *        GenericSync.
     * @description
     * @name ScrollSync
     * @constructor
     * @example
     * define(function(require, exports, module) {
     *     var Engine = require('famous/core/Engine');
     *     var Surface = require('famous/core/Surface');
     *     var Modifier = require('famous/core/Modifier');
     *     var FM = require('famous/core/Matrix');
     *     var ScrollSync = require('famous/input/ScrollSync');
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
     *     var sync = new ScrollSync(function(){
     *         return position;
     *     }, {direction: ScrollSync.DIRECTION_Y});
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
    var FEH = require('famous/core/EventHandler');
    var FE = require('famous/core/Engine');

    function ScrollSync(targetGet, options) {
        this.targetGet = targetGet || null;

        this.options = {
            direction: undefined,
            minimumEndSpeed: Infinity,
            rails: false,
            scale: 1,
            stallTime: 50,
            lineHeight: 40
        };

        if (options) this.setOptions(options);
        else this.setOptions(this.options);

        this.input = new FEH();
        this.output = new FEH();

        FEH.setInputHandler(this, this.input);
        FEH.setOutputHandler(this, this.output);

        this._prevTime = undefined;
        this._prevVel = undefined;
        this.input.on('mousewheel', _handleMove.bind(this));
        this.input.on('wheel', _handleMove.bind(this));
        this.inProgress = false;

        this._loopBound = false;
    }

    /** @const */ ScrollSync.DIRECTION_X = 0;
    /** @const */ ScrollSync.DIRECTION_Y = 1;

    function _newFrame() {
        var now = Date.now();
        if (this.inProgress && now - this._prevTime > this.options.stallTime) {
            var pos = this.targetGet ? this.targetGet() : 0;
            this.inProgress = false;
            var finalVel = 0;
            if (Math.abs(this._prevVel) >= this.options.minimumEndSpeed) finalVel = this._prevVel;
            this.output.emit('end', {p: pos, v: finalVel, slip: true});
        }
    }

    function _handleMove(e) {
        e.preventDefault();
        if (!this.inProgress) {
            this.inProgress = true;
            this.output.emit('start', {slip: true});
            if (!this._loopBound) {
                FE.on('prerender', _newFrame.bind(this));
                this._loopBound = true;
            }
        }

        var prevTime = this._prevTime;
        var diffX = (e.wheelDeltaX !== undefined) ? e.wheelDeltaX : -e.deltaX;
        var diffY = (e.wheelDeltaY !== undefined) ? e.wheelDeltaY : -e.deltaY;

        if (e.deltaMode === 1) { // units in lines, not pixels
            diffX *= this.options.lineHeight;
            diffY *= this.options.lineHeight;
        }

        var currTime = Date.now();

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

        if (this.options.direction === ScrollSync.DIRECTION_X) {
            nextPos = prevPos + scale * diffX;
            nextVel = scale * velX;
        }
        else if (this.options.direction === ScrollSync.DIRECTION_Y) {
            nextPos = prevPos + scale * diffY;
            nextVel = scale * velY;
        }
        else {
            nextPos = [prevPos[0] + scale * diffX, prevPos[1] + scale * diffY];
            nextVel = [scale * velX, scale * velY];
        }

        this.output.emit('update', {p: nextPos, v: nextVel, slip: true});

        this._prevTime = currTime;
        this._prevVel = nextVel;
    }

    ScrollSync.prototype.getOptions = function getOptions() {
        return this.options;
    };

    ScrollSync.prototype.setOptions = function setOptions(options) {
        if (options.direction !== undefined) this.options.direction = options.direction;
        if (options.minimumEndSpeed !== undefined) this.options.minimumEndSpeed = options.minimumEndSpeed;
        if (options.rails !== undefined) this.options.rails = options.rails;
        if (options.scale !== undefined) this.options.scale = options.scale;
        if (options.stallTime !== undefined) this.options.stallTime = options.stallTime;
    };

    module.exports = ScrollSync;

});
