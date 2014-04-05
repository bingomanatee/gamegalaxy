module.exports = {

    on_input: function (ctx, done) {
        var query = ctx.query || {};

        if (typeof query == 'string'){
            try {
                query = JSON.parse(query);
            } catch(err){
                return done(err);
            }
        }

        this.model('giantbomb').get('games', query, function(err, data){

            if (err){
                done(err);
            } else if (data) {
                ctx.$send(data, done);
            } else {
               done(new Error('no data'));
            }

        });
    }


};