const

  test = require( 'ava' ),
  gulpWebpack = require( '../index' ),
  fs = require( 'fs' ),
  { src, dest } = require( 'gulp' ),

  isWebpackOutputEntry1 = /entry1/i,
  isWebpackOutputEntry2 = /entry2/i;


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
  t.plan( 1 );
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
  t.plan( 2 );
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
        err => {
          if ( err ) {
            t.fail( err.message );
          }
          t.pass();
          fs.readFile(
            'test/out/multi-compiler/entry1-prod.js',
            err => {
              if ( err ) {
                t.fail( err.message );
              }
              t.pass();
              t.end();
            }
          );
        }
      );
    });
});


test.todo( 'vinyl objects i/o consistency' );


test.todo( 'compile sourcemaps' );


test.todo( 'gulp-sourcemaps support' );


test.todo( 'vinyl-named support' );
