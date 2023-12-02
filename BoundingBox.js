import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BoundingBox = React.memo(({ box, textureDims }) => {
  const { classId, score, left, top, width, height } = box;

  const boxStyle = {
    position: 'absolute',
    left: left * textureDims.width,
    top: top * textureDims.height,
    width: width * textureDims.width,
    height: height * textureDims.height,
    borderColor: '#FF5733',
    borderWidth: 2,
    borderRadius: 5,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <View style={boxStyle}>
      <Text style={styles.text}>{`Class: ${classId}, Score: ${score.toFixed(2)}`}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  text: {
    color: '#FFF',
    backgroundColor: '#FF5733',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
});

export default BoundingBox;