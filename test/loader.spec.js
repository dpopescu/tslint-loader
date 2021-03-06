'use strict';

var path = require('path');
var expect = require('chai').expect;
var webpack = require('webpack');
var assign = require('object-assign');
var webpackConfig = require('./webpack.config');

describe('TslintLoader', function() {
  it('should lint typescript files and output warning', function(done) {
    webpack(webpackConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.true;

      var result = stats.toJson();
      expect(result.assets.length).to.eql(1);
      expect(result.chunks.length).to.eql(1);
      expect(result.warnings).to.eql([
        './test/app/engine.ts\n[8, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
      done();
    });
  });

  it('should overwrite configuration in tslint json', function(done) {
    var localConfig = assign({}, webpackConfig, {
      tslint: {
        configuration: {
          rules: {
            'no-console': [false]
          }
        }
      }
    });

    webpack(localConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.false;
      done();
    });
  });

  it('should use custom tslint file when option given', function(done) {
    var localConfig = assign({}, webpackConfig, {
      tslint: {
        configFile: 'tslint-custom.json'
      }
    });

    webpack(localConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.false;
      done();
    });
  });

  it('should emit linting failure as error when forced to', function(done) {
    var localConfig = assign({}, webpackConfig, {
      tslint: {
        emitErrors: true
      }
    });

    webpack(localConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.false;

      var result = stats.toJson();
      expect(result.errors).to.eql([
        './test/app/engine.ts\n[8, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
      done();
    });
  });

  it('should accept options from query string also', function(done) {
    var localConfig = assign({}, webpackConfig, {
      module: {
        preLoaders: [
          {
            test: /\.ts$/,
            loader: './index?emitErrors=true'
          }
        ],
        loaders: [
          {
            test: /\.ts$/,
            loader: 'awesome-typescript-loader'
          }
        ]
      }
    });

    webpack(localConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.false;

      var result = stats.toJson();
      expect(result.errors).to.eql([
        './test/app/engine.ts\n[8, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
      done();
    });
  });

  it('should fail on linting failure when forced to', function(done) {
    var localConfig = assign({}, webpackConfig, {
      tslint: {
        failOnHint: true
      }
    });

    webpack(localConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.true;

      var result = stats.toJson();
      expect(result.assets.length).to.eql(0);
      expect(result.chunks.length).to.eql(0);
      expect(result.errors[0]).to.contain('Module build failed: Error: Compilation failed due to tslint errors.');
      done();
    });
  });

  it('should use type checked rules when forced to', function(done) {
    var localConfig = assign({}, webpackConfig, {
      entry: {
        engine: path.resolve(__dirname, 'app', 'for-in-array.ts')
      },
      tslint: {
        typeCheck: true,
        configuration: {
          rules: {
            'no-for-in-array': true
          }
        }
      }
    });

    webpack(localConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.true;

      var result = stats.toJson();

      expect(result.warnings).to.eql([
        './test/app/for-in-array.ts\n[4, 1]: for-in loops over arrays are forbidden. Use for-of or array.forEach instead.\n'
      ]);
      done();
    });
  });
});
