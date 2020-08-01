const

  test = require( 'ava' ),
  gulpWebpack = require( '../index' ),
  gulpSourceMaps = require( 'gulp-sourcemaps' ),
  named = require( 'vinyl-named' ),
  fs = require( 'fs' ),
  through = require( 'through2' ),
  { src, dest } = require( 'gulp' ),

  isWebpackOutputEntry1 = /entry1/i,
  isWebpackOutputEntry2 = /entry2/i,
  isWebpackDevelopmentBundle = /webpackBootstrap/i;


test.before( 'cleanup', () => {
  fs.rmdirSync( 'test/out', { recursive: true });
});


test.cb( 'compile without options passed', t => {
  src( 'test/fixtures/entry1.js' )
    .pipe( gulpWebpack())
    .pipe( dest( 'test/out/no_options' ))
    .on( 'end', () => {
      fs.readFile(
        'test/out/no_options/entry1.js',
        ( err, data ) => {
          if ( err ) {
            t.fail( err.message );
          }
          t.regex( data.toString(), isWebpackOutputEntry1 );
          t.end();
        }
      );
    });
});


test.cb( 'compile piped files', t => {
  src( 'test/fixtures/entry1.js' )
    .pipe( gulpWebpack({
      wpConfig: {
        mode: 'production',
        output: {
          filename: '[name].renamed.js',
        },
      },
      logMode: 'silent'
    }))
    .pipe( dest( 'test/out/stream_entry_points' ))
    .on( 'end', () => {
      fs.readFile(
        'test/out/stream_entry_points/entry1.renamed.js',
        ( err, data ) => {
          if ( err ) {
            t.fail( err.message );
          }
          t.regex( data.toString(), isWebpackOutputEntry1 );
          t.end();
        });
    });
});


test.cb( 'compile webpack config entry points', t => {
  src( 'test/fixtures/entry1.js' )
    .pipe( gulpWebpack(
      {
        wpConfig: {
          entry: {
            entry2: './test/fixtures/entry2.js'
          }
        }
      }
    ))
    .pipe( dest( 'test/out/config_entry' ))
    .on( 'end', () => {
      fs.readFile(
        'test/out/config_entry/entry2.js',
        ( err, data ) => {
          if ( err ) {
            t.fail( err.message );
          }
          t.regex( data.toString(), isWebpackOutputEntry2 );
          t.end();
        }
      );
    });
});


test.cb( 'multi compiler support', t => {
  t.plan( 4 );
  src( 'test/fixtures/entry1.js' )
    .pipe( gulpWebpack(
      {
        wpConfig: [
          {
            mode: 'development',
            output: {
              filename: '[name]-dev.js'
            }
          },
          {
            mode: 'production',
            output: {
              filename: '[name]-prod.js'
            }
          },
        ]
      }
    ))
    .pipe( dest( 'test/out/multi-compiler' ))
    .on( 'end', () => {
      fs.readFile(
        'test/out/multi-compiler/entry1-dev.js',
        ( err, data ) => {
          if ( err ) {
            t.fail( err.message );
          }
          const fileContents = data.toString();
          t.regex( fileContents, isWebpackOutputEntry1 );
          t.regex( fileContents, isWebpackDevelopmentBundle );
          fs.readFile(
            'test/out/multi-compiler/entry1-prod.js',
            ( err, data ) => {
              if ( err ) {
                t.fail( err.message );
              }
              const fileContents = data.toString();
              t.regex( fileContents, isWebpackOutputEntry1 );
              t.notRegex( fileContents, isWebpackDevelopmentBundle );
              t.end();
            }
          );
        }
      );
    });
});


test.cb( 'vinyl objects i/o consistency', t => {
  t.plan( 1 );
  src( 'test/fixtures/entry1.js' )
    .pipe( through.obj( function transform( file, _, cb ) {
      file.test = true;
      cb( null, file );
    }))
    .pipe( gulpWebpack())
    .pipe( through.obj( function transform( file, _, cb ) {
      t.true( file.test );
      t.end();
      cb( null, file );
    }))
});


test.cb( 'compile source maps', t => {
  src( 'test/fixtures/entry1.js' )
    .pipe( gulpWebpack({
      wpConfig: {
        mode: 'development',
        devtool: 'sourcemap',
      },
      logMode: 'silent'
    }))
    .pipe( dest( 'test/out/compile_sourcemaps' ))
    .on( 'end', () => {
      fs.readFile(
        'test/out/compile_sourcemaps/entry1.js.map',
        ( err ) => {
          if ( err ) {
            t.fail( err.message );
          }
          t.end();
        });
    });
});


test.cb( 'gulp-sourcemaps support', t => {
  src( 'test/fixtures/entry1.js' )
    .pipe( gulpSourceMaps.init())
    .pipe( gulpWebpack({
      wpConfig: {
        mode: 'development',
      },
      logMode: 'silent'
    }))
    .pipe( gulpSourceMaps.write( '.' ))
    .pipe( dest( 'test/out/gulp-sourcemaps_support' ))
    .on( 'end', () => {
      fs.readFile(
        'test/out/gulp-sourcemaps_support/entry1.js.map',
        ( err ) => {
          if ( err ) {
            t.fail( err.message );
          }
          t.end();
        });
    });
});


test.cb( 'vinyl-named support', t => {
  src( 'test/fixtures/*.js' )
    .pipe( named())
    .pipe( gulpWebpack())
    .pipe( dest( 'test/out/vinyl-named_support' ))
    .on( 'end', () => {
      fs.readFile(
        'test/out/vinyl-named_support/entry1.js',
        ( err ) => {
          if ( err ) {
            t.fail( err.message );
          }
          fs.readFile(
            'test/out/vinyl-named_support/entry2.js',
            ( err ) => {
              if ( err ) {
                t.fail( err.message );
              }
              t.end();
            }
          );
        }
      );
    });
});
