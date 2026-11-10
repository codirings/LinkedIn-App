/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { initAppCheck } from './src/services/appcheck';

initAppCheck();

AppRegistry.registerComponent(appName, () => App);
