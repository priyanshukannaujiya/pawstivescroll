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
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

// --- GOOGLE AI IMPORT ---
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- API CONFIGURATION ---
const API_KEY = import.meta.env.VITE_GEMINI_KEY;
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
  .text-shadow-sm {
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  .readable-text {
    line-height: 1.6;
    letter-spacing: 0.01em;
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

  // --- DATABASE CONNECTIVITY (SUPABASE) ---
  useEffect(() => {
    const fetchLiveIntel = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setFeed(data);
      }
    };

    fetchLiveIntel();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        setFeed(prev => [payload.new, ...prev]);
        setNotification("NEW INTEL DETECTED 📡");
        setTimeout(() => setNotification(null), 3000);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

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

  const handlePostSubmit = async () => {
    if (!postForm.title || !postForm.image) return alert("Required.");

    const newEntry = {
      type: postForm.type,
      headline: postForm.type === 'news' ? postForm.title : null,
      name: postForm.type === 'adoption' ? postForm.title : null,
      image: postForm.image,
      author: { name: user.name, avatar: user.name.substring(0, 2).toUpperCase() },
      content: postForm.desc,
      bio: postForm.desc,
      age: postForm.age,
      location: user?.city || "Unknown"
    };

    // SYNC TO SUPABASE (GLOBAL)
    const { error } = await supabase
      .from('posts')
      .insert([newEntry]);

    if (error) {
      console.error("Supabase Error:", error);
      // Fallback to local state if DB is not ready
      setFeed([{ ...newEntry, id: Date.now(), date: "JUST NOW" }, ...feed]);
    }

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-10 relative z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="bg-emerald-500 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border-4 border-white/10"
        >
          <PawPrint className="text-white w-12 h-12" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none uppercase">
            PAWSITIVE<br /><span className="text-emerald-400">SCROLL</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-widest text-[10px] uppercase">Rescue Command Interface</p>
        </div>

        <div className="space-y-4">
          <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="Identity (Email)" className="w-full p-6 bg-slate-900/50 backdrop-blur-md border-2 border-slate-800 text-emerald-400 rounded-[2rem] outline-none shadow-xl focus:border-emerald-500/50 transition-all font-bold" />
          <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Access Key" className="w-full p-6 bg-slate-900/50 backdrop-blur-md border-2 border-slate-800 text-emerald-400 rounded-[2rem] outline-none shadow-xl focus:border-emerald-500/50 transition-all font-bold" />
          <button onClick={() => setScreen('setup')} className="w-full py-7 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[12px] shadow-2xl hover:bg-emerald-400 active:scale-95 transition-all">Initialize Session</button>
        </div>
      </motion.div>
    </div>
  );

  if (screen === 'setup') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[500px]"
      >
        <div className="hidden md:block w-1/2 relative">
          <img src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=2000" className="w-full h-full object-cover" alt="setup" />
          <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"></div>
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <h3 className="text-2xl font-black uppercase tracking-tight">Mission Ready?</h3>
            <p className="opacity-80 text-sm font-medium mt-2">Establish your field credentials to begin operations.</p>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter mb-8">Identity Setup</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Agent Callsign</label>
              <input id="s-name" placeholder="E.g. Ghost-01" className="w-full p-7 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 text-emerald-600 font-bold rounded-[2rem] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Division City</label>
              <input id="s-city" placeholder="E.g. Mumbai" className="w-full p-7 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 text-emerald-600 font-bold rounded-[2rem] outline-none transition-all" />
            </div>
            <button onClick={() => {
              const n = document.getElementById('s-name').value;
              const c = document.getElementById('s-city').value;
              if (!n || !c) return alert("Required.");
              setUser({ name: n, city: c }); setScreen('app'); addKarma(50);
            }} className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 active:scale-95 transition-all mt-4">Activate Profile</button>
          </div>
        </div>
      </motion.div>
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
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 md:px-10 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setTab('feed')}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-slate-950 p-2.5 rounded-2xl shadow-lg"
          >
            <PawPrint className="w-6 h-6 text-white" />
          </motion.div>
          <span className="font-black text-xl md:text-2xl tracking-tighter text-slate-900 uppercase">PAWSITIVE SCROLL</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-[2rem] border border-slate-200">
          {[
            { id: 'feed', label: 'Feed 📰' },
            { id: 'ops', label: 'Map 🚁' },
            { id: 'ngos', label: 'Registry 🏥' },
            { id: 'scanner', label: 'Scanner 🧬' },
            { id: 'manual', label: 'Protocol 📜' },
            { id: 'logistics', label: 'Supply 📦' },
            { id: 'profile', label: 'Profile 💂' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider transition-all relative ${tab === t.id ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white shadow-sm border border-slate-200 rounded-[1.5rem] -z-10"
                />
              )}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex bg-emerald-50 px-4 py-2 md:px-6 md:py-3 rounded-2xl border border-emerald-100 items-center gap-2 md:gap-3">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 fill-emerald-600" />
            <span className="text-xs md:text-sm font-black text-emerald-700 uppercase">{karma}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-950 text-white p-3 md:p-4 rounded-2xl shadow-xl transition-all"
          >
            <Plus className="w-6 h-6 md:w-7 md:h-7" />
          </motion.button>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100]">
        <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex items-center justify-around shadow-2xl overflow-x-auto no-scrollbar">
          {[
            { id: 'feed', icon: <Home className="w-5 h-5" />, label: 'Feed' },
            { id: 'ops', icon: <MapIcon className="w-5 h-5" />, label: 'Map' },
            { id: 'ngos', icon: <Stethoscope className="w-5 h-5" />, label: 'NGOs' },
            { id: 'scanner', icon: <Radar className="w-5 h-5" />, label: 'Scan' },
            { id: 'manual', icon: <BookOpen className="w-5 h-5" />, label: 'Intel' },
            { id: 'logistics', icon: <Package className="w-5 h-5" />, label: 'Drops' },
            { id: 'profile', icon: <User className="w-5 h-5" />, label: 'Me' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`p-4 rounded-full transition-all relative flex flex-col items-center gap-1 min-w-[64px] ${tab === t.id ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="mobileTabGlow"
                  className="absolute inset-0 bg-emerald-500/10 rounded-full blur-md"
                />
              )}
              {t.icon}
              <span className="text-[8px] font-black uppercase tracking-tighter">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TABS */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12 pb-40 lg:pb-12 text-slate-950 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {tab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
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

              <header className="flex flex-col md:flex-row md:items-end justify-between border-l-8 border-emerald-500 pl-8 gap-6">
                <div className="space-y-2">
                  <h2 className="text-6xl md:text-7xl font-black tracking-tighter leading-none uppercase">Mission Hub 📡</h2>
                  <p className="text-slate-400 text-[10px] tracking-[0.4em] font-black uppercase">District Deployment: <span className="text-emerald-600">{user?.city} Command</span></p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  {['all', 'news', 'adoption'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>{f}</button>
                  ))}
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                {filteredFeed.map(item => (
                  <motion.div
                    layout
                    key={item.id}
                    className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col h-full border-b-8 border-slate-100"
                  >
                    <div className="h-72 relative overflow-hidden" onClick={() => item.type === 'news' && setSelectedArticle(item)}>
                      <SafeImage src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer" />
                      <div className="absolute top-8 left-8">
                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase text-white shadow-lg ${item.type === 'news' ? 'bg-emerald-500' : 'bg-blue-600'}`}>{item.type}</span>
                      </div>
                    </div>
                    <div className="p-10 flex flex-col flex-1">
                      <h3 className="text-2xl font-black uppercase tracking-tight leading-tight mb-6 line-clamp-2 cursor-pointer group-hover:text-emerald-600 transition-colors" onClick={() => setSelectedArticle(item)}>{item.headline || item.name}</h3>
                      <p className="text-slate-500 text-[15px] font-medium mb-10 normal-case readable-text line-clamp-3">"{item.bio || item.content}"</p>
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        onClick={() => item.type === 'news' ? setSelectedArticle(item) : window.open(`https://wa.me/${item.phone}`)}
                        className="mt-auto w-full bg-slate-950 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-emerald-600 transition-all"
                      >
                        {item.type === 'news' ? 'Read Full Report' : 'Submit Query'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'ops' && (
            <motion.div
              key="ops"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8 h-[calc(100vh-250px)] flex flex-col"
            >
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Sector Grid 🚁</h2>
              <div className="flex-1 rounded-[3.5rem] overflow-hidden shadow-2xl border-[8px] border-white relative z-0">
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
            </motion.div>
          )}

          {tab === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ScannerView onScanComplete={addKarma} />
            </motion.div>
          )}

          {tab === 'ngos' && (
            <motion.div
              key="ngos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              <h2 className="text-6xl font-black uppercase tracking-tighter border-l-8 border-blue-500 pl-8 leading-none">NGO Registry 🏥</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                {NGO_DATABASE.map(ngo => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    key={ngo.id}
                    className="bg-white p-8 md:p-10 rounded-[4rem] border border-slate-200 flex flex-col sm:flex-row items-center gap-8 md:gap-10 shadow-sm transition-all"
                  >
                    <SafeImage src={ngo.image} className="w-40 h-40 rounded-[2.5rem] object-cover shadow-2xl" />
                    <div className="text-center sm:text-left flex-1">
                      <h4 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">{ngo.name}</h4>
                      <p className="text-[11px] text-slate-400 tracking-widest font-black uppercase mb-6">{ngo.city} Division</p>
                      <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ngo.gps}`)} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center sm:justify-start gap-2 shadow-lg w-full sm:w-auto hover:bg-blue-600 transition-colors"><Navigation className="w-4 h-4" /> Start Nav</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-16 py-8"
            >
              <h2 className="text-6xl md:text-7xl font-black uppercase text-amber-900 tracking-tighter leading-none text-center">Operational Protocol 📖</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {APP_PROTOCOLS.map(prot => (
                  <div key={prot.id} className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-sm flex flex-col items-center text-center">
                    <div className="bg-stone-50 p-5 rounded-[2rem] mb-6">{prot.icon}</div>
                    <h4 className="text-xl font-black uppercase text-amber-900 mb-3">{prot.title}</h4>
                    <p className="text-stone-500 font-bold text-xs leading-relaxed readable-text">{prot.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'logistics' && (
            <motion.div
              key="logistics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              <h2 className="text-6xl md:text-7xl font-black uppercase tracking-tighter border-l-8 border-amber-500 pl-8 leading-none">Supply Lines 📦</h2>
              <div className="space-y-8">
                {SUPPLY_DROPS.map(drop => (
                  <div key={drop.id} className="bg-white p-8 md:p-12 rounded-[4rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center gap-10">
                    <SafeImage src={drop.image} className="w-40 h-40 rounded-[2.5rem] object-cover" />
                    <div className="flex-1 w-full space-y-6">
                      <h4 className="text-3xl font-black uppercase text-slate-950 tracking-tight leading-none">{drop.title}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Progress: {Math.round((drop.raised / drop.goal) * 100)}%</span>
                          <span>Target: ₹{drop.goal.toLocaleString()}</span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(drop.raised / drop.goal) * 100}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => addKarma(100)} className="w-full md:w-auto bg-slate-950 text-white px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-500 transition-all shadow-xl">Deploy Funds</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-5xl mx-auto space-y-20"
            >
              <div className="bg-white p-12 md:p-16 rounded-[5rem] border border-slate-200 shadow-2xl flex flex-col md:flex-row items-center gap-12 md:gap-16 relative overflow-hidden">
                <div className="w-56 h-56 bg-slate-100 rounded-[4rem] flex items-center justify-center text-slate-300 shadow-inner">
                  <User className="w-24 h-24" />
                </div>
                <div className="flex-1 space-y-6 text-center md:text-left">
                  <h2 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none">{user?.name}</h2>
                  <div className="bg-slate-950 text-white px-10 py-5 rounded-3xl inline-flex items-center gap-4 shadow-2xl">
                    <Zap className="text-amber-400 w-8 h-8 fill-amber-400" />
                    <span className="text-xl font-black uppercase tracking-widest">{karma} Impact Pts</span>
                  </div>
                </div>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-6 bg-rose-50 text-rose-600 rounded-3xl border border-rose-100 hover:bg-rose-100 transition-colors"><LogOut className="w-8 h-8" /></button>
              </div>

              <div className="space-y-12">
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter px-10 flex items-center justify-center md:justify-start gap-6 leading-none"><Crown className="text-amber-500 w-12 h-12" /> Regional Elite 🏆</h3>
                <div className="space-y-6 px-4 md:px-10">
                  {LEADERBOARD.map((l, i) => (
                    <motion.div
                      whileHover={{ x: 10 }}
                      key={i}
                      className="bg-white p-8 md:p-12 rounded-[4rem] border border-slate-200 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-8 md:gap-12">
                        <div className="text-5xl md:text-6xl font-black text-slate-100 w-16 md:w-20">0{l.rank}</div>
                        <h4 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">{l.name}</h4>
                      </div>
                      <p className="text-3xl md:text-5xl font-black text-emerald-600">{l.karma.toLocaleString()}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] bg-white overflow-y-auto no-scrollbar"
          >
            <div className="relative h-[50vh] w-full">
              <SafeImage src={selectedArticle.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedArticle(null)}
                className="absolute top-10 left-10 p-4 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-all"
              >
                <ChevronLeft />
              </motion.button>
              <div className="absolute bottom-12 left-12 text-white max-w-4xl px-6">
                <span className="bg-emerald-500 px-4 py-1.5 rounded-lg text-[10px] mb-6 inline-block shadow-lg font-black uppercase tracking-widest">
                  {selectedArticle.category || "FIELD REPORT"}
                </span>
                <h1 className="text-4xl md:text-6xl tracking-tighter leading-tight mb-4 drop-shadow-xl font-black uppercase">
                  {selectedArticle.headline || selectedArticle.name}
                </h1>
              </div>
            </div>
            <div className="max-w-3xl mx-auto p-8 md:p-12 pb-32">
              <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed mb-12 normal-case readable-text">
                {selectedArticle.content || selectedArticle.bio}
              </p>
              <div className="border-t border-slate-100 pt-12">
                <h4 className="text-xl font-black uppercase mb-8 flex items-center gap-3">
                  <MessageCircle className="w-6 h-6" /> Intel Chatter
                </h4>
                <div className="flex gap-4">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Submit update..."
                    className="flex-1 bg-slate-50 p-6 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-emerald-500/20 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { if (!commentInput) return; addKarma(5); setCommentInput(""); }}
                    className="bg-slate-950 text-white p-6 rounded-2xl shadow-xl active:scale-95"
                  >
                    <Send />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POST MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[4rem] p-8 md:p-16 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar border-[12px] border-white text-slate-950"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">File Report 📂</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-3xl transition-all"><X className="w-8 h-8" /></button>
              </div>
              <div className="space-y-10">
                <div className="h-80 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center relative group overflow-hidden">
                  {postForm.image ? (
                    <img src={postForm.image} className="w-full h-full object-cover" alt="preview" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="text-slate-300 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                      <p className="text-[10px] text-slate-400 tracking-[0.4em] font-black uppercase">Capture Metadata</p>
                    </div>
                  )}
                  <input type="file" onChange={async (e) => {
                    const b64 = await convertToBase64(e.target.files[0]);
                    setPostForm({ ...postForm, image: b64 });
                  }} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div className="space-y-4">
                  <input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="Title / Name" className="w-full p-7 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 text-slate-900 font-bold rounded-[2rem] outline-none transition-all shadow-sm" />
                  <textarea value={postForm.desc} onChange={(e) => setPostForm({ ...postForm, desc: e.target.value })} rows="4" placeholder="Description..." className="w-full p-7 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 text-slate-900 font-bold rounded-[2rem] outline-none transition-all shadow-sm" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePostSubmit}
                  className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-emerald-600 transition-all mt-4"
                >
                  Transmit Intel 📡
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="max-w-4xl mx-auto space-y-12 text-center font-bold py-12 px-6">
      <AnimatePresence mode="wait">
        {!image ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="h-[550px] border-[8px] border-dashed border-slate-950 rounded-[4rem] flex flex-col items-center justify-center relative hover:bg-emerald-50 transition-all cursor-pointer shadow-inner bg-white group"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <ImageIcon className="w-16 h-16 text-slate-950 mb-6" />
            </motion.div>
            <p className="text-[12px] tracking-[0.6em] text-slate-950 font-black uppercase">Upload Medical Scan 📸</p>
            <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="h-[550px] rounded-[4rem] overflow-hidden relative shadow-2xl border-[12px] border-white bg-slate-950">
              <img src={image} className="w-full h-full object-cover" alt="target" />
              <AnimatePresence>
                {analyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl flex flex-col items-center justify-center text-emerald-500"
                  >
                    <RefreshCw className="w-16 h-16 animate-spin mb-8" />
                    <p className="text-xl tracking-[0.8em] font-black uppercase animate-pulse">Bio-Diagnostics...</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="w-full h-full animate-scan shadow-[0_0_20px_4px_#10b981]"></div>
              </div>
            </div>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 p-12 md:p-20 rounded-[4rem] text-white text-left border-[8px] border-white/5 relative shadow-2xl"
              >
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-emerald-500 text-[10px] tracking-[0.3em] font-black uppercase">Diagnostic Result</span>
                  </div>
                  <h4 className="text-4xl md:text-5xl tracking-tighter text-white font-black leading-tight normal-case">{result.condition.toLowerCase().replace(/^\w/, c => c.toUpperCase())}</h4>
                </div>

                <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-8 mb-8 gap-4">
                  <p className="text-slate-400 text-lg tracking-wide font-medium">Subject: <span className="text-white font-bold">{result.breed}</span></p>
                  <span className="text-emerald-500 text-[11px] font-black border border-emerald-500/30 px-6 py-2 rounded-full bg-emerald-500/5">{result.accuracy}</span>
                </div>

                <div className="bg-white/5 p-8 md:p-12 rounded-[3rem] border border-white/5 shadow-inner">
                  <div className="flex items-center gap-4 mb-6">
                    <Stethoscope className="text-emerald-400 w-8 h-8" />
                    <p className="text-emerald-400 text-xs tracking-[0.4em] font-black uppercase">TREATMENT PROTOCOL:</p>
                  </div>
                  <p className="text-slate-200 normal-case font-medium text-xl md:text-2xl leading-relaxed readable-text">{result.advice}</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setImage(null); setResult(null); }}
                  className="w-full mt-10 py-8 bg-emerald-500 text-white rounded-[2.5rem] tracking-[0.4em] font-black uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-400 transition-all"
                >
                  <RotateCcw className="w-5 h-5" /> New Scan
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};