// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { RadioButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from '@firebase/auth';

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'KayitOl'>;

export function KayitScreen({ navigation }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState('Erkek');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Tüm alanlar girilmelidir!');
      return;
    }

    // if (password !== confirmPassword) {
    //   Alert.alert('Error', 'Passwords do not match');
    //   return;
    // }

    if (password.length < 4) {
      Alert.alert('Error', 'Şifre en az 4 haneli olmalıdır!');
      return;
    }

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
       
      const user = userCredential.user;
      
      
      // Create user profile in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        name: firstName,
        surname: lastName,
        weight: parseFloat(weight),
        height: parseFloat(height),
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        gender: gender,
        role: 'user', // Set default role as user
        createdAt: new Date().toISOString()})

      const currentUser = auth.currentUser;
		  if (!currentUser) {
			throw new Error('No user is currently signed in');
		  }
	
		  await updateProfile(currentUser, {displayName: `${firstName} ${lastName}`});

      // Navigate to home or show success
      Alert.alert('Success', 'Hesap oluşturuldu!', [
        {
          text: 'OK', 
          onPress: () => navigation.replace('Anasayfa')
        }
      ]);
    } catch (error: any) {
      Alert.alert('Kayıt olma hatası!', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create Account</Text>
      
      <View style={styles.nameContainer}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>
      
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
      
      {/* <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      /> */}

      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
      />

      <TouchableOpacity 
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{dateOfBirth ? formatDate(dateOfBirth) : 'Select Date of Birth'}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDateOfBirth(selectedDate);
            }
          }}
        />
      )}

<View style={styles.radioGroup}>
        <View style={styles.radioItem}>
          <RadioButton
            value="Erkek"
            status={gender === 'Erkek' ? 'checked' : 'unchecked'}
            onPress={() => setGender('Erkek')}
            color="#6200ee"
            uncheckedColor="#6200ee"
          />
          <Text>Erkek</Text>
        </View>

        <View style={styles.radioItem}>
          <RadioButton
            value="Kadın"
            status={gender === 'Kadın' ? 'checked' : 'unchecked'}
            onPress={() => setGender('Kadın')}
            color="#6200ee"
            uncheckedColor="#6200ee"
          />
          <Text>Kadın</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  halfInput: {
    width: '48%', // Slightly less than half to account for spacing
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  linkText: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 15,
  },
  dateButton: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    justifyContent: 'center'
  },
  radioGroup: {
    flexDirection: 'row',
    width: '100%',
    marginBottom : 20
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    borderWidth: 2, // Kenarlık kalınlığı
    borderColor: '#6200ee', // Kenarlık rengi
    borderRadius: 50, // Yuvarlak kenarlık için
    width: 24, // Genişlik
    height: 24, // Yükseklik
    marginRight: 10, // Butonlar arasındaki boşluk
  },
});