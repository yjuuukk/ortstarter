import React, { useState, useEffect, useMemo, createContext, useContext, useCallback } from 'react';
import { Search, BookOpen, Library, Check, CheckCircle, Bookmark, Edit3, Sparkles, HelpCircle, Palette, MessageCircle, Loader2, ArrowLeft, Info, ExternalLink, LogIn, LogOut, Target, Lightbulb, BookMarked, Languages, GraduationCap, Book } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

// -----------------------------------------------------------------------------
// 1. Config & Data
// -----------------------------------------------------------------------------

// 사용자님의 Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDltY2mcI7curalpHysu9-BNvLZl_8RxzY",
  authDomain: "ort-manager.firebaseapp.com",
  projectId: "ort-manager",
  storageBucket: "ort-manager.firebasestorage.app",
  messagingSenderId: "780818944808",
  appId: "1:780818944808:web:2eecfcbd9403f4aac6f61d",
  measurementId: "G-L13GJL3QXG"
};

let app, auth, db;
try {
  if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase Init Error:", error);
}

const appId = 'ort-manager-v2';
const apiKey = "AIzaSyBEtyATx-gGtASzxauCo0bPB_ss3rcMBSM";

// Colors & Data
const LEVEL_COLORS = {
  "1+": { bg: "bg-purple-500", text: "text-purple-700", lightBg: "bg-purple-50" },
  "2":  { bg: "bg-green-600",  text: "text-green-700",  lightBg: "bg-green-50" },
  "3":  { bg: "bg-blue-500",   text: "text-blue-700",   lightBg: "bg-blue-50" },
  "4":  { bg: "bg-red-500",    text: "text-red-700",    lightBg: "bg-red-50" },
  "5":  { bg: "bg-yellow-400", text: "text-yellow-800", lightBg: "bg-yellow-50" },
  "6":  { bg: "bg-orange-500", text: "text-orange-700", lightBg: "bg-orange-50" },
  "7":  { bg: "bg-lime-500",   text: "text-lime-800",   lightBg: "bg-lime-50" },
  "8":  { bg: "bg-[#795548]",  text: "text-[#5D4037]",  lightBg: "bg-[#EFEBE9]" },
  "9":  { bg: "bg-[#00BCD4]",  text: "text-[#006064]",  lightBg: "bg-cyan-50" },
};

const BAND_COLORS = {
  "Pink": "bg-pink-500", "Red": "bg-red-500", "Yellow": "bg-yellow-400",
  "Light Blue": "bg-sky-400", "Green": "bg-green-500", "Orange": "bg-orange-500",
  "Turquoise": "bg-teal-400", "Purple": "bg-purple-500", "Gold": "bg-amber-400",
};

const stageResources = [
  { stage: "Stage 1", levels: "Level 1, 1+", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-1/", color: "bg-purple-100 text-purple-700" },
  { stage: "Stage 2", levels: "Level 2, 3", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-2/", color: "bg-green-100 text-green-700" },
  { stage: "Stage 3", levels: "Level 4, 5", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-3/", color: "bg-blue-100 text-blue-700" },
  { stage: "Stage 4", levels: "Level 6, 7", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-4/", color: "bg-orange-100 text-orange-700" },
  { stage: "Stage 5", levels: "Level 8, 9", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-5/", color: "bg-amber-100 text-amber-700" },
];

const externalResources = [
  { title: "Oxford Owl (Official)", desc: "영국 본사 공식 사이트", link: "https://www.oxfordowl.co.uk/", icon: <BookOpen className="w-6 h-6 text-indigo-600" />, bgColor: "bg-indigo-50", borderColor: "border-indigo-100", textColor: "text-indigo-700" },
  { title: "ORT Korea (인북스)", desc: "한국 공식 수입사", link: "https://www.ortkorea.com/", icon: <Languages className="w-6 h-6 text-rose-600" />, bgColor: "bg-rose-50", borderColor: "border-rose-100", textColor: "text-rose-700" },
  { title: "Pinterest Ideas", desc: "독후 활동 아이디어", link: "https://www.pinterest.co.kr/", icon: <Palette className="w-6 h-6 text-red-600" />, bgColor: "bg-red-50", borderColor: "border-red-100", textColor: "text-red-700" }
];

const rawOrtData = [
  { level: "1+", rwoStage: "Stage 1", age: "4-5", bookBand: "Pink", description: "간단한 파닉스로 단어를 읽기 시작합니다.", whyUseful: "파닉스 기초 단계입니다.", recommendation: "알파벳에 익숙해진 아이에게 적절해요.", books: ["Hide and seek", "Go away, cat", "The box of treasure", "Can you see me?", "At the park", "What a mess!", "Hop! Hop! Pop!", "The picture book man", "I can", "Cats", "Reds and blues", "Go on, mum", "Chip's robot", "Good dog", "Fancy dress", "Who did that?", "Catkin the kitten", "In the tent", "The dog tag", "Pop!", "Big feet", "Look after me", "Floppy's bone", "The ice cream", "Good old mum", "Goal!", "In the trolley", "The bag in the bin", "Cat in a bag", "Mud!", "Look at me", "Presents for dad", "Hook a duck", "The mud pie", "The headache", "The journey", "The caterpillar", "Stuck!", "It!", "Big, bad bug", "Go away, Floppy", "Top dog", "One wheel", "See me skip", "The pet shop", "Making faces", "The enormous crab", "The big red bus", "The red hen", "Hats", "Kipper's diary", "What dogs like", "The sandcastle", "What a din", "Push!", "Shopping", "The trampoline", "The sock", "Tip top", "A big mess"] },
  { level: "2", rwoStage: "Stage 2", age: "4-5", bookBand: "Red", description: "새로운 단어를 추론하며 읽기 시작합니다.", whyUseful: "읽기 자신감을 키우는 시기입니다.", recommendation: "단어 조합 연습이 필요한 아이에게 좋아요.", books: ["The Go-kart", "The hole in the sand", "The baby-sitter", "Biff's aeroplane", "Creepy-crawly!", "The little dragon", "Fire!", "A big bunch of flowers", "The fizz-buzz", "The zip", "A new dog", "In a bit", "Floppy's bath", "The chase", "Hey presto!", "New trees", "The Gull's picnic", "Got a job?", "Shops", "Posh shops", "New trainers", "Poor Floppy", "Kipper's ballon", "Floppy the hero", "Monkey tricks", "The band", "Out!", "Catch it!", "Such a fuss", "Jack", "The dream", "A present for mum", "Kipper's birthday", "The foggy day", "Naughty children", "The lost puppy", "Red noses", "Gorilla on the run!", "Less Mess", "Bang the gong", "The toy's party", "Put it back", "Spots!", "Kipper's laces", "A sinking feeling", "Up and down", "The ball pit", "The new gingerbread man", "The sing song", "Quiz", "What a bad dog!", "The big eff", "Ther water fight", "The wobbly tooth", "It's the weather", "What is it?", "The odd egg", "Hiccups", "The backpack", "A Robin's Eggs"] },
  { level: "3", rwoStage: "Stage 2", age: "5-6", bookBand: "Yellow", description: "이중자음(digraph)을 포함한 단어를 읽습니다.", whyUseful: "자립적 읽기 능력을 키우는 단계입니다.", recommendation: "다양한 단어 패턴에 도전하는 아이에게 알맞습니다.", books: ["The duck race", "A cat in the tree", "At the seaside", "At the pool", "Dragons!", "Mister Haggis", "The moon jet", "Leek hotpot", "The ice rink", "Nobody wanted to play", "The jumble sale", "The barbecue", "Helicopter rescue", "Green sheets", "Wet feet", "Queen's maid", "The mud bath", "On the sand", "Kipper the clown", "Book week", "Monkeys on the car", "Road burner", "Rain again", "Toads in the road", "Pond dipping", "The rope swing", "Kipper's idea", "Bull's-eye!", "The enormous picture", "King of the castle", "The red coat", "Chairs in the air", "Sniff!", "The egg hunt", "The snowman", "The carnival", "Floppy and the puppets", "A walk in the sun", "Quick, quick", "A bark in the night", "The steel band", "By the stream", "Strawberry jam", "The cold day", "Gran and the Go-carts", "Bug hunt", "The rook and the king", "Silver foil rocket"] },
  { level: "4", rwoStage: "Stage 3", age: "5-6", bookBand: "Light Blue", description: "파닉스 지식을 빠르게 적용해 단어를 해독합니다.", whyUseful: "문장 구조가 다양해집니다.", recommendation: "단순한 이야기에서 자신의 생각을 말하기 시작하는 아이에게 적합합니다.", books: ["House for sale", "Nobody got wet", "The dragon dance", "Dad's jacket", "The stars", "Top of the mountain", "Seasick", "The crab dragon", "The new house", "Poor old mum!", "Everyone got wet", "An important case", "Long legs", "The minibeast zoo", "Egg fried rice", "No tricks Gran!", "Come in!", "The ballon", "The flying elephant", "Look smart", "The seal pup", "Finger snapper", "Craig saves the day", "The lost chimp", "The secret room", "The camcorder", "Swap!", "Stuck in the mud", "Floppy and the skateboard", "The good luck stone", "The knight who was afraid", "Green planet kids", "The play", "The weather vane", "The scarf", "The den", "Gran's new glasses", "Kid rocket", "Joe", "Pinting the loft", "The storm", "The wedding", "Wet paint", "Tug of war", "The birthday candle", "The bowling trip", "Dolphin rescue", "Crunch!"] },
  { level: "5", rwoStage: "Stage 3", age: "5-6", bookBand: "Green", description: "같은 소리라도 여러 철자법을 배웁니다.", whyUseful: "어휘 확장과 소리-철자 규칙을 이해합니다.", recommendation: "새로운 단어에 도전하며 어휘력을 키우는 아이에게 적합합니다.", books: ["The magic key", "It's not fair", "Camping adventure", "The adventure park", "The orchid thief", "Crab island", "Gran's new blue shoes", "The gale", "Pirate adventure", "A monster mistake", "Mum to the rescue", "Dad's run", "Rats!", "Queen of the waves", "Ice city", "Please no not sneeze", "The dragon tree", "The great race", "New classroom", "Drawing adventure", "Bush fire!", "In the dark", "Save pudding wood", "Rowing boats", "Gran", "The whatsit", "Noah's ark adventure", "Kipper and the trolls", "Highland games", "Gotcha!", "A little baby boy", "The missing crystal", "Castle adventure", "Underground adventure", "Scarecrows", "Safari adventure", "Bessie's flying circus", "The frog's tale", "Uncle max", "Mr Scroop's school", "Village in the snow", "Vanishing cream", "The new baby", "Sleeping beauty", "A pet called cucumber", "Where next?", "The playground", "The haunted house"] }
];

const getAllBooks = () => {
  let idCounter = 1;
  return rawOrtData.flatMap(g => g.books.map(title => ({
    id: idCounter++,
    title,
    level: g.level,
    ...(LEVEL_COLORS[g.level] || { bg: 'bg-gray-500', text: 'text-gray-700', lightBg: 'bg-gray-50' }),
    bookBand: g.bookBand,
    bandColor: BAND_COLORS[g.bookBand] || 'bg-gray-400',
    rwoStage: g.rwoStage,
    age: g.age
  })));
};

const allBooksData = getAllBooks();

// -----------------------------------------------------------------------------
// 2. Contexts (State Management)
// -----------------------------------------------------------------------------
const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ readBooks: [], wishlist: [], readingLogs: {} });
  
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
        await signInAnonymously(auth).catch((e) => console.log("Anon auth failed", e)); 
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user || !db) {
        setUserData({ readBooks: [], wishlist: [], readingLogs: {} });
        return;
    }
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'profile');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setUserData(snap.data());
      else setDoc(docRef, { readBooks: [], wishlist: [], readingLogs: {} }, { merge: true });
    });
    return () => unsubscribe();
  }, [user]);

  const login = () => auth && signInWithPopup(auth, new GoogleAuthProvider()).catch(console.error);
  const logout = () => auth && signOut(auth);

  const toggleRead = async (bookId) => {
    const isRead = userData.readBooks?.includes(bookId);
    setUserData(prev => ({ ...prev, readBooks: isRead ? prev.readBooks.filter(id => id !== bookId) : [...(prev.readBooks || []), bookId] }));
    if (user && db) {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'profile');
      try {
        await updateDoc(docRef, { readBooks: isRead ? arrayRemove(bookId) : arrayUnion(bookId) });
        if (!isRead && !userData.readingLogs?.[bookId]) {
          const today = new Date().toISOString().split('T')[0];
          await updateDoc(docRef, { [`readingLogs.${bookId}`]: { date: today, memo: "" } });
        }
      } catch (e) { console.error(e); }
    }
  };

  const toggleWish = async (bookId) => {
    const isWish = userData.wishlist?.includes(bookId);
    setUserData(prev => ({ ...prev, wishlist: isWish ? prev.wishlist.filter(id => id !== bookId) : [...(prev.wishlist || []), bookId] }));
    if (user && db) {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'profile');
      try { await updateDoc(docRef, { wishlist: isWish ? arrayRemove(bookId) : arrayUnion(bookId) }); } catch (e) { console.error(e); }
    }
  };

  const updateLog = async (bookId, field, value) => {
    setUserData(prev => ({ ...prev, readingLogs: { ...prev.readingLogs, [bookId]: { ...prev.readingLogs?.[bookId], [field]: value } } }));
    if (user && db) {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'profile');
      try { await updateDoc(docRef, { [`readingLogs.${bookId}.${field}`]: value }); } catch (e) { console.error(e); }
    }
  };

  return (
    <UserContext.Provider value={{ user, userData, login, logout, toggleRead, toggleWish, updateLog }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const generateContent = useCallback(async (prompt) => {
    setLoading(true); setResponse(null); setError(null);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      setResponse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) { setError("AI 연결 실패"); } 
    finally { setLoading(false); }
  }, []);
  return { loading, response, error, generateContent, setResponse };
};

// -----------------------------------------------------------------------------
// 4. UI Components
// -----------------------------------------------------------------------------

const Header = ({ user, activeTab, setActiveTab, onSignIn, onSignOut, readCount }) => (
  <header className="bg-white sticky top-0 z-10 shadow-sm w-full">
    <div className="w-full max-w-md mx-auto pt-4 px-4 pb-2">
      <div className="flex justify-between items-center mb-4">
        <div><h1 className="text-xl font-bold text-gray-900">ORT Mom's Manager</h1>{user && <p className="text-xs text-gray-500 mt-0.5">안녕하세요, {user.displayName || 'Mom'}님!</p>}</div>
        <div className="flex items-center gap-2">
          {!user ? <button onClick={onSignIn} className="flex items-center bg-gray-900 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-800 transition"><LogIn className="w-3 h-3 mr-1" /> 로그인</button>
                 : <div className="flex gap-2 text-xs font-medium items-center"><span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-100">읽음 {readCount}</span><button onClick={onSignOut} className="p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><LogOut className="w-3.5 h-3.5" /></button></div>}
        </div>
      </div>
      <div className="flex border-b border-gray-200 mb-2">
        {['library', 'levelInfo', 'guide'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}>
            {tab === 'library' ? '내 서재' : tab === 'levelInfo' ? '레벨 가이드' : '자료 창고'}
          </button>
        ))}
      </div>
    </div>
  </header>
);

const BookDetail = ({ book, isRead, isWish, log, onRead, onWish, onBack, onUpdateLog }) => {
  const { generateContent, loading, response, setResponse, error } = useGemini();

  const handleAi = (type) => {
    setResponse(null);
    const prompt = type === 'quiz' 
      ? `Create 3 simple multiple-choice questions (A, B, C) for a 6-year-old child who read "${book.title}" (ORT Level ${book.level}). Simple English, provide answer, end with Korean encouragement.`
      : type === 'activity' 
      ? `Suggest one fun post-reading activity for "${book.title}" (ORT Level ${book.level}). Target: Korean mom & child. Output in Korean.`
      : `Suggest 3 conversation starters for "${book.title}". English question + Korean translation.`;
    generateContent(prompt);
  };

  const openSearch = (platform) => {
    const q = platform === 'google' ? `${book.title} worksheet free ORT` : `${book.title} ORT read aloud`;
    window.open(platform === 'google' ? `https://www.google.com/search?q=${encodeURIComponent(q)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe w-full overflow-x-hidden">
      <div className="bg-white shadow-sm sticky top-0 z-20 px-4 h-14 flex items-center">
        <button onClick={() => { setResponse(null); onBack(); }} className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
        <h1 className="text-lg font-bold truncate flex-1">{book.title}</h1>
      </div>
      <div className="w-full max-w-md mx-auto p-4 space-y-6 pb-20">
        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${book.bg}`} />
          <div className={`w-28 h-36 ${book.lightBg} rounded-lg mb-4 flex items-center justify-center shadow-inner relative border border-gray-100`}>
            <BookOpen className={`w-10 h-10 ${book.text} opacity-50`} />
            {isRead && <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-md ring-2 ring-white"><Check className="w-4 h-4" /></div>}
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">{book.title}</h2>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold text-white ${book.bg}`}>Level {book.level}</span>
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold text-white ${book.bandColor}`}>{book.bookBand} Band</span>
          </div>
          <div className="flex w-full gap-3">
            <button onClick={onWish} className={`flex-1 py-3.5 rounded-xl font-medium transition flex items-center justify-center border ${isWish ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}><Library className={`w-5 h-5 mr-2 ${isWish ? "fill-purple-700" : ""}`} />{isWish ? "찜 함" : "찜하기"}</button>
            <button onClick={onRead} className={`flex-1 py-3.5 rounded-xl font-medium transition flex items-center justify-center border ${isRead ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-900 text-white border-transparent hover:bg-gray-800"}`}><CheckCircle className={`w-5 h-5 mr-2 ${isRead ? "fill-green-700" : ""}`} />{isRead ? "완료" : "읽음"}</button>
          </div>
        </div>

        {isRead && (
          <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-green-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Edit3 className="w-5 h-5 text-green-600 mr-2" />독서 기록</h3>
            <div className="space-y-4">
              <input type="date" value={log.date} onChange={(e) => onUpdateLog('date', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 px-3 outline-none" />
              <textarea value={log.memo} onChange={(e) => onUpdateLog('memo', e.target.value)} placeholder="메모를 남겨주세요" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 h-24 resize-none outline-none" />
            </div>
          </div>
        )}

        <div className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-1 border border-indigo-100">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5">
            <div className="flex items-center mb-4"><Sparkles className="w-6 h-6 text-indigo-600 mr-2" /><h3 className="font-bold text-indigo-900 text-lg">AI 선생님</h3></div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => handleAi('quiz')} disabled={loading} className="p-3 rounded-xl bg-white border hover:bg-indigo-50 flex flex-col items-center"><HelpCircle className="w-6 h-6 mb-1 text-orange-500"/><span className="text-xs font-bold">퀴즈</span></button>
              <button onClick={() => handleAi('activity')} disabled={loading} className="p-3 rounded-xl bg-white border hover:bg-indigo-50 flex flex-col items-center"><Palette className="w-6 h-6 mb-1 text-pink-500"/><span className="text-xs font-bold">활동</span></button>
              <button onClick={() => handleAi('talk')} disabled={loading} className="p-3 rounded-xl bg-white border hover:bg-indigo-50 flex flex-col items-center"><MessageCircle className="w-6 h-6 mb-1 text-green-500"/><span className="text-xs font-bold">대화</span></button>
            </div>
            {response && <div className="bg-white p-4 rounded-xl border border-indigo-50 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{response}</div>}
            {loading && <div className="text-center py-4"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div>}
            {error && <div className="text-center py-4 text-red-500 text-sm">{error}</div>}
          </div>
        </div>
        
        <button onClick={() => openSearch('google')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center hover:bg-gray-50"><Search className="w-5 h-5 text-blue-500 mr-3" /><span className="text-base font-medium text-gray-700">구글 워크시트 검색</span></button>
      </div>
    </div>
  );
};

const BookCard = ({ book, isRead, isWish, log, onRead, onWish, onClick }) => (
  <div onClick={onClick} className={`w-full bg-white rounded-xl p-4 flex items-center shadow-sm border transition cursor-pointer active:scale-98 ${isRead ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
    <div className={`w-14 h-14 shrink-0 rounded-xl ${book.lightBg} flex flex-col items-center justify-center mr-4 border border-black/5`}>
      <span className={`text-[10px] font-bold uppercase opacity-60 ${book.text}`}>Level</span>
      <span className={`text-xl font-black ${book.text}`}>{book.level}</span>
    </div>
    <div className="flex-1 min-w-0 mr-2">
      <h3 className={`font-bold text-lg leading-tight mb-1.5 truncate ${isRead ? 'text-green-800' : 'text-gray-800'}`}>{book.title}</h3>
      <div className="flex flex-wrap gap-1.5 items-center">
        {isRead ? (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold flex items-center"><Check className="w-3 h-3 mr-1" /> 완료 {log && log.date && <span className="font-normal ml-1">({log.date.slice(5)})</span>}</span>
        ) : (
          <span className="text-xs text-gray-400 flex items-center"><div className={`w-2 h-2 rounded-full mr-1.5 ${book.bandColor}`}></div> {book.bookBand} Band</span>
        )}
        {isWish && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold flex items-center"><Bookmark className="w-3 h-3 mr-1 fill-purple-700" /> 찜</span>}
      </div>
    </div>
    <div className="flex flex-col gap-2 pl-2 border-l border-gray-100">
      <button onClick={onRead} className={`p-2 rounded-full transition ${isRead ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}><Check className="w-4 h-4" /></button>
      <button onClick={onWish} className={`p-2 rounded-full transition ${isWish ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}><Bookmark className="w-4 h-4" /></button>
    </div>
  </div>
);

const LevelGuide = () => (
  <div className="w-full space-y-6 pb-10">
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="font-bold text-xl mb-2 flex items-center"><GraduationCap className="w-6 h-6 mr-2" />내 아이 단계 찾기</h3>
        <p className="text-blue-100 text-sm mb-4">Oxford 공식 테스트로 확인해보세요.</p>
        <a href="https://home.oxfordowl.co.uk/reading/reading-schemes-oxford-levels/which-reading-level-stage/" target="_blank" rel="noreferrer" className="inline-flex items-center bg-white text-blue-600 font-bold text-sm px-5 py-2.5 rounded-full hover:bg-blue-50 transition shadow-sm">테스트 하러 가기 <ExternalLink className="w-4 h-4 ml-2" /></a>
      </div>
      <BookOpen className="absolute right-0 bottom-0 w-32 h-32 text-white opacity-10 transform translate-y-4 translate-x-4" />
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-5 py-3 border-b border-gray-100"><h3 className="font-bold text-gray-800 flex items-center"><Book className="w-4 h-4 mr-2 text-indigo-500"/> 무료 자료 (by Stage)</h3></div>
      <div className="divide-y divide-gray-100">
        {stageResources.map((res, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div><div className={`inline-flex px-2 py-0.5 rounded text-xs font-bold mb-1 ${res.color}`}>{res.stage}</div><p className="text-xs text-gray-500">Includes {res.levels}</p></div>
            <a href={res.link} target="_blank" rel="noreferrer" className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100">자료 보기 <ExternalLink className="w-3 h-3 ml-1.5" /></a>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ResourceGuide = () => (
  <div className="w-full space-y-4 pb-10">
    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
      <h3 className="font-bold text-blue-800 text-lg mb-2 flex items-center"><BookMarked className="w-5 h-5 mr-2" />엄마표 영어 자료 창고</h3>
      <p className="text-sm text-blue-700">무료 eBook, 오디오, 워크시트 등을 찾을 수 있는 알짜배기 사이트들입니다.</p>
    </div>
    {externalResources.map((res, idx) => (
      <a key={idx} href={res.link} target="_blank" rel="noreferrer" className={`block bg-white p-5 rounded-2xl shadow-sm border ${res.borderColor} hover:shadow-md transition group`}>
        <div className="flex items-start">
          <div className={`w-12 h-12 ${res.bgColor} rounded-xl flex items-center justify-center mr-4 shrink-0 group-hover:scale-110 transition`}>{res.icon}</div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-base mb-1 ${res.textColor} flex items-center`}>{res.title}<ExternalLink className="w-3 h-3 ml-2 opacity-50" /></h4>
            <p className="text-xs text-gray-600 leading-relaxed">{res.desc}</p>
          </div>
        </div>
      </a>
    ))}
  </div>
);

const App = () => {
  const { user, userData, login, logout, toggleRead, toggleWish, updateLog } = useUser();
  const [activeTab, setActiveTab] = useState("library");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  const filteredBooks = useMemo(() => {
    return allBooksData.filter(book => {
      const matchLevel = selectedLevel === "All" || book.level === selectedLevel;
      const matchSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [selectedLevel, searchQuery]);

  if (selectedBook) {
    return (
      <BookDetail 
        book={selectedBook} 
        isRead={userData.readBooks?.includes(selectedBook.id)} 
        isWish={userData.wishlist?.includes(selectedBook.id)} 
        log={userData.readingLogs?.[selectedBook.id] || { date: "", memo: "" }}
        onRead={() => toggleRead(selectedBook.id)}
        onWish={() => toggleWish(selectedBook.id)}
        onBack={() => setSelectedBook(null)}
        onUpdateLog={(field, value) => updateLog(selectedBook.id, field, value)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 overflow-x-hidden w-full">
      <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab} onSignIn={login} onSignOut={logout} readCount={userData.readBooks?.length || 0} />
      <main className="w-full max-w-md mx-auto px-4 pt-4">
        {activeTab === 'library' && (
          <>
            <div className="relative mb-3 mt-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="책 제목 검색..." className="w-full bg-gray-100 text-base rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="overflow-x-auto hide-scrollbar pb-2 w-full">
              <div className="flex space-x-2">
                <button onClick={() => setSelectedLevel("All")} className={`px-4 py-2 rounded-full text-sm font-bold border ${selectedLevel === "All" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"}`}>All</button>
                {rawOrtData.map((g) => {
                   const c = LEVEL_COLORS[g.level] || { bg: 'bg-gray-500' };
                   return <button key={g.level} onClick={() => setSelectedLevel(g.level)} className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap transition-colors ${selectedLevel === g.level ? `${c.bg} text-white border-transparent` : "bg-white text-gray-600 border-gray-200"}`}>Level {g.level}</button>
                })}
              </div>
            </div>
            <div className="space-y-3 mt-4 w-full">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} isRead={userData.readBooks?.includes(book.id)} isWish={userData.wishlist?.includes(book.id)} log={userData.readingLogs?.[book.id]} onClick={() => setSelectedBook(book)} onRead={(e) => { e.stopPropagation(); toggleRead(book.id); }} onWish={(e) => { e.stopPropagation(); toggleWish(book.id); }} />
              ))}
            </div>
          </>
        )}
        {activeTab === 'levelInfo' && <LevelGuide />}
        {activeTab === 'guide' && <ResourceGuide />}
      </main>
    </div>
  );
};

// -----------------------------------------------------------------------------
// [중요!] 데이터를 연결하는 마지막 플러그 (Root Component)
// 이 부분이 있어야 화면이 나옵니다!
// -----------------------------------------------------------------------------
const Root = () => (
  <UserProvider>
    <App />
  </UserProvider>
);

export default Root;