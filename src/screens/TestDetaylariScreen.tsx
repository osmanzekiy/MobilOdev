import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { format } from "date-fns";
import { RootStackParamList } from "../navigation/AppNavigator";
import { KanTestiModal } from "../modals/KanTestiModal";
import { tr } from "date-fns/locale";
import { auth, firestore } from "../services/firebaseConfig";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";

// ----- YARDIMCI FONKSİYONLAR -----
async function getKlavuzlar() {
  try {
    const q = query(collection(firestore, "klavuzlar"));
    
    // Firestore'dan sorguyu çalıştırıyoruz
    const querySnapshot = await getDocs(q);
    
    // Dokümanları alıyoruz ve bir diziye dönüştürüyoruz
    const fetchedGuide = querySnapshot.docs.map((doc) => doc.data());

    return fetchedGuide;
  } catch (error) {
    return [];
  }
}

async function getTests(testId: string): Promise<KanTestiModal> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const docRef = doc(firestore, "bloodTests", testId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as KanTestiModal;
      // Verify the test belongs to the current user
      if (data.userId !== user.uid && false) { //CHANGE IT 
        throw new Error("Unauthorized access to test result");
      }
      return { ...data, id: docSnap.id };
    } else {
      throw new Error("Test not found");
    }
  } catch (error) {
    console.error("Error fetching blood test:", error);
    throw error;
  }
}

// 1) Kullanıcının yaşını (ay cinsinden) hesaplar
function calculateAgeInMonths(dateOfBirth: Date): number {
  const now = new Date();
  let months = (now.getFullYear() - dateOfBirth.getFullYear()) * 12;
  months += now.getMonth() - dateOfBirth.getMonth();
  if (now.getDate() < dateOfBirth.getDate()) {
    months -= 1;
  }
  return months < 0 ? 0 : months;
}

// 2) Kılavuzdaki doğru yaş aralığını (objeyi) bulur
function findAgeRangeEntry(
  dataArray: {
    min_age_months: number;
    max_age_month: number | null; // null => üst sınır yok
    min_val: number;
    max_val: number;
  }[],
  userAgeInMonths: number
) {
  return dataArray.find((entry) => {
    const isAboveMin = userAgeInMonths >= entry.min_age_months;
    const isBelowMax =
      entry.max_age_month === null
        ? true
        : userAgeInMonths < entry.max_age_month;
    return isAboveMin && isBelowMax;
  });
}

// 3) Test değerini aralıkla kıyaslayıp yön belirleme
function getArrowDirection(
  testValue: number,
  minVal: number,
  maxVal: number
): "up" | "down" | "normal" {
  if (testValue < minVal) {
    return "down";
  } else if (testValue > maxVal) {
    return "up";
  } else {
    return "normal";
  }
}

// 4) Ok şeklini (veya renkli ikonu) döndüren basit bir fonksiyon
function renderArrow(direction: "up" | "down" | "normal") {
  switch (direction) {
    case "up":
      return <Text style={styles.arrowUp}>↑</Text>;
    case "down":
      return <Text style={styles.arrowDown}>↓</Text>;
    default:
      return <Text style={styles.arrowNormal}>→</Text>;
  }
}

// ----- ANA BİLEŞEN (SCREEN) -----

type Props = NativeStackScreenProps<RootStackParamList, "TestDetaylari">;

export function TestDetaylariScreen({ route, navigation }: Props) {
  const { testId, userId } = route.params;
  const [user, setUser] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [userDate, setUserDate] = useState(new Date());
  const [test, setTest] = useState<KanTestiModal | null>(null);
  const [guideData, setGuideData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [allGuides, setAllGuides] = useState<string[]>([]);

  const loadUserDetails = async () => {
    try {
      var userr;
      const userDetails = userId ? userId : auth.currentUser?.uid;
      const userDoc = await getDoc(doc(firestore, "users", userDetails ? userDetails : ""));
      if (userDoc.exists()) {
        userr = userDoc.data();
      } else {
        throw new Error("User profile not found");
      }
      setUserDate(new Date(userr.dateOfBirth));
      setUser(userDetails);
    } catch (error) {
      console.error("Error loading user details:", error);
      Alert.alert("Error", "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetails();
    loadTestDetails();
  }, [testId]);

  const userAgeInMonths = calculateAgeInMonths(userDate);

  async function loadTestDetails() {
    try {
      const testData = await getTests(testId);
      setTest(testData);
      
      const fetchedGuide = await getKlavuzlar();
      setGuideData(fetchedGuide[0]);

      // Klavuz isimlerini al ve allGuides dizisine ekle
      const guideNames = Object.keys(fetchedGuide[0]);
      setAllGuides(guideNames);  // Klavuz isimlerini set et
      console.log(guideNames);
    } catch (error) {
      Alert.alert("Error", "Failed to load test details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6347" />
      </View>
    );
  }

  if (!test) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Test Bulunamadi!</Text>
      </View>
    );
  }

  if (!guideData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Klavuzlar Hazır Değil!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Tüm Klavuzlar İçin Sonuçlar</Text>

        {allGuides.map((guideName) => {
          const currentGuide = guideData[guideName];

          if (!currentGuide) {
            return (
              <View key={guideName} style={styles.guideBlock}>
                <Text style={styles.guideTitle}>
                  {guideName} (No Data)
                </Text>
              </View>
            );
          }

          return (
            <View key={guideName} style={styles.guideBlock}>
              <Text style={styles.guideTitle}>{guideName} Klavuzu</Text>

              {Object.entries(test.results).map(([param, data]) => {
                const paramArray = currentGuide[param];

                if (!paramArray) {
                  return (
                    <View key={param} style={styles.paramItem}>
                      <Text style={styles.paramName}>{param}</Text>
                      <Text style={styles.paramText}>Bu parametre için Klavuz Yok!</Text>
                    </View>
                  );
                }

                const matchedRange = findAgeRangeEntry(paramArray, userAgeInMonths);
                let direction = "normal";
                if (matchedRange) {
                  direction = getArrowDirection(data.value, matchedRange.min_val, matchedRange.max_val);
                }

                return (
                  <View key={param} style={styles.paramItem}>
                    <View style={styles.paramHeader}>
                      <Text style={styles.paramName}>{param}</Text>
                      {renderArrow(direction)}
                    </View>

                    <Text style={styles.paramValue}>
                      Değer: {data.value} mg/dL
                    </Text>
                    {matchedRange ? (
                      <Text style={styles.referenceRange}>
                        Normal Aralık: {matchedRange.min_val} - {matchedRange.max_val} mg/dL
                      </Text>
                    ) : (
                      <Text style={styles.ageStyle}>Yaş Eşlenmeşi Yok!</Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    backgroundColor: "#6A5ACD",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#fff",
  },
  testType: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  date: {
    fontSize: 18,
    color: "#fff",
    marginTop: 5,
  },
  resultsContainer: {
    margin: 10,
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#32CD32",
    marginBottom: 10,
  },
  guideBlock: {
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2F4F4F",
    textDecorationLine: "underline",
    marginBottom: 5,
  },
  errorText: {
    color: "#FF6347",
    fontSize: 18,
  },
  paramItem: {
    marginVertical: 8,
  },
  paramHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paramName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  arrowUp: {
    color: "red",
    fontSize: 24,
  },
  arrowDown: {
    color: "green",
    fontSize: 24,
  },
  arrowNormal: {
    color: "orange",
    fontSize: 24,
  },
  paramValue: {
    fontSize: 16,
    color: "#333",
  },
  referenceRange: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
  },
  ageStyle: {
    fontSize: 14,
    color: "#FF0000",
    marginTop: 5,
  },
  paramText: {
    fontSize: 14,
    color: "#FF0000",
    marginTop: 5,
  },
  notesContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    marginVertical: 15,
  },
  notes: {
    fontSize: 16,
    color: "#333",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
  },
});
