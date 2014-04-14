/**
 * Platform
 *
 * shared utilities re: platforms
 *
 */
define(function (require, exports, module) {
    var Engine = require("famous/core/Engine");
    var Surface = require("famous/core/Surface");

    var _platformContent = _.template('<h3><%= abbreviation %></h3><p><%= name %></p>');


    var Platform = {
        gamesToPlatforms: function (foundGames) {

            var gamePlatforms = _.compact(_.flatten(_.pluck(foundGames, 'platforms')));
            gamePlatforms = _.groupBy(gamePlatforms, 'name');
            gamePlatforms = _.map(_.values(gamePlatforms), function (pList) {
                return pList[0];
            });
            return _.sortBy(gamePlatforms, 'abbreviation');
        },

        gamePlatformTiles: function (foundGames) {

            var gamePlatforms = Platform.gamesToPlatforms(foundGames);

            return _.map(gamePlatforms, function (platform) {
                var platformSurface = new Surface({
                    content: _platformContent(platform),
                    classes: ['platform-icon']
                });
                platformSurface.platform = platform;
                return platformSurface;
            });
        }
    };

    module.exports = Platform;
});