import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from '@firebase/auth';
import { auth, firestore } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type Props = NativeStackScreenProps<RootStackParamList, 'Anasayfa'>;

interface UserProfile {
  name: string;
  surname: string;
  weight: number;
  height: number;
  dateOfBirth: string;
  gender: string;
  role: string;
}

export function AdminHomePageScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = async () => {
              try {
                await signOut(auth);
                navigation.navigate('Login');
                // Navigation will be handled by the auth state listener
              } catch (error) {
                Alert.alert('Error', 'Çıkış yaparken hata oluştu!');
              }
            }
;

  const loadProfile = async () => {
    try {
        var userProfile;
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
		  if (userDoc.exists()) {
			userProfile= userDoc.data();
		  } else {
			throw new Error('Kullanıcı Bulunamadı!');
		  }
        setProfile(userProfile as UserProfile);
      }
    } catch (error) {
      console.error('Profil yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Kişi İkonu ve İsim Soyisim */}
      <View style={styles.profileHeader}>
        <View style={styles.profileIcon}>
          <Ionicons name="person" size={50} color="white" />
        </View>
        <Text style={styles.profileName}>Dr. {profile?.name} {profile?.surname}</Text>
      </View>

      {/* Butonlar */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('UserList')}
        >
          <Text style={styles.buttonText}>Hasta Listesine Git</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.buttonText}>Profili Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.button, styles.logoutButton]}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileIcon: {
    backgroundColor: '#007AFF',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    marginTop: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#4CAF50', // Düzenleme butonu için yeşil renk
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30', // Çıkış butonu için kırmızı renk
  },
});
