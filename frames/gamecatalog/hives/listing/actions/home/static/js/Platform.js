/**
 * Platform
 *
 * shared utilities re: platforms
 *
 */
define(function (require, exports, module) {
    var Engine = require("famous/core/Engine");

    return {
        gamesToPlatforms: function (foundGames) {

            var gamePlatforms = _.compact(_.flatten(_.pluck(foundGames, 'platforms')));
            gamePlatforms = _.groupBy(gamePlatforms, 'name');
            gamePlatforms = _.map(_.values(gamePlatforms), function (pList) {
                return pList[0];
            });
            return _.sortBy(gamePlatforms, 'abbreviation');
        }
    };
});