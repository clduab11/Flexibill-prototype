import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Account {
  id: string;
  name: string;
  mask: string;
}

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch accounts from the API
    // For Phase 1, use mock data
    setTimeout(() => {
      setAccounts([
        { id: '1', name: 'Chase Checking', mask: '1234' },
        { id: '2', name: 'Bank of America Savings', mask: '5678' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleLinkAccount = () => {
    navigation.navigate('LinkAccount');
  };

  const handleViewBills = () => {
    navigation.navigate('Bills');
  };

  const handleViewRecommendations = () => {
    navigation.navigate('AIRecommendations');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>FlexiBill</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading your accounts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FlexiBill</Text>
        <TouchableOpacity onPress={handleSettings}>
          <Text style={styles.settingsButton}>Settings</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Linked Accounts: {accounts.length}</Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLinkAccount}>
          <Text style={styles.actionButtonText}>Link Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleViewBills}>
          <Text style={styles.actionButtonText}>View Bills</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleViewRecommendations}>
          <Text style={styles.actionButtonText}>AI Recommendations</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Accounts</Text>
      
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.accountItem}>
            <Text style={styles.accountName}>{item.name}</Text>
            <Text style={styles.accountMask}>•••• {item.mask}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No accounts linked yet.</Text>
            <TouchableOpacity onPress={handleLinkAccount}>
              <Text style={styles.linkText}>Link your first account</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  settingsButton: {
    fontSize: 16,
    color: '#2e7d32',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  accountItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  accountMask: {
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  linkText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;