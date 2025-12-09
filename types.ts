
export interface FlowNode {
  id: string;
  title: string;
  type?: string;
  icon?: string;
  color?: string;
  description?: string;
  content?: string;
  template?: string;
  children?: FlowNode[];
}

export type PhoneEntryType = 'safe' | 'warning' | 'danger';

export interface PhoneEntry {
  id: string;
  number: string;
  name: string;
  note: string;
  type: PhoneEntryType;
}

export interface IconComponentProps {
  name?: string;
  className?: string;
}

// Google Sheets連携用のフラットデータ型
export interface FlowCSVRow {
  id: string;
  parentId: string;
  title: string;
  content: string;
  template: string;
  icon: string;
  color: string;
  description: string;
  [key: string]: string | undefined; // 拡張性を考慮
}

export interface AppConfig {
  useGoogleSheets: boolean;
  flowSheetUrl: string;
  flowConfigSheetUrl?: string; // 定義シート用URL（任意）
  phoneSheetUrl: string;
}
