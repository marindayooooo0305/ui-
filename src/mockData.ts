import { UploadedFile, Rule } from './types';

// Let's create realistic rows for our sample files so the user can see them processed
export const mockFiles: UploadedFile[] = [
  {
    id: 'q3_financials',
    name: 'Q3_Financials_v2.xlsx',
    size: '2.4 MB',
    time: '今天, 10:42 AM',
    status: 'pending',
    progress: 0,
    columns: ['DateCreated', 'Transactions', 'Revenue', 'Region', 'Notes'],
    originalData: [
      {
        DateCreated: '05/12/2026',
        Transactions: '1,240',
        Revenue: '$15320.50',
        Region: 'North America',
        Notes: 'Quarterly audit passed successfully.\nRequires double verification.'
      },
      {
        DateCreated: '2026.04.18',
        Transactions: '890',
        Revenue: '$9410.00',
        Region: 'European Union',
        Notes: 'Invoice issued by third party.\nTo be synced.'
      },
      {
        DateCreated: '12-Oct-2025',
        Transactions: '2,310',
        Revenue: '$43200.15',
        Region: 'Asia Pacific',
        Notes: 'Record transactions completed.\nOvercapacity warnings recorded.'
      },
      {
        DateCreated: '2025/11/30',
        Transactions: '1,560',
        Revenue: '$21050.80',
        Region: 'LatAm',
        Notes: 'Pending approval from VP.\nClose processing.'
      }
    ]
  },
  {
    id: 'customer_export',
    name: 'Customer_Data_Export.csv',
    size: '840 KB',
    time: '昨天, 4:15 PM',
    status: 'pending',
    progress: 0,
    columns: ['CustomerName', 'Email', 'JoinedDate', 'Description', 'PhoneNumber'],
    originalData: [
      {
        CustomerName: 'Alice Cheng',
        Email: 'alice.c@outlook.com',
        JoinedDate: '2026-01-14',
        Description: '<div>Active subscriber</div><span class="badge">VVIP Class</span>',
        PhoneNumber: '123-456-7890'
      },
      {
        CustomerName: 'Benjamin Miller',
        Email: 'ben.miller@gmail.com',
        JoinedDate: 'Mar 15, 2025',
        Description: '<p>Standard user</p> <span class="badge">Newsletter subscribed</span>',
        PhoneNumber: '+1 (555) 019-2834'
      },
      {
        CustomerName: 'Diana Prince',
        Email: 'diana@amazon.com',
        JoinedDate: '2025.12.01',
        Description: '🛡️ Highly valued enterprise account. <strong>Do not disturb during holidays.</strong>',
        PhoneNumber: '(415) 888-0112'
      },
      {
        CustomerName: 'Ethan Hunt',
        Email: 'ethan.h@imf.org',
        JoinedDate: '09/08/2024',
        Description: '<a href="/users/ethan">Secret Profile</a>',
        PhoneNumber: '+44 7911 123456'
      }
    ]
  },
  {
    id: 'inventory_master',
    name: 'Inventory_Master_List.xlsx',
    size: '1.1 MB',
    time: '10月 12, 2023',
    status: 'pending',
    progress: 0,
    columns: ['ItemId', 'Name', 'StockLevel', 'UnitCost', 'Warehouse'],
    originalData: [
      {
        ItemId: 'INV-001',
        Name: 'Cybernetic Armature X-1',
        StockLevel: '143',
        UnitCost: '$450.00',
        Warehouse: 'Shanghai Logistics Hub'
      },
      {
        ItemId: 'INV-002',
        Name: 'Quantum Heat Dissipator',
        StockLevel: '52',
        UnitCost: '$1,299.99',
        Warehouse: 'Tokyo Bay Depository'
      },
      {
        ItemId: 'INV-003',
        Name: 'Tactile Sensory Visor v4',
        StockLevel: '810',
        UnitCost: '$89.50',
        Warehouse: 'Frankfurt Central Depot'
      },
      {
        ItemId: 'INV-004',
        Name: 'Nano-Particle Shield Generator',
        StockLevel: '12',
        UnitCost: '$5,400.00',
        Warehouse: 'Silicon Valley Forge'
      }
    ]
  }
];

export const defaultRules: Rule[] = [
  {
    id: 'find_replace',
    type: 'replace',
    name: '查找与替换',
    description: '目标: "\\n", 替换为: " "',
    enabled: true,
    config: {
      targetCol: 'Notes',
      findText: '\\n',
      replaceText: ' ',
      regexEnabled: true
    }
  },
  {
    id: 'col_format',
    type: 'format',
    name: '列格式化',
    description: "将 'DateCreated' 转换为 ISO-8601",
    enabled: true,
    config: {
      targetCol: 'DateCreated',
      formatType: 'date-iso'
    }
  },
  {
    id: 'add_watermark',
    type: 'watermark',
    name: '添加水印 / 尾缀',
    description: '不透明度: 15%, 位置: 右下角 (或尾部附加)',
    enabled: false,
    config: {
      targetCol: 'Revenue',
      watermarkText: ' [PRO已核验]',
      watermarkOpacity: 0.15,
      watermarkPosition: 'suffix'
    }
  },
  {
    id: 'strip_html',
    type: 'html',
    name: '去除 HTML 标签',
    description: '目标列: Description, Notes',
    enabled: false,
    config: {
      targetCol: 'Description',
      htmlStripCols: ['Description', 'Notes']
    }
  }
];
