/*
 * grunt-cmd-commonjs
 * https://github.com/xh1021/commonjs
 *
 * Copyright (c) 2015 huixu 
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path')

module.exports = function(grunt) {
	var loader = grunt.file.read(path.resolve(__dirname, 'lib', 'loader.js'))

	grunt.file.defaultEncoding = 'utf8';
	grunt.file.preserveBOM = false;

	grunt.registerMultiTask('commonjs', 'commonjs grunt', function() {
		var options = this.options({
			punctuation: '.',
			separator: ', '
		});

		this.files.forEach(function(f) {
			var src = f.src.filter(function(filepath) {
				var fanaljs = []
				fanaljs.push(loader)

				var depends = getDepends(filepath)
				depends.forEach(function(dependpath){
					fanaljs.push(getDefineJS(dependpath + '.js'))
				})

				fanaljs.push(getDefineJS(filepath))

				var fanalpath = path.join(f.dest, filepath)
				grunt.file.write(fanalpath, fanaljs.join('\n'));
				grunt.log.oklns('File "' + fanalpath + '" created.');

			})

			function getDepends(filepath, deps){
				var depends = deps || []
				var js = getFile(filepath)
				var jsLine = js.split('\n')
				var reg = /\brequire\b/

				function require(modName){

					if (modName === getName(filepath)){
						grunt.log.errorlns('Error File "' + filepath + '" 调用自身.');
						return;
					}

					if (modName && depends.indexOf(modName) == -1){
						//	depends.splice(0,0,modName)
						depends.push(modName)
							getDepends(modName+'.js', depends)
					}
				}

				jsLine.forEach(function(line){
					if (!reg.test(line))  return

					line = line.replace(/,/g , ';')

					try {
						var evaFn = new Function('require' , line)
						evaFn(require)

					}catch(err){
						grunt.log.errorlns(err, line)
					}

				})

				//console.log(filepath, depends)
				return depends
			}

			function getFile(filepath){
				return grunt.file.read(path.join(f.cwd, filepath))
			}
			function getName(filepath){
				return filepath.replace(/\.js$/, '') 
			}

			function getDefineJS(filepath){
				return 'define("' + getName(filepath) + '",function(require){\n'
						+ getFile(filepath)
						+ '\n});' 
			}

		});
	});
};

