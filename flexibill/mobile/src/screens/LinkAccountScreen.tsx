import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LinkAccountScreenProps {
  navigation: any;
}

const LinkAccountScreen: React.FC<LinkAccountScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleLinkAccount = () => {
    setLoading(true);

    // In a real implementation, this would open the Plaid Link UI
    // For Phase 1, simulate a successful account link
    setTimeout(() => {
      setLoading(false);
      
      // Show success message
      Alert.alert(
        "Account Linked",
        "Your bank account has been successfully linked to FlexiBill.",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Link a New Account</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.subtitle}>
          Connect your bank account to automatically import transactions and bills.
        </Text>
        
        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>Your Security is Our Priority</Text>
          <Text style={styles.securityText}>
            • We use bank-level encryption to protect your data
          </Text>
          <Text style={styles.securityText}>
            • We never store your bank login credentials
          </Text>
          <Text style={styles.securityText}>
            • We use Plaid, a trusted service used by major financial apps
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={handleLinkAccount}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.linkButtonText}>Connect Bank Account</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.supportContainer}>
        <Text style={styles.supportText}>
          Having trouble? Contact our support team for assistance.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2e7d32',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
    lineHeight: 22,
  },
  securityInfo: {
    backgroundColor: '#f0f7f0',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  securityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  linkButton: {
    backgroundColor: '#2e7d32',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  cancelButtonText: {
    color: '#2e7d32',
    fontSize: 16,
  },
  supportContainer: {
    alignItems: 'center',
  },
  supportText: {
    color: '#666',
    fontSize: 14,
  },
});

export default LinkAccountScreen;