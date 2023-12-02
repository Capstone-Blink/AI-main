import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

const dummyBoundingBoxes = [
  { classId: 0, score: 0.9, x1: 100, y1: 100, x2: 200, y2: 200 },
  { classId: 1, score: 0.8, x1: 220, y1: 220, x2: 300, y2: 300 }
];

const processDetections = (predictions) => {
  const boxes = predictions[0].dataSync();
  const scores = predictions[1].dataSync();
  const classes = predictions[2].dataSync();
  const detectedBoxes = [];

  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > 0.9) {
      const box = boxes.slice(i * 4, i * 4 + 4);
      detectedBoxes.push({
        y1: box[0],
        x1: box[1],
        y2: box[2],
        x2: box[3],
        score: scores[i],
        classId: classes[i],
      });
    }
  }

  return detectedBoxes;
};

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [model, setModel] = useState(null);
  const THRESHOLD = 0.7;
  const [boundingBoxes, setBoundingBoxes] = useState([]);

  // Create a ref to store the test value
  const testRef = useRef([]);

  useEffect(() => {
    (async () => {
      try {
        // Request camera permission
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');

        // Initialize TensorFlow.js
        await tf.ready();
        const modelJson = require('./assets/model.json');
        const modelWeights = [
          require('./assets/group1-shard1of12.bin'),
          require('./assets/group1-shard2of12.bin'),
          require('./assets/group1-shard3of12.bin'),
          require('./assets/group1-shard4of12.bin'),
          require('./assets/group1-shard5of12.bin'),
          require('./assets/group1-shard6of12.bin'),
          require('./assets/group1-shard7of12.bin'),
          require('./assets/group1-shard8of12.bin'),
          require('./assets/group1-shard9of12.bin'),
          require('./assets/group1-shard10of12.bin'),
          require('./assets/group1-shard11of12.bin'),
          require('./assets/group1-shard12of12.bin'),
        ];

        // Load the model asynchronously using bundleResourceIO
        const model = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights));
        setModel(model);
        console.log("Model Loaded Successfully");
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const handleCameraStream = (images, updatePreview, gl) => {
    const loop = async () => {
      try {
        const imageTensor = images.next().value;

        if (imageTensor == null) {
          requestAnimationFrame(loop);
          return;
        }
        const imageTensorFloat = imageTensor.toFloat();
        const batchedImage = imageTensorFloat.expandDims(0);

        if (model != null) {
          const inputTensor = batchedImage;
          // console.log("Input Tensor Shape:", inputTensor.shape);
          const predictions = await model.executeAsync(inputTensor);
          const newDetections = await processDetections(predictions);

          // Update the testRef value directly
          testRef.current = newDetections;
          // console.log(predictions);
          console.log(newDetections);
        }

        tf.dispose([imageTensor, imageTensorFloat, batchedImage]);
        // Update preview
        requestAnimationFrame(loop);
      } catch (error) {
        console.log("Error in handle loop : ", error);
      }
    };
    loop();
  };

  const TensorCamera = cameraWithTensors(Camera);

  let textureDims;
  if (Platform.OS === 'ios') {
    textureDims = {
      height: 1920,
      width: 1080,
    };
  } else {
    textureDims = {
      height: 1200,
      width: 1600,
    };
  }

  return (
    <View style={styles.container}>
      <TensorCamera
        style={{ ...styles.camera, zIndex: 1 }}
        type={Camera.Constants.Type.back}
        onReady={handleCameraStream}
        autoRender={false}
        cameraTextureHeight={textureDims.height}
        cameraTextureWidth={textureDims.width}
        resizeDepth={3}
        resizeHeight={640}
        resizeWidth={640}
        dtype={'float32'}
      >
      </TensorCamera>
      {testRef.current.map((box, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            borderColor: 'red',
            borderWidth: 2,
            left: box.x1,
            top: box.y1,
            width: box.x2 - box.x1,
            height: box.y2 - box.y1
          }}>
          <Text style={styles.boxText}>Class: {box.classId}, Score: {box.score.toFixed(2)}</Text>
        </View>
      ))}
      {dummyBoundingBoxes.map((box, index) => (
        <View
          key={`dummy-${index}`}
          style={{
            position: 'absolute',
            borderColor: 'blue',
            borderWidth: 2,
            left: box.x1,
            top: box.y1,
            width: box.x2 - box.x1,
            height: box.y2 - box.y1
          }}>
          <Text style={styles.boxText}>Dummy Class: {box.classId}, Score: {box.score.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  camera: {
    flex: 1,
    zIndex: 1
  },
  boxText: {
    color: '#FFF',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    fontSize: 12
  }
});
