'use strict';
var yeoman = require('yeoman-generator');
var path = require('path');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('lodash');
var os = require('os');
var ghdownload = require('github-download');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    this.pkg = require('../package.json');
    this.tplSettings = {
      escape: /<%%-([\s\S]+?)%%>/g,
      evaluate: /<%%([\s\S]+?)%%>/g,
      interpolate: /MSW_([\s\S]+?)_PLACEHOLDER/g
    }
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.red('multi screen web') + ' generator!'
    ));

    var basePath = path.basename(process.env.PWD);
    var appName = basePath;

    var prompts = [{
      type: 'input',
      name: 'name',
      message: 'What is your project name?',
      default: appName
    }, {
      type: 'input',
      name: 'hostname',
      message: 'What\'s the name of your server machine on the local netowrk?\nThis is optional as the server will use its own hostname\nby default but some networks will automatically modify the host\nname making your server URL unpredictable.',
      default: os.hostname()
    }];

    this.prompt(prompts, function (props) {
      this.props = props;
      // To access props later use this.props.someOption;

      done();
    }.bind(this));

  },

  compose: function() {
    this.log('You will now be prompted to download node-webkit for whichever platforms you need. ' + chalk.green('Only the default version of node webkit is supported, use others at your own risk.'));

    this.composeWith('node-webkit:download', {}, {
      local: require.resolve('generator-node-webkit/download')
    });
  },

  downloadMSW: function() {
    var done = this.async();

    this.tempFolderPrefix = './_temp_MSW/';
    this.tempFolder = this.destinationPath(this.tempFolderPrefix);
    ghdownload({ user: 'artefact-group', repo: 'multi-screen-web', ref: 'master' }, this.tempFolder)
    .on('end', function() {
      done();
    });
  },

  writing: {
    app: function () {
      this.fs.copyTpl(
        this.destinationPath(this.tempFolderPrefix + 'package.json'),
        this.destinationPath('package.json'),
        this.props,
        this.tplSettings
      );
      this.fs.copyTpl(
        this.destinationPath(this.tempFolderPrefix + 'app'),
        this.destinationPath('app'),
        this.props,
        this.tplSettings
      );
      this.fs.copyTpl(
        this.destinationPath(this.tempFolderPrefix + 'Gruntfile.js'),
        this.destinationPath('Gruntfile.js'),
        this.props,
        this.tplSettings
      );
      this.fs.copyTpl(
        this.destinationPath(this.tempFolderPrefix + 'resources/mac'),
        this.destinationPath('resources/mac'),
        this.props,
        this.tplSettings
      );
    },

    projectfiles: function () {
      this.fs.copy(
        this.destinationPath(this.tempFolderPrefix + 'bower.json'),
        this.destinationPath('bower.json')
      );
      this.fs.copy(
        this.destinationPath(this.tempFolderPrefix + '.bowerrc'),
        this.destinationPath('.bowerrc')
      );
      this.fs.copy(
        this.destinationPath(this.tempFolderPrefix + '.gitignore'),
        this.destinationPath('.gitignore')
      );
      this.fs.copyTpl(
        this.destinationPath(this.tempFolderPrefix + 'build-and-run-mac.sh'),
        this.destinationPath('build-and-run-mac.sh'),
        this.props,
        this.tplSettings
      );
      this.fs.copy(
        this.destinationPath(this.tempFolderPrefix + '.jshintrc'),
        this.destinationPath('.jshintrc')
      );
    }
  },

  install: function () {
    this.installDependencies();
  },

  end: function() {
    this.fs.delete(this.destinationPath(this.tempFolderPrefix));
  }
});
