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
    var ENTRY_MARGIN = 20;
    var ENTRY_HEIGHT = 70;
    var HEADER_HEIGHT = 100;
    var FOOTER_HEIGHT = 50;
    var mainContext = Engine.createContext();

    var layout = new HeaderFooterLayout({
        headerSize: 100,
        footerSize: 50
    });

    console.log('home loaded');

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
        content: "Welcome to GameGalaxy: a GiantBomb data explorer",
        classes: ["main"],
        properties: {
            lineHeight: window.innerHeight - 150 + 'px',
            textAlign: "center"
        }
    });

    layout.content.add(main);

    var renderNode = new RenderNode({
    });
    renderNode.add(new Modifier({
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
    entrySurface.add(new Modifier({origin: [0, 0.5]})
    ).add(new Surface({
            content: 'Search for games:',
            classes: ['label'],
            size: [150, 25]
        }));

    var inputSurface = new Surface({
        content: '<input id="search-input" class="search" type="text" />',
        size: [250, 25]
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
                var thisSearch = ++searchEdition;

                giantbomb.games({filter: 'name:' + encodeURIComponent(text)}, function (data) {
                    if (searchEdition == thisSearch) {
                        console.log('games containing', text, ':', data);
                    }

                    var resultViews = _.map(data.results, function(game){
                        return new Surface({
                            content: game.name,
                            size: [200, undefined],
                            classes: ['game-row']
                        });


                    });

                    scrollView.sequenceFrom(resultViews);

                });

            }, 800, text);

        })
    });

    entrySurface.add(new Modifier({
        origin: [0, 0.33],
        transform: Transform.translate(160, 0)}))
        .add(inputSurface);

    renderNode.add(new Modifier({transform: Transform.translate(ENTRY_MARGIN, ENTRY_MARGIN)}))
        .add(entryNode);

    var listContainer = new ContainerSurface({
        size: [undefined, window.innerHeight
            - (FOOTER_HEIGHT + HEADER_HEIGHT + ENTRY_HEIGHT)],
        classes: ['game-list']
    });

    var scrollView = new Scrollview({
        clipSize: 460
    });

    listContainer.add(scrollView);

    renderNode.add(new Modifier({transform: Transform.translate(0, ENTRY_HEIGHT)}))
        .add(listContainer);

    function sizeEntrySurface() {
        var size = [window.innerWidth - 2 * ENTRY_MARGIN, 50];
        entrySurface.setSize(size);
    }

    sizeEntrySurface();

    layout.content.add(renderNode);

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

    mainContext.on('resize', sizeEntrySurface)
})
;
