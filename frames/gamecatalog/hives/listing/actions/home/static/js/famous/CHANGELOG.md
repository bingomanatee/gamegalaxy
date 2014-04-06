Change Log
===========

**0.0.3**

- Global
	- License and copyright headers
	- YUI documentation (in progress)
	- Named functions (in progress)

- CORE
	- UPDATED: ViewSequence.js - performance, backing.
	- UPDATED: Transform.js - has `inFront`, `behind` attributes
	- UPDATED: Options Manager.js - has patch for `null` keys
	- UPDATED: README.md
	- Linting

- Events
	- ADDED: README.md

- Inputs
	- RENAMED: Input → Inputs (directory)
	- Linting

- Math
	- UPDATED: Random.js - for singleton pattern
	- UPDATED: Matrix.js - has Matrix.clone method
	- ADDED: Utilities.js - has clamp and map
	- ADDED: README.md

- Modifiers
	- DELETED: Camera.js
	- DELETED: Swappable.js
	- ADDED: README.md

- Physics
    - DELETED: Constraints/Rope.js
    - DELETED: Integrators/Verlet.js
    - DELETED: Constraints/Collision.js
	- RENAMED: RotationDrag → RotationalDrag
	- RENAMED: CollisionJacobian → Collision
	- RENAMED: StiffSpring → Snap
	- ADDED: README.md
	- Event inheritance from Force.js and Constraint.js base classes
	- Timestepping refactor
	- Cached specs and transforms for performance
	- `DEFAULT_OPTIONS` for forces and constraints
	- Verbose naming `p` → `position`, `opts` → `options`, etc

- Surfaces
	- DELETED: WebGLSurface
	- CSS CHANGE: Update to the latest famous.css to get the .famous-container-group (assigned to Container Surfaces) class inside of your famous.css. 
	- ADDED: README.md

- Transitions
	- Verbose naming, `p` → `position`, `v` → `velocity`
	- `Utility.curves` has been replaced by `TweenTransition.curves`
	- RENAMED: StiffSpringTransition.js → SnapTransition.js
	- ADDED: README.md

- Utilities
	- UPDATED: Utility.js - removed the deprecated functions
	    - .getSurfacePosition, device navigator methods → Famous/miscellaneous/getSurfacePosition
	    - .transformInFront/Behind → Famous/transitions/TweenTransition.js
	    - .clamp, .map → Famous/math/Utilities.js
	- UPDATED: KeyCodes.js - capitalized keycodes
	- ADDED: Deprecate.js (needs refactoring)
	- ADDED: README.md

- Views
	- DELETED: ImageFader.js
	- DELETED: Swappable.js
	- DELETED: TableView.js
	- DELETED: CardsLayout.js
	- DELETED: DragSort.js
	- DELETED: LinkedNode.js
	- DELETED: MediaReader.js
	- DELETED: Modal.js
	- DELETED: RenderArbiter.js
	- DELETED: SatelliteMenu.js
	- DELETED: Shaper.js
	- UPDATED: scrollview.js to Physics APIs
	- UPDATED: Fader.js - consistent APIs
	- UPDATED: RenderController.js - default transform map is identity
	- UPDATED: Flip.js - API consistency
	- BUG FIX: HeaderFooterLayout.js -  origin and sizing
	- ADDED: README.md

- Widgets
	- DELETED: IconBar.js
	- DELETED: InfoBox.js
	- DELETED: ShrinkContainer.js
	- DELETED: TitleBar.js
	- MOVED: FeedItem.js to twitter-s1/src/app
	- ADDED: README.md
	- UPDATED: NavigationBar.js - uses `Transform.inFront/behind`
	- UPDATED: ToggleButton.js - refactored to use RenderController instead of ImageFader

**0.0.2**

- Global
  - added Mozilla licenses and owners
  - added famous-events module
- Core
  - `RenderNode.set` added
  - `Modifier` now accepts data sources
  - *bug fix*: `SpecParser` sizing and origins
  - *bug fix*: `ElementAllocator` deallocates with `display : none`
- Math
  - added `Matrix` module
- Surfaces
  - `InputSurface` improvements
  - *bug fix*: surface events removed in favor of subscribe eventing model
- Transitions
  - `TransitionableTransform` added
  - `CachedMap` added for performance improvements
- Views
  - `Lightbox` renamed to `RenderController`
  - `RenderController` and `EdgerSwapper` use mapping
  - `DragSort` updated
  - Improvements to `RenderController`, `HeaderFooterLayout`
- Widgets
  - `TitleBar` updated to new APIs
  - `TabBar` updated to new APIs
  - `FeedStream` and `NavMenu` deprecated

**0.0.1**

- removed famous-templates submodule
- famous-inputs have optional targetGet
- Entity has `unregister` method
- Performance improvements

**0.0.0**

- `.add()` interface replacing add/link scene graph construction
- matrix renamed to transform
- Protected class member renames: instance variables and methods that are considered protected are now indicated via an underscore `_`. In View.js, the following changes have been made:
    - `eventOutput` renamed to `_eventOutput`
    - `eventInput` renamed to `_eventInput`
    - `optionsManager` renamed to `_optionsManager`

- famous-utilities/Utility.js has now absorbed famous-utilities/Utils.js and many methods have been assigned for deprecation.
- famous-modifiers/ModifierChain.js has been created to have a convenience to add and remove modifiers dynamically.
