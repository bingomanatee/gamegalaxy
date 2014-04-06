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
     * Create a three-element floating point vector.
     *
     * @class Vector
     * @constructor
     *
     * @param {number} x x element value
     * @param {number} y y element value
     * @param {number} z z element value
     */
    function Vector(x,y,z){
        // TODO: Why is this this a fallback behavior?
        if (arguments.length === 1) this.set(x);
        else{
            this.x = x || 0.0;
            this.y = y || 0.0;
            this.z = z || 0.0;
        };
        return this;
    };

    var _register = new Vector(0,0,0);

    /**
     * Add this element-wise to another Vector, element-wise.
     *   Note: This sets the internal result register, so other references to that vector will change.
     *
     * @method add
     * @param {Vector} v addend
     * @returns {Vector} vector sum
     */
    Vector.prototype.add = function(v){
        return _register.setXYZ(
            this.x + (v.x || 0.0),
            this.y + (v.y || 0.0),
            this.z + (v.z || 0.0)
        );
    };

    /**
     * Subtract another vector from this vector, element-wise.
     *   Note: This sets the internal result register, so other references to that vector will change.
     *
     * @method sub
     * @param {Vector} v subtrahend
     * @returns {Vector} vector difference
     */
    Vector.prototype.sub = function(v){
        return _register.setXYZ(
            this.x - v.x,
            this.y - v.y,
            this.z - v.z
        );
    };

    /**
     * Scale Vector by floating point r.
     *   Note: This sets the internal result register, so other references to that vector will change.
     *
     * @method mult
     *
     * @param {number} r scalar
     * @returns {Vector} vector result
     */
    Vector.prototype.mult = function(r){
        return _register.setXYZ(
            r * this.x,
            r * this.y,
            r * this.z
        );
    };

    /**
     * Scale Vector by floating point 1/r.
     *   Note: This sets the internal result register, so other references to that vector will change.
     *
     * @method div
     *
     * @param {number} r scalar
     * @returns {Vector} vector result
     */
    Vector.prototype.div = function(r){
        return this.mult(1/r);
    };

    /**
     * Given another vector v, return cross product (v)x(this)
     *   Note: This sets the internal result register, so other references to that vector will change.
     *
     * @method cross
     * @param {Vector} v Left Hand Vector
     * @returns {Vector} vector result
     */
    Vector.prototype.cross = function(v){
        var x = this.x, y = this.y, z = this.z;
        var vx = v.x, vy = v.y, vz = v.z;
        return _register.setXYZ(
            z * vy - y * vz,
            x * vz - z * vx,
            y * vx - x * vy
        );
    };

    /**
     * Component-wise equality test between this and Vector v.
     * @method equals
     * @param {Vector} v vector to compare
     * @returns {boolean}
     */
    Vector.prototype.equals = function(v){
        return (v.x == this.x && v.y == this.y && v.z == this.z);
    };

    /**
     * Rotate clockwise around x-axis by theta radians.
     *   Note: This sets the internal result register, so other references to that vector will change.
     * @method rotateX
     * @param {number} theta radians
     * @returns {Vector} rotated vector
     */
    Vector.prototype.rotateX = function(theta){
        var x = this.x;
        var y = this.y;
        var z = this.z;

        var cosTheta = Math.cos(theta);
        var sinTheta = Math.sin(theta);

        return _register.setXYZ(
            x,
            y * cosTheta - z * sinTheta,
            y * sinTheta + z * cosTheta
        );
    };

    /**
     * Rotate clockwise around y-axis by theta radians.
     *   Note: This sets the internal result register, so other references to that vector will change.
     * @method rotateY
     * @param {number} theta radians
     * @returns {Vector} rotated vector
     */
    Vector.prototype.rotateY = function(theta, out){
        out = out || _register;
        var x = this.x;
        var y = this.y;
        var z = this.z;

        var cosTheta = Math.cos(theta);
        var sinTheta = Math.sin(theta);

        return out.setXYZ(
            z * sinTheta + x * cosTheta,
            y,
            z * cosTheta - x * sinTheta
        );
    };

    /**
     * Rotate clockwise around z-axis by theta radians.
     *   Note: This sets the internal result register, so other references to that vector will change.
     * @method rotateZ
     * @param {number} theta radians
     * @returns {Vector} rotated vector
     */
    Vector.prototype.rotateZ = function(theta){
        var x = this.x;
        var y = this.y;
        var z = this.z;

        var cosTheta = Math.cos(theta);
        var sinTheta = Math.sin(theta);

        return _register.setXYZ(
            x * cosTheta - y * sinTheta,
            x * sinTheta + y * cosTheta,
            z
        );
    };

    /**
     * Return dot product of this with a second Vector
     * @method dot
     * @param {Vector} v second vector
     * @returns {number} dot product
     */
    Vector.prototype.dot = function(v){
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };

    /**
     * Return squared length of this vector
     * @method normSquared
     * @returns {number} squared length
     */
    Vector.prototype.normSquared = function(){
        return this.dot(this);
    };

    /**
     * Return length of this vector
     * @method norm
     * @returns {number} length
     */
    Vector.prototype.norm = function(){
        return Math.sqrt(this.normSquared());
    };

    /**
     * Scale Vector to specified length.
     *   If length is less than internal tolerance, set vector to [length, 0, 0].
     *   Note: This sets the internal result register, so other references to that vector will change.
     * @name normalize
     *
     * @param {number} length target length, default 1.0
     * @returns {Vector}
     */
    Vector.prototype.normalize = function(length){
        length  = (length !== undefined) ? length : 1.0;

        var tolerance = 1e-7;
        var norm = this.norm();

        if (Math.abs(norm) > tolerance) return _register.set(this.mult(length / norm));
        else return _register.setXYZ(length, 0.0, 0.0);
    };

    /**
     * Make a separate copy of the Vector.
     *
     * @method clone
     *
     * @returns {Vector}
     */
    Vector.prototype.clone = function(){
        return new Vector(this);
    };

    /**
     * True if and only if every value is 0 (or falsy)
     *
     * @method isZero
     *
     * @returns {boolean}
     */
    Vector.prototype.isZero = function(){
        return !(this.x || this.y || this.z);
    };

    /**
     * Set the internal values from an array.
     *
     * @method setFromArray
     * @param {array} v source array
     * @returns {Vector} this
     */
    Vector.prototype.setFromArray = function(v){
        this.x = v[0];
        this.y = v[1];
        this.z = v[2] || 0.0;
        return this;
    };

    /**
     * Set this Vector to the values in the provided numbArray or Vector.
     *
     * @method set
     * @param {object} v array, Vector, or number
     * @returns {Vector} this
     */
    Vector.prototype.set = function(v){
        if (v instanceof Array){
            this.setFromArray(v);
        }
        else if (v instanceof Vector){
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
        }
        else if (typeof v == 'number') {
            this.x = v;
            this.y = 0;
            this.z = 0;
        }
        if (this !== _register) _register.clear();
        return this;
    };

    /**
     * Put result of last internal register calculation in specified output vector.
     *
     * @method put
     * @param {Vector} v destination vector
     * @returns {Vector} destination vector
     */
    Vector.prototype.put = function(v){
        v.set(_register);
    };

    /**
     * Set elements directly and clear internal register.
     *   Note: This sets clears internal result register, so other references to that vector will change.
     *
     * @method setXYZ
     * @returns {Vector} this
     */
    Vector.prototype.setXYZ = function(x,y,z){
        _register.clear();
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    };

    /**
     * Set this vector to [0,0,0]
     *
     * @method clear
     */
    Vector.prototype.clear = function(){
        this.x = 0;
        this.y = 0;
        this.z = 0;
    };

    /**
     * Scale this Vector down to specified "cap" length.
     *   If Vector shorter than cap, or cap is Infinity, do nothing.
     *   Note: This sets the internal result register, so other references to that vector will change.
     *
     * @method cap
     * @returns {Vector} capped vector
     */
    Vector.prototype.cap = function(cap){
        if (cap === Infinity) return _register.set(this);
        var norm = this.norm();
        if (norm > cap) return _register.set(this.mult(cap/norm));
        else return _register.set(this);
    };

    /**
     * Return projection of this Vector onto another.
     *   Note: This sets the internal result register, so other references to that vector will change.
     *
     * @method project
     * @param {Vector} n vector to project upon
     * @returns {Vector} projected vector
     */
    Vector.prototype.project = function(n){
        return n.mult(this.dot(n));
    };

    /**
     * Reflect this Vector across provided vector.
     *   Note: This sets the internal result register, so other references to that vector will change.
     *
     * @method reflectAcross
     * @param {Vector} n vector to reflect across
     * @returns {Vector} reflected vector
     */
    Vector.prototype.reflectAcross = function(n){
        n.set(n.normalize());
        return _register.set(this.sub(this.project(n).mult(2)));
    };

    /**
     * Convert this to three-element array.
     *
     * @method toArray
     * @returns {array<number>} three-element array
     */
    Vector.prototype.toArray = function(){
        return [this.x, this.y, this.z];
    };

    /**
     * Convert Vector to three-element array.
     *
     * @method get
     * @returns {array<number>} three-element array
     */
    Vector.prototype.get = function(){
        return this.toArray();
    };

    module.exports = Vector;

});
