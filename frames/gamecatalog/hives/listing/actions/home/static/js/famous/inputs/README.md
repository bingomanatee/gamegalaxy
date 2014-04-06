-----------------------------------
Inputs: Famous user input libraries
-----------------------------------

The inputs library is used to interpret user input to the device.
Its primary concept is the 'Sync' interface.

# Files

- FastClick.js: This is used to speed up click events on some browsers.
- GenericSync.js: Combines multiple types of event handling into one standardized interface,
  for inclusion in Famo.us views.
- MouseSync.js:  Handles piped in mouse drag events.
- PinchSync.js: Handles piped in two-finger touch events to change position via pinching / expanding.
- RotateSync.js:  Handles piped in two-finger touch events to support rotation.
- ScaleSync.js:  Handles piped in two-finger touch events to increase or decrease scale via pinching / expanding.
- ScrollSync.js: Handles piped in mousewheel events.
- TouchSync.js: Handles piped in touch events.
- TouchTracker.js: Helper to TouchSync – tracks piped in touch events, organizes touch
  events by ID, and emits track events back to TouchSync.
- TwoFingerSync.js:  Helper to PinchSync, RotateSync, and ScaleSync. Handles piped in two-finger touch events

# Documentation
- launch.famo.us/docs/current/inputs
- https://github.com/Famous/internal/wiki/Famous-Sync-Overview (TODO: Revise heavily)

# Owners/Committers
- mark@famo.us

