import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart, Share2, MessageCircle, User, MapPin, ArrowLeft, Search, Bell,
  PawPrint, Plus, X, LogOut, Upload, Image as ImageIcon, Stethoscope, Siren,
  Phone, Navigation, Award, Zap, ChevronRight, BookOpen, Star, Shield, Trophy,
  Link as LinkIcon, Send, Crown, CheckCircle2, TrendingUp, HandHeart, Globe,
  Target, RefreshCw, Activity, ShieldCheck, ClipboardList, Sparkles,
  Dog, Cat, Bird, Check, Copy, Eye, Clock, Bookmark, AlertTriangle, Newspaper, Home,
  Flame, Skull, Droplets, Package, Radar, Map as MapIcon,
  FileText, BarChart3, Radio, ChevronLeft, Share, Users, RotateCcw
} from 'lucide-react';

// --- GOOGLE AI IMPORT ---
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- API CONFIGURATION ---
const API_KEY = import.meta.env.VITE_GEMINI_KEY || "AIzaSyDUP_WWDjNsdhTAInZPQ_HsEqnpPrQNvJU";
const genAI = new GoogleGenerativeAI(API_KEY);

// --- CUSTOM STYLES ---
const styles = `
  @keyframes scan-vertical {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(500%); opacity: 0; }
  }
  .animate-scan {
    animation: scan-vertical 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    background: linear-gradient(to bottom, transparent, #10b981, transparent);
  }
  @keyframes sonar-ripple {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(4); opacity: 0; }
  }
  .sonar-pulse {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 50%;
    border: 2px solid currentColor;
    animation: sonar-ripple 2s infinite;
  }
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  .animate-float {
    animation: float 4s ease-in-out infinite;
  }
  @keyframes breathe {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
  .animate-breathe {
    animation: breathe 2s infinite;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-ticker {
    display: flex;
    width: max-content;
    animation: ticker 30s linear infinite;
  }
`;

// --- TACTICAL MARKER ---
const getTacticalIcon = (severity, type) => {
  const color = severity === 'Critical' ? '#ef4444' : (severity === 'High' ? '#f59e0b' : '#10b981');
  let emoji = '🐾';
  if (type.includes('Canine') || type.includes('Dog') || type.includes('Puppy')) emoji = '🐕';
  else if (type.includes('Feline') || type.includes('Cat')) emoji = '🐈';
  else if (type.includes('Bird')) emoji = '🦅';
  else if (type.includes('Injury')) emoji = '🩹';

  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div class="sonar-pulse" style="color: ${color}; border-width: 2px;"></div>
        <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 18px;">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// --- DATASETS ---
const NGO_DATABASE = [
  { id: 1, name: "WSD Welfare of Stray Dogs", city: "Mumbai", type: "Clinical & Sterilization", phone: "919372079707", gps: "18.9827, 72.8311", image: "https://images.unsplash.com/photo-1599409636242-7500950a2794?w=800" },
  { id: 2, name: "ResQ Pune Division", city: "Pune", type: "Trauma & Emergency Hospital", phone: "919372079707", gps: "18.5204, 73.8567", image: "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=800" },
  { id: 3, name: "CUPA Bangalore Hub", city: "Bangalore", type: "Shelter & Rescue", phone: "919372079707", gps: "13.0354, 77.5988", image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800" },
  { id: 4, name: "Friendicoes SECA", city: "Delhi", type: "Ambulance & Emergency Hospital", phone: "919372079707", gps: "28.6139, 77.2090", image: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800" },
  { id: 5, name: "Blue Cross India", city: "Chennai", type: "Veterinary Surgical Unit", phone: "919372079707", gps: "13.0102, 80.2157", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800" },
  { id: 6, name: "People for Animals", city: "Hyderabad", type: "Wildlife Rehabilitation", phone: "919372079707", gps: "17.3850, 78.4867", image: "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=800" },
];

const APP_PROTOCOLS = [
  { id: 1, title: "Mission Hub", icon: <Newspaper className="text-amber-700 w-6 h-6" />, desc: "Central intelligence. Filter real-time news, rescue updates, and adoption cases." },
  { id: 2, title: "Sector Grid", icon: <MapIcon className="text-emerald-600 w-6 h-6" />, desc: "Live tactical map. Tracks distress signals (SOS) and active cases via satellite." },
  { id: 3, title: "Bio-Scan ID", icon: <Target className="text-amber-700 w-6 h-6" />, desc: "AI-Diagnostics. Identify breed and assess injury severity instantly via camera." },
  { id: 4, title: "NGO Registry", icon: <ShieldCheck className="text-emerald-600 w-6 h-6" />, desc: "Verified database. Get direct GPS nav and emergency hotlines for local units." },
  { id: 5, title: "Supply Lines", icon: <Package className="text-amber-700 w-6 h-6" />, desc: "Logistics network. Fund specific critical items (Vaccines/Food) directly." },
  { id: 6, title: "SOS Beacon", icon: <Siren className="text-rose-600 w-6 h-6" />, desc: "Emergency link. Broadcast GPS coords to National Dispatch via WhatsApp." },
  { id: 7, title: "Agent Profile", icon: <User className="text-slate-600 w-6 h-6" />, desc: "Track your impact. View Karma points, rank, and regional leaderboard status." },
  { id: 8, title: "Intel Report", icon: <FileText className="text-blue-600 w-6 h-6" />, desc: "Submit data. Create new rescue or adoption files via the (+) Action Button." },
];

const SUPPLY_DROPS = [
  { id: 1, title: "Operation: Monsoon Shield", sector: "Mumbai HQ", item: "Waterproof Tarps", raised: 45000, goal: 60000, deadline: "2 Days Left", image: "https://images.unsplash.com/photo-1599409636242-7500950a2794?w=800" },
  { id: 2, title: "Vaccine Drive Alpha", sector: "Pune Outpost", item: "Anti-Rabies Vials", raised: 12000, goal: 15000, deadline: "Urgent", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800" },
  { id: 3, title: "Nutrient Resupply", sector: "Delhi Central", item: "High-Protein Chow", raised: 8000, goal: 50000, deadline: "5 Days Left", image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800" },
];

const ACTIVE_CASES = [
  { id: 1, type: "Injury", severity: "High", lat: 19.0760, lng: 72.8777, title: "Canine Fracture", distance: "0.8km", time: "12m ago" },
  { id: 2, type: "Stuck", severity: "Medium", lat: 19.0200, lng: 72.8500, title: "Feline / Tree", distance: "2.1km", time: "45m ago" },
  { id: 3, type: "Abuse", severity: "Critical", lat: 19.1200, lng: 72.8900, title: "Reported Cruelty", distance: "1.5km", time: "2m ago" },
  { id: 4, type: "Hunger", severity: "Low", lat: 19.0500, lng: 72.8200, title: "Puppy Litter", distance: "3.2km", time: "1h ago" },
];

const INITIAL_FEED = [
  {
    type: 'news', id: 1, headline: "District Rescue Operations: 2026 Protocol Change", category: "BREAKING NEWS",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200",
    author: { name: "Dr. Ananya Rai", role: "Field Director", avatar: "AR" },
    date: "JAN 29, 2026", readTime: "5 min read", status: "Active",
    content: "Official Directive: All divisions must now sync Bio-Scan data before initiating clinic transport. Field agents are advised to update firmware.",
    location: "National HQ", liked: false, likesCount: 420, comments: [], verified: true
  },
  {
    type: 'adoption', id: 101, name: "Cooper - Case ID 104", age: "5 months", breed: "Indie Mix",
    bio: "Subject found with minor leg trauma in Mumbai Central. Fully rehabilitated.",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800",
    phone: "919372079707", location: "Mumbai", liked: false, likesCount: 89, comments: [], status: "Active"
  },
];

const LEADERBOARD = [
  { name: "Ankita Bind", karma: 1420, rank: 1, badge: "Grandmaster", avatar: "AB" },
  { name: "Shivam Kumar", karma: 1250, rank: 2, badge: "Elite Protector", avatar: "SK" },
  { name: "Alok Sharma", karma: 1100, rank: 3, badge: "Field Specialist", avatar: "AS" }
];

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const SafeImage = ({ src, className }) => {
  const [err, setErr] = useState(false);
  if (err || !src) return (
    <div className={`bg-slate-200 flex flex-col items-center justify-center text-slate-400 ${className}`}>
      <ImageIcon className="w-8 h-8 opacity-20" />
      <span className="text-[10px] font-black uppercase mt-2 opacity-40">Offline Data</span>
    </div>
  );
  return <img src={src} className={className} alt="intel" onError={() => setErr(true)} loading="lazy" />;
};

export default function App() {
  const [screen, setScreen] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('cs_screen') : 'auth') || 'auth');
  const [tab, setTab] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('cs_tab') : 'feed') || 'feed');
  const [user, setUser] = useState(() => (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('cs_user')) : null) || null);
  const [karma, setKarma] = useState(() => (typeof window !== 'undefined' ? parseInt(localStorage.getItem('cs_karma')) : 50) || 50);
  const [feed, setFeed] = useState(() => (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('cs_feed')) : INITIAL_FEED) || INITIAL_FEED);
  const [following, setFollowing] = useState(() => (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('cs_following')) : []) || []);
  const [liveData, setLiveData] = useState({ cruelty: 14829, hunger: 52044, rescued: 128956 });
  const [searchQuery, setSearchQuery] = useState('');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [postForm, setPostForm] = useState({ title: '', desc: '', type: 'news', image: null, age: 'Junior' });
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [notification, setNotification] = useState(null);
  const [sosLoading, setSosLoading] = useState(false);

  useEffect(() => {
    // Leaflet Icon Fix inside useEffect
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('cs_screen', screen);
      localStorage.setItem('cs_tab', tab);
      if (user) localStorage.setItem('cs_user', JSON.stringify(user));
      localStorage.setItem('cs_karma', karma.toString());
      localStorage.setItem('cs_feed', JSON.stringify(feed));
      localStorage.setItem('cs_following', JSON.stringify(following));
    }

    const ticker = setInterval(() => {
      setLiveData(prev => ({ cruelty: prev.cruelty + 1, hunger: prev.hunger + 3, rescued: prev.rescued + 1 }));
    }, 8000);
    return () => clearInterval(ticker);
  }, [screen, tab, user, karma, feed, following]);

  const addKarma = (pts) => {
    setKarma(prev => prev + pts);
    setNotification(`+${pts} IMPACT POINTS LOGGED`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSOS = () => {
    setSosLoading(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const msg = `SOS ALERT | Agent: ${user?.name}\nGPS: https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      window.open(`https://wa.me/+919820161114?text=${encodeURIComponent(msg)}`, '_blank');
      setSosLoading(false); addKarma(15);
    }, () => {
      window.open(`https://wa.me/+919820161114?text=SOS ALERT: Manual Check-in`, '_blank');
      setSosLoading(false);
    });
  };

  const handlePostSubmit = () => {
    if (!postForm.title || !postForm.image) return alert("Required.");
    const newEntry = {
      id: Date.now(),
      type: postForm.type,
      headline: postForm.type === 'news' ? postForm.title : null,
      name: postForm.type === 'adoption' ? postForm.title : null,
      image: postForm.image,
      author: { name: user.name, avatar: user.name.substring(0, 2).toUpperCase() },
      date: "JUST NOW",
      content: postForm.desc,
      bio: postForm.desc,
      age: postForm.age,
      liked: false,
      comments: [],
      location: user?.city || "Unknown"
    };
    setFeed([newEntry, ...feed]);
    setIsModalOpen(false);
    addKarma(25);
  };

  const filteredFeed = useMemo(() => {
    return feed
      .filter(i => filter === 'all' || i.type === filter)
      .filter(i => (i.headline || i.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
  }, [feed, filter, searchQuery]);

  if (screen === 'auth') return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <style>{styles}</style>
      <div className="absolute inset-0 z-0 opacity-40">
        <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2000" className="w-full h-full object-cover" alt="bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/20 to-slate-950"></div>
      </div>
      <div className="w-full max-w-md space-y-12 animate-fade-in relative z-10 font-black uppercase">
        <div className="bg-emerald-500 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-float border-4 border-white/10"><PawPrint className="text-white w-12 h-12" /></div>
        <h1 className="text-5xl text-white tracking-tighter leading-none">PAWSITIVE<br /><span className="text-emerald-400">SCROLL</span></h1>
        <div className="space-y-4">
          <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="Identity (Email)" className="w-full p-6 bg-slate-950 border-2 border-slate-800 text-emerald-400 rounded-[2rem] outline-none shadow-xl" />
          <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Access Key" className="w-full p-6 bg-slate-950 border-2 border-slate-800 text-emerald-400 rounded-[2rem] outline-none shadow-xl" />
          <button onClick={() => setScreen('setup')} className="w-full py-7 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95">Initialize Session</button>
        </div>
      </div>
    </div>
  );

  if (screen === 'setup') return (
    <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        <div className="hidden md:block w-1/2 relative">
          <img src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=2000" className="w-full h-full object-cover" alt="setup" />
          <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"></div>
        </div>
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter mb-8">Identity Setup</h2>
          <div className="space-y-6">
            <input id="s-name" placeholder="Agent Callsign" className="w-full p-7 bg-slate-950 text-emerald-400 font-black rounded-[2rem] outline-none" />
            <input id="s-city" placeholder="Division City" className="w-full p-7 bg-slate-950 text-emerald-400 font-black rounded-[2rem] outline-none" />
            <button onClick={() => {
              const n = document.getElementById('s-name').value;
              const c = document.getElementById('s-city').value;
              if (!n || !c) return alert("Required.");
              setUser({ name: n, city: c }); setScreen('app'); addKarma(50);
            }} className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl active:scale-95">Activate Profile</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans pb-32 relative">
      <style>{styles}</style>

      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-950 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-500 font-black uppercase text-[10px] tracking-widest animate-slide-up">
          <Zap className="text-amber-400 w-5 h-5 fill-amber-400" /> {notification}
        </div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-10 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setTab('feed')}>
          <div className="bg-slate-950 p-2.5 rounded-2xl shadow-lg"><PawPrint className="w-6 h-6 text-white" /></div>
          <span className="font-black text-2xl tracking-tighter text-slate-900 uppercase">PAWSITIVE SCROLL</span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-[2rem] border border-slate-200">
          {[
            { id: 'feed', label: 'Feed 📰' },
            { id: 'ops', label: 'Map 🚁' },
            { id: 'ngos', label: 'Registry 🏥' },
            { id: 'scanner', label: 'Scanner 🧬' },
            { id: 'manual', label: 'Protocol 📜' },
            { id: 'logistics', label: 'Supply 📦' },
            { id: 'profile', label: 'Profile 💂' }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-6 py-2.5 rounded-[1.5rem] text-xs font-extrabold uppercase tracking-wider transition-all ${tab === t.id ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            <span className="text-sm font-black text-emerald-700 uppercase">{karma}</span>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-950 text-white p-4 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"><Plus className="w-7 h-7" /></button>
        </div>
      </nav>

      {/* TABS */}
      <main className="max-w-7xl mx-auto px-10 py-12 text-slate-950">

        {tab === 'feed' && (
          <div className="space-y-12 animate-fade-in">
            <div className="bg-slate-950 p-4 rounded-2xl overflow-hidden relative border-y-4 border-emerald-500 shadow-2xl">
              <div className="animate-ticker font-black text-[11px] text-white uppercase tracking-widest gap-12 flex">
                <span><Skull className="inline text-rose-500 mr-2" /> Cruelty Cases: {liveData.cruelty.toLocaleString()}</span>
                <span><Flame className="inline text-orange-500 mr-2" /> Hunger Alerts: {liveData.hunger.toLocaleString()}</span>
                <span><HandHeart className="inline text-emerald-500 mr-2" /> Lives Saved: {liveData.rescued.toLocaleString()}</span>
                <span><Skull className="inline text-rose-500 mr-2" /> Cruelty Cases: {liveData.cruelty.toLocaleString()}</span>
                <span><Flame className="inline text-orange-500 mr-2" /> Hunger Alerts: {liveData.hunger.toLocaleString()}</span>
                <span><HandHeart className="inline text-emerald-500 mr-2" /> Lives Saved: {liveData.rescued.toLocaleString()}</span>
              </div>
            </div>

            <header className="flex items-end justify-between border-l-8 border-emerald-500 pl-8 font-black uppercase">
              <div>
                <h2 className="text-7xl tracking-tighter leading-none">Mission Hub 📡</h2>
                <p className="text-slate-400 text-[11px] tracking-[0.4em] mt-4 font-black">District Deployment: <span className="text-emerald-600">{user?.city} Command</span></p>
              </div>
              <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 font-black uppercase">
                {['all', 'news', 'adoption'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-6 py-3 rounded-xl text-[10px] tracking-widest transition-all ${filter === f ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>{f}</button>
                ))}
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 font-black uppercase">
              {filteredFeed.map(item => (
                <div key={item.id} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col h-full border-b-8 border-slate-100">
                  <div className="h-72 relative overflow-hidden" onClick={() => item.type === 'news' && setSelectedArticle(item)}>
                    <SafeImage src={item.image} className="w-full h-full object-cover cursor-pointer" />
                    <div className="absolute top-8 left-8">
                      <span className={`px-4 py-1.5 rounded-lg text-[10px] text-white ${item.type === 'news' ? 'bg-emerald-500' : 'bg-blue-600'}`}>{item.type}</span>
                    </div>
                  </div>
                  <div className="p-10 flex flex-col flex-1">
                    <h3 className="text-3xl tracking-tight leading-tight mb-8 line-clamp-2 cursor-pointer" onClick={() => setSelectedArticle(item)}>{item.headline || item.name}</h3>
                    <p className="text-slate-500 text-sm font-medium mb-10 normal-case italic line-clamp-3 leading-relaxed">"{item.bio || item.content}"</p>
                    <button onClick={() => item.type === 'news' ? setSelectedArticle(item) : window.open(`https://wa.me/${item.phone}`)} className="mt-auto w-full bg-slate-950 text-white py-5 rounded-[2rem] tracking-[0.2em] text-[10px] hover:bg-black transition-all shadow-xl">
                      {item.type === 'news' ? 'Read Full Report' : 'Submit Query'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'ops' && (
          <div className="space-y-8 animate-fade-in h-[calc(100vh-200px)] flex flex-col font-black uppercase">
            <h2 className="text-6xl tracking-tighter">Sector Grid 🚁</h2>
            <div className="flex-1 rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white relative z-0">
              <div className="absolute inset-0 pointer-events-none z-[400] opacity-30">
                <div className="w-full h-full animate-scan shadow-[0_0_20px_4px_#10b981]"></div>
              </div>
              <MapContainer center={[19.0760, 72.8777]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                {ACTIVE_CASES.map((c) => (
                  <Marker key={c.id} position={[c.lat, c.lng]} icon={getTacticalIcon(c.severity, c.title)}>
                    <Popup><div className="font-black uppercase text-sm">{c.title}<br /><span className="text-[10px] text-slate-400">{c.severity}</span></div></Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}

        {tab === 'scanner' && <ScannerView onScanComplete={addKarma} />}

        {tab === 'ngos' && (
          <div className="space-y-12 animate-fade-in font-black uppercase">
            <h2 className="text-6xl tracking-tighter border-l-8 border-blue-500 pl-8">NGO Registry 🏥</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {NGO_DATABASE.map(ngo => (
                <div key={ngo.id} className="bg-white p-10 rounded-[4rem] border border-slate-200 flex items-center gap-10 shadow-sm hover:border-blue-500 transition-all">
                  <SafeImage src={ngo.image} className="w-40 h-40 rounded-[2.5rem] object-cover shadow-2xl" />
                  <div>
                    <h4 className="text-3xl tracking-tight leading-none mb-2">{ngo.name}</h4>
                    <p className="text-[11px] text-slate-400 tracking-widest mb-6">{ngo.city} Division</p>
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ngo.gps}`)} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest flex items-center gap-2 shadow-lg"><Navigation className="w-4 h-4" /> Start Nav</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'manual' && (
          <div className="space-y-20 animate-fade-in font-black uppercase text-center">
            <h2 className="text-7xl text-amber-900 tracking-tighter leading-none">Operational Protocol 📖</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {APP_PROTOCOLS.map(prot => (
                <div key={prot.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col items-center">
                  <div className="bg-stone-50 p-4 rounded-[1.5rem] mb-4">{prot.icon}</div>
                  <h4 className="text-xl text-amber-900 mb-2">{prot.title}</h4>
                  <p className="text-stone-500 font-bold text-xs normal-case leading-relaxed">{prot.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'logistics' && (
          <div className="space-y-12 animate-fade-in font-black uppercase">
            <h2 className="text-7xl tracking-tighter border-l-8 border-amber-500 pl-8">Supply Lines 📦</h2>
            {SUPPLY_DROPS.map(drop => (
              <div key={drop.id} className="bg-white p-10 rounded-[4rem] border border-slate-200 shadow-xl flex items-center gap-10">
                <SafeImage src={drop.image} className="w-32 h-32 rounded-[2rem] object-cover" />
                <div className="flex-1 space-y-4">
                  <h4 className="text-3xl text-slate-950 tracking-tight leading-none">{drop.title}</h4>
                  <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden border">
                    <div className="h-full bg-amber-500" style={{ width: `${(drop.raised / drop.goal) * 100}%` }}></div>
                  </div>
                </div>
                <button onClick={() => addKarma(100)} className="bg-slate-950 text-white px-10 py-6 rounded-[2.5rem] tracking-[0.2em] text-[10px] hover:bg-amber-500 transition-all">Deploy Funds</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'profile' && (
          <div className="max-w-5xl mx-auto space-y-20 animate-fade-in font-black uppercase">
            <div className="bg-white p-16 rounded-[5rem] border border-slate-200 shadow-2xl flex items-center gap-16 relative overflow-hidden">
              <div className="w-56 h-56 bg-slate-100 rounded-[4rem] flex items-center justify-center text-slate-300"><User className="w-24 h-24" /></div>
              <div className="flex-1 space-y-6">
                <h2 className="text-7xl tracking-tighter leading-none">{user?.name}</h2>
                <div className="bg-slate-950 text-white px-12 py-6 rounded-3xl inline-flex items-center gap-5 shadow-2xl">
                  <Zap className="text-amber-400 w-8 h-8 fill-amber-400" />
                  <span className="text-xl tracking-widest">{karma} Impact Pts</span>
                </div>
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-6 bg-rose-50 text-rose-600 rounded-3xl border border-rose-100 hover:bg-rose-100 transition-colors"><LogOut className="w-8 h-8" /></button>
            </div>
            <div className="space-y-12">
              <h3 className="text-5xl tracking-tighter px-10 flex items-center gap-6"><Crown className="text-amber-500 w-12 h-12" /> Regional Elite 🏆</h3>
              <div className="space-y-6 px-10">
                {LEADERBOARD.map((l, i) => (
                  <div key={i} className="bg-white p-12 rounded-[4rem] border border-slate-200 flex items-center justify-between shadow-sm hover:translate-x-4 transition-all">
                    <div className="flex items-center gap-12">
                      <div className="text-6xl text-slate-100 w-20">0{l.rank}</div>
                      <h4 className="text-4xl tracking-tighter">{l.name}</h4>
                    </div>
                    <p className="text-5xl">{l.karma.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SOS */}
      <button
        onClick={handleSOS}
        className={`fixed bottom-12 right-12 z-50 w-28 h-28 rounded-[3.5rem] flex flex-col items-center justify-center text-white shadow-2xl transition-all ${sosLoading ? 'bg-slate-900 animate-spin' : 'bg-rose-600 animate-breathe hover:scale-110'}`}
      >
        <Siren className="w-12 h-12" />
        <span className="text-[10px] font-black tracking-widest mt-2 uppercase">SOS</span>
      </button>

      {/* ARTICLE VIEW */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto animate-fade-in no-scrollbar font-black uppercase">
          <div className="relative h-[50vh] w-full">
            <img src={selectedArticle.image} className="w-full h-full object-cover" alt="hero" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
            <button onClick={() => setSelectedArticle(null)} className="absolute top-10 left-10 p-4 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-all"><ChevronLeft /></button>
            <div className="absolute bottom-12 left-12 text-white max-w-4xl">
              <span className="bg-emerald-500 px-4 py-1.5 rounded-lg text-[10px] mb-6 inline-block shadow-lg">{selectedArticle.category || "FIELD REPORT"}</span>
              <h1 className="text-6xl tracking-tighter leading-none mb-4 drop-shadow-lg">{selectedArticle.headline || selectedArticle.name}</h1>
            </div>
          </div>
          <div className="max-w-3xl mx-auto p-12 pb-32">
            <p className="text-xl font-bold text-slate-900 leading-relaxed mb-12 normal-case">{selectedArticle.content || selectedArticle.bio}</p>
            <div className="border-t pt-12">
              <h4 className="text-xl mb-8 flex items-center gap-3"><MessageCircle className="w-6 h-6" /> Intel Chatter</h4>
              <div className="flex gap-4">
                <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Submit update..." className="flex-1 bg-slate-100 p-6 rounded-2xl outline-none font-black" />
                <button onClick={() => { if (!commentInput) return; addKarma(5); setCommentInput(""); }} className="bg-slate-950 text-white p-6 rounded-2xl shadow-xl active:scale-95"><Send /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in font-black uppercase">
          <div className="bg-white w-full max-w-3xl rounded-[5rem] p-16 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar border-[16px] border-white text-slate-950">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-5xl tracking-tighter leading-none">File Report 📂</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-3xl transition-all"><X className="w-8 h-8" /></button>
            </div>
            <div className="space-y-12">
              <div className="h-80 bg-slate-950 border-4 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center relative group overflow-hidden">
                {postForm.image ? (
                  <img src={postForm.image} className="w-full h-full object-cover" alt="preview" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="text-emerald-500/20 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] text-emerald-500/40 tracking-[0.5em]">Capture Metadata</p>
                  </div>
                )}
                <input type="file" onChange={async (e) => {
                  const b64 = await convertToBase64(e.target.files[0]);
                  setPostForm({ ...postForm, image: b64 });
                }} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="space-y-6">
                <input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="Title / Name" className="w-full p-6 bg-slate-950 text-emerald-400 rounded-[2.5rem] outline-none shadow-xl" />
                <textarea value={postForm.desc} onChange={(e) => setPostForm({ ...postForm, desc: e.target.value })} rows="4" placeholder="Description..." className="w-full p-6 bg-slate-950 text-emerald-400 rounded-[2.5rem] outline-none shadow-xl" />
              </div>
              <button onClick={handlePostSubmit} className="w-full py-8 bg-slate-950 text-white rounded-[3rem] tracking-[0.6em] text-[10px] shadow-2xl hover:bg-emerald-500 transition-all active:scale-95">Transmit Intel 📡</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SCANNER VIEW (WITH REAL GOOGLE GEMINI AI) ---
const ScannerView = ({ onScanComplete }) => {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  async function fileToGenerativePart(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: { data: base64Data, mimeType: file.type },
        });
      };
      reader.readAsDataURL(file);
    });
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));
    setAnalyzing(true);
    setResult(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const prompt = `Analyze this animal image for a rescue app. 
            Identify the breed and look for visible health issues like dermatitis, mange, or injury. 
            Response MUST be exactly in this JSON format and nothing else: 
            {
              "breed": "string",
              "condition": "string",
              "advice": "string",
              "accuracy": "string"
            }`;

      const imagePart = await fileToGenerativePart(file);
      const aiResult = await model.generateContent([prompt, imagePart]);
      const response = await aiResult.response;
      const text = response.text();

      // Safer JSON extraction: Find the first { and last }
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");

      const data = JSON.parse(jsonMatch[0]);

      setResult({
        breed: (data.breed || "UNKNOWN").toUpperCase(),
        condition: (data.condition || "NORMAL").toUpperCase(),
        advice: data.advice || "No specific treatment advised.",
        accuracy: data.accuracy || "96.4% MATCH"
      });
      onScanComplete(50);
    } catch (error) {
      console.error("AI Error:", error);
      setResult({
        breed: "UNKNOWN SUBJECT",
        condition: "LINK INTERRUPTED",
        advice: "Analysis failed. Please try with a clearer image or check your connection. Details: " + (error.message || "Unknown error"),
        accuracy: "0%"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in text-center font-black uppercase py-12">
      {!image ? (
        <div className="h-[550px] border-[8px] border-dashed border-slate-950 rounded-[4rem] flex flex-col items-center justify-center relative hover:bg-emerald-50 transition-all cursor-pointer shadow-inner bg-white group">
          <ImageIcon className="w-16 h-16 text-slate-950 mb-6 animate-float" />
          <p className="text-[12px] tracking-[0.6em] text-slate-950">Upload Medical Scan 📸</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      ) : (
        <div className="space-y-12">
          <div className="h-[550px] rounded-[4rem] overflow-hidden relative shadow-2xl border-[12px] border-white bg-slate-950">
            <img src={image} className="w-full h-full object-cover" alt="target" />
            {analyzing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl flex flex-col items-center justify-center text-emerald-500">
                <RefreshCw className="w-16 h-16 animate-spin mb-8" />
                <p className="text-xl tracking-[0.8em] animate-pulse">Bio-Diagnostics...</p>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="w-full h-full animate-scan shadow-[0_0_20px_4px_#10b981]"></div>
            </div>
          </div>
          {result && (
            <div className="bg-slate-950 p-20 rounded-[4rem] text-white text-left animate-slide-up border-[8px] border-white/5 relative shadow-2xl">
              <h4 className="text-6xl tracking-tighter text-emerald-400 mb-4 font-black">{result.condition}</h4>
              <div className="flex justify-between items-center border-b border-slate-800 pb-8 mb-8">
                <p className="text-slate-400 text-xl tracking-widest">Subject: {result.breed}</p>
                <span className="text-emerald-500 text-[10px] border border-emerald-500/30 px-4 py-1.5 rounded-full">{result.accuracy}</span>
              </div>
              <div className="bg-white/10 p-10 rounded-[2.5rem] border border-white/10 shadow-inner">
                <div className="flex items-center gap-4 mb-6">
                  <Stethoscope className="text-emerald-400 w-8 h-8" />
                  <p className="text-emerald-400 text-xs tracking-[0.4em]">TREATMENT PROTOCOL:</p>
                </div>
                <p className="text-white normal-case font-medium text-2xl leading-relaxed">{result.advice}</p>
              </div>
              <button onClick={() => { setImage(null); setResult(null); }} className="w-full mt-10 py-8 bg-emerald-500 text-white rounded-[2.5rem] tracking-[0.5em] font-black flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-400 transition-all active:scale-95">
                <RotateCcw className="w-5 h-5" /> New Scan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}