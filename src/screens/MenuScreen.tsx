import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions
} from 'react-native';

interface MenuScreenProps {
  onStartGame: () => void;
  onShowLeaderboard: () => void;
  playerNickname: string;
  setPlayerNickname: (nickname: string) => void;
}

const { width, height } = Dimensions.get('window');

const MenuScreen: React.FC<MenuScreenProps> = ({
  onStartGame,
  onShowLeaderboard,
  playerNickname,
  setPlayerNickname
}) => {
  const [inputNickname, setInputNickname] = useState(playerNickname);

  const handleStartGame = () => {
    if (!inputNickname.trim()) {
      Alert.alert('Hata', 'Lütfen bir kullanıcı adı girin!');
      return;
    }
    
    if (inputNickname.length < 3) {
      Alert.alert('Hata', 'Kullanıcı adı en az 3 karakter olmalı!');
      return;
    }
    
    setPlayerNickname(inputNickname.trim());
    onStartGame();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NumberPrime</Text>
        <Text style={styles.subtitle}>Matematik Oyunu</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
          <TextInput
            style={styles.input}
            value={inputNickname}
            onChangeText={setInputNickname}
            placeholder="Kullanıcı adınızı girin"
            placeholderTextColor="#666"
            maxLength={20}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleStartGame}>
          <Text style={styles.buttonText}>OYUNA BAŞLA</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={onShowLeaderboard}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            SKOR TABLOSU
          </Text>
        </TouchableOpacity>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Nasıl Oynanır:</Text>
          <Text style={styles.instructionText}>
            • Düşen sayıları yöneterek yerleştirin
          </Text>
          <Text style={styles.instructionText}>
            • + veya - işlemleri seçebilirsiniz
          </Text>
          <Text style={styles.instructionText}>
            • Eşit sayıları birleştirerek patlatın
          </Text>
          <Text style={styles.instructionText}>
            • Asal sayılar çapraz patlar!
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.1,
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#00d2d3',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#16213e',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    color: '#e94560',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  button: {
    backgroundColor: '#e94560',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00d2d3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#00d2d3',
  },
  instructions: {
    marginTop: 40,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    color: '#00d2d3',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
});

export default MenuScreen;