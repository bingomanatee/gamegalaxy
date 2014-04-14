/**
 * Shared configs
 */
define(function (require, exports, module) {
    var Engine = require("famous/core/Engine");

    // sizing context
    exports.ENTRY_MARGIN = 20;
    exports.ENTRY_LABEL_SIZE = 160;
    exports.ENTRY_ROW_HEIGHT = 35;
    exports.ENTRY_HEIGHT = 70;
    exports.HEADER_HEIGHT = 120;
    exports.FOOTER_HEIGHT = 50;
    exports.SEARCH_LABEL_SIZE = 150;
    exports.SEARCH_INPUT_SIZE = 250;

    // game row item sizes
    exports.GAME_ROW_ITEM_HEIGHT = 30;
    exports.GAME_ROW_ITEM_PLATFORM_WIDTH = 250;
    exports.GAME_ROW_NAME_WIDTH = 300;
    exports.GAME_ROW_ITEM_DATE_WIDTH = 100;
    exports.GAME_HEADER_HEIGHT = 40;
    exports.GAME_HEADER_LABEL_HEIGHT = 25;
    exports.ICON_WIDTH = 20;
    exports.ICON_MARGIN = 8;
    exports.CALLOUT_Z = 0;

    // platform
    exports.PLATFORM_COLUMNS = 6;
    exports.PLATFORM_HEIGHT = 50;
    exports.PLATFORM_EXTRA = 50;
    exports.ENTRY_SEARCH_BUTTON_WIDTH = 100;
    exports.PLATFORM_HEADER_HEIGHT = exports.PLATFORM_HEIGHT + (2 * 30);
    exports.PLATFORM_DIALOG_WIDTH = 800;
    exports.PLATFORM_MARGIN = 15;
    exports.CALLOUT_RATIO = 1.6;
    exports.PLATFORM_INNER_WIDTH = exports.PLATFORM_DIALOG_WIDTH - exports.PLATFORM_MARGIN * 2;

    exports.TIMELINE_ICON_WIDTH = 120;
    exports.TIMELINE_ICON_HEIGHT = 140;
    exports.TIMELINE_ICON_IMAGE_WIDTH = 80;
    exports.TIMELINE_ICON_IMAGE_HEIGHT = 71;
    exports.ICON_SQUASH_SCALE = 0.5;
    exports.TIMELINE_ICON_IMAGE_HEIGHT_SQUASHED = exports.TIMELINE_ICON_IMAGE_HEIGHT * exports.ICON_SQUASH_SCALE;
    exports.TIMELINE_ICON_IMAGE_WIDTH_SQUASHED = exports.TIMELINE_ICON_IMAGE_WIDTH * exports.ICON_SQUASH_SCALE;
    exports.TIMELINE_ICON_HEAD_HEIGHT = 25;

    exports.context = Engine.createContext();
    exports.context.setPerspective(window.innerWidth);

    exports.monthNames = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');

    exports.remainingWidth = function () {
        var args = _.toArray(arguments);
        return Math.max(0, _.reduce(args, function (o, a) {
            return o - a;
        }, window.innerWidth));
    };

    exports.remainingHeight = function () {
        var args = _.toArray(arguments);
        return Math.max(0, _.reduce(args, function (o, a) {
            return o - a;
        }, window.innerHeight));
    }

});
