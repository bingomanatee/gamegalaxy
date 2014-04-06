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
    var Spring = require('famous/physics/constraints/Snap');
    var Vector = require('famous/math/Vector');

    /** @constructor */
    function StiffSpringTransition(state){
        state = state || 0;

        this.endState  = new Vector(state);
        this.initState = new Vector();

        this._dimensions       = 1;
        this._restTolerance    = 1e-10;
        this._absRestTolerance = this._restTolerance;
        this._callback         = undefined;

        this.PE       = new PE();
        this.particle = new Particle();
        this.spring   = new Spring({anchor : this.endState});

        this.PE.addBody(this.particle);
        this.PE.attach(this.spring, this.particle);
    }

    StiffSpringTransition.SUPPORTS_MULTIPLE = 3;
    StiffSpringTransition.DEFAULT_OPTIONS = {
        period       : 300,
        dampingRatio : 0.5,
        velocity     : 0
    };

    function _update(){
        if (this.PE.isSleeping()){
            if (this._callback) {
                var cb = this._callback;
                this._callback = undefined;
                cb();
            }
            return;
        }

        if (_getEnergy.call(this) < this._absRestTolerance) {
            _setParticlePosition.call(this, this.endState);
            _setParticleVelocity.call(this, [0,0,0]);
            _sleep.call(this);
        }
    }

    function _getEnergy(){
        return this.particle.getEnergy() + this.spring.getEnergy(this.particle);
    }

    function _setupDefinition(def){
        var defaults = StiffSpringTransition.DEFAULT_OPTIONS;
        if (def.period === undefined)       def.period       = defaults.period;
        if (def.dampingRatio === undefined) def.dampingRatio = defaults.dampingRatio;
        if (def.velocity === undefined)     def.velocity     = defaults.velocity;

        //setup spring
        this.spring.setOptions({
            period       : def.period,
            dampingRatio : def.dampingRatio
        });

        //setup particle
        _setParticleVelocity.call(this, def.velocity);
    }

    function _setAbsoluteRestTolerance(){
        var distance = this.endState.sub(this.initState).normSquared();
        this._absRestTolerance = (distance === 0)
            ? this._restTolerance
            : this._restTolerance * distance;
    }

    function _setTarget(target){
        this.endState.set(target);
        _setAbsoluteRestTolerance.call(this);
    }

    function _wake(){
        this.PE.wake();
    }

    function _sleep(){
        this.PE.sleep();
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

    StiffSpringTransition.prototype.reset = function(pos, vel){
        this._dimensions = (pos instanceof Array)
            ? pos.length
            : 0;

        this.initState.set(pos);
        _setParticlePosition.call(this, pos);
        _setTarget.call(this, pos);
        if (vel) _setParticleVelocity.call(this, vel);
        _setCallback.call(this, undefined);
    };

    StiffSpringTransition.prototype.getVelocity = function(){
        return _getParticleVelocity.call(this);
    };

    StiffSpringTransition.prototype.setVelocity = function(v){
        this.call(this, _setParticleVelocity(v));
    };

    StiffSpringTransition.prototype.halt = function(){
        this.set(this.get());
    };

    StiffSpringTransition.prototype.get = function(){
        _update.call(this);
        return _getParticlePosition.call(this);
    };

    StiffSpringTransition.prototype.set = function(endState, definition, callback){
        if (!definition){
            this.reset(endState)
            if (callback) callback();
            return;
        }

        this._dimensions = (endState instanceof Array)
            ? endState.length
            : 0;

        _wake.call(this);
        _setupDefinition.call(this, definition);
        _setTarget.call(this, endState);
        _setCallback.call(this, callback);
    };

    module.exports = StiffSpringTransition;
});
