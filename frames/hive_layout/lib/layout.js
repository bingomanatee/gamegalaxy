var Component = require('hive-component');
var path = require('path');
var _DEBUG = false;
var util = require('util');

var loads = 0;

module.exports = function (apiary, callback){

    console.log('loading layout: %s', loads++);
    if (loads > 1) throw new Error('multiple loads of layout');

	var _mixins = {

	};

	function Layout(root) {
		function _load(cb) {
			var ll = require('./loaders/layout_loader')(this);
			ll.core(apiary);
			ll.load(function () {
				cb();
			})
		}

		function _static(cb) {
			var static = this.get_config('static');
			if (static) {
				this.static = apiary.Static({}, {
					map:  static,
					root: path.resolve(this.get_config('root'), 'static')
				});
				this.static.init();
			}
			cb();
		}

		function _enlist(cb) {
			if (_DEBUG) {
				console.log('enlisting layout');
			}
			var root = this.get_config('root');
			if (!root) {
				if (_DEBUG) {
					console.log('attempting to enlist layout - no root');
				}
				root = this.component_id; // gotta have something...
			}
			this.$root = root;

			var existing_root = layout_model.get(root);
			if (existing_root) {
				throw new Error('redundant layout for root %s', root);
			}
			if (_DEBUG) {
				console.log('putting a layout in the model');
			}
			layout_model.put(this);
            if (_DEBUG) console.log('layouts: %s', util.inspect(layout_model.all().records()));
			cb();
		}

		function _emit(cb) {
			if (_DEBUG) {
				console.log('emitting layout %s', this.get_config('root'));
			}
			apiary.emit('layout', this);
			cb();
		}


		if (_DEBUG) {
			console.log('Layout: creating a layout for %s', root);
		}
		return Component(_mixins, {
			root:       root,
			init_tasks: [
				_load,
				_enlist,
				_static,
				_emit]
			,
            apiary: apiary});
	}

	var layout_model = apiary.Model({_pk: 'name', name: '$layouts'}, {}, function(){

		Layout.list = layout_model;
		apiary.Layout = Layout;

		callback();

	});

};