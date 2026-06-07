import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCSfrQQEeKS9JEkp6v5TRZPTxYxdCTNYbA",
  authDomain: "ulyanabarberries.firebaseapp.com",
  projectId: "ulyanabarberries",
  storageBucket: "ulyanabarberries.firebasestorage.app",
  messagingSenderId: "165773089553",
  appId: "1:165773089553:web:d181198f5df294923fcab0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
  try {
    const q = query(collection(db, 'box_configs'), where('is_active', '==', true), orderBy('sort_order'));
    await getDocs(q);
  } catch (error) {
    console.error("Boxes error:", error.message);
  }
  process.exit(0);
}
testFirebase();
