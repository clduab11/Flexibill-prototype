import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlaidService, { PlaidLinkToken, PlaidLinkMetadata } from '../services/PlaidService';

interface LinkAccountScreenProps {
  navigation: any;
}

const LinkAccountScreen: React.FC<LinkAccountScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Fetch the link token from the backend
  const fetchLinkToken = useCallback(async () => {
    console.log('Fetching Plaid Link token...');
    setLoading(true);
    try {
      const linkTokenData = await PlaidService.createLinkToken();
      console.log('Plaid Link token fetched:', linkTokenData);
      
      if (linkTokenData) {
        setLinkToken(linkTokenData.linkToken);
      } else {
        throw new Error('Failed to get link token');
      }
    } catch (error) {
      console.error('Error fetching link token:', error);
      Alert.alert('Error', 'Failed to fetch link token. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  const handleConnectBank = useCallback(async () => {
    if (!linkToken) {
      Alert.alert('Error', 'Link token not available. Please try again.');
      return;
    }

    setLoading(true);
    try {
      console.log('Simulating Plaid Link with token:', linkToken);
      
      // In a real implementation, we would use the Plaid SDK to open the link
      // For now, we'll just simulate a successful connection
      Alert.alert(
        "Plaid Integration",
        "In a real implementation, this would open the Plaid Link interface to connect your bank account. For now, we'll simulate a successful connection.",
        [
          {
            text: "Simulate Success",
            onPress: async () => {
              try {
                // Simulate a successful account linking
                const success = await PlaidService.simulateSuccessfulLink();
                if (success) {
                  Alert.alert(
                    "Account Linked",
                    "Your bank account has been successfully linked to FlexiBill.",
                    [{ text: "OK", onPress: () => navigation.navigate('Home') }]
                  );
                } else {
                  throw new Error('Failed to link account');
                }
              } catch (error) {
                console.error('Error in simulated link:', error);
                Alert.alert('Error', 'Failed to link account. Please try again.');
              } finally {
                setLoading(false);
              }
            }
          },
          {
            text: "Simulate Failure",
            onPress: () => {
              setLoading(false);
              Alert.alert('Error', 'Failed to link account. Please try again.');
            }
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setLoading(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error opening Plaid Link:', error);
      Alert.alert('Error', 'Failed to open Plaid Link. Please try again.');
      setLoading(false);
    }
  }, [linkToken, navigation]);

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
          onPress={handleConnectBank}
          disabled={loading || !linkToken}
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