import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, FlatList, View, StyleSheet, Button, ActivityIndicator } from 'react-native';

// Mock data for AI recommendations (replace with actual API calls)
const mockRecommendations = [
  {
    billId: '1',
    currentDueDate: '2025-03-15',
    recommendedDueDate: '2025-03-20',
    reason: 'Moving this bill closer to your payday would improve your cash flow.',
    savingsEstimate: 0
  },
  {
    billId: '2',
    currentDueDate: '2025-03-20',
    recommendedDueDate: '2025-03-25',
    reason: 'This bill is due very close to your rent payment. Spreading them out can help manage cash flow.',
    savingsEstimate: 0
  }
];

const mockCashFlow = {
  period: 'monthly',
  incomeDays: ['1st', '15th'],
  highExpenseDays: ['5th', '20th'],
  lowBalanceDays: ['10th-14th', '25th-30th'],
  recommendations: [
    'Consider moving your utility bill from the 12th to the 17th to better align with your income',
    'Your rent payment on the 1st is close to your income day, but you might want a buffer of 1-2 days',
    'Try to schedule automatic savings transfers on income days to ensure consistent saving'
  ]
};

const AIRecommendationsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(mockRecommendations);
  const [cashFlow, setCashFlow] = useState(mockCashFlow);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  const handleApplyRecommendation = (recommendation) => {
    // In a real implementation, this would call the API to request a date change
    console.log(`Applying recommendation for bill ${recommendation.billId}`);
    
    // Show success message
    alert(`We've submitted a request to change the due date for this bill to ${recommendation.recommendedDueDate}.`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>AI Recommendations</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Analyzing your bills and cash flow...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AI Recommendations</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill Due Date Recommendations</Text>
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.billId}
          renderItem={({ item }) => (
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationTitle}>Due Date Change</Text>
              <Text>Current: {item.currentDueDate}</Text>
              <Text>Recommended: {item.recommendedDueDate}</Text>
              <Text style={styles.reason}>{item.reason}</Text>
              <Button 
                title="Apply This Recommendation" 
                onPress={() => handleApplyRecommendation(item)} 
              />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No recommendations at this time. Check back later!</Text>
          }
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cash Flow Analysis</Text>
        <View style={styles.cashFlowItem}>
          <Text>Income days: {cashFlow.incomeDays.join(', ')}</Text>
          <Text>High expense days: {cashFlow.highExpenseDays.join(', ')}</Text>
          <Text>Low balance days: {cashFlow.lowBalanceDays.join(', ')}</Text>
          
          <Text style={styles.recommendationsTitle}>Suggestions:</Text>
          {cashFlow.recommendations.map((rec, index) => (
            <Text key={index} style={styles.cashFlowRecommendation}>• {rec}</Text>
          ))}
        </View>
      </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  recommendationItem: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reason: {
    marginVertical: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  cashFlowItem: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
  },
  recommendationsTitle: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  cashFlowRecommendation: {
    marginBottom: 4,
  },
});

export default AIRecommendationsScreen;