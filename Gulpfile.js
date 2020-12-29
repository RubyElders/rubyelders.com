var gulp = require('gulp');
var clean = require('gulp-clean');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var mq4HoverShim = require('mq4-hover-shim');
var rimraf = require('rimraf').sync;
var browser = require('browser-sync');
var panini = require('panini');
var concat = require('gulp-concat');
var port = process.env.SERVER_PORT || 8080;
var nodepath =  'node_modules/';
var ghPages = require('gulp-gh-pages');

function compileHtmlReset(done) {
  panini.refresh();
  done();
};

// Watch files for changes
function watch() {
  gulp.watch('scss/**/*', gulp.series(compileSass));
  gulp.watch('html/pages/**/*', gulp.series(compileHtml));
  gulp.watch('html/{layouts,includes,helpers,data}/**/*', gulp.series(compileHtmlReset, compileHtml));
};

// Erases the dist folder
function cleanSite(done) {
  rimraf('_site');
  done();
};

// Copy assets
function copy(done) {
  gulp.src(['assets/**/*']).pipe(gulp.dest('_site'));
  gulp.src(['CNAME']).pipe(gulp.dest('_site'));
  done();
};

var sassOptions = {
  errLogToConsole: true,
  outputStyle: 'expanded',
  includePaths: [nodepath + 'bootstrap/scss/']
};

function compileSass(done) {
    var processors = [
        mq4HoverShim.postprocessorFor({ hoverSelectorPrefix: '.bs-true-hover ' }),
        autoprefixer({
            browsers: [
                "Chrome >= 45",
                "Firefox ESR",
                "Edge >= 12",
                "Explorer >= 10",
                "iOS >= 9",
                "Safari >= 9",
                "Android >= 4.4",
                "Opera >= 30"
            ]
          })//,
        //cssnano(),
    ];
    gulp.src('./scss/app.scss')
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./_site/css/'))
        .on('finish', browser.reload, '*.css')
        ;

  done();
};

function compileHtml(done) {
  gulp.src('html/pages/**/*.html')
    .pipe(panini({
      root: 'html/pages/',
      layouts: 'html/layouts/',
      partials: 'html/includes/',
      helpers: 'html/helpers/',
      data: 'html/data/'
    }))
    .pipe(gulp.dest('_site'))
    .on('finish', browser.reload);

  done();
};

function compileJs() {
  return gulp.src([ nodepath + 'jquery/dist/jquery.min.js', nodepath + 'popper.js//dist/umd/popper.min.js', nodepath + 'bootstrap/dist/js/bootstrap.min.js'])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./_site/js/'));
};
gulp.task('build', gulp.series(cleanSite, copy, compileJs, compileSass, compileHtml));
gulp.task('server', gulp.series('build', () => {
  browser.init({server: './_site', port: port});
}));
gulp.task('default', gulp.parallel('server', watch));
gulp.task('deploy', gulp.series(() => gulp.src('./_site/**/*').pipe(ghPages())));
