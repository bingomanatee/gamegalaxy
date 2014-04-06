/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var OptionsManager = require('famous/core/OptionsManager');

    /**
     * Ordinary Differential Equation (ODE) Integrator.
     * Manages updating a physics body's state over time.
     *
     *  p = position, v = velocity, m = mass, f = force, dt = change in time
     *
     *      v <- v + dt * f / m
     *      p <- p + dt * v
     *
     *  q = orientation, w = angular velocity, L = angular momentum
     *
     *      L <- L + dt * t
     *      q <- q + dt/2 * q * w
     *
     * @class SymplecticEuler
     * @constructor
     * @param {Object} options Options to set
     */
    function SymplecticEuler(options){
        this.options = Object.create(SymplecticEuler.DEFAULT_OPTIONS);
        this._optionsManager = new OptionsManager(this.options);

        if (options) this.setOptions(options);
    };

    /**
     * @property SymplecticEuler.DEFAULT_OPTIONS
     * @type Object
     * @protected
     * @static
     */
    SymplecticEuler.DEFAULT_OPTIONS = {

        /**
         * The maximum velocity of a physics body
         *      Range : [0, Infinity]
         * @attribute velocityCap
         * @type Number
         * @default Infinity
         */

        velocityCap : Infinity,

        /**
         * The maximum angular velocity of a physics body
         *      Range : [0, Infinity]
         * @attribute angularVelocityCap
         * @type Number
         * @default Infinity
         */
        angularVelocityCap : Infinity
    };

    /*
     * Setter for options
     *
     * @method setOptions
     * @param {Object} options
     */
    SymplecticEuler.prototype.setOptions = function(options){
        this._optionsManager.patch(options);
    };

    /*
     * Getter for options
     *
     * @method getOptions
     * @return {Object} options
     */
    SymplecticEuler.prototype.getOptions = function() {
        return this._optionsManager.value();
    };

    /*
     * Updates the velocity of a physics body from its accumulated force.
     *      v <- v + dt * f / m
     *
     * @method integrateVelocity
     * @param {Body} physics body
     * @param {Number} dt delta time
     */
    SymplecticEuler.prototype.integrateVelocity = function(body, dt){
        var v = body.velocity,
            w = body.inverseMass,
            f = body.force;

        if (f.isZero()) return;

        body.setVelocity(v.add(f.mult(dt * w)));
        f.clear();
    };

    /*
     * Updates the position of a physics body from its velocity.
     *      p <- p + dt * v
     *
     * @method integratePosition
     * @param {Body} physics body
     * @param {Number} dt delta time
     */
    SymplecticEuler.prototype.integratePosition = function(body, dt){
        var p = body.position,
            v = body.velocity;

        if (v.isZero()) return;

        if (this.options.velocityCap) v.set(v.cap(this.options.velocityCap));
        p.set(p.add(v.mult(dt)));
    };

    /*
     * Updates the angular momentum of a physics body from its accumuled torque.
     *      L <- L + dt * t
     *
     * @method integrateAngularMomentum
     * @param {Body} physics body (except a particle)
     * @param {Number} dt delta time
     */
    SymplecticEuler.prototype.integrateAngularMomentum = function(body, dt){
        var L = body.angularMomentum,
            t = body.torque;

        if (t.isZero()) return;

        if (this.options.angularVelocityCap) t.set(t.cap(this.options.angularVelocityCap));
        L.add(t.mult(dt)).put(L);
        t.clear();
    };

    /*
     * Updates the orientation of a physics body from its angular velocity.
     *      q <- q + dt/2 * q * w
     *
     * @method integrateOrientation
     * @param {Body} physics body (except a particle)
     * @param {Number} dt delta time
     */
    SymplecticEuler.prototype.integrateOrientation = function(body, dt){
        var q = body.orientation,
            w = body.angularVelocity;

        if (w.isZero()) return;
        q.set(q.add(q.multiply(w).scalarMultiply(0.5 * dt)));
        q.set(q.normalize());
    };

    module.exports = SymplecticEuler;
});
