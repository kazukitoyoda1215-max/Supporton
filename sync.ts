import Papa from 'papaparse';
import { FlowNode, PhoneEntry, FlowCSVRow, PhoneEntryType } from './types';

// --- デフォルト変換マップ（アプリ内保持） ---
const DEFAULT_COLOR_MAP: { [key: string]: string } = {
  // 青系
  '青': 'bg-blue-500', 'ブルー': 'bg-blue-500', 'blue': 'bg-blue-500',
  '水色': 'bg-cyan-500', 'シアン': 'bg-cyan-500', 'cyan': 'bg-cyan-500', '空色': 'bg-sky-500',
  'インディゴ': 'bg-indigo-500', 'indigo': 'bg-indigo-500', '紺': 'bg-indigo-700',
  
  // 赤・ピンク系
  '赤': 'bg-red-500', 'レッド': 'bg-red-500', 'red': 'bg-red-500',
  '桃': 'bg-pink-500', 'ピンク': 'bg-pink-500', 'pink': 'bg-pink-500',
  'ローズ': 'bg-rose-500',
  
  // 緑系
  '緑': 'bg-green-500', 'グリーン': 'bg-green-500', 'green': 'bg-green-500',
  '深緑': 'bg-emerald-600', 'エメラルド': 'bg-emerald-500',
  '黄緑': 'bg-lime-500', 'ライム': 'bg-lime-500',
  'ティール': 'bg-teal-500', 'teal': 'bg-teal-500',
  
  // 黄・オレンジ系
  '黄': 'bg-yellow-500', 'イエロー': 'bg-yellow-500', 'yellow': 'bg-yellow-500',
  '橙': 'bg-orange-500', 'オレンジ': 'bg-orange-500', 'orange': 'bg-orange-500',
  '琥珀': 'bg-amber-500', 'アンバー': 'bg-amber-500',
  
  // 紫系
  '紫': 'bg-purple-500', 'パープル': 'bg-purple-500', 'purple': 'bg-purple-500',
  'バイオレット': 'bg-violet-500', '藤色': 'bg-fuchsia-500',
  
  // モノトーン
  '黒': 'bg-slate-800', 'ブラック': 'bg-slate-800', 'black': 'bg-slate-800',
  'グレー': 'bg-slate-500', '灰': 'bg-slate-500', 'gray': 'bg-slate-500',
  'シルバー': 'bg-slate-400',
};

const DEFAULT_ICON_MAP: { [key: string]: string } = {
  // 通信・インフラ
  '電話': 'Phone', 'phone': 'Phone', 'スマホ': 'Smartphone', '携帯': 'Smartphone',
  '電気': 'Zap', '電力': 'Zap', 'zap': 'Zap', '雷': 'Zap',
  'ガス': 'Flame', 'gas': 'Flame', '火': 'Flame',
  '水': 'Droplet', '水道': 'Droplet', 'ウォーターサーバー': 'Droplet', 'water': 'Droplet',
  'ネット': 'Wifi', 'インターネット': 'Wifi', 'wifi': 'Wifi', '回線': 'Wifi', 'ルーター': 'Wifi',
  'PC': 'Monitor', 'パソコン': 'Monitor', '画面': 'Monitor',
  
  // アクション・状態
  'ヘルプ': 'HelpCircle', 'help': 'HelpCircle', 'はてな': 'HelpCircle', '？': 'HelpCircle',
  'チェック': 'CheckCircle', 'check': 'CheckCircle', 'OK': 'CheckCircle',
  '注意': 'AlertCircle', 'alert': 'AlertCircle', '警告': 'AlertTriangle', 'NG': 'XCircle',
  '停止': 'XCircle', 'バツ': 'XCircle',
  
  // ドキュメント・フォルダ
  '書類': 'FileText', '資料': 'FileText', 'file': 'FileText', 'ページ': 'FileText',
  'フォルダ': 'Folder', 'folder': 'Folder', 'カテゴリ': 'Folder',
  
  // その他
  'ホーム': 'Home', '家': 'Home', 'Top': 'Home',
  '設定': 'Settings', '歯車': 'Settings',
  'ユーザー': 'User', '人': 'User',
  'メール': 'Mail', '手紙': 'Mail',
  '検索': 'Search', '虫眼鏡': 'Search',
  'リンク': 'ExternalLink',
  'クレジット': 'CreditCard', '支払い': 'CreditCard', 'カード': 'CreditCard',
  '時計': 'Clock', '時間': 'Clock',
  'カレンダー': 'Calendar', '日付': 'Calendar',
};

// --- データ取得・パース処理 ---

/**
 * 従来のIDベースCSV取得（互換性のため残存させるが、基本は下のWithConfigを使用推奨）
 */
export async function fetchFlowDataFromCSV(url: string): Promise<FlowNode | null> {
  try {
    const csvText = await fetchCSVText(url);
    if (!csvText) return null;

    const { data } = Papa.parse<FlowCSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    return buildTreeFromCSV(data);
  } catch (error) {
    console.warn("Failed to fetch/parse flow data:", error);
    return null;
  }
}

/**
 * 新・日本語カラム対応データ取得処理
 * Dataシート: 日本語ヘッダー (タイトル, 親カテゴリ, etc.)
 * Config(Master)シート: 変換ルール (ラベル, 値)
 */
export async function fetchFlowDataWithConfig(dataUrl: string, configUrl: string): Promise<FlowNode | null> {
  try {
    // 1. データシート取得（必須）
    const dataCsv = await fetchCSVText(dataUrl);
    if (!dataCsv) {
      console.warn("データシートを取得できませんでした。URLを確認してください。");
      return null;
    }

    // 2. マスタシート取得（任意）- 失敗しても続行
    let configCsv: string | null = null;
    if (configUrl) {
        configCsv = await fetchCSVText(configUrl);
    }

    // 3. マスタデータの解析とマップ作成
    const colorMap = { ...DEFAULT_COLOR_MAP };
    const iconMap = { ...DEFAULT_ICON_MAP };

    if (configCsv) {
      const configResult = Papa.parse<any>(configCsv, { header: true, skipEmptyLines: true });
      configResult.data.forEach((row: any) => {
        const label = row['ラベル'] || row['表示名'] || row['label'] || row['名称'] || row['キー'];
        const value = row['値'] || row['システム値'] || row['value'] || row['コード'];

        if (label && value) {
          const trimmedLabel = label.trim();
          const trimmedValue = value.trim();
          if (trimmedValue.startsWith('bg-')) {
            colorMap[trimmedLabel] = trimmedValue;
          } else {
            iconMap[trimmedLabel] = trimmedValue;
          }
        }
      });
    }

    // 4. データシートの解析
    const dataResult = Papa.parse<any>(dataCsv, { header: true, skipEmptyLines: true });
    const rows = dataResult.data;

    // 5. ノード生成とマップ作成
    // IDは「タイトル_行番号」で生成して一意にする（タイトル自体の重複は許可する）
    const nodeMap = new Map<string, FlowNode>(); // Key: UniqueID
    const titleToNodesMap = new Map<string, FlowNode[]>(); // Key: Title -> Nodes[] (親検索用)
    const rootChildren: FlowNode[] = [];

    // Pass 1: ノード作成と登録
    rows.forEach((row: any, index: number) => {
      const title = row['タイトル']?.trim();
      
      // タイトルが無い行はスキップ
      if (!title) return;

      // ユニークID生成 (タイトル + 行番号)
      // 行番号(index)を使うことで、同じタイトルでも別々のノードとして扱える
      const uniqueId = `${title}_${index}`;

      const colorLabel = row['色']?.trim();
      const iconLabel = row['アイコン']?.trim();

      const node: FlowNode = {
        id: uniqueId,
        title: title,
        content: row['本文'] || undefined,
        template: row['テンプレート'] || undefined,
        icon: iconMap[iconLabel] || iconLabel || undefined,
        color: colorMap[colorLabel] || colorLabel || undefined,
        description: row['説明'] || row['補足'] || undefined,
        children: []
      };

      nodeMap.set(uniqueId, node);
      
      // 親検索用にタイトルでインデックス
      if (!titleToNodesMap.has(title)) {
        titleToNodesMap.set(title, []);
      }
      titleToNodesMap.get(title)!.push(node);
    });

    // Pass 2: 親子関係の構築
    rows.forEach((row: any, index: number) => {
      const title = row['タイトル']?.trim();
      if (!title) return;

      const uniqueId = `${title}_${index}`;
      const node = nodeMap.get(uniqueId);
      if (!node) return;

      const parentName = row['親カテゴリ']?.trim();

      // 親カテゴリ指定がある場合
      if (parentName && parentName !== 'root' && parentName !== 'ルート' && parentName !== '-') {
        // 親タイトルを持つノードを検索
        const potentialParents = titleToNodesMap.get(parentName);

        if (!potentialParents || potentialParents.length === 0) {
            console.warn(`親カテゴリ「${parentName}」が見つかりません（子: ${title}）。ルートに配置します。`);
            rootChildren.push(node);
        } else if (potentialParents.length === 1) {
            // 親が1つだけ見つかった場合（正常）
            const parentNode = potentialParents[0];
            if (!parentNode.children) parentNode.children = [];
            parentNode.children.push(node);
        } else {
            // 親タイトルが重複している場合
            // どの親の下につくべきか判断できないためエラーとする
            throw new Error(
              `親カテゴリ曖昧エラー: 「${title}」の親として指定された「${parentName}」という項目が複数存在します。\n` +
              `「親」になる項目のタイトルは重複しないようにしてください。（末端の選択肢などは重複していても構いません）`
            );
        }
      } else {
        // 親指定がない、または明示的にルート指定の場合はルート直下
        rootChildren.push(node);
      }
    });

    return {
      id: 'root',
      title: 'ルート',
      type: 'root',
      children: rootChildren
    };

  } catch (error) {
    console.warn("Failed to process flow data:", error);
    throw error;
  }
}

export async function fetchPhoneDataFromCSV(url: string): Promise<PhoneEntry[] | null> {
  try {
    const csvText = await fetchCSVText(url);
    if (!csvText) return null;

    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    
    return data.map((row: any) => ({
      id: row.id || row.number || Date.now().toString(),
      name: row.name || row['名称'] || row['名前'] || '',
      number: row.number || row['電話番号'] || '',
      note: row.note || row['備考'] || row['メモ'] || '',
      type: (row.type === 'danger' || row.type === 'warning' ? row.type : 'safe') as PhoneEntryType
    }));
  } catch (error) {
    console.warn("Failed to fetch phone data:", error);
    return null;
  }
}

async function fetchCSVText(url: string): Promise<string | null> {
  let fetchUrl = url;
  // Google Sheetsのキャッシュ対策としてタイムスタンプを付与
  const separator = fetchUrl.includes('?') ? '&' : '?';
  fetchUrl = `${fetchUrl}${separator}_t=${Date.now()}`;

  try {
      // cache: 'no-store' を指定してブラウザキャッシュも回避
      const response = await fetch(fetchUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.text();
  } catch (e) {
      console.warn(`Fetch failed for ${url}`, e);
      return null;
  }
}

// --- 旧ロジック（互換性維持） ---
function buildTreeFromCSV(rows: FlowCSVRow[]): FlowNode | null {
  const nodeMap = new Map<string, FlowNode>();
  let rootNode: FlowNode | null = null;

  rows.forEach(row => {
    const cleanRow = {
      id: row.id?.trim(),
      title: row.title?.trim(),
      parentId: row.parentId?.trim(),
    };
    if(!cleanRow.id) return;

    const node: FlowNode = {
      id: cleanRow.id,
      title: cleanRow.title || 'No Title',
      content: row.content || undefined,
      template: row.template || undefined,
      icon: row.icon || undefined,
      color: row.color || undefined,
      description: row.description || undefined,
      children: []
    };
    nodeMap.set(cleanRow.id, node);
  });

  rows.forEach(row => {
    const id = row.id?.trim();
    const parentId = row.parentId?.trim();
    if (!id) return;
    const node = nodeMap.get(id);
    if (!node) return;

    if (!parentId && id === 'root') {
      rootNode = node;
    } else if (parentId) {
      const parent = nodeMap.get(parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else if(parentId === 'root' && !rootNode && id === 'root') {
          rootNode = node;
      }
    }
  });

  if (!rootNode && nodeMap.has('root')) {
    rootNode = nodeMap.get('root') || null;
  }
  return rootNode;
}

export function exportFlowDataToCSV(root: FlowNode): string {
  const rows: any[] = [];
  function traverse(node: FlowNode, parentId: string) {
    rows.push({
      id: node.id,
      parentId: parentId,
      title: node.title || '',
      content: node.content || '',
      template: node.template || '',
      icon: node.icon || '',
      color: node.color || '',
      description: node.description || ''
    });
    if (node.children) node.children.forEach(child => traverse(child, node.id));
  }
  if (root) traverse(root, '');
  return Papa.unparse(rows);
}

export function exportPhoneDataToCSV(entries: PhoneEntry[]): string {
  return Papa.unparse(entries.map(e => ({
    id: e.id,
    name: e.name,
    number: e.number,
    note: e.note,
    type: e.type
  })));
}