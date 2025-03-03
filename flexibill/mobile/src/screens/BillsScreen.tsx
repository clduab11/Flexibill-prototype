import React, { useState } from 'react';
import { Text, FlatList, View, StyleSheet, Button, Modal, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bill } from '../../../shared/types';

// Mock data for bills (replace with actual data from backend)
const mockBills: Bill[] = [
  { 
    id: '1', 
    userId: 'user123',
    name: 'Rent', 
    amount: 1500, 
    dueDate: '2025-03-15', 
    category: 'Housing',
    frequency: 'monthly',
    autopay: false
  },
  { 
    id: '2', 
    userId: 'user123',
    name: 'Utilities', 
    amount: 200, 
    dueDate: '2025-03-20', 
    category: 'Utilities',
    frequency: 'monthly',
    autopay: false
  },
  { id: '3', userId: 'user123', name: 'Credit Card', amount: 100, dueDate: '2025-03-25', category: 'Debt', frequency: 'monthly', autopay: false },
];

interface BillsScreenProps {
  navigation: any;
}

const BillsScreen: React.FC<BillsScreenProps> = ({ navigation }) => {
  const [bills, setBills] = useState(mockBills);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  const handleRequestDateChange = (bill: typeof mockBills[0]) => {
    setSelectedBill(bill);
    setNewDueDate(bill.dueDate);
    setModalVisible(true);
  };

  const submitDateChangeRequest = () => {
    if (!selectedBill) return;

    // In a real implementation, this would send a request to the backend
    console.log(`Requesting date change for ${selectedBill.name} from ${selectedBill.dueDate} to ${newDueDate}`);

    // For demo purposes, update the bill in the local state
    const updatedBills = bills.map(bill => 
      bill.id === selectedBill.id ? { ...bill, dueDate: newDueDate } : bill
    );
    setBills(updatedBills);

    // Show success message
    Alert.alert(
      "Request Submitted",
      `We've sent a request to change the due date for ${selectedBill.name} to ${newDueDate}.`,
      [{ text: "OK" }]
    );

    // Close the modal
    setModalVisible(false);
    setSelectedBill(null);
  };

  const handleAddBill = () => {
    // In a real implementation, this would navigate to an add bill screen
    Alert.alert("Coming Soon", "Add bill functionality will be available in the next update.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Bills</Text>
        <TouchableOpacity onPress={handleAddBill}><Text style={styles.addButton}>+ Add Bill</Text></TouchableOpacity>
      </View>
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id || ''}
        renderItem={({ item }) => (
          <View style={styles.billItem}>
            <View style={styles.billInfo}>
              <Text style={styles.billName}>{item.name}</Text>
              <Text>Amount: ${item.amount}</Text>
              <Text>Due Date: {item.dueDate}</Text>
              <Text>Category: {item.category}</Text>
            </View>
            <Button 
              title="Change Due Date" 
              onPress={() => handleRequestDateChange(item)} 
            />
          </View>
        )}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Due Date</Text>
            <Text>Current due date: {selectedBill?.dueDate}</Text>
            <TextInput
              style={styles.input}
              value={newDueDate}
              onChangeText={setNewDueDate}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.modalText}>
              We'll contact your biller to request this change. This process may take a few business days.
            </Text>
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Submit Request" onPress={submitDateChangeRequest} />
            </View>
          </View>
        </View>
      </Modal>
      
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  },
  addButton: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  billItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
  },
  modalText: {
    marginVertical: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default BillsScreen;