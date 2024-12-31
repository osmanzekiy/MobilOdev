import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  DEFAULT_TEST_TYPES,
  DEFAULT_TEST_PARAMETERS,
  KanTestiModal,
} from "../modals/KanTestiModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { addDoc, collection } from "firebase/firestore";
import { auth, firestore } from "../services/firebaseConfig";

type AddBloodTestScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "TahlilEkle"
>;

export function TahlilEkle({ navigation, route }: AddBloodTestScreenProps) {
  const [testType, setTestType] = useState(DEFAULT_TEST_TYPES[0]);
  const [results, setResults] = useState<{ [key: string]: string }>({});
  const [notes, setNotes] = useState("");
  const { userId } = route.params || {};

  const handleAddTest = async () => {
    console.log(userId);

    // Test sonuçlarını işleme
    const processedResults = Object.entries(results).reduce(
      (acc, [param, value]) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          Alert.alert(
            "Geçersiz Giriş!",
            `Lütfen geçerli bir giriş yapın: ${param}`
          );
          return acc;
        }

        acc[param] = {
          value: numValue,
          unit: DEFAULT_TEST_PARAMETERS[param]?.unit || "",
          referenceRange: DEFAULT_TEST_PARAMETERS[param]?.referenceRange,
        };
        return acc;
      },
      {} as KanTestiModal["results"]
    );

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Kullanıcı doğrulanmadı");

      const docRef = await addDoc(collection(firestore, "bloodTests"), {
        testType,
        results: processedResults,
        notes,
        date: new Date(),
        userId: userId || user.uid,
      });

      Alert.alert("Başarı", "Tahlil Sonuçları başarıyla eklendi!", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Hata", "Tahlil eklenirken bir hata oluştu.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tahlil Sonucu Ekle</Text>

      {/* Test Türü */}
      <Text style={styles.label}>Test Türü</Text>
      {DEFAULT_TEST_TYPES.map((type) => (
        <Text style={styles.type} key={type}>
          {type}
        </Text>
      ))}

      <Text style={styles.label}>Test Sonuçları</Text>
      {Object.keys(DEFAULT_TEST_PARAMETERS).map((param) => (
        <View key={param} style={styles.inputContainer}>
          <Text style={styles.paramText}>{param}</Text>
          <TextInput
            style={styles.input}
            placeholder={`Değer girin: ${param}`}
            keyboardType="numeric"
            value={results[param] || ""}
            onChangeText={(text) =>
              setResults((prev) => ({ ...prev, [param]: text }))
            }
          />
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleAddTest}>
        <Text style={styles.buttonText}>Tahlil Sonucunu Ekle</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f8ff", // Hafif mavi arka plan
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
    color: "#2C3E50", // Başlık rengi
    fontWeight: "bold",
  },
  label: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
    color: "#34495E", // Etiket rengi
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#BDC3C7", // Parametrelerin alt çizgisi
  },
  paramText: {
    fontSize: 16,
    color: "#2C3E50",
    flex: 1,
  },
  input: {
    flex: 2,
    height: 40,
    borderColor: "#BDC3C7", // Gri renkte kenar
    borderWidth: 1,
    marginLeft: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#28B463", // Yeşil buton
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  type: {
    textAlign: "center", // Merkezi hizalama
    fontSize: 20, // Font büyüklüğü
    fontWeight: "bold", // Kalın yazı
    color: "#2C3E50", // Başlık rengi
    paddingVertical: 10,
    marginVertical: 5,
    backgroundColor: "#ECF0F1", // Arka plan rengi
    borderRadius: 5, // Köşeleri yuvarlama
    shadowColor: "#BDC3C7", // Gölgeler
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
