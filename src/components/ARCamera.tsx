import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ARDirections } from '../services/ar-navigation';

interface ARCameraProps {
  directions: ARDirections | null;
  currentLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

export const ARCamera: React.FC<ARCameraProps> = ({ directions, currentLocation, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [deviceOrientation, setDeviceOrientation] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission required for AR navigation</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getArrowDirection = (targetBearing: number): string => {
    const diff = (targetBearing - deviceOrientation + 360) % 360;
    
    if (diff < 22.5 || diff > 337.5) return '⬆️';
    if (diff < 67.5) return '↗️';
    if (diff < 112.5) return '➡️';
    if (diff < 157.5) return '↘️';
    if (diff < 202.5) return '⬇️';
    if (diff < 247.5) return '↙️';
    if (diff < 292.5) return '⬅️';
    return '↖️';
  };

  if (!directions) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No directions available</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const step = directions.steps[currentStep];

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.arOverlay}>
          <View style={styles.destinationInfo}>
          <Text style={styles.destinationName}>🚔 {directions.destination.name}</Text>
          <Text style={styles.destinationDistance}>
            {Math.round(directions.destination.distance)}m away
          </Text>
        </View>

        <View style={styles.arArrow}>
          <Text style={styles.arrowIcon}>
            {getArrowDirection(step.bearing)}
          </Text>
          <Text style={styles.arrowDistance}>{step.distance}</Text>
        </View>

        <View style={styles.instructionPanel}>
          <Text style={styles.stepCounter}>
            Step {currentStep + 1} of {directions.steps.length}
          </Text>
          <Text style={styles.instruction}>{step.instruction}</Text>
          <View style={styles.safetyIndicator}>
            <Text style={styles.safetyText}>
              Safety: {step.safetyLevel === 'high' ? '🟢 High' : 
                      step.safetyLevel === 'medium' ? '🟡 Medium' : '🔴 Low'}
            </Text>
          </View>
        </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    margin: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  destinationInfo: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
  },
  destinationName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  destinationDistance: {
    color: '#00ff00',
    fontSize: 14,
    marginTop: 5,
  },
  arArrow: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    alignItems: 'center',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  arrowIcon: {
    fontSize: 80,
    color: '#00ff00',
  },
  arrowDistance: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 5,
    borderRadius: 5,
    marginTop: 10,
  },
  instructionPanel: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 15,
    borderRadius: 10,
  },
  stepCounter: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 5,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  safetyIndicator: {
    alignItems: 'center',
  },
  safetyText: {
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});