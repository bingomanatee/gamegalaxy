/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {

    /**
     *
     * @class ModifierChain
     *
     * @description A class to add and remove a chain of modifiers
     *   at a single point in the render tree
     *
     * @name ModifierChain
     * @constructor
     * @example
     *   var Engine        = require('famous/core/Engine');
     *   var Surface       = require('famous/core/Surface');
     *   var Modifier      = require('famous/core/Modifier');
     *   var Transform     = require('famous/core/Transform');
     *   var ModifierChain = require('famous/modifiers/ModifierChain');
     *
     *   var Context = Engine.createContext();
     *
     *   var surface = new FamousSurface({
     *       size: [200, 200],
     *       properties: { backgroundColor: '#3cf'}
     *   });
     *
     *   var m1 = new Modifier(Transform.translate(400,0,0));
     *   var m2 = new Modifier(Transform.translate(0,100,0));
     *
     *   var modifierChain = new ModifierChain(M1, M2);
     *
     *   Context.add(modifierChain).link(surface);
     *
     *   modifierChain.removeModifier(m2);
     *
     */
    function ModifierChain() {
        this._chain = [];
        if (arguments.length) this.add.apply(this, arguments);
    };

    /**
     * Add a modifier, or comma separated modifiers, to the modifier chain.
     *
     * @name Modifier#addModifier
     * @function
     *
     * @param {...Modifier}
     */
    ModifierChain.prototype.addModifier = function() {
        Array.prototype.push.apply(this._chain, arguments);
    };

    /**
     * Remove a modifier from the modifier chain.
     *
     * @name Modifier#removeModifier
     * @function
     *
     * @param {Modifier}
     */
    ModifierChain.prototype.removeModifier = function(modifier) {
        var index = this._chain.indexOf(modifier);
        if (index < 0) return;
        this._chain.splice(index, 1);
    };

    /**
     * Render a modifier chain
     *
     * @name Modifier#modify
     * @function
     *
     * @param {renderSpec}
     * @returns {renderSpec}
     */
    ModifierChain.prototype.modify = function(input){
        var chain  = this._chain;
        var result = input;
        for (var i = 0; i < chain.length; i++){
            result = chain[i].modify(result);
        }
        return result;
    };

    module.exports = ModifierChain;
});
