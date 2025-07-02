import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { databaseService } from '../services/DatabaseService';
import { Activity } from '../types/Activity';

const { width } = Dimensions.get('window');

interface StatsScreenProps {
  navigation: any;
}

interface TagStats {
  tag: string;
  count: number;
}

export default function StatsScreen({ navigation }: StatsScreenProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);

  const loadStats = async () => {
    try {
      const activitiesData = await databaseService.getActivities();
      setActivities(activitiesData);
      
      // Calculate tag statistics
      const tagCounts: { [key: string]: number } = {};
      activitiesData.forEach(activity => {
        activity.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      const tagStatsArray = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
      
      setTagStats(tagStatsArray);

      // Calculate weekly count (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyActivities = activitiesData.filter(activity => 
        new Date(activity.committed_on) >= oneWeekAgo
      );
      setWeeklyCount(weeklyActivities.length);

      // Calculate monthly count (last 30 days)
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      const monthlyActivities = activitiesData.filter(activity => 
        new Date(activity.committed_on) >= oneMonthAgo
      );
      setMonthlyCount(monthlyActivities.length);

    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't crash the app, just log the error and show empty state
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const renderStatCard = (icon: string, title: string, value: string | number, subtitle?: string) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={32} color="#007AFF" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const getStreakDays = () => {
    if (activities.length === 0) return 0;
    
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(b.committed_on).getTime() - new Date(a.committed_on).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const activity of sortedActivities) {
      const activityDate = new Date(activity.committed_on);
      activityDate.setHours(0, 0, 0, 0);
      
      const diffTime = currentDate.getTime() - activityDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (diffDays === streak + 1) {
        // Skip one day (today), continue checking
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Virtue Tracking Statistics</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          {renderStatCard('trophy-outline', 'Total Activities', activities.length)}
          {renderStatCard('calendar-outline', 'This Week', weeklyCount)}
          {renderStatCard('time-outline', 'This Month', monthlyCount)}
          {renderStatCard('flame-outline', 'Current Streak', `${getStreakDays()} days`)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Popular Tags</Text>
          {tagStats.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No tags yet</Text>
              <Text style={styles.emptySubtext}>Start adding tags to your activities</Text>
            </View>
          ) : (
            <View style={styles.tagsList}>
              {tagStats.slice(0, 8).map((tagStat, index) => (
                <View key={tagStat.tag} style={styles.tagStatItem}>
                  <View style={styles.tagStatInfo}>
                    <Text style={styles.tagStatName}>{tagStat.tag}</Text>
                    <Text style={styles.tagStatCount}>{tagStat.count} activities</Text>
                  </View>
                  <View style={styles.tagStatBar}>
                    <View 
                      style={[
                        styles.tagStatBarFill, 
                        { 
                          width: `${(tagStat.count / Math.max(...tagStats.map(t => t.count))) * 100}%` 
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <Ionicons name="checkmark-circle" size={24} color="#28a745" />
              <Text style={styles.achievementText}>Started your virtue journey!</Text>
            </View>
            {weeklyCount >= 7 && (
              <View style={styles.achievementItem}>
                <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                <Text style={styles.achievementText}>Logged 7+ activities this week</Text>
              </View>
            )}
            {activities.length >= 10 && (
              <View style={styles.achievementItem}>
                <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                <Text style={styles.achievementText}>Reached 10 total activities</Text>
              </View>
            )}
            {getStreakDays() >= 3 && (
              <View style={styles.achievementItem}>
                <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                <Text style={styles.achievementText}>3+ day streak!</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 48) / 2,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  tagsList: {
    gap: 12,
  },
  tagStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagStatInfo: {
    flex: 1,
    marginRight: 12,
  },
  tagStatName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  tagStatCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tagStatBar: {
    width: 80,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
  },
  tagStatBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
