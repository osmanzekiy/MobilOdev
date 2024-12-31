// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '../services/firebaseConfig';
import { GirisYapScreen } from '../screens/GirisYapScreen';
import { KayitScreen } from '../screens/KayitScreen';
import { TestListeScreen } from '../screens/TestListeScreen';
import { TahlilEkle } from '../screens/TahlilEkleScreen';
import { TestDetaylariScreen } from '../screens/TestDetaylariScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProfiliDuzenleScreen } from '../screens/ProfiliDuzenle';
import { KullanicilarScreen } from '../screens/KullanicilarScreen';
import { KullaniciDetayScreen } from '../screens/KullaniciDetayScreen';
import { AdminHomePageScreen } from '../screens/AdminHomePageScreen';
import { AnasayfaScreen } from '../screens/AnasayfaScreen';
import { OncekiDegerlerScreen } from '../screens/OncekiDegerlerScreen';
import { doc, getDoc } from 'firebase/firestore';

// Root stack param list type
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  BloodTestList: undefined;
  TahlilEkle: { userId: string };
  TestDetail: { testId: string, userId: string };
  Profile: undefined;
  EditProfile: undefined;
  ProfilDuzenle : undefined;
  UserList: undefined;
  UserDetail: { userId: string };
  AdminHome: undefined;
  OncekiDegerler : {testId : string, userId: string};
  TestDetaylari: { testId: string, userId: string };
  TestListesi : undefined;
  Kullanicilar: undefined;
  KullaniciDetay: { userId: string };
  KayitOl: undefined;
  GirisYap: undefined;
  Anasayfa: undefined;

};

const checkUserRole = async (userId: string): Promise<string> => {
  var userProfile;
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
    userProfile = userDoc.data();
    } else {
    throw new Error('User profile not found');
    }
  } catch (error: any) {
    throw new Error('Failed to get user profile');
  }
  return userProfile.role;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await checkUserRole(user.uid);
        setIsAuthenticated(true);
        setUserRole(role);
      } else {
        setIsAuthenticated(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* If the user is not authenticated, show auth screens */}
        {!isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={GirisYapScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Register" 
              component={KayitScreen} 
              options={{ headerShown: false }} 
            />
          </>
        ) : (
          // If the user is authenticated, show the appropriate screens based on their role
          <>
            {userRole === 'admin' ? (
              <>
                <Stack.Screen 
                  name="AdminHome" 
                  component={AdminHomePageScreen} 
                  options={{ title: 'Doktor Anasayfa' }} 
                />
                <Stack.Screen 
                  name="UserList" 
                  component={KullanicilarScreen} 
                  options={{ title: 'Hasta Listesi' }} 
                />
                <Stack.Screen 
                  name="UserDetail" 
                  component={KullaniciDetayScreen} 
                  options={{ title: 'Hasta Detay' }} 
                />
                <Stack.Screen 
                  name="TestDetaylari" 
                  component={TestDetaylariScreen} 
                  options={{ title: 'Tahlil Detayları' }} 
                />
                <Stack.Screen 
                  name="OncekiDegerler" 
                  component={OncekiDegerlerScreen} 
                  options={{ title: 'Önceki Değerler' }} 
                />
                <Stack.Screen 
                  name="AddBloodTest" 
                  component={TahlilEkle} 
                  options={{ title: 'Yeni Tahlil Ekle' }} 
                />
                <Stack.Screen 
                  name="Profile" 
                  component={ProfileScreen} 
                  options={{ title: 'Profilim' }} 
                />
                <Stack.Screen 
                  name="EditProfile" 
                  component={ProfiliDuzenleScreen} 
                  options={{ title: 'Profili Düzenle' }} 
                />
              </>
            ) : (
              <>
                <Stack.Screen 
                  name="Anasayfa" 
                  component={AnasayfaScreen} 
                  options={{ title: 'Anasayfa' }} 
                />
                <Stack.Screen 
                  name="BloodTestList" 
                  component={TestListeScreen} 
                  options={{ title: 'Tahliller' }} 
                />
                <Stack.Screen 
                  name="OncekiDegerler" 
                  component={OncekiDegerlerScreen} 
                  options={{ title: 'Önceki Değerler' }} 
                />
                <Stack.Screen 
                  name="TestDetaylari" 
                  component={TestDetaylariScreen} 
                  options={{ title: 'Tahlil Detayları' }} 
                />
                <Stack.Screen 
                  name="Profile" 
                  component={ProfileScreen} 
                  options={{ title: 'Profilim' }} 
                />
                <Stack.Screen 
                  name="EditProfile" 
                  component={ProfiliDuzenleScreen} 
                  options={{ title: 'Profili Düzenle' }} 
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
