import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { KanTestiModal } from "../modals/KanTestiModal";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';//
import { auth, firestore } from "../services/firebaseConfig";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";


type Props = NativeStackScreenProps<RootStackParamList, "TestListesi">;

export function TestListeScreen({ navigation }: Props) {
  const [tests, setTests] = useState<KanTestiModal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTests = async () => {
    var results;
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      // Use provided userId if available, otherwise use current user's ID
      const userId = currentUser.uid;

      const q = query(
        collection(firestore, "bloodTests"),
        where("userId", "==", userId),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      results = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as KanTestiModal)
      );
      setTests(results);
    } catch (error) {
      console.error("Error loading tests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTests();
  };

  const renderTestItem = ({ item }: { item: KanTestiModal }) => {
    // Get the first result as a preview
    const firstResult = Object.entries(item.results)[0];

    return (
      <View style={styles.card}>
        {/* Card Header with Test Type and Date */}
        <View style={styles.cardHeader}>
          <Text style={styles.testType}>{item.testType}</Text>
          <Text style={styles.date}>
            {format(new Date(item.date), "d MMMM yyyy", {locale: tr})}
          </Text>
        </View>

        {/* Preview Section for First Result */}
        {firstResult && (
          <View style={styles.resultPreview}>
            <View style={styles.resultIndicator}>
              <Text style={styles.previewLabel}>{firstResult[0]}:</Text>
              <Text style={styles.previewValue}>
                {firstResult[1].value} {firstResult[1].unit}
              </Text>
            </View>
          </View>
        )}

        {/* Two Buttons for Navigation */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate("TestDetaylari", { testId: item.id, userId:auth.currentUser.uid })}
          >
            <Text style={styles.viewMore}>Klavuza Göre İncele</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate("OncekiDegerler", { testId: item.id, userId:auth.currentUser.uid })}
          >
            <Text style={styles.viewMore}>Önceki Sonuçlar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
      <FlatList
        data={tests}
        renderItem={renderTestItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No blood test results yet.</Text>
            {/* <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("AddBloodTest")}
            >
              <Text style={styles.addButtonText}>Add Your First Test</Text>
            </TouchableOpacity> */}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",  // Light background for the list
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  testType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  date: {
    color: "#888",
    fontSize: 14,
  },
  resultPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  resultIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewLabel: {
    color: "#888",
    fontSize: 16,
  },
  previewValue: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  viewMoreContainer: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  viewMore: {
    color: "#FFFFFF",  // Blue color for the link
    fontSize: 14,
    textDecorationLine: "underline",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  viewButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
  },
});
