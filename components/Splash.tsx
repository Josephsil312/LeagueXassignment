import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import SplashScreen from 'react-native-bootsplash';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

interface Props {
  navigation: NavigationProp<ParamListBase>;
}

const Splash = ({ navigation }: Props) => {
  useEffect(() => {
    const init = async () => {
      // Simulate a delay (e.g., API request, initialization tasks)
      setTimeout(() => {
        SplashScreen.hide(); // Hide the splash screen after the delay
        navigation.navigate('Home'); // Navigate to the desired screen (e.g., Home)
      }, 2000); // Adjust the delay as needed
    };

    init();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Splash;
