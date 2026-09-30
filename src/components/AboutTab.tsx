import React, { useState } from 'react';
import { Eye, Target, Phone, Mail, QrCode, CreditCard, Copy, Check, Heart, ShieldCheck, MessageSquare, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { TeamMember, DonationInfo, Language, BankAccount, HomePoster } from '../types';
import { getLocalizedRole } from '../utils/roleUtils';
import { MinistryTimeline } from './MinistryTimeline';
import { DEFAULT_BOKEO_TIMELINE } from '../data/timelineDefaults';

const cleanRichHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<span style="[^"]*font-size:\s*(\d+(?:\.\d+)?)(?:pt|px)[^"]*"([^>]*)>/gi, (match, size, rest) => {
      const num = parseFloat(size);
      if (num < 14) {
        return `<span style="font-size: 15px"${rest}>`;
      }
      return match;
    })
    .replace(/style="([^"]*)"/gi, (match, styles) => {
      const cleaned = styles
        .split(';')
        .filter((rule: string) => {
          const trimmed = rule.trim().toLowerCase();
          return !trimmed.startsWith('width') && !trimmed.startsWith('max-width');
        })
        .join(';');
      return `style="${cleaned}"`;
    });
};

interface AboutTabProps {
  teams: TeamMember[];
  donationInfo?: DonationInfo;
  homePoster?: HomePoster;
  language: Language;
}

export const AboutTab: React.FC<AboutTabProps> = ({ teams, donationInfo, homePoster, language }) => {
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [activeBankIndex, setActiveBankIndex] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Collapsible section visibility states
  const [showBokeoOverview, setShowBokeoOverview] = useState<boolean>(true);
  const [showVisionMission, setShowVisionMission] = useState<boolean>(true);
  const [showDonationSection, setShowDonationSection] = useState<boolean>(true);
  const [showPrayerLine, setShowPrayerLine] = useState<boolean>(true);
  const [showTeam, setShowTeam] = useState<boolean>(true);

  const bankAccountsList: BankAccount[] = ((donationInfo?.bankAccounts && donationInfo.bankAccounts.length > 0)
    ? donationInfo.bankAccounts
    : [
        {
          id: '1',
          bankName: donationInfo?.bankName || 'ທະນາຄານ ການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ (BCEL)',
          bankNameEn: donationInfo?.bankNameEn || 'Banque Pour Le Commerce Exterieur Lao Public (BCEL)',
          accountName: donationInfo?.accountName || 'HOPE BOKEO MINISTRY PROJECT',
          accountNumber: donationInfo?.accountNumber || '010-12-00-012345678-001',
          swiftCode: donationInfo?.swiftCode || 'BCELLA2X',
          qrImageUrl: donationInfo?.qrImageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600',
        },
        {
          id: '2',
          bankName: 'ທະນາຄານ ພັດທະນາລາວ (LDB)',
          bankNameEn: 'Lao Development Bank (LDB)',
          accountName: 'HOPE BOKEO MINISTRY PROJECT',
          accountNumber: '160-11-00-098765432-002',
          swiftCode: 'LDBLA2X',
          qrImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600',
        },
        {
          id: '3',
          bankName: 'ທະນາຄານ ຮ່ວມພັດທະນາ (JDB)',
          bankNameEn: 'Joint Development Bank (JDB)',
          accountName: 'HOPE BOKEO MINISTRY PROJECT',
          accountNumber: '020-15-00-055443322-003',
          swiftCode: 'JDBLA2X',
          qrImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600',
        },
      ]).filter((acc) => !acc.hidden);

  const isHidden = (item: any) =>
    item?.hidden === true ||
    item?.hidden === 'true' ||
    item?.hidden === 1 ||
    item?.hidden === '1';

  const visibleTeams = teams.filter((t) => !isHidden(t));

  const currentAccount = bankAccountsList[activeBankIndex] || bankAccountsList[0];

  const handleCopyAccount = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentAccount.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 3000);
    }
  };

  const handleNextBank = () => {
    setActiveBankIndex((prev) => (prev + 1) % bankAccountsList.length);
  };

  const handlePrevBank = () => {
    setActiveBankIndex((prev) => (prev === 0 ? bankAccountsList.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 40) {
      handleNextBank();
    } else if (diff < -40) {
      handlePrevBank();
    }
    setTouchStartX(null);
  };

  const supportNoteText = language === 'en'
    ? (donationInfo?.supportNoteEn || 'Your donations and faithful prayers are deeply appreciated to help expand God’s Kingdom and empower local communities across Bokeo Province.')
    : language === 'th'
    ? (donationInfo?.supportNoteTh || 'ทุกๆ การร่วมบริจาคและคำอธิษฐานของคุณมีคุณค่าอย่างยิ่ง เพื่อขยายแผ่นดินของพระเจ้าและช่วยเหลือชุมชนในแขวงบ่อแก้ว')
    : (donationInfo?.supportNote || 'ທຸກໆການຮ່ວມບໍລິຈາກ ແລະ ຄຳອະທິຖານຂອງທ່ານ ແມ່ນມີຄຸນຄ່າຢ່າງຍິ່ງ ເພື່ອຂະຫຍາຍແຜ່ນດິນຂອງພຣະເຈົ້າ ແລະ ຊ່ວຍເຫຼືອຊຸມຊົນໃນແຂວງບໍ່ແກ້ວ.');

  const visionText = language === 'en'
    ? (donationInfo?.visionEn || 'Disciple nations and expand the Kingdom of God across every district in Bokeo Province.\n\nWe desire to see every village hear the Gospel and establish vibrant local fellowships that serve as light to their communities.')
    : language === 'th'
    ? (donationInfo?.visionTh || 'สร้างสาวกและขยายแผ่นดินของพระเจ้าให้ครอบคลุมทุกพื้นที่ในแขวงบ่อแก้ว\n\nเราปรารถนาที่จะเห็นทุกหมู่บ้านได้ยินข่าวประเสริฐ และมีคริสตจักรที่เข้มแข็งตั้งอยู่เพื่อเป็นความสว่างแก่ชุมชน')
    : (donationInfo?.vision || 'ສ້າງສາວົກ ແລະ ຂະຫຍາຍແຜ່ນດິນຂອງພຣະເຈົ້າໃຫ້ຄວບຄຸມທຸກພື້ນທີ່ໃນແຂວງບໍ່ແກ້ວ.\n\nພວກເຮົາປາຖະໜາທີ່ຈະເຫັນທຸກໝູ່ບ້ານໄດ້ຍິນຂ່າວປະເສີດ ແລະ ມີຄິດສະຈັກທີ່ເຂັ້ມແຂງຕັ້ງຢູ່ ເພື່ອເປັນຄວາມສະຫວ່າງໃຫ້ແກ່ຊຸມຊົນ.');

  const missionText = language === 'en'
    ? (donationInfo?.missionEn || 'Proclaim the Gospel boldly in every village.\nTrain and equip local spiritual leaders.\nProvide humanitarian care and relief to the needy.\nIntercede continuously and faithfully track ministry fruit.')
    : language === 'th'
    ? (donationInfo?.missionTh || 'ประกาศข่าวประเสริฐอย่างกล้าหาญในทุกๆ หมู่บ้าน\nฝึกอบรมและสร้างผู้นำท้องถิ่นให้เข้มแข็ง\nช่วยเหลือสังคมและผู้ที่ถูกข่มเหงยากลำบาก\nอธิษฐานวิงวອນและติดตามผลอย่างใกล้ชิด')
    : (donationInfo?.mission || 'ປະກາດຂ່າວປະເສີດຢ່າງກ້າຫານໃນທຸກໆບ້ານ.\nຝຶກອົບຮົມ ແລະ ສ້າງຜູ້ນຳທ້ອງຖິ່ນໃຫ້ເຂັ້ມແຂງ.\nຊ່ວຍເຫຼືອສັງຄົມ ແລະ ຜູ້ທີ່ຖືກຂົ່ມເຫັງທຸກຢາກ.\nອະທິຖານວິງວອນ ແລະ ຕິດຕາມຜົນຢ່າງໃກ້ຊິດ.');

  const prayerPhone = donationInfo?.prayerContactPhone || '+856 20 55512345';
  const prayerWhatsapp = donationInfo?.prayerContactWhatsapp || '+856 20 76838584';
  const prayerEmail = donationInfo?.prayerContactEmail || 'info@hopebokeo.org';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Bokeo Province Overview Section - Poster at the very top with Title INSIDE the poster */}
      {!homePoster?.hideBokeoSection && (() => {
        const rawTitle =
          language === 'en' && homePoster?.bokeoTitleEn
            ? homePoster.bokeoTitleEn
            : language === 'th' && homePoster?.bokeoTitleTh
            ? homePoster.bokeoTitleTh
            : homePoster?.bokeoTitle || 'HOPE BOKEO - ແຂວງບໍ່ແກ້ວ';

        const rawDesc =
          language === 'en' && homePoster?.bokeoDescEn
            ? homePoster.bokeoDescEn
            : language === 'th' && homePoster?.bokeoDescTh
            ? homePoster.bokeoDescTh
            : homePoster?.bokeoDesc ||
              (language === 'lo'
                ? 'ໂຄງການ ໂຮບ ບໍ່ແກ້ວ (HOPE BOKEO) ເປັນສູນລວມການຈັດການພັນທະກິດ, ການພັດທະນາຊຸມຊົນ ແລະ ການເຊື່ອມໂຍງຂໍ້ມູນຄຣິດຕະຈັກໃນທົ່ວ 5 ເມືອງຂອງແຂວງບໍ່ແກ້ວ (ເມືອງຫ້ວຍຊາຍ, ເມືອງຕົ້ນເຜິ້ງ, ເມືອງຜາອຸດົມ, ເມືອງປາກທາ, ແລະ ເມືອງເມັກ). ພວກເຮົາຮ່ວມມືກັນຮັບໃຊ້ ແລະ ສົ່ງຕໍ່ຄວາມຮັກ, ຄວາມຫວັງ, ແລະ ການພັດທະນາທີ່ຍືນຍົງໃຫ້ແກ່ທຸກຄອບຄົວ.'
                : language === 'th'
                ? 'โครงการ โฮป บ่อแก้ว (HOPE BOKEO) เป็นศูนย์รวมการจัดการพันธกิจ การพัฒนาชุมชน และการเชื่อมโยงข้อมูลคริสตจักรในทั้ง 5 เมืองของแขวงบ่อแก้ว (ห้วยทราย, ต้นผึ้ง, ผาอุดม, ปากทา และเมิง) เราร่วมมือกันรับใช้และส่งต่อความรัก ความหวัง และการพัฒนาที่ยั่งยืนแก่ทุกครอบครัว'
                : 'HOPE BOKEO is a centralized ministry and community development platform connecting churches and outreach operations across all 5 districts of Bokeo Province (Huayxai, Tonpheung, Pha Oudom, Paktha, and Meung). Together, we serve communities, nurture spiritual growth, and build sustainable support for families across the region.');

        const hasHtml = /<[a-z][\s\S]*>/i.test(rawDesc);
        const posterSrc =
          homePoster?.bokeoImageUrl ||
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200';

        // Poster customization calculations matching announcement poster features
        const bokeoHeightPercent = typeof homePoster?.bokeoPosterHeight === 'number'
          ? Math.max(0, Math.min(100, homePoster.bokeoPosterHeight))
          : 50;
        const calculatedBokeoHeight = Math.round(200 + (bokeoHeightPercent / 100) * 420);

        const bokeoEdgeFadePercent = typeof homePoster?.bokeoPosterEdgeFade === 'number'
          ? Math.max(0, Math.min(100, homePoster.bokeoPosterEdgeFade))
          : 0;
        const bokeoEdgeFadePx = Math.round((bokeoEdgeFadePercent / 100) * 80);
        const bokeoMaskStyle: React.CSSProperties =
          bokeoEdgeFadePx > 0
            ? {
                WebkitMaskImage: `linear-gradient(to bottom, transparent 0px, black ${bokeoEdgeFadePx}px, black calc(100% - ${bokeoEdgeFadePx}px), transparent 100%)`,
                maskImage: `linear-gradient(to bottom, transparent 0px, black ${bokeoEdgeFadePx}px, black calc(100% - ${bokeoEdgeFadePx}px), transparent 100%)`,
              }
            : {};

        const bokeoOverlayOpacity = typeof homePoster?.bokeoPosterOverlayOpacity === 'number'
          ? Math.max(0, Math.min(100, homePoster.bokeoPosterOverlayOpacity)) / 100
          : 0.85;

        const bokeoDimPercent = typeof homePoster?.bokeoPosterDim === 'number'
          ? Math.max(0, Math.min(100, homePoster.bokeoPosterDim))
          : 0;
        const bokeoBrightness = Math.max(20, 100 - (bokeoDimPercent * 0.75));

        return (
          <div className="rounded-none overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800 -mt-2">
            {/* Poster Banner with Title INSIDE the Poster and custom sizing / edge fade */}
            <div
              className="relative w-full overflow-hidden bg-slate-950 flex items-end transition-all"
              style={{
                minHeight: `${calculatedBokeoHeight}px`,
                maxHeight: `${calculatedBokeoHeight + 120}px`,
                ...bokeoMaskStyle,
              }}
            >
              {posterSrc && (() => {
                const bokeoScale = (homePoster?.bokeoPosterScale !== undefined ? homePoster.bokeoPosterScale : 100) / 100;
                const bokeoPos = homePoster?.bokeoPosterPosition || '50% 50%';
                const bokeoFit = homePoster?.bokeoPosterFit || 'cover';
                return (
                  <img
                    src={posterSrc}
                    alt={rawTitle}
                    className="absolute inset-0 w-full h-full transition-all"
                    style={{
                      objectFit: bokeoFit,
                      objectPosition: bokeoPos,
                      transformOrigin: bokeoPos,
                      transform: `scale(${bokeoScale})`,
                      filter: `brightness(${bokeoBrightness}%)`,
                    }}
                    referrerPolicy="no-referrer"
                  />
                );
              })()}
              {/* High-contrast gradient overlay with customizable opacity */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none transition-opacity"
                style={{ opacity: bokeoOverlayOpacity }}
              />

              {/* Title & Controls INSIDE the poster */}
              <div className="relative z-10 w-full p-5 sm:p-8 md:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="max-w-3xl">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                    {rawTitle}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBokeoOverview(!showBokeoOverview)}
                  className="self-start sm:self-end px-3.5 py-2 bg-black/60 hover:bg-black/85 text-white border border-white/25 text-xs font-bold transition flex items-center gap-2 shrink-0 backdrop-blur-xs cursor-pointer shadow-sm"
                  title={showBokeoOverview ? (language === 'lo' ? 'ເຊື່ອງລາຍລະອຽດ' : 'Collapse') : (language === 'lo' ? 'ອ່ານລາຍລະອຽດ' : 'Read details')}
                >
                  <span>
                    {showBokeoOverview
                      ? (language === 'lo' ? 'ຫຍໍ້ລາຍລະອຽດ' : 'Collapse')
                      : (language === 'lo' ? 'ອ່ານເພີ່ມເຕີມ' : 'Read Story')}
                  </span>
                  {showBokeoOverview ? (
                    <ChevronUp className="w-4 h-4 text-red-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Description card under the poster */}
            {showBokeoOverview && (
              <div className="p-6 sm:p-8 animate-fade-in border-t border-slate-100 dark:border-slate-700 space-y-3">
                {hasHtml ? (
                  <div
                    className="w-full text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed font-medium text-justify [text-align-last:left] break-words rich-content-view space-y-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:font-black [&_strong]:font-black [&_u]:underline [&_i]:italic [&_em]:italic"
                    dangerouslySetInnerHTML={{ __html: cleanRichHtml(rawDesc) }}
                  />
                ) : (
                  <div className="w-full text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed font-medium text-justify [text-align-last:left] break-words whitespace-pre-wrap">
                    {rawDesc}
                  </div>
                )}

                {/* Ministry Origin & Timeline */}
                {!homePoster?.hideBokeoTimeline && (
                  <MinistryTimeline
                    timeline={
                      Array.isArray(homePoster?.bokeoTimeline) && homePoster.bokeoTimeline.length > 0
                        ? homePoster.bokeoTimeline
                        : DEFAULT_BOKEO_TIMELINE
                    }
                    language={language}
                    title={homePoster?.bokeoTimelineTitle}
                    titleEn={
                      homePoster?.bokeoTimelineTitleEn === 'Ministry Journey & Timeline'
                        ? 'Story timeline'
                        : (homePoster?.bokeoTimelineTitleEn || 'Story timeline')
                    }
                    titleTh={homePoster?.bokeoTimelineTitleTh}
                  />
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Vision & Mission Cards */}
      {!donationInfo?.hideVisionMission && (
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white border-l-4 border-[#cc0000] pl-3">
              {language === 'lo'
                ? 'ວິໄສທັດ ແລະ ພັນທະກິດ'
                : language === 'th'
                ? 'วิสัยทัศน์ และ พันธกิจ'
                : 'Vision & Mission Statement'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVisionMission(!showVisionMission)}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-none transition flex items-center justify-center shrink-0"
                title={showVisionMission ? (language === 'lo' ? 'ເຊື່ອງ' : 'Collapse') : (language === 'lo' ? 'ສະແດງ' : 'Expand')}
              >
                {showVisionMission ? (
                  <ChevronUp className="w-4 h-4 text-[#cc0000]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            </div>
          </div>

          {showVisionMission && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Vision */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-6 rounded-none border border-slate-100 dark:border-slate-700 space-y-3 shadow-xs">
              <h3 className="font-extrabold text-[#cc0000] dark:text-red-400 text-sm flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span>
                  {language === 'lo'
                    ? 'ວິໄສທັດ'
                    : language === 'th'
                    ? 'วิสัยทัศน์'
                    : 'Our Vision'}
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                {visionText}
              </p>
            </div>

            {/* Mission */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-6 rounded-none border border-slate-100 dark:border-slate-700 space-y-3 shadow-xs">
              <h3 className="font-extrabold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span>
                  {language === 'lo'
                    ? 'ພັນທະກິດ'
                    : language === 'th'
                    ? 'พันธกิจ'
                    : 'Our Mission'}
                </span>
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                {missionText.split('\n').filter(Boolean).map((line, idx) => (
                  <li key={idx}>{line.replace(/^[•\-\*\d+\.]\s*/, '')}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Donation & Bank Accounts Section */}
      {!donationInfo?.hideDonationSection && bankAccountsList.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-none border border-slate-700 shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500/30" />
              <span>
                {language === 'lo'
                  ? 'ຂໍ້ມູນການບໍລິຈາກ ແລະ ບັນຊີທະນາຄານ (Donation & Bank Accounts)'
                  : language === 'th'
                  ? 'ข้อมูลการบริจาค และ บัญชีธนาคาร (Donation & Bank Accounts)'
                  : 'Support Ministry & Bank Accounts'}
              </span>
            </h3>

            <button
              onClick={() => setShowDonationSection(!showDonationSection)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-none transition flex items-center justify-center shrink-0"
              title={showDonationSection ? (language === 'lo' ? 'ເຊື່ອງ' : 'Collapse') : (language === 'lo' ? 'ສະແດງ' : 'Expand')}
            >
              {showDonationSection ? (
                <ChevronUp className="w-4 h-4 text-amber-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>

          {showDonationSection && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                {supportNoteText}
              </p>

              {/* Bank Selection Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-black/40 p-2 rounded-none border border-white/10">
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
                  {bankAccountsList.map((acc, index) => {
                    const isSelected = index === activeBankIndex;
                    const displayName =
                      language === 'en' && acc.bankNameEn
                        ? acc.bankNameEn
                        : language === 'th' && acc.bankNameTh
                        ? acc.bankNameTh
                        : acc.bankName;
                    return (
                      <button
                        key={acc.id || index}
                        onClick={() => setActiveBankIndex(index)}
                        className={`px-3.5 py-1.5 rounded-none text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? 'bg-[#cc0000] text-white shadow-md border border-red-400'
                            : 'bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[160px] sm:max-w-xs">{displayName}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={handlePrevBank}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-none transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-bold text-amber-300 px-2 py-0.5 bg-white/10 rounded-none">
                    {activeBankIndex + 1}/{bankAccountsList.length}
                  </span>
                  <button
                    onClick={handleNextBank}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-none transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Account Details & QR Code Grid */}
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-800/90 p-6 rounded-none border border-slate-700 select-none"
              >
                {/* Left: Account Info */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                      {language === 'lo' ? 'ທະນາຄານ' : 'Bank Name'}
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-white">
                      {language === 'en' && currentAccount.bankNameEn
                        ? currentAccount.bankNameEn
                        : language === 'th' && currentAccount.bankNameTh
                        ? currentAccount.bankNameTh
                        : currentAccount.bankName}
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                      {language === 'lo' ? 'ຊື່ບັນຊີ' : 'Account Name'}
                    </span>
                    <p className="text-sm font-bold text-slate-200">{currentAccount.accountName}</p>
                  </div>

                  <div className="space-y-1.5 bg-slate-900/80 p-4 rounded-none border border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                      {language === 'lo' ? 'ເລກບັນຊີ' : 'Account Number'}
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base sm:text-xl font-black text-amber-400 font-mono tracking-wider">
                        {currentAccount.accountNumber}
                      </span>
                      <button
                        onClick={handleCopyAccount}
                        className="px-3 py-1.5 bg-[#cc0000] hover:bg-black text-white rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
                      >
                        {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAccount ? (language === 'lo' ? 'ກັອບປີ້ແລ້ວ' : 'Copied!') : (language === 'lo' ? 'ກັອບປີ້ເລກບັນຊີ' : 'Copy')}</span>
                      </button>
                    </div>
                  </div>

                  {currentAccount.swiftCode && (
                    <div className="text-xs text-slate-400 font-mono">
                      SWIFT Code: <span className="font-bold text-slate-200">{currentAccount.swiftCode}</span>
                    </div>
                  )}
                </div>

                {/* Right: QR Code Image */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-none shadow-md border border-slate-200 max-w-xs mx-auto w-full">
                  <img
                    src={currentAccount.qrImageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600'}
                    alt="Bank QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-none"
                  />
                  <p className="text-[11px] font-bold text-slate-600 mt-2 text-center flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-[#cc0000]" />
                    <span>{language === 'lo' ? 'ແກນ QR Code ເພື່ອໂອນເງິນບໍລິຈາກ' : 'Scan QR Code to Donate'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Prayer Channel & Hotline Section */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>
              {language === 'lo'
                ? 'ຊ່ອງທາງຮ່ວມອະທິຖານ ແລະ ຝາກຄຳອະທິຖານ (Prayer & Support Line)'
                : 'Prayer Partnership & Hotline'}
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrayerLine(!showPrayerLine)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-none transition flex items-center justify-center shrink-0"
              title={showPrayerLine ? (language === 'lo' ? 'ເຊື່ອງ' : 'Collapse') : (language === 'lo' ? 'ສະແດງ' : 'Expand')}
            >
              {showPrayerLine ? (
                <ChevronUp className="w-4 h-4 text-[#cc0000]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>
          </div>
        </div>

        {showPrayerLine && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
            {/* Phone Hotline */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-none border border-slate-100 dark:border-slate-700 space-y-2">
              <div className="w-9 h-9 rounded-none bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Phone className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-white">
                {language === 'lo' ? 'ໂທອະທິຖານ ແລະ ຕິດຕໍ່ສາຍດ່ວນ:' : 'Prayer Phone Line:'}
              </h4>
              <div className="flex items-center justify-between gap-2">
                <a
                  href={`tel:${prayerPhone.replace(/\s+/g, '')}`}
                  className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono hover:underline inline-flex items-center gap-1.5 select-all"
                  title={language === 'lo' ? 'ກົດເພື່ອໂທອອກ' : 'Click to call'}
                >
                  <span>{prayerPhone}</span>
                </a>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-none border border-slate-100 dark:border-slate-700 space-y-2">
              <div className="w-9 h-9 rounded-none bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                <ExternalLink className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-white">
                {language === 'lo' ? 'WhatsApp ຮ່ວມພັນທະກິດ:' : 'WhatsApp Ministry:'}
              </h4>
              <div className="flex items-center justify-between gap-2">
                <a
                  href={`https://wa.me/${prayerWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-black text-green-600 dark:text-green-400 font-mono hover:underline inline-block select-all"
                >
                  {prayerWhatsapp}
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-none border border-slate-100 dark:border-slate-700 space-y-2">
              <div className="w-9 h-9 rounded-none bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Mail className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-white">
                {language === 'lo' ? 'ອີເມວພັນທະກິດ:' : 'Email Support:'}
              </h4>
              <div className="flex items-center justify-between gap-2">
                <a
                  href={`mailto:${prayerEmail.trim()}`}
                  className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono hover:underline truncate select-all"
                  title={language === 'lo' ? 'ກົດເພື່ອສົ່ງອີເມວ' : 'Click to send email'}
                >
                  <span className="truncate">{prayerEmail}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Members Section */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-none border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-white border-l-4 border-emerald-500 pl-3">
            {language === 'lo' ? 'ທີມງານພັນທະກິດ (Ministry Team)' : 'Our Ministry Team'}
          </h3>
          <button
            onClick={() => setShowTeam(!showTeam)}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-none transition flex items-center justify-center shrink-0"
            title={showTeam ? (language === 'lo' ? 'ເຊື່ອງ' : 'Collapse') : (language === 'lo' ? 'ສະແດງ' : 'Expand')}
          >
            {showTeam ? (
              <ChevronUp className="w-4 h-4 text-[#cc0000]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </button>
        </div>

        {showTeam && (
          <div className="animate-fade-in pt-2">
            {visibleTeams.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                {language === 'lo' ? 'ຍັງບໍ່ມີຂໍ້ມູນທີມງານ' : 'No team members listed yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleTeams.map((t) => (
                  <div
                    key={t.rowId || t.name}
                    className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-none border border-slate-100 dark:border-slate-700 space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-13 h-13 min-w-[52px] max-w-[52px] aspect-square rounded-full overflow-hidden shrink-0 border-2 border-emerald-500 shadow-sm flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                        <img
                          src={
                            t.imageUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'
                          }
                          alt={t.name}
                          className="w-full h-full object-cover rounded-full shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                          {t.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-none bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 inline-block mt-0.5">
                          {getLocalizedRole(t, language)}
                        </span>
                      </div>
                    </div>

                    {(t.bio || t.bioEn || t.bioTh) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic font-medium">
                        {language === 'en' && t.bioEn
                          ? t.bioEn
                          : language === 'th' && t.bioTh
                          ? t.bioTh
                          : t.bio}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {t.phone && (
                        <div>
                          <a
                            href={`tel:${t.phone.replace(/\s+/g, '')}`}
                            className="flex items-center gap-1.5 hover:underline text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 truncate select-all"
                            title={language === 'lo' ? 'ກົດເພື່ອໂທອອກ' : 'Click to call'}
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{t.phone}</span>
                          </a>
                        </div>
                      )}
                      {t.email && (
                        <div>
                          <a
                            href={`mailto:${t.email.trim()}`}
                            className="flex items-center gap-1.5 hover:underline text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate select-all"
                            title={language === 'lo' ? 'ກົດເພື່ອສົ່ງອີເມວ' : 'Click to send email'}
                          >
                            <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{t.email}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
