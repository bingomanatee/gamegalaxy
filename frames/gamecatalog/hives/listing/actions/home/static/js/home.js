/**
 * HeaderFooterLayout
 * ------------------
 *
 * HeaderFooterLayout is a layout which will arrange three renderables
 * into a header and footer area of defined size and a content area
 * of flexible size.
 *
 * In this example we create a basic HeaderFooterLayout and define a
 * size for the header and footer
 */
define(function (require, exports, module) {

    var Engine = require("famous/core/Engine");
    var RenderNode = require('famous/core/RenderNode');
    var Surface = require("famous/core/Surface");
    var HeaderFooterLayout = require("famous/views/HeaderFooterLayout");
    var Transform = require('famous/core/Transform');
    var giantbomb = require('giantbomb');
    var Modifier = require('famous/core/Modifier');
    var ContainerSurface = require('famous/Surfaces/ContainerSurface');
    var Scrollview = require('famous/views/Scrollview');
    var GridLayout = require('famous/views/GridLayout');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var Transitionable = require("famous/transitions/Transitionable");
    var TransitionableTransform = require("famous/transitions/TransitionableTransform");

    // sizing context
    var ENTRY_MARGIN = 20;
    var ENTRY_HEIGHT = 70;
    var HEADER_HEIGHT = 80;
    var FOOTER_HEIGHT = 50;
    var SEARCH_LABEL_SIZE = 150;
    var SEARCH_INPUT_SIZE = 350;

    // game row item sizes
    var GAME_ROW_ITEM_HEIGHT = 30;
    var GAME_ROW_ITEM_PLATFORM_WIDTH = 250;
    var GAME_ROW_NAME_WIDTH = 300;
    var GAME_ROW_ITEM_DATE_WIDTH = 100;
    var GAME_HEADER_HEIGHT = 40;
    var GAME_HEADER_LABEL_HEIGHT = 25;
    var ICON_WIDTH = 20;
    var ICON_MARGIN = 8;
    var CALLOUT_Z = 0;

    // platform
    var PLATFORM_HEADER_HEIGHT = 50;
    var platformDialogContainer;
    var platformGridContainer;

    var entrySurface;
    var filterLabelSurface;

    var searchChangeDelay;
    var searchEdition = 0;

    // core elements
    var layout;
    var inputSurface;

    // templates
    var _platformContent = _.template('<h3><%= abbreviation %></h3><p><%= name %></p>');
    var _filterText = _.template('platform: <i><% if (platform){ %><%= platform.name %><span id="clear-platform">&times;</span><% } else { %>ALL<% } %></i>');
    var _statusTemplate = _.template('<%= found %> of <%= results %> retrieved <% if (active != found ){ %>(<%= active %> filtered records shown)<% } %>');
    var _gameHeader = _.template('<h1><%= name %> (<%= original_release_date ? new Date(original_release_date).getFullYear()  : "?" %>)</h1>'// +
        //   '<ul class="platforms"><% _.each(platforms, function(platform){ %><li><%= platform.abbreviation %></li><% }) %></ul>'
    );
    var _calloutPlatformsTemplate = _.template('<% if (platforms) { platforms.forEach(function(p, i){ %><% if (i) { %><span class="callout-platform-bullet"> &bull;</span> <% } %><div class="platform-callout-platform"><%= p.name %></div><%})} %>');

    // list elements
    var listContainer;
    var listHeaderNode;
    var listHeaderCS;
    var nameLabel;
    var platformLabel;
    var gameListScrollView;
    var platformLabelContainer;
    var releasedLabel;
    var gameCallout;
    var gameCalloutTitle;
    var gameCalloutPlatforms;
    var gameCalloutImage;
    var gameCalloutInfoButton;
    var gameCalloutText;
    var gameCalloutInfoCloseButton;
    var gameViewLock = false;
    var gameViewLockRow;

    // state values
    var sortKey = 'name';
    var reverseSort = false;
    var hoverQueue = {};
    var totalGames = 0;
    var foundGames = [];
    var mainContext = Engine.createContext();

    mainContext.setPerspective(500);
    var platform = null;

    function showPlatformDialog() {
        var tiles = gamePlatformTiles();
        if (!platformDialogContainer) {
            platformDialogContainer = new ContainerSurface({
                size: [800, 700],
                classes: ['dialog-frame']
            });
            platformDialogContainer.add(new Surface({
                content: '<h2>Platforms</h2>',
                classes: ['dialog']
            }));
            mainContentNode.add(new Modifier({origin: [0.5, 0.5]})).add(platformDialogContainer);

            platformGridContainer = new GridLayout({
                dimensions: [6, 8],
                size: [600, 550]
            });

            platformDialogContainer.add(new Modifier({
                transform: Transform.translate(0, PLATFORM_HEADER_HEIGHT)
            })).add(platformGridContainer);
        } else {
            platformDialogContainer.setProperties({display: 'block'});
        }

        platformGridContainer.sequenceFrom(tiles);
    }

    function platformNames(game) {
        return _.map(game.platforms, function (p) {
            return platform && (p.abbreviation == platform.abbreviation) ? '<b>' + p.abbreviation + '</b>' : p.abbreviation
        }).join(', ');
    }

    function hoverClasses(target, ifOverClasses, ifOutClasses, key) {
        target.on('mouseover', function () {
            var over = _.isFunction(ifOverClasses) ? ifOverClasses() : ifOverClasses;
            var out = _.isFunction(ifOutClasses) ? ifOutClasses() : ifOutClasses;
            target.setClasses(over);
            if (key) {
                if (hoverQueue[key]) {
                    hoverQueue[key].setClasses(out || []);
                    delete hoverQueue[key];
                }
                hoverQueue[key] = target;
            }
        });

        target.on('mouseout', function () {
            var over = _.isFunction(ifOverClasses) ? ifOverClasses() : ifOverClasses;
            var out = _.isFunction(ifOutClasses) ? ifOutClasses() : ifOutClasses;
            target.setClasses(out || []);
            if (key && hoverQueue[key] === target) {
                delete hoverQueue[key];
            }
        });
    }

    function updateStatus(data, activeGameSet) {
        if (data) {
            totalGames = data.number_of_total_results;
        }
        var status = { results: totalGames};
        status.active = activeGameSet.length;
        status.found = foundGames.length;

        footerSurface.setContent(_statusTemplate(status));
    }

    function renderGames(data) {
        var activeGames = games();
        var resultViews = _.map(activeGames, gameToNode);
        gameListScrollView.sequenceFrom(resultViews);

        updateStatus(data, activeGames);
    }

    function remainingWidth() {
        var args = _.toArray(arguments);
        return Math.max(0, _.reduce(args, function (o, a) {
            return o - a;
        }, window.innerWidth));
    }

    function remainingHeight() {
        var args = _.toArray(arguments);
        return Math.max(0, _.reduce(args, function (o, a) {
            return o - a;
        }, window.innerHeight));
    }

    function updateGameList(text) {
        searchChangeDelay = null;
        platform = null;
        main.setContent('<p>Searching for &quot;' + text + '&quot; -- please wait</p>');
        console.log('clearing foundGames');
        foundGames = [];
        var thisSearch = ++searchEdition;

        giantbomb.games({filter: 'name:' + encodeURIComponent(text)}, function (data) {
            main.setContent('');
            mainContext.emit('game filter update');
            if (searchEdition == thisSearch) {
                console.log('games containing', text, ':', data);
            }

            foundGames = data.results;
            renderGames(data);

            function _lastSet(data) {
                return data.number_of_total_results <= data.offset + data.number_of_page_results;
            }

            function _expandList(data) {
                if (!(thisSearch == searchEdition)) {
                    console.log('aborting old poll');
                    return;
                }
                if (!_lastSet(data)) {
                    var offset = data.offset + 100;
                    console.log('getting ' + text + ' from ', offset);
                    giantbomb.games({filter: 'name:' + encodeURIComponent(text), offset: offset},
                        function (addedData) {
                            if (!(thisSearch == searchEdition)) {
                                console.log('rest -- aborting old poll');
                                return;
                            }
                            if (!addedData.results) {
                                console.log('bad data');
                                return;
                            }
                            foundGames = foundGames.concat(addedData.results);
                            renderGames(addedData);
                            console.log('loaded records from ', offset);

                            if ((thisSearch == searchEdition) && !_lastSet(addedData)) {
                                console.log('getting ' + text + ' from ', addedData.offset);
                                _expandList(addedData);
                            } else {
                                console.log('end of pull for ', text);
                            }
                        });

                } else {
                    console.log('end of pull for ', text);
                }
            }

            _expandList(data);
        });

    }

    var CALLOUT_RATIO = 1.6;

    function calloutSize(scale) {
        if (!scale) {
            scale = 1;
        }
        var width = remainingWidth(GAME_ROW_NAME_WIDTH, GAME_ROW_ITEM_PLATFORM_WIDTH, GAME_ROW_ITEM_DATE_WIDTH);
        var maxHeight = remainingHeight(HEADER_HEIGHT, FOOTER_HEIGHT);
        var height = CALLOUT_RATIO * width;
        if (height > maxHeight) {
            height = maxHeight;
            width = height / CALLOUT_RATIO;
        }

        return [scale * width,
                scale * height    ];
    }

    function initCallout() {

        gameCallout = new ContainerSurface({
            size: calloutSize()
        });

        layout.content.add(new Modifier({
            origin: [1, 0]
        })).add(gameCallout);

        var gameCalloutNode = new RenderNode();
        var transformCallout = Transform.translate(0,0,0);
        var gameCalloutModifier = new Modifier({
            transform: transformCallout
        });

        gameCallout.add(gameCalloutModifier).add(gameCalloutNode);

        gameCalloutNode.add(new Surface({
            classes: ['game-callout-back']
        }));

        gameCalloutImage = new ImageSurface({
            size: calloutSize(0.8),
            classes: ['callout-image'],
            properties: {
                display: 'none'
            }
        });
        gameCalloutNode.add(new Modifier({origin: [1, 0.5]})).add(gameCalloutImage);

        gameCalloutText = new Surface({
            classes: ['game-callout-text'],
            properties: {
                display: "none"
            }
        });
        gameCalloutNode.add(gameCalloutText);

        gameCalloutPlatforms = new Surface({
            size: [undefined, 60],
            classes: ['callout-platform']
        });
        gameCalloutNode.add(new Modifier({origin: [0, 1]})).add(gameCalloutPlatforms);

        gameCalloutInfoButton = new Surface({
            classes: ['button', 'info-button', 'info-close-button'],

            content: 'Description',
            size: [130, 40]
        });

        gameCalloutInfoCloseButton = new Surface({
            classes: ['button', 'info-button'],
            content: '<span class="callout-info-close-x">&times</span> Close Description',
            size: [200, 40]
        });

        hoverClasses(gameCalloutInfoCloseButton,
            ['button', 'info-button', 'hover']
            , ['button', 'info-button']);



        gameCalloutInfoButton.on('click', function () {
            gameCalloutText.setProperties({display: 'block'});
            gameCalloutInfoCloseButton.setProperties({display: 'block'});
            gameCalloutPlatforms.setProperties({display: 'none'});

        });

        gameCalloutInfoCloseButton.on('click', function () {
            gameCalloutText.setProperties({display: 'none'});
            gameCalloutInfoCloseButton.setProperties({display: 'none'});
            gameCalloutPlatforms.setProperties({display: 'block'});
        });

        hoverClasses(gameCalloutInfoButton, ['button', 'info-button', 'hover']
            , ['button', 'info-button']);

        gameCalloutNode.add(new Modifier({
            origin: [1, 1]
        })).add(gameCalloutInfoButton);


        gameCalloutNode.add(new Modifier({
            origin: [1, 1]
        })).add(gameCalloutInfoCloseButton);

        gameCalloutTitle = new Surface({
            classes: ['game-callout-header'],
            size: [undefined, 150]
        });

        gameCalloutNode.add(new Modifier({size: [undefined, 150]})).add(gameCalloutTitle);
    }

    function highlightGame(game) {

        if (gameViewLock) {
            game = gameViewLock;
        }
        if (game) {
            gameCalloutTitle.setContent(_gameHeader(game));
            if (game.image) {
                gameCalloutImage.setContent(game.image.medium_url);
                gameCalloutImage.setProperties({display: 'block'});
            } else {
                gameCalloutImage.setProperties({display: 'none'});
            }

            gameCalloutInfoButton.setProperties({display: 'block'});

            gameCalloutPlatforms.setContent(_calloutPlatformsTemplate(game));

            gameCalloutText.setContent(game.description);
        }
    }

    function setSearchPlatform(p) {
        platform = p;
        mainContext.emit('game filter update');
    }

    function gamePlatformTiles() {

        var gamePlatforms = _.compact(_.flatten(_.pluck(foundGames, 'platforms')));
        gamePlatforms = _.groupBy(gamePlatforms, 'name');
        gamePlatforms = _.map(_.values(gamePlatforms), function (pList) {
            return pList[0];
        });
        gamePlatforms = _.sortBy(gamePlatforms, 'abbreviation');

        return _.map(gamePlatforms, function (platform) {
            var platformSurface = new Surface({
                content: _platformContent(platform),
                classes: ['platform-icon']
            });

            hoverClasses(platformSurface, ['platform-icon', 'hover'], ['platform-icon'], 'platform');

            platformSurface.on('click', function () {
                setSearchPlatform(platform);
                platformDialogContainer.setProperties({display: 'none'});
            });
            return platformSurface;
        });
    }

    function sortPrefix(field) {
        console.log('sort by ', field);
        if (field != sortKey) {
            return '';
        } else if (reverseSort) {
            return '<span class="sort-icon">&#8593;</span>&nbsp;';
        } else {
            return '<span class="sort-icon">&#8595;</span>&nbsp;';
        }
    }

    function setSortKey(key) {
        if (sortKey == key) {
            reverseSort = !reverseSort;
        }
        sortKey = key;

        nameLabel.setContent(sortPrefix('name') + 'Name');
        platformLabel.setContent(sortPrefix('platform') + 'Platform');
        releasedLabel.setContent(sortPrefix('released') + 'Released');
        gameListScrollView.sequenceFrom(_.map(games(), gameToNode));
    }

    function games() {
        var games = foundGames;
        if (platform) {
            games = _.filter(games, function (game) {
                return _.find(game.platforms, function (pf) {
                    return pf.abbreviation == platform.abbreviation;
                })
            });
        } else {
        }
        games = _.sortBy(games, sortKey);
        return reverseSort ? games.reverse() : games;
    }

    function gameToNode(game) {
        var gameRowContainer = new ContainerSurface({
            size: [undefined, GAME_ROW_ITEM_HEIGHT],
            classes: ['game-row']
        });

        hoverClasses(gameRowContainer, function () {
            if (gameViewLock && gameViewLock.id == game.id) {
                return ['game-row', 'hover', 'lock'];
            } else {
                return ['game-row', 'hover'];
            }
        }, function () {
            if (gameViewLock && gameViewLock.id == game.id) {
                return ['game-row', 'lock'];
            } else {
                return ['game-row'];
            }
        });

        gameRowContainer.on('mouseover', function () {
            highlightGame(game);
        });

        gameRowContainer.on('click', function () {

            if (gameViewLockRow) {
                gameViewLockRow.setClasses(['game-row']);
            }
            if (gameViewLock && (gameViewLock.id == game.id)) {
                gameViewLock = null;
                gameViewLockRow = null;
            } else {
                gameViewLock = game;
                gameViewLockRow = gameRowContainer;
            }
        });

        var platformSurface = new Surface({
            size: [GAME_ROW_ITEM_PLATFORM_WIDTH, GAME_ROW_ITEM_HEIGHT],
            classes: ['game-row-platform', 'game-row-cell'],
            content: platformNames(game)
        });

        gameRowContainer.add(new Surface({
            size: [GAME_ROW_NAME_WIDTH, GAME_ROW_ITEM_HEIGHT],
            content: game.name,
            classes: ['game-row-name', 'game-row-cell']
        }));
        gameRowContainer.add(new Modifier({
            transform: Transform.translate(GAME_ROW_NAME_WIDTH, 0)
        })).add(platformSurface);
        gameRowContainer.add(new Modifier({
            transform: Transform.translate(GAME_ROW_NAME_WIDTH + GAME_ROW_ITEM_PLATFORM_WIDTH, 0)
        })).add(new Surface({
            size: [GAME_ROW_ITEM_DATE_WIDTH, GAME_ROW_ITEM_HEIGHT],
            classes: ['game-row-date', 'game-row-cell'],
            content: game.original_release_date ? moment(new Date(game.original_release_date)).format('YYYY') : ''
        }));
        return gameRowContainer;
    }

    function getListHeight() {
        return window.innerHeight
            - (FOOTER_HEIGHT + HEADER_HEIGHT + ENTRY_HEIGHT + GAME_HEADER_HEIGHT);
    }

    function sizeEntrySurface() {
        var size = [window.innerWidth - 2 * ENTRY_MARGIN, 50];
        entrySurface.setSize(size);
        listContainer.setSize([undefined, getListHeight()]);
    }

    function clearPlatform() {
        platform = null;
        mainContext.emit('game filter update');
    }

    function initSearchBar() {

        entrySurface = new ContainerSurface({
            size: [window.innerWidth - 2 * ENTRY_MARGIN, ENTRY_HEIGHT],
            classes: ['entry-frame']
        });

        var entryNode = new RenderNode({
            getSize: function () {
                return  [window.innerWidth - 2 * ENTRY_MARGIN, ENTRY_HEIGHT - 20];
            }
        });

        entryNode.add(entrySurface);
        entrySurface.add(new Modifier({origin: [0, 0.5]}))
            .add(new Surface({
                content: 'Search for games:',
                classes: ['label'],
                size: [SEARCH_LABEL_SIZE, 25]
            }));

        filterLabelSurface = new Surface({
            content: 'filter text',
            size: [350, 25],
            classes: ['filter-label']
        });
        filterLabelSurface.on('deploy', function () {
            var removePlatform = document.getElementById('clear-platform');

            if (removePlatform) {
                removePlatform.removeEventListener('click', clearPlatform); // only way to do this ... arg
                removePlatform.addEventListener('click', clearPlatform);
            }
        });

        entrySurface.add(new Modifier({
            origin: [0, 0.5],
            transform: Transform.translate(SEARCH_LABEL_SIZE + SEARCH_INPUT_SIZE, 0)
        })).add(filterLabelSurface);

        inputSurface.on('deploy', function () {
            document.getElementById('search-input').addEventListener('keyup', function () {
                var text = document.getElementById('search-input').value;
                console.log('text:', text);

                if (searchChangeDelay) {
                    clearTimeout(searchChangeDelay);
                }

                searchChangeDelay = _.delay(
                    updateGameList, 800, text);

            })
        });

        entrySurface.add(new Modifier({
            origin: [0, 0.33],
            transform: Transform.translate(160, 0)}))
            .add(inputSurface);

        mainContentNode.add(new Modifier({transform: Transform.translate(ENTRY_MARGIN, ENTRY_MARGIN)}))
            .add(entryNode);
    }

    function initListContainer() {
        listContainer = new ContainerSurface({
            size: [undefined, getListHeight()],
            classes: ['game-list']
        });

        gameListScrollView = new Scrollview({
            clipSize: getListHeight()
        });

        listContainer.add(gameListScrollView);

        listContainer.pipe(gameListScrollView);

        mainContentNode.add(new Modifier({transform: Transform.translate(0, ENTRY_HEIGHT + GAME_HEADER_HEIGHT)}))
            .add(listContainer);

        listHeaderNode = new RenderNode();
        mainContentNode.add(new Modifier({transform: Transform.translate(0, ENTRY_HEIGHT)})).add(listHeaderNode);

        listHeaderCS = new ContainerSurface({
            size: [undefined, GAME_HEADER_HEIGHT],
            classes: ['game-header']
        });

        nameLabel = new Surface({
            size: [GAME_ROW_NAME_WIDTH, GAME_HEADER_LABEL_HEIGHT],
            classes: ['game-header-label', 'name'],
            content: sortPrefix('name') + 'Name'
        });

        nameLabel.on('click', function () {
            setSortKey('name');
        });

        platformLabelContainer = new ContainerSurface({
            size: [GAME_ROW_ITEM_PLATFORM_WIDTH, GAME_HEADER_HEIGHT]
        });

        platformLabel = new Surface({content: 'Platform',
            size: [GAME_ROW_ITEM_PLATFORM_WIDTH - ICON_WIDTH - ICON_MARGIN, GAME_HEADER_LABEL_HEIGHT],
            classes: ['game-header-label']
        });
        platformLabelContainer.add(new Modifier({
            origin: [0, 0.5],
            transform: Transform.translate(ICON_WIDTH + ICON_MARGIN, 0)
        })).add(platformLabel);

        var platformSortButton = new Surface({
            content: '&#9680;',
            size: [ICON_WIDTH, GAME_HEADER_LABEL_HEIGHT],
            classes: ['sort-icon']
        });

        platformSortButton.on('mouseover', function () {
            platformSortButton.setClasses(['sort-icon', 'hover'])
        });

        platformSortButton.on('mouseout', function () {
            platformSortButton.setClasses(['sort-icon'])
        });

        platformSortButton.on('click', showPlatformDialog);

        platformLabelContainer.add(new Modifier({origin: [0, 0.5]}))
            .add(platformSortButton);

        releasedLabel = new Surface({
            size: [GAME_ROW_ITEM_DATE_WIDTH, GAME_HEADER_LABEL_HEIGHT],
            classes: ['game-header-label'],
            content: 'Released',
            properties: {
            }
        });

        releasedLabel.on('click', function () {
            setSortKey('released');
        });

        listHeaderNode.add(listHeaderCS);
        listHeaderCS.add(new Modifier({
            origin: [0, 0.5]
        })).add(nameLabel);
        listHeaderCS.add(new Modifier({ transform: Transform.translate(GAME_ROW_NAME_WIDTH, 0)}))
            .add(platformLabelContainer);
        listHeaderCS.add(new Modifier({
            origin: [0, 0.5], transform: Transform.translate(GAME_ROW_NAME_WIDTH + GAME_ROW_ITEM_PLATFORM_WIDTH, 0)}))
            .add(releasedLabel);
    }

    mainContext.on('game filter update', function () {
        if (!filterLabelSurface) {
            return;
        }
        filterLabelSurface.setContent(_filterText({platform: platform}));
        if (foundGames.length && gameListScrollView) {
            renderGames(null)
        }
    });

    layout = new HeaderFooterLayout({
        headerSize: HEADER_HEIGHT,
        footerSize: 50
    });

    inputSurface = new Surface({
        content: '<input id="search-input" class="search" type="text" />',
        size: [SEARCH_INPUT_SIZE, 25]
    });

    layout.header.add(new Surface({
        size: [undefined, HEADER_HEIGHT],
        content: "<h1>GameGalaxy</h1>",
        classes: ["header"],
        properties: {
            lineHeight: "100px",
            textAlign: "center"
        }
    }));

    var main = new Surface({
        size: [undefined, undefined],
        content: "<p>Welcome to GameGalaxy: a GiantBomb data explorer</p>" +
            "<p>Type a phrase in the field above to begin</p>",
        classes: ["main"],
        origin: [0, 0.5]
    });

    layout.content.add(main);

    var mainContentNode = new RenderNode({
    });
    mainContentNode.add(new Modifier({
        translate: Transform.translate(ENTRY_MARGIN, ENTRY_MARGIN),
        size: [window.innerWidth - 2 * ENTRY_MARGIN, ENTRY_HEIGHT]
    }));

    layout.content.add(mainContentNode);

    var footerSurface = new Surface({
        size: [undefined, FOOTER_HEIGHT],
        content: "enter a search term to begin",
        classes: ["footer"],
        properties: {
            lineHeight: "50px",
            textAlign: "center"
        }
    });

    layout.footer.add(footerSurface);

    mainContext.add(layout);

    mainContext.on('resize', sizeEntrySurface);

    initSearchBar();

    initListContainer();

    sizeEntrySurface();

    highlightGame();

    initCallout();

    mainContext.emit('game filter update');
})
;
