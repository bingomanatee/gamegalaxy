(function (root) {

    var ROOT = '/giantbomb/';
    var ROOT_RE = new RegExp('^' + ROOT.replace(/\//g, '\/'));
    var SLASH_RE = new RegExp('^\/');
    root.$giantbomb = {
        games: function (params, callback, fail) {
           var url = ROOT + 'games';
            if (_.isFunction(params)) {
                fail = callback;
                callback = params;
                params = {};
            }

            root.$rest(url, 'POST', params, callback, fail);
        }
    };

})(window);