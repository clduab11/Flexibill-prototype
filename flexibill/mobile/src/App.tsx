import React, { useState } from 'react';
import { SafeAreaView, Text, Button, View, StyleSheet } from 'react-native';
import BillsScreen from './screens/BillsScreen';

// Mock data for linked accounts
const mockLinkedAccounts = [
  { id: '1', name: 'Chase Checking', mask: '1234' },
  { id: '2', name: 'Bank of America Savings', mask: '5678' }
];

const App = () => {
  const [screen, setScreen] = useState<'home' | 'bills' | 'linkAccount'>('home');
  const [accounts, setAccounts] = useState(mockLinkedAccounts);
  
  // Placeholder for Plaid Link integration
  const handleLinkAccount = () => {
    // In a real implementation, this would open the Plaid Link UI
    console.log('Linking account...');
    
    // For demo purposes, simulate a successful account link
    setTimeout(() => {
      const newAccount = {
        id: `${accounts.length + 1}`,
        name: `Demo Bank ${accounts.length + 1}`,
        mask: Math.floor(1000 + Math.random() * 9000).toString()
      };
      setAccounts([...accounts, newAccount]);
      alert('Account linked successfully!');
      setScreen('home');
    }, 1000);
  };

  if (screen === 'linkAccount') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Link a New Account</Text>
        <Text style={styles.subtitle}>
          Connect your bank account to automatically import transactions and bills.
        </Text>
        <Button title="Connect Bank Account" onPress={handleLinkAccount} />
        <Button title="Back to Home" onPress={() => setScreen('home')} />
      </SafeAreaView>
    );
  }

  if (screen === 'bills') {
    return (
      <SafeAreaView style={styles.container}>
        <BillsScreen />
        <Button title="Back to Home" onPress={() => setScreen('home')} />
      </SafeAreaView>
    );
  }

  // Home screen
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>FlexiBill App</Text>
      <Text style={styles.subtitle}>Linked Accounts: {accounts.length}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Link New Account" onPress={() => setScreen('linkAccount')} />
        <View style={styles.buttonSpacer} />
        <Button title="View Bills" onPress={() => setScreen('bills')} />
      </View>
      {accounts.map(account => (
        <View key={account.id} style={styles.accountItem}>
          <Text style={styles.accountName}>{account.name}</Text>
          <Text>Account ending in {account.mask}</Text>
        </View>
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  buttonSpacer: {
    width: 8,
  },
  accountItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;