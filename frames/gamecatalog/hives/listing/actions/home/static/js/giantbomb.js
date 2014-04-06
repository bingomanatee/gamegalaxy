define(function (require, exports, module) {

    var ROOT = '/giantbomb/';

var rest = require('rest');
    module.exports = {
        games: function (params, callback, fail) {
            var url = ROOT + 'games';
            if (_.isFunction(params)) {
                fail = callback;
                callback = params;
                params = {};
            }

            rest(url, 'POST', params, callback, fail);
        }
    };

});