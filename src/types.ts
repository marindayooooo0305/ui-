export interface Rule {
  id: string;
  type: 'replace' | 'format' | 'watermark' | 'html' | 'ai';
  name: string;
  description: string;
  enabled: boolean;
  config: {
    targetCol?: string; // name of excel/csv column to transform. If empty, apply to all text cells
    findText?: string;
    replaceText?: string;
    regexEnabled?: boolean;
    formatType?: 'date-iso' | 'uppercase' | 'lowercase' | 'trim' | 'number-std' | 'round';
    watermarkText?: string;
    watermarkOpacity?: number; // e.g. 0.15
    watermarkPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'suffix';
    htmlStripCols?: string[]; // columns to strip HTML tags
    aiPrompt?: string; // customize AI-based operations
  };
}

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  time: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  progress: number;
  originalData: Record<string, string>[]; // Row objects matching column fields
  processedData?: Record<string, string>[]; // Output after rules
  columns: string[]; // List of header columns discovered
}

export interface SubscriptionState {
  isPro: boolean;
  plan: 'annual' | 'monthly' | null;
}
