/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var Vector = require('famous/math/Vector');
    var Transform = require('famous/core/Transform');
    var EventHandler = require('famous/core/EventHandler');
    var Integrator = require('../integrators/SymplecticEuler');

    /**
     * A point body that is controlled by the Physics Engine. A particle has
     * position and velocity states that are updated by the Physics Engine.
     * Ultimately, a particle is a _special type of modifier, and can be added to
     * the Famous render tree like any other modifier.
     *
     * @constructor
     * @class Particle
     * @uses EventHandler
     * @uses Modifier
     * @extensionfor Body
     */
     function Particle(options){
        options = options || {};

        // registers
        this.position = new Vector();
        this.velocity = new Vector();
        this.force    = new Vector();

        var defaults  = Particle.DEFAULT_OPTIONS;

        // set vectors
        this.setPosition(options.position || defaults.position);
        this.setVelocity(options.velocity || defaults.velocity);
        this.force.set(options.force || [0,0,0]);

        // set scalars
        this.mass = (options.mass !== undefined)
            ? options.mass
            : defaults.mass;

        this.axis = (options.axis !== undefined)
            ? options.axis
            : defaults.axis;

        this.inverseMass = 1 / this.mass;

        // state variables
        this._isSleeping     = false;
        this._engine         = null;
        this._eventOutput    = null;
        this._positionGetter = null;
        this._velocityGetter = null;

        // cached _spec
        this._spec = {
            transform : Transform.identity,
            target    : null
        };
    };

    /**
     * @property Particle.DEFAULT_OPTIONS
     * @type Object
     * @protected
     * @static
     */
    Particle.DEFAULT_OPTIONS = {

        /**
         * The position of the particle
         * @attribute position
         * @type Array
         */
        position : [0,0,0],

        /**
         * The velocity of the particle
         * @attribute velocity
         * @type Array
         */
        velocity : [0,0,0],

        /**
         * The mass of the particle
         * @attribute mass
         * @type Number
         */
        mass : 1,

        /**
         * The axis a particle can move along. Can be bitwise ORed
         *    e.g., Particle.AXES.X, Particle.AXES.X | Particle.AXES.Y
         * @attribute axis
         * @type Hexadecimal
         */
        axis : undefined
    };


    /**
     * Kinetic energy threshold needed to update the body
     *
     * @property SLEEP_TOLERANCE
     * @type Number
     * @static
     * @default 1e-7
     */
    Particle.SLEEP_TOLERANCE = 1e-7;

    /**
     * Axes by which a body can translate
     *
     * @property AXES
     * @type Hexadecimal
     * @static
     * @default 1e-7
     */
    Particle.AXES = {
        X : 0x0001, // hexadecimal for 1
        Y : 0x0002, // hexadecimal for 2
        Z : 0x0004  // hexadecimal for 4
    };

    // Integrator for updating the particle's state
    Particle.INTEGRATOR = new Integrator();

    //Catalogue of outputted events
    var _events = {
        start  : 'start',
        update : 'update',
        end    : 'end'
    };

    // Cached timing function
    var now = (function(){ return Date.now; })();

    Particle.prototype.sleep = function(){
        if (this._isSleeping) return;
        this.emit(_events.end, this);
        this._isSleeping = true;
    };

    Particle.prototype.wake = function(){
        if (!this._isSleeping) return;
        this.emit(_events.start, this);
        this._isSleeping = false;
        this._prevTime = now();
    };

    /**
     * @attribute isBody
     * @type Boolean
     * @static
     */
    Particle.prototype.isBody = false;

    /**
     * @attribute Curve.DEFAULT_OPTIONS
     * @type Object
     * @protected
     * @static
     */
    Particle.prototype.setPosition = function(p){
        this.position.set(p);
    };

    /**
     * Basic getter function for position Vector
     * @name Particle#getPos
     * @function
     */
    Particle.prototype.getPosition = function(){
        if (this._positionGetter instanceof Function)
            this.setPosition(this._positionGetter());

        if (this._engine) this._engine.step();
        else              this.step();

        return this.position;
    };

    Particle.prototype.positionFrom = function(_positionGetter){
        this._positionGetter = _positionGetter;
    };

    /**
     * Basic setter function for velocity Vector
     * @name Particle#setVel
     * @function
     */
    Particle.prototype.setVelocity = function(v){
        this.velocity.set(v);
        this.wake();
    };

    /**
     * Basic getter function for velocity Vector
     * @name Particle#getVel
     * @function
     */
    Particle.prototype.getVelocity = function(){
        if (this._velocityGetter) this.setVelocity(this._velocityGetter());
        return this.velocity;
    };

    Particle.prototype.velocityFrom = function(_velocityGetter){
        this._velocityGetter = _velocityGetter;
    };

    /**
     * Basic setter function for mass quantity
     * @name Particle#setMass
     * @function
     */
    Particle.prototype.setMass = function(m){
        this.mass = m;
        this.inverseMass = 1 / m;
    };

    /**
     * Basic getter function for mass quantity
     * @name Particle#getMass
     * @function
     */
    Particle.prototype.getMass = function(){
        return this.mass;
    };

    /**
     * Set position, velocity, force, and accel Vectors each to (0, 0, 0)
     * @name Particle#reset
     * @function
     */
    Particle.prototype.reset = function(p,v){
        p = p || [0,0,0];
        v = v || [0,0,0];
        this.setPosition(p);
        this.setVelocity(v);
    };

    /**
     * Add force Vector to existing internal force Vector
     * @name Particle#applyForce
     * @function
     */
    Particle.prototype.applyForce = function(force){
        if (force.isZero()) return;
        this.force.set(this.force.add(force));
        this.wake();
    };

    /**
     * Add impulse (force*time) Vector to this Vector's velocity.
     * @name Particle#applyImpulse
     * @function
     */
    Particle.prototype.applyImpulse = function(impulse){
        if (impulse.isZero()) return;
        this.setVelocity(this.velocity.add(impulse.mult(this.inverseMass)));
    };

    Particle.prototype.integrateVelocity = function(dt){
        Particle.INTEGRATOR.integrateVelocity(this, dt);
    };

    Particle.prototype.integratePosition = function(dt){
        Particle.INTEGRATOR.integratePosition(this, dt);
    };

    Particle.prototype._integrate = function(dt){
        this.integrateVelocity(dt);
        this.integratePosition(dt);
    };

    Particle.prototype.step = function(){
        if (this.getEnergy() < Particle.SLEEP_TOLERANCE){
            this.sleep();
            return;
        };

        if (!this._prevTime) this._prevTime = now();

        var _currTime = now();
        var dtFrame = _currTime - this._prevTime;
        this._prevTime = _currTime;
        if (dtFrame < 8) return;
        this._integrate.call(this, dtFrame);
        this.emit(_events.update, this);
    };

    /**
     * Get kinetic energy of the particle.
     * @name Particle#getEnergy
     * @function
     */
    Particle.prototype.getEnergy = function(){
        return 0.5 * this.mass * this.velocity.normSquared();
    };

    /**
     * Generate current positional transform from position (calculated)
     *   and rotation (provided only at construction time)
     * @name Particle#getTransform
     * @function
     */
    Particle.prototype.getTransform = function(){
        var p    = this.getPosition();
        var axis = this.axis;

        if (axis !== undefined){
            if (axis & ~Particle.AXES.X) {p.x = 0};
            if (axis & ~Particle.AXES.Y) {p.y = 0};
            if (axis & ~Particle.AXES.Z) {p.z = 0};
        };

        return Transform.translate(p.x, p.y, p.z);
    };

    Particle.prototype.modify = function(target){
        var _spec = this._spec;
        _spec.transform = this.getTransform();
        _spec.target = target;
        return _spec;
    };

    Particle.prototype.emit = function(type, data){
        if (!this._eventOutput) return;
        this._eventOutput.emit(type, data);
    };

    function _createEventOutput() {
        if (!this._eventOutput) return;
        this._eventOutput = new EventHandler();
        this._eventOutput.bindThis(this);
        EventHandler.setOutputHandler(this, this._eventOutput);
    }

    Particle.prototype.on = function() { _createEventOutput.call(this); return this.on.apply(this, arguments); };
    Particle.prototype.removeListener = function() { _createEventOutput.call(this); return this.removeListener.apply(this, arguments); };
    Particle.prototype.pipe = function() { _createEventOutput.call(this); return this.pipe.apply(this, arguments); };
    Particle.prototype.unpipe = function() { _createEventOutput.call(this); return this.unpipe.apply(this, arguments) };

    module.exports = Particle;
});
