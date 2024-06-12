import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
 
export default function ProgressBar({ progress }) {
  const barWidth = 230;
  const progressWidth = (progress / 100) * barWidth;
 
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
      <Text style={styles.progressText}>uploading {progress.toFixed(1)}%</Text>
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