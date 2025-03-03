import React from 'react';
import { SafeAreaView, Text, Button, View } from 'react-native';
import { usePlaidLink } from 'react-native-plaid-link-sdk';

const App = () => {
  const { open, ready, error } = usePlaidLink({
    tokenConfig: {
      token: 'GENERATED_LINK_TOKEN', // Replace with your generated link token
    },
    onSuccess: (success) => {
      console.log('Plaid Link Success:', success.publicToken, success.metadata);
    },
    onExit: (exit) => {
      console.log('Plaid Link Exit:', exit.error, exit.metadata);
    },
  });

  if (error) {
    return (
      <SafeAreaView>
        <Text>Error: {error.message}</Text>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <Text>FlexiBill App - Plaid Link Integration</Text>
      <Button title="Link Account" onPress={() => open()} />
    </SafeAreaView>
  );
};

export default App;