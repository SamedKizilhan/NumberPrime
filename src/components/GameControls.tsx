import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Operation } from '../types/GameTypes';

interface GameControlsProps {
  selectedOperation: Operation;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDropBlock: () => void;
  onSelectOperation: (operation: Operation) => void;
}

const { width, height } = Dimensions.get('window');

const GameControls: React.FC<GameControlsProps> = ({
  selectedOperation,
  onMoveLeft,
  onMoveRight,
  onDropBlock,
  onSelectOperation
}) => {
  const renderOperationButton = (operation: Operation, symbol: string) => {
    const isSelected = selectedOperation === operation;
    
    return (
      <TouchableOpacity
        key={operation}
        style={[
          styles.operationButton,
          isSelected && styles.selectedOperationButton
        ]}
        onPress={() => onSelectOperation(operation)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.operationButtonText,
          isSelected && styles.selectedOperationButtonText
        ]}>
          {symbol}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sol taraf - İşlem butonları */}
      <View style={styles.leftControls}>
        <Text style={styles.controlLabel}>İşlemler</Text>
        <View style={styles.operationContainer}>
          {renderOperationButton('add', '+')}
          {renderOperationButton('subtract', '-')}
          {/* multiply ve divide butonları daha sonra eklenecek */}
        </View>
      </View>

      {/* Sağ taraf - Hareket kontrolleri */}
      <View style={styles.rightControls}>
        <Text style={styles.controlLabel}>Hareket</Text>
        <View style={styles.movementContainer}>
          {/* Üst sıra - Sol ve Sağ */}
          <View style={styles.movementRow}>
            <TouchableOpacity
              style={styles.movementButton}
              onPress={onMoveLeft}
              activeOpacity={0.7}
            >
              <Text style={styles.movementButtonText}>◀</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.movementButton}
              onPress={onMoveRight}
              activeOpacity={0.7}
            >
              <Text style={styles.movementButtonText}>▶</Text>
            </TouchableOpacity>
          </View>
          
          {/* Alt sıra - Aşağı */}
          <View style={styles.movementRow}>
            <TouchableOpacity
              style={[styles.movementButton, styles.dropButton]}
              onPress={onDropBlock}
              activeOpacity={0.7}
            >
              <Text style={styles.movementButtonText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#1a1a2e',
    minHeight: 120,
  },
  leftControls: {
    alignItems: 'center',
  },
  rightControls: {
    alignItems: 'center',
  },
  controlLabel: {
    color: '#00d2d3',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  operationContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  operationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOperationButton: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
    shadowColor: '#e94560',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  operationButtonText: {
    color: '#666',
    fontSize: 24,
    fontWeight: 'bold',
  },
  selectedOperationButtonText: {
    color: '#fff',
  },
  movementContainer: {
    alignItems: 'center',
  },
  movementRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  movementButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropButton: {
    backgroundColor: '#00d2d3',
    borderColor: '#00d2d3',
  },
  movementButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default GameControls;