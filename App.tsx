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
  exportPhoneDataToCSV,
  fetchCSVText
} from './sync';

// バージョン管理用キー
const STORAGE_KEYS = {
  CONFIG: 'appConfig_v7',
  DATA_FLOW: 'supportAppData_v25',
  DATA_PHONE: 'supportAppPhoneData_v7',
  AUTH: 'supporton_auth_v1'
};

// パスワード管理用スプレッドシート
// Use /export format which is generally more reliable for fetch if "Anyone with link" is set.
const PASSWORD_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Ay7yJ69I48BeO4jyxAsLodm2nAiW1bpDyaRYxrkNo7Y/export?format=csv';

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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [data, setData] = useState<FlowNode>(APP_DATA.flowData);
  const [path, setPath] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<AppConfig>({
    useGoogleSheets: true,
    flowSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7DdnTKg5n3KDXa6Gjqmvr2TcfT8JECYYZsrBKR02UbZgoXK5KBCB9RtaEDJM2aBbpwp2m-n_4h6gM/pub?gid=344826579&single=true&output=csv',
    flowConfigSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7DdnTKg5n3KDXa6Gjqmvr2TcfT8JECYYZsrBKR02UbZgoXK5KBCB9RtaEDJM2aBbpwp2m-n_4h6gM/pub?gid=737180103&single=true&output=csv',
    phoneSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7DdnTKg5n3KDXa6Gjqmvr2TcfT8JECYYZsrBKR02UbZgoXK5KBCB9RtaEDJM2aBbpwp2m-n_4h6gM/pub?gid=759771075&single=true&output=csv'
  });
  const [isCopied, setIsCopied] = useState(false); 
  const [phoneData, setPhoneData] = useState<PhoneEntry[]>(APP_DATA.phoneData);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<PhoneEntry[]>([]);

  useEffect(() => {
    const init = async () => {
      const authed = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (authed === 'true') setIsLoggedIn(true);
      setIsAuthChecking(false);

      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      let currentConfig = config;
      if (savedConfig) {
        try {
          currentConfig = JSON.parse(savedConfig);
          setConfig(currentConfig);
        } catch (e) { console.error(e); }
      }

      if (authed === 'true') {
        await loadDataFromSheets(currentConfig);
      }
    };
    init();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputPass = loginPassword.trim();
    if (!inputPass) return;
    
    setIsLoading(true);
    setAuthError('');
    
    try {
      const text = await fetchCSVText(PASSWORD_SHEET_URL);
      
      if (!text) {
        throw new Error('EMPTY_RESPONSE');
      }

      // If text contains HTML, it means we hit a redirect (likely to a login page)
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        throw new Error('NOT_PUBLISHED_AS_CSV');
      }

      const parsed = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
      // Assuming password is in D1 (1st row, 4th column)
      const masterPassword = parsed.data?.[0]?.[3]?.trim();
      
      if (!masterPassword) throw new Error('PASSWORD_CELL_EMPTY');
      
      if (inputPass === masterPassword) {
        setIsLoggedIn(true);
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        await loadDataFromSheets(config);
      } else {
        setAuthError('パスワードが正しくありません。');
      }
    } catch (err: any) {
      console.error('Login Fetch Error:', err);
      const errMsg = err.message || '';
      
      if (errMsg === 'NOT_PUBLISHED_AS_CSV') {
        setAuthError('Googleスプレッドシートの設定を確認してください。「ウェブに公開(CSV)」が必要です。');
      } else if (errMsg === 'PASSWORD_CELL_EMPTY') {
        setAuthError('マスタパスワード（D1セル）が見つかりません。');
      } else if (errMsg.includes('Failed to fetch') || err.name === 'TypeError') {
        setAuthError('接続エラー: シートの「共有設定（リンクを知っている全員が閲覧可能）」と「ウェブに公開」の両方が設定されているか確認してください。');
      } else {
        setAuthError(`通信エラー: ${errMsg || 'ネットワークの問題が発生しました'}`);
      }
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

  const loadDataFromSheets = async (targetConfig: AppConfig) => {
    setIsLoading(true);
    try {
      const flowPromise = targetConfig.flowSheetUrl ? fetchFlowDataWithConfig(targetConfig.flowSheetUrl, targetConfig.flowConfigSheetUrl || '') : Promise.resolve(null);
      const phonePromise = targetConfig.phoneSheetUrl ? fetchPhoneDataFromCSV(targetConfig.phoneSheetUrl) : Promise.resolve(null);
      
      const [flowData, newPhoneData] = await Promise.all([flowPromise, phonePromise]);
      if (flowData) setData(flowData);
      if (newPhoneData) setPhoneData(newPhoneData);
    } catch (error: any) {
      console.error('Data Load Error:', error);
    } finally {
      setIsLoading(false);
      setPath([]);
    }
  };

  const handleSaveConfig = async () => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    if (config.useGoogleSheets) await loadDataFromSheets(config);
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
      } else break;
    }
    return nodes;
  }, [data, path]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = phoneData.filter(e => 
      e.name.toLowerCase().includes(query) || 
      e.number.includes(query) || 
      e.note.toLowerCase().includes(query)
    );
    setSearchResult(filtered);
  }, [searchQuery, phoneData]);

  if (isAuthChecking) return null;
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-indigo-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-pink-100 mb-6 text-5xl">🐷</div>
            <h1 className="text-4xl font-bold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500">Supporton</h1>
            <p className="text-slate-400 font-medium mt-2">Please login to continue.</p>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-pink-400"/>
                  <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-pink-100 outline-none text-lg" placeholder="••••••••"/>
                </div>
                {authError && <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-bold"><AlertCircle className="w-4 h-4"/>{authError}</div>}
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-pink-200 flex items-center justify-center gap-3 disabled:opacity-50 transition-transform active:scale-95">
                {isLoading ? <RefreshCw className="w-6 h-6 animate-spin"/> : <LogIn className="w-6 h-6"/>}
                {isLoading ? 'Checking...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const currentNode = getCurrentNode();
  const isLeaf = currentNode ? (!currentNode.children || currentNode.children.length === 0) : false;
  const hasContent = currentNode ? (currentNode.content || currentNode.template) : false;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-700 font-sans flex flex-col md:flex-row overflow-hidden">
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2"><Settings className="w-6 h-6 text-slate-400"/>設定</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400"/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.useGoogleSheets ? 'bg-green-400' : 'bg-slate-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.useGoogleSheets ? 'translate-x-6' : ''}`}></div>
                  </div>
                  <span className="font-bold">Googleスプレッドシートと連携</span>
                </label>
                {config.useGoogleSheets && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Flow URL</label>
                      <input type="text" value={config.flowSheetUrl} onChange={(e) => setConfig({...config, flowSheetUrl: e.target.value})} className="w-full p-3 border rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Phone URL</label>
                      <input type="text" value={config.phoneSheetUrl} onChange={(e) => setConfig({...config, phoneSheetUrl: e.target.value})} className="w-full p-3 border rounded-xl text-sm" />
                    </div>
                    <button onClick={() => loadDataFromSheets(config)} disabled={isLoading} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                      {isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Cloud className="w-5 h-5"/>}同期
                    </button>
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="w-full py-3 bg-red-50 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100"><LogOut className="w-5 h-5"/>ログアウト</button>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end">
              <button onClick={handleSaveConfig} className="px-6 py-2 bg-pink-500 text-white rounded-full font-bold shadow-lg">保存して閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar: Phone Directory */}
      <div className="w-full md:w-80 bg-white border-r border-indigo-50 flex flex-col h-[40vh] md:h-screen shadow-xl z-20">
        <div className="p-6 bg-white shrink-0">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <span className="text-3xl">🐷</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500">Supporton</span>
          </h1>
        </div>
        <div className="px-6 pb-4 bg-white shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="Search contacts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-pink-200 outline-none transition-all"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-2 pb-4">
          {searchResult.map((entry) => (
            <div key={entry.id} className={`p-4 rounded-2xl border transition-all cursor-default group ${entry.type === 'danger' ? 'bg-red-50 border-red-100' : entry.type === 'warning' ? 'bg-yellow-50 border-yellow-100' : 'bg-white border-transparent hover:border-pink-100 hover:bg-pink-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                {entry.type === 'danger' ? <ShieldAlert className="w-4 h-4 text-red-400" /> : entry.type === 'warning' ? <AlertCircle className="w-4 h-4 text-yellow-400" /> : <div className="w-2 h-2 rounded-full bg-green-400"></div>}
                <span className="font-bold text-slate-700">{entry.name}</span>
              </div>
              <div className="text-lg font-mono font-bold text-slate-600 select-all cursor-pointer hover:text-indigo-500" onClick={() => copyToClipboard(entry.number)}>{entry.number}</div>
              {entry.note && <div className="text-xs text-slate-400 mt-1 pl-2 border-l-2">{entry.note}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Flowchart */}
      <div className="flex-1 flex flex-col h-[60vh] md:h-screen overflow-hidden relative">
        <div className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
             {path.length > 0 && (
               <button onClick={() => setPath(path.slice(0, -1))} className="p-3 mr-2 rounded-full border text-slate-400 hover:text-pink-500 transition-all shrink-0"><ArrowLeft className="w-5 h-5"/></button>
             )}
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                <button onClick={() => setPath([])} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${path.length === 0 ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 shadow-sm'}`}><Home className="w-4 h-4"/>Top</button>
                {pathNodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    <button onClick={() => setPath(path.slice(0, index + 1))} className="px-4 py-2 rounded-full text-sm font-bold bg-white text-slate-600 border whitespace-nowrap shadow-sm">{node.title}</button>
                  </React.Fragment>
                ))}
             </div>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white text-slate-400 hover:text-indigo-500 rounded-full border shadow-sm shrink-0 ml-4"><Settings className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10 pb-6">
            {path.length > 0 && currentNode && (
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold text-slate-700 mb-3 flex items-center justify-center md:justify-start gap-3">
                        {currentNode.icon && <div className="p-2 bg-white rounded-2xl shadow-sm"><IconComponent name={currentNode.icon} className="w-8 h-8 text-pink-500"/></div>}
                        {currentNode.title}
                    </h2>
                    {currentNode.description && <p className="text-slate-500 text-lg max-w-3xl">{currentNode.description}</p>}
                </div>
            )}

            {hasContent && currentNode && (
              <div className="bg-white rounded-[2rem] shadow-xl border overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-indigo-400"></div>
                <div className="p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-8 text-xl font-bold text-slate-700">
                    <div className="bg-indigo-100 p-2 rounded-xl"><MessageSquare className="w-6 h-6 text-indigo-600"/></div>対応スクリプト
                  </div>
                  <div className="space-y-8">
                    {currentNode.content && <div className="bg-slate-50/50 p-8 rounded-3xl border border-dashed text-xl leading-9 text-slate-700 whitespace-pre-wrap font-medium">{currentNode.content}</div>}
                    {currentNode.template && (
                      <div className="bg-indigo-50/30 rounded-3xl p-6 border border-indigo-100">
                           <div className="flex justify-between items-center mb-4">
                               <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Copy Template</span>
                               <button onClick={() => copyToClipboard(currentNode.template!)} className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold shadow-md transition-all ${isCopied ? 'bg-green-500 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-500 hover:text-white'}`}>
                                  {isCopied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}{isCopied ? 'Copied!' : '定型文をコピー'}
                               </button>
                           </div>
                           <div className="text-sm text-slate-600 font-mono whitespace-pre-wrap bg-white p-5 rounded-2xl border">{currentNode.template}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(!isLeaf || !hasContent) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentNode?.children?.map((child) => (
                    <button key={child.id} onClick={() => setPath([...path, child.id])} className="relative group overflow-hidden rounded-[2rem] p-8 text-left transition-all bg-white shadow-sm hover:shadow-xl border border-transparent hover:border-pink-100">
                      <div className="relative z-10 flex flex-col h-full">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 bg-indigo-50 text-indigo-500 group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors`}>
                              <IconComponent name={child.icon} className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-700 mb-2 group-hover:text-pink-500 transition-colors">{child.title}</h3>
                          {child.description && <p className="text-sm text-slate-400 line-clamp-2">{child.description}</p>}
                      </div>
                    </button>
                ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
