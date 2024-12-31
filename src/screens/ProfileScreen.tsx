import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, firestore } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
  name: string;
  surname: string;
  weight: number;
  height: number;
  dateOfBirth: string;
  gender: string;
  role: string;
}

export function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      var userProfile;
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
		  if (userDoc.exists()) {
			userProfile = userDoc.data();
		  } else {
			throw new Error('Kullanıcı profili bulunamadi!');
		  }
        setProfile(userProfile as UserProfile);
      }
    } catch (error) {
      console.error('Profil yüklenirken hata oluştu:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProfile().finally(() => setRefreshing(false));
  }, []);

  if (!profile) {
    return <View style={styles.container}><Text>Yükleniyor...</Text></View>;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.editButtonText}>Profili Düzenle</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.label}>Ad Soyad</Text>
        <Text style={styles.value}>{profile.name} {profile.surname}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Ağırlık</Text>
        <Text style={styles.value}>{profile.weight} kg</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Boy</Text>
        <Text style={styles.value}>{profile.height} cm</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Doğum Tarihi</Text>
        <Text style={styles.value}>{profile.dateOfBirth}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Cinsiyet</Text>
        <Text style={styles.value}>{profile.gender}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Rol</Text>
        <Text style={styles.value}>{profile.role}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f5',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 30,
  },
  editButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});
