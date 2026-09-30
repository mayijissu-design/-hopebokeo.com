import { db, collection, doc, getDocs, getDoc, setDoc, deleteDoc } from './firebase';
import { optimizePosterForFirestore, emergencyCompressObject } from '../utils/imageCompressor';
import { parseCoordinatesFromUrl, normalizeCoordinates } from '../utils/mapUtils';
import { DEFAULT_BOKEO_TIMELINE } from '../data/timelineDefaults';

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
      "roleEn": "",
      "role": "Public Relation",
      "imageUrl": "/uploads/team_phet.jpg",
      "bio": "",
      "email": "",
      "rowId": 1785158837395,
      "bioTh": "",
      "phone": "",
      "hidden": true,
      "name": "Phet",
      "bioEn": "",
      "roleTh": ""
    },
    {
      "id": "t_1785158921396",
      "email": "",
      "hidden": true,
      "name": "Hing",
      "roleTh": "",
      "imageUrl": "/uploads/team_hing.jpg",
      "roleEn": "Team Cordinator",
      "role": "ຜູ້ປະສານງານ ",
      "rowId": 1785158921396,
      "bioTh": "",
      "phone": "",
      "bio": "",
      "bioEn": ""
    },
    {
      "id": "t_1787587260190",
      "roleEn": "Life group leader",
      "role": "ຜູດູແລກຸ່ມ",
      "bioTh": "",
      "rowId": 1787587260190,
      "financeQrUrl": "",
      "phone": "",
      "bioEn": "",
      "bio": "",
      "bankAccountName": "Sayvon",
      "bankAccountNumber": "",
      "imageUrl": "/uploads/team_sayvon.jpg",
      "hidden": true,
      "email": "",
      "name": "Sayvon",
      "roleTh": "",
      "bankName": "BCEL One"
    },
    {
      "id": "t_1787587311761",
      "hidden": true,
      "roleTh": "",
      "role": "ຜູ້ດູແລກຸມ",
      "rowId": 1787587311761,
      "bioTh": "",
      "phone": "",
      "imageUrl": "/uploads/team_khou.jpg",
      "bioEn": "",
      "name": "khou",
      "email": "",
      "bio": "",
      "roleEn": "LG leader"
    },
    {
      "id": "t_1787587362219",
      "bioEn": "",
      "role": "ຜູ້ດູແລກຸ່ມ",
      "phone": "",
      "imageUrl": "",
      "roleTh": "",
      "bioTh": "",
      "rowId": 1787587362219,
      "hidden": true,
      "roleEn": "Group Leader",
      "email": "",
      "bio": "",
      "name": "Phonexay"
    },
    {
      "id": "t_1787587435987",
      "name": "Oudomphone",
      "roleEn": "Group leader",
      "phone": "",
      "bioEn": "",
      "imageUrl": "/uploads/team_oudomphone.jpg",
      "bioTh": "",
      "rowId": 1787587435987,
      "email": "",
      "roleTh": "",
      "bio": "",
      "hidden": true,
      "role": "ຜູ້ດູແລກຸ່ມ"
    },
    {
      "id": "t_1787587557269",
      "imageUrl": "/uploads/team_phard.jpg",
      "bio": "",
      "role": "ການເງິນ",
      "roleEn": "Finace",
      "email": "",
      "bioTh": "",
      "rowId": 1787587557269,
      "hidden": true,
      "name": "Phard",
      "roleTh": "",
      "bioEn": "",
      "phone": ""
    },
    {
      "id": "t_1788337598975",
      "bankAccountName": "Justin",
      "hidden": false,
      "roleTh": "",
      "role": "ຫົວໜ້າພັນທະກິດ",
      "financeQrUrl": "",
      "email": "Tinvyk88@gmail.com",
      "bankName": "BCEL One",
      "bankAccountNumber": "",
      "bioTh": "",
      "rowId": 1788337598975,
      "imageUrl": "/uploads/team_justin.jpg",
      "phone": "02076838584",
      "name": "Justin",
      "bioEn": "",
      "roleEn": "Ministry Admin",
      "bio": ""
    }
  ],
  "homePoster": {
    "title": "ປະກາດຂ່າວປະເສີດ ແລະ ສ້າງສາວົກ",
    "subtitle": "ແຂວງບໍ່ແກ້ວ",
    "description": "ຮ່ວມເປັນສ່ວນໜຶ່ງໃນການຂັບເຄື່ອນວຽກງານຂອງພຣະເຈົ້າໃນແຂວງບໍ່ແກ້ວ ໂດຍການຕິດຕາມ, ຮ່ວມອະທິຖານ ແລະ ສະໜັບສະໜູນວຽກງານພາກສະໜາມ.",
    "imageUrl": "/uploads/home_poster_banner.jpg",
    "imageUrls": [
      "/uploads/home_poster_banner.jpg"
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
    "logoUrl": "data:image/jpeg;base64,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",
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
        "qrImageUrl": "data:image/png;base64,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",
        "hidden": false,
        "id": "1",
        "bankName": "ທະນາຄານ ການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ (BCEL)"
      },
      {
        "accountName": "HOPE BOKEO MINISTRY PROJECT",
        "bankNameEn": "Lao Development Bank (LDB)",
        "swiftCode": "LDBLA2X",
        "qrImageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAAEYCAYAAACHjumMAAAQAElEQVR4Aeydi3LjOBIEnfv//7xn2KsbD1Etsy3SlMi8GFhWsVBoJHQdG/A8/vnX/0lAAhLYicA/b/5PAhKQwE4EbDA7gTVWAhJ4e7PB+Ck4LQE3djwBG8zxZ2AFEjgtARvMaY/WjUngeAI2mOPPwAokcFoCNpidjtZYCUjAS14/AxKQwI4E/C+YHeEaLYGrE7DBXP0T4P4l0CXQ8NtgGrC0SkACPQLtBgO8wfOOavsw19zxwjwfqCIurQMPf0a2AAiP1wE5o1sfzDlVBsxeeB6tqjvp7QaTQtQkIAEJJAI2mERF7XkJWNlLEbDBvNRxWawEXouADea1zstqJfBSBGwwL3VcFiuB1yKwWYP5999/335zdDGn2iDfzCfvhxb2CDkDHte7e+z4oVdfyoacUbFKGZUGObvjr+rYQu/UAcT/b1QZlb5F3Z2Mqo6OvlmD6SyqVwISuAYBG8w1ztldSuAQAjaYQ7C7qASejcA+9dhg9uFqqgQk8E5g1wYD+aIOevp7nQ//gnnNKhRmL2StujSrsjs65DXhcb2qo9oPzGt2vJAvOquMSq/qTjrMNcM2WlrvCA2eez+7NpgjgLumBCTwPARsMM9zFheuxK2flYAN5qwn674k8AQEbDBPcAiWIIGzErDBnPVk3ZcEnoDAZRpM+qnEJ//5a/JWGuRb/Dn1vlLlJ/1+0mNPIe8n1QHZ+1gFn7Ohl53qq7TPFeavyT+7fqbAvJ+fJb3WrMs0mNc6FquVwDkI2GDOcY7uQgJPScAG85THYlES2ITA4SE2mMOPwAIkcF4CNpjznq07k8DhBGww4QhgvvEHgvMt/kVC46cR0fwujmdpvD/a5Vdaa2jdxYDpnyLpZmzhh7kOIEYDU81Q/5komP0x+F2E2Qu8P/HXVwI2mK80/H5LAmZJ4M0G44dAAhLYjYANZje0BktAAjYYPwMSkMBuBM7aYHYDZrAEJLCewK4NZvy0Youxfju1E5h+otCtrU6fn1TZs7NWYK4Z6p+CpDXr9PwkZXS1nJxV6O0xp7xNZws1p7cN/tdlkvwblFH+FDOtd0/bopaUsWuDSQuqSUAC1yFgg7nOWbvTkxB4pW3YYF7ptKxVAi9GwAbzYgdmuRJ4JQKbNRjIl3Wwj74nZMg1pzVhvXfMh55/zFk7YM5eO/c7H+yX/d3aa56nC0yYawbWxP3fk3KHBsSL5f9PXHwDs39h+fYtzBmwn/ZtQSsMmzWYFWtpOQEBtyCBDgEbTIeWXglIoEXABtPCpVkCEugQsMF0aOmVgARaBF6qwbR2plkCEjicQLvBjBv0Zx4V0VQz5Bv4KuO39VTz0CDXPZ4tx1Y1L3PH+y2yR04akPdYrQmzP+UOrcro6CMnDZjrADrRm/32/1TfFlpnM+0G0wnXKwEJXJuADeba5+/un4XASeuwwZz0YN2WBJ6BgA3mGU7BGiRwUgI2mJMerNuSwDMQaDcYYPWfwYD13i4MyNmQ9ZTfvVHvZCTv0Ko1x7PlgPV7GXNh9g/92/HFAHMG9LQvcX99C+tzOpz+WuTLG1i/HvBl5vffAvH/B1vUXa0O85qVt9JhzgCiHYh7jOZCbDeYIkdZAhKQwETABjMhUZCABLYiYIPZiqQ5EpDAROD4BjOVpCABCZyFQLvBVJdYMF8IVd4uPHg8G+YMyFqnPuhlwHp/l1/yV3tJ3qF1/JW3o48106gykrfSqowt9O6ayQ/rPwuj5r0yRi7MtQw9jVHL2tFuMGuD9UlAAhKwwfgZkMBuBAy2wfgZkIAEdiNgg9kNrcESkIANxs+ABCSwG4F2g4H5thloFQjE34IMWU/hkL3p1ntoKWPoaUDOThmVBjkjrTe0lAM5I3mHBl/9P/t+1JLGyF870vxKg16dVQ0w51TeqpbkhzkXSNa7GjB95jt1jHCYM4aeBsxeqLVORvJWWrvBVEHqEpCABJYEbDBLIr6XgAQ2I2CD2QylQRKQwJLATg1muYzvJSCBKxKwwVzx1N2zBH6JQLvBVDffSa/2kLz3tJRT+SHflKcMyN4qO2VU3kpPGUODuZYqo6OP7C0GzPVtkdvZy/B21hz+NGDeC9CJnn4iBHxoVUiqo/JW+l4ZKXdoVR0dvd1gOuF6JXBCAm6pQcAG04ClVQIS6BGwwfR46ZaABBoEbDANWFolIIEegc0aDHxecsGf16oU+OOBP99X/nHhtBzwZx78+X7pu72vsh/V4c/a8Of7bu6tzq+vIeOuBH/Wh8/vqwlf1/n6feVP+td5X79P3qHBZ03w/evwpwF57tf1b9/Deu+Yk9YbehrJe0+DXAs8pldrppqHBnm9KudRfbMG82ghzpeABM5HwAZzvjN1RxJ4GgI2mKc5CguRwPkIdBrM+XbvjiQggV0J2GB2xWu4BK5N4JAGM26z0+gcRZo/tCpjPFuOygv5ph1mfZl5ew+zF3pat77b2l9fuxmV/2vm7Xt4fD+3rOVrp44xF+ZaqoyODnMu8DbWTAPW+6s6Um5X62Ynf7Vm8lbaIQ2mKkZdAkcRcN19CNhg9uFqqgQk8E7ABvMOwV8SkMA+BGww+3A1VQISeCdgg3mHcPQv15fAWQm0GwzkW/IECLIXsp4yhgbZD4/pIzuNLW7PU+7QOtmQ9zdy0oDZn3xDq+qAOQMYU1aPKjvpwMdf1ATrXlcXcccIea1UX6VBzqiWhdnfzYY5o7MezPOhr1VrJr3dYFKImgQkIIFEwAaTqKhJQAKbEPhnkxRDJCABCQQC/hdMgKIkAQlsQ8AGsw1HUyQggUCg3WCqm++kh/U+pOQd2sfD8GU8WzvC9LYE+WY91VCFJ+/QYL/skb92bFF3tVaVDfPet8gA8pJNFVj9E62q7o4Oeb0qo7mdaK+yO3oMLsR2gylylCUgAQlMBGwwExIFCUhgKwI2mK1ImiMBCUwEbDATko0EYyQggbdDGgzky63qPCD7Ydary6qUXXkrHeb1oKdV2am+rgbra6myIWekurfIgPXrjRqqNcez5eh4x9zKn3TIdUPWU0alwfoMyN6xnzQg+2HWq/o6+iENplOgXglI4HUJ2GBe9+ysXAIHEVi/rA1mPSudEpBAk4ANpglMuwQksJ6ADWY9K50SkECTwGYNBva5ha72k27IhwZzHUAVE3Ug/pbxkb8cMeAHIsxrLte6vYfZC/mf0qhKgfUZY13Ifpj14U8j1ZJ8Q4M5F8Ye/43/ZAjM/pGTBsxeqLNTRtrL0JJ3aOPZcgx9r7Fc6/a+Wu/2/OsrZE5fPd99v1mD+W4hn0tAAtcjYIO53pm7Ywn8GgEbzK+hdiEJXI+ADaZ15polIIEOARtMh5ZeCUigRWDXBlPdWFc65Fvr5IfsrXbfyUjeocG8ZrVeVx/5y9HNgLm+ZebtfTc7+W9Zy1eY64CeltYbGuSc8Ww5IHuX9d7eL+ffe3+bs3yFvGbKgvXeMR+yH9brIyeN5T7G++Trars2mG4x+iUggcMI7LKwDWYXrIZKQAKDgA1mUHBIQAK7ELDB7ILVUAlIYBBoNxjIF0rjUmg5xgJpwPqMkQmzf+idkerYU6tq22LNKjvpMLOD+rfFw3p/tZdUxzfa9Nv/u9mV/1l0mLlWTGD2AptsBYh/DAZmvaqvU0i7wXTC9UpAAtcmYIO59vm7ewnsSsAGsytewyVwbQI2mLe3a38C3L0EdiRgg9kRrtESuDqBQxpMdTsN8002EM8IWH0bDtkbg5titZcqBnItsI9e1Qd5vT3rTtmQ6+jWnfxpva00yHV38uHxjGq9xOOeVuU8qh/SYB4t2vkSkMA6Ake7bDBHn4DrS+DEBGwwJz5ctyaBownYYI4+AdeXwIkJ2GBOfLhHb831JbBZg4F8Iw6z3sV+7/Z77bPumnv519a7la+7jy3WrdaE9Z8FmL3Q+zNU1V4gZ6e6IXur7JRRaVVGR6+yKx3yfpIf1nvT/KFt1mBGmEMCEpDAVwI2mK80/F4CEtiUwGkbzKaUDJOABH5EwAbzI2xOkoAE1hCwwayhpEcCEvgRgXaDqW640+qVFx6/nYbHM6r60l6GlvxD7wxYXzes93Zq+IkX5lp+krN2TmI9tLXzhw/mmqH+SdSYsxxjzTTg8ezlWrf3kLNvz99WfAO9jLTHFct8a2k3mG8TNUhAAhL4j4AN5j8QvkhAAtsTsMFsz9RECUjgPwI2mP9A+LKSgDYJNAhs1mA6l0TJO7RG3dM/czHmj9HJ2MIL+TINsl6tCbO/8lY6zBmQtSqj0gfb5ai8W+jQq3tZ2733VX0wr1l5q/zK39G3yK4yKh3mvVfezl42azCdRfVKQALXIGCDucY5u0sJHELgtRrMIYhcVAIS+CkBG8xPyTlPAhL4loAN5ltEGiQggZ8S2LXBwHwzDbRrBXb5J0og57YLDBO2uIEPsXeltObdCeEhZCawXg+xH1KnvuQdGqyvA7L3o5jwZeQvB+QM6OlhucVnupcHn/6UOzT4fA5/v45nvzl2bTC/uRHXkoAEno+ADeb5zsSKJHAaAjaY0xylG5HA8xGwwTzfmRxQkUtKYB8CNph9uJoqAQm8E9i1wSxv5G/v39eNv27Pl6/JvPTc3idvpd3mLF8rf9KXc2/vk/eedpu35vVezvJZlbf0/eR9lV3p8PdPNKD+y59g9kLtT/VXdSRvpW2RsWd2tz5YzxWyt9pP0ndtMGlBNQlI4DoEnqDBXAe2O5XA1QjYYK524u5XAr9IwAbzi7BdSgJXI9BuMJAvfmA/PR0K5PWSt6vB+mxY771XB+Qc2EfvXg4mf7UfyDUnP2RvWm9oKWNPDXr1jRq/jP//xWidGtP8oaUM6NWXMoYGc87QHx3tBvPogs6XgASuQ8AGc52zdqcS+HUCNphfR+6CErgOARvMec/anUngcAI2mMOPwAIkcF4C7QYzbrPT6CBK87fSqjpSfsc75lf+LfSRvxxV7tJ3e5/8t2fLV5h/agCkiFID4l+atFzr9r4MajyAvGYjomW91b58hVwHZH05f7yH7IWsjzlrBzyeUa3VAdhuMJ1wvRKQwLUJ7NVgrk3V3UtAAh8EbDAfGPwiAQnsQcAGswdVMyUggQ8CNpgPDH6RwHoCOtcT2LXBbHELXW0F8i151w85B2a9yk46zPOBZN1MS7y74SljaMD0E6MqG2Yv5L8sqsro6qPG5ehmQK4bZn2L7CpjuY/be9inDiCWAkxnDkRvJe7aYKpF1SUggWsQsMFc45zdpQQOIWCDOQT7zxd1pgReiYAN5pVOy1ol8GIEbDAvdmCWK4FXItBuMMDqm2VY7x3QYL3/drO+fB05aSx9996n+V3tXn561smHzAlmvcpNNQwN5gwgxgx/ZwDTZ6eaD7MXiHUMEZiyoaelWkb2FiNlVxrkulMdsN6b5t/TqvruzVk+azWY5WTfS0ACErhHwAZzj47PJCCBhwjYYB7C52QJSOAeARvMPTo+uw4Bd7oLgXaDqS5+kl5VDPliKmUMIc/9EgAACF5JREFULeVAzkjeSoOcMdZMA2Z/lV3pMGcAlT3qqbahJTPQuvxMGV0N8popB7J37CeNlFFpaf49LeXc86dnKaPSIO+98ic91XBPSxmVBo/X124wVTHqEpCABJYEbDBLIr6XgAQ2I2CD2QzlA0FOlcBJCdhgTnqwbksCz0DABvMMp2ANEjgpgV0bTHWbvQXLbjbMN+LdOtKaVQbM60H+S5dGLsz+rbJH/tpRrZnmw1wz1HtM2Sl3aMk7tPFs7YBcH2R95C8HZC9kfTn/9h5mf7WP25zla/LDnAu1ljKGtlxrvB96GuPZ2vHP21qnPglIQAJNArv+F0yzFu0SkMDJCNhgTnagbkcCz0TABvNMp2EtGxMw7mgCNpijT8D1JXBiAu0GA/UNNfz9bE9u8Pda8Pm+s2a6IR8afGbB96/D3xmQM1NGtZfkHVryQ14Psp4yhgazf6yZxvCnkbww5wJp+ocGxD9b9fFw8SWtN7SF7UdvR04aVdij3jEf5r131qsyYM6FWqvWTHq7waQQNQlIQAKJgA0mUdlEM0QCErDB+BmQgAR2I2CD2Q2twRKQwGYNZlwgLQfki6Iudphzlmvd3lfZt+dfX2HOhfq3un+de/secgZk/TZv+VrVnXTI2cn77NqSw+19t27ITGDWO9m3epavnYzhhbkOyNrwp7Gs4d77NL+rVflvb2+rozZrMKtX1CgBCVyGgA3mMkftRiXw+wRsML/P3BUlcBkCNpjLHPVpNupGXoiADeaFDstSJfBqBNoNpnOzXHkrHfKtevLDeu+Ynw5m6GlAzoZZT/OHltbbShv5acBcX7Vmmj+0yp90mNcDkvVDA6bf5v/xIHyB2Qu9n/CN/XQGzGuG0j4kmL2wTX2Qs2HWP4oJX2D2AsH5KSVOwHRewOeElV/bDWZlrjYJSEACbzaY3odAtwQk0CBgg2nA0ioBCfQI2GB6vHRLQAINAjaYBiytEjgzgT32tlmDAeKNM6zXOxtMt95DqzJgrqPyjpw0Kn/S0/yhwVwHZG3400jrDS15K234Hx1bZEPe+6O1jfmQsyHraT8jJ43kHRrk7JRRaSNn7agyKr3KhbnuyltlJ32zBpPC1SQggWsTsMFc+/zdvQR2JWCD2RWv4WsJ6DsnARvMOc/VXUngKQjYYJ7iGCxCAuck0G4wMN82Q+/PYGyBEnIdkPXOmpAz0q16lQs5o/KnbMgZsJ9e1Zd06NWR9phyh5a8Q4O85pizHMOfxtJ3ew9z9u3Z2te03tBgzob9tKpeyGuOGpejyujo7QbTCX8Vr3VKQAL7ELDB7MPVVAlI4J2ADeYdgr8kIIF9CNhg9uFqqgSeg8DBVbQbzPIi6Pa+s4/bnLWvKXvt3JsvZWyhwfpLs1st6RXmnG59KXeLjJR7T+uu2fFX68LMD7JWZSQdckan5sqb1utq3ezKD/M+K29HbzeYTrheCUjg2gRsMNc+f3cvgV0J2GB2xXvxcLd/eQI2mMt/BAQggf0I2GD2Y2uyBC5PoN1gYL5thufROicKue7qJh9mf2e94YU5A3p/1GLP+kaNacBcd/J1tc5eYK4BPrUqJ+nwOQf+fu3UDn/Phfvvt8juZFTexKPSIO+pyk56u8GkkKfULEoCEjicgA3m8COwAAmcl4AN5rxn684kcDgBG8zhR2ABEugSeB2/DeZ1zspKJfByBDZrMNVN9F56l3SnDsi35ymjqgNyRtcPOQdmvcreQu/svVoP5poha1VGqmNoMOcckTFqSaOqJelp/tCSt9Jg5gFU9vhPDo010yhDwoPNGkzIVpKABC5OwAZz8Q9Af/vOkMB6AjaY9ax0SkACTQI2mCYw7RKQwHoCuzYYIF4eQU9fv52eE3IdVQrM/nQJNrQqYzxLo/J39C1yYd4j9LROzZU37WVokGupch7Vx5ppVLmwvj7IXlivV3VUOuTszh6r7KTv2mDSgo9pzpaABF6JgA3mlU7LWiXwYgRsMC92YJYrgVciYIN5pdOy1jMTOOXebDCnPFY3JYHnIHDpBpNuzoe259HA47f4o8Y0Ut3J9xNti+yU0dU6tW+R3c3Ywl/tMWV3vGn+3tqlG8zecM2XwNUJ2GCu/gn43L9fJbALARvMLlgNlYAEBgEbzKDgkIAEdiFgg9kFq6ESkMAg8AwNZtSx+4D5pzfVotXNfNK7GZUf1tfXyYA5F2qtyk461DkwP0v8Kg3m+fA8WuLxyhqsZ9vZ52UaTAeKXglIYBsCNphtOJoiAQkEAjaYAEVJAlsRuHqODebqnwD3L4EdCdhgdoRrtASuTmDXBlP9hKCrb3FIaU3IN+dbrAePZ6eahwY5ezxbjmovS9/tfcdfeSsdct0w67d69nit6uusVWV09Gq9TgbM7IC3bnbyd+qovLs2mGpR9d8h4CoSOJqADeboE3B9CZyYgA3mxIfr1iRwNAEbzNEn4PoSODGBzRoM/H3ZBPu+754JzPVUGTB7oadV2ZWeLtkgr1llwOxPuUOD2Qs9beR0RlV30qFXSyejqhl6a8LsT3UMLa0J83xg2H99ANM/MbRFEZs1mC2KMUMCEjgXARvMuc7T3UjgqQjYYJ7qOCzmJQhY5GoCNpjVqDRKQAJdAjaYLjH9EpDAagLtBpNuw59Jq3b+TDWmWlLdydfVUu7QujnJP3I6I2VspaU6quzkHVrl30If+ctR5S59t/eVP+m3OcvX5O1qy8x779sN5l6Yz36BgEtI4IUI2GBe6LAsVQKvRsAG82onZr0SeCECNpgXOixLlcCrEeg1mFfbnfVKQAKHErDBHIrfxSVwbgI2mHOfr7uTwKEEbDCH4nfx5yFgJXsQsMHsQdVMCUjgg4AN5gODXyQggT0I/A8AAP//Qz5YhAAAAAZJREFUAwDTBKo4+WA5OAAAAABJRU5ErkJggg==",
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
        "qrImageUrl": "data:image/png;base64,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",
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

export async function loadFinanceData() {
  try {
    const donSnap = await getDocs(collection(db, DONATIONS_COL));
    const distSnap = await getDocs(collection(db, DISTRIBUTIONS_COL));
    const donations = donSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const distributions = distSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    let financeSettings = { emergencyReservePercent: 20 };
    try {
      const cfgDoc = await getDoc(doc(db, CONFIG_COL, 'financeSettings'));
      if (cfgDoc.exists()) {
        financeSettings = { ...financeSettings, ...cfgDoc.data() };
      }
    } catch (e) {
      console.warn('Could not load financeSettings doc, using defaults', e);
    }

    return { donations, distributions, financeSettings };
  } catch (err) {
    console.error('Error loading finance data:', err);
    return { donations: [], distributions: [], financeSettings: { emergencyReservePercent: 20 } };
  }
}

export async function saveFinanceSettingsToFirestore(settings: { emergencyReservePercent: number }) {
  await setDoc(doc(db, CONFIG_COL, 'financeSettings'), sanitizeForFirestore(settings));
}

export async function saveDonationTransactionToFirestore(item: any) {
  const docId = item.id || `don_${Date.now()}`;
  const payload = { ...item, id: docId };
  await setDoc(doc(db, DONATIONS_COL, docId), sanitizeForFirestore(payload));
  return payload;
}

export async function deleteDonationTransactionFromFirestore(id: string) {
  await deleteDoc(doc(db, DONATIONS_COL, id));
}

export async function saveTeamDistributionToFirestore(item: any) {
  const docId = item.id || `dist_${Date.now()}`;
  const payload = { ...item, id: docId };
  await setDoc(doc(db, DISTRIBUTIONS_COL, docId), sanitizeForFirestore(payload));
  return payload;
}

export async function deleteTeamDistributionFromFirestore(id: string) {
  await deleteDoc(doc(db, DISTRIBUTIONS_COL, id));
}

export async function loadFinanceQrMembers() {
  try {
    const snap = await getDocs(collection(db, FINANCE_QR_MEMBERS_COL));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error loading finance QR members:', err);
    return [];
  }
}

export async function saveFinanceQrMemberToFirestore(item: any) {
  const docId = item.id || `fq_${Date.now()}`;

  // Read existing doc to prevent updates from accidentally wiping out QR codes, images, or bank info
  let existingData: any = {};
  try {
    const snap = await getDoc(doc(db, FINANCE_QR_MEMBERS_COL, docId));
    if (snap.exists()) {
      existingData = snap.data() || {};
    }
  } catch (e) {
    // Ignore read errors
  }

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

  await setDoc(doc(db, FINANCE_QR_MEMBERS_COL, docId), sanitizeForFirestore(payload), { merge: true });
  return payload;
}

export async function deleteFinanceQrMemberFromFirestore(id: string) {
  if (!id) return;
  await deleteDoc(doc(db, FINANCE_QR_MEMBERS_COL, id)).catch(() => {});
}

