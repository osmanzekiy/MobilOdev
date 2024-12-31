import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { KanTestiModal } from '../modals/KanTestiModal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { auth, firestore } from '../services/firebaseConfig';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';

type Props = NativeStackScreenProps<RootStackParamList, 'OncekiDegerler'>;

async function getTests(testId: string, userId: string): Promise<KanTestiModal> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    const docRef = doc(firestore, 'bloodTests', testId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as KanTestiModal;
      // Testin kullanıcıya ait olduğunu kontrol et
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to test result');
      }
      return { ...data, id: docSnap.id };
    } else {
      throw new Error('Test not found');
    }
  } catch (error) {
    console.error('Tahliller çekilirken hata!:', error);
    throw error;
  }
}

// Önceki testleri almak için fonksiyon
async function getTestHistory(testType: string, paramName: string, userId: string, testDate: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    // Testin tarihinden önceki testleri almak için sorgu
    const q = query(
      collection(firestore, 'bloodTests'),
      where('userId', '==', userId),
      where('testType', '==', testType),
      where('date', '<=', testDate), // Mevcut test tarihinden önceki testleri filtrele
      orderBy('date', 'desc') // En son tarihten önceki testler
    );

    const querySnapshot = await getDocs(q);

    // Sonuçları döndür
    return querySnapshot.docs
      .map(doc => {
        const data = doc.data() as KanTestiModal;
        return {
          date: new Date(data.date), // Firebase'den gelen ISO 8601 tarihini Date objesine dönüştür
          value: data.results[paramName]?.value,
          unit: data.results[paramName]?.unit,
        };
      })
      .filter(item => item.value !== undefined); // Yalnızca değerleri olan testleri dahil et
  } catch (error) {
    console.error('Test geçmişi çekilirken hata!:', error);
    throw error;
  }
}

const ResultIndicator = ({ currentValue, previousValues }: { currentValue: number; previousValues: number[] }) => {
  if (previousValues.length < 1) return null;

  let indicator = '➡️'; // Varsayılan nötr ok simgesi

  // Mevcut değeri son test değeriyle karşılaştır
  const lastValue = previousValues[0];

  const isIncreasing = currentValue < lastValue;
  const isDecreasing = currentValue > lastValue;

  if (isIncreasing) {
    indicator = '⬆️'; // Yükselme ok simgesi
  } else if (isDecreasing) {
    indicator = '⬇️'; // Düşüş ok simgesi
  }

  return <Text style={styles.indicator}>{indicator}</Text>;
};

export function OncekiDegerlerScreen({ route, navigation }: Props) {
  const { testId, userId } = route.params;  // TestID ve UserID parametre olarak alınıyor
  const [test, setTest] = useState<KanTestiModal | null>(null);
  const [loading, setLoading] = useState(true);
  const [testHistory, setTestHistory] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    loadTestDetails();
  }, [testId]);  // TestID değiştiğinde, yeni test detaylarını yükle

  const loadTestDetails = async () => {
    try {
      const testData = await getTests(testId, userId); // Mevcut testin detaylarını al
      setTest(testData);

      const trends: { [key: string]: any[] } = {};
      const testDate = testData.date; // Firebase'den gelen tarih, ISO 8601 formatında zaten

      // Test parametrelerinin her biri için önceki testleri al
      for (const param of Object.keys(testData.results)) {
        const history = await getTestHistory(testData.testType, param, userId, testDate);
        trends[param] = history;
      }

      setTestHistory(trends);
    } catch (error) {
      Alert.alert('Error', 'Test detayları yüklenirken hata!');
      navigation.goBack();
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

  if (!test) {
    return (
      <View style={styles.centerContainer}>
        <Text>Test not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Başlık Bilgisi */}
      <View style={styles.header}>
        <Text style={styles.testType}>{test.testType}</Text>
        <Text style={styles.date}>
          {format(new Date(test.date), 'MMMM d, yyyy', { locale: tr })}
        </Text>
      </View>

      {/* Sonuçlar Bölümü */}
      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Results (Previous Tests)</Text>
        {Object.entries(test.results).map(([param, data]) => (
          <View key={param} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={styles.paramName}>{param}</Text>
            </View>

            <View style={styles.resultDetails}>
              {testHistory[param]?.map((historyItem: any, index: number) => {
                const isLast = index === 0;
                const { value, unit } = historyItem;

                return (
                  <View key={index} style={[styles.resultRow, isLast ? styles.latestResult : {}]}>
                    <Text style={styles.value}>
                      {value} {unit}
                    </Text>
                    <ResultIndicator currentValue={value} previousValues={testHistory[param].map(item => item.value)} />
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Notlar Bölümü */}
      {test.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{test.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  testType: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  resultItem: {
    marginBottom: 20,
  },
  resultHeader: {
    marginBottom: 5,
  },
  paramName: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultDetails: {
    marginTop: 10,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  latestResult: {
    backgroundColor: '#f0f8ff',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  referenceRange: {
    fontSize: 14,
    color: '#666',
  },
  indicator: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  notesContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  notes: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});
