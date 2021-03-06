var hive_loader = require('hive-loader');
var layouts_handler = require('./../handlers/layouts_handler');
var _DEBUG = false;
var util = require('util');

module.exports = function(root){
	if (_DEBUG)	console.log('layouts_dir_loader: looking for layout directories in %s for apiary ', root, util.inspect(apiary, false, 0));
	var loader = hive_loader.loader({}, {root: root, handlers: [layouts_handler()]});
	return loader;
};