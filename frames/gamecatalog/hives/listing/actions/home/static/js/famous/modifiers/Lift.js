/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var Entity = require('famous/core/Entity');
    var Modifier = require('famous/core/Modifier');
    var Transform = require('famous/core/Transform');
    var SpecParser = require('famous/core/SpecParser');

    /**
     * @class Lift
     * @description
     *  Lifts a rendernode further down the render chain to a new different parent context
     * @name Lift
     * @constructor
     * @example
     *  var lift = new Lift();
     *
     *  var surface = new Surface({size : [100,100], properties : {background : '#3cf'}});
     *
     *  var toggle = true;
     *  surface.on('click', function(){
     *      (toggle)
     *          ? lift.select(this, {duration : 500, curve : 'easeOutBounce'})
     *          : lift.deselect(this, {duration : 500, curve : 'easeIn'});
     *      toggle = !toggle;
     *  });
     *
     *  var context = Engine.createContext();
     *
     *  context
     *    .link(new Modifier(Transform.rotateZ(.1)))
     *    .link(lift)
     *    .link(new Modifier(Transform.translate(100,100)))
     *    .link(surface)
     */

    function Lift() {
        this._entityID = Entity.register(this);
        this.transition = undefined;
        this.targets = [];
        this.modifiers = [];
        this.states = [];
        this.updates = [];
    }

    var STATES = {
        ACTIVE :  1,
        RESET  :  0
    }

    Lift.prototype.select = function(target, transition, callback){
        var index = this.targets.indexOf(target);
        if (index != -1) return;
        this.transition = transition;
        this.callback = callback;
        this.targets.push(target);
        this.modifiers.push(new Modifier());
        this.states.push(STATES.ACTIVE);
        this.transition = transition;
        this.updates.push(true);
    }

    Lift.prototype.deselect = function(target, transition, callback){
        var index = this.targets.indexOf(target);
        if (index == -1) return;
        this.transition = transition;
        this.callback = callback;
        this.states[index] = STATES.RESET;
        this.updates[index] = true;
    }

    function _transitionModifier(modifier, currentSpec, targetSpec, transition, callback){
        modifier.setTransform(currentSpec.transform)
        modifier.setOpacity(currentSpec.opacity)
        modifier.setOrigin(currentSpec.origin)
        modifier.setSize(currentSpec.size)

        modifier.setTransform(targetSpec.transform, transition, callback);
        modifier.setOpacity(targetSpec.opacity, transition)
        modifier.setOrigin(targetSpec.origin, transition)
        modifier.setSize(targetSpec.size, transition)
    }

    function _applyCommit(spec, context) {
        var result = SpecParser.parse(spec);
        for(var i in result) {
            var childNode = Entity.get(i);
            var commitParams = result[i];
            commitParams.unshift(context);

            var index = this.targets.indexOf(childNode);

            if (index != -1){

                var currModifier = this.modifiers[index];
                var currState = this.states[index];

                if (this.updates[index]){
                    var lowerSpec = {
                        transform : commitParams[1],
                        opacity : commitParams[2],
                        origin : commitParams[3],
                        size : commitParams[4]
                    };

                    var upperSpec = this.upperSpec;

                    if (currState == STATES.ACTIVE){
                        _transitionModifier(currModifier, lowerSpec, upperSpec, this.transition, this.callback);
                    }
                    else{ //RESET
                        _transitionModifier(currModifier, upperSpec, lowerSpec, this.transition, function(index){
                            this.states.splice(index, 1);
                            this.targets.splice(index, 1);
                            this.modifiers.splice(index, 1);
                            this.updates.splice(index, 1);
                            if (this.callback) this.callback();
                        }.bind(this, index));
                    }

                    this.updates[index] = false;

                }

                commitParams[1] = currModifier.getTransform();

            }

            var commitResult = childNode.commit.apply(childNode, commitParams);
            if(commitResult) _applyCommit.call(this, commitResult, context);
        }

    };

    Lift.prototype.commit = function(context, upperTransform, upperOpacity, upperOrigin, upperSize) {
        //Transform.moveThen([-upperOrigin[0]*upperSize[0], -upperOrigin[1]*upperSize[1], 0], upperTransform)
        this.upperSpec = {
            transform : upperTransform,
            opacity : upperOpacity,
            origin : upperOrigin,
            size : upperSize,
            target : this.input
        };
        _applyCommit.call(this, this.upperSpec, context);
    };

    Lift.prototype.modify = function(input) {
        this.input = input;
        return this._entityID;
    };

    module.exports = Lift;
});