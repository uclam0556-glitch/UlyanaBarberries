import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCSfrQQEeKS9JEkp6v5TRZPTxYxdCTNYbA",
  projectId: "ulyanabarberries"
});
const db = getFirestore(app);

async function fix() {
  const snap = await getDocs(collection(db, 'products'));
  let fixed = 0;
  for (const document of snap.docs) {
    if (document.data().sort_order === undefined) {
      await updateDoc(doc(db, 'products', document.id), { sort_order: 0 });
      fixed++;
    }
  }
  console.log("Fixed products:", fixed);
}
fix();
