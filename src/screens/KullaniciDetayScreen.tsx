import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { format } from "date-fns";
import { MaterialIcons } from '@expo/vector-icons'; // Ok ikonları için
import { tr } from 'date-fns/locale';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { auth, firestore } from "../services/firebaseConfig";
import { KanTestiModal } from "../modals/KanTestiModal";


type Props = NativeStackScreenProps<RootStackParamList, "KullaniciDetay">;

export function KullaniciDetayScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const [user, setUser] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserDetails = async () => {
    try {
      var data;
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        data = userDoc.data();
      } else {
        throw new Error('Kullanıcı Bulunamadı!');
      }
      const userDetails = data;
      setUser(userDetails);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Kullanıcı girişi yok!");

      // Use provided userId if available, otherwise use current user's ID
      const userrId = userId || currentUser.uid;

      const q = query(
        collection(firestore, "bloodTests"),
        where("userId", "==", userId),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      const testler = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as KanTestiModal)
      );

      setTests(testler);
    } catch (error) {
      console.error("Kullanıcı detayları yüklenirken hata!:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  // Tahlilleri tarihlere göre grupla
  const groupedTests = tests.reduce((groups: any, test: any) => {
    const date = format(new Date(test.date), 'd MMMM yyyy', { locale: tr }); // Test tarihini formatla
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(test);
    return groups;
  }, {});

  // Gruplanmış tarihleri almak
  const groupDates = Object.keys(groupedTests);

  const renderTestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.testType}>{item.testType}</Text>
        <Text style={styles.date}>
          {format(new Date(item.date), 'd MMMM yyyy', { locale: tr })}
        </Text>
      </View>

      <Text style={styles.viewMore} onPress={() =>
        navigation.navigate("TestDetaylari", { testId: item.id, userId: userId })
      }>Test Detayları →</Text>

      <Text style={styles.viewMore} onPress={() =>
        navigation.navigate("OncekiDegerler", { testId: item.id, userId: userId })
      }>Önceki Değerler →</Text>
    </View>
  );

  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const toggleDateVisibility = (date: string) => {
    setExpandedDate(prevDate => (prevDate === date ? null : date));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user.name} {user.surname}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userDetail}>Ağırlık: {user.weight} kg</Text>
          <Text style={styles.userDetail}>Boy: {user.height} cm</Text>
          <Text style={styles.userDetail}>Doğum Tarihi: {user.dateOfBirth}</Text>
          <Text style={styles.userDetail}>Cinsiyet: {user.gender}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.cardSecond}
        onPress={() =>
          navigation.navigate("AddBloodTest", { userId: userId }) // Kullanıcı ID'sini gönderiyoruz
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.addTest}>Tahlil Ekle</Text>
        </View>
      </TouchableOpacity>

      {/* Her tarih için açılır kapanır Dropdown */}
      {groupDates.map((date, index) => (
        <View key={index} style={styles.dateContainer}>
          <TouchableOpacity
            onPress={() => toggleDateVisibility(date)} // Tıkladıkça açılacak
            style={styles.dropdownHeader}
          >
            <Text style={styles.selectDateText}>{date}</Text>
            <MaterialIcons
              name={expandedDate === date ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={24}
              color="#007AFF"
            />
          </TouchableOpacity>

          {/* Eğer bu tarihe tıklanmışsa, tahlil listesini göster */}
          {expandedDate === date && (
            <FlatList
              data={groupedTests[date]} // O tarihe ait tahlilleri getirdik
              renderItem={renderTestItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No tests available</Text>}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    backgroundColor: "white",
    padding: 20,
    margin: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  userDetail: {
    fontSize: 16,
    marginBottom: 5,
  },
  card: {
    backgroundColor: "white",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSecond: {
    backgroundColor: "white",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  testType: {
    fontSize: 16,
    fontWeight: "600",
  },
  addTest: {
    fontSize: 23,
    color: "green",
    fontWeight: "600",
  },
  date: {
    color: "#666",
    fontSize: 14,
  },
  viewMore: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "right",
    marginTop: 10,
  },
  selectDateText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 15,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dropdownHeader: {
    backgroundColor: "#74cecd",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
