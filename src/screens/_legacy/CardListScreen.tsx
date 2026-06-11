import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type CardListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CardList'>;

interface Props {
  navigation: CardListScreenNavigationProp;
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

// Dummy data for demonstration
const DUMMY_CARDS: CardData[] = [
  {
    id: '1',
    name: 'John Doe',
    company: 'Acme Corp',
    email: 'john@example.com',
    phone: '+1234567890',
    jobTitle: 'CEO',
    createdAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    company: 'Tech Solutions',
    email: 'jane@example.com',
    phone: '+0987654321',
    jobTitle: 'CTO',
    createdAt: '2023-01-02T00:00:00.000Z',
  },
];

export default function CardListScreen({ navigation }: Props) {
  const [cards, setCards] = useState<CardData[]>(DUMMY_CARDS);

  const renderCardItem = ({ item }: { item: CardData }) => (
    <TouchableOpacity
      style={styles.cardItem}
      onPress={() => navigation.navigate('CardDetail', { cardData: item })}
    >
      <View style={styles.cardContent}>
        <View style={styles.textContent}>
          <Text style={styles.name}>{item.name || 'Unknown Name'}</Text>
          <Text style={styles.company}>{item.company || 'Unknown Company'}</Text>
          {item.jobTitle && <Text style={styles.jobTitle}>{item.jobTitle}</Text>}
        </View>
        <View style={styles.cardImage}>
          <Text style={styles.imagePlaceholder}>📇</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleScanNew = () => {
    navigation.navigate('Camera');
  };

  const handleSearch = () => {
    Alert.alert('Search', 'Search functionality will be implemented in Phase 2');
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No business cards yet</Text>
      <Text style={styles.emptySubtext}>Start by scanning your first card!</Text>
      <TouchableOpacity style={styles.scanButton} onPress={handleScanNew}>
        <Text style={styles.scanButtonText}>Scan First Card</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Business Cards</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleScanNew}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={cards}
        renderItem={renderCardItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={cards.length === 0 ? styles.listContainer : styles.listContainerWithData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchButtonText: {
    fontSize: 18,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    flexGrow: 1,
  },
  listContainerWithData: {
    paddingTop: 10,
  },
  cardItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 14,
    color: '#666',
  },
  cardImage: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  imagePlaceholder: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
