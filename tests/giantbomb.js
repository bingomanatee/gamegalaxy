var mvc = require('hive-mvc');
var path = require('path');
var FRAMES_ROOT = path.resolve(__dirname, '../frames');
console.log('FRAMES ROOT: %s', FRAMES_ROOT);
var tap = require('tap');
var _ = require('underscore');
var apiary = mvc.Apiary({}, FRAMES_ROOT);
apiary._config.setAll(require('../api_key.json'));

apiary.init(function () {
    var resources = apiary.model('$resources');
    var giantbombModel = resources.find({name: 'giantbomb'}).one();

    // testing the basic throughput of the API

    tap.test('giantbomb', function(gb_test){

        var gb_config = require('./../api_key.json');
        var api_key = gb_config.giantbomb.api_key;

        var requestor = {

            get: function(url, props, callback){

                gb_test.equal(url, 'http://www.giantbomb.com/api/games?api_key=' + api_key,
                    'url is http://www.giantbomb.com/api/games?api_key=' + api_key);

                callback(null, {url: url}, JSON.stringify( {foo: 'bar'}));
            }
        };

        giantbombModel.get('games', {}, function(err, data){
            gb_test.deepEqual(data, {foo:'bar'}, 'data returned');
            gb_test.end();
        }, requestor);

    });

    tap.test('integration', function(i_test){

        giantbombModel.get('games', {limit: 10}, function(err, data){
            //  console.log('data: %s %s', err, JSON.stringify(data));
            i_test.equal(data.offset, 0, 'has offset 0');
            i_test.equal(data.status_code, 1, 'has status code 1');
            i_test.ok(data.hasOwnProperty('results'), 'data has results');
            i_test.end();
        })
    });

    tap.test('get doom', function(id_test){

        giantbombModel.get('games', {filter: 'name:Doom'}, function(err, data){
            //  console.log('data: %s %s', err, JSON.stringify(data));

            var doom = _.find(data.results, function(item){
                return item.name == 'Doom';
            });

            id_test.ok(doom, 'Doom record exists');

            id_test.equal(doom.original_release_date, '1993-12-10 00:00:00', 'origianl release date is correct');

            id_test.end();
        });
    });

});