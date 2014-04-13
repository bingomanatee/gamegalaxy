/**
 * GameGalaxy
 *
 * GameGalaxy is a display system for GiantBomb's game API.
 *
 */
define(function (require, exports, module) {

    var RenderNode = require('famous/core/RenderNode');
    var Surface = require("famous/core/Surface");
    var HeaderFooterLayout = require("famous/views/HeaderFooterLayout");
    var Transform = require('famous/core/Transform');
    var Modifier = require('famous/core/Modifier');
    var ContainerSurface = require('famous/Surfaces/ContainerSurface');
    var Scrollview = require('famous/views/Scrollview');
    var GridLayout = require('famous/views/GridLayout');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var Transitionable = require("famous/transitions/Transitionable");
    var TransitionableTransform = require("famous/transitions/TransitionableTransform");
    var Easing = require('famous/transitions/Easing');
    var Lightbox = require('famous/views/Lightbox');

    /// local classes, utilities
    var Timeline = require('Timeline');
    var config = require('config');
    var giantbomb = require('giantbomb');
    var Platform = require('Platform');

    // a sloppy hack for sharing the config

    // sizing context
    var ENTRY_MARGIN = config.ENTRY_MARGIN;
    var ENTRY_LABEL_SIZE = config.ENTRY_LABEL_SIZE;
    var ENTRY_ROW_HEIGHT = config.ENTRY_ROW_HEIGHT;
    var ENTRY_HEIGHT = config.ENTRY_HEIGHT;
    var HEADER_HEIGHT = config.HEADER_HEIGHT;
    var FOOTER_HEIGHT = config.FOOTER_HEIGHT;
    var SEARCH_LABEL_SIZE = config.SEARCH_LABEL_SIZE;
    var SEARCH_INPUT_SIZE = config.SEARCH_INPUT_SIZE;

    // game row item sizes
    var GAME_ROW_ITEM_HEIGHT = config.GAME_ROW_ITEM_HEIGHT;
    var GAME_ROW_ITEM_PLATFORM_WIDTH = config.GAME_ROW_ITEM_PLATFORM_WIDTH;
    var GAME_ROW_NAME_WIDTH = config.GAME_ROW_NAME_WIDTH;
    var GAME_ROW_ITEM_DATE_WIDTH = config.GAME_ROW_ITEM_DATE_WIDTH;
    var GAME_HEADER_HEIGHT = config.GAME_HEADER_HEIGHT;
    var GAME_HEADER_LABEL_HEIGHT = config.GAME_HEADER_LABEL_HEIGHT;
    var ICON_WIDTH = config.ICON_WIDTH;
    var ICON_MARGIN = config.ICON_MARGIN;
    var CALLOUT_Z = config.CALLOUT_Z;

    // platform
    var PLATFORM_COLUMNS = config.PLATFORM_COLUMNS;
    var PLATFORM_HEIGHT = config.PLATFORM_HEIGHT;
    var PLATFORM_EXTRA = config.PLATFORM_EXTRA;
    var ENTRY_SEARCH_BUTTON_WIDTH = config.ENTRY_SEARCH_BUTTON_WIDTH;
    var PLATFORM_HEADER_HEIGHT = config.PLATFORM_HEADER_HEIGHT;
    var PLATFORM_DIALOG_WIDTH = config.PLATFORM_DIALOG_WIDTH;
    var PLATFORM_MARGIN = config.PLATFORM_MARGIN;
    var CALLOUT_RATIO = config.CALLOUT_RATIO;
    var PLATFORM_INNER_WIDTH = config.PLATFORM_INNER_WIDTH;
    var platformDialogContainer;
    var platformGridContainer;
    var platformParent;

    // core elements
    var layout;
    var inputSurface;

    // templates
    var _platformContent = _.template('<h3><%= abbreviation %></h3><p><%= name %></p>');
    var _filterText = _.template('platform: <i><% if (platform){ %><%= platform.name %><span id="clear-platform">&times;</span><% } else { %>ALL<% } %></i>');
    var _statusTemplate = _.template('<%= found %> of <%= results %> retrieved <% if (active != found ){ %>(<%= active %> filtered records shown)<% } %>');
    var _gameHeader = _.template('<h1><%= name %></h1><h2><%= original_release_date ? new Date(original_release_date).getFullYear()  : "?" %></h2>'// +
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
    var lhnModifier;

    // state values
    var searchChangeDelay;
    var entrySurface;
    var searchEdition = 0;
    var sortKey = 'name';
    var reverseSort = false;
    var hoverQueue = {};
    var totalGames = 0;
    var foundGames = [];
    var searchText = '';
    var firstLoad = true;

    //main elements
    var mainContext = config.context;
    var footerSurface;
    var mainContentNode;
    var mainSurface;
    var filterLabelSurface;
    var sceneBox;
    var initPromptMod;

    mainContext.setPerspective(800);
    var platform = null;

    function showPlatformDialog() {
        var tiles = gamePlatformTiles();
        if (tiles && tiles.length) {

            var rows = Math.ceil(tiles.length / PLATFORM_COLUMNS);
            var total_row_height = (rows * PLATFORM_HEIGHT);
            var innerWidth = PLATFORM_DIALOG_WIDTH - (2 * PLATFORM_MARGIN);

            platformDialogContainer = new ContainerSurface({
                size: [PLATFORM_DIALOG_WIDTH, total_row_height + PLATFORM_EXTRA + (2 * PLATFORM_MARGIN)],
                classes: ['dialog-frame', 'platform-dialog']
            });

            var innerDialogContent = new ContainerSurface({
                size: [PLATFORM_INNER_WIDTH, PLATFORM_EXTRA + total_row_height],
                classes: ['platform-inner-dialog']
            });
            innerDialogContent.add(new Surface({
                content: '<h2>Platforms</h2>',
                classes: ['inner-dialog-text']
            }));

            platformDialogContainer.add(new Modifier({
                transform: Transform.translate(PLATFORM_MARGIN, PLATFORM_MARGIN, 0),
                origin: [0, 0]
            }))
                .add(innerDialogContent);

            if (platformParent) {
                platformParent._child = platformParent._object = null;
                platformParent._isRenderable = false;
                platformParent._isModifier = false;
            }

            platformParent = mainContentNode.add(new Modifier({origin: [0.5, 0.5]}));
            platformParent.add(platformDialogContainer);

            platformGridContainer = new GridLayout({
                dimensions: [PLATFORM_COLUMNS, rows],
                cellSize: [innerWidth / PLATFORM_COLUMNS, 80]
            });
            platformGridContainer.sequenceFrom(tiles);

            innerDialogContent.add(new Modifier({
                transform: Transform.translate(0, PLATFORM_EXTRA),
                origin: [0, 0],
                size: [innerWidth, rows * PLATFORM_HEIGHT]
            })).add(platformGridContainer);
        }
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

    function updateGameList(text) {
        if (initPromptMod._output.opacity){
            initPromptMod.halt();
            initPromptMod.setOpacity(0, {duration: 2000, easing: Easing.outExpo});
        }
        searchChangeDelay = null;
        platform = null;
        mainSurface.setContent('<p>Searching for &quot;' + text + '&quot; -- please wait</p>');
        console.log('clearing foundGames');
        foundGames = [];
        var thisSearch = ++searchEdition;

        giantbomb.games({filter: 'name:' + encodeURIComponent(text)}, function (data) {
            mainSurface.setContent('');
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

            lhnModifier.setTransform(
                Transform.translate(0, ENTRY_HEIGHT),
                { curve: Easing.outExpo, duration: 300}
            );

            lhnModifier.setOpacity(1, { curve: _.identity, duration: 1000});
        });

    }

    function calloutSize(scale) {
        if (!scale) {
            scale = 1;
        }
        var width = config.remainingWidth(GAME_ROW_NAME_WIDTH, GAME_ROW_ITEM_PLATFORM_WIDTH, GAME_ROW_ITEM_DATE_WIDTH);
        var maxHeight = config.remainingHeight(HEADER_HEIGHT, FOOTER_HEIGHT);
        var height = CALLOUT_RATIO * width;
        if (height > maxHeight) {
            height = maxHeight;
            width = height / CALLOUT_RATIO;
        }

        return [scale * width,
                scale * height    ];
    }

    function initCallout() {
        console.log('init callout');
        gameCallout = new ContainerSurface({
            size: calloutSize()
        });

        layout.content.add(new Modifier({
            origin: [1, 0]
        })).add(gameCallout);

        var gameCalloutNode = new RenderNode();
        //   var transformCallout = Transform.thenMove(Transform.rotateY(Math.PI/-4), [100,0,0]);
        var gameCalloutModifier = new Modifier({
            //  transform: transformCallout,
            origin: [0, 0]
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
        gameCalloutNode.add(new Modifier({
            origin: [0, 1]
        })).add(gameCalloutPlatforms);

        gameCalloutInfoButton = new Surface({
            content: 'Description',
            size: [150, 30],
            properties: {
                display: 'none'
            },
            classes: ['button', 'info-button', 'info-close-button', 'description-button'],
            elementType: 'button'
        });
        gameCalloutInfoButton.on('click', function () {
            gameCalloutText.setProperties({display: 'block'});
            gameCalloutInfoCloseButton.setProperties({display: 'block'});
            gameCalloutPlatforms.setProperties({display: 'none'});
            gameCalloutInfoButton.setProperties({display: 'none'});
        });

        gameCalloutInfoCloseButton = new Surface({
            content: '<button class="button info-button close-button"><span class="callout-info-close-x">&times</span> Close Description</button>',
            size: [200, 30], properties: {
                display: 'none'
            }
        });
        gameCalloutInfoCloseButton.on('deploy', function () {

            var element = this._currTarget.getElementsByClassName('close-button')[0];
            element.addEventListener('click', function () {
                gameCalloutText.setProperties({display: 'none'});
                gameCalloutInfoCloseButton.setProperties({display: 'none'});
                gameCalloutPlatforms.setProperties({display: 'block'});
                gameCalloutInfoButton.setProperties({display: 'block'});
            })
        });

        gameCalloutNode.add(new Modifier({
            origin: [1, 1],
            transform: Transform.translate(-10, -10)
        })).add(gameCalloutInfoButton);

        gameCalloutNode.add(new Modifier({
            size: [200, 50],
            origin: [1, 1], properties: {
                display: 'none'
            }
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

            if (firstLoad) {
                gameCalloutInfoButton.setProperties({display: 'block'});
                firstLoad = false;
            }
            gameCalloutPlatforms.setContent(_calloutPlatformsTemplate(game));

            gameCalloutText.setContent(game.description);
        }
    }

    function setSearchPlatform(p) {
        platform = p;
        mainContext.emit('game filter update');
    }

    function gamePlatformTiles() {

        gamePlatforms = Platform.gamesToPlatforms(games);

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
        var size = [config.remainingWidth(2 * ENTRY_MARGIN), 50];
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
                size: [SEARCH_LABEL_SIZE, ENTRY_ROW_HEIGHT]
            }));

        filterLabelSurface = new Surface({
            content: 'filter text',
            size: [config.remainingWidth(ENTRY_LABEL_SIZE, ENTRY_SEARCH_BUTTON_WIDTH, 2 * ENTRY_MARGIN), ENTRY_ROW_HEIGHT],
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
            transform: Transform.translate(SEARCH_LABEL_SIZE + SEARCH_INPUT_SIZE + ENTRY_SEARCH_BUTTON_WIDTH, 0)
        })).add(filterLabelSurface);

        inputSurface = new Surface({
            content: '<input type="search" id="search-input" class="search" type="text" />',
            classes: ['search-input-div'],
            size: [SEARCH_INPUT_SIZE, 25]
        });

        var searchButton = new Surface({
            content: '<button class="search-button" id="search-button">List</button>',
            size: [ENTRY_SEARCH_BUTTON_WIDTH, 25]
        });

        searchButton.on('deploy', function () {
            document.getElementById('search-button').addEventListener('click', function () {
                filterLabelSurface.setContent("Loading results --- please wait");
                searchText = document.getElementById('search-input').value;

                if (searchChangeDelay) {
                    clearTimeout(searchChangeDelay);
                }

                searchChangeDelay = _.delay(
                    updateGameList, 800, searchText);

            })
        });

        entrySurface.add(new Modifier({
            origin: [0, 0.33],
            transform: Transform.translate(ENTRY_LABEL_SIZE, 0)}))
            .add(inputSurface);

        entrySurface.add(new Modifier({
            origin: [0, 0.33],
            transform: Transform.translate(ENTRY_LABEL_SIZE + SEARCH_INPUT_SIZE, 0)
        })).add(searchButton);

        mainContentNode.add(new Modifier({
            transform: Transform.translate(ENTRY_MARGIN, ENTRY_MARGIN)}))
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
        lhnModifier = new Modifier({opacity: 0, transform: Transform.thenMove(Transform.rotateX(Math.PI / 2), [0, ENTRY_HEIGHT]) });
        mainContentNode.add(lhnModifier).add(listHeaderNode);

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

        var timelineButton = new Surface({
            size: [150, GAME_HEADER_HEIGHT - (2 * 4)],
            content: 'View Timeline',
            classes: ['button', 'info-button', 'icon-button']
        });

        timelineButton.on('click', viewTimeline);

        listHeaderNode.add(listHeaderCS);
        listHeaderCS.add(new Modifier({
            origin: [0, 0.5]
        })).add(nameLabel);
        listHeaderCS.add(new Modifier({ transform: Transform.translate(GAME_ROW_NAME_WIDTH, 0)}))
            .add(platformLabelContainer);
        listHeaderCS.add(new Modifier({
            origin: [0, 0.5], transform: Transform.translate(GAME_ROW_NAME_WIDTH + GAME_ROW_ITEM_PLATFORM_WIDTH, 0)}))
            .add(releasedLabel);

        listHeaderCS.add(new Modifier({
            origin: [0, 0.5],
            transform: Transform.translate(GAME_ROW_NAME_WIDTH + GAME_ROW_ITEM_PLATFORM_WIDTH + GAME_ROW_ITEM_DATE_WIDTH, 0)
        })).add(timelineButton);
    }

    function viewTimeline() {
        var timeline = new Timeline(searchText, foundGames);
        sceneBox.show(timeline, {duration: 0, easing: function(){ return 1}});
    }

    /**
     * this is the "root" layout for this view
     */
    function initLayout() {
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

        layout.header.add(new Surface({
            size: [undefined, HEADER_HEIGHT],
            content: "<h1>GameGalaxy</h1>",
            classes: ["header"],
            properties: {
                lineHeight: "100px",
                textAlign: "center"
            }
        }));

        mainSurface = new Surface({
            size: [undefined, undefined],
            classes: ["main"],
            origin: [0, 0.5]
        });
        layout.content.add(mainSurface);

        initPromptMod = new Modifier({
            origin: [0, 0.25]
        });

        layout.content.add(initPromptMod)
            .add(
            new Surface({
                size: [undefined, true],
                content:   "Type a phrase in the field above to begin", elementType: 'p'})
        );


        mainContentNode = new RenderNode({
        });
        mainContentNode.add(new Modifier({
            translate: Transform.translate(ENTRY_MARGIN, ENTRY_MARGIN),
            size: [window.innerWidth - 2 * ENTRY_MARGIN, ENTRY_HEIGHT]
        }));

        layout.content.add(mainContentNode);

        footerSurface = new Surface({
            size: [undefined, FOOTER_HEIGHT],
            content: "enter a search term to begin",
            classes: ["footer"],
            properties: {
                lineHeight: "50px",
                textAlign: "center"
            }
        });
        layout.footer.add(footerSurface);

        sceneBox = new Lightbox({});
        sceneBox.show(layout, {duration: 0});

        mainContext.add(sceneBox);

        mainContext.on('resize', sizeEntrySurface);
    }

    initLayout();

    initSearchBar();

    initListContainer();

    sizeEntrySurface();

    highlightGame();

    initCallout();

    mainContext.emit('game filter update');
})
;
