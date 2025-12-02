/**
 * ORT Mom's Manager - Refactored & Optimized Version
 * * [구조 개선 사항]
 * 1. UserContext: 로그인 및 사용자 데이터(읽음, 찜, 로그) 전역 관리
 * 2. useGemini: AI 호출 로직을 커스텀 훅으로 분리
 * 3. Components: Header, BookCard, LevelGuide 등 UI 요소 모듈화
 * 4. Data: Level 1+ ~ 9 전체 데이터 내장
 */

 import React, { useState, useEffect, useMemo, createContext, useContext, useCallback } from 'react';
 import { Search, BookOpen, Library, Check, CheckCircle, Bookmark, Edit3, Save, Sparkles, HelpCircle, Palette, MessageCircle, Loader2, ArrowLeft, Info, ExternalLink, LogIn, LogOut, Target, Lightbulb, BookMarked, Languages, GraduationCap, Book } from 'lucide-react';
 import { initializeApp } from 'firebase/app';
 import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
 import { getFirestore, doc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
 
 // -----------------------------------------------------------------------------
 // 1. Config & Data (설정 및 데이터)
 // -----------------------------------------------------------------------------
 
 // Firebase 설정 (환경 변수 또는 직접 입력)
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
 
 const appId = typeof __app_id !== 'undefined' ? __app_id : 'ort-manager-v2';
 const apiKey = "AIzaSyBEtyATx-gGtASzxauCo0bPB_ss3rcMBSM"; // System Injected
 
 // Level & Band Colors
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
 
 // Resources
 const stageResources = [
   { stage: "Stage 1", levels: "Level 1, 1+", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-1/", color: "bg-purple-100 text-purple-700" },
   { stage: "Stage 2", levels: "Level 2, 3", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-2/", color: "bg-green-100 text-green-700" },
   { stage: "Stage 3", levels: "Level 4, 5", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-3/", color: "bg-blue-100 text-blue-700" },
   { stage: "Stage 4", levels: "Level 6, 7", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-4/", color: "bg-orange-100 text-orange-700" },
   { stage: "Stage 5", levels: "Level 8, 9", link: "https://home.oxfordowl.co.uk/bookshop/read-with-oxford/read-with-oxford-stage-5/", color: "bg-amber-100 text-amber-700" },
 ];
 
 const externalResources = [
   { title: "Oxford Owl (Official)", desc: "영국 본사 공식 사이트. 무료 eBook 및 오디오북 제공", link: "https://www.oxfordowl.co.uk/library-page?utm_source=chatgpt.com", icon: <BookOpen className="w-6 h-6 text-indigo-600" />, bgColor: "bg-indigo-50", borderColor: "border-indigo-100", textColor: "text-indigo-700" },
   { title: "ORT Korea (인북스)", desc: "한국 공식 수입사. 한글 해석본, 티칭 가이드 제공", link: "https://www.ortkorea.com/shop/contents.php?viewmode=teachingsupport&viewtype=ort", icon: <Languages className="w-6 h-6 text-rose-600" />, bgColor: "bg-rose-50", borderColor: "border-rose-100", textColor: "text-rose-700" },
   { title: "Teachers Pay Teachers", desc: "전 세계 선생님들의 자료 공유 사이트 (Free 필터 활용)", link: "https://www.teacherspayteachers.com/", icon: <GraduationCap className="w-6 h-6 text-orange-600" />, bgColor: "bg-orange-50", borderColor: "border-orange-100", textColor: "text-orange-700" },
   { title: "Pinterest", desc: "독후 활동(Craft, Game) 아이디어 이미지 검색", link: "https://www.pinterest.co.kr/", icon: <Palette className="w-6 h-6 text-red-600" />, bgColor: "bg-red-50", borderColor: "border-red-100", textColor: "text-red-700" }
 ];
 
 // Main ORT Data (Flattened for easier usage)
 const rawOrtData = [
   { level: "1+", rwoStage: "Stage 1", age: "4-5", bookBand: "Pink", description: "간단한 파닉스로 'sat', 'pin'같이 예측 가능한 단어를 읽기 시작합니다. 그림이 의미를 이해하는 데 큰 도움을 줍니다.", whyUseful: "파닉스(글자-소리 연결) 연습과 단어 인식 능력을 기르는 기초 단계입니다.", recommendation: "알파벳에 익숙해졌고, 기본 단어를 소리 내어 읽는 연습이 필요한 아이에게 적절해요.", books: ["Hide and seek", "Go away, cat", "The box of treasure", "Can you see me?", "At the park", "What a mess!", "Hop! Hop! Pop!", "The picture book man", "I can", "Cats", "Reds and blues", "Go on, mum", "Chip's robot", "Good dog", "Fancy dress", "Who did that?", "Catkin the kitten", "In the tent", "The dog tag", "Pop!", "Big feet", "Look after me", "Floppy's bone", "The ice cream", "Good old mum", "Goal!", "In the trolley", "The bag in the bin", "Cat in a bag", "Mud!", "Look at me", "Presents for dad", "Hook a duck", "The mud pie", "The headache", "The journey", "The caterpillar", "Stuck!", "It!", "Big, bad bug", "Go away, Floppy", "Top dog", "One wheel", "See me skip", "The pet shop", "Making faces", "The enormous crab", "The big red bus", "The red hen", "Hats", "Kipper's diary", "What dogs like", "The sandcastle", "What a din", "Push!", "Shopping", "The trampoline", "The sock", "Tip top", "A big mess"] },
   { level: "2", rwoStage: "Stage 2", age: "4-5", bookBand: "Red", description: "글자와 소리 지식을 활용해 새로운 단어를 추론하지만, 아직은 도움을 받을 수 있습니다. 문장은 짧고 간단하며, 그림이 이야기 이해를 도와줍니다.", whyUseful: "읽기 자신감을 키우는 시기입니다. 아이가 “이 단어 이렇게 읽을 수 있구나”를 경험하게 됩니다.", recommendation: "단어를 조합해서 읽는 것을 연습하고, 간단한 문장으로 실제 읽기를 시작한 아이에게 좋아요.", books: ["The Go-kart", "The hole in the sand", "The baby-sitter", "Biff's aeroplane", "Creepy-crawly!", "The little dragon", "Fire!", "A big bunch of flowers", "The fizz-buzz", "The zip", "A new dog", "In a bit", "Floppy's bath", "The chase", "Hey presto!", "New trees", "The Gull's picnic", "Got a job?", "Shops", "Posh shops", "New trainers", "Poor Floppy", "Kipper's ballon", "Floppy the hero", "Monkey tricks", "The band", "Out!", "Catch it!", "Such a fuss", "Jack", "The dream", "A present for mum", "Kipper's birthday", "The foggy day", "Naughty children", "The lost puppy", "Red noses", "Gorilla on the run!", "Less Mess", "Bang the gong", "The toy's party", "Put it back", "Spots!", "Kipper's laces", "A sinking feeling", "Up and down", "The ball pit", "The new gingerbread man", "The sing song", "Quiz", "What a bad dog!", "The big eff", "Ther water fight", "The wobbly tooth", "It's the weather", "What is it?", "The odd egg", "Hiccups", "The backpack", "A Robin's Eggs"] },
   { level: "3", rwoStage: "Stage 2", age: "5-6", bookBand: "Yellow", description: "“ee”, “oa”, “ch”, “th” 같은 일반적인 이중자음(digraph)을 포함한 단어를 파닉스로 읽어 나갑니다. 익숙하지 않은 단어도 파닉스 지식을 통해 풀어봅니다.", whyUseful: "파닉스를 통한 자립적 읽기 능력을 키우는 중간 단계입니다.", recommendation: "파닉스로 단어를 유추하며 읽는 연습을 지속하고, 더 다양한 단어 패턴을 도전하고자 하는 아이에게 알맞습니다.", books: ["The duck race", "A cat in the tree", "At the seaside", "At the pool", "Dragons!", "Mister Haggis", "The moon jet", "Leek hotpot", "The ice rink", "Nobody wanted to play", "The jumble sale", "The barbecue", "Helicopter rescue", "Green sheets", "Wet feet", "Queen's maid", "The mud bath", "On the sand", "Kipper the clown", "Book week", "Monkeys on the car", "Road burner", "Rain again", "Toads in the road", "Pond dipping", "The rope swing", "Kipper's idea", "Bull's-eye!", "The enormous picture", "King of the castle", "The red coat", "Chairs in the air", "Sniff!", "The egg hunt", "The snowman", "The carnival", "Floppy and the puppets", "A walk in the sun", "Quick, quick", "A bark in the night", "The steel band", "By the stream", "Strawberry jam", "The cold day", "Gran and the Go-carts", "Bug hunt", "The rook and the king", "Silver foil rocket"] },
   { level: "4", rwoStage: "Stage 3", age: "5-6", bookBand: "Light Blue", description: "파닉스 지식을 빠르게 적용해 단어를 해독하고, “said”, “some”, “what” 같은 시각으로 익숙해지는 단어도 인식합니다.", whyUseful: "문장 구조가 조금 더 다양해지고, 아이가 이야기나 비논픽션 텍스트에 대한 의견을 말하기 시작할 수 있습니다.", recommendation: "읽는 속도가 빨라지고, 단순한 이야기에서 자신의 생각을 말하거나 질문을 던지기 시작하는 아이에게 적합합니다.", books: ["House for sale", "Nobody got wet", "The dragon dance", "Dad's jacket", "The stars", "Top of the mountain", "Seasick", "The crab dragon", "The new house", "Poor old mum!", "Everyone got wet", "An important case", "Long legs", "The minibeast zoo", "Egg fried rice", "No tricks Gran!", "Come in!", "The ballon", "The flying elephant", "Look smart", "The seal pup", "Finger snapper", "Craig saves the day", "The lost chimp", "The secret room", "The camcorder", "Swap!", "Stuck in the mud", "Floppy and the skateboard", "The good luck stone", "The knight who was afraid", "Green planet kids", "The play", "The weather vane", "The scarf", "The den", "Gran's new glasses", "Kid rocket", "Joe", "Pinting the loft", "The storm", "The wedding", "Wet paint", "Tug of war", "The birthday candle", "The bowling trip", "Dolphin rescue", "Crunch!"] },
   { level: "5", rwoStage: "Stage 3", age: "5-6", bookBand: "Green", description: "같은 소리라도 여러 철자법(예: “ou”가 “ow” 또는 “oo”처럼 발음되는 경우)을 배우고, “didn’t”, “wasn’t”처럼 아포스트로피가 있는 단어도 등장합니다.", whyUseful: "어휘 확장과 소리-철자 규칙에 대한 이해를 넓히는 중요한 전환점입니다.", recommendation: "단어의 다양한 철자 규칙에 흥미를 보이고, 새로운 단어에 도전하며 어휘력을 키우고자 하는 아이에게 적합합니다.", books: ["The magic key", "It's not fair", "Camping adventure", "The adventure park", "The orchid thief", "Crab island", "Gran's new blue shoes", "The gale", "Pirate adventure", "A monster mistake", "Mum to the rescue", "Dad's run", "Rats!", "Queen of the waves", "Ice city", "Please no not sneeze", "The dragon tree", "The great race", "New classroom", "Drawing adventure", "Bush fire!", "In the dark", "Save pudding wood", "Rowing boats", "Gran", "The whatsit", "Noah's ark adventure", "Kipper and the trolls", "Highland games", "Gotcha!", "A little baby boy", "The missing crystal", "Castle adventure", "Underground adventure", "Scarecrows", "Safari adventure", "Bessie's flying circus", "The frog's tale", "Uncle max", "Mr Scroop's school", "Village in the snow", "Vanishing cream", "The new baby", "Sleeping beauty", "A pet called cucumber", "Where next?", "The playground", "The haunted house"] },
   { level: "6", rwoStage: "Stage 4", age: "6-7", bookBand: "Orange", description: "이야기 구조가 더 길고 복잡해지고, 아이는 읽는 도중 “이 문장이 말이 안 된다”고 스스로 깨달아 고쳐 읽기도 합니다.", whyUseful: "독립적인 읽기와 자기 교정(self-monitoring) 능력이 성장하는 시기입니다.", recommendation: "스스로 읽으면서 의미를 파악하고, 읽는 내용을 점검하며 고치는 연습이 가능한 아이에게 좋습니다.", books: ["In the garden", "A fright in the night", "Paris adventure", "The castle garden", "kipper and the giant", "The go-kart race", "Homework!", "Top score", "The outing", "The laughing princess", "Olympic adventure", "Mum's birthday surprise", "Land of the dinosaurs", "Rotten apples", "Ship in trouble", "Arare pair of bears", "Robin hood", "The shiny key", "The stolen crown", "Change gear! Steer!", "The treasure chest", "Christmas Adventure", "The stolen crown", "Uncle max and the treasure"] },
   { level: "7", rwoStage: "Stage 4", age: "6-7", bookBand: "Turquoise", description: "대부분의 아이가 소리 내어 읽는 데 유창해지고, 텍스트 안에서 질문을 찾아 답할 수 있습니다.", whyUseful: "읽기 유창성과 이해 능력이 한 단계 올라가는 시점입니다.", recommendation: "긴 단어나 복잡한 소리 체계에 도전할 준비가 된 아이, 문장 속 의미를 더 깊이 이해하려는 아이에게 추천합니다.", books: ["The broken roop", "Chinese adventure", "Australian adventure", "Lost in the jungle", "The hunt for gold", "The big breakfast", "Red Planet", "The jigsaw puzzle", "The power cut", "Submarine adventure", "The motorway", "The riddle stone", "The lost key", "Roman adventure", "The riddle stone", "The willow pattern plot", "The bully", "A sea mystery"] },
   { level: "8", rwoStage: "Stage 5", age: "7-8", bookBand: "Purple", description: "일반적이면서도 소리로 예측하기 어려운 단어(tricky words)를 대부분 알게 되고, 이야기책은 챕터로 나뉘는 경우가 많습니다.", whyUseful: "선택의 자유가 커지며, 독립 독서의 즐거움이 생기는 단계입니다.", recommendation: "스스로 읽을 책을 고르고 싶어 하거나, 챕터 단위의 이야기에 흥미를 보이는 아이에게 적합합니다.", books: ["A day in London", "Egyption adventure", "The flying carpet", "The evil genie", "The rainbow", "Flood!", "The kidnappers", "Pocket money", "Victorian adventure", "Save floppy!", "Viking adventure", "What was it like?"] },
   { level: "9", rwoStage: "Stage 5", age: "7-8", bookBand: "Gold", description: "대부분의 단어를 자동으로 인식하며, 조용히 읽거나 소리 내어 읽을 때도 유창함이 느껴집니다. 논픽션(정보책)의 경우 목차, 색인 등을 활용합니다.", whyUseful: "독립 독서 능력과 정보 탐색 능력을 동시에 키우는 단계입니다.", recommendation: "읽는 데 속도가 붙고, 정보형 텍스트를 읽고 핵심을 파악하는 연습을 시작할 수 있는 아이에게 좋아요.", books: ["Green Island", "Dutch adventure", "The litter queen", "The finest in the land", "Storm castle", "The flying machine", "Superdog", "Key trouble", "Survival adventure", "Rescue!", "The quest", "The blue eye"] }
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
 // 2. Contexts (State Management) - UserContext
 // -----------------------------------------------------------------------------
 const UserContext = createContext(null);
 
 export const UserProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [userData, setUserData] = useState({ readBooks: [], wishlist: [], readingLogs: {} });
   
   // Auth Initialization
   useEffect(() => {
     if (!auth) return;
     const initAuth = async () => {
         if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
             try { await signInWithCustomToken(auth, __initial_auth_token); }
             catch { await signInAnonymously(auth); }
         } else {
             await signInAnonymously(auth); 
         }
     };
     initAuth();
     return onAuthStateChanged(auth, (u) => setUser(u));
   }, []);
 
   // Data Sync
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
 
   // Actions
   const login = () => auth && signInWithPopup(auth, new GoogleAuthProvider()).catch(console.error);
   const logout = () => auth && signOut(auth);
 
   const toggleRead = async (bookId) => {
     const isRead = userData.readBooks?.includes(bookId);
     setUserData(prev => ({ ...prev, readBooks: isRead ? prev.readBooks.filter(id => id !== bookId) : [...(prev.readBooks || []), bookId] })); // Optimistic
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
     setUserData(prev => ({ ...prev, wishlist: isWish ? prev.wishlist.filter(id => id !== bookId) : [...(prev.wishlist || []), bookId] })); // Optimistic
     if (user && db) {
       const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'profile');
       try { await updateDoc(docRef, { wishlist: isWish ? arrayRemove(bookId) : arrayUnion(bookId) }); } catch (e) { console.error(e); }
     }
   };
 
   const updateLog = async (bookId, field, value) => {
     setUserData(prev => ({ ...prev, readingLogs: { ...prev.readingLogs, [bookId]: { ...prev.readingLogs?.[bookId], [field]: value } } })); // Optimistic
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
 
 
 // -----------------------------------------------------------------------------
 // 3. Hooks (Custom Hooks) - useGemini
 // -----------------------------------------------------------------------------
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
     } catch (e) { setError("AI 연결 실패. 잠시 후 시도해주세요."); } 
     finally { setLoading(false); }
   }, []);
   return { loading, response, error, generateContent, setResponse };
 };
 
 
 // -----------------------------------------------------------------------------
 // 4. Components (UI 모듈)
 // -----------------------------------------------------------------------------
 
 const Header = ({ user, activeTab, setActiveTab, onSignIn, onSignOut, readCount, wishCount }) => (
   <header className="bg-white sticky top-0 z-10 shadow-sm">
     <div className="max-w-lg mx-auto pt-4 px-4 pb-2">
       <div className="flex justify-between items-center mb-4">
         <div><h1 className="text-xl font-bold text-gray-900">ORT Mom's Manager</h1>{user && <p className="text-xs text-gray-500 mt-0.5">안녕하세요, {user.displayName}님!</p>}</div>
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
 
 const LevelGuide = () => (
   <div className="space-y-6 pb-10">
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
     <div className="space-y-4">
       <h4 className="font-bold text-gray-700 ml-1 mt-2">단계별 상세 가이드</h4>
       {rawOrtData.map((data) => {
         const colors = LEVEL_COLORS[data.level] || { bg: 'bg-gray-500', text: 'text-gray-700', lightBg: 'bg-gray-50' };
         const bandColor = BAND_COLORS[data.bookBand] || 'bg-gray-400';
         return (
           <div key={data.level} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className={`px-5 py-4 border-b border-gray-50 flex items-center justify-between ${colors.lightBg}`}>
               <div className="flex items-center gap-3">
                 <span className={`px-3 py-1 rounded-lg text-white font-bold text-sm ${colors.bg}`}>Level {data.level}</span>
                 <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-medium">Equivalent to</span><span className="text-xs font-bold text-gray-700">{data.rwoStage}</span></div>
               </div>
               <div className="flex flex-col items-end"><div className="flex items-center text-xs font-medium text-gray-500 mb-1"><span className={`w-2.5 h-2.5 rounded-full mr-1.5 ${bandColor}`}></span>{data.bookBand}</div><span className="text-[10px] text-gray-400 font-medium">Age {data.age}</span></div>
             </div>
             <div className="p-5 space-y-4">
               <div><h5 className="flex items-center text-xs font-bold text-gray-800 mb-1.5"><Info className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> 단계 설명</h5><p className="text-sm text-gray-600 leading-relaxed pl-4 border-l-2 border-blue-100">{data.description}</p></div>
               <div><h5 className="flex items-center text-xs font-bold text-gray-800 mb-1.5"><Lightbulb className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> 왜 유용한가요?</h5><p className="text-sm text-gray-600 leading-relaxed pl-4 border-l-2 border-amber-100">{data.whyUseful}</p></div>
               <div><h5 className="flex items-center text-xs font-bold text-gray-800 mb-1.5"><Target className="w-3.5 h-3.5 mr-1.5 text-green-500" /> 추천 대상</h5><p className="text-sm text-gray-600 leading-relaxed pl-4 border-l-2 border-green-100">{data.recommendation}</p></div>
             </div>
           </div>
         );
       })}
     </div>
   </div>
 );
 
 const ResourceGuide = () => (
   <div className="space-y-4 pb-10">
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
 
 const BookCard = ({ book, isRead, isWish, log, onRead, onWish, onClick }) => (
   <div onClick={onClick} className={`bg-white rounded-xl p-4 flex items-center shadow-sm border transition cursor-pointer active:scale-98 ${isRead ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
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
 
 const BookDetail = ({ book, isRead, isWish, log, onRead, onWish, onBack, onUpdateLog }) => {
   const { generateContent, loading, response, setResponse, error } = useGemini();
   const [aiMode, setAiMode] = useState(null);
 
   const handleAi = (type) => {
     setAiMode(type); setResponse(null);
     const prompt = type === 'quiz' 
       ? `Create 3 simple multiple-choice questions (A, B, C) for a 6-year-old child who read "${book.title}" (ORT Level ${book.level}). Simple English, provide answer, end with Korean encouragement.`
       : type === 'activity' 
       ? `Suggest one fun post-reading activity for "${book.title}" (ORT Level ${book.level}). Target: Korean mom & child. Output in Korean. Structure: Title, Prep, Steps, Benefit.`
       : `Suggest 3 conversation starters for "${book.title}" (ORT Level ${book.level}). English question + Korean translation + Parent guide.`;
     generateContent(prompt);
   };
 
   const openSearch = (platform) => {
     const q = platform === 'google' ? `${book.title} worksheet free ORT` : `${book.title} ORT read aloud`;
     window.open(platform === 'google' ? `https://www.google.com/search?q=${encodeURIComponent(q)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
   };
 
   return (
     <div className="min-h-screen bg-gray-50 pb-safe">
       <div className="bg-white shadow-sm sticky top-0 z-20 px-4 h-14 flex items-center">
         <button onClick={() => { setResponse(null); onBack(); }} className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
         <h1 className="text-lg font-bold truncate flex-1">{book.title}</h1>
       </div>
       <div className="max-w-lg mx-auto p-4 space-y-6 pb-20">
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
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
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Edit3 className="w-5 h-5 text-green-600 mr-2" />독서 기록</h3>
             <div className="space-y-4">
               <input type="date" value={log.date} onChange={(e) => onUpdateLog('date', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 px-3 outline-none" />
               <textarea value={log.memo} onChange={(e) => onUpdateLog('memo', e.target.value)} placeholder="메모를 남겨주세요" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 h-24 resize-none outline-none" />
             </div>
           </div>
         )}
 
         <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-1 border border-indigo-100">
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
 
 // -----------------------------------------------------------------------------
 // 6. Main Application
 // -----------------------------------------------------------------------------
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
     <div className="min-h-screen bg-gray-50 font-sans pb-20">
       <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab} onSignIn={login} onSignOut={logout} readCount={userData.readBooks?.length || 0} wishCount={userData.wishlist?.length || 0} />
       <main className="max-w-lg mx-auto px-4 pt-4">
         {activeTab === 'library' && (
           <>
             <div className="relative mb-3 mt-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="책 제목 검색..." className="w-full bg-gray-100 text-base rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
             <div className="overflow-x-auto hide-scrollbar pb-2">
               <div className="flex space-x-2">
                 <button onClick={() => setSelectedLevel("All")} className={`px-4 py-2 rounded-full text-sm font-bold border ${selectedLevel === "All" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"}`}>All</button>
                 {rawOrtData.map((g) => {
                    const c = LEVEL_COLORS[g.level] || { bg: 'bg-gray-500' };
                    return <button key={g.level} onClick={() => setSelectedLevel(g.level)} className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap transition-colors ${selectedLevel === g.level ? `${c.bg} text-white border-transparent` : "bg-white text-gray-600 border-gray-200"}`}>Level {g.level}</button>
                 })}
               </div>
             </div>
             <div className="space-y-3 mt-4">
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
 
 const Root = () => (
   <UserProvider>
     <App />
   </UserProvider>
 );
 
 export default Root;