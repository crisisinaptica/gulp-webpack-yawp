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
  webpack = require( 'webpack' ),
  applySourceMap = require( 'vinyl-sourcemaps-apply' ),

  TERMINAL_HAS_COLOR = require( 'supports-color' ).stdout.hasBasic,

  defaultStatsOptions = {
    builtAt: false,
    chunks: false,
    colors: TERMINAL_HAS_COLOR,
    children: false,
    hash: false,
    modules: false,
    performance: true,
    warnings: true,
  },

  testIsFileName = /(?<name>^.*)(?<ext>\..*$)/,
  testIsSourceMap = /(?:[^.]*\/)(?<fileName>.*)(?:\.map.*)/;

let

  memoryFileSystemCache;


/**
 * @typedef {object} yawpOptions
 * @property {object} wpConfig
 *   Webpack configuration
 * @property {object} statsOptions
 *   Stats to after compilation is done
 * @property {boolean} verbose
 *   Verbose output
 * @property {boolean} watch
 *   Execute webpack in watch mode
 * @property {object} watchOptions
 *   Webpack watch mode options
 */


/**
 * @param {yawpOptions} pluginOptions - Webpack configuration
 * @returns {stream} Node stream
 */
function gulpWebpack( pluginOptions ) {

  if ( typeof pluginOptions !== 'object' ) {
    this.emit( 'error', new PluginError({
      plugin: PLUGIN_NAME,
      message: 'No option object provided.',
    }));
  }

  const

    {
      statsOptions,
      verbose,
      watch,
      watchOptions,
      wpConfig,
    } = pluginOptions,

    [
      config,
      multiConfig,
    ] = Array.isArray( wpConfig ) ?
      [
        null,
        wpConfig.map( config => clone( config )),
      ] :
      [
        clone( wpConfig ),
        null
      ],

    files = new Map();


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
      this.emit( 'error', new PluginError({
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
      this.emit( 'end' );
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
            this.emit( 'error', new PluginError({
              plugin: PLUGIN_NAME,
              message: stats.toJson().errors.join( '\n' )
            }));
          }
        }
        if ( verbose ) {
          log( stats.toString({
            colors: TERMINAL_HAS_COLOR,
          }));
        } else {
          log( stats.toString( merge(
            defaultStatsOptions,
            statsOptions || {},
            { colors: TERMINAL_HAS_COLOR }
          )));
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
            memoryFileSystemCache || new MemoryFileSystem();
        memoryFileSystemCache = memoryFileSystem;
        compiler.hooks.afterEmit.tap(
          PLUGIN_NAME,
          compilation => {
            Reflect.ownKeys( compilation.assets ).forEach( outName => {
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
                  const mappedSource = files.get( matchResult.groups.fileName );
                  if ( mappedSource && mappedSource.sourceMap ) {
                    applySourceMap( mappedSource, outContents.toString());
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

  return through.obj( transform, flush );

}


module.exports = gulpWebpack;
