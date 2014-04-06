-----------------------------------
Core: Famous core libraries
-----------------------------------

# Files
- Context.js: The top-level container for a Famous-renderable piece of the document.
- ElementAllocator.js: Internal helper object to Context that handles the process of creating and allocating DOM elements within a managed div (for internal engine only).
- Engine.js: The singleton object initiated upon process startup which manages all active Contexts, runs  the render dispatch loop, and acts as a listener and dispatcher for events.
- Entity.js:  A singleton that maintains a global registry of rendered surfaces (for internal engine only).
- EventEmitter.js: This represents a channel for events.
- EventHandler.js: EventHandler forwards received events to a set of provided callback functions. It allows events to be captured, processed, and optionally piped through to other event handlers.
- Group.js: An internal Context designed to contain surfaces and set properties to be applied to all of them at once (for internal engine only).
- Modifier.js:   A collection of visual changes to be applied to another renderable component.
- OptionsManager.js: A collection of methods for setting options which can be extended onto other classes.
- RenderNode.js: A wrapper for inserting a renderable component (like a Modifer or Surface) into the render tree.
- Scene.js: Builds and renders a scene graph based on a declarative structure definition.
- SpecParser.js: This object translates the rendering instructions that renderable components generate 
     into direct document update instructions (for internal engine only).
- Surface.js:  A base class for viewable content and event targets inside a Famous appliscation.
- Transform.js: A high-performance matrix math library used to calculate affine transforms on surfaces and other renderables.
- View.js: Useful for quickly creating elements within applications with large event systems.
- ViewSequence.js: Helper object used to iterate through items sequentially. Used in Famo.us views that deal with layout.


# Documentation
- launch.famo.us/docs/current/core

- https://github.com/Famous/internal/wiki/Core-Concepts (TODO: move off of internal wiki when finished)
- https://github.com/Famous/internal/wiki/Core-Interfaces  (TODO: move off of internal wiki when finished)
- https://github.com/Famous/internal/wiki/How-Famous-Works (TODO: move off of internal wiki when finished)
- https://github.com/Famous/internal/wiki/Layout-and-Sizing (TODO: move off of internal wiki when finished)
- https://github.com/Famous/internal/wiki/The-render-spec (TODO: move off of internal wiki when finished)

# Owners/Committers
- mark@famo.us
