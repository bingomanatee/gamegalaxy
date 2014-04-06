define(function(require, exports, module) {
    var Transitionable = require('famous/transitions/Transitionable');
    var OptionsManager = require('famous/core/OptionsManager');

    /**
     * Modifier that allows you to fade the opacity of affected renderables in and out.
     * @class Fader
     * @constructor
     * @param {Object} [options] options configuration object.
     * @param {Boolean} [options.cull=false] Stops returning affected renderables up the tree when they're fully faded when true.
     * @param {Transition} [options.transition=true] The main transition for showing and hiding.
     * @param {Transition} [options.pulseInTransition=true] Controls the transition to a pulsed state when the Fader instance's pulse
     * method is called.
     * @param {Transition} [options.pulseOutTransition=true]Controls the transition back from a  pulsed state when the Fader instance's pulse
     * method is called.
     * 
     */
    function Fader(options, startState) {
        this.options = new Object.create(Fader.DEFAULT_OPTIONS);
        this._optionsManager = new OptionsManager(this.options);

        if(options) this.setOptions(options);

        if(!startState) startState = 0;
        this.transitionHelper = new Transitionable(startState);
    }

    Fader.DEFAULT_OPTIONS = {
        cull: false,
        transition: true,
        pulseInTransition: true,
        pulseOutTransition: true,
    };

    /**
     * Patches the Fader instance's options with the passed-in ones.
     *
     * @method setOptions
     * @param {Options} options An object of configurable options for the Fader instance.
     * @chainable
     */
    Fader.prototype.setOptions = function(options) {
        return this._optionsManager.setOptions(options);
    };

    /**
     * Fully displays the Fader instance's associated renderables.
     *
     * @method show
     * @param {Transition} [transition] The transition that coordinates setting to the new state.
     * @param {Function} [callback] A callback that executes once you've transitioned to the fully shown state.
     */
    Fader.prototype.show = function(transition, callback) {
        transition = transition || this.options.transition;
        this.set(1, transition, callback);
    };

    /**
     * Fully fades the Fader instance's associated renderables.
     *
     * @method hide
     * @param {Transition} [transition] The transition that coordinates setting to the new state.
     * @param {Function} [callback] A callback that executes once you've transitioned to the fully faded state.
     */
    Fader.prototype.hide = function(transition, callback) {
        transition = transition || this.options.transition;
        this.set(0, transition, callback);
    };
    
    /**
     * Manually sets the opacity state of the fader to the passed-in one. Executes with an optional
     * transition and callback.
     *
     * @method set
     * @param {Number} state A number from zero to one: the amount of opacity you want to set to.
     * @param {Transition} [transition] The transition that coordinates setting to the new state.
     * @param {Function} [callback] A callback that executes once you've finished executing the pulse.
     */
    Fader.prototype.set = function(state, transition, callback) {
        this.halt();
        this.transitionHelper.set(state, transition, callback);
    };
    
    /**
     * Halt the transition
     *
     * @method halt
     */
    Fader.prototype.halt = function(){
        this.transitionHelper.halt();
    };
    
    /**
     * Tells you if your Fader instance is above its visibility threshold.
     *
     * @method isVisible
     * @return {Boolean} Whether or not your Fader instance is visible.
     */
    Fader.prototype.isVisible = function() {
        return (this.transitionHelper.get() > 0);
    };
    
    Fader.prototype.modify = function(target) {
        var currOpacity = this.transitionHelper.get();
        if(this.options.cull && !currOpacity) return;
        else return {opacity: currOpacity, target: target};
    };

    module.exports = Fader;
});
