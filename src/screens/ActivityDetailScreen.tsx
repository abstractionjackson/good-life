import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../services/DatabaseService';
import { Activity, NewActivity } from '../types/Activity';

interface ActivityDetailScreenProps {
  navigation: any;
  route: {
    params: {
      activityId: string;
    };
  };
}

export default function ActivityDetailScreen({ navigation, route }: ActivityDetailScreenProps) {
  const { activityId } = route.params;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHandle, setEditedHandle] = useState('');
  const [editedCommittedOn, setEditedCommittedOn] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      setIsLoading(true);
      const activityData = await databaseService.getActivityById(activityId);
      if (activityData) {
        setActivity(activityData);
        setEditedHandle(activityData.handle);
        setEditedCommittedOn(activityData.committed_on);
        setEditedTags([...activityData.tags]);
      } else {
        Alert.alert('Error', 'Activity not found', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
      Alert.alert('Error', 'Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (activity) {
      setEditedHandle(activity.handle);
      setEditedCommittedOn(activity.committed_on);
      setEditedTags([...activity.tags]);
      setNewTag('');
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedHandle.trim()) {
      Alert.alert('Error', 'Please enter a handle for this activity');
      return;
    }

    if (!editedCommittedOn) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    setIsSaving(true);

    try {
      const updates: Partial<NewActivity> = {
        handle: editedHandle.trim(),
        committed_on: editedCommittedOn,
        tags: editedTags,
      };

      const updatedActivity = await databaseService.updateActivity(activityId, updates);
      if (updatedActivity) {
        setActivity(updatedActivity);
        setIsEditing(false);
        Alert.alert('Success', 'Activity updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update activity');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      Alert.alert('Error', 'Failed to update activity');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      const success = await databaseService.deleteActivity(activityId);
      if (success) {
        Alert.alert('Success', 'Activity deleted successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      Alert.alert('Error', 'Failed to delete activity');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Activity not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Activity Details</Text>
        <View style={styles.headerActions}>
          {!isEditing ? (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Ionicons name="pencil" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Ionicons name="trash" size={20} color="#dc3545" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, isSaving && styles.actionButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Ionicons name="checkmark" size={20} color="#28a745" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Handle</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedHandle}
              onChangeText={setEditedHandle}
              placeholder="Activity handle"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.value}>{activity.handle}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Committed</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedCommittedOn}
              onChangeText={setEditedCommittedOn}
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <Text style={styles.value}>{formatDate(activity.committed_on)}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          {isEditing ? (
            <>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add a tag"
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {editedTags.map((tag, index) => (
                  <View key={index} style={styles.editableTag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => removeTag(tag)}
                      style={styles.removeTagButton}
                    >
                      <Ionicons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.tagsContainer}>
              {activity.tags.length === 0 ? (
                <Text style={styles.emptyText}>No tags</Text>
              ) : (
                activity.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created</Text>
          <Text style={styles.value}>{formatDateTime(activity.created_at)}</Text>
        </View>

        {activity.updated_at !== activity.created_at && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Updated</Text>
            <Text style={styles.value}>{formatDateTime(activity.updated_at)}</Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e7f3ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editableTag: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  removeTagButton: {
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
