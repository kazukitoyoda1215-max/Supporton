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
  Heart
} from 'lucide-react';
import { FlowNode, PhoneEntry, IconComponentProps, PhoneEntryType, AppConfig } from './types';
import { APP_DATA } from './data';
import { 
  fetchFlowDataFromCSV, 
  fetchFlowDataWithConfig,
  fetchPhoneDataFromCSV, 
  exportFlowDataToCSV, 
  exportPhoneDataToCSV 
} from './sync';

// バージョン管理用キー
const STORAGE_KEYS = {
  CONFIG: 'appConfig_v7',
  DATA_FLOW: 'supportAppData_v25',
  DATA_PHONE: 'supportAppPhoneData_v7'
};

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
          {/* Section 1: Concept */}
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

          {/* Section 2: Columns */}
          <section>
            <h3 className="font-bold text-lg text-slate-700 mb-4 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-blue-400 before:rounded-full">各列（カラム）の意味</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-32">列名</th>
                    <th className="p-4 w-20 text-center">必須</th>
                    <th className="p-4">役割・入力ルール</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-blue-600">タイトル</td>
                    <td className="p-4 text-center text-red-400 font-bold text-xs">必須</td>
                    <td className="p-4 text-slate-600">
                      ボタンに表示される名前です。<br/>
                      <span className="text-green-500 text-xs font-bold">※同名のタイトルが複数あっても問題ありません。</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-blue-600">親カテゴリ</td>
                    <td className="p-4 text-center text-slate-400 text-xs">-</td>
                    <td className="p-4 text-slate-600">
                      この項目を入れたい「親」のタイトルを入力します。<br/>
                      <span className="text-red-400 text-xs font-bold">※注意: 「親」になる項目のタイトルは重複しないようにしてください。</span><br/>
                      <span className="text-xs text-slate-400">空欄にすると、一番上の階層（ルート）に表示されます。</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-600">本文</td>
                    <td className="p-4 text-center text-slate-400 text-xs">-</td>
                    <td className="p-4 text-slate-600">
                      スクリプト（台本）や対応手順を入力します。<br/>
                      ここに入力があると「回答ページ」になります。
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-600">テンプレート</td>
                    <td className="p-4 text-center text-slate-400 text-xs">-</td>
                    <td className="p-4 text-slate-600">
                      「定型文をコピー」ボタンでコピーさせたい文章を入力します。
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-600">色 / アイコン</td>
                    <td className="p-4 text-center text-slate-400 text-xs">-</td>
                    <td className="p-4 text-slate-600">
                      「青」「赤」「ピンク」や「電話」「ネット」「水」など日本語で指定できます。<br/>
                      （例：ウォーターサーバー→水のアイコン、ガス→火のアイコン）
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Example */}
          <section>
             <h3 className="font-bold text-lg text-slate-700 mb-4 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-green-400 before:rounded-full">入力サンプル</h3>
             <div className="bg-slate-800 text-slate-300 p-6 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner">
                {/* Header */}
                <div className="flex border-b border-slate-700 pb-3 mb-3 font-bold text-slate-400">
                    <div className="w-32 shrink-0">タイトル</div>
                    <div className="w-32 shrink-0">親カテゴリ</div>
                    <div className="w-40 shrink-0">本文</div>
                    <div className="flex-1">色</div>
                </div>
                {/* Row 1: Category */}
                <div className="flex mb-3 items-center group">
                    <div className="w-32 shrink-0 text-yellow-400 font-bold">ネット回線</div>
                    <div className="w-32 shrink-0 text-slate-600">-</div>
                    <div className="w-40 shrink-0 text-slate-600">（空欄）</div>
                    <div className="flex-1 text-white">青</div>
                </div>
                {/* Row 2: Item */}
                <div className="flex mb-3 items-center group">
                    <div className="w-32 shrink-0 text-green-400 font-bold">キャンセル</div>
                    <div className="w-32 shrink-0 text-yellow-400 font-bold">ネット回線</div>
                    <div className="w-40 shrink-0 text-white">解約手順は...</div>
                    <div className="flex-1 text-white">赤</div>
                </div>
                {/* Row 3: Sub Item */}
                <div className="flex mb-3 items-center group">
                    <div className="w-32 shrink-0 text-green-400 font-bold">キャンセル</div>
                    <div className="w-32 shrink-0 text-white font-bold">電気サービス</div>
                    <div className="w-40 shrink-0 text-white">電気の解約は...</div>
                    <div className="flex-1 text-white">赤</div>
                </div>
             </div>
             <p className="mt-3 text-sm text-slate-500 flex items-center gap-2">
               <Info className="w-4 h-4"/>
               <span>このように「キャンセル」という名前が重複していても、「親」が違えば問題なく登録できます。</span>
             </p>
          </section>
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
  // フローチャート用 State
  const [data, setData] = useState<FlowNode>(APP_DATA.flowData);
  const [path, setPath] = useState<string[]>([]);
  
  // 編集・UI用 State
  const [isEditing, setIsEditing] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false); // ガイド用State
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

  // --- 初期ロードと設定読み込み ---
  useEffect(() => {
    const loadSettingsAndData = async () => {
      // 1. 設定のロード
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

      // 2. データのロード
      if (currentConfig.useGoogleSheets && currentConfig.flowSheetUrl) {
        await loadDataFromSheets(currentConfig);
      } else {
        const savedData = localStorage.getItem(STORAGE_KEYS.DATA_FLOW);
        if (savedData) {
          try { setData(JSON.parse(savedData)); } catch (e) { setData(APP_DATA.flowData); }
        } else {
          setData(APP_DATA.flowData);
        }
        
        const savedPhoneData = localStorage.getItem(STORAGE_KEYS.DATA_PHONE);
        if (savedPhoneData) {
          try { setPhoneData(JSON.parse(savedPhoneData)); } catch (e) { setPhoneData(APP_DATA.phoneData); }
        } else {
          setPhoneData(APP_DATA.phoneData);
        }
      }
    };

    loadSettingsAndData();
  }, []);

  // データの永続化
  useEffect(() => {
    if (!config.useGoogleSheets) {
      localStorage.setItem(STORAGE_KEYS.DATA_FLOW, JSON.stringify(data));
    }
  }, [data, config.useGoogleSheets]);

  useEffect(() => {
    if (!config.useGoogleSheets) {
      localStorage.setItem(STORAGE_KEYS.DATA_PHONE, JSON.stringify(phoneData));
    }
  }, [phoneData, config.useGoogleSheets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  // --- Google Sheets連携ロジック ---
  const loadDataFromSheets = async (targetConfig: AppConfig) => {
    setIsLoading(true);
    
    // フローチャートと電話帳を独立して読み込む
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
            alert(`フローチャートデータの読み込みに失敗しました:\n${error.message}`);
        }
    };

    const loadPhone = async () => {
        if (!targetConfig.phoneSheetUrl) return;
        try {
            const newPhoneData = await fetchPhoneDataFromCSV(targetConfig.phoneSheetUrl);
            if (newPhoneData && newPhoneData.length > 0) {
                setPhoneData(newPhoneData);
            } else {
                console.warn("Phone data is empty or null");
                alert("電話帳データの読み込みに失敗したか、データが空です。\n設定画面のURL、またはスプレッドシートの「公開設定」と「シートID(gid)」が正しいか確認してください。");
            }
        } catch (error: any) {
            console.warn("Phone data fetch failed:", error);
            alert("電話帳データの取得中にエラーが発生しました。\nネットワーク接続を確認してください。");
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
      setIsEditing(false); // 連携中は編集オフ
    }
    setIsSettingsOpen(false);
  };

  const handleExportCSV = (type: 'flow' | 'phone') => {
    let csvContent = '';
    let fileName = '';
    
    if (type === 'flow') {
      csvContent = exportFlowDataToCSV(data);
      fileName = 'support_nav_flow_data.csv';
    } else {
      csvContent = exportPhoneDataToCSV(phoneData);
      fileName = 'support_nav_phone_data.csv';
    }

    navigator.clipboard.writeText(csvContent).then(() => {
      alert(`${fileName} の内容をクリップボードにコピーしました。\nGoogleスプレッドシートに貼り付けてください。`);
    }, () => {
      alert('コピーに失敗しました。');
    });
  };

  // --- フローチャート操作系 ---
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

  // パンくずリスト用のノード配列を算出
  const pathNodes = useMemo(() => {
    const nodes: FlowNode[] = [];
    let current = data;
    for (const id of path) {
      const found = current.children?.find(c => c.id === id);
      if (found) {
        nodes.push(found);
        current = found;
      } else {
        break;
      }
    }
    return nodes;
  }, [data, path]);

  const checkEditable = () => {
    if (config.useGoogleSheets) {
      alert('Googleスプレッドシート連携中は、アプリ上での編集はできません。\nスプレッドシート側を編集して、再読み込みを行ってください。');
      return false;
    }
    return true;
  };

  const updateNode = (targetPath: string[], updateFn: (node: FlowNode) => FlowNode) => {
    if (!checkEditable()) return;
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    if (targetPath.length === 0) {
      setData(updateFn(current));
      return;
    }
    let target = newData;
    for (const id of targetPath) {
      if (!target.children) break;
      target = target.children.find((c: FlowNode) => c.id === id);
    }
    if (target) {
        Object.assign(target, updateFn(target));
        setData(newData);
    }
  };
  
  const deleteChildNode = (parentId: string, childId: string) => {
    if (!checkEditable()) return;
    const newData = JSON.parse(JSON.stringify(data));
    const deleteRecursive = (node: FlowNode): boolean => {
      if (node.id === parentId) {
        if (node.children) {
          node.children = node.children.filter(c => c.id !== childId);
        }
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (deleteRecursive(child)) return true;
        }
      }
      return false;
    };
    
    if (path.length === 0 && parentId === 'root') {
      newData.children = newData.children.filter((c: FlowNode) => c.id !== childId);
      setData(newData);
    } else {
      deleteRecursive(newData);
      setData(newData);
    }
  };

  const handleAddChild = () => {
    if (!checkEditable()) return;
    if (!newItemText.trim()) return;
    const newNode: FlowNode = {
      id: Date.now().toString(),
      title: newItemText,
      children: []
    };
    const currentNode = getCurrentNode();
    if (currentNode) {
      updateNode(path, (node) => ({
        ...node,
        children: [...(node.children || []), newNode]
      }));
      setNewItemText('');
      setIsAdding(false);
    }
  };
  
  const handleEditContent = () => {
    if (!checkEditable()) return;
    const node = getCurrentNode();
    if (node) {
      setEditContentText(node.content || '');
      setEditTemplateText(node.template || '');
      setEditingNodeId(node.id);
    }
  };

  const handleSaveContent = () => {
    if (!checkEditable()) return;
    const node = getCurrentNode();
    if (node && editingNodeId === node.id) {
      updateNode(path, (n) => ({
        ...n,
        content: editContentText,
        template: editTemplateText
      }));
      setEditingNodeId(null);
    }
  };

  const generateMaterialText = () => {
    if (selectedMaterialIds.length === 0) return '';
    const selectedMaterials = APP_DATA.materials.filter(m => selectedMaterialIds.includes(m.id));
    return DOC_TEMPLATE_HEADER + selectedMaterials.map(m => `■ ${m.name}\n${m.url}`).join('\n\n') + DOC_TEMPLATE_FOOTER;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (!searchQuery) {
      setSearchResult(phoneData);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const results = phoneData.filter(entry => 
        entry.name.toLowerCase().includes(lowerQuery) || 
        entry.number.includes(lowerQuery) ||
        entry.note.toLowerCase().includes(lowerQuery)
      );
      setSearchResult(results);
    }
  }, [searchQuery, phoneData]);

  const handleAddPhone = () => {
    if (!checkEditable()) return;
    if (!newPhoneNum || !newPhoneName) return;
    const newEntry: PhoneEntry = {
      id: Date.now().toString(),
      number: newPhoneNum,
      name: newPhoneName,
      note: newPhoneNote,
      type: newPhoneType
    };
    setPhoneData([...phoneData, newEntry]);
    setNewPhoneNum('');
    setNewPhoneName('');
    setNewPhoneNote('');
    setNewPhoneType('safe');
  };

  const handleDeletePhone = (id: string) => {
    if (!checkEditable()) return;
    if (confirm('この電話番号を削除しますか？')) {
      setPhoneData(phoneData.filter(p => p.id !== id));
    }
  };

  const currentNode = getCurrentNode();
  const isLeaf = currentNode ? (!currentNode.children || currentNode.children.length === 0) : false;
  const hasContent = currentNode ? (currentNode.content || currentNode.template) : false;
  const showContent = hasContent;

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
              {/* Google Sheets Config */}
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
                    書き方ガイド
                  </button>
                </div>

                {config.useGoogleSheets && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">データシート (Flow) URL</label>
                      <input 
                        type="text" 
                        value={config.flowSheetUrl}
                        onChange={(e) => setConfig({...config, flowSheetUrl: e.target.value})}
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition-all"
                        placeholder="https://docs.google.com/spreadsheets/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">マスタシート (Master) URL (任意)</label>
                      <input 
                        type="text" 
                        value={config.flowConfigSheetUrl || ''}
                        onChange={(e) => setConfig({...config, flowConfigSheetUrl: e.target.value})}
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition-all"
                        placeholder="https://docs.google.com/spreadsheets/..."
                      />
                      <p className="text-xs text-slate-400 mt-1">※色やアイコンの変換ルール、プルダウン定義用</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">電話帳シート (Phone) URL</label>
                      <input 
                        type="text" 
                        value={config.phoneSheetUrl}
                        onChange={(e) => setConfig({...config, phoneSheetUrl: e.target.value})}
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition-all"
                        placeholder="https://docs.google.com/spreadsheets/..."
                      />
                    </div>
                    
                    <button 
                      onClick={() => loadDataFromSheets(config)}
                      disabled={isLoading}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                    >
                      {isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Cloud className="w-5 h-5"/>}
                      データを今すぐ同期
                    </button>
                  </div>
                )}
              </div>

              {/* Local Export */}
              {!config.useGoogleSheets && (
                 <div className="pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Download className="w-5 h-5"/>
                        バックアップ / エクスポート
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleExportCSV('flow')} className="py-2 px-4 border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-600 transition-colors">
                            フローデータ(CSV)
                        </button>
                        <button onClick={() => handleExportCSV('phone')} className="py-2 px-4 border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-600 transition-colors">
                            電話帳データ(CSV)
                        </button>
                    </div>
                 </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={handleSaveConfig}
                className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-bold shadow-lg shadow-pink-200 transition-all"
              >
                保存して閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {isGuideOpen && <SpreadsheetGuide onClose={() => setIsGuideOpen(false)} />}

      {/* Sidebar: Phone Directory */}
      <div className="w-full md:w-80 bg-white border-r border-indigo-50 flex flex-col h-[40vh] md:h-screen shadow-xl shadow-indigo-100/50 z-20">
        <div className="p-6 bg-white">
          <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight text-slate-800">
            <span className="text-3xl">🐷</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500">
              Supporton
            </span>
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 pl-11 tracking-wide">Your Friendly Support Buddy</p>
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
          {searchResult.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <div className="mb-2 text-2xl">🍃</div>
              データが見つかりません
            </div>
          ) : (
            searchResult.map((entry) => (
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
                  {!config.useGoogleSheets && isEditing && (
                    <button onClick={() => handleDeletePhone(entry.id)} className="text-slate-300 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                  )}
                </div>
                <div className="text-lg font-mono font-bold text-slate-600 tracking-wide select-all cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => copyToClipboard(entry.number)}>
                  {entry.number}
                </div>
                {entry.note && <div className="text-xs text-slate-400 mt-2 pl-2 border-l-2 border-slate-200">{entry.note}</div>}
              </div>
            ))
          )}
        </div>

        {/* Add Phone (Local Only) */}
        {!config.useGoogleSheets && (
            <div className="p-4 border-t border-slate-50 bg-white">
            {isAdding ? (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in bg-slate-50 p-4 rounded-2xl">
                <input className="w-full p-2 text-sm border-none rounded-lg bg-white shadow-sm" placeholder="名称" value={newPhoneName} onChange={e => setNewPhoneName(e.target.value)} />
                <input className="w-full p-2 text-sm border-none rounded-lg bg-white shadow-sm" placeholder="電話番号" value={newPhoneNum} onChange={e => setNewPhoneNum(e.target.value)} />
                <input className="w-full p-2 text-sm border-none rounded-lg bg-white shadow-sm" placeholder="備考" value={newPhoneNote} onChange={e => setNewPhoneNote(e.target.value)} />
                <div className="flex gap-2 pt-2">
                    <select className="p-2 text-sm border-none rounded-lg bg-white shadow-sm text-slate-600" value={newPhoneType} onChange={(e) => setNewPhoneType(e.target.value as PhoneEntryType)}>
                        <option value="safe">安全</option>
                        <option value="warning">注意</option>
                        <option value="danger">危険</option>
                    </select>
                    <button onClick={handleAddPhone} className="flex-1 bg-pink-500 text-white rounded-lg text-sm font-bold shadow-md hover:bg-pink-600">追加</button>
                    <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-200 text-slate-500 rounded-lg hover:bg-slate-300"><X className="w-4 h-4"/></button>
                </div>
                </div>
            ) : (
                <button onClick={() => setIsAdding(true)} className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl text-sm font-bold hover:bg-pink-50 hover:text-pink-500 transition-colors flex items-center justify-center gap-2 border border-dashed border-slate-200">
                <Plus className="w-4 h-4"/> Add New Contact
                </button>
            )}
            </div>
        )}
      </div>

      {/* Main Content: Flowchart */}
      <div className="flex-1 flex flex-col h-[60vh] md:h-screen overflow-hidden relative bg-[#F0F4F8]">
        
        {/* Header Bar */}
        <div className="h-20 bg-white/80 backdrop-blur-md border-b border-white flex items-center justify-between px-8 shadow-sm z-10">
          
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
             {/* Back Button */}
             {path.length > 0 && (
               <button 
                 onClick={() => setPath(path.slice(0, -1))}
                 className="p-3 mr-2 rounded-full bg-white border border-slate-100 text-slate-400 hover:border-pink-200 hover:text-pink-500 hover:shadow-md transition-all shrink-0"
                 title="戻る"
               >
                 <ArrowLeft className="w-5 h-5"/>
               </button>
             )}

             {/* Breadcrumbs */}
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade flex-1 py-2">
                <button 
                  onClick={() => setPath([])} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${path.length === 0 ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-white text-slate-500 hover:bg-indigo-50'}`}
                >
                  <Home className="w-4 h-4"/>
                  Top
                </button>
                {pathNodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    <button 
                      onClick={() => setPath(path.slice(0, index + 1))}
                      className="px-4 py-2 rounded-full text-sm font-bold bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 whitespace-nowrap transition-all shadow-sm border border-slate-100"
                    >
                      {node.title}
                    </button>
                  </React.Fragment>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
             {!config.useGoogleSheets && (
                 <button 
                 onClick={() => setIsEditing(!isEditing)} 
                 className={`p-3 rounded-full transition-all shadow-sm ${isEditing ? 'bg-pink-100 text-pink-600' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                 title="編集モード切替"
                 >
                 <Edit3 className="w-5 h-5"/>
                 </button>
             )}
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="p-3 bg-white text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all shadow-sm border border-slate-100"
               title="設定"
             >
               <Settings className="w-5 h-5"/>
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10 pb-6 min-h-full flex flex-col">
            
            {/* Current Node Title */}
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
                    {currentNode.description && (
                        <p className="text-slate-500 text-lg leading-relaxed max-w-3xl">{currentNode.description}</p>
                    )}
                </div>
            )}

            {/* Answer / Script Section */}
            {showContent && currentNode && (
              <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden animate-in zoom-in-95 duration-500 relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-indigo-400 to-blue-400"></div>
                <div className="p-8 md:p-12">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-indigo-600"/>
                      </div>
                      対応スクリプト
                    </h3>
                    {!config.useGoogleSheets && isEditing && (
                      <button 
                        onClick={editingNodeId === currentNode.id ? handleSaveContent : handleEditContent}
                        className="text-sm font-bold text-pink-500 hover:bg-pink-50 px-4 py-2 rounded-full transition-colors"
                      >
                        {editingNodeId === currentNode.id ? '保存' : '編集'}
                      </button>
                    )}
                  </div>

                  {editingNodeId === currentNode.id ? (
                     <div className="space-y-4">
                       <textarea 
                         className="w-full h-40 p-4 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none resize-none text-slate-700 leading-relaxed shadow-inner"
                         value={editContentText}
                         onChange={(e) => setEditContentText(e.target.value)}
                         placeholder="スクリプトを入力..."
                       />
                       <textarea 
                         className="w-full h-24 p-4 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none resize-none text-sm font-mono text-slate-600 bg-slate-50 shadow-inner"
                         value={editTemplateText}
                         onChange={(e) => setEditTemplateText(e.target.value)}
                         placeholder="コピー用テンプレート（任意）..."
                       />
                     </div>
                  ) : (
                    <div className="space-y-8">
                      {currentNode.content && (
                          <div className="bg-slate-50/50 p-8 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-xl leading-9 text-slate-700 whitespace-pre-wrap font-medium">
                                {currentNode.content}
                            </p>
                          </div>
                      )}
                      
                      {/* Copy Template Button */}
                      {currentNode.template && (
                        <div className="bg-indigo-50/30 rounded-3xl p-6 border border-indigo-100">
                             <div className="flex justify-between items-center mb-4">
                                 <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                    <Copy className="w-3 h-3"/>
                                    Copy Template
                                 </span>
                                 <button 
                                    onClick={() => copyToClipboard(currentNode.template!)}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all shadow-md transform active:scale-95 ${
                                        isCopied ? 'bg-green-500 text-white shadow-green-200' : 'bg-white text-indigo-600 hover:bg-indigo-500 hover:text-white hover:shadow-indigo-200'
                                    }`}
                                 >
                                    {isCopied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                                    {isCopied ? 'Copied!' : '定型文をコピー'}
                                 </button>
                             </div>
                             <div className="text-sm text-slate-600 font-mono whitespace-pre-wrap bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                {currentNode.template}
                             </div>
                        </div>
                      )}
                      
                      {/* Material Selection (Only if configured) */}
                      {currentNode.title.includes('資料') && (
                          <div className="mt-8 pt-8 border-t border-slate-100">
                              <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                                <div className="bg-orange-100 p-2 rounded-xl">
                                  <FileCog className="w-5 h-5 text-orange-500"/>
                                </div>
                                送付資料を選択
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                  {APP_DATA.materials.map(m => (
                                      <label key={m.id} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                                          selectedMaterialIds.includes(m.id) ? 'bg-orange-50 border-orange-200 shadow-md transform -translate-y-1' : 'bg-white border-slate-100 hover:bg-slate-50 hover:shadow-sm'
                                      }`}>
                                          <div onClick={() => {
                                              setSelectedMaterialIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])
                                          }}>
                                              {selectedMaterialIds.includes(m.id) ? 
                                                <CheckSquare className="w-6 h-6 text-orange-500"/> : 
                                                <Square className="w-6 h-6 text-slate-300"/>
                                              }
                                          </div>
                                          <span className="font-bold text-slate-700">{m.name}</span>
                                          <a href={m.url} target="_blank" rel="noreferrer" className="ml-auto text-slate-300 hover:text-orange-500 bg-white p-1 rounded-full shadow-sm">
                                              <ExternalLink className="w-4 h-4"/>
                                          </a>
                                      </label>
                                  ))}
                              </div>
                              <div className="bg-slate-800 rounded-3xl p-6 text-slate-300 font-mono text-xs relative group shadow-xl">
                                  <button 
                                    onClick={() => copyToClipboard(generateMaterialText())}
                                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors backdrop-blur-sm"
                                    title="メール文面をコピー"
                                  >
                                      <Copy className="w-4 h-4"/>
                                  </button>
                                  <pre className="whitespace-pre-wrap leading-relaxed">{generateMaterialText() || '資料を選択するとメール文面が生成されます'}</pre>
                              </div>
                          </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Child Nodes (Grid) */}
            {(!isLeaf || !hasContent) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentNode?.children?.map((child) => {
                    // カラークラスの処理：bg-xxx-500 を取得し、それをパステル調の背景色と濃い文字色に変換する
                    // 例: bg-blue-500 -> bg-blue-50 text-blue-600
                    const colorClass = child.color || 'bg-indigo-500';
                    const baseColor = colorClass.replace('bg-', '').replace('-500', '').replace('-600', '').replace('-700', '').replace('-800', '');
                    const pastelBg = `bg-${baseColor}-50`;
                    const textColor = `text-${baseColor}-600`;
                    const iconBg = `bg-${baseColor}-100`;

                    return (
                        <button
                        key={child.id}
                        onClick={() => setPath([...path, child.id])}
                        className={`
                            relative group overflow-hidden rounded-[2rem] p-8 text-left transition-all duration-300
                            bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1
                        `}
                        >
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm ${child.color ? `${iconBg} ${textColor}` : 'bg-slate-100 text-slate-500'}`}>
                                <IconComponent name={child.icon} className="w-8 h-8" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-700 mb-2 group-hover:text-pink-500 transition-colors">{child.title}</h3>
                            {child.description && (
                                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{child.description}</p>
                            )}

                            {/* Decorative Circle */}
                            <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-10 ${child.color || 'bg-slate-200'} blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
                        </div>
                        
                        {!config.useGoogleSheets && isEditing && (
                            <div 
                            className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-2 rounded-2xl shadow-sm backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                            >
                                <button onClick={() => deleteChildNode(currentNode.id, child.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        )}
                        </button>
                    );
                })}

                {/* Add Button (Local Only) */}
                {!config.useGoogleSheets && isEditing && (
                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center text-slate-400 hover:border-pink-300 hover:text-pink-400 transition-colors bg-white/50">
                        {isAdding ? (
                            <div className="w-full space-y-3 animate-in zoom-in-95">
                                <input 
                                    autoFocus
                                    className="w-full p-3 text-center bg-white border border-pink-200 rounded-2xl focus:ring-4 focus:ring-pink-100 outline-none text-slate-700 font-bold"
                                    placeholder="項目名を入力..."
                                    value={newItemText}
                                    onChange={(e) => setNewItemText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddChild()}
                                />
                                <div className="flex gap-2 justify-center">
                                    <button onClick={handleAddChild} className="px-6 py-2 bg-pink-500 text-white rounded-full text-sm font-bold shadow-md hover:bg-pink-600">追加</button>
                                    <button onClick={() => setIsAdding(false)} className="px-6 py-2 bg-white border border-slate-200 text-slate-500 rounded-full text-sm font-bold hover:bg-slate-50">キャンセル</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setIsAdding(true)} className="flex flex-col items-center gap-3 w-full h-full justify-center py-8">
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-pink-50 transition-colors">
                                    <Plus className="w-8 h-8"/>
                                </div>
                                <span className="font-bold text-lg">新しい項目を追加</span>
                            </button>
                        )}
                    </div>
                )}
                </div>
            )}
            
            {/* Copyright Footer */}
            <div className="mt-auto pt-6 text-center text-slate-300 text-xs font-bold font-mono tracking-widest">
              ©toyosystem
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}