import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore';

export type StoreType = 'Restaurants' | 'Clothing' | 'Grocery' | 'Pharma' | 'Salon' | 'Electronics' | 'More';

export interface Offer {
  title: string;
  description: string;
}

export interface MenuItem {
  name: string;
  price: string;
}

export interface Store {
  id: string;
  type: StoreType;
  name: string;
  photo: string;
  mainOffer: string;
  address: string;
  contact: string;
  menu?: MenuItem[];
  offers?: Offer[];
}

export interface Analytics {
  views: number;
  clicks: Record<string, number>;
}

export const initData = async () => {
  try {
    const analyticsRef = doc(db, 'system', 'analytics');
    const settingsRef = doc(db, 'system', 'settings');
    
    const aSnap = await getDoc(analyticsRef);
    if (!aSnap.exists()) {
      await setDoc(analyticsRef, { views: 0, clicks: {} });
    }
    
    const sSnap = await getDoc(settingsRef);
    if (!sSnap.exists()) {
      await setDoc(settingsRef, { tagline: "Gulbarga's Premier Guide for #1 Offers" });
    }
  } catch (e) {
    console.error("Error initializing data", e);
  }
};

export const getTagline = async (): Promise<string> => {
  try {
    const snap = await getDoc(doc(db, 'system', 'settings'));
    if (snap.exists()) {
      return snap.data().tagline || "Gulbarga's Premier Guide for #1 Offers";
    }
  } catch (e) {
    console.error("Error fetching tagline", e);
  }
  return "Gulbarga's Premier Guide for #1 Offers";
};

export const saveTagline = async (tagline: string) => {
  try {
    await setDoc(doc(db, 'system', 'settings'), { tagline }, { merge: true });
  } catch (e) {
    console.error("Error saving tagline", e);
  }
};

export const getStores = async (): Promise<Store[]> => {
  try {
    const snap = await getDocs(collection(db, 'stores'));
    const stores: Store[] = [];
    snap.forEach((d) => {
      stores.push({ id: d.id, ...d.data() } as Store);
    });
    return stores;
  } catch (e: any) {
    console.error("Error fetching stores", e);
    if (e.code === 'permission-denied') {
      alert("Database Access Denied! Please open your Firebase Console, go to Firestore -> Rules, and change 'allow read, write: if false;' to 'allow read, write: if true;' so your site can load deals.");
    }
    throw e;
  }
};

export const saveStores = async (stores: Store[]) => {
  for (const store of stores) {
    await setDoc(doc(db, 'stores', store.id), store);
  }
};

export const deleteStore = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'stores', id));
  } catch (e) {
    console.error("Error deleting store", e);
  }
};

export const trackPageView = async () => {
  try {
    const ref = doc(db, 'system', 'analytics');
    await updateDoc(ref, { views: increment(1) });
  } catch (e) {
    try {
      await setDoc(doc(db, 'system', 'analytics'), { views: 1, clicks: {} }, { merge: true });
    } catch(err) {
      console.error(err);
    }
  }
};

export const trackStoreClick = async (storeId: string) => {
  try {
    const ref = doc(db, 'system', 'analytics');
    await updateDoc(ref, { [`clicks.${storeId}`]: increment(1) });
  } catch (e) {
    try {
      await setDoc(doc(db, 'system', 'analytics'), { views: 0, clicks: { [storeId]: 1 } }, { merge: true });
    } catch(err) {
      console.error(err);
    }
  }
};

export const getAnalytics = async (): Promise<Analytics> => {
  try {
    const snap = await getDoc(doc(db, 'system', 'analytics'));
    if (snap.exists()) {
      return snap.data() as Analytics;
    }
  } catch (e) {
    console.error("Error fetching analytics", e);
  }
  return { views: 0, clicks: {} };
};
