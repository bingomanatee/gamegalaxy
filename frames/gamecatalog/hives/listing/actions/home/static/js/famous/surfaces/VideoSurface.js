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
     * Creates a famous surface containing video content. Currently adding
     * controls and manipulating the video are not supported through the
     * surface interface, but can be accomplished via standard javascript
     * manipulation of the video DOM element.
     *
     * @class VideoSurface
     *
     * @name VideoSurface
     * @extends Surface
     * @constructor
     */
    function VideoSurface(options) {
        this._videoUrl = undefined;
        this.options = Object.create(VideoSurface.DEFAULT_OPTIONS);
        if (options) this.setOptions(options);

        Surface.apply(this, arguments);
    }
    VideoSurface.prototype = Object.create(Surface.prototype);
    VideoSurface.prototype.constructor = VideoSurface;

    VideoSurface.DEFAULT_OPTIONS = {
        autoplay: false
    };

    VideoSurface.prototype.elementType = 'video';
    VideoSurface.prototype.elementClass = 'famous-surface';

    /**
     * @method setOptions
     */
    VideoSurface.prototype.setOptions = function(options) {
        for (var key in VideoSurface.DEFAULT_OPTIONS) {
            if(options[key] !== undefined) this.options[key] = options[key];
        }
    };

    /**
     * @method setContent
     */
    VideoSurface.prototype.setContent = function(videoUrl) {
        this._videoUrl = videoUrl;
        this._contentDirty = true;
    };

    /**
     * @method deploy
     */
    VideoSurface.prototype.deploy = function(target) {
        target.src = this._videoUrl;
        target.autoplay = this.options.autoplay;
    };

    /**
     * @method recall
     */
    VideoSurface.prototype.recall = function(target) {
        target.src = '';
    };

    module.exports = VideoSurface;
});

