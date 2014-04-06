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
    var sortKey = 'name';
    var reverseSort = false;

    // sizing context
    var ENTRY_MARGIN = 20;
    var ENTRY_HEIGHT = 70;
    var HEADER_HEIGHT = 100;
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

    var foundGames = [];

    var mainContext = Engine.createContext();

    // platform
    var PLATFORM_HEADER_HEIGHT = 50;
    var platform = null;

    var _platformContent = _.template('<h3><%= abbreviation %></h3><p><%= name %></p>');
    var _filterText = _.template('platform: <i><% if (platform){ %><%= platform.name %><span id="clear-platform">&times;</span><% } else { %>ALL<% } %></i>');

    var platformDialogContainer;
    var platformGridContainer;

    function _showPlatformDialog() {
        var tiles = _gamePlatformTiles();
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
                dimensions: [6, 7],
                size: [800, 550]
            });

            platformDialogContainer.add(new Modifier({
                transform: Transform.translate(0, PLATFORM_HEADER_HEIGHT)
            })).add(platformGridContainer);
        } else {
            platformDialogContainer.setProperties({display: 'block'});
        }

        platformGridContainer.sequenceFrom(tiles);
    }

    function _platformNames(game) {
        return _.map(game.platforms, function (p) {
            return platform && (p.abbreviation == platform.abbreviation) ? '<b>' + p.abbreviation + '</b>' : p.abbreviation
        }).join(', ');
    }

    function _hoverClasses(target, ifOverClasses, ifOutClasses){
        target.on('mouseover', function () {
            target.setClasses(ifOverClasses)
        });

        target.on('mouseout', function () {
            target.setClasses(ifOutClasses)
        });
    }

    function _setSearchPlatform(p) {
        platform = p;
        mainContext.emit('game filter update');
    }

    function _gamePlatformTiles() {

        var gamePlatforms = _.compact(_.flatten(_.pluck(foundGames, 'platforms')));
        gamePlatforms = _.groupBy(gamePlatforms, 'name');
        gamePlatforms = _.map(_.values(gamePlatforms), function (pList) {
            return pList[0];
        });

        return _.map(gamePlatforms, function (platform) {
            var platformSurface = new Surface({
                content: _platformContent(platform),
                classes: ['platform-icon']
            });

            _hoverClasses(platformSurface, ['platform-icon', 'hover'], ['platform-icon']);

            platformSurface.on('click', function () {
                _setSearchPlatform(platform);
                platformDialogContainer.setProperties({display: 'none'});
            });
            return platformSurface;
        });
    }

    function _sortPrefix(field) {
        console.log('sort by ', field);
        if (field != sortKey) {
            return '';
        } else if (reverseSort) {
            return '<span class="sort-icon">&#8593;</span>&nbsp;';
        } else {
            return '<span class="sort-icon">&#8595;</span>&nbsp;';
        }
    }

    function _setSortKey(key) {
        if (sortKey == key) {
            reverseSort = !reverseSort;
        }
        sortKey = key;

        nameLabel.setContent(_sortPrefix('name') + 'Name');
        platformLabel.setContent(_sortPrefix('platform') + 'Platform');
        releasedLabel.setContent(_sortPrefix('released') + 'Released');
        gameListScrollView.sequenceFrom(_.map(_games(), _gameToNode));
    }

    function _games() {
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

    function _gameToNode(game) {
        var gameRowContainer = new ContainerSurface({
            size: [undefined, GAME_ROW_ITEM_HEIGHT],
            classes: ['game-row']
        });

        _hoverClasses(gameRowContainer, ['game-row', 'hover'], ['game-row']);

        var platformSurface = new Surface({
            size: [GAME_ROW_ITEM_PLATFORM_WIDTH, GAME_ROW_ITEM_HEIGHT],
            classes: ['game-row-platform', 'game-row-cell'],
            content: _platformNames(game)
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

    function _getListHeight() {
        return window.innerHeight
            - (FOOTER_HEIGHT + HEADER_HEIGHT + ENTRY_HEIGHT + GAME_HEADER_HEIGHT);
    }

    function sizeEntrySurface() {
        var size = [window.innerWidth - 2 * ENTRY_MARGIN, 50];
        entrySurface.setSize(size);
        listContainer.setSize([undefined, _getListHeight()]);
    }

    function _clearPlatform() {
        platform = null;
        mainContext.emit('game filter update');
    }

    mainContext.on('game filter update', function () {
        if (!filterLabelSurface) {
            return;
        }
        filterLabelSurface.setContent(_filterText({platform: platform}));
        if (foundGames.length && gameListScrollView) {
            var resultViews = _.map(_games(), _gameToNode);
            gameListScrollView.sequenceFrom(resultViews);
        }
    });

    var layout = new HeaderFooterLayout({
        headerSize: 100,
        footerSize: 50
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
        properties: {
            lineHeight: window.innerHeight - 150 + 'px',
            textAlign: "center"
        }
    });

    layout.content.add(main);

    var mainContentNode = new RenderNode({
    });
    mainContentNode.add(new Modifier({
        translate: Transform.translate(ENTRY_MARGIN, ENTRY_MARGIN),
        size: [window.innerWidth - 2 * ENTRY_MARGIN, ENTRY_HEIGHT]
    }));

    var entrySurface = new ContainerSurface({
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

    var filterLabelSurface = new Surface({
        content: 'filter text',
        size: [350, 25],
        classes: ['filter-label']
    });
    filterLabelSurface.on('deploy', function () {
            var removePlatform = document.getElementById('clear-platform');

            if (removePlatform) {
                removePlatform.removeEventListener('click', _clearPlatform); // only way to do this ... arg
                removePlatform.addEventListener('click', _clearPlatform);
            }
        });

    entrySurface.add(new Modifier({
        origin: [0, 0.5],
        transform: Transform.translate(SEARCH_LABEL_SIZE + SEARCH_INPUT_SIZE, 0)
    })).add(filterLabelSurface);

    var inputSurface = new Surface({
        content: '<input id="search-input" class="search" type="text" />',
        size: [SEARCH_INPUT_SIZE, 25]
    });

    var searchChangeDelay;
    var searchEdition = 0;
    inputSurface.on('deploy', function () {
        document.getElementById('search-input').addEventListener('keyup', function () {
            var text = document.getElementById('search-input').value;
            console.log('text:', text);

            if (searchChangeDelay) {
                clearTimeout(searchChangeDelay);
            }

            searchChangeDelay = _.delay(function (text) {
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
                    var resultViews = _.map(_games(), _gameToNode);
                    gameListScrollView.sequenceFrom(resultViews);

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
                                    gameListScrollView.sequenceFrom(_.map(_games, _gameToNode));
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

            }, 800, text);

        })
    });

    entrySurface.add(new Modifier({
        origin: [0, 0.33],
        transform: Transform.translate(160, 0)}))
        .add(inputSurface);

    mainContentNode.add(new Modifier({transform: Transform.translate(ENTRY_MARGIN, ENTRY_MARGIN)}))
        .add(entryNode);

    var listContainer = new ContainerSurface({
        size: [undefined, _getListHeight()],
        classes: ['game-list']
    });

    var gameListScrollView = new Scrollview({
        clipSize: _getListHeight()
    });

    listContainer.add(gameListScrollView);

    listContainer.pipe(gameListScrollView);

    mainContentNode.add(new Modifier({transform: Transform.translate(0, ENTRY_HEIGHT + GAME_HEADER_HEIGHT)}))
        .add(listContainer);

    var listHeaderNode = new RenderNode();
    mainContentNode.add(new Modifier({transform: Transform.translate(0, ENTRY_HEIGHT)})).add(listHeaderNode);

    var listHeaderCS = new ContainerSurface({
        size: [undefined, GAME_HEADER_HEIGHT],
        classes: ['game-header']
    });

    var nameLabel = new Surface({
        size: [GAME_ROW_NAME_WIDTH, GAME_HEADER_LABEL_HEIGHT],
        classes: ['game-header-label', 'name'],
        content: _sortPrefix('name') + 'Name'
    });

    nameLabel.on('click', function () {
        _setSortKey('name');
    });

    var platformLabelContainer = new ContainerSurface({
        size: [GAME_ROW_ITEM_PLATFORM_WIDTH, GAME_HEADER_HEIGHT]
    });

    var platformLabel = new Surface({content: 'Platform',
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

    platformSortButton.on('click', _showPlatformDialog);

    platformLabelContainer.add(new Modifier({origin: [0, 0.5]}))
        .add(platformSortButton);

    var releasedLabel = new Surface({
        size: [GAME_ROW_ITEM_DATE_WIDTH, GAME_HEADER_LABEL_HEIGHT],
        classes: ['game-header-label'],
        content: 'Released',
        properties: {
        }
    });

    releasedLabel.on('click', function () {
        _setSortKey('released');
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

    sizeEntrySurface();

    layout.content.add(mainContentNode);

    layout.footer.add(new Surface({
        size: [undefined, FOOTER_HEIGHT],
        content: "Footer",
        classes: ["footer"],
        properties: {
            lineHeight: "50px",
            textAlign: "center"
        }
    }));

    mainContext.add(layout);

    mainContext.on('resize', sizeEntrySurface);

    mainContext.emit('game filter update');
})
;
