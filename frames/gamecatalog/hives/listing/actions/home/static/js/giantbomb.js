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

            rest(url, 'POST', params, function(data){

                _.each(data.results, function(game){
                   game.released = game.original_release_date ? new Date(game.original_release_date).getFullYear() : '';
                });

                callback(data);

            }, fail);
        }
    };

});