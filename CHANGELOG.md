# 1.0.0

- Migrate to TypeScript from Flow ([#2363](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/2363))
- Use browserslist for `@babel/preset-env` targets ([#2368](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/2368))
- Use preload script, disable `nodeIntegration` in renderer process for [improved security](https://www.electronjs.org/docs/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content) ([#2365](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/2365))
- Add support for azure pipelines ([#2369](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/2369))
- Disable sourcemaps in production

# 0.18.1 (2019.12.12)

- Fix HMR env bug ([#2343](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/2343))
- Bump all deps to latest semver
- Bump to `electron@7`

# 0.18.0 (2019.11.19)

- Bump electron to `electron@6` (`electron@7` introduces breaking changes to testcafe end to end tests)
- Revert back to [two `package.json` structure](https://www.electron.build/tutorials/two-package-structure)
- Bump all deps to latest semver

# 0.17.1 (2018.11.20)

- Fix `yarn test-e2e` and testcafe for single package.json structure
- Fixes incorrect path in `yarn start` script
- Bumped deps
- Bump g++ in travis
- Change clone arguments to clone only master
- Change babel config to target current electron version

For full change list, see https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/2021

# 0.17.0 (2018.10.30)

- upgraded to `babel@7` (thanks to @vikr01 🎉🎉🎉)
- migrated from [two `package.json` structure](https://www.electron.build/tutorials/two-package-structure) (thanks to @HyperSprite!)
- initial auto update support (experimental)
- migrate from greenkeeper to [renovate](https://renovatebot.com)
- added issue template
- use `babel-preset-env` to target current electron version
- add [opencollective](https://opencollective.com/electron-react-boilerplate-594) banner message display in postinstall script (help support ERB 🙏)
- fix failing ci issues

# 0.16.0 (2018.10.3)

- removed unused dependencies
- migrate from `react-redux-router` to `connect-react-router`
- move webpack configs to `./webpack` dir
- use `g++` on travis when testing linux
- migrate from `spectron` to `testcafe` for e2e tests
- add linting support for config styles
- changed stylelint config
- temporarily disabled flow in appveyor to make ci pass
- added necessary infra to publish releases from ci

# 0.15.0 (2018.8.25)

- Performance: cache webpack uglify results
- Feature: add start minimized feature
- Feature: lint and fix styles with prettier and stylelint
- Feature: add greenkeeper support

# 0.14.0 (2018.5.24)

- Improved CI timings
- Migrated README commands to yarn from npm
- Improved vscode config
- Updated all dependencies to latest semver
- Fix `electron-rebuild` script bug
- Migrated to `mini-css-extract-plugin` from `extract-text-plugin`
- Added `optimize-css-assets-webpack-plugin`
- Run `prettier` on json, css, scss, and more filetypes

# 0.13.3 (2018.5.24)

- Add git precommit hook, when git commit will use `prettier` to format git add code
- Add format code function in `lint-fix` npm script which can use `prettier` to format project js code

# 0.13.2 (2018.1.31)

- Hot Module Reload (HMR) fixes
- Bumped all dependencies to latest semver
- Prevent error propagation of `CheckNativeDeps` script

# 0.13.1 (2018.1.13)

- Hot Module Reload (HMR) fixes
- Bumped all dependencies to latest semver
- Fixed electron-rebuild script
- Fixed tests scripts to run on all platforms
- Skip redux logs in console in test ENV

# 0.13.0 (2018.1.6)

#### Additions

- Add native dependencies check on postinstall
- Updated all dependencies to latest semver

# 0.12.0 (2017.7.8)

#### Misc

- Removed `babel-polyfill`
- Renamed and alphabetized npm scripts

#### Breaking

- Changed node dev `__dirname` and `__filename` to node built in fn's (https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/1035)
- Renamed `app/bundle.js` to `app/renderer.prod.js` for consistency
- Renamed `dll/vendor.js` to `dll/renderer.dev.dll.js` for consistency

#### Additions

- Enable node_modules cache on CI

# 0.11.2 (2017.5.1)

Yay! Another patch release. This release mostly includes refactorings and router bug fixes. Huge thanks to @anthonyraymond!

⚠️ Windows electron builds are failing because of [this issue](https://github.com/electron/electron/issues/9321). This is not an issue with the boilerplate ⚠️

#### Breaking

- **Renamed `./app/main.development.js` => `./app/main.{dev,prod}.js`:** [#963](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/963)

#### Fixes

- **Fixed reloading when not on `/` path:** [#958](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/958) [#949](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/949)

#### Additions

- **Added support for stylefmt:** [#960](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/960)

# 0.11.1 (2017.4.23)

You can now debug the production build with devtools like so:

```
DEBUG_PROD=true npm run package
```

🎉🎉🎉

#### Additions

- **Added support for debugging production build:** [#fab245a](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/941/commits/fab245a077d02a09630f74270806c0c534a4ff95)

#### Bug Fixes

- **Fixed bug related to importing native dependencies:** [#933](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/933)

#### Improvements

- **Updated all deps to latest semver**

# 0.11.0 (2017.4.19)

Here's the most notable changes since `v0.10.0`. Its been about a year since a release has been pushed. Expect a new release to be published every 3-4 weeks.

#### Breaking Changes

- **Dropped support for node < 6**
- **Refactored webpack config files**
- **Migrate to two-package.json project structure**
- **Updated all devDeps to latest semver**
- **Migrated to Jest:** [#768](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/768)
- **Migrated to `react-router@4`**
- **Migrated to `electron-builder@4`**
- **Migrated to `webpack@2`**
- **Migrated to `react-hot-loader@3`**
- **Changed default live reload server PORT to `1212` from `3000`**

#### Additions

- **Added support for Yarn:** [#451](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/451)
- **Added support for Flow:** [#425](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/425)
- **Added support for stylelint:** [#911](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/911)
- **Added support for electron-builder:** [#876](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/876)
- **Added optional support for SASS:** [#880](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/880)
- **Added support for eslint-plugin-flowtype:** [#911](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/911)
- **Added support for appveyor:** [#280](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/280)
- **Added support for webpack dlls:** [#860](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/860)
- **Route based code splitting:** [#884](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/884)
- **Added support for Webpack Bundle Analyzer:** [#922](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/922)

#### Improvements

- **Parallelize renderer and main build processes when running `npm run build`**
- **Dynamically generate electron app menu**
- **Improved vscode integration:** [#856](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/856)

#### Bug Fixes

- **Fixed hot module replacement race condition bug:** [#917](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/917) [#920](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/920)

# 0.10.0 (2016.4.18)

#### Improvements

- **Use Babel in main process with Webpack build:** [#201](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/201)
- **Change targets to built-in support by webpack:** [#197](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/197)
- **use es2015 syntax for webpack configs:** [#195](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/195)
- **Open application when webcontent is loaded:** [#192](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/192)
- **Upgraded dependencies**

#### Bug fixed

- **Fix `npm list electron-prebuilt` in package.js:** [#188](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/188)

# 0.9.0 (2016.3.23)

#### Improvements

- **Added [redux-logger](https://github.com/fcomb/redux-logger)**
- **Upgraded [react-router-redux](https://github.com/reactjs/react-router-redux) to v4**
- **Upgraded dependencies**
- **Added `npm run dev` command:** [#162](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/162)
- **electron to v0.37.2**

#### Breaking Changes

- **css module as default:** [#154](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/154).
- **set default NODE_ENV to production:** [#140](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/140)

# 0.8.0 (2016.2.17)

#### Bug fixed

- **Fix lint errors**
- **Fix Webpack publicPath for production builds**: [#119](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/119).
- **package script now chooses correct OS icon extension**

#### Improvements

- **babel 6**
- **Upgrade Dependencies**
- **Enable CSS source maps**
- **Add json-loader**: [#128](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/128).
- **react-router 2.0 and react-router-redux 3.0**

# 0.7.1 (2015.12.27)

#### Bug fixed

- **Fixed npm script on windows 10:** [#103](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/103).
- **history and react-router version bump**: [#109](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/109), [#110](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/110).

#### Improvements

- **electron 0.36**

# 0.7.0 (2015.12.16)

#### Bug fixed

- **Fixed process.env.NODE_ENV variable in webpack:** [#74](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/74).
- **add missing object-assign**: [#76](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/76).
- **packaging in npm@3:** [#77](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/77).
- **compatibility in windows:** [#100](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/100).
- **disable chrome debugger in production env:** [#102](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/102).

#### Improvements

- **redux**
- **css-modules**
- **upgrade to react-router 1.x**
- **unit tests**
- **e2e tests**
- **travis-ci**
- **upgrade to electron 0.35.x**
- **use es2015**
- **check dev engine for node and npm**

# 0.6.5 (2015.11.7)

#### Improvements

- **Bump style-loader to 0.13**
- **Bump css-loader to 0.22**

# 0.6.4 (2015.10.27)

#### Improvements

- **Bump electron-debug to 0.3**

# 0.6.3 (2015.10.26)

#### Improvements

- **Initialize ExtractTextPlugin once:** [#64](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/64).

# 0.6.2 (2015.10.18)

#### Bug fixed

- **Babel plugins production env not be set properly:** [#57](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/57).

# 0.6.1 (2015.10.17)

#### Improvements

- **Bump electron to v0.34.0**

# 0.6.0 (2015.10.16)

#### Breaking Changes

- **From react-hot-loader to react-transform**

# 0.5.2 (2015.10.15)

#### Improvements

- **Run tests with babel-register:** [#29](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/29).

# 0.5.1 (2015.10.12)

#### Bug fixed

- **Fix #51:** use `path.join(__dirname` instead of `./`.

# 0.5.0 (2015.10.11)

#### Improvements

- **Simplify webpack config** see [#50](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/50).

#### Breaking Changes

- **webpack configs**
- **port changed:** changed default port from 2992 to 3000.
- **npm scripts:** remove `start-dev` and `dev-server`. rename `hot-dev-server` to `hot-server`.

# 0.4.3 (2015.9.22)

#### Bug fixed

- **Fix #45 zeromq crash:** bump version of `electron-prebuilt`.

# 0.4.2 (2015.9.15)

#### Bug fixed

- **run start-hot breaks chrome refresh(CTRL+R) (#42)**: bump `electron-debug` to `0.2.1`

# 0.4.1 (2015.9.11)

#### Improvements

- **use electron-prebuilt version for packaging (#33)**

# 0.4.0 (2015.9.5)

#### Improvements

- **update dependencies**

# 0.3.0 (2015.8.31)

#### Improvements

- **eslint-config-airbnb**

# 0.2.10 (2015.8.27)

#### Features

- **custom placeholder icon**

#### Improvements

- **electron-renderer as target:** via [webpack-target-electron-renderer](https://github.com/chentsulin/webpack-target-electron-renderer)

# 0.2.9 (2015.8.18)

#### Bug fixed

- **Fix hot-reload**

# 0.2.8 (2015.8.13)

#### Improvements

- **bump electron-debug**
- **babelrc**
- **organize webpack scripts**

# 0.2.7 (2015.7.9)

#### Bug fixed

- **defaultProps:** fix typos.

# 0.2.6 (2015.7.3)

#### Features

- **menu**

#### Bug fixed

- **package.js:** include webpack build.

# 0.2.5 (2015.7.1)

#### Features

- **NPM Script:** support multi-platform
- **package:** `--all` option

# 0.2.4 (2015.6.9)

#### Bug fixed

- **Eslint:** typo, [#17](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/17) and improve `.eslintrc`

# 0.2.3 (2015.6.3)

#### Features

- **Package Version:** use latest release electron version as default
- **Ignore Large peerDependencies**

#### Bug fixed

- **Npm Script:** typo, [#6](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/6)
- **Missing css:** [#7](https://github.com/electron-react-boilerplate/electron-react-boilerplate/pull/7)

# 0.2.2 (2015.6.2)

#### Features

- **electron-debug**

#### Bug fixed

- **Webpack:** add `.json` and `.node` to extensions for imitating node require.
- **Webpack:** set `node_modules` to externals for native module support.

# 0.2.1 (2015.5.30)

#### Bug fixed

- **Webpack:** #1, change build target to `atom`.

# 0.2.0 (2015.5.30)

#### Features

- **Ignore:** `test`, `tools`, `release` folder and devDependencies in `package.json`.
- **Support asar**
- **Support icon**

# 0.1.0 (2015.5.27)

#### Features

- **Webpack:** babel, react-hot, ...
- **Flux:** actions, api, components, containers, stores..
- **Package:** darwin (osx), linux and win32 (windows) platform.
