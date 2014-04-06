define(function (require, exports, module) {
    module.exports = function (url, type, params, onSuccess, onFail) {

        var request = new XMLHttpRequest();
        var result = request.open(type.toUpperCase(), url, true);
        console.log('result: ', result);

        if (!onFail) {
            onFail = function () {
            };
        }

        if (!onSuccess) {
            onSuccess = function () {
            };
        }

        var data = null;
        if (params && type.toUpperCase() != 'GET') {
            data = new FormData();
            data.append('query', JSON.stringify(params));
        }

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                try {
                    data = JSON.parse(request.responseText);
                } catch (err) {
                    return onFail(err);
                }
                onSuccess(data);
            } else {
                onFail(new Error('request.status = ' + request.status));
            }
        };

        request.onerror = onFail;

        request.send(data);

    };

});