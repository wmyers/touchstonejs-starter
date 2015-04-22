var del = require('del'),
	gulp = require('gulp'),
	gutil = require('gulp-util'),
	less = require('gulp-less'),
	plumber = require('gulp-plumber'),
	shell = require('gulp-shell'),
	browserify = require('browserify'),
	brfs = require('brfs'),
	watchify = require('watchify'),
	reactify = require('reactify'),
	source = require('vinyl-source-stream'),
	merge = require('merge-stream'),
	chalk = require('chalk');

/**
 * Check that a compatible version of gulp is available in the project
 */

function fatal(err) {
	var msg = '\n\n';
	if (Array.isArray(err)) {
		err.forEach(function(i) {
			msg += i + '\n\n';
		});
	} else {
		msg += (err || 'Fatal error, bailing.') + '\n\n';
	}
	console.log(msg);
	process.exit(1);
}

try {
	var projectGulpVersion = require(module.parent.paths[0] + '/gulp/package.json').version;
} catch(e) {
	// If we can't find gulp in the parent project, it's a fatal problem.
	fatal(
		'You do not seem to have Gulp installed in your project.',
		'Please add gulp ^' + packageGulpVersion + ' to your package.json, npm install and try again.'
	);
}
try {
	// Check to make sure the local gulp and the project gulp match.
	var packageGulpVersion = require('./node_modules/gulp/package.json').version;
	if (semver.satisfies(projectGulpVersion, '^' + packageGulpVersion)) {
		fatal(
			'You do not have the correct version of Gulp installed in your project.',
			'Please add gulp ^' + packageGulpVersion + ' to your package.json, npm install and try again.'
		);
	}
} catch(e) {
	// Assume gulp has been loaded from ../node_modules and it matches the requirements.
}

/**
 * This package exports a function that binds tasks to a gulp instance
 */

module.exports = function(gulp) {

	/**
	* Clean
	*/

	gulp.task('clean', function() {
		del(['./www/*']);
	});


	/**
	* Preview Server
	*/

	gulp.task('serve', function() {
		var express = require('express');
		var app = express();
		
		app.use(express.static('./www'));
		
		var server = app.listen(process.env.PORT || 8000, function() {
			console.log('Local Server ready on port %d', server.address().port);
		});
	});


	/**
	* Build
	*/

	gulp.task('less', function() {
		return gulp.src('src/css/app.less')
		.pipe(less())
		.pipe(gulp.dest('www/css'));
	});

	gulp.task('html', function() {
		return gulp.src('src/index.html')
		.pipe(gulp.dest('www'));
	});

	gulp.task('images', function() {
		return gulp.src('src/img/**')
		.pipe(gulp.dest('www/img'));
	});

	gulp.task('fonts', function() {
		return gulp.src('src/fonts/**')
		.pipe(gulp.dest('www/fonts'));
	});

	function doBundle(target, name, dest) {
		return target.bundle()
		.on('error', function(e) {
			gutil.log('Browserify Error', e);
		})
		.pipe(source(name))
		.pipe(gulp.dest(dest));
	}

	function watchBundle(target, name, dest) {
		return watchify(target)
		.on('update', function (scriptIds) {
			scriptIds = scriptIds
			.filter(function(i) { return i.substr(0,2) !== './' })
			.map(function(i) { return chalk.blue(i.replace(__dirname, '')) });
			if (scriptIds.length > 1) {
				gutil.log(scriptIds.length + ' Scripts updated:\n* ' + scriptIds.join('\n* ') + '\nrebuilding...');
			} else {
				gutil.log(scriptIds[0] + ' updated, rebuilding...');
			}
			doBundle(target, name, dest);
		})
		.on('time', function (time) {
			gutil.log(chalk.green(name + ' built in ' + (Math.round(time / 10) / 100) + 's'));
		});
	}

	function buildApp(watch) {
		
		var opts = watch ? watchify.args : {};
		
		opts.debug = watch ? true : false;
		opts.hasExports = true;
		
		var src = './src/js',
		dest = './www/js',
		name = 'app.js';
		
		var bundle = browserify(opts)
			.add([src, name].join('/'))
			.transform(reactify)
			.transform(brfs);
		
		if (watch) {
			watchBundle(bundle, name, dest);
		}
		
		return doBundle(bundle, name, dest);
		
	}

	gulp.task('scripts', function() {
		return buildApp();
	});

	gulp.task('watch-scripts', function() {
		return buildApp(true);
	});

	gulp.task('build', ['html', 'images', 'fonts', 'less', 'scripts']);

	gulp.task('watch', ['html', 'images', 'fonts', 'less', 'watch-scripts'], function() {
		gulp.watch(['src/index.html'], ['html']);
		gulp.watch(['src/css/**/*.less'], ['less']);
		gulp.watch(['src/img/**/*.*'], ['images']);
		gulp.watch(['src/fonts/**/*.*'], ['fonts']);
	});

	gulp.task('dev', ['watch', 'serve']);

	function setConfigXml(options) {
		var Q = require('q');
		var fs = require('fs');
		var path = require('path');
		var xml2js = require('xml2js');
		var d = Q.defer();

		var self = this;
		var madeChange = false;

		try {
			var configXmlPath = path.resolve('config.xml');

			if(!fs.existsSync(configXmlPath)) {
				// working directory does not have the config.xml file
				if(options.errorWhenNotFound) {
					d.reject('Unable to locate config.xml file. Please ensure the working directory is at the root of the app where the config.xml should be located.');
				} else {
					d.resolve();
				}
				return d.promise;
			}

			var configString = fs.readFileSync(configXmlPath, { encoding: 'utf8' });

			var parseString = xml2js.parseString;
			parseString(configString, function (err, jsonConfig) {
				if(err) {
					d.reject(err);
					return self.fail('Error parsing ' + configXmlPath + ': ' + err);
				}

				if(!jsonConfig.widget) {
					throw new Error('\nYour config.xml file is invalid. You must have a <widget> element.');
				} else if(jsonConfig.widget && !jsonConfig.widget.content) {
					throw new Error('\nYour config.xml file does not have a <content> element. \nAdd something like: <content src="index.html"/>');
				}

				if(options.devServer) {
					if( !jsonConfig.widget.content[0].$['original-src'] ) {
						jsonConfig.widget.content[0].$['original-src'] = jsonConfig.widget.content[0].$.src;
						madeChange = true;
					}
					if(jsonConfig.widget.content[0].$.src !== options.devServer) {
						jsonConfig.widget.content[0].$.src = options.devServer;
						madeChange = true;
					}

				} else if(options.resetContent) {

					if( jsonConfig.widget.content[0].$['original-src'] ) {
						jsonConfig.widget.content[0].$.src = jsonConfig.widget.content[0].$['original-src'];
						delete jsonConfig.widget.content[0].$['original-src'];
						madeChange = true;
					}
				}

				if(madeChange) {
					var xmlBuilder = new xml2js.Builder();
					configString = xmlBuilder.buildObject(jsonConfig);
					fs.writeFileSync(configXmlPath, configString);
				}

				d.resolve();
			});

		} catch(e) {
			d.reject(e);
			self.fail('Error updating ' + configXmlPath + ': ' + e);
		}

		return d.promise;
	}
	
	gulp.task('live', ['watch', 'serve'], function() {
		setConfigXml({ devServer: 'localhost:8000' });
		return gulp.src('')
		.pipe(plumber())
		.pipe(shell(['cordova prepare'], { cwd: __dirname }));
	});

	/**
	* Cordova
	*/

	gulp.task('prepare', ['html', 'images', 'fonts', 'less', 'scripts'], function() {
		return gulp.src('')
		.pipe(plumber())
		.pipe(shell(['cordova prepare'], { cwd: __dirname }));
	});

	gulp.task('android', ['prepare'], function() {
		return gulp.src('')
		.pipe(plumber())
		.pipe(shell(['cordova run android'], { cwd: __dirname }));
	});
	
}