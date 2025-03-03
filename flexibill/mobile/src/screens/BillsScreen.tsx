import React, { useState } from 'react';
import { SafeAreaView, Text, FlatList, View, StyleSheet, Button, Modal, TextInput, Alert } from 'react-native';

// Mock data for bills (replace with actual data from backend)
const mockBills = [
  { id: '1', name: 'Rent', amount: 1500, dueDate: '2025-03-15', category: 'Housing' },
  { id: '2', name: 'Utilities', amount: 200, dueDate: '2025-03-20', category: 'Utilities' },
  { id: '3', name: 'Credit Card', amount: 100, dueDate: '2025-03-25', category: 'Debt' },
];

const BillsScreen = () => {
  const [bills, setBills] = useState(mockBills);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<typeof mockBills[0] | null>(null);
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Bills</Text>
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
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
    marginBottom: 16,
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
});

export default BillsScreen;