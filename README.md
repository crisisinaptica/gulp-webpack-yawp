# gulp-webpack-yawp

Yet another Webpack plugin (for Gulp)

## Motivation

After some time using `webpack-stream` I hit a limitation with it: The vinyl object piped out is not the same one as the one piped in.

I need some custom properties on the vinyl objects for my gulp setup, so this was a show stopper. The custom properties were not available after the files were piped into the plugin.

I decided to fix this problem and PR, but as I read and understood the code I decided to change so much stuff that it was beyond a PR.

`webpack-stream` creates some basic webpack configuration that applies. `gulp-webpack-yawp` does not.

## Getting Started

### Prerequisites

This plugin only works with Webpack 4.

### Installing

```
npm i --save-dev gulp-webpack-yawp
```

### Usage

Example gulp task:
```
const
  { src, dest } = require( 'gulp' ),
  webpack = require( 'gulp-webpack-yawp' );

exports.default = function compileJs() {
  return src( 'src/js/*.js' )
    .pipe( webpack())
    .pipe( dest( 'output/' )
}
```

#### Plugin options

The plugin accepts a configuration object with the following properties:

| property     	| type    	| default     	| values                       	| description                    	|
|--------------	|---------	|-------------	|------------------------------	|--------------------------------	|
| webpack      	|  object 	|      --     	|              --              	| Webpack instance              	|
| wpConfig     	|  object 	|      --     	|              --              	| Webpack configuration          	|
| logMode      	|  string 	|   'silent'  	| 'silent', 'stats', 'verbose' 	| Webpack log mode              	|
| statsOptions 	|  object 	| [see below] 	|              --              	| Options for log mode 'stats'   	|
| verbose      	| boolean 	|    false    	|              --              	| Plugin verbose mode              	|
| watch        	| boolean 	|    false    	|              --              	| Use webpack in watch mode      	|
| watchOptions 	|  object 	| [see below] 	|              --              	| Options for watch mode         	|

##### webpack
A webpack instance. If passed it will be cached for subsequent usage.

##### wpConfig
A [webpack configuration](https://webpack.js.org/configuration/) object.

##### logMode
Log mode for webpack to use. Choose between 'silent', 'verbose' or 'stats'.
 
If 'stats' is passed, an additional option can be used to specify what's going to get logged.

##### statsOptions
A [stats options](https://webpack.js.org/configuration/stats/#stats-options) object for webpack to use.

Defaults to:
```
{
  builtAt: false,
  chunks: false,
  children: false,
  hash: false,
  modules: false,
  performance: true,
  warnings: true,
}
```

##### verbose
Plugin verbosity.

##### watch
Initiate webpack in watch mode. If `true`, an additional `watchOptions` object can be passed.

##### watchOptions
A [watch options](https://webpack.js.org/configuration/watch/#watchoptions) object.

Defaults to:
```
{
  builtAt: false,
  chunks: false,
  colors: TERMINAL_HAS_COLOR,
  children: false,
  hash: false,
  modules: false,
  performance: true,
  warnings: true,
}
```
#### Compatibility with other plugins

This plugin supports:

* [vinyl-named](https://www.npmjs.com/package/vinyl-named)
* [gulp-sourcemaps](https://www.npmjs.com/package/gulp-sourcemaps)

## Running the tests

```
npm run test
```

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/crisisinaptica/gulp-webpack-yawp/tags). 

## Contributing

Issues and PR are welcomed.

## Authors

* **Sergio Jiménez Herena** - *Initial work* - [crisisinaptica](https://github.com/crisisinaptica)

See also the list of [contributors](https://github.com/crisisinaptica/gulp-webpack-yawp/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments

* This plugin takes inspiration from [webpack-stream](https://github.com/shama/webpack-stream) by Kyle Robinson Young.

* [This template](https://gist.github.com/PurpleBooth/109311bb0361f32d87a2) was used for the readme.
