var request = require('request');

module.exports = function (apiary, callback) {

    var ROOT = 'http://www.giantbomb.com/api/';
    var ROOT_RE = new RegExp('^' + ROOT.replace(/\//g, '\/'));
    var SLASH_RE = new RegExp('^\/');


    var giantBombModel = {
        name: 'giantbomb',
        get: function (url, params, callback, requestor) {
            var gb = apiary.get_config('giantbomb');
            var giant_bomb_api_key = gb.api_key;

            if (!requestor) {
                requestor = request;
            }

            if (!ROOT_RE.test(url)) {
                url = ROOT + url.replace(SLASH_RE, '');
            }

            if (!/\?/.test(url)) {
                url += '?';
            } else {
                url += '&';
            }

            url += 'api_key=' + giant_bomb_api_key + '&';

            if (_.isFunction(params)) {
                callback = params;
                params = {};
            }

            url = url.replace(/&$/,'');
            params.format = 'json';

            requestor.get(url, {qs: params}, function (err, res, body) {
                if (err) {
                    callback(rr);
                } else {
                    var data;
                    try {
                        data = JSON.parse(body);
                    } catch (err) {
                        return callback(err);
                    }
                    if (!data) {
                        callback(new Error('no data'));
                    } else {
                        callback(null, data);
                    }
                }
            });

        }
    };

    callback(null, giantBombModel);

};