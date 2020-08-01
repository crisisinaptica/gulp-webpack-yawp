'use strict';

/**
 * Yet another Webpack plugin (for Gulp)
 *
 * @author Sergio Jiménez Herena
 * @module gulp-webpack-yawp
 * @version 0.1.0
 * @license MIT
 */


const

  PLUGIN_NAME = 'gulp-webpack-yawp',

  //  node
  { join } = require( 'path' ),
  stream = require( 'stream' ),

  // npm modules
  File = require( 'vinyl' ),
  MemoryFileSystem = require( 'memory-fs' ),
  PluginError = require( 'plugin-error' ),
  log = require( 'fancy-log' ),
  through = require( 'through2' ),
  { clone, merge } = require( 'lodash' ),
  applySourceMap = require( 'vinyl-sourcemaps-apply' ),

  TERMINAL_HAS_COLOR = require( 'supports-color' ).stdout.hasBasic,
  testIsFileName = /(?<name>^.*)(?<ext>\..*$)/,
  testIsSourceMap = /(?:[^.]*\/)(?<fileName>.*)(?:\.map.*)/;


let

  cache = {
    webpackInstance: null,
    wpConfig: null,
    memoryFilesystem: null,
  };


/**
 * @typedef {object} yawpOptions
 * @property {object} webpack
 *   Webpack instance
 * @property {object} wpConfig
 *   Webpack configuration
 * @property {string} [logMode=silent]
 *   Valid values are 'stats', 'silent', verbose'
 * @property {object} statsOptions
 *   Stats to after compilation is done
 * @property {boolean} [verbose=false]
 *   Verbose output
 * @property {boolean} [watch=false]
 *   Execute webpack in watch mode
 * @property {object} watchOptions
 *   Webpack watch mode options
 */


/**
 * @param {yawpOptions} pluginOptions
 *   Plugin configuration
 * @returns {stream} Node stream
 */
function gulpWebpack( pluginOptions ) {

  if (
    pluginOptions &&
    (
      pluginOptions.webpack !== cache.webpackInstance ||
      pluginOptions.wpConfig !== cache.wpConfig
    )
  ) {
    cache = {};
  }

  const

    {
      logMode,
      statsOptions,
      watch,
      watchOptions,
      webpack,
      wpConfig,
    } = merge(
      // defaults
      {
        logMode: 'silent',
        statsOptions: {
          builtAt: false,
          chunks: false,
          colors: TERMINAL_HAS_COLOR,
          children: false,
          hash: false,
          modules: false,
          performance: true,
          warnings: true,
        },
        verbose: false,
        watch: false,
        watchOptions: {
          builtAt: false,
          chunks: false,
          colors: TERMINAL_HAS_COLOR,
          children: false,
          hash: false,
          modules: false,
          performance: true,
          warnings: true,
        },
        webpack: ( function evalWebpackInstance() {
          const webpack = cache.webpackInstance || require( 'webpack' );
          cache.webpackInstance = webpack;
          return webpack;
        }()),
        wpConfig: ( function evalWebpackConfig() {
          const config = cache.webpackConfig || null;
          cache.webpackConfig = config;
          return config;
        }()),
      },
      // user configuration
      pluginOptions || {},
    ),

    [
      config,
      multiConfig,
    ] = Array.isArray( wpConfig ) ?
      [
        null,
        wpConfig.map( config => clone( config )) || {},
      ] :
      [
        clone( wpConfig ) || {},
        null
      ],

    files = new Map(),

    newStream = through.obj( transform, flush );

  return newStream;


  /**
   * @param {File} file - A Vinyl object
   * @param {string} encoding - The file encoding
   * @param {Function} transformCb - Stream _transform callback
   */
  function transform( file, encoding, transformCb ) {

    if ( file.isNull()) {
      transformCb( null, file );
      return;
    }

    if ( !file.isBuffer()) {
      newStream.emit( 'error', new PluginError({
        plugin: PLUGIN_NAME,
        message: 'Only buffers are supported.'
      }));
    }

    files.set( file.basename, file );
    transformCb( null );

  }


  /**
   * @param {Function} flushCb - Stream _flush callback
   */
  function flush( flushCb ) {

    if ( !files.size ) {
      log.warn( `${ PLUGIN_NAME }: No files were piped in.` );
      newStream.emit( 'end' );
      flushCb( null );
    }

    const

      addSources = config => {
        config.entry = config.entry || {};
        files.forEach(( file, fileName ) => {
          const entryName = fileName.match( testIsFileName ).groups.name;
          config.entry[ entryName ] = file.path;
        });
        return config;
      },


      logStats = stats => {

        if ( stats.hasErrors()) {
          if ( !watch ) {
            newStream.emit( 'error', new PluginError({
              plugin: PLUGIN_NAME,
              message: stats.toJson().errors.join( '\n' )
            }));
          }
        }

        switch ( logMode ) {
        default: case 'stats':
          log( stats.toString( statsOptions ));
          break;
        case 'verbose':
          log( stats.toString({ colors: TERMINAL_HAS_COLOR }));
          break;
        case 'silent':
          return;
        }

        if ( watch ) {
          log( 'Webpack is watching...' );
        }
      },


      notifyCb = ( err, stats ) => {
        if ( err ) {
          this.emit( 'error', new PluginError({
            plugin: PLUGIN_NAME,
            message: err.stack || err
          }));
          return;
        }
        stats.stats ?
          stats.stats.forEach( logStats ) :
          logStats( stats );
        if ( !watch ) {
          flushCb( null );
        }
      },


      setUpCompiler = compiler => {
        const memoryFileSystem = compiler.outputFileSystem =
          cache.memoryFilesystem || new MemoryFileSystem();
        cache.memoryFilesystem = memoryFileSystem;
        compiler.hooks.afterEmit.tap(
          PLUGIN_NAME,
          compilation => {
            Reflect.ownKeys( compilation.assets )
              // eslint-disable-next-line no-inline-comments
              .forEach( /** @type {string} */outName => {
                const
                  outPath = join( compiler.outputPath, outName ),
                  outContents = memoryFileSystem.readFileSync( outPath );
                if ( files.has( outName )) {
                  const sourceFile = files.get( outName );
                  sourceFile.contents = outContents;
                  this.push( sourceFile );
                } else {
                  const matchResult = outName.match( testIsSourceMap );
                  if ( matchResult && matchResult.groups ) {
                    const mapSource = files.get( matchResult.groups.fileName );
                    if ( mapSource && mapSource.sourceMap ) {
                      applySourceMap( mapSource, outContents.toString());
                      return;
                    }
                  }
                  this.push( new File({
                    base: compiler.outputPath,
                    path: join( compiler.outputPath, outName ),
                    contents: outContents,
                  }));
                }
              });
          }
        )
      },


      compiler = webpack(
        multiConfig ?
          multiConfig.map( addSources ) :
          addSources( config )
      );


    multiConfig ?
      compiler.compilers.forEach( setUpCompiler ) :
      setUpCompiler( compiler );

    watch ?
      compiler.watch( watchOptions, notifyCb ) :
      compiler.run( notifyCb );

  }

}


module.exports = gulpWebpack;
