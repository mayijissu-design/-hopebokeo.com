import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { Language } from '../types';

interface NetworkStatusBarProps {
  isOnline: boolean;
  wasOffline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  language: Language;
  onManualSync: () => void;
}

export const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({
  isOnline,
  wasOffline,
  isSyncing,
  lastSyncTime,
  language,
  onManualSync,
}) => {
  const [dismissedOfflineWarning, setDismissedOfflineWarning] = useState(false);

  // If online and not currently syncing and hasn't recently recovered from offline, stay hidden
  if (isOnline && !isSyncing && !wasOffline) {
    return null;
  }

  // If offline
  if (!isOnline) {
    if (dismissedOfflineWarning) {
      return (
        <button
          onClick={() => setDismissedOfflineWarning(false)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/90 text-white rounded-full shadow-lg text-xs font-medium backdrop-blur-sm hover:bg-amber-700 transition"
          title="ໂໝດອອບລາຍ (ບໍ່ມີສັນຍານ)"
        >
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>{language === 'lo' ? 'ອອບລາຍ' : language === 'th' ? 'ออฟไลน์' : 'Offline'}</span>
        </button>
      );
    }

    return (
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 text-white px-3 py-2 text-xs sm:text-sm font-medium shadow-md transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-full shrink-0">
              <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-100 animate-pulse" />
            </div>
            <div>
              <span className="font-bold">
                {language === 'lo'
                  ? 'ໂໝດອອບລາຍ (ບໍ່ມີສັນຍານ): '
                  : language === 'th'
                  ? 'โหมดออฟไลน์ (ไม่มีสัญญาณ): '
                  : 'Offline Mode (No Internet): '}
              </span>
              <span className="text-amber-100">
                {language === 'lo'
                  ? 'ທ່ານຍັງສາມາດເປີດແອັບ ແລະ ເບິ່ງຂໍ້ມູນ, ໂພສເຕີ ແລະ ລາຍງານທັງໝົດໄດ້ປົກກະຕິ. ລະບົບຈະຊິ້ງຂໍ້ມູນຫຼ້າສຸດອັດຕະໂນມັດເມື່ອມີສັນຍານ.'
                  : language === 'th'
                  ? 'ยังสามารถเปิดและดูข้อมูล โปสเตอร์ และรายงานทั้งหมดได้ตามปกติ ระบบจะซิงค์ข้อมูลล่าสุดอัตโนมัติเมื่อมีสัญญาณ'
                  : 'You can continue browsing all data, posters, and reports normally. The app will automatically sync latest updates when reconnected.'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setDismissedOfflineWarning(true)}
            className="p-1 hover:bg-white/20 rounded transition text-white/80 hover:text-white shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // If syncing or recently recovered from offline
  return (
    <div
      className={`px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition-all duration-300 ${
        isSyncing
          ? 'bg-blue-600 text-white'
          : 'bg-emerald-600 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-blue-200" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
          )}
          <span>
            {isSyncing
              ? language === 'lo'
                ? 'ມີສັນຍານແລ້ວ! ກຳລັງຊິ້ງຂໍ້ມູນອັບເດດຫຼ້າສຸດຈາກຖານຂໍ້ມູນ...'
                : language === 'th'
                ? 'เชื่อมต่อสัญญาณแล้ว! กำลังซิงค์ข้อมูลอัปเดตล่าสุด...'
                : 'Connection restored! Syncing latest data from database...'
              : language === 'lo'
              ? 'ເຊື່ອມຕໍ່ສັນຍານສຳເລັດ: ຊິ້ງຂໍ້ມູນອັບເດດຫຼ້າສຸດຮຽບຮ້ອຍແລ້ວ'
              : language === 'th'
              ? 'เชื่อมต่อสำเร็จ: ซิงค์ข้อมูลล่าสุดเรียบร้อยแล้ว'
              : 'Connected: Latest data successfully synchronized'}
          </span>
        </div>

        <button
          onClick={onManualSync}
          disabled={isSyncing}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{language === 'lo' ? 'ຊິ້ງດຽວນີ້' : language === 'th' ? 'ซิงค์ทันที' : 'Sync Now'}</span>
        </button>
      </div>
    </div>
  );
};
