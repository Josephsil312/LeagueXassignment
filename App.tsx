/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type { PropsWithChildren } from 'react';
import {
  StyleSheet,
} from 'react-native';


import ProgressBar from './components/ProgressBar';
// import { Uploading } from './components/FileUpload';
import Home from './components/Home';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FilePreview from './components/FilePreview';
import TasksContextProvider from './components/FileuploadsContextProviders';
import Splash from './components/Splash';

const Stack = createNativeStackNavigator();

const App = () => {


  return (
    <>
    <TasksContextProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Splash'>
          <Stack.Screen
            name="Splash"
            component={Splash}
            options={{ headerShown: false }}
          />
          {/* <ProgressBar progress={60}/> */}
          <Stack.Screen
            name="Home"
            component={Home}

            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FilePreview"
            component={FilePreview}

            options={{ title: 'Welcome' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </TasksContextProvider>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
