# generator-multi-screen-web

> [Yeoman](http://yeoman.io) generator


## Getting Started

### What is Yeoman?

Yeoman lives in your computer, and waits for you to tell him what kind of application you wish to create.

Not every new computer comes with a Yeoman pre-installed. He lives in the [npm](https://npmjs.org) package repository. You only have to ask for him once, then he packs up and moves into your hard drive. *Make sure you clean up, he likes new and shiny things.*

```bash
npm install -g yo
```

### Yeoman Generators

Yeoman travels light. He didn't pack any generators when he moved in. You can think of a generator like a plug-in. You get to choose what type of application you wish to create, such as a Backbone application or even a Chrome extension.

To install generator-multi-screen-web from npm, run:

```bash
npm install -g generator-multi-screen-web
```

Finally, initiate the generator:

```bash
yo multi-screen-web
```

### About the multi screen web application

The generator creates everything you need to run a web server on OS X as a native application using node-webkit. It should also create working Windows executables but that hasn't been tested.

After running the generator you can launch the application right away on OS X by running `build-and-run-mac.sh` in the project root folder.

The app launches and shows all of the devices that are configured to show content. Each device gets its own URL and there's also a control webpage that updates the current step in an aribtrary sequence of steps that are synchronized between all devices. The control page has buttons to skip to any step or advance forward and backward.

Each device that is configured to do something specific on a particular step, will update in realtime as the control app sends notifications.

In the future there will be more complex communications enabled between devices.

How do you configure the devices? Add as many as you need via the data/app.js file. The JSON object exported by that module defines the devices and what they do at each step in the script.

The app is configured with an example script that makes a phone and a tablet page available. The phone shows different URLs on steps 1, 2 and 4 of the script. The tablet shows different URLs on steps 1 and 2 of the script.

Edits to this file are all you need to add and script devices.

### Getting To Know Yeoman

Yeoman has a heart of gold. He's a person with feelings and opinions, but he's very easy to work with. If you think he's too opinionated, he can be easily convinced.

If you'd like to get to know Yeoman better and meet some of his friends, [Grunt](http://gruntjs.com) and [Bower](http://bower.io), check out the complete [Getting Started Guide](https://github.com/yeoman/yeoman/wiki/Getting-Started).


## License

MIT
