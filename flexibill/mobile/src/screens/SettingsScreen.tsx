import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataSharingPreferences, SharingLevel } from '../../../shared/types';
import ApiService from '../services/ApiService';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [subscription, setSubscription] = useState<'free' | 'premium'>('free');
  const [dataSharing, setDataSharing] = useState<DataSharingPreferences>({
    sharingLevel: 'none',
    anonymizeAmount: true,
    anonymizeDates: true
  });

  const handleSharingLevelChange = (level: SharingLevel) => {
    setDataSharing({
      ...dataSharing,
      sharingLevel: level
    });

    if (level !== 'none' && subscription === 'free') {
      Alert.alert(
        "Discount Available",
        "By sharing your anonymized data, you can get a discount on premium subscription. Upgrade now?",
        [
          { text: "Not Now", style: "cancel" },
          { text: "Learn More", onPress: () => handleUpgradePress() }
        ]
      );
    }
  };

  const handleUpgradePress = () => {
    Alert.alert(
      "Upgrade to Premium",
      "Premium features include:\n\n• Advanced AI recommendations\n• Unlimited bill tracking\n• Priority due date change requests\n• Premium customer support\n\nPrice: $5.99/month or save with $59.99/year",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Upgrade", 
          onPress: async () => {
            const response = await ApiService.post('/subscription/upgrade', { plan: 'premium' });
            if (response.success) {
              setSubscription('premium');
              Alert.alert("Success", "You've been upgraded to Premium!");
            } else {
              Alert.alert("Error", "Failed to upgrade. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: async () => {
            await ApiService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Email</Text>
            <Text style={styles.settingValue}>user@example.com</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Subscription</Text>
            <View style={styles.subscriptionContainer}>
              <Text style={[
                styles.subscriptionBadge,
                subscription === 'premium' ? styles.premiumBadge : styles.freeBadge
              ]}>
                {subscription === 'premium' ? 'Premium' : 'Free'}
              </Text>
              {subscription === 'free' && (
                <TouchableOpacity onPress={handleUpgradePress}>
                  <Text style={styles.upgradeText}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing</Text>
          <Text style={styles.sectionDescription}>
            Share anonymized data to help improve our service and get discounts on premium features.
          </Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Sharing Level</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  dataSharing.sharingLevel === 'none' && styles.pickerOptionSelected
                ]}
                onPress={() => handleSharingLevelChange('none')}
              >
                <Text style={dataSharing.sharingLevel === 'none' ? styles.pickerTextSelected : styles.pickerText}>
                  None
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  dataSharing.sharingLevel === 'basic' && styles.pickerOptionSelected
                ]}
                onPress={() => handleSharingLevelChange('basic')}
              >
                <Text style={dataSharing.sharingLevel === 'basic' ? styles.pickerTextSelected : styles.pickerText}>
                  Basic
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  dataSharing.sharingLevel === 'full' && styles.pickerOptionSelected
                ]}
                onPress={() => handleSharingLevelChange('full')}
              >
                <Text style={dataSharing.sharingLevel === 'full' ? styles.pickerTextSelected : styles.pickerText}>
                  Full
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Anonymize Amounts</Text>
            <Switch
              value={dataSharing.anonymizeAmount}
              onValueChange={(value) => setDataSharing({...dataSharing, anonymizeAmount: value})}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={dataSharing.anonymizeAmount ? '#2e7d32' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Anonymize Dates</Text>
            <Switch
              value={dataSharing.anonymizeDates}
              onValueChange={(value) => setDataSharing({...dataSharing, anonymizeDates: value})}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={dataSharing.anonymizeDates ? '#2e7d32' : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={true}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={true ? '#2e7d32' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={false}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={false ? '#2e7d32' : '#f4f3f4'}
            />
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>FlexiBill v1.0.0</Text>
      </ScrollView>
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
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  subscriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  freeBadge: {
    backgroundColor: '#e0e0e0',
    color: '#333',
  },
  premiumBadge: {
    backgroundColor: '#ffd700',
    color: '#333',
  },
  upgradeText: {
    marginLeft: 8,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: 4,
  },
  pickerOptionSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  pickerText: {
    color: '#333',
  },
  pickerTextSelected: {
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 24,
  },
});

export default SettingsScreen;
