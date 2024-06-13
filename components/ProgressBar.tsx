import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useTasks } from "./FileuploadsContextProviders";
import NetInfo from '@react-native-community/netinfo';

export default function ProgressBar({ progress }) {
  const barWidth = 230;
  const progressWidth = (progress / 100) * barWidth;
  const tasksContext = useTasks();
  if (!tasksContext) {
    throw new Error('useTasks must be used within a TasksContextProvider');
}
  const {isConnected,setIsConnected } = tasksContext

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
        setIsConnected(state.isConnected); // Update isConnected state when network status changes
        console.log('Network status changed:', state.isConnected);
    });

    return () => {
        unsubscribe(); // Clean up listener on component unmount
    };
}, [isConnected]);

const networkStatusText = isConnected ? `Uploading ${progress.toFixed(1)}%` : "Paused";

  return (
    <View style={styles.progressBarContainer}>
      <Svg width={barWidth} height="7">
        <Rect
          width={barWidth}
          height={"100%"}
          fill={"#eee"}
          rx={3.5}
          ry={3.5}
        />
        <Rect
          width={progressWidth}
          height={"100%"}
          fill={"#3478F6"}
          rx={3.5}
          ry={3.5}
        />
      </Svg>
      <Text style={styles.progressText}>{networkStatusText}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    marginLeft: 10,
    color:'black'
  },
});