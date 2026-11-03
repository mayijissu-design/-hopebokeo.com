import { db, collection, doc, getDocs, getDoc, setDoc, deleteDoc } from './firebase';
import { optimizePosterForFirestore, emergencyCompressObject } from '../utils/imageCompressor';
import { parseCoordinatesFromUrl, normalizeCoordinates } from '../utils/mapUtils';
import { DEFAULT_BOKEO_TIMELINE } from '../data/timelineDefaults';
import { initialDefaultFinanceData } from '../data/financeDefaults';
import initialDefaultFinanceQrMembers from '../data/financeQrDefaults.json';

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as any;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data as any;
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}

const VILLAGES_COL = 'villages';
const EVENTS_COL = 'events';
const TEAMS_COL = 'teams';
const DONATIONS_COL = 'donations_ledger';
const DISTRIBUTIONS_COL = 'team_distributions';
const FINANCE_QR_MEMBERS_COL = 'finance_qr_members';
const CONFIG_COL = 'app_config';

export const initialDefaultData = {
  "villages": [
    {
      "districtEn": "Pha Oudom",
      "province": "Bokeo",
      "leaders": 1,
      "needsEn": "",
      "needsTh": "",
      "persecution": "ປານກາງ",
      "nameEn": "Moksouk",
      "rowId": 2,
      "name": "ມົກສຸກ",
      "pinCode": "",
      "district": "ຜາອຸດົມ",
      "notesEn": "",
      "heard": 120,
      "nameTh": "",
      "lng": 100.885583,
      "lat": 20.03875,
      "id": "LG1",
      "imageUrl": "/uploads/village_______.jpg",
      "mapUrl": "20°02'19.5\"N 100°53'08.1\"E",
      "attending": 25,
      "hidden": false,
      "notes": "ກຳລັງສ້າງອາຄານໃຫມ່",
      "districtTh": "",
      "notesTh": "",
      "baptized": 30,
      "date": "2026-07-16",
      "needs": "ເພື່ອ ອາຄານທີ່ກຳລັງສ້າງ",
      "believers": 30
    },
    {
      "nameTh": "",
      "districtEn": "Pha Oudom",
      "mapUrl": "20°04'44.0\"N 100°50'12.5\"E",
      "rowId": 3,
      "needsTh": "",
      "imageUrl": "/uploads/village______.jpg",
      "id": "LG2",
      "needsEn": "",
      "leaders": 2,
      "believers": 82,
      "pinCode": "",
      "notesEn": "",
      "persecution": "ປານກາງ",
      "baptized": 62,
      "hidden": false,
      "attending": 25,
      "date": "2026-07-16",
      "lng": 100.836806,
      "lat": 20.078889,
      "notes": "",
      "nameEn": "Pheingkahm",
      "province": "Bokeo",
      "needs": "ຕ້ອງການປຶ້ມຄຳສອນ",
      "heard": 150,
      "districtTh": "",
      "district": "ຜາອຸດົມ",
      "name": "ພຽງຄຳ",
      "notesTh": ""
    },
    {
      "lng": 100.806611,
      "districtTh": "",
      "lat": 20.046972,
      "hidden": false,
      "imageUrl": "/uploads/village________.jpg",
      "heard": 172,
      "id": "V3958",
      "notesTh": "",
      "name": "ຫ້ວຍກູນ",
      "notes": "",
      "nameTh": "",
      "baptized": 75,
      "needs": "ອາຄານທີ່ກຳລັງສ້າງ",
      "mapUrl": "20°02'49.1\"N 100°48'23.8\"E",
      "leaders": 1,
      "needsEn": "",
      "believers": 80,
      "province": "Bokeo",
      "needsTh": "",
      "rowId": 4,
      "persecution": "ປານກາງ",
      "districtEn": "Pha Oudom",
      "district": "ຜາອຸດົມ",
      "date": "2026-07-16",
      "attending": 28,
      "pinCode": "",
      "notesEn": "",
      "nameEn": "Huaykoon"
    },
    {
      "baptized": 2,
      "nameEn": "Veingpathana",
      "districtEn": "Pha Oudom",
      "lng": 100.722667,
      "date": "2026-07-17",
      "lat": 20.034484,
      "rowId": 7,
      "notesTh": "",
      "imageUrl": "/uploads/village___________.jpg",
      "persecution": "ປົກກະຕິ",
      "mapUrl": "https://maps.app.goo.gl/VGDEbb4id6R1U7W78",
      "needsEn": "",
      "leaders": 1,
      "needs": "",
      "nameTh": "",
      "notes": "",
      "name": "ວຽງພັດທະນາ",
      "id": "V4929",
      "needsTh": "",
      "district": "ຜາອຸດົມ",
      "attending": 5,
      "districtTh": "",
      "province": "Bokeo",
      "heard": 15,
      "notesEn": "",
      "pinCode": "",
      "hidden": false,
      "believers": 5
    },
    {
      "district": "ຜາອຸດົມ",
      "mapUrl": "20°03'50.9\"N 100°49'13.7\"E",
      "needsTh": "",
      "date": "2026-07-16",
      "nameTh": "",
      "leaders": 2,
      "needsEn": "",
      "rowId": 5,
      "believers": 70,
      "districtTh": "",
      "notesEn": "",
      "lng": 100.820472,
      "lat": 20.064139,
      "pinCode": "",
      "attending": 26,
      "persecution": "ປົກກະຕິ",
      "province": "Bokeo",
      "hidden": false,
      "nameEn": "Kankham",
      "needs": "Budget for kids events",
      "name": "ແກ່ນຄຳ",
      "id": "V8208",
      "baptized": 63,
      "notes": "",
      "imageUrl": "/uploads/village_______.jpg",
      "districtEn": "Pha Oudom",
      "notesTh": "",
      "heard": 130
    },
    {
      "baptized": 0,
      "nameEn": "Mok Plai",
      "heard": 500,
      "districtTh": "",
      "needs": "Opportunity to visit them",
      "notesTh": "",
      "id": "V8547",
      "notes": "",
      "date": "2026-08-28",
      "imageUrl": "",
      "mapUrl": "",
      "leaders": 0,
      "needsEn": "",
      "districtEn": "Partha",
      "nameTh": "",
      "needsTh": "",
      "district": "ປາກທາ",
      "attending": 5,
      "persecution": "ວິກິດ",
      "province": "Bokeo",
      "name": "ມົກໄປຼ",
      "notesEn": "",
      "pinCode": "",
      "hidden": false,
      "believers": 50,
      "rowId": 1787904934000
    },
    {
      "needsTh": "",
      "needs": "ຕ້ອງການຄຳອະທິຖານ",
      "districtEn": "Pha Oudom",
      "mapUrl": "20°02'15.3\"N 100°47'03.9\"E",
      "imageUrl": "",
      "notes": "",
      "nameTh": "",
      "needsEn": "",
      "leaders": 1,
      "lat": 20.037583,
      "notesEn": "",
      "hidden": false,
      "pinCode": "",
      "baptized": 2,
      "lng": 100.784417,
      "heard": 30,
      "name": "ຫ້ວຍຊັງ",
      "attending": 5,
      "province": "Bokeo",
      "id": "V8993",
      "persecution": "ວິກິດ",
      "nameEn": "Huaysung",
      "rowId": 6,
      "believers": 8,
      "districtTh": "",
      "notesTh": "",
      "district": "ຜາອຸດົມ",
      "date": "2026-09-01"
    }
  ],
  "events": [
    {
      "id": "E102",
      "docUrl": "",
      "monthlyReports": [
        {
          "month": "2026-09",
          "videoUrl": "https://www.youtube.com/watch?v=23cipSExADA&list=RDtayKmIhjrHA&index=2",
          "baptized": 0,
          "date": "2026-09-04",
          "summaryEn": "",
          "believers": 0,
          "imageUrls": [
            "/uploads/c084c02a-adf5-4498-ace3-aac9a4626ad2_jpg_1788505827641_344.jpg"
          ],
          "summary": "..............,,,,,,,,,,,,,ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ..............,,,,,,,,,,,,,ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ..............,,,,,,,,,,,,,ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ..............,,,,,,,,,,,,,ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ..............,,,,,,,,,,,,,ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ..............,,,,,,,,,,,,,ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ..............,,,,,,,,,,,,,ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ..............,,,,,,,,,,,,,ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ..............,,,,,,,,,,,,,ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ",
          "id": "mr-1788505531050",
          "createdAt": "2026-09-04T07:05:31.050Z",
          "title": "ດດດດດ",
          "attendees": 0,
          "docUrl": "/uploads/Hope_Bokoe_1788452989504_320_1788505509470_175.pdf",
          "location": "",
          "titleEn": "",
          "docUrls": [
            "/uploads/Hope_Bokoe_1788452989504_320_1788505509470_175.pdf",
            "/uploads/Hope_Bokoe_1788452989504_320_1788505516947_17.pdf"
          ],
          "titleTh": "",
          "summaryTh": ""
        },
        {
          "titleEn": "",
          "summaryEn": "",
          "imageUrls": [],
          "believers": 0,
          "location": "",
          "summary": "ກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກກ",
          "id": "mr-1788505448927",
          "docUrl": "/uploads/Hope_Bokoe_1788452989504_320_1788505439250_490.pdf",
          "titleTh": "",
          "docUrls": [
            "/uploads/Hope_Bokoe_1788452989504_320_1788505439250_490.pdf"
          ],
          "month": "2026-09",
          "videoUrl": "",
          "date": "2026-09-04",
          "summaryTh": "",
          "baptized": 0,
          "createdAt": "2026-09-04T07:04:08.927Z",
          "attendees": 0,
          "title": "ກກກກກກກ"
        },
        {
          "titleEn": "",
          "summaryEn": "",
          "believers": 0,
          "imageUrls": [],
          "summary": "",
          "docUrl": "/uploads/Hope_Bokoe_1788452989504_320_1788505358824_760.pdf",
          "id": "mr-1788505380634",
          "videoUrl": "",
          "month": "2026-09",
          "titleTh": "",
          "docUrls": [
            "/uploads/Hope_Bokoe_1788452989504_320_1788505358824_760.pdf"
          ],
          "baptized": 0,
          "summaryTh": "",
          "title": "ຫຫຫຫ",
          "createdAt": "2026-09-04T07:03:00.634Z",
          "location": "ຜາອຸດົມ",
          "attendees": 14,
          "date": "2026-09-04"
        }
      ],
      "imageUrls": [
        "/uploads/e102_cover.jpg"
      ],
      "titleEn": "Evangelism & Church Planting",
      "description": "ແຈກຢາຍເຄື່ອງນຸ່ງ, ອຸປະກອນການຮຽນ ແລະ ອາຫານໃຫ້ເດັກນ້ອຍໃນບ້ານແກ່ນຄຳ",
      "descriptionTh": "แจกจ่ายเสื้อผ้า อุปกรณ์การเรียน และอาหารให้กับเด็กๆ ในบ้านแก่นคำ",
      "titleTh": "การประกาศและการขยายคริสตจักร",
      "videoUrl": "",
      "docUrls": [],
      "descriptionEn": "Distributing clothes, school supplies, and meals to children in Ban Kaen Kham.",
      "imageUrl": "/uploads/e102_cover.jpg",
      "rowId": 3,
      "audioUrl": "",
      "title": "ການປະກາດ ແລະ ການຂະຫຍາຍຄຣິສຕະຈັກ",
      "hidden": false,
      "date": "2026-07-18"
    },
    {
      "id": "E103",
      "docUrl": "",
      "descriptionEn": "<span data-path-to-node=\"8,0\">Demonstrating God’s love through regular visits and fellowship with our brothers and sisters in each group</span><span data-path-to-node=\"8,1\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"8,2\">. We study the Bible together, pray for healing and deliverance, assist with community work like harvesting, and stand firmly beside believers facing persecution</span><span data-path-to-node=\"8,3\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"8,4\">.</span>",
      "rowId": 4,
      "title": "ການລ້ຽງດູ",
      "audioUrl": "",
      "imageUrl": "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800",
      "titleTh": "การเลี้ยงดูและการบัวระบัติรักษา (อภิบาล)",
      "description": "<span data-path-to-node=\"2,0\">ສຳແດງຄວາມຮັກຂອງພຣະເຈົ້າຜ່ານການລົງຢ້ຽມຢາມ ແລະ ສາມັກຄີທຳກັບພີ່ນ້ອງໃນແຕ່ລະກຸ່ມຢ່າງເປັນປະຈຳ</span><span data-path-to-node=\"2,1\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"2,2\">. ພວກເຮົາຮ່ວມກັນສຶກສາພຣະຄຳພີ, ອະທິຖານປົດປ່ອຍຜູ້ປ່ວຍ, ຊ່ວຍເຫຼືອວຽກງານຊາວບ້ານ ເຊັ່ນ: ການເກັບກ່ຽວຜົນຜະລິດ, ແລະ ຢືນຄຽງຂ້າງໜູນໃຈຜູ້ເຊື່ອທີ່ກຳລັງປະເຊີນກັບການຂົ່ມເຫງ</span><span data-path-to-node=\"2,3\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"2,4\">.</span>",
      "videoUrl": "",
      "descriptionTh": "<span data-path-to-node=\"14,0\">สำแดงความรักของพระเจ้าผ่านการลงเยี่ยมเยียนและสามัคคีธรรมกับพี่น้องในแต่ละกลุ่มอย่างสม่ำเสมอ</span><span data-path-to-node=\"14,1\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"14,2\"> เราร่วมกันศึกษาพระคัมภีร์ อธิษฐานปลดปล่อยผู้ป่วย ช่วยเหลืองานของชาวบ้าน เช่น การเก็บเกี่ยวผลผลิต และยืนเคียงข้างหนุนใจผู้เชื่อที่กำลังเผชิญกับการข่มเหง</span>",
      "date": "2026-07-15",
      "titleEn": "Discipleship & Pastoral Care",
      "imageUrls": [
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800"
      ]
    },
    {
      "id": "E761",
      "description": "<span data-path-to-node=\"4,0\">ໃຫ້ຄວາມສຳຄັນກັບການສ້າງອະນາຄົດຂອງຄຣິສຕະຈັກ ຜ່ານການຈັດຄ້າຍຊາວໜຸ່ມເພື່ອຟື້ນຟູຈິດວິນຍານ</span><span data-path-to-node=\"4,1\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"4,2\">. ພ້ອມດຽວກັນນັ້ນ, ພວກເຮົາຍັງດຳເນີນພັນທະກິດເດັກ ໂດຍການສອນໜັງສືພາສາລາວ ແລະ ສອນພຣະຄຳພີ ໃຫ້ແກ່ເດັກກຳພ້າ ແລະ ເດັກດ້ອຍໂອກາດ ເພື່ອພັດທະນາພວກເຂົາທັງທາງຮ່າງກາຍ ແລະ ຈິດວິນຍານ</span><span data-path-to-node=\"4,3\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"4,4\">.</span>",
      "rowId": 1788358645600,
      "title": "ພັນທະກິດຄົນລຸ້ນໃໝ່ (ເດັກ ແລະ ຊາວໜຸ່ມ)",
      "audioUrl": "",
      "descriptionEn": "<span data-path-to-node=\"10,0\">Prioritizing the future of the church by hosting youth camps for spiritual renewal</span><span data-path-to-node=\"10,1\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"10,2\">. At the same time, our children's ministry provides basic Lao literacy education alongside Bible teaching for orphans and disadvantaged children, nurturing them both physically and spiritually</span><span data-path-to-node=\"10,3\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"10,4\">.</span>",
      "imageUrls": [],
      "imageUrl": "",
      "date": "2026-09-02",
      "titleTh": "พันธกิจคนรุ่นใหม่ (เด็กและเยาวชน)",
      "videoUrl": "",
      "titleEn": "Next Generation Ministry (Children & Youth)",
      "docUrl": "",
      "descriptionTh": "<span data-path-to-node=\"16,0\">ให้ความสำคัญกับการสร้างอนาคตของคริสตจักรผ่านการจัดค่ายเยาวชนเพื่อฟื้นฟูจิตวิญญาณ</span><span data-path-to-node=\"16,1\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"16,2\"> พร้อมกันนั้น เรายังดำเนินพันธกิจเด็กโดยการสอนหนังสือภาษาลาวและสอนพระคัมภีร์ให้กับเด็กกำพร้าและเด็กด้อยโอกาส เพื่อพัฒนาพวกเขาทั้งทางร่างกายและจิตวิญญาณ</span><span data-path-to-node=\"16,3\"><sup class=\"superscript\"></sup></span>"
    },
    {
      "id": "E972",
      "audioUrl": "",
      "descriptionTh": "<span data-path-to-node=\"15,0\">เพื่อให้ดอกผลของการรับใช้ยั่งยืน เราจัดการประชุมพบปะผู้นำในทุกๆ วันที่ 25 ของเดือนเพื่อประเมินผลและวางแผนร่วมกัน</span><span data-path-to-node=\"15,1\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"15,2\"> เราเน้นที่การเป็นพี่เลี้ยงและฝึกอบรมผู้นำท้องถิ่นให้เข้มแข็ง เพื่อให้พวกเขาสามารถเลี้ยงดูและนำพาชุมชนของตนเองได้</span><span data-path-to-node=\"15,3\"><sup class=\"superscript\"></sup></span>",
      "imageUrls": ["/uploads/e972_cover.jpg"],
      "docUrl": "",
      "imageUrl": "/uploads/e972_cover.jpg",
      "title": "ການພັດທະນາຜູ້ນຳ ແລະ ການບໍລິຫານ",
      "description": "<span data-path-to-node=\"3,0\">ເພື່ອໃຫ້ໝາກຜົນຂອງການຮັບໃຊ້ຍືນຍົງ, ພວກເຮົາຈັດກອງປະຊຸມພົບປະຜູ້ນຳໃນທຸກໆວັນທີ 25 ຂອງເດືອນ ເພື່ອປະເມີນຜົນ ແລະ ວາງແຜນຮ່ວມກັນ</span><span data-path-to-node=\"3,1\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"3,2\">. ພວກເຮົາເນັ້ນໃສ່ການເປັນພີ່ລ້ຽງ ແລະ ຝຶກອົບຮົມຜູ້ນຳທ້ອງຖິ່ນໃຫ້ເຂັ້ມແຂງ ເພື່ອໃຫ້ພວກເຂົາສາມາດລ້ຽງດູ ແລະ ນຳພາຊຸມຊົນຂອງຕົນເອງໄດ້</span><span data-path-to-node=\"3,3\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"3,4\">.</span>",
      "rowId": 1788358569844,
      "date": "2026-09-02",
      "titleTh": "การพัฒนาผู้นำและการบริหาร",
      "descriptionEn": "<span data-path-to-node=\"9,0\">To ensure lasting fruit, we hold monthly leadership meetings on the 25th to evaluate our progress and plan forward together</span><span data-path-to-node=\"9,1\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"9,2\">. We focus on mentoring and equipping local leaders so they can strongly shepherd and guide their own communities</span><span data-path-to-node=\"9,3\"><sup class=\"superscript\"></sup></span><span data-path-to-node=\"9,4\">.</span>",
      "videoUrl": "",
      "titleEn": "Leadership Development & Administration"
    }
  ],
  "teams": [
    {
        "id": "t_1785158837395",
        "role": "Public Relation",
        "roleEn": "",
        "rowId": 1785158837395,
        "bioTh": "",
        "bankAccountNumber": "",
        "email": "",
        "bio": "",
        "financeQrUrl": "/uploads/inline_93463103c4a2.jpg",
        "hidden": false,
        "roleTh": "",
        "name": "Phet",
        "bankName": "LDB",
        "imageUrl": "/uploads/inline_6a57800c2569.jpg",
        "bioEn": "",
        "bankAccountName": "Phet",
        "phone": ""
    },
    {
        "id": "t_1785158921396",
        "hidden": false,
        "bio": "",
        "roleTh": "",
        "bioTh": "",
        "email": "",
        "rowId": 1785158921396,
        "role": "ຜູ້ປະສານງານ ",
        "imageUrl": "/uploads/inline_7118f368ff39.jpg",
        "bankName": "BCEL One",
        "financeQrUrl": "/uploads/inline_9ddb44933bdb.jpg",
        "bankAccountNumber": "",
        "bankAccountName": "Hing",
        "roleEn": "Team Cordinator",
        "phone": "",
        "bioEn": "",
        "name": "Hing"
    },
    {
        "id": "t_1787587260190",
        "bankName": "BCEL One",
        "imageUrl": "/uploads/inline_2edeb693fbf7.jpg",
        "rowId": 1787587260190,
        "roleEn": "Life group leader",
        "bankAccountName": "Sayvon",
        "email": "",
        "bio": "",
        "role": "ຜູດູແລກຸ່ມ",
        "financeQrUrl": "/uploads/inline_068d98c5597d.jpg",
        "bioTh": "",
        "bioEn": "",
        "bankAccountNumber": "",
        "name": "Sayvon",
        "roleTh": "",
        "phone": "",
        "hidden": true
    },
    {
        "id": "t_1787587311761",
        "financeQrUrl": "/uploads/inline_41627e3ce40f.jpg",
        "hidden": true,
        "roleTh": "",
        "phone": "",
        "bio": "",
        "bankAccountNumber": "",
        "bioEn": "",
        "role": "ຜູ້ດູແລກຸມ",
        "imageUrl": "/uploads/inline_1dc943ebc83c.jpg",
        "bankName": "BCEL One",
        "bioTh": "",
        "roleEn": "LG leader",
        "email": "",
        "rowId": 1787587311761,
        "bankAccountName": "khou",
        "name": "khou"
    },
    {
        "id": "t_1787587362219",
        "bioTh": "",
        "bio": "",
        "email": "",
        "rowId": 1787587362219,
        "roleEn": "Group Leader",
        "name": "Phonexay",
        "financeQrUrl": "/uploads/inline_28027aaeba2c.jpg",
        "imageUrl": "",
        "phone": "",
        "bankName": "BCEL One",
        "role": "ຜູ້ດູແລກຸ່ມ",
        "bioEn": "",
        "hidden": true,
        "roleTh": "",
        "bankAccountName": "Phonexay",
        "bankAccountNumber": ""
    },
    {
        "id": "t_1787587435987",
        "role": "ຜູ້ດູແລກຸ່ມ",
        "rowId": 1787587435987,
        "email": "",
        "imageUrl": "/uploads/inline_ab4cff3112f7.jpg",
        "roleEn": "Group leader",
        "bioTh": "",
        "bio": "",
        "name": "Oudomphone",
        "bioEn": "",
        "phone": "",
        "roleTh": "",
        "hidden": true
    },
    {
        "id": "t_1787587557269",
        "bankAccountNumber": "",
        "phone": "",
        "imageUrl": "/uploads/inline_e6bb46bf6b1f.jpg",
        "bankName": "BCEL One",
        "bankAccountName": "Phard",
        "role": "ການເງິນ",
        "roleTh": "",
        "hidden": true,
        "bio": "",
        "bioEn": "",
        "name": "Phard",
        "email": "",
        "bioTh": "",
        "financeQrUrl": "/uploads/inline_d151a81e22bb.jpg",
        "roleEn": "Finace",
        "rowId": 1787587557269
    },
    {
        "id": "t_1788337598975",
        "rowId": 1788337598975,
        "roleTh": "ผู้นำพันธกิจ",
        "hidden": false,
        "name": "Justin",
        "email": "Tinvyk88@gmail.com",
        "bioTh": "",
        "bankName": "BCEL One",
        "imageUrl": "/uploads/inline_899c4bee16c8.jpg",
        "bankAccountNumber": "",
        "roleEn": "Ministry Leader",
        "bioEn": "",
        "bankAccountName": "Justin",
        "bio": "",
        "role": "ຫົວໜ້າພັນທະກິດ",
        "phone": "02076838584",
        "financeQrUrl": ""
    },
    {
        "id": "t_1790221600018",
        "bioTh": "",
        "email": "",
        "role": "Team member",
        "bio": "",
        "rowId": 1790221600018,
        "roleEn": "member",
        "phone": "",
        "financeQrUrl": "/uploads/inline_ff2fc833bbcd.jpg",
        "imageUrl": "/uploads/WhatsApp_Image_2026-09-24_at_10_46_14_AM_jpeg_1790221598908_532.jpg",
        "bankName": "LDB Bank",
        "name": "Pan PANYAHAK",
        "bankAccountName": "Pan PANYAHAK",
        "hidden": true,
        "roleTh": "member",
        "bankAccountNumber": "",
        "bioEn": ""
    }
],
  "homePoster": {
    "title": "ປະກາດຂ່າວປະເສີດ ແລະ ສ້າງສາວົກ",
    "subtitle": "ແຂວງບໍ່ແກ້ວ",
    "description": "ຮ່ວມເປັນສ່ວນໜຶ່ງໃນການຂັບເຄື່ອນວຽກງານຂອງພຣະເຈົ້າໃນແຂວງບໍ່ແກ້ວ ໂດຍການຕິດຕາມ, ຮ່ວມອະທິຖານ ແລະ ສະໜັບສະໜູນວຽກງານພາກສະໜາມ.",
    "imageUrl": "/uploads/home_poster_banner.jpg",
    "imageUrls": [
      "/uploads/home_poster_banner.jpg",
      "/uploads/5b593987-79b3-4309-ac43-e717cbc3c838_1788761424505_430.jpg",
      "/uploads/551239041_802528468839951_42532514368066_1788761477530_359.jpg"
    ],
    "buttonText": "ເບິ່ງດາສບອດຂໍ້ມູນ",
    "linkUrl": "",
    "bgColor": "#ffffff",
    "bgImageUrl": "",
    "bgBrightness": 150,
    "bgBlur": 3,
    "posterHeight": 370,
    "posterFit": "cover",
    "posterAspectRatio": "auto",
    "hidden": false,
    "hidePoster": false,
    "hideBokeoSection": false,
    "titleEn": "Proclaim Gospel & Disciple Nations",
    "bgWhiteOverlayOpacity": 0,
    "descriptionTh": "ร่วมเป็นส่วนหนึ่งในการขับเคลื่อนพระราชกิจของพระเจ้าในแขวงบ่อแก้ว โดยการติดตาม ร่วมอธิษฐาน และสนับสนุนงานภาคสนาม",
    "buttonTextEn": "View Dashboard",
    "bgPositions": [
      "50% 50%",
      "46% 62%",
      "45% 45%",
      "46% 32%"
    ],
    "titleTh": "ประกาศข่าวประเสริฐ และสร้างสาวก",
    "hideTextOverlay": false,
    "subtitleEn": "Bokeo Province (Lao PDR)",
    "bokeoTitleTh": "HOPE BOKEO",
    "posterBlur": 0,
    "posterContrast": 100,
    "logoUrl": "/uploads/inline_d892a5b8897e.jpg",
    "bokeoTitleEn": "HOPE BOKEO",
    "subtitleTh": "แขวงบ่อแก้ว (ลาว)",
    "bgPosition": "46% 32%",
    "posterOverlayOpacity": 60,
    "bgWhiteOpacity": 0,
    "bokeoDesc": "<p data-path-to-node=\"2\"><b data-path-to-node=\"2\" data-index-in-node=\"0\">HOPE BOKEO</b> ແມ່ນຄອບຄົວຂອງຜູ້ເຊື່ອ ແລະ ຜູ້ຮັບໃຊ້ໃນທ້ອງຖິ່ນ ທີ່ລວມຕົວກັນດ້ວຍການຊົງເອີ້ນທີ່ລຽບງ່າຍແຕ່ເລິກເຊິ່ງ ນັ້ນຄື: ການດຳເນີນຊີວິດຕາມ ພຣະບັນຍັດ ແລະ ການຕອບສະໜອງຕໍ່ ພຣະມະຫາບັນຊາ ໃນທົ່ວແຂວງບໍ່ແກ້ວ. ພວກເຮົາແມ່ນກຸ່ມຜູ້ຮັບໃຊ້, ເປັນຊຸມຊົນທີ່ອຸທິດຕົນເພື່ອສຳແດງຄວາມຮັກຂອງພຣະອົງອອກໄປສູ່ຊຸມຊົນຕ່າງໆ ໂດຍເລີ່ມຈາກຊຸມຊົນຂອງຕົນເອງ.</p><ul data-path-to-node=\"3\"><li><p data-path-to-node=\"3,0,0\"><b data-path-to-node=\"3,0,0\" data-index-in-node=\"0\">ດຳເນີນຊີວິດຕາມພຣະບັນຍັດຂໍ້ໃຫຍ່ (ຮັກພຣະເຈົ້າ ແລະ ຮັກເພື່ອນບ້ານ)</b>\n<i data-path-to-node=\"3,0,0\" data-index-in-node=\"63\">“ຈົ່ງ​ຮັກ​ເພື່ອນ​ບ້ານ​ເໝືອນ​ຮັກ​ຕົນ​ເອງ” (ມັດທາຍ 22:39).</i>\nພວກເຮົາສຳແດງຄວາມຮັກນີ້ຜ່ານການຮັບໃຊ້ໃນຊີວິດຈິງ. ບໍ່ວ່າຈະເປັນການລົງອະທິຖານເພື່ອຄົນເຈັບປ່ວຍ, ການຊ່ວຍວຽກງານຊຸມຊົນ, ການຢືນຄຽງຂ້າງພີ່ນ້ອງທີ່ຖືກຂົ່ມເຫັງຍ້ອນຄວາມເຊື່ອ, ການສອນໜັງສື ແລະ ສ້າງກິດຈະກຳເພື່ອພັດທະນາເດັກກຳພ້າ, ເດັກດ້ອຍໂອກາດ; ພວກເຮົາປາດຖະໜາໃຫ້ທຸກກິດຈະກຳຂອງເຮົາສະທ້ອນເຖິງພຣະໄທຂອງພຣະເຢຊູ.</p></li><li><p data-path-to-node=\"3,1,0\"><b data-path-to-node=\"3,1,0\" data-index-in-node=\"0\">ຕອບສະໜອງຕໍ່ພຣະມະຫາບັນຊາ (ຈົ່ງອອກໄປສ້າງສາວົກ)</b>\n<i data-path-to-node=\"3,1,0\" data-index-in-node=\"45\">“ເຫດ​ສະນັ້ນ ພວກ​ທ່ານ​ຈົ່ງ​ໄປ​ສ້າງ​ສາວົກ​ຈາກ​ທຸກ​ປະຊາຊາດ...” (ມັດທາຍ 28:19).</i>\nພາລະກິດຂອງພວກເຮົາຄືການເຫັນຊີວິດຖືກປ່ຽນແປງໂດຍຂ່າວປະເສີດ. ພວກເຮົາເດີນທາງໄປຍັງພື້ນທີ່ຫ່າງໄກສອກຫຼີກ ເພື່ອປະກາດຂ່າວດີ, ຈັດພິທີບັບຕິສະມາ, ແລະ ຕັ້ງກຸ່ມນະມັດສະການຕາມບ້ານ ລວມເຖິງກຸ່ມແຄຣ໌ໃໝ່ໆ. ເພື່ອໃຫ້ໝາກຜົນເຫຼົ່ານີ້ຂະຫຍາຍ, ພວກເຮົາຈັດການພົບປະຜູ້ນຳກຸຸ່ມນະມັດສະການທ້ອງຖິ່ນໃນທຸກໆເດືອນເພື່ອເປັນພີ່ລ້ຽງ, ຝຶກອົບຮົມ ແລະ ເສີມສ້າງຜູ້ນຳເຫຼົ່ານີ້ໃຫ້ສາມາດລ້ຽງດູຊຸມຊົນຂອງຕົນເອງໄດ້.</p></li></ul><p data-path-to-node=\"4\"><b data-path-to-node=\"4\" data-index-in-node=\"0\">ນິມິດຂອງພວກເຮົາ ແມ່ນ:</b> ເພື່ອຈະໄດ້ເຫັນທຸກວິນຍານໃນແຂວງບໍ່ແກ້ວໄດ້ຮັບການປ່ຽນແປງໃໝ່ໃນພຣະຄຣິດ, ທຸກກຸ່ມນະມັດສະການເຕີບໂຕໃນຄວາມເຊື່ອ, ແລະ ສືບຕໍ່ການອອກໄປສ້າງສາວົກຕໍ່ໆໄປ.</p>",
    "imageCustomSettings": [
      {
        "position": "50% 50%",
        "brightness": 100,
        "saturation": 100,
        "fit": "cover",
        "contrast": 100,
        "blur": 0
      },
      {},
      {},
      {
        "blur": 0,
        "fit": "cover",
        "contrast": 100,
        "brightness": 100,
        "saturation": 100,
        "position": "46% 32%"
      }
    ],
    "posterBrightness": 100,
    "bokeoTitle": "HOPE BOKEO",
    "bokeoImageUrl": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200",
    "bokeoDescTh": "<p data-path-to-node=\"2\"><b data-path-to-node=\"2\" data-index-in-node=\"0\">HOPE BOKEO</b> คือครอบครัวของผู้เชื่อและผู้รับใช้ในท้องถิ่นที่รวมตัวกันด้วยการทรงเรียกที่เรียบง่ายแต่ลึกซึ้ง นั่นคือ: การดำเนินชีวิตตามพระบัญญัติและการตอบสนองต่อพระมหาบัญชาทั่วทั้งแขวงบ่อแก้ว เราคือกลุ่มผู้รับใช้ เป็นชุมชนที่อุทิศตนเพื่อสำแดงความรักของพระองค์ออกไปสู่ชุมชนต่างๆ โดยเริ่มจากชุมชนของเราเอง</p><ul data-path-to-node=\"3\"><li><p data-path-to-node=\"3,0,0\"><b data-path-to-node=\"3,0,0\" data-index-in-node=\"0\">ดำเนินชีวิตตามพระบัญญัติข้อใหญ่ (รักพระเจ้าและรักเพื่อนบ้าน)</b>\n<i data-path-to-node=\"3,0,0\" data-index-in-node=\"61\">“จงรักเพื่อนบ้านเหมือนรักตนเอง” (มัทธิว 22:39)</i>\nเราสำแดงความรักนี้ผ่านการรับใช้ในชีวิตจริง ไม่ว่าจะเป็นการลงพื้นที่อธิษฐานเผื่อคนเจ็บป่วย การช่วยเหลืองานในชุมชน การยืนเคียงข้างพี่น้องที่ถูกข่มเหงเพราะความเชื่อ การสอนหนังสือและสร้างกิจกรรมเพื่อพัฒนาเด็กกำพร้า เด็กด้อยโอกาส; เราปรารถนาให้ทุกกิจกรรมของเราสะท้อนถึงพระทัยของพระเยซู</p></li><li><p data-path-to-node=\"3,1,0\"><b data-path-to-node=\"3,1,0\" data-index-in-node=\"0\">ตอบสนองต่อพระมหาบัญชา (จงออกไปสร้างสาวก)</b>\n<i data-path-to-node=\"3,1,0\" data-index-in-node=\"41\">“เหตุฉะนั้น ท่านทั้งหลายจงออกไปและนำชนทุกชาติมาเป็นสาวก...” (มัทธิว 28:19)</i>\nพันธกิจของเราคือการได้เห็นชีวิตถูกเปลี่ยนแปลงโดยข่าวประเสริฐ เราเดินทางไปยังพื้นที่ห่างไกลทุรกันดารเพื่อประกาศข่าวดี จัดพิธีบัพติศมา และตั้งกลุ่มนมัสการตามบ้าน รวมถึงกลุ่มแคร์ใหม่ๆ เพื่อให้ดอกผลเหล่านี้ขยายตัว เรามีการจัดการพบปะผู้นำกลุ่มนมัสการท้องถิ่นในทุกๆ เดือนเพื่อเป็นพี่เลี้ยง ฝึกอบรม และเสริมสร้างผู้นำเหล่านี้ให้สามารถเลี้ยงดูชุมชนของตนเองได้</p></li></ul><p data-path-to-node=\"4\"><b data-path-to-node=\"4\" data-index-in-node=\"0\">นิมิตของเราคือ:</b> เพื่อจะได้เห็นทุกจิตวิญญาณในแขวงบ่อแก้วได้รับการเปลี่ยนแปลงใหม่ในพระคริสต์ ทุกกลุ่มนมัสการเติบโตขึ้นในความเชื่อ และสืบต่อการออกไปสร้างสาวกต่อไป</p>",
    "descriptionEn": "Be a vital part of advancing God’s work in Bokeo Province through tracking, faithful prayer, and supporting field operations.",
    "bokeoDescEn": "<p data-path-to-node=\"7\"><b data-path-to-node=\"7\" data-index-in-node=\"0\">HOPE BOKEO</b> is a family of local believers and servants united by a simple yet profound calling: to live out the Great Commandment and respond to the Great Commission throughout Bokeo Province. We are a group of servants, a community dedicated to displaying His love to various communities, starting with our own.</p><ul data-path-to-node=\"8\"><li><p data-path-to-node=\"8,0,0\"><b data-path-to-node=\"8,0,0\" data-index-in-node=\"0\">Living the Great Commandment (Love God and Love Your Neighbor)</b>\n<i data-path-to-node=\"8,0,0\" data-index-in-node=\"63\">\"Love your neighbor as yourself.\" (Matthew 22:39).</i>\nWe express this love through practical, real-life service. Whether it is praying for the sick, helping with community work, standing beside brothers and sisters persecuted for their faith, teaching literacy, or creating developmental activities for orphans and disadvantaged children; we desire for all our activities to reflect the heart of Jesus.</p></li><li><p data-path-to-node=\"8,1,0\"><b data-path-to-node=\"8,1,0\" data-index-in-node=\"0\">Responding to the Great Commission (Go and Make Disciples)</b>\n<i data-path-to-node=\"8,1,0\" data-index-in-node=\"59\">\"Therefore go and make disciples of all nations...\" (Matthew 28:19).</i>\nOur mission is to see lives transformed by the Gospel. We travel to remote areas to proclaim the good news, conduct baptisms, and establish home worship groups, including new care groups. For these fruits to multiply, we hold monthly meetings with local worship group leaders to mentor, train, and equip them to shepherd their own communities.</p></li></ul><p data-path-to-node=\"9\"><b data-path-to-node=\"9\" data-index-in-node=\"0\">Our Vision is:</b> To see every soul in Bokeo Province renewed in Christ, every worship group growing in faith, and continuing to go out and make disciples.</p>",
    "buttonTextTh": "ดูแดชบอร์ดข้อมูล",
    "showTextOverlay": true,
    "videoUrl": "/uploads/img_1786429196319_5c9ce.jpg",
    "posterSaturation": 100,
    "bokeoTimeline": DEFAULT_BOKEO_TIMELINE,
    "bokeoTimelineTitle": "ຈຸດເລີ່ມຕົ້ນ ແລະ ການເດີນທາງຂອງພັນທະກິດ",
    "bokeoTimelineTitleEn": "Story timeline",
    "bokeoTimelineTitleTh": "จุดเริ่มต้นและการเดินทางของพันธกิจ",
    "hideBokeoTimeline": false
  },
  "donationInfo": {
    "bankName": "ທະນາຄານ ການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ (BCEL)",
    "bankNameEn": "Banque Pour Le Commerce Exterieur Lao Public (BCEL)",
    "bankNameTh": "",
    "accountName": "HOPE BOKEO MINISTRY PROJECT",
    "accountNumber": "010-12-00-012345678-001",
    "swiftCode": "BCELLA2X",
    "qrImageUrl": "/uploads/donation_qr.jpg",
    "bankAccounts": [
      {
        "accountName": "HOPE BOKEO MINISTRY PROJECT",
        "accountNumber": "010-12-00-012345678-001",
        "bankNameTh": "",
        "swiftCode": "BCELLA2X",
        "bankNameEn": "Banque Pour Le Commerce Exterieur Lao Public (BCEL)",
        "qrImageUrl": "/uploads/inline_ebd0e11345d3.png",
        "hidden": false,
        "id": "1",
        "bankName": "ທະນາຄານ ການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ (BCEL)"
      },
      {
        "accountName": "HOPE BOKEO MINISTRY PROJECT",
        "bankNameEn": "Lao Development Bank (LDB)",
        "swiftCode": "LDBLA2X",
        "qrImageUrl": "/uploads/inline_bdf9f14f43aa.png",
        "id": "2",
        "hidden": false,
        "bankName": "ທະນາຄານ ພັດທະນາລາວ (LDB)",
        "accountNumber": "160-11-00-098765432-002",
        "bankNameTh": ""
      },
      {
        "bankNameEn": "Joint Development Bank (JDB)",
        "accountName": "HOPE BOKEO MINISTRY PROJECT",
        "swiftCode": "JDBLA2X",
        "accountNumber": "020-15-00-055443322-003",
        "qrImageUrl": "/uploads/inline_24239c18d969.png",
        "hidden": false,
        "id": "3",
        "bankNameTh": "",
        "bankName": "ທະນາຄານ ຮ່ວມພັດທະນາ (JDB)"
      }
    ],
    "prayerContactPhone": "+856 20 55512345",
    "prayerContactWhatsapp": "+856 20 76838584",
    "prayerContactEmail": "info@hopebokeo.org",
    "supportNote": "ທຸກໆການຮ່ວມບໍລິຈາກ ແລະ ຄຳອະທິຖານຂອງທ່ານ ແມ່ນມີຄຸນຄ່າຢ່າງຍິ່ງ ເພື່ອຂະຫຍາຍແຜ່ນດິນຂອງພຣະເຈົ້າ ແລະ ຊ່ວຍເຫຼືອຊຸມຊົນໃນແຂວງບໍ່ແກ້ວ.",
    "supportNoteEn": "Your donations and faithful prayers are deeply appreciated to help expand God’s Kingdom and empower local communities across Bokeo Province.",
    "supportNoteTh": "ทุกๆ การร่วมบริจาคและคำอธิษฐานของคุณมีคุณค่าอย่างยิ่ง เพื่อขยายแผ่นดินของพระเจ้าและช่วยเหลือชุมชนในแขวงบ่อแก้ว",
    "vision": "ສ້າງສາວົກ ແລະ ຂະຫຍາຍແຜ່ນດິນຂອງພຣະເຈົ້າໃຫ້ຄວບຄຸມທຸກພື້ນທີ່ໃນແຂວງບໍ່ແກ້ວ.\n\nພວກເຮົາປາຖະໜາທີ່ຈະເຫັນທຸກໝູ່ບ້ານໄດ້ຍິນຂ່າວປະເສີດ ແລະ ມີຄິດສະຈັກທີ່ເຂັ້ມແຂງຕັ້ງຢູ່ ເພື່ອເປັນຄວາມສະຫວ່າງໃຫ້ແກ່ຊຸມຊົນ.",
    "visionEn": "Disciple nations and expand the Kingdom of God across every district in Bokeo Province.\n\nWe desire to see every village hear the Gospel and establish vibrant local fellowships that serve as light to their communities.",
    "visionTh": "สร้างสาวกและขยายแผ่นดินของพระเจ้าให้ครอบคลุมทุกพื้นที่ในแขวงบ่อแก้ว\n\nเราปรารถนาที่จะเห็นทุกหมู่บ้านได้ยินข่าวประเสริฐ และมีคริสตจักรที่เข้มแข็งตั้งอยู่เพื่อเป็นความสว่างแก่ชุมชน",
    "mission": "ປະກາດຂ່າວປະເສີດຢ່າງກ້າຫານໃນທຸກໆບ້ານ.\nຝຶກອົບຮົມ ແລະ ສ້າງຜູ້ນຳທ້ອງຖິ່ນໃຫ້ເຂັ້ມແຂງ.\nຊ່ວຍເຫຼືອສັງຄົມ ແລະ ຜູ້ທີ່ຖືກຂົ່ມເຫັງທຸກຢາກ.\nອະທິຖານວິງວອນ ແລະ ຕິດຕາມຜົນຢ່າງໃກ້ຊິດ.",
    "missionEn": "Proclaim the Gospel boldly in every village.\nTrain and equip local spiritual leaders.\nProvide humanitarian care and relief to the needy.\nIntercede continuously and faithfully track ministry fruit.",
    "missionTh": "ประกาศข่าวประเสริฐอย่างกล้าหาญในทุกๆ หมู่บ้าน\nฝึกอบรมและสร้างผู้นำท้องถิ่นให้เข้มแข็ง\nช่วยเหลือสังคมและผู้ที่ถูกข่มเหงยากลำบาก\nอธิษฐานวิงวອນและติดตามผลอย่างใกล้ชิด",
    "purposeDesc": "ເງິນບໍລິຈາກທັງໝົດຈະຖືກນຳໃຊ້ເຂົ້າໃນການສະໜັບສະໜູນພັນທະກິດພາກສະໜາມ, ການສ້າງຄຣິດຕະຈັກ, ການຊ່ວຍເຫຼືອຊຸມຊົນ, ການຝຶກອົບຮົມຜູ້ນຳ, ແລະ ການບັນເທົາທຸກໃນ 5 ເມືອງຂອງແຂວງບໍ່ແກ້ວ.",
    "purposeDescEn": "All donations directly fund field ministry operations, church planting, leadership training, youth activities, and community relief across all 5 districts of Bokeo Province.",
    "purposeDescTh": "เงินบริจาคทั้งหมดจะถูกนำไปใช้ในการสนับสนุนพันธกิจภาคสนาม การสร้างคริสตจักร การช่วยเหลือชุมชน การฝึกอบรมผู้นำ และการบรรเทาทุกข์ใน 5 เมืองของแขวงบ่อแก้ว",
    "hidden": true,
    "hideDonationSection": true,
    "hideVisionMission": false
  }
};

export async function loadFirestoreData() {
  try {
    let villages: any[] = [];
    let events: any[] = [];
    let teams: any[] = [];

    try {
      const villagesSnap = await getDocs(collection(db, VILLAGES_COL));
      villages = villagesSnap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id || data.id,
          heard: Number(data.heard) || 0,
          believers: Number(data.believers) || 0,
          baptized: Number(data.baptized) || 0,
          attending: typeof data.attending === 'number' ? data.attending : (Number(data.attending) || 0),
          leaders: typeof data.leaders === 'number' ? data.leaders : (Number(data.leaders) || 0),
        };
      });
    } catch (e: any) {
      console.warn('Notice loading villages from Firestore (offline/cached):', e?.message || e);
    }

    try {
      const eventsSnap = await getDocs(collection(db, EVENTS_COL));
      events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('Notice loading events from Firestore (offline/cached):', e?.message || e);
    }

    try {
      const teamsSnap = await getDocs(collection(db, TEAMS_COL));
      teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('Notice loading teams from Firestore (offline/cached):', e?.message || e);
    }

    // Merge teams with default reference teams so QR codes and bank details are never lost
    const defTeamsMap = new Map((initialDefaultData.teams || []).map((t: any) => [t.name?.trim().toLowerCase(), t]));
    if (teams.length > 0) {
      teams = teams.map((t: any) => {
        const def = defTeamsMap.get(t.name?.trim().toLowerCase());
        if (def) {
          return {
            ...def,
            ...t,
            financeQrUrl: (t.financeQrUrl && t.financeQrUrl.trim() !== '') ? t.financeQrUrl : (def.financeQrUrl || ''),
            bankName: (t.bankName && t.bankName.trim() !== '') ? t.bankName : (def.bankName || 'BCEL One'),
            bankAccountNumber: (t.bankAccountNumber && t.bankAccountNumber.trim() !== '') ? t.bankAccountNumber : (def.bankAccountNumber || ''),
            bankAccountName: (t.bankAccountName && t.bankAccountName.trim() !== '') ? t.bankAccountName : (def.bankAccountName || t.name),
            imageUrl: (t.imageUrl && t.imageUrl.trim() !== '') ? t.imageUrl : (def.imageUrl || ''),
          };
        }
        return t;
      });
      // Append any default members missing from Firestore
      (initialDefaultData.teams || []).forEach((def: any) => {
        const exists = teams.some((t: any) => t.name?.trim().toLowerCase() === def.name?.trim().toLowerCase());
        if (!exists) teams.push({ ...def });
      });
    }

    // Only fallback in memory if completely empty on fresh install; NEVER overwrite database destructively
    if (villages.length === 0 && events.length === 0 && teams.length === 0) {
      console.log('Using default reference data for initial view');
      villages = [...initialDefaultData.villages];
      events = [...initialDefaultData.events];
      teams = [...initialDefaultData.teams];
    }

    let homePoster = initialDefaultData.homePoster;
    try {
      const homePosterDoc = await getDoc(doc(db, CONFIG_COL, 'homePoster'));
      if (homePosterDoc.exists()) {
        homePoster = { ...initialDefaultData.homePoster, ...homePosterDoc.data() };
      }
    } catch (e: any) {
      console.warn('Notice: homePoster doc not yet cached or offline, using default:', e?.message || e);
    }

    let donationInfo = initialDefaultData.donationInfo;
    try {
      const donationDoc = await getDoc(doc(db, CONFIG_COL, 'donationInfo'));
      if (donationDoc.exists()) {
        donationInfo = { ...initialDefaultData.donationInfo, ...donationDoc.data() };
      }
    } catch (e: any) {
      console.warn('Notice: donationInfo doc not yet cached or offline, using default:', e?.message || e);
    }

    return {
      villages: villages as any[],
      events: events as any[],
      teams: teams as any[],
      homePoster,
      donationInfo
    };
  } catch (err: any) {
    console.warn('Warning loading data from Firestore (gracefully using fallback):', err?.message || err);
    return initialDefaultData;
  }
}

export async function saveVillageToFirestore(village: any) {
  const docId = village.id || `v_${village.rowId || Date.now()}`;
  let finalLat = typeof village.lat === 'number' && !isNaN(village.lat) ? village.lat : undefined;
  let finalLng = typeof village.lng === 'number' && !isNaN(village.lng) ? village.lng : undefined;

  if (finalLat !== undefined && finalLng !== undefined) {
    const norm = normalizeCoordinates(finalLat, finalLng);
    if (norm) {
      finalLat = norm.lat;
      finalLng = norm.lng;
    }
  } else if (village.mapUrl && typeof village.mapUrl === 'string' && village.mapUrl.trim()) {
    const parsed = parseCoordinatesFromUrl(village.mapUrl);
    if (parsed) {
      finalLat = parsed.lat;
      finalLng = parsed.lng;
    }
  }

  const payload = {
    ...village,
    id: docId,
    heard: Number(village.heard) || 0,
    believers: Number(village.believers) || 0,
    baptized: Number(village.baptized) || 0,
    attending: typeof village.attending === 'number' ? village.attending : (Number(village.attending) || 0),
    leaders: typeof village.leaders === 'number' ? village.leaders : (Number(village.leaders) || 0),
    hidden: Boolean(village.hidden),
    ...(finalLat !== undefined ? { lat: finalLat } : {}),
    ...(finalLng !== undefined ? { lng: finalLng } : {}),
  };
  await setDoc(doc(db, VILLAGES_COL, docId), sanitizeForFirestore(payload));

  // Clean up duplicate docs if id changed or rowId matches
  try {
    const snap = await getDocs(collection(db, VILLAGES_COL));
    for (const d of snap.docs) {
      if (d.id !== docId && d.data().rowId === village.rowId) {
        await deleteDoc(doc(db, VILLAGES_COL, d.id)).catch(() => {});
      }
    }
  } catch (e) {
    console.warn('Cleanup duplicate villages warning:', e);
  }

  return payload;
}

export async function deleteVillageFromFirestore(rowId: number, id?: string) {
  if (id) {
    await deleteDoc(doc(db, VILLAGES_COL, id));
  } else {
    const snap = await getDocs(collection(db, VILLAGES_COL));
    for (const d of snap.docs) {
      if (d.data().rowId === rowId) {
        await deleteDoc(doc(db, VILLAGES_COL, d.id));
      }
    }
  }
}

export async function saveEventToFirestore(event: any) {
  const docId = event.id || `e_${event.rowId || Date.now()}`;
  let safeEvent = { ...event };

  // Guard against Firestore 1MB document limit:
  // If docUrl or docUrls contain oversized base64 data URIs (>100KB), prevent Firestore rejection
  if (typeof safeEvent.docUrl === 'string' && safeEvent.docUrl.startsWith('data:') && safeEvent.docUrl.length > 100000) {
    console.warn('saveEventToFirestore: docUrl contains oversized base64 (>100KB), sanitizing for Firestore.');
    safeEvent.docUrl = '';
  }
  if (Array.isArray(safeEvent.docUrls)) {
    safeEvent.docUrls = safeEvent.docUrls.map((u: string) => {
      if (typeof u === 'string' && u.startsWith('data:') && u.length > 100000) {
        return '';
      }
      return u;
    }).filter(Boolean);
  }

  if (Array.isArray(safeEvent.monthlyReports)) {
    safeEvent.monthlyReports = safeEvent.monthlyReports.map((r: any) => {
      let rDoc = r.docUrl;
      if (typeof rDoc === 'string' && rDoc.startsWith('data:') && rDoc.length > 100000) {
        rDoc = '';
      }
      let rDocs = Array.isArray(r.docUrls) ? r.docUrls.map((u: string) => {
        if (typeof u === 'string' && u.startsWith('data:') && u.length > 100000) {
          return '';
        }
        return u;
      }).filter(Boolean) : [];

      let rImgs = Array.isArray(r.imageUrls) ? r.imageUrls.map((u: string) => {
        if (typeof u === 'string' && u.startsWith('data:') && u.length > 200000) {
          return '';
        }
        return u;
      }).filter(Boolean) : [];

      return {
        ...r,
        docUrl: rDoc,
        docUrls: rDocs,
        imageUrls: rImgs,
      };
    });
  }

  // Guard against Firestore 1MB document limit for images
  if (Array.isArray(safeEvent.imageUrls)) {
    safeEvent.imageUrls = safeEvent.imageUrls.map((u: string) => {
      if (typeof u === 'string' && u.startsWith('data:') && u.length > 250000) {
        return '';
      }
      return u;
    }).filter(Boolean);
  }

  if (JSON.stringify(safeEvent).length > 800000) {
    if (Array.isArray(safeEvent.imageUrls)) {
      safeEvent.imageUrls = safeEvent.imageUrls.slice(0, 5);
    }
  }
  await setDoc(doc(db, EVENTS_COL, docId), sanitizeForFirestore(safeEvent), { merge: true });
  return safeEvent;
}

export async function deleteEventFromFirestore(rowId: number, id?: string) {
  if (id) {
    await deleteDoc(doc(db, EVENTS_COL, id));
  } else {
    const snap = await getDocs(collection(db, EVENTS_COL));
    for (const d of snap.docs) {
      if (d.data().rowId === rowId) {
        await deleteDoc(doc(db, EVENTS_COL, d.id));
      }
    }
  }
}

export async function saveTeamToFirestore(team: any) {
  const docId = team.id || `t_${team.rowId || Date.now()}`;
  
  // Read existing doc to prevent updates from accidentally wiping out QR codes, images, or bank info
  let existingData: any = {};
  try {
    const snap = await getDoc(doc(db, TEAMS_COL, docId));
    if (snap.exists()) {
      existingData = snap.data() || {};
    }
  } catch (e) {
    // Ignore read errors
  }

  const teamPayload = {
    ...existingData,
    ...team,
    id: docId,
    hidden: team.hidden !== undefined ? Boolean(team.hidden) : Boolean(existingData.hidden),
    // Crucial safeguard: protect existing QR code, photo, and bank info from being replaced by empty strings
    financeQrUrl: (team.financeQrUrl && team.financeQrUrl.trim() !== '')
      ? team.financeQrUrl.trim()
      : (existingData.financeQrUrl || ''),
    imageUrl: (team.imageUrl && team.imageUrl.trim() !== '')
      ? team.imageUrl.trim()
      : (existingData.imageUrl || ''),
    bankAccountNumber: (team.bankAccountNumber && team.bankAccountNumber.trim() !== '')
      ? team.bankAccountNumber.trim()
      : (existingData.bankAccountNumber || ''),
    bankName: (team.bankName && team.bankName.trim() !== '')
      ? team.bankName.trim()
      : (existingData.bankName || 'BCEL One'),
    bankAccountName: (team.bankAccountName && team.bankAccountName.trim() !== '')
      ? team.bankAccountName.trim()
      : (existingData.bankAccountName || existingData.name || team.name || ''),
  };

  await setDoc(doc(db, TEAMS_COL, docId), sanitizeForFirestore(teamPayload), { merge: true });

  // Clean up exact old doc ID if rowId was migrated
  if (team.rowId) {
    try {
      const snap = await getDocs(collection(db, TEAMS_COL));
      for (const d of snap.docs) {
        if (d.id !== docId && d.data().rowId === team.rowId && d.id.startsWith('t_temp_')) {
          await deleteDoc(doc(db, TEAMS_COL, d.id)).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Cleanup duplicate teams warning:', e);
    }
  }

  return teamPayload;
}

export async function deleteTeamFromFirestore(rowId: number, id?: string) {
  if (id) {
    await deleteDoc(doc(db, TEAMS_COL, id)).catch(() => {});
  }
  const snap = await getDocs(collection(db, TEAMS_COL));
  for (const d of snap.docs) {
    if (d.data().rowId === rowId || d.id === id || d.id === `t_${rowId}`) {
      await deleteDoc(doc(db, TEAMS_COL, d.id)).catch(() => {});
    }
  }
}

export async function saveHomePosterToFirestore(poster: any) {
  let safePoster = poster;
  if (!safePoster?._isOptimized) {
    safePoster = await optimizePosterForFirestore(poster);
  }
  const jsonSize = JSON.stringify(safePoster).length;
  
  if (jsonSize > 850000) {
    console.warn(`saveHomePosterToFirestore: Document size ${jsonSize} is high. Running emergency compression...`);
    safePoster = await emergencyCompressObject(safePoster);
  }

  try {
    await setDoc(doc(db, CONFIG_COL, 'homePoster'), sanitizeForFirestore(safePoster));
  } catch (err: any) {
    console.warn('Firestore setDoc initial attempt warning:', err);
    // If size limit error occurred, run emergency compression and retry
    if (err?.message?.includes('exceeds the maximum allowed size') || err?.message?.includes('too large') || jsonSize > 850000) {
      console.warn('Retrying saveHomePoster with deep compression...');
      safePoster = await emergencyCompressObject(safePoster);
      await setDoc(doc(db, CONFIG_COL, 'homePoster'), sanitizeForFirestore(safePoster));
      return;
    }
    throw err;
  }
}

export async function saveDonationInfoToFirestore(info: any) {
  await setDoc(doc(db, CONFIG_COL, 'donationInfo'), sanitizeForFirestore(info), { merge: true });
}

function mergeWithDefaultDonations(loaded: any[]): any[] {
  if (Array.isArray(loaded)) {
    return loaded;
  }
  return initialDefaultFinanceData.donations;
}

function mergeWithDefaultDistributions(loaded: any[]): any[] {
  if (Array.isArray(loaded)) {
    return loaded;
  }
  return initialDefaultFinanceData.distributions;
}

export async function loadFinanceData() {
  // 1. Check local storage cache for instant offline access
  let cachedDonations: any[] = [];
  let cachedDistributions: any[] = [];
  let cachedSettings: any = null;

  try {
    if (typeof localStorage !== 'undefined') {
      const donRaw = localStorage.getItem('hb_cached_donations');
      if (donRaw) {
        const parsed = JSON.parse(donRaw) || [];
        if (parsed.some((d: any) => d.id === 'don_20260805_001')) {
          localStorage.removeItem('hb_cached_donations');
          localStorage.removeItem('hb_cached_distributions');
          cachedDonations = [];
          cachedDistributions = [];
        } else {
          cachedDonations = parsed;
        }
      }
      const distRaw = localStorage.getItem('hb_cached_distributions');
      if (distRaw) cachedDistributions = JSON.parse(distRaw) || [];
      const setRaw = localStorage.getItem('hb_cached_finance_settings');
      if (setRaw) cachedSettings = JSON.parse(setRaw);
    }
  } catch {}

  let apiDonations: any[] = [];
  let apiDistributions: any[] = [];
  let apiSettings: any = null;

  // 2. Fetch from backend /api/finance-data (disk ledger backup)
  try {
    const res = await fetch('/api/finance-data');
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        apiDonations = Array.isArray(json.donations) ? json.donations : [];
        apiDistributions = Array.isArray(json.distributions) ? json.distributions : [];
        apiSettings = json.financeSettings || null;
      }
    }
  } catch {}

  // 3. Also read from Firestore (online or cache) so records added on live deployments are never lost
  let fsDonations: any[] = [];
  let fsDistributions: any[] = [];
  try {
    try {
      const donSnap = await getDocs(collection(db, DONATIONS_COL));
      fsDonations = donSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const distSnap = await getDocs(collection(db, DISTRIBUTIONS_COL));
      fsDistributions = distSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
      try {
        const { getDocsFromCache } = await import('firebase/firestore');
        const donSnap = await getDocsFromCache(collection(db, DONATIONS_COL));
        fsDonations = donSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const distSnap = await getDocsFromCache(collection(db, DISTRIBUTIONS_COL));
        fsDistributions = distSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {}
    }
  } catch {}

  // Merge by ID (combining disk ledger + Firestore records)
  const mergeById = (primary: any[], secondary: any[]) => {
    const map = new Map<string, any>();
    for (const item of secondary) {
      if (item && item.id) map.set(item.id, item);
    }
    for (const item of primary) {
      if (item && item.id) {
        const existing = map.get(item.id);
        map.set(item.id, existing ? { ...existing, ...item } : item);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      String(b.createdAt || b.date || b.transferDate || '').localeCompare(
        String(a.createdAt || a.date || a.transferDate || '')
      )
    );
  };

  const combinedDonations =
    fsDonations.length > 0 || apiDonations.length > 0
      ? mergeById(fsDonations, apiDonations)
      : cachedDonations;

  const combinedDistributions =
    fsDistributions.length > 0 || apiDistributions.length > 0
      ? mergeById(fsDistributions, apiDistributions)
      : cachedDistributions;

  const finalDonations = mergeWithDefaultDonations(
    combinedDonations.length > 0 ? combinedDonations : initialDefaultFinanceData.donations
  );
  const finalDistributions = mergeWithDefaultDistributions(
    combinedDistributions.length > 0 ? combinedDistributions : initialDefaultFinanceData.distributions
  );
  const finalSettings = apiSettings || cachedSettings || initialDefaultFinanceData.financeSettings;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hb_cached_donations', JSON.stringify(finalDonations));
      localStorage.setItem('hb_cached_distributions', JSON.stringify(finalDistributions));
      localStorage.setItem('hb_cached_finance_settings', JSON.stringify(finalSettings));
    }
  } catch {}

  return {
    donations: finalDonations,
    distributions: finalDistributions,
    financeSettings: finalSettings,
  };
}

export async function saveFinanceSettingsToFirestore(settings: { emergencyReservePercent: number }) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hb_cached_finance_settings', JSON.stringify(settings));
    }
  } catch {}

  fetch('/api/save-finance-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  }).catch(() => {});

  try {
    await setDoc(doc(db, CONFIG_COL, 'financeSettings'), sanitizeForFirestore(settings));
  } catch (e) {
    console.warn('Firestore setDoc notice for financeSettings:', e);
  }
}

export async function saveDonationTransactionToFirestore(item: any) {
  const docId = item.id || `don_${Date.now()}`;
  const payload = { ...item, id: docId };

  // 1. Update localStorage cache immediately
  try {
    if (typeof localStorage !== 'undefined') {
      const donRaw = localStorage.getItem('hb_cached_donations');
      const list = donRaw ? JSON.parse(donRaw) : [];
      const idx = list.findIndex((x: any) => x.id === docId);
      if (idx >= 0) list[idx] = payload;
      else list.unshift(payload);
      localStorage.setItem('hb_cached_donations', JSON.stringify(list));
    }
  } catch {}

  // 2. Dispatch to server backend for disk persistence
  fetch('/api/save-donation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});

  // 3. Persist to Firestore
  try {
    await setDoc(doc(db, DONATIONS_COL, docId), sanitizeForFirestore(payload));
  } catch (e) {
    console.warn('Firestore setDoc notice for donation transaction:', e);
  }

  return payload;
}

export async function deleteDonationTransactionFromFirestore(id: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      const donRaw = localStorage.getItem('hb_cached_donations');
      const list = donRaw ? JSON.parse(donRaw) : [];
      const filtered = list.filter((x: any) => x.id !== id);
      localStorage.setItem('hb_cached_donations', JSON.stringify(filtered));
    }
  } catch {}

  try {
    await fetch('/api/delete-donation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  } catch {}

  try {
    await deleteDoc(doc(db, DONATIONS_COL, id));
  } catch (e) {
    console.warn('Firestore deleteDoc notice for donation transaction:', e);
  }
}

export async function saveTeamDistributionToFirestore(item: any) {
  const docId = item.id || `dist_${Date.now()}`;
  const payload = { ...item, id: docId };

  // 1. Update localStorage cache immediately
  try {
    if (typeof localStorage !== 'undefined') {
      const distRaw = localStorage.getItem('hb_cached_distributions');
      const list = distRaw ? JSON.parse(distRaw) : [];
      const idx = list.findIndex((x: any) => x.id === docId);
      if (idx >= 0) list[idx] = payload;
      else list.unshift(payload);
      localStorage.setItem('hb_cached_distributions', JSON.stringify(list));
    }
  } catch {}

  // 2. Dispatch to server backend for disk persistence
  fetch('/api/save-distribution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});

  // 3. Persist to Firestore
  try {
    await setDoc(doc(db, DISTRIBUTIONS_COL, docId), sanitizeForFirestore(payload));
  } catch (e) {
    console.warn('Firestore setDoc notice for team distribution:', e);
  }

  return payload;
}

export async function deleteTeamDistributionFromFirestore(id: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      const distRaw = localStorage.getItem('hb_cached_distributions');
      const list = distRaw ? JSON.parse(distRaw) : [];
      const filtered = list.filter((x: any) => x.id !== id);
      localStorage.setItem('hb_cached_distributions', JSON.stringify(filtered));
    }
  } catch {}

  try {
    await fetch('/api/delete-distribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  } catch {}

  try {
    await deleteDoc(doc(db, DISTRIBUTIONS_COL, id));
  } catch (e) {
    console.warn('Firestore deleteDoc notice for team distribution:', e);
  }
}

export async function deleteBatchDistributionsFromFirestore(batchId: string, itemIds?: string[], batchName?: string) {
  const ids = Array.isArray(itemIds) ? itemIds : [];
  const idSet = new Set(ids);

  try {
    if (typeof localStorage !== 'undefined') {
      const distRaw = localStorage.getItem('hb_cached_distributions');
      const list = distRaw ? JSON.parse(distRaw) : [];
      const filtered = list.filter((x: any) => {
        if (idSet.has(x.id)) return false;
        if (batchId && (x.batchId === batchId || x.batchName === batchId)) return false;
        if (batchName && (x.batchName === batchName || x.batchId === batchName)) return false;
        return true;
      });
      localStorage.setItem('hb_cached_distributions', JSON.stringify(filtered));
    }
  } catch {}

  try {
    await fetch('/api/delete-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, ids, batchName }),
    });
  } catch {}

  for (const id of ids) {
    try {
      await deleteDoc(doc(db, DISTRIBUTIONS_COL, id));
    } catch {}
  }
}

export async function loadFinanceQrMembers() {
  const defaultList = (initialDefaultFinanceQrMembers as any[]) || [];
  let cachedQr: any[] = [];
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('hb_cached_qr_members');
      if (raw) cachedQr = JSON.parse(raw) || [];
    }
  } catch {}

  // Helper to merge list with defaultList to never lose any QR image or bank info
  const mergeWithDefaults = (primaryList: any[]): any[] => {
    const map = new Map<string, any>();
    (defaultList || []).forEach((def: any) => {
      map.set(def.name?.trim().toLowerCase(), { ...def });
    });
    (primaryList || []).forEach((p: any) => {
      const key = p.name?.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          ...p,
          financeQrUrl: (p.financeQrUrl && p.financeQrUrl.trim() !== '') ? p.financeQrUrl : (existing.financeQrUrl || ''),
          imageUrl: (p.imageUrl && p.imageUrl.trim() !== '') ? p.imageUrl : (existing.imageUrl || ''),
          bankName: (p.bankName && p.bankName.trim() !== '') ? p.bankName : (existing.bankName || 'BCEL One'),
          bankAccountName: (p.bankAccountName && p.bankAccountName.trim() !== '') ? p.bankAccountName : (existing.bankAccountName || p.name),
          bankAccountNumber: (p.bankAccountNumber && p.bankAccountNumber.trim() !== '') ? p.bankAccountNumber : (existing.bankAccountNumber || ''),
        });
      } else {
        map.set(key || p.id, p);
      }
    });
    return Array.from(map.values());
  };

  // 1. Fetch from server backend
  try {
    const res = await fetch('/api/finance-qr-members');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.qrMembers) && json.qrMembers.length > 0) {
        const merged = mergeWithDefaults(json.qrMembers);
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('hb_cached_qr_members', JSON.stringify(merged));
          }
        } catch {}
        return merged;
      }
    }
  } catch {}

  // 2. Try Firestore
  try {
    const snap = await getDocs(collection(db, FINANCE_QR_MEMBERS_COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (list.length > 0) {
      const merged = mergeWithDefaults(list);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('hb_cached_qr_members', JSON.stringify(merged));
        }
      } catch {}
      return merged;
    }
  } catch {
    try {
      const { getDocsFromCache } = await import('firebase/firestore');
      const snap = await getDocsFromCache(collection(db, FINANCE_QR_MEMBERS_COL));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (list.length > 0) {
        const merged = mergeWithDefaults(list);
        return merged;
      }
    } catch {}
  }

  const finalResult = mergeWithDefaults(cachedQr);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hb_cached_qr_members', JSON.stringify(finalResult));
    }
  } catch {}
  // Silently seed Firestore with defaults in background
  Promise.all(finalResult.map((m) => saveFinanceQrMemberToFirestore(m))).catch(() => {});
  return finalResult;
}

export async function saveFinanceQrMemberToFirestore(item: any) {
  const docId = item.id || `fq_${Date.now()}`;

  let existingData: any = {};
  try {
    const snap = await getDoc(doc(db, FINANCE_QR_MEMBERS_COL, docId));
    if (snap.exists()) {
      existingData = snap.data() || {};
    }
  } catch {}

  const payload = {
    ...existingData,
    ...item,
    id: docId,
    financeQrUrl: (item.financeQrUrl && item.financeQrUrl.trim() !== '')
      ? item.financeQrUrl.trim()
      : (existingData.financeQrUrl || ''),
    imageUrl: (item.imageUrl && item.imageUrl.trim() !== '')
      ? item.imageUrl.trim()
      : (existingData.imageUrl || ''),
    bankAccountNumber: (item.bankAccountNumber && item.bankAccountNumber.trim() !== '')
      ? item.bankAccountNumber.trim()
      : (existingData.bankAccountNumber || ''),
    bankName: (item.bankName && item.bankName.trim() !== '')
      ? item.bankName.trim()
      : (existingData.bankName || 'BCEL One'),
    bankAccountName: (item.bankAccountName && item.bankAccountName.trim() !== '')
      ? item.bankAccountName.trim()
      : (existingData.bankAccountName || existingData.name || item.name || ''),
  };

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('hb_cached_qr_members');
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((x: any) => x.id === docId);
      if (idx >= 0) list[idx] = payload;
      else list.push(payload);
      localStorage.setItem('hb_cached_qr_members', JSON.stringify(list));
    }
  } catch {}

  fetch('/api/save-finance-qr-member', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});

  try {
    await setDoc(doc(db, FINANCE_QR_MEMBERS_COL, docId), sanitizeForFirestore(payload), { merge: true });
  } catch (e) {
    console.warn('Firestore setDoc notice for QR member:', e);
  }

  return payload;
}

export async function deleteFinanceQrMemberFromFirestore(id: string) {
  if (!id) return;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('hb_cached_qr_members');
      const list = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((x: any) => x.id !== id);
      localStorage.setItem('hb_cached_qr_members', JSON.stringify(filtered));
    }
  } catch {}

  fetch('/api/delete-finance-qr-member', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  }).catch(() => {});

  try {
    await deleteDoc(doc(db, FINANCE_QR_MEMBERS_COL, id));
  } catch {}
}

