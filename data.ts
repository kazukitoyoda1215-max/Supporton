import { FlowNode, PhoneEntry } from './types';

// --- データ定義ファイル ---
// このファイルを編集すると、アプリのコンテンツ（フローチャート、定型文、電話番号）が更新されます。

export const APP_DATA: {
  flowData: FlowNode;
  phoneData: PhoneEntry[];
  materials: { id: string; name: string; url: string; }[];
} = {
  // ■ 1. 商材データ（資料送付用）
  materials: [
    { id: 'platinum', name: 'プラチナでんき', url: 'https://platinadenki.com/' },
    { id: 'tokyu', name: '東急ガス', url: 'https://www.tokyu-ps.co.jp/home/denkigas/' },
    { id: 'qenest', name: 'キューエネスでんき', url: 'https://www.qenest-denki.com/' },
    { id: 'upower', name: 'U-POWER', url: 'https://u-power.jp/service/home.html' },
    { id: 'sutoene', name: 'ストエネ', url: 'https://sutoene-service.jp/service/electricity/' },
  ],

  // ■ 2. 電話番号リスト
  phoneData: [
    { id: 'ft_elec', number: '050-1790-0165', name: 'FT発信（電気・ガス）', note: '名乗り：すまえる', type: 'safe' },
    { id: 'ft_net', number: '050-1781-0028', name: 'FT（回線）', note: 'ファーストチーム担当窓口', type: 'safe' },
    { id: 'sm_sto', number: '050-5785-7954', name: 'すまえる（ストエネ）', note: '担当窓口', type: 'safe' },
    { id: 'sm_sup', number: '050-5785-7964', name: 'すまえる（スマサポ・ベンダー・すま直）', note: '担当窓口', type: 'safe' },
    { id: 'sm_itn', number: '050-5785-7963', name: 'すまえる（イタンジ）', note: '担当窓口', type: 'safe' },
    { id: 'itn_out_ap', number: '050-5785-7984', name: 'イタンジ（AP発信）', note: '現行の発信番号', type: 'safe' },
    { id: 'itn_out_rusu1', number: '050-5785-8001', name: 'イタンジ（長期留守）', note: '長期留守時の発信番号', type: 'safe' },
    { id: 'itn_out_rusu2', number: '0800-080-4004', name: 'イタンジ（長期留守②）', note: '長期留守時の発信番号②', type: 'safe' },
  ],

  // ■ 3. フローチャート＆対応スクリプト・定型文
  // ※スプレッドシート連携を基本とするため、初期データはルートのみとしています。
  flowData: {
    id: 'root',
    title: 'ルート',
    type: 'root',
    children: []
  }
};