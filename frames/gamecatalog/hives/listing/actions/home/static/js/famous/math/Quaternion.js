/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var Matrix = require('./Matrix');

    /**
     * @constructor
     */
    function Quaternion(w,x,y,z){
        if (arguments.length === 1) this.set(w)
        else{
            this.w = (w !== undefined) ? w : 1;  //Angle
            this.x = (x !== undefined) ? x : 0;  //Axis.x
            this.y = (y !== undefined) ? y : 0;  //Axis.y
            this.z = (z !== undefined) ? z : 0;  //Axis.z
        };
        return this;
    };

    var register = new Quaternion(1,0,0,0);

    Quaternion.prototype.add = function(q){
        return register.setWXYZ(
            this.w + q.w,
            this.x + q.x,
            this.y + q.y,
            this.z + q.z
        );
    };

    Quaternion.prototype.sub = function(q){
        return register.setWXYZ(
            this.w - q.w,
            this.x - q.x,
            this.y - q.y,
            this.z - q.z
        );
    };

    Quaternion.prototype.scalarDivide = function(s){
        return this.scalarMultiply(1/s);
    };

    Quaternion.prototype.scalarMultiply = function(s){
        return register.setWXYZ(
            this.w * s,
            this.x * s,
            this.y * s,
            this.z * s
        );
    };

    Quaternion.prototype.multiply = function(q){
        //left-handed coordinate system multiplication
        var x1 = this.x, y1 = this.y, z1 = this.z, w1 = this.w;
        var x2 = q.x, y2 = q.y, z2 = q.z, w2 = q.w || 0;
        return register.setWXYZ(
            w1*w2 - x1*x2 - y1*y2 - z1*z2,
            x1*w2 + x2*w1 + y2*z1 - y1*z2,
            y1*w2 + y2*w1 + x1*z2 - x2*z1,
            z1*w2 + z2*w1 + x2*y1 - x1*y2
        );
    };

    var conj = new Quaternion(1,0,0,0);
    Quaternion.prototype.rotateVector = function(v){
        conj.set(this.conj());
        return register.set(this.multiply(v).multiply(conj));
    };

    Quaternion.prototype.inverse = function(){
        return register.set(this.conj().scalarDivide(this.normSquared()));
    };

    Quaternion.prototype.negate = function(){
        return this.scalarMultiply(-1);
    };

    Quaternion.prototype.conj = function(){
        return register.setWXYZ(
             this.w,
            -this.x,
            -this.y,
            -this.z
        );
    };

    Quaternion.prototype.normalize = function(length){
        length = (length === undefined) ? 1 : length;
        return this.scalarDivide(length * this.norm());
    };

    Quaternion.prototype.makeFromAngleAndAxis = function(angle, v){
        //left handed quaternion creation: theta -> -theta
        var n  = v.normalize();
        var ha = angle*0.5;
        var s  = -Math.sin(ha);
        this.x = s*n.x;
        this.y = s*n.y;
        this.z = s*n.z;
        this.w = Math.cos(ha);
        return this;
    };

    Quaternion.prototype.setWXYZ = function(w,x,y,z){
        register.clear();
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    };

    Quaternion.prototype.set = function(v){
        if (v instanceof Array){
            this.w = v[0];
            this.x = v[1];
            this.y = v[2];
            this.z = v[3];
        }
        else{
            this.w = v.w;
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
        }
        if (this !== register) register.clear();
        return this;
    };

    Quaternion.prototype.put = function(q){
        q.set(register);
    };

    Quaternion.prototype.clone = function(){
        return new Quaternion(this);
    };

    Quaternion.prototype.clear = function(){
        this.w = 1;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        return this;
    };

    Quaternion.prototype.isEqual = function(q){
        return q.w == this.w && q.x == this.x && q.y == this.y && q.z == this.z;
    };

    Quaternion.prototype.dot = function(q){
        return this.w * q.w + this.x * q.x + this.y * q.y + this.z * q.z;
    };

    Quaternion.prototype.normSquared = function(){
        return this.dot(this);
    };

    Quaternion.prototype.norm = function(){
        return Math.sqrt(this.normSquared());
    };

    Quaternion.prototype.isZero = function(){
        return !(this.x || this.y || this.z);
    };

    Quaternion.prototype.getTransform = function(){
        var temp = this.normalize(1);
        var x = temp.x, y = temp.y, z = temp.z, w = temp.w;

        //LHC system flattened to column major = RHC flattened to row major
        return [
            1 - 2*y*y - 2*z*z,
                2*x*y - 2*z*w,
                2*x*z + 2*y*w,
            0,
                2*x*y + 2*z*w,
            1 - 2*x*x - 2*z*z,
                2*y*z - 2*x*w,
            0,
                2*x*z - 2*y*w,
                2*y*z + 2*x*w,
            1 - 2*x*x - 2*y*y,
            0,
            0,
            0,
            0,
            1
        ];
    };

    var matrixRegister = new Matrix();
    Quaternion.prototype.getMatrix = function(){
        var temp = this.normalize(1);
        var x = temp.x, y = temp.y, z = temp.z, w = temp.w;

        //LHC system flattened to row major
        return matrixRegister.set([
            [
                1 - 2*y*y - 2*z*z,
                    2*x*y + 2*z*w,
                    2*x*z - 2*y*w
            ],
            [
                    2*x*y - 2*z*w,
                1 - 2*x*x - 2*z*z,
                    2*y*z + 2*x*w
            ],
            [
                    2*x*z + 2*y*w,
                    2*y*z - 2*x*w,
                1 - 2*x*x - 2*y*y
            ]
        ]);
    };

    var epsilon = 1e-5;
    Quaternion.prototype.slerp = function(q, t){
        var omega, cosomega, sinomega, scaleFrom, scaleTo;
        cosomega = this.dot(q);
        if( (1.0 - cosomega) > epsilon ){
            omega       = Math.acos(cosomega);
            sinomega    = Math.sin(omega);
            scaleFrom   = Math.sin( (1.0 - t) * omega ) / sinomega;
            scaleTo     = Math.sin( t * omega ) / sinomega;
        }
        else {
            scaleFrom   = 1.0 - t;
            scaleTo     = t;
        };
        return register.set(this.scalarMultiply(scaleFrom/scaleTo).add(q).multiply(scaleTo));
    };

    module.exports = Quaternion;

});
