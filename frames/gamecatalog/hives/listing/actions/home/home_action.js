module.exports = {

    on_output: function (ctx, done) {
        ctx.$res.header("Access-Control-Allow-Origin", "*");
        ctx.$out.set('gb_api_key', ctx.$apiary.get_config('giantbomb').api_key);
        done();
    }

};