/**
 * GameGalaxy
 *
 * GameGalaxy is a display system for GiantBomb's game API.
 *
 */
define(function (require, exports, module) {

    var Engine = require("famous/core/Engine");
    var RenderNode = require('famous/core/RenderNode');
    var Surface = require("famous/core/Surface");
    var HeaderFooterLayout = require("famous/views/HeaderFooterLayout");
    var Transform = require('famous/core/Transform');
    var giantbomb = require('giantbomb');
    var Modifier = require('famous/core/Modifier');
    var StateModifier = require('famous/modifiers/StateModifier');
    var ContainerSurface = require('famous/Surfaces/ContainerSurface');
    var View = require('famous/core/View');
    var Scrollview = require('famous/views/Scrollview');
    var GridLayout = require('famous/views/GridLayout');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var Transitionable = require("famous/transitions/Transitionable");
    var TransitionableTransform = require("famous/transitions/TransitionableTransform");

    var GenericSync = require("famous/inputs/GenericSync");
    var ScrollSync = require('famous/inputs/ScrollSync');
    var Platform = require('Platform');

    var config = require('config');

    function IconView(game, squashed) {
        View.apply(this);

        var classes = squashed ? ['game-icon', 'squashed'] : ['game-icon'];

        var image;
        var title = new Surface({
            size: [config.TIMELINE_ICON_WIDTH - config.TIMELINE_ICON_IMAGE_WIDTH_SQUASHED, 15],
            content: game.name
        });
        title.elementType = 'h3';

        if (squashed) {
            this.background = new ContainerSurface({
                size: [config.TIMELINE_ICON_WIDTH, config.TIMELINE_ICON_IMAGE_HEIGHT_SQUASHED],
                classes: classes
            });

            image = new ImageSurface({
                size: [config.TIMELINE_ICON_IMAGE_WIDTH_SQUASHED, config.TIMELINE_ICON_IMAGE_HEIGHT_SQUASHED]
            });

            this.background.add(new StateModifier({transform: Transform.translate(0, 0), origin: [0, 0]}))
                .add(image);
            this.background.add(new StateModifier({transform: Transform.translate(config.TIMELINE_ICON_IMAGE_WIDTH_SQUASHED, 0), origin: [0, 0.5]}))
                .add(title);
        } else {
            this.background = new ContainerSurface({
                size: [config.TIMELINE_ICON_WIDTH, config.TIMELINE_ICON_HEIGHT],
                classes: classes
            });

            image = new ImageSurface({
                size: [config.TIMELINE_ICON_IMAGE_WIDTH, config.TIMELINE_ICON_IMAGE_HEIGHT]
            });

            this.background.add(new StateModifier({transform: Transform.translate(0, 0), origin: [0.5, 0]}))
                .add(image);
            this.background.add(new StateModifier({origin: [0.5, 0], transform: Transform.translate(0, config.TIMELINE_ICON_IMAGE_HEIGHT)}))
                .add(title);
        }

        this.add(new Modifier({
            origin: [0, 0]
        })).add(this.background);

        if (!(game.image && game.image.thumb_url)) {
            image.setContent('/img/home/game.noicon.png');
        } else {
            image.setContent(game.image.thumb_url);
        }

    }

    IconView.prototype = Object.create(View.prototype);

    function Timeline(term, games, squash) {

        View.apply(this, []);

        this.columnMods = [];
        this._updatingSwimline = null;
        this.index = 0;
        this.mode = DONE;
        this.squash = squash;
        this.initLayout(term);
        this.initCalendar(games);
        this.initGames();
        this.initScrollSync();
        this.scroll();
    };

    Timeline.prototype = Object.create(View.prototype);
    Timeline.prototype.constructor = View;

    Timeline.prototype.scroll = function(){

    };

    Timeline.prototype.initGames = function initGames() {
        var colIndex = 0;

        _.each(this.calendar, function (calendar) {
            console.log('initGames calendar: ', calendar.time, 'games: ', calendar.games.length);
            var root = new RenderNode();
            var maxHeight = config.remainingHeight(config.HEADER_HEIGHT, config.TIMELINE_ICON_HEAD_HEIGHT);
            var squashed = (maxHeight < calendar.games.length * config.TIMELINE_ICON_HEIGHT);

            var title = new Surface({
                content: calendar.time ? ( config.monthNames[calendar.month] + '/' + calendar.year) : 'early/unknown',
                classes: ['calendar-head']
            });
            title.elementType = 'h2';

            var columnMod = new StateModifier({
                origin: [0, 0],
                size: [config.TIMELINE_ICON_WIDTH, config.TIMELINE_ICON_HEAD_HEIGHT]
            });

            this.columnMods.push(columnMod);

            var sharedRoot = new RenderNode();
            root.add(columnMod).add(sharedRoot).add(title);

            _.each(calendar.games, function (game, row) {
                var icon = new IconView(game, squashed);
                sharedRoot.add(new StateModifier({
                    transform: Transform.translate(0, config.TIMELINE_ICON_HEAD_HEIGHT + (squashed ? config.TIMELINE_ICON_IMAGE_HEIGHT_SQUASHED : config.TIMELINE_ICON_HEIGHT ) * row),
                    origin: [0, 0]
                })).add(icon);
            });

            this.layout.content.add(new Modifier({
                transform: Transform.translate(colIndex * config.TIMELINE_ICON_WIDTH, 0),
                origin: [0, 0]
            })).add(root);
            ++colIndex;

        }, this);
    };

    Timeline.prototype.initScrollSync = function initScrollSync() {
        var scrollSync = new ScrollSync(null, {direction: ScrollSync.DIRECTION_Y});

        Engine.pipe(scrollSync);

        scrollSync.on('start', function () {
            if (this.mode != STARTED) {
                this.mode = STARTED;
            }
        }.bind(this));

        scrollSync.on('update', function (value) {
            if (value.position && (_.isNumber(value.position))) {
                this.index += value.position / 15000;
            }
        }.bind(this));

        scrollSync.on('end', function () {
            this.index = Math.max(0, (this.index));
            if (this.mode != ENDING) {
                this.mode = ENDING;
                if (this._updatingSwimline) {
                    return;
                }

                this.scroll();

                this._updatingSwimline = setTimeout(function () {
                    this._updatingSwimline = null;
                }.bind(this), 500);
            }
        }.bind(this));
    };

    Timeline.prototype.initLayout = function (term) {
        this.layout = new HeaderFooterLayout({
            headerSize: config.HEADER_HEIGHT,
            footerSize: 50
        });

        this.layout.header = new RenderNode().add(new Modifier({origin: [0, 0]}))
            .add(new Surface({
                content: '<H1>Game Galaxy - timeline results for &nbsp;' + term + '&nbsp;</H1>',
                classes: ['header'],
                size: [undefined, config.HEADER_HEIGHT]
            }));

        this.mainSurface = new Surface({
            classes: ["main"],
            origin: [0, 0]
        });

        this.layout.content.add(this.mainSurface);
        this.add(this.layout);
    };

    Timeline.prototype.initCalendar = function initCalendar(games) {

        var items = _.map(games, function (game) {
            var calendarItem = {game: game, time: 0, year: 0, month: 0};
            if (game.original_release_date) {
                var time = new Date(game.original_release_date);
                calendarItem.time = time.getTime();
                calendarItem.year = time.getFullYear();
                calendarItem.month = time.getMonth();
            } else {
                calendarItem.time = 0;
            }
            calendarItem.index = 100 * calendarItem.year + calendarItem.month;

            return calendarItem;

        });

        var byTime = _.map(_.values(_.groupBy(items, 'index')), function (icons) {
            return  _.reduce(icons, function (out, item) {
                if (out) {
                    out.games.push(item.game);
                } else {
                    out = item;
                    item.games = [item.game];
                    delete out.game;
                }
                return out;
            }, null);
        });

        this.calendar = _.sortBy(byTime, 'year', 'month');

    };

    Timeline.prototype.setPlatformIndex = function () {
        //  console.log('index: ', timeline.index);
        if (timeline._updatingSwimline) {
            return;
        }
        _.each(this.swimlaneMods, function (mod, i) {

            var offset = i <= timeline.index ? 0 : config.PLATFORM_SWIMLINE_ICON_HEIGHT;

            mod.halt();
            var h = offset + (i * config.PLATFORM_SWIMLANE_TITLE);
            var t = [0, h, 0];

            mod.setTransform(Transform.translate(0, h), {duration: 0, easing: _.identity});

        }, this);

        timeline._updatingSwimline = _.delay(function () {
            timeline._updatingSwimline = null;
        }, 500);
    };

    var DONE = 0;
    var STARTED = 1;
    var ENDING = 2;

    Timeline.prototype.addPlatform = function (platform, i) {

        var platformSwimlane = new ContainerSurface({
            classes: ['platform-row', i % 2 ? 'odd' : 'even']
        });

        platformSwimlane.add(new Surface({
            content: platform.name,
            elementType: 'h2',
            size: [undefined, config.PLATFORM_SWIMLANE_TITLE]
        }));

        //   console.log('platform: ', platform.name);
        var swimlaneMod = new Modifier({
            size: [undefined, config.PLATFORM_SWIMLANE_HEIGHT]
        });

        this.swimlaneMods.push(swimlaneMod);

        layout.content.add(swimlaneMod).add(platformSwimlane);

        var platformGames = _.filter(games, function (game) {
            return _.find(game.platforms, function (p) {
                return p.abbreviation == platform.abbreviation;
            })
        });

        platformGames = _.sortBy(platformGames, function (game) {
            if (!game.time) {
                game.time = Date.parse(game.original_release_date);
            }
            return game.time;
        });

        _.each(platformGames, function (game, gameIndex) {
            var gameSurface = new ContainerSurface({
                size: [config.PLATFORM_SWIMLANE_ICON_WIDTH, config.PLATFORM_SWIMLINE_ICON_HEIGHT]
            });

            var image = new ImageSurface();
            if (!(game && game.image && game.image.thumb_url)) {
                image.setContent('/img/home/game.noicon.png');
            } else {
                image.setContent(game.image.thumb_url);
            }
            gameSurface.add(image);

            platformSwimlane.add(new Modifier({
                transform: Transform.translate(gameIndex * (config.PLATFORM_SWIMLANE_ICON_WIDTH + config.PLATFORM_SWIMLANE_ICON_MARGIN_WIDTH), config.PLATFORM_SWIMLANE_TITLE)
            })).add(gameSurface);

        });

    };

    module.exports = Timeline;

});
