import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import ApiService from '../services/ApiService';

type AuthMode = 'login' | 'register';

interface AuthScreenProps {
  navigation: any;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (mode === 'login') {
        response = await ApiService.login(email, password);
      } else {
        response = await ApiService.register(email, password, firstName, lastName);
      }
      
      if (response.success) {
        setLoading(false);
        navigation.navigate('Home');
      } else {
        setLoading(false);
        setError(response.error?.message || 'Authentication failed');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please try again.');
      console.error('Auth error:', err);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      const response = await ApiService.forgotPassword(email);
      
      if (response.success) {
        Alert.alert('Password Reset', 'If your email is registered, you will receive password reset instructions.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset');
      console.error('Auth error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>FlexiBill</Text>
      <Text style={styles.subtitle}>Manage your bills with ease</Text>

      <View style={styles.formContainer}>
        <Text style={styles.title}>{mode === 'login' ? 'Login' : 'Create Account'}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {mode === 'register' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
          </>
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.authButton}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authButtonText}>
              {mode === 'login' ? 'Login' : 'Register'}
            </Text>
          )}
        </TouchableOpacity>

        {mode === 'login' && (
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
            <Text style={styles.forgotText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
          <Text style={styles.toggleText}>
            {mode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2e7d32',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  authButton: {
    backgroundColor: '#2e7d32',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  toggleText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  forgotButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  forgotText: {
    color: '#666',
    fontSize: 14,
  },
});

export default AuthScreen;