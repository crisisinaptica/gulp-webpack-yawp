const

  test = require( 'ava' ),
  gulpWebpack = require( '../index' ),
  fs = require( 'fs' ),
  { src, dest } = require( 'gulp' ),

  isWebpackOutputEntry1 = /entry1/i,
  isWebpacOutputEntry2 = /entry2/i;


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


test.todo( 'compiles webpack config entry points' );


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


test.todo( 'compiles mixed entry points' );


test.todo( 'multi compiler support' );


test.todo( 'vinyl objects i/o consistency' );


test.todo( 'compile sourcemaps' );


test.todo( 'gulp-sourcemaps support' );


test.todo( 'vinyl-named support' );
