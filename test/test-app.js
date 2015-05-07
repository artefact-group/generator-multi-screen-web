'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;
var os = require('os');

describe('multi-screen-web:app', function () {
  before(function (done) {
    helpers.run(path.join(__dirname, '../app'))
      .withOptions({ skipInstall: true })
      .withPrompts({ name: 'blah' })
      .on('end', done);
  });

  it('creates files', function () {
    assert.file([
      'Gruntfile.js',
      'package.json'
    ]);
  });
});
