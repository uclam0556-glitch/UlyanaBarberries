import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCSfrQQEeKS9JEkp6v5TRZPTxYxdCTNYbA",
  authDomain: "ulyanabarberries.firebaseapp.com",
  projectId: "ulyanabarberries",
  storageBucket: "ulyanabarberries.firebasestorage.app",
  messagingSenderId: "165773089553",
  appId: "1:165773089553:web:d181198f5df294923fcab0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// IMGBB API KEY for image uploads
export const IMGBB_API_KEY = "3a6ac06bd4c8dfff521e86d4ec4c572e";

export const uploadImageToImgbb = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
  
  const data = await response.json();
  return data.data.url;
};
