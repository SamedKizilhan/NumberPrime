import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { PlayerScore } from '../types/GameTypes';
import { getPlayerTitle } from '../utils/GameUtils';

interface LeaderboardScreenProps {
  onBack: () => void;
}

const { width, height } = Dimensions.get('window');

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);

  useEffect(() => {
    // TODO: Burada gerçek leaderboard verilerini yükleyeceğiz
    // Şimdilik örnek veriler
    const mockData: PlayerScore[] = [
      {
        nickname: 'MathMaster',
        score: 25430,
        date: new Date().toLocaleDateString(),
        title: getPlayerTitle(25430)
      },
      {
        nickname: 'PrimeHunter',
        score: 18750,
        date: new Date().toLocaleDateString(),
        title: getPlayerTitle(18750)
      },
      {
        nickname: 'NumberNinja',
        score: 12300,
        date: new Date().toLocaleDateString(),
        title: getPlayerTitle(12300)
      },
      {
        nickname: 'CalcPro',
        score: 9850,
        date: new Date().toLocaleDateString(),
        title: getPlayerTitle(9850)
      },
      {
        nickname: 'MathWizard',
        score: 7200,
        date: new Date().toLocaleDateString(),
        title: getPlayerTitle(7200)
      }
    ];
    
    setLeaderboard(mockData);
  }, []);

  const renderLeaderboardItem = (player: PlayerScore, index: number) => {
    const position = index + 1;
    const isTopThree = position <= 3;
    
    let positionStyle = styles.normalPosition;
    if (position === 1) positionStyle = styles.firstPosition;
    else if (position === 2) positionStyle = styles.secondPosition;
    else if (position === 3) positionStyle = styles.thirdPosition;

    return (
      <View key={`${player.nickname}-${index}`} style={styles.leaderboardItem}>
        <View style={[styles.positionContainer, positionStyle]}>
          <Text style={styles.positionText}>{position}</Text>
        </View>
        
        <View style={styles.playerDetails}>
          <Text style={styles.playerNickname}>{player.nickname}</Text>
          <Text style={styles.playerTitleText}>{player.title}</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.playerScore}>{player.score.toLocaleString()}</Text>
          <Text style={styles.playerDate}>{player.date}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Skor Tablosu</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.leaderboardContainer}>
          {leaderboard.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Henüz skor bulunmuyor</Text>
              <Text style={styles.emptySubtext}>İlk oyunu oyna ve lider tablosunda yer al!</Text>
            </View>
          ) : (
            leaderboard.map((player, index) => renderLeaderboardItem(player, index))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#16213e',
    borderBottomWidth: 2,
    borderBottomColor: '#0f3460',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#00d2d3',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  spacer: {
    width: 60,
  },
  scrollContainer: {
    flex: 1,
  },
  leaderboardContainer: {
    padding: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  positionContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  normalPosition: {
    backgroundColor: '#0f3460',
  },
  firstPosition: {
    backgroundColor: '#FFD700',
  },
  secondPosition: {
    backgroundColor: '#C0C0C0',
  },
  thirdPosition: {
    backgroundColor: '#CD7F32',
  },
  positionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerNickname: {
    color: '#00d2d3',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  playerTitleText: {
    color: '#e94560',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  playerScore: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  playerDate: {
    color: '#666',
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LeaderboardScreen;