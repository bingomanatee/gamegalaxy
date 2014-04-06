-----------------------------------
Physics: Famo.us core physics engine
-----------------------------------

Core engine controlling animations through physical simulation.

# Files
- bodies/Body.js: A unit controlled by the physics engine which serves to provide position and orientation.
- bodies/Circle.js: An elemental circle-shaped Body in the physics engine.
- bodies/Particle.js:  A unit controlled by the physics engine which serves to provide position.
- bodies/Rectangle.js: An elemental rectangle-shaped Body in the physics engine.
- constraints/Collision.js: TODO
- constraints/Collision.js: TODO
- constraints/Constraint.js: TODO
- constraints/Curve.js: TODO
- constraints/Distance.js: TODO
- constraints/Distance1D.js: TODO
- constraints/Rod.js: TODO
- constraints/Rope.js: TODO
- constraints/StiffSpring.js: TODO
- constraints/Surface.js: TODO
- constraints/Wall.js: TODO
- constraints/Walls.js: TODO
- forces/Drag.js: Drag is a force that opposes velocity.
    Attach it to the physics engine to slow down a physics body in motion.
- forces/Force.js: Force base class.
- forces/Repulsion.js: Repulsion is a force that repels (attracts) bodies away (towards) each other.
- forces/RotationalDrag.js:  Rotational drag is a force that opposes angular velocity.
    Attach it to a physics body to slow down its rotation.
- forces/RotationalSpring.js:  A force that rotates a physics body back to target Euler angles.
- forces/Spring.js: A force that moves a physics body to a location with a spring motion.
- forces/VectorField.js: TODO
- integrators/SymplecticEuler.js:  Ordinary Differential Equation (ODE) Integrator.
  Manages updating a physics body's state over time.
- integrators/verlet.js:  Manages updating a physics body's state over time. (deprecated)
- PhysicsEngine.js: TODO

# Documentation
- launch.famo.us/docs/current/physics
- TODO: Add physics doc.

# Owners/Committers
- david@famo.us



Famous' Physics Framwork
==================
The framework has three main parts that application developers should expect to use:

Bodies
----------
Bodies represent physical objects. For example, the Circle class represents a solid ball, the Rectangle class represents a solid rectangular prism.

Constraints
---------
Constraints represent ways that objects can be connected. For example, you might want two objects to behave as is there were a Rope or a StiffSpring connecting them.

Forces
---------
Forces can be thought of as soft constraints. So while StiffSpring is a constraint, Spring is a force. TODO: @dmvaldman, can you explain forces better?
