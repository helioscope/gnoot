# About

For the github GameOff 2022 I tried making a knytt homage of sorts.

It's built using Phaser 3, with tilemap level made with Tiled.

This is my first time using Phaser 3, so (on top of being jam-quality) the code is a definitely rough in spots.


**Please note that no assets are currently included.** This means you will not be able to build & run this repo as-is. I'm working on figuring out how to provide sample assets, but this may take a little while to work out. As-is, the PreloaderScene will try to load a bunch of paths that won't exist and very soon something (probably audio) will not be okay with this.


# Readme stuff from Phaser 3 + Vite.js template:

## Prerequisites

You'll need [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed.

It is highly recommended to use [Node Version Manager](https://github.com/nvm-sh/nvm) (nvm) to install Node.js and npm.

For Windows users there is [Node Version Manager for Windows](https://github.com/coreybutler/nvm-windows).

Install Node.js and `npm` with `nvm`:

```bash
nvm install node

nvm use node
```

Replace 'node' with 'latest' for `nvm-windows`.

## Getting Started

You can clone this repository or use [degit](https://github.com/Rich-Harris/degit) to scaffold the project like this:

```bash
npx degit https://github.com/ourcade/phaser3-vite-template my-folder-name
cd my-folder-name

npm install
```

Start development server:

```
npm run start
```

To create a production build:

```
npm run build
```

Production files will be placed in the `dist` folder. Then upload those files to a web server. 🎉

## Project Structure

```
    .
    ├── dist
    ├── node_modules
    ├── public
    ├── src
    │   ├── HelloWorldScene.js
    │   ├── main.js
	├── index.html
    ├── package.json
```

JavaScript files are intended for the `src` folder. `main.js` is the entry point referenced by `index.html`.

Other than that there is no opinion on how you should structure your project.

There is an example `HelloWorldScene.js` file that can be placed inside a `scenes` folder to organize by type or elsewhere to organize by function. For example, you can keep all files specific to the HelloWorld scene in a `hello-world` folder.

It is all up to you!

## Static Assets

Any static assets like images or audio files should be placed in the `public` folder. It'll then be served from the root. For example: http://localhost:8000/images/my-image.png

Example `public` structure:

```
    public
    ├── images
    │   ├── my-image.png
    ├── music
    │   ├── ...
    ├── sfx
    │   ├── ...
```

They can then be loaded by Phaser with `this.image.load('my-image', 'images/my-image.png')`.

# ESLint

This template uses a basic `eslint` set up for code linting to help you find and fix common problems in your JavaScript code.

It does not aim to be opinionated.

[See here for rules to turn on or off](https://eslint.org/docs/rules/).

## Dev Server Port

You can change the dev server's port number by modifying the `vite.config.js` file. Look for the `server` section:

```js
{
	// ...
	server: { host: '0.0.0.0', port: 8000 },
}
```

Change 8000 to whatever you want.



# Libraries, tools, etc.

## Phaser 3

Mature & pretty robust game framework targeting web. It's been surprisingly

site: [https://phaser.io/]
repo: [https://github.com/photonstorm/phaser]


## Phaser 3 + Vite.js Template

Nice little project skeleton with phaser & vite set up + a basic folder structure + gitignore, etc. -- not necessary, just saves a bit of setup time

repo: [https://github.com/ourcade/phaser3-vite-template/]
license: [MIT License](https://github.com/ourcade/phaser3-vite-template/blob/master/LICENSE)


## tile-extruder

npm library for "extruding" tiles so you don't get seams.
(not sure if it's relevant when we're not moving a "camera" or rescaling by a non-integer etc, but I wanted to leave those possibilities open)

docs: [https://sporadic-labs.github.io/tile-extruder/]
repo: [https://github.com/sporadic-labs/tile-extruder]
license: unspecified


## Tiled map editor

site: [https://www.mapeditor.org/]
repo: [https://github.com/mapeditor/tiled]

Not included in this repo. This is the tool used to create the tilemaps used by the game. Some extra scripts are included in the `tiled-extensions` directory for use with Tiled to speed up development.


## PyxelEdit

TODO: provide link

Not included in this repo or required. I used this for making the tile graphics & raw tile sheet. It's bit rough around the edges and lacking in updates these days, but what's already there is pretty solid. There are probably better options, but I can work with it quite quickly.


## Aseprite

TODO: provide link

Not included in this repo or required. I used this for making the sprite animations & sprite sheets. 
