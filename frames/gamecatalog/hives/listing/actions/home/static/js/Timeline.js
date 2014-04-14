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
    var ContainerSurface = require('famous/surfaces/ContainerSurface');
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
    var SCALE = 8;
    var SIDE_OPACITY = 0.125;

    function IconView(game, squashed) {
        View.apply(this);

        var classes = squashed ? ['game-icon', 'squashed'] : ['game-icon'];

        var image;
        var title = new Surface({
            size: [config.TIMELINE_ICON_WIDTH - config.TIMELINE_ICON_IMAGE_WIDTH_SQUASHED, 15],
            content: game.name
        });
        title.elementType = 'h3';
        this.title = title;

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

            this.background.add(new StateModifier({origin: [0.5, 0], transform: Transform.translate(0, 0)}))
                .add(image);
            this.background.add(new StateModifier({origin: [0.5, 0], transform: Transform.translate(0, config.TIMELINE_ICON_IMAGE_HEIGHT)}))
                .add(title);
        }

        this.add(new Modifier({
            transform: Transform.translate(config.TIMELINE_ICON_IMAGE_WIDTH / -2, 0)
        })).add(this.background);

        if (!(game.image && game.image.thumb_url)) {
            image.setContent('/img/home/game.noicon.png');
        } else {
            image.setContent(game.image.thumb_url);
        }

    }

    IconView.prototype = Object.create(View.prototype);

    function Timeline(term, games) {

        View.apply(this, []);

        this.columnMods = [];
        this._updatingSwimline = null;
        this.index = 0;
        this.mode = DONE;
        this.initCalendar(games);
        this.initGames();
        this.initScrollSync();
        this.scroll();
    };

    Timeline.prototype = Object.create(View.prototype);
    Timeline.prototype.constructor = View;

    Timeline.prototype.scroll = function () {
        console.log('index:', this.index);
        var width = window.innerWidth;
        var activeCols = 1;
        var cols = this.columnMods.length;
        var leftColumn = Math.round(this.index);
        var rightColumn = leftColumn;

        var widthSavings = (config.TIMELINE_ICON_WIDTH * (SCALE - 1) / SCALE);

        function _effectiveWidth() {
            var activeWidth = activeCols * config.TIMELINE_ICON_WIDTH;
            var reducedWidth = (cols - activeCols) * config.TIMELINE_ICON_WIDTH / SCALE;
            return activeWidth + reducedWidth;
        }

        console.log('leftColumn: ', leftColumn, 'rightColumn:', rightColumn, 'width:', width, 'effectiveWidth:', _effectiveWidth());

        while (activeCols < cols && _effectiveWidth() + (2 * widthSavings) < width) {
            activeCols += 2;
            --leftColumn;
            ++rightColumn;
            console.log('leftColumn: ', leftColumn, 'rightColumn:', rightColumn, 'effectiveWidth:', _effectiveWidth());
        }

        if (leftColumn < 0) {
            rightColumn -= leftColumn;
            leftColumn = 0;
            this.index -= leftColumn;
        }
        rightColumn = Math.min(rightColumn, cols);

        _.each(this.columnMods, function (mod, i) {
            var widthOffset = -widthSavings * Math.max(0, Math.min(i, leftColumn - 1));
            mod.halt();

            if (i < leftColumn) {
                mod.setOpacity(SIDE_OPACITY);
                mod.setTransform(Transform.thenMove(Transform.rotateY(Math.PI / 4), [widthOffset , 0, 0]), {duration: 500, easing: _.identity});

                _.each(mod.icons, function (icon) {
                    icon.title.setProperties({display: 'none'});
                })

            } else if (i > rightColumn) {
                mod.setOpacity(SIDE_OPACITY);
                mod.setTransform(Transform.thenMove(Transform.rotateY(Math.PI / -4), [widthOffset + (rightColumn - i + 1) * widthSavings, 0, 0]), {duration: 500, easing: _.identity});

                _.each(mod.icons, function (icon) {
                    icon.title.setProperties({display: 'none'});
                });

            } else {
                mod.setTransform(Transform.translate(widthOffset, 0, 0), {duration: 500, easing: _.identity});
                mod.setOpacity(1);

                _.each(mod.icons, function (icon) {
                    icon.title.setProperties({display: 'block'});
                })
            }
        });
    };

    Timeline.prototype.initGames = function initGames() {
        var colIndex = 0;

        _.each(this.calendar, function (calendar) {
            console.log('initGames calendar: ', calendar.time, 'games: ', calendar.games.length);
            var root = new RenderNode();
            var maxHeight = config.remainingHeight(config.HEADER_HEIGHT, config.TIMELINE_ICON_HEAD_HEIGHT);
            var squashed = (maxHeight < calendar.games.length * config.TIMELINE_ICON_HEIGHT);

            var title = new Surface({
                size: [config.TIMELINE_ICON_WIDTH, config.TIMELINE_ICON_HEAD_HEIGHT],
                content: calendar.time ? ( config.monthNames[calendar.month] + '/' + calendar.year) : 'early/unknown',
                classes: ['calendar-head']
            });
            title.elementType = 'h2';

            var columnMod = new StateModifier({
                origin: [0, 0],
                size: [config.TIMELINE_ICON_WIDTH, undefined]
            });

            columnMod.icons = [];

            this.columnMods.push(columnMod);

            var sharedRoot = new RenderNode();
            root.add(columnMod).add(sharedRoot).add(new StateModifier({transform: Transform.translate(-config.TIMELINE_ICON_WIDTH / 4, 0), origin: [0.5, 0]})).add(title);

            _.each(calendar.games, function (game, row) {
                var icon = new IconView(game, squashed);
                columnMod.icons.push(icon);

                sharedRoot.add(new StateModifier({
                    transform: Transform.translate(0, config.TIMELINE_ICON_HEAD_HEIGHT + (squashed ? config.TIMELINE_ICON_IMAGE_HEIGHT_SQUASHED : config.TIMELINE_ICON_HEIGHT ) * row),
                    origin: [0, 0]
                })).add(icon);
            });

            this.add(new Modifier({
                transform: Transform.translate((0.5 + colIndex) * config.TIMELINE_ICON_WIDTH, 0),
                origin: [0, 0]
            })).add(root);
            ++colIndex;

        }, this);
    };

    var STARTED = 0;
    var ENDING = 1;
    var DONE = 2;

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
                this.index += value.position / 500;
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

    Timeline.prototype.initCalendar = function initCalendar(games) {

        var items = _.map(games, function (game) {
            var calendarItem = {game: game, time: 0, year: 0, month: 0};
            if (game.original_release_date) {
                var time = new Date(game.original_release_date);
                calendarItem.time = time.getTime();
                calendarItem.year = time.getFullYear();
                calendarItem.month = time.getMonth();
                calendarItem.month -= calendarItem.month % 4;
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

    module.exports = Timeline;

});
