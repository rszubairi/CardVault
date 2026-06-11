import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import Communications from 'react-native-communications';

type CardDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CardDetail'>;
type CardDetailScreenRouteProp = RouteProp<RootStackParamList, 'CardDetail'>;

interface Props {
  navigation: CardDetailScreenNavigationProp;
  route: CardDetailScreenRouteProp;
}

interface CardData {
  id: string;
  imageUri?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  jobTitle?: string;
  createdAt: string;
}

export default function CardDetailScreen({ navigation, route }: Props) {
  const { cardData } = route.params;

  const handleCall = () => {
    if (cardData.phone) {
      Communications.phonecall(cardData.phone, false);
    } else {
      Alert.alert('No phone number', 'This card does not have a phone number');
    }
  };

  const handleEmail = () => {
    if (cardData.email) {
      Communications.email([cardData.email], null, null, 'Hello', '');
    } else {
      Alert.alert('No email address', 'This card does not have an email address');
    }
  };

  const handleSMS = () => {
    if (cardData.phone) {
      Communications.text(cardData.phone, '');
    } else {
      Alert.alert('No phone number', 'This card does not have a phone number');
    }
  };

  const handleSave = () => {
    Alert.alert('Success', 'Card saved to your collection!');
    navigation.navigate('CardList');
  };

  const handleEdit = () => {
    Alert.alert('Edit', 'Edit functionality will be implemented in Phase 2');
  };

  if (!cardData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Card data not available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {cardData.imageUri && (
        <Image source={{ uri: cardData.imageUri }} style={styles.cardImage} />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{cardData.name || 'Unknown Name'}</Text>
          {cardData.company && (
            <Text style={styles.company}>{cardData.company}</Text>
          )}
          {cardData.jobTitle && (
            <Text style={styles.jobTitle}>{cardData.jobTitle}</Text>
          )}
        </View>

        <View style={styles.infoSection}>
          {cardData.phone && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{cardData.phone}</Text>
            </View>
          )}

          {cardData.email && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{cardData.email}</Text>
            </View>
          )}

          {cardData.website && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Website:</Text>
              <Text style={styles.infoValue}>{cardData.website}</Text>
            </View>
          )}

          {cardData.address && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{cardData.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSMS}>
            <Text style={styles.actionButtonText}>SMS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Save Card</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleEdit}>
            <Text style={styles.secondaryButtonText}>Edit Card</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  company: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomActions: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginTop: 50,
  },
});
