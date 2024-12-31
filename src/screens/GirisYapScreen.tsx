// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { auth } from '../services/firebaseConfig';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};
//
type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'GirisYap'>;

export function GirisYapScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace('Anasayfa');
    } catch (error: any) {
      Alert.alert('Giriş Yaparken hata oluştu!', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giriş Yap</Text>
      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonCreate} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Hesap Oluştur</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F0F8FF',  // Light blue background for a fresh feel
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',  // Dark gray text color
  },
  input: {
    height: 50,
    borderColor: '#4CAF50',  // Green border for a positive and modern look
    borderWidth: 1.5,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF5733',  // Orange-red color to stand out
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonCreate : {
    backgroundColor: '#007bff', // Solid background color
    paddingVertical: 12, // Vertical padding for the button
    paddingHorizontal: 15, // Horizontal padding
    borderRadius: 30, // Rounded corners
    alignItems: 'center', // Center text horizontally
    justifyContent: 'center', // Center text vertically
    marginTop: 20, // Space between other elements and button
    shadowColor: '#007bff', // Shadow color matches button color
    shadowOffset: { width: 0, height: 4 }, // Create depth
    shadowOpacity: 0.2, // Slight shadow opacity
    shadowRadius: 6, // Spread of the shadow
    elevation: 5, // Elevation for Android
    width : 200
  },
  linkText: {
    color: '#fff', // White text color
    fontSize: 15, // Text size
    fontWeight: 'bold', // Bold text
  },
});