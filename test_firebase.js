import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query } from "firebase/firestore";
const app = initializeApp({
  apiKey: "AIzaSyCSfrQQEeKS9JEkp6v5TRZPTxYxdCTNYbA",
  projectId: "ulyanabarberries"
});
const db = getFirestore(app);
async function test() {
  const snap = await getDocs(query(collection(db, 'products')));
  console.log("Total Products in DB:", snap.size);
  snap.forEach(doc => console.log(doc.id, doc.data().name, "sort_order:", doc.data().sort_order));
}
test();
