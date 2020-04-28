![MyFiziq Logo](https://www.myfiziq.com/assets/images/logo.svg)

React Native example project using MyFiziq React Native plugin.

# Installation

This guide assumes the React Native is installed and configured.

1. Link the plugin to the project (this downloads and links in external libraries):
```sh
react-native link react-native-my-fiziq-sdk
```
2. Update the MyFiziq setup paramters with the environment key, secret, and environment strings (as recieved from MyFiziq). See:
```js
let result = await MyFiziq.mfzSdkSetup(
        "REPLACE ME WITH KEY", 
        "REPLACE ME WITH SECRET", 
        "REPLACE ME WITH ENVIRONMENT");
```
3. Test that the project builds and runs (assuming iOS development):
```sh
react-native run-ios
```
4. Update the project's `Info.plist` with an appropriate NSCameraUsageDescription string. For example, see: https://useyourloaf.com/blog/privacy-settings-in-ios-10/

## Author

MyFiziq iOS Dev, dev@myfiziq.com

  