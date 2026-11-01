import React, { useState, useEffect } from 'react';
import { Barcode, Boxes, Shapes } from 'lucide-react';
import { ProductGroupsPage } from './ProductGroupsPage';
import { ProductsPage } from './ProductsPage';

export type GoodsTabType = 'product-groups' | 'products';

interface GoodsManagementPageProps {
  initialTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const GoodsManagementPage: React.FC<GoodsManagementPageProps> = ({
  initialTab,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<GoodsTabType>(() => {
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    if (hash === 'product-groups' || hash === 'categories' || hash === 'product-types') {
      return 'product-groups';
    }
    if (hash === 'products') {
      return 'products';
    }
    if (initialTab === 'product-groups' || initialTab === 'categories' || initialTab === 'product-types') {
      return 'product-groups';
    }
    if (initialTab === 'products') {
      return 'products';
    }
    const saved = localStorage.getItem('nk_goods_management_tab');
    if (saved === 'product-groups') {
      return 'product-groups';
    }
    return 'products';
  });

  useEffect(() => {
    if (initialTab === 'product-groups' || initialTab === 'categories' || initialTab === 'product-types') {
      setActiveTab('product-groups');
    } else if (initialTab === 'products') {
      setActiveTab('products');
    }
  }, [initialTab]);

  const handleTabChange = (tab: GoodsTabType) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('nk_goods_management_tab', tab);
      if (window.location.hash !== `#/${tab}`) {
        window.location.hash = `/${tab}`;
      }
    } catch (e) {
      console.error(e);
    }
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const masterHeader = (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#EA332A] to-[#F87171] text-white flex items-center justify-center font-bold shadow-sm shadow-red-500/20 flex-shrink-0">
          <Boxes className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
              Quản Lý Hàng Hóa
            </h1>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200 leading-none">
              2 Phân Hệ
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5 font-medium">
            Quản lý tập trung nhóm loại hàng hóa và danh mục sản phẩm chi tiết (SKU Master)
          </p>
        </div>
      </div>

      {/* 2 TABS DẠNG PILL SEGMENTED CONTROL */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full">
        <div className="pill-nav shadow-xs" style={{ padding: '2px', gap: '2px' }}>
          <button
            type="button"
            id="tab-goods-groups"
            onClick={() => handleTabChange('product-groups')}
            className={`pill-tab-item flex items-center gap-1.5 ${
              activeTab === 'product-groups' ? 'pill-tab-item-active active' : ''
            }`}
            style={{ padding: '4px 12px', fontSize: '12.5px' }}
          >
            <Shapes className={`w-3.5 h-3.5 ${activeTab === 'product-groups' ? 'text-white' : 'text-amber-600'}`} />
            <span className="font-semibold">Nhóm loại</span>
          </button>

          <button
            type="button"
            id="tab-goods-products"
            onClick={() => handleTabChange('products')}
            className={`pill-tab-item flex items-center gap-1.5 ${
              activeTab === 'products' ? 'pill-tab-item-active active' : ''
            }`}
            style={{ padding: '4px 12px', fontSize: '12.5px' }}
          >
            <Barcode className={`w-3.5 h-3.5 ${activeTab === 'products' ? 'text-white' : 'text-emerald-600'}`} />
            <span className="font-semibold">Hàng hóa</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tab-content-wrapper flex flex-col flex-1 min-h-0">
      {activeTab === 'product-groups' && <ProductGroupsPage headerSlot={masterHeader} />}
      {activeTab === 'products' && <ProductsPage headerSlot={masterHeader} />}
    </div>
  );
};
