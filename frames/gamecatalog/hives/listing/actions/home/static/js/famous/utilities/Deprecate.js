define(function(require, exports, module) {
    var Deprecate = {};

    var getStackTrace = function() {
        var obj = {};
        Error.captureStackTrace(obj, getStackTrace);
        return obj.stack;
    };

    Deprecate.log = function(message){
        var caller = arguments.callee.caller.name;

        console.groupCollapsed('deprecated ' + caller);
        if (message) console.log('message: ' + message);
        console.log(getStackTrace());
        console.groupEnd();
    }

    Deprecate.throwError = function(message){
        return new Error(message);
    }

    module.exports = Deprecate;
});
