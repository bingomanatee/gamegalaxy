/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var Surface = require('famous/core/Surface');

    /**
     * A surface containing an HTML5 Canvas element.  Currently unstable (TODO).
     *
     * @class CanvasSurface
     * @constructor
     * @name CanvasSurface
     * @extends Surface
     */
    function CanvasSurface(options) {
        if(options && options.canvasSize) this._canvasSize = options.canvasSize;
        Surface.apply(this, arguments);
        if(!this._canvasSize) this._canvasSize = this.getSize();
        this._backBuffer = document.createElement('canvas');
        if(this._canvasSize) {
            this._backBuffer.width = this._canvasSize[0];
            this._backBuffer.height = this._canvasSize[1];
        }
        this._contextId = undefined;
    }

    CanvasSurface.prototype = Object.create(Surface.prototype);
    CanvasSurface.prototype.constructor = CanvasSurface;
    CanvasSurface.prototype.elementType = 'canvas';
    CanvasSurface.prototype.elementClass = 'famous-surface';

    /**
     *  @method setContent
     */
    CanvasSurface.prototype.setContent = function() {};

    /**
     *  @method deploy
     *  @param {DOMElement} target
     */
    CanvasSurface.prototype.deploy = function(target) {
        if(this._canvasSize) {
            target.width = this._canvasSize[0];
            target.height = this._canvasSize[1];
        }
        if(this._contextId === '2d') {
            target.getContext(this._contextId).drawImage(this._backBuffer, 0, 0);
            this._backBuffer.width = 0;
            this._backBuffer.height = 0;
        }
    };

    /**
     *  @method recall
     */
    CanvasSurface.prototype.recall = function(target) {
        var size = this.getSize();

        this._backBuffer.width = target.width;
        this._backBuffer.height = target.height;

        if(this._contextId === '2d') {
            this._backBuffer.getContext(this._contextId).drawImage(target, 0, 0);
            target.width = 0;
            target.height = 0;
        }
    };

    /**
     * Returns the canvas element's context
     *
     * @method getContext
     * @param {string} contextId context identifier
     */
    CanvasSurface.prototype.getContext = function(contextId) {
        this._contextId = contextId;
        return this._currTarget ? this._currTarget.getContext(contextId) : this._backBuffer.getContext(contextId);
    };
    /**
     *  Set the size of the surface and canvas element.
     *  @method setSize
     *  @param {Array.number} size [width, height] of surface
     *  @param {Array.number} canvasSize [width, height] of canvas surface
     */
    CanvasSurface.prototype.setSize = function(size, canvasSize) {
        Surface.prototype.setSize.apply(this, arguments);
        if(canvasSize) this._canvasSize = [canvasSize[0], canvasSize[1]];
        if(this._currTarget) {
            this._currTarget.width = this._canvasSize[0];
            this._currTarget.height = this._canvasSize[1];
        }
    };

    module.exports = CanvasSurface;
});

