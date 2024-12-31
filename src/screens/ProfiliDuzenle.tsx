import React, { useState, useEffect } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RadioButton } from 'react-native-paper'; // RadioButton için react-native-paper paketini ekleyin
import { auth, firestore } from '../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfilDuzenle'>;

async function updateUserProfileInFirestore(userId: string, profileData: { //
  name?: string, 
  surname?: string, 
  weight?: number, 
  height?: number, 
  dateOfBirth?: string, 
  gender?: string 
  }) {
  try {
    const userDoc = doc(firestore, 'users', userId);
    await updateDoc(userDoc, profileData);
  } catch (error: any) {
    throw new Error('Kullanıcı Profili Güncellenirken Hata!');
  }
}

export function ProfiliDuzenleScreen({ navigation }: EditProfileScreenProps) {
  const [profile, setProfile] = useState({
    name: '',
    surname: '',
    weight: '',
    height: '',
    dateOfBirth: new Date(),
    gender: 'Erkek' // varsayılan olarak erkek seçili
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userProfile = userDoc.data();
          setProfile({
            ...userProfile,
            weight: userProfile.weight.toString(),
            height: userProfile.height.toString(),
            dateOfBirth: new Date(userProfile.dateOfBirth)
          });
        } else {
          throw new Error('Kullanıcı Profili Bulunamadi!');
        }
      }
    } catch (error) {
      console.error('Profil yüklenirken hata oluştu:', error);
    }
  };

  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updateUserProfileInFirestore(currentUser.uid, {
        name: profile.name,
        surname: profile.surname,
        weight: parseFloat(profile.weight),
        height: parseFloat(profile.height),
        dateOfBirth: profile.dateOfBirth.toISOString().split('T')[0],
        gender: profile.gender
      });

      Alert.alert('Başarı', 'Profil başarıyla güncellendi', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Ad"
        value={profile.name}
        onChangeText={(text) => setProfile({ ...profile, name: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Soyad"
        value={profile.surname}
        onChangeText={(text) => setProfile({ ...profile, surname: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Ağırlık (kg)"
        value={profile.weight}
        onChangeText={(text) => setProfile({ ...profile, weight: text })}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Boy (cm)"
        value={profile.height}
        onChangeText={(text) => setProfile({ ...profile, height: text })}
        keyboardType="numeric"
      />

      {/* Date Picker */}
      <TouchableOpacity 
        style={styles.datePicker}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>{profile.dateOfBirth.toISOString().split('T')[0]}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={profile.dateOfBirth}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false); // Tarih seçildikten sonra picker'ı kapat
            if (selectedDate) {
              setProfile({ ...profile, dateOfBirth: selectedDate });
            }
          }}
        />
      )}

      {/* Cinsiyet Seçimi (Radio Button) */}
      <View style={styles.radioGroup}>
        <Text style={styles.label}>Cinsiyet</Text>
        <View style={styles.radioButtonContainer}>
          <RadioButton
            value="Erkek"
            status={profile.gender === 'Erkek' ? 'checked' : 'unchecked'}
            onPress={() => setProfile({ ...profile, gender: 'Erkek' })}
          />
          <Text style={styles.radioLabel}>Erkek</Text>
        </View>
        <View style={styles.radioButtonContainer}>
          <RadioButton
            value="Kadın"
            status={profile.gender === 'Kadın' ? 'checked' : 'unchecked'}
            onPress={() => setProfile({ ...profile, gender: 'Kadın' })}
          />
          <Text style={styles.radioLabel}>Kadın</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Değişiklikleri Kaydet</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 15,
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  datePicker: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  radioGroup: {
    marginBottom: 15,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioLabel: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
});
