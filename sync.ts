
import Papa from 'papaparse';
import { FlowNode, PhoneEntry, FlowCSVRow, PhoneEntryType } from './types';

const DEFAULT_COLOR_MAP: { [key: string]: string } = {
  '青': 'bg-blue-500', 'ブルー': 'bg-blue-500', 'blue': 'bg-blue-500',
  '赤': 'bg-red-500', 'レッド': 'bg-red-500', 'red': 'bg-red-500',
  'ピンク': 'bg-pink-500', 'pink': 'bg-pink-500',
  '緑': 'bg-green-500', 'グリーン': 'bg-green-500', 'green': 'bg-green-500',
  '黄': 'bg-yellow-500', 'イエロー': 'bg-yellow-500',
};

const DEFAULT_ICON_MAP: { [key: string]: string } = {
  '電話': 'Phone', 'phone': 'Phone', 'スマホ': 'Smartphone',
  '電気': 'Zap', 'zap': 'Zap', 'ガス': 'Flame', 'gas': 'Flame',
  '水': 'Droplet', '水道': 'Droplet', 'wifi': 'Wifi', '回線': 'Wifi',
  'PC': 'Monitor', 'ヘルプ': 'HelpCircle', 'チェック': 'CheckCircle',
  '注意': 'AlertCircle', '警告': 'AlertTriangle', 'ホーム': 'Home',
  '設定': 'Settings', '検索': 'Search', 'リンク': 'ExternalLink',
};

export async function fetchFlowDataWithConfig(dataUrl: string, configUrl: string): Promise<FlowNode | null> {
  try {
    const dataCsv = await fetchCSVText(dataUrl);
    if (!dataCsv) return null;

    let configCsv: string | null = null;
    if (configUrl) configCsv = await fetchCSVText(configUrl);

    const colorMap = { ...DEFAULT_COLOR_MAP };
    const iconMap = { ...DEFAULT_ICON_MAP };

    if (configCsv) {
      const configResult = Papa.parse<any>(configCsv, { header: true, skipEmptyLines: true });
      configResult.data.forEach((row: any) => {
        const label = row['ラベル'] || row['名称'] || row['キー'];
        const value = row['値'] || row['value'];
        if (label && value) {
          const tL = label.trim();
          const tV = value.trim();
          if (tV.startsWith('bg-')) colorMap[tL] = tV;
          else iconMap[tL] = tV;
        }
      });
    }

    const dataResult = Papa.parse<any>(dataCsv, { header: true, skipEmptyLines: true });
    const rows = dataResult.data;
    const nodeMap = new Map<string, FlowNode>();
    const titleToNodesMap = new Map<string, FlowNode[]>();
    const rootChildren: FlowNode[] = [];

    rows.forEach((row: any, index: number) => {
      const title = row['タイトル']?.trim();
      if (!title) return;
      const uniqueId = `${title}_${index}`;
      const node: FlowNode = {
        id: uniqueId,
        title: title,
        content: row['本文'] || undefined,
        template: row['テンプレート'] || undefined,
        icon: iconMap[row['アイコン']?.trim()] || row['アイコン']?.trim() || undefined,
        color: colorMap[row['色']?.trim()] || row['色']?.trim() || undefined,
        description: row['説明'] || row['補足'] || undefined,
        children: []
      };
      nodeMap.set(uniqueId, node);
      if (!titleToNodesMap.has(title)) titleToNodesMap.set(title, []);
      titleToNodesMap.get(title)!.push(node);
    });

    rows.forEach((row: any, index: number) => {
      const title = row['タイトル']?.trim();
      if (!title) return;
      const node = nodeMap.get(`${title}_${index}`);
      if (!node) return;
      const parentName = row['親カテゴリ']?.trim();
      if (parentName && parentName !== 'root' && parentName !== 'ルート' && parentName !== '-') {
        const parents = titleToNodesMap.get(parentName);
        if (parents && parents.length > 0) {
          if (!parents[0].children) parents[0].children = [];
          parents[0].children.push(node);
        } else rootChildren.push(node);
      } else rootChildren.push(node);
    });

    return { id: 'root', title: 'ルート', type: 'root', children: rootChildren };
  } catch (error) {
    console.error("Fetch Flow Data Error:", error);
    return null;
  }
}

export async function fetchPhoneDataFromCSV(url: string): Promise<PhoneEntry[] | null> {
  try {
    const csvText = await fetchCSVText(url);
    if (!csvText) return null;
    const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    return data.map((row: any) => ({
      id: row.id || row.number || Date.now().toString(),
      name: row.name || row['名称'] || '',
      number: row.number || row['電話番号'] || '',
      note: row.note || row['備考'] || '',
      type: (row.type === 'danger' || row.type === 'warning' ? row.type : 'safe') as PhoneEntryType
    }));
  } catch (error) {
    console.error("Fetch Phone Data Error:", error);
    return null;
  }
}

export async function fetchCSVText(url: string): Promise<string | null> {
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  const fetchUrl = `${url}${separator}_t=${Date.now()}`;
  try {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
  } catch (e) {
      console.warn(`Fetch failed for ${url}`, e);
      throw e; // throw error to be handled by caller
  }
}

export function exportFlowDataToCSV(root: FlowNode): string {
  const rows: any[] = [];
  function traverse(node: FlowNode, pId: string) {
    rows.push({ id: node.id, parentId: pId, title: node.title, content: node.content, template: node.template });
    if (node.children) node.children.forEach(c => traverse(c, node.id));
  }
  if (root) traverse(root, '');
  return Papa.unparse(rows);
}

export function exportPhoneDataToCSV(entries: PhoneEntry[]): string {
  return Papa.unparse(entries);
}
