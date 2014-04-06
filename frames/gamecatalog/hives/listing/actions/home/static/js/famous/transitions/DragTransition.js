/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var PE = require('famous/physics/PhysicsEngine');
    var Particle = require('famous/physics/bodies/Particle');
    var Drag = require('famous/physics/forces/Drag');

    /** @constructor */
    function DragTransition(state){
        this.drag = new Drag({strength : DragTransition.DEFAULT_OPTIONS.strength});
        this.PE = new PE();
        this.particle = new Particle();

        this.PE.addBody(this.particle);
        this.PE.attach(this.drag, this.particle);

        this._dimensions = undefined;
        this._callback = undefined;
        this._restTolerance = 1e-8;

        _setTarget.call(this, state || 0);
    }

    DragTransition.SUPPORTS_MULTIPLE = 3;
    DragTransition.DEFAULT_OPTIONS = {
        strength : 0.01,
        velocity : 0
    }

    function _update(){
        if (this.PE.isSleeping()){
            if (this._callback) {
                var cb = this._callback;
                this._callback = undefined;
                cb();
            }
            return;
        };

        var energy = _getEnergy.call(this);
        if (energy < this._restTolerance) {
            _sleep.call(this);
            _setParticleVelocity.call(this, [0,0,0]);
        };
    }

    function _getEnergy(){
        return this.particle.getEnergy();
    }

    function _setupDefinition(def){
        var defaults = DragTransition.DEFAULT_OPTIONS;
        if (def.strength === undefined) def.strength = defaults.strength;

        this.drag.setOptions({strength : def.strength});

        //setup particle
        _setParticleVelocity.call(this, def.velocity);
    }

    function _wake(){
        this.PE.wake();
    }

    function _sleep(){
        this.PE.sleep();
    }

    function _setTarget(state){
        _setParticlePosition.call(this, state);
    }

    function _setParticlePosition(p){
        this.particle.position.set(p);
    }

    function _setParticleVelocity(v){
        this.particle.velocity.set(v);
    }

    function _getParticlePosition(){
        var p = this.particle.getPosition(); //vector
        return (this._dimensions === 0)
            ? p.x
            : p.get();
    }

    function _getParticleVelocity(){
        var v = this.particle.getVelocity(); //vector
        return (this._dimensions === 0)
            ? v.x
            : v.get();
    }

    function _setCallback(callback){
        this._callback = callback;
    }

    DragTransition.prototype.reset = function(state, velocity){
        if (state instanceof Array) this._dimensions = state.length;
        else this._dimensions = 1;

        if (velocity !== undefined) _setParticleVelocity.call(this, velocity);
        _setTarget.call(this, state);
        _setCallback.call(this, undefined);
    }

    DragTransition.prototype.getVelocity = function(){
        return _getParticleVelocity.call(this);
    }

    DragTransition.prototype.halt = function(){
        this.set(this.get());
    }

    DragTransition.prototype.get = function(){
        _update.call(this);
        return _getParticlePosition.call(this);
    }

    DragTransition.prototype.set = function(state, definition, callback){
        if (!definition){
            this.reset(state)
            if (callback) callback();
            return;
        };

        if (state instanceof Array) this._dimensions = state.length;
        else this._dimensions = 1;

        _wake.call(this);
        _setupDefinition.call(this, definition);
        _setTarget.call(this, state);
        _setCallback.call(this, callback);
    }

    module.exports = DragTransition;
});
