import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  Zap, 
  Droplet, 
  ChevronRight, 
  ArrowLeft, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  Search,
  CheckCircle,
  AlertCircle,
  Folder,
  FileText,
  CornerDownRight,
  PhoneIncoming,
  X,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Copy,
  Check,
  MessageSquare,
  Square,
  CheckSquare,
  Settings,
  Download,
  Cloud,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Info,
  FileCog,
  Wifi,
  Monitor,
  Smartphone,
  Home,
  Flame,
  AlertTriangle,
  XCircle,
  User,
  Mail,
  CreditCard,
  Clock,
  Calendar,
  Heart,
  Lock,
  LogIn,
  LogOut
} from 'lucide-react';
import Papa from 'papaparse';
import { FlowNode, PhoneEntry, IconComponentProps, PhoneEntryType, AppConfig } from './types';
import { APP_DATA } from './data';
import { 
  fetchFlowDataWithConfig,
  fetchPhoneDataFromCSV, 
  exportFlowDataToCSV, 
  exportPhoneDataToCSV 
} from './sync';

// バージョン管理用キー
const STORAGE_KEYS = {
  CONFIG: 'appConfig_v7',
  DATA_FLOW: 'supportAppData_v25',
  DATA_PHONE: 'supportAppPhoneData_v7',
  AUTH: 'supporton_auth_v1'
};

const PASSWORD_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Ay7yJ69I48BeO4jyxAsLodm2nAiW1bpDyaRYxrkNo7Y/pub?output=csv';

// 資料送付用テンプレート部品
const DOC_TEMPLATE_HEADER = `お世話になっております。
株式会社すまえるです。

こちらがご案内した電力会社・ガス会社の資料になります。

`;

const DOC_TEMPLATE_FOOTER = `

こちらでご確認いただけますと幸いです。
また詳細についてご質問があれば、コールセンターまで直接お問い合わせくださいませ。

株式会社すまえる　050-5785-7984
営業時間11:00~21:00

よろしくお願いいたします。`;

const IconComponent: React.FC<IconComponentProps> = ({ name, className }) => {
  const icons: { [key: string]: React.ReactNode } = {
    Phone: <Phone className={className} />,
    Zap: <Zap className={className} />,
    Droplet: <Droplet className={className} />,
    HelpCircle: <HelpCircle className={className} />,
    Wifi: <Wifi className={className} />,
    Monitor: <Monitor className={className} />,
    Smartphone: <Smartphone className={className} />,
    Home: <Home className={className} />,
    Flame: <Flame className={className} />,
    FileText: <FileText className={className} />,
    Folder: <Folder className={className} />,
    CheckCircle: <CheckCircle className={className} />,
    AlertCircle: <AlertCircle className={className} />,
    AlertTriangle: <AlertTriangle className={className} />,
    XCircle: <XCircle className={className} />,
    User: <User className={className} />,
    Mail: <Mail className={className} />,
    CreditCard: <CreditCard className={className} />,
    Clock: <Clock className={className} />,
    Calendar: <Calendar className={className} />,
    Settings: <Settings className={className} />,
    Search: <Search className={className} />,
    ExternalLink: <ExternalLink className={className} />
  };
  return <>{icons[name || ''] || <CornerDownRight className={className} />}</>;
};

const SpreadsheetGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-pink-500"/>
            スプレッドシート作成ガイド
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400"/></button>
        </div>
        
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <section>
            <div className="flex items-start gap-4">
               <div className="bg-pink-100 p-3 rounded-2xl">
                 <Cloud className="w-8 h-8 text-pink-500" />
               </div>
               <div>
                 <h3 className="font-bold text-lg text-slate-700 mb-2">日本語でOK！かんたん作成</h3>
                 <p className="text-slate-500 leading-relaxed">
                   難しいID管理は不要です。<span className="font-bold text-pink-500">「タイトル」</span>がそのままボタン名になります。<br/>
                   システム側で自動管理するため、<span className="font-bold text-green-500">同じ名前のタイトルが複数あってもOKです。</span>
                 </p>
               </div>
            </div>
          </section>
          {/* ... 余白のため中略 ... */}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-pink-500 text-white rounded-full font-bold hover:bg-pink-600 transition-all shadow-lg shadow-pink-200">
            理解しました
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // 認証用 State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // フローチャート用 State
  const [data, setData] = useState<FlowNode>(APP_DATA.flowData);
  const [path, setPath] = useState<string[]>([]);
  
  // 編集・UI用 State
  const [isEditing, setIsEditing] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 設定用 State
  const [config, setConfig] = useState<AppConfig>({
    useGoogleSheets: true,
    flowSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7DdnTKg5n3KDXa6Gjqmvr2TcfT8JECYYZsrBKR02UbZgoXK5KBCB9RtaEDJM2aBbpwp2m-n_4h6gM/pub?gid=344826579&single=true&output=csv',
    flowConfigSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7DdnTKg5n3KDXa6Gjqmvr2TcfT8JECYYZsrBKR02UbZgoXK5KBCB9RtaEDJM2aBbpwp2m-n_4h6gM/pub?gid=737180103&single=true&output=csv',
    phoneSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7DdnTKg5n3KDXa6Gjqmvr2TcfT8JECYYZsrBKR02UbZgoXK5KBCB9RtaEDJM2aBbpwp2m-n_4h6gM/pub?gid=759771075&single=true&output=csv'
  });
  
  // 編集用 State
  const [editContentText, setEditContentText] = useState('');
  const [editTemplateText, setEditTemplateText] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false); 

  // 資料送付用 State
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  // 電話番号検索用 State
  const [phoneData, setPhoneData] = useState<PhoneEntry[]>(APP_DATA.phoneData);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<PhoneEntry[]>([]);
  
  // 新規電話番号登録用
  const [newPhoneNum, setNewPhoneNum] = useState('');
  const [newPhoneName, setNewPhoneName] = useState('');
  const [newPhoneNote, setNewPhoneNote] = useState('');
  const [newPhoneType, setNewPhoneType] = useState<PhoneEntryType>('safe');

  // --- 初期ロードと認証チェック ---
  useEffect(() => {
    const init = async () => {
      // 1. セッションチェック
      const authed = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (authed === 'true') {
        setIsLoggedIn(true);
      }
      setIsAuthChecking(false);

      // 2. 設定のロード
      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      let currentConfig = config;
      if (savedConfig) {
        try {
          currentConfig = JSON.parse(savedConfig);
          setConfig(currentConfig);
        } catch (e) {
          console.error("Config parse error", e);
        }
      }

      // 3. データのロード (ログイン済みの場合のみ)
      if (authed === 'true') {
        if (currentConfig.useGoogleSheets && currentConfig.flowSheetUrl) {
          await loadDataFromSheets(currentConfig);
        } else {
          const savedData = localStorage.getItem(STORAGE_KEYS.DATA_FLOW);
          if (savedData) {
            try { setData(JSON.parse(savedData)); } catch (e) { setData(APP_DATA.flowData); }
          }
          const savedPhoneData = localStorage.getItem(STORAGE_KEYS.DATA_PHONE);
          if (savedPhoneData) {
            try { setPhoneData(JSON.parse(savedPhoneData)); } catch (e) { setPhoneData(APP_DATA.phoneData); }
          }
        }
      }
    };

    init();
  }, []);

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword.trim()) return;
    
    setIsLoading(true);
    setAuthError('');
    
    try {
      const response = await fetch(`${PASSWORD_SHEET_URL}&t=${Date.now()}`);
      if (!response.ok) throw new Error('Password sheet not found');
      const csvText = await response.text();
      const parsed = Papa.parse<string[]>(csvText, { header: false });
      
      // D1セルは row 0, col 3
      const masterPassword = parsed.data[0]?.[3];
      
      if (masterPassword && loginPassword === masterPassword.trim()) {
        setIsLoggedIn(true);
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        await loadDataFromSheets(config);
      } else {
        setAuthError('パスワードが正しくありません。');
      }
    } catch (err) {
      console.error(err);
      setAuthError('認証中にエラーが発生しました。インターネット接続を確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('ログアウトしますか？')) {
      setIsLoggedIn(false);
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      setLoginPassword('');
    }
  };

  // データの永続化
  useEffect(() => {
    if (!config.useGoogleSheets && isLoggedIn) {
      localStorage.setItem(STORAGE_KEYS.DATA_FLOW, JSON.stringify(data));
    }
  }, [data, config.useGoogleSheets, isLoggedIn]);

  useEffect(() => {
    if (!config.useGoogleSheets && isLoggedIn) {
      localStorage.setItem(STORAGE_KEYS.DATA_PHONE, JSON.stringify(phoneData));
    }
  }, [phoneData, config.useGoogleSheets, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  // --- Google Sheets連携ロジック ---
  const loadDataFromSheets = async (targetConfig: AppConfig) => {
    setIsLoading(true);
    const loadFlow = async () => {
        if (!targetConfig.flowSheetUrl) return;
        try {
            const flowData = await fetchFlowDataWithConfig(
                targetConfig.flowSheetUrl, 
                targetConfig.flowConfigSheetUrl || ''
            );
            if (flowData) setData(flowData);
        } catch (error: any) {
            console.error(error);
        }
    };
    const loadPhone = async () => {
        if (!targetConfig.phoneSheetUrl) return;
        try {
            const newPhoneData = await fetchPhoneDataFromCSV(targetConfig.phoneSheetUrl);
            if (newPhoneData) setPhoneData(newPhoneData);
        } catch (error: any) {
            console.error(error);
        }
    };
    await Promise.all([loadFlow(), loadPhone()]);
    setIsLoading(false);
    setPath([]);
  };

  const handleSaveConfig = async () => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    if (config.useGoogleSheets) {
      await loadDataFromSheets(config);
      setIsEditing(false);
    }
    setIsSettingsOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const getCurrentNode = (): FlowNode | null => {
    let current = data;
    for (const id of path) {
      if (!current.children) return null;
      const found = current.children.find(child => child.id === id);
      if (!found) return null;
      current = found;
    }
    return current;
  };

  const pathNodes = useMemo(() => {
    const nodes: FlowNode[] = [];
    let current = data;
    for (const id of path) {
      const found = current.children?.find(c => c.id === id);
      if (found) {
        nodes.push(found);
        current = found;
      } else { break; }
    }
    return nodes;
  }, [data, path]);

  // ログイン画面
  if (isAuthChecking) return null;
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-indigo-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-pink-100 mb-6 text-5xl">
              🐷
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500">
              Supporton
            </h1>
            <p className="text-slate-400 font-medium mt-2">Welcome back! Please login to continue.</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 p-10 border border-white">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-pink-400 transition-colors"/>
                  <input 
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-lg"
                    placeholder="••••••••"
                  />
                </div>
                {authError && (
                  <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-bold animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4"/>
                    {authError}
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-pink-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-6 h-6 animate-spin"/> : <LogIn className="w-6 h-6"/>}
                {isLoading ? 'Checking...' : 'Login'}
              </button>
            </form>
          </div>

          <p className="text-center mt-8 text-slate-300 text-sm font-mono tracking-widest uppercase">
            ©toyosystem
          </p>
        </div>
      </div>
    );
  }

  const currentNode = getCurrentNode();
  const isLeaf = currentNode ? (!currentNode.children || currentNode.children.length === 0) : false;
  const hasContent = currentNode ? (currentNode.content || currentNode.template) : false;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-700 font-sans flex flex-col md:flex-row">
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <Settings className="w-6 h-6 text-slate-400"/>
                アプリ設定
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400"/></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${config.useGoogleSheets ? 'bg-green-400' : 'bg-slate-300'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${config.useGoogleSheets ? 'translate-x-6' : ''}`}></div>
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-slate-900">Googleスプレッドシートと連携</span>
                  </label>
                  <button onClick={() => setIsGuideOpen(true)} className="text-sm text-pink-500 hover:text-pink-600 font-bold flex items-center gap-1">
                    <BookOpen className="w-4 h-4"/>
                    ガイド
                  </button>
                </div>

                {config.useGoogleSheets && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Flow URL</label>
                      <input type="text" value={config.flowSheetUrl} onChange={(e) => setConfig({...config, flowSheetUrl: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Phone URL</label>
                      <input type="text" value={config.phoneSheetUrl} onChange={(e) => setConfig({...config, phoneSheetUrl: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                    <button onClick={() => loadDataFromSheets(config)} disabled={isLoading} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                      {isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Cloud className="w-5 h-5"/>}
                      今すぐ同期
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button onClick={handleLogout} className="w-full py-3 bg-slate-100 text-red-500 hover:bg-red-50 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors">
                  <LogOut className="w-5 h-5"/>
                  ログアウト
                </button>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={handleSaveConfig} className="px-6 py-2 bg-pink-500 text-white rounded-full font-bold shadow-lg">保存して閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar: Phone Directory */}
      <div className="w-full md:w-80 bg-white border-r border-indigo-50 flex flex-col h-[40vh] md:h-screen shadow-xl shadow-indigo-100/50 z-20">
        <div className="p-6 bg-white">
          <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight text-slate-800">
            <span className="text-3xl">🐷</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500">
              Supporton
            </span>
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 pl-11 tracking-wide">Friendly Support Buddy</p>
        </div>
        
        <div className="px-6 pb-4 bg-white">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-pink-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-2 pb-4">
          {searchResult.map((entry) => (
            <div key={entry.id} className={`p-4 rounded-2xl border transition-all hover:shadow-md cursor-default group ${
              entry.type === 'danger' ? 'bg-red-50/50 border-red-100' : 
              entry.type === 'warning' ? 'bg-yellow-50/50 border-yellow-100' : 'bg-white border-transparent hover:border-pink-100 hover:bg-pink-50/30'
            }`}>
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  {entry.type === 'danger' && <ShieldAlert className="w-4 h-4 text-red-400" />}
                  {entry.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-400" />}
                  {entry.type === 'safe' && <div className="w-2 h-2 rounded-full bg-green-400"></div>}
                  <span className="font-bold text-slate-700 group-hover:text-pink-600 transition-colors">{entry.name}</span>
                </div>
              </div>
              <div className="text-lg font-mono font-bold text-slate-600 tracking-wide select-all cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => copyToClipboard(entry.number)}>
                {entry.number}
              </div>
              {entry.note && <div className="text-xs text-slate-400 mt-2 pl-2 border-l-2 border-slate-200">{entry.note}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Flowchart */}
      <div className="flex-1 flex flex-col h-[60vh] md:h-screen overflow-hidden relative bg-[#F0F4F8]">
        <div className="h-20 bg-white/80 backdrop-blur-md border-b border-white flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
             {path.length > 0 && (
               <button onClick={() => setPath(path.slice(0, -1))} className="p-3 mr-2 rounded-full bg-white border border-slate-100 text-slate-400 hover:border-pink-200 hover:text-pink-500 hover:shadow-md transition-all shrink-0">
                 <ArrowLeft className="w-5 h-5"/>
               </button>
             )}
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-2">
                <button onClick={() => setPath([])} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${path.length === 0 ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500'}`}>
                  <Home className="w-4 h-4"/>
                  Top
                </button>
                {pathNodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    <button onClick={() => setPath(path.slice(0, index + 1))} className="px-4 py-2 rounded-full text-sm font-bold bg-white text-slate-600 hover:bg-indigo-50 whitespace-nowrap transition-all shadow-sm border border-slate-100">
                      {node.title}
                    </button>
                  </React.Fragment>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
             <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all shadow-sm border border-slate-100">
               <Settings className="w-5 h-5"/>
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10 pb-6 min-h-full flex flex-col">
            {path.length > 0 && currentNode && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-slate-700 mb-3 flex items-center justify-center md:justify-start gap-3">
                        {currentNode.icon && (
                          <div className="p-2 bg-white rounded-2xl shadow-sm">
                            <IconComponent name={currentNode.icon} className="w-8 h-8 text-pink-500"/>
                          </div>
                        )}
                        {currentNode.title}
                    </h2>
                    {currentNode.description && <p className="text-slate-500 text-lg leading-relaxed max-w-3xl">{currentNode.description}</p>}
                </div>
            )}

            {hasContent && currentNode && (
              <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden animate-in zoom-in-95 duration-500 relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-indigo-400 to-blue-400"></div>
                <div className="p-8 md:p-12">
                  <div className="flex items-center justify-between mb-8 text-xl font-bold text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-xl"><MessageSquare className="w-6 h-6 text-indigo-600"/></div>
                      対応スクリプト
                    </div>
                  </div>
                  <div className="space-y-8">
                    {currentNode.content && <div className="bg-slate-50/50 p-8 rounded-3xl border border-dashed border-slate-200 text-xl leading-9 text-slate-700 whitespace-pre-wrap font-medium">{currentNode.content}</div>}
                    {currentNode.template && (
                      <div className="bg-indigo-50/30 rounded-3xl p-6 border border-indigo-100">
                           <div className="flex justify-between items-center mb-4">
                               <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1"><Copy className="w-3 h-3"/>Copy Template</span>
                               <button onClick={() => copyToClipboard(currentNode.template!)} className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all shadow-md transform active:scale-95 ${isCopied ? 'bg-green-500 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-500 hover:text-white'}`}>
                                  {isCopied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}{isCopied ? 'Copied!' : '定型文をコピー'}
                               </button>
                           </div>
                           <div className="text-sm text-slate-600 font-mono whitespace-pre-wrap bg-white p-5 rounded-2xl shadow-sm border border-slate-100">{currentNode.template}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(!isLeaf || !hasContent) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentNode?.children?.map((child) => {
                    const colorClass = child.color || 'bg-indigo-500';
                    const baseColor = colorClass.replace('bg-', '').replace('-500', '');
                    return (
                        <button key={child.id} onClick={() => setPath([...path, child.id])} className="relative group overflow-hidden rounded-[2rem] p-8 text-left transition-all duration-300 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                          <div className="relative z-10 flex flex-col h-full">
                              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm bg-${baseColor}-100 text-${baseColor}-600`}>
                                  <IconComponent name={child.icon} className="w-8 h-8" />
                              </div>
                              <h3 className="text-xl font-bold text-slate-700 mb-2 group-hover:text-pink-500 transition-colors">{child.title}</h3>
                              {child.description && <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{child.description}</p>}
                              <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-10 ${child.color || 'bg-slate-200'} blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
                          </div>
                        </button>
                    );
                })}
                </div>
            )}
            
            <div className="mt-auto pt-6 text-center text-slate-300 text-xs font-bold font-mono tracking-widest uppercase">
              ©toyosystem
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}