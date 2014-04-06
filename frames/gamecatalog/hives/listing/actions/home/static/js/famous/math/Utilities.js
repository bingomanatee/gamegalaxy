/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

define(function(require, exports, module) {
    var Utilities = {};

    Utilities.clamp = function(value, range) {
        return Math.max(Math.min(value, range[1]), range[0]);
    };

    Utilities.length = function(array){
        var distanceSquared = 0;
        for (var i = 0; i < array.length; i++){
            distanceSquared += array[i] * array[i];
        }
        return Math.sqrt(distanceSquared);
    };

    module.exports = Utilities;
});
