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
     *  A famo.us surface in the form of an HTML input element.
     *
     *  @class InputSurface
     *  @constructor
     */
    function InputSurface(options) {
        this._placeholder = options.placeholder || '';
        this._value       = options.value || '';
        this._type        = options.type || 'text';
        this._name        = options.name || '';

        Surface.apply(this, arguments);
        this.on('click', this.focus.bind(this));
    }
    InputSurface.prototype = Object.create(Surface.prototype);
    InputSurface.prototype.constructor = InputSurface;

    InputSurface.prototype.elementType = 'input';
    InputSurface.prototype.elementClass = 'famous-surface';

    /**
     * Triggers a repaint next tick.
     *
     * @method setPlaceholder
     * @param {string} Value to set the html placeholder to.
     * @returns this, allowing method chaining.
     */
    InputSurface.prototype.setPlaceholder = function(str) {
        this._placeholder = str;
        this._contentDirty = true;
        return this;
    };

    /**
     * Focus on the current input, pulling up the keyboard on mobile.
     *
     * @method focus
     * @returns this, allowing method chaining.
     */
    InputSurface.prototype.focus = function() {
        if (this._currTarget) this._currTarget.focus();
        return this;
    };

    /**
     * Blur the current input, hiding the keyboard on mobile.
     *
     * @method focus
     * @returns this, allowing method chaining.
     */
    InputSurface.prototype.blur = function() {
        if (this._currTarget) this._currTarget.blur();
        return this;
    };



    /**
     * Triggers a repaint next tick.
     *
     * @method setValue
     * @param {string} Value to set the main input value to.
     * @returns this allowing method chaining.
     */
    InputSurface.prototype.setValue = function(str) {
        this._value = str;
        this._contentDirty = true;
        return this;
    };

    /**
     * Triggers a repaint next tick.
     *
     * @method setType
     * @param {string} Set the type of the input surface.
     * @returns this allowing method chaining.
     */
    InputSurface.prototype.setType = function(str) {
        this._type = str;
        this._contentDirty = true;
        return this;
    };

    /**
     * @method getValue
     * @returns {string} value of current input.
     */
    InputSurface.prototype.getValue = function() {
        if (this._currTarget) {
            return this._currTarget.value;
        }
        else {
            return this._value;
        }
    };

    /**
     * Triggers a repaint next tick.
     *
     * @method setName
     * @param {string} Set the name of the input surface.
     * @returns this, allowing method chaining.
     */
    InputSurface.prototype.setName = function(str) {
        this._name = str;
        this._contentDirty = true;
        return this;
    };

    /**
     * @method getName
     * @returns {string} name of current input.
     */
    InputSurface.prototype.getName = function() {
        return this._name;
    };

    /**
     * Sets the placeholder, value and type of the input.
     *
     * @method deploy
     */
    InputSurface.prototype.deploy = function(target) {
        if (this._placeholder !== '') target.placeholder = this._placeholder;
        target.value = this._value;
        target.type = this._type;
        target.name = this._name;
    };

    module.exports = InputSurface;
});
