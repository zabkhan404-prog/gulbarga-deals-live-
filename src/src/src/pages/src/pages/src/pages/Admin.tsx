import React, { useState, useEffect } from 'react';
import { Store, StoreType, getStores, saveStores, deleteStore, getAnalytics, Analytics, getTagline, saveTagline } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Lock, Plus, Edit2, Trash2, LayoutDashboard, Copy, Image as ImageIcon, AlertTriangle } from 'lucide-react';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ views: 0, clicks: {} });
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [tagline, setTagline] = useState('');
  const [dbLockedError, setDbLockedError] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const fetchedStores = await getStores();
      setStores(fetchedStores);
      setDbLockedError(false);
    } catch (e: any) {
      if (e.code === 'permission-denied') setDbLockedError(true);
    }
    const fetchedAnalytics = await getAnalytics();
    setAnalytics(fetchedAnalytics);
    const fetchedTagline = await getTagline();
    setTagline(fetchedTagline);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'zabulous') setIsAuthenticated(true);
    else alert('Incorrect password');
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingStore) {
      const compressedBase64 = await compressImage(e.target.files[0]);
      setEditingStore({ ...editingStore, photo: compressedBase64 });
    }
  };

  const handleSaveStore = async () => {
    if (!editingStore) return;
    if (!editingStore.name || !editingStore.address || !editingStore.photo) {
      alert("Please fill out Name, Address, and Photo!");
      return;
    }
    try {
      let updatedStores;
      if (stores.find(s => s.id === editingStore.id)) {
        updatedStores = stores.map(s => s.id === editingStore.id ? editingStore : s);
      } else {
        updatedStores = [...stores, editingStore];
      }
      await saveStores([editingStore]);
      setStores(updatedStores);
      setEditingStore(null);
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        alert("Database is locked! Please go to Firebase Console -> Firestore -> Rules and set 'allow read, write: if true;'");
      }
    }
  };

  const chartData = stores.map(store => ({
    name: store.name,
    clicks: analytics.clicks[store.id] || 0
  })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-stone-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-stone-700">
          <Lock className="w-12 h-12 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-white text-center mb-6">Owner Access</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-stone-900 text-white border border-stone-600 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="Enter secure password"
          />
          <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl py-3 transition-colors">
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-stone-100 min-h-screen p-4 md:p-8 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {dbLockedError && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-bold text-lg">Firebase Database Locked</h3>
              <p className="text-red-700 text-sm mt-1">Your website cannot save deals. Open Firebase Console &gt; Firestore &gt; Rules and change to <code>allow read, write: if true;</code></p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between bg-rose-950 p-6 rounded-3xl text-white shadow-xl">
          <div className="flex items-center">
            <LayoutDashboard className="w-8 h-8 text-amber-400 mr-4" />
            <h1 className="text-3xl font-serif font-bold">Admin Portal</h1>
          </div>
          <div className="bg-rose-900/50 px-4 py-2 rounded-xl text-amber-400 font-bold tabular-nums">
            Total Views: {analytics.views}
          </div>
        </div>

        {/* Tagline Editor */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-stone-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4 font-serif">Site Settings</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="flex-grow border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
              placeholder="Tagline (e.g., Gulbarga's Premier Guide)"
            />
            <button
              onClick={() => { saveTagline(tagline); alert('Tagline updated globally!'); }}
              className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-rose-950 transition-colors"
            >
              Update
            </button>
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-stone-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6 font-serif">Top Performing Deals</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="clicks" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#fbbf24' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deal Manager */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-stone-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Manage Deals</h2>
            <button
              onClick={() => setEditingStore({ id: Date.now().toString(), type: 'Restaurants', name: '', photo: '', mainOffer: '', address: '', contact: '', menu: [], offers: [] })}
              className="bg-amber-400 text-slate-900 px-4 py-2 rounded-xl font-bold hover:bg-amber-300 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-1" /> Add Deal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map(store => (
              <div key={store.id} className="border border-stone-200 rounded-2xl p-4 flex flex-col relative bg-stone-50 hover:border-amber-300 transition-all">
                <div className="absolute top-4 right-4 bg-rose-100 text-rose-950 text-xs font-bold px-2 py-1 rounded-lg border border-rose-200">
                  {analytics.clicks[store.id] || 0} Clicks
                </div>
                <img src={store.photo} alt={store.name} className="w-full h-32 object-cover rounded-xl mb-4 bg-stone-200" />
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">{store.type}</span>
                <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">{store.name}</h3>
                <p className="text-rose-950 font-black mb-4 bg-amber-100 inline-block px-2 py-1 rounded-md text-sm">{store.mainOffer}</p>
                <div className="mt-auto flex gap-2 pt-4 border-t border-stone-200">
                  <button onClick={() => setEditingStore(store)} className="flex-1 bg-white border border-stone-300 text-stone-700 py-1.5 rounded-lg flex items-center justify-center font-medium hover:bg-stone-100 transition-colors">
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </button>
                  <button onClick={() => { saveStores([{ ...store, id: Date.now().toString(), name: store.name + " (Copy)" }]); fetchData(); }} className="flex-1 bg-white border border-stone-300 text-stone-700 py-1.5 rounded-lg flex items-center justify-center font-medium hover:bg-stone-100 transition-colors">
                    <Copy className="w-4 h-4 mr-1" /> Dup
                  </button>
                  <button onClick={() => { if(window.confirm('Delete deal?')) { deleteStore(store.id); setStores(stores.filter(s => s.id !== store.id)); } }} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Modal */}
        {editingStore && (
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 my-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                  {editingStore.id ? 'Edit Deal' : 'New Deal'}
                </h2>
                <button onClick={() => setEditingStore(null)} className="text-stone-400 hover:text-stone-600 p-2">✕</button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1">Store Name</label>
                    <input type="text" value={editingStore.name} onChange={e => setEditingStore({...editingStore, name: e.target.value})} className="w-full border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1">Category</label>
                    <select value={editingStore.type} onChange={e => setEditingStore({...editingStore, type: e.target.value as StoreType})} className="w-full border rounded-xl px-4 py-2">
                      <option value="Restaurants">Restaurants</option><option value="Clothing">Clothing</option><option value="Grocery">Grocery</option><option value="Pharma">Pharma</option><option value="Salon">Salon</option><option value="Electronics">Electronics</option><option value="More">More</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">Upload Photo</label>
                  <div className="flex items-center gap-4 border-2 border-dashed border-stone-200 rounded-xl p-4 bg-stone-50">
                    <label className="flex-shrink-0 cursor-pointer bg-amber-400 hover:bg-amber-500 text-rose-950 px-4 py-2 rounded-lg font-bold flex items-center transition-colors">
                      <ImageIcon className="w-5 h-5 mr-2" /> Choose Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {editingStore.photo && <img src={editingStore.photo} alt="Preview" className="h-16 w-16 object-cover rounded-lg shadow-sm" />}
                    {!editingStore.photo && <span className="text-stone-400 text-sm italic">No image selected...</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">Main Highlight Offer (e.g. "50% OFF")</label>
                  <input type="text" value={editingStore.mainOffer} onChange={e => setEditingStore({...editingStore, mainOffer: e.target.value})} className="w-full border-2 border-amber-200 rounded-xl px-4 py-2 font-bold text-rose-950 bg-amber-50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-stone-600 mb-1">Location / Address</label><input type="text" value={editingStore.address} onChange={e => setEditingStore({...editingStore, address: e.target.value})} className="w-full border rounded-xl px-4 py-2" /></div>
                  <div><label className="block text-sm font-bold text-stone-600 mb-1">Contact Number</label><input type="text" value={editingStore.contact} onChange={e => setEditingStore({...editingStore, contact: e.target.value})} className="w-full border rounded-xl px-4 py-2" /></div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-stone-200">
                  <button onClick={() => setEditingStore(null)} className="flex-1 bg-stone-100 text-stone-600 font-bold py-3 rounded-xl hover:bg-stone-200 transition-colors">Cancel</button>
                  <button onClick={handleSaveStore} className="flex-1 bg-rose-950 text-amber-400 font-bold py-3 rounded-xl shadow-lg hover:bg-rose-900 transition-colors text-lg">Save Deal Now</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
        }
