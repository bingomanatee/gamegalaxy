/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var EventHandler = require('./EventHandler');
    var OptionsManager = require('./OptionsManager');
    var RenderNode = require('./RenderNode');

    /**
     *  Consists of a render node paired with an input event handler (this._eventInput) and an
     *  output event handler (this._eventOutput). Useful for quickly creating elements within applications
     *  with large event systems.
     *
     * @class View
     * @method View
     * @uses EventHandler
     * @uses OptionsManager
     * @uses RenderNode
     * @constructor
     */
    function View(options) {
        this._node = new RenderNode();

        this._eventInput = new EventHandler();
        this._eventOutput = new EventHandler();
        EventHandler.setInputHandler(this, this._eventInput);
        EventHandler.setOutputHandler(this, this._eventOutput);

        this.options = Object.create(this.constructor.DEFAULT_OPTIONS || View.DEFAULT_OPTIONS);
        this._optionsManager = new OptionsManager(this.options);

        if (options) this.setOptions(options);
    }

    View.DEFAULT_OPTIONS = {}; // no defaults

    /**
     * @method getOptions
     */
    View.prototype.getOptions = function getOptions() {
        return this._optionsManager.value();
    };

    /*
     *  Set the options managed by the internal options manager.
     *  No defaults options are set in View.
     *
     *  @method setOptions
     *  @param {Object} options
     */
    View.prototype.setOptions = function setOptions(options) {
        this._optionsManager.patch(options);
    };

    /**
     * Add a child renderable to the view.
     * Delegates to a RenderNode.
     *    Note: Meant to be used by an inheriting class
     * @method _add
     * @return {RenderNode}
     * @protected
     */
    View.prototype._add = function _add() {
        return this._node.add.apply(this._node, arguments);
    };

    /**
     * Alias for "_add()"
     * @method add
     */
    View.prototype.add = View.prototype._add;

    /**
     * Generate a render spec from the contents of this component.
     * Delegates to a RenderNode.
     *
     * @private
     * @method render
     * @return {number} Render spec for this component
     */
    View.prototype.render =  function() {
        return this._node.render.apply(this._node, arguments);
    };


    /**
     * Return size of contained element.
     *
     * @method getSize
     * @return {Array.Number} [width, height]
     */
    View.prototype.getSize = function getSize() {
        if (this._node && this._node.getSize) {
            return this._node.getSize.apply(this._node, arguments) || this.options.size;
        }
        else return this.options.size;
    };

    module.exports = View;
});
