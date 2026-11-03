import { db, collection, doc, getDocs, getDoc, setDoc, deleteDoc } from './firebase';
import { optimizePosterForFirestore, emergencyCompressObject } from '../utils/imageCompressor';
import { parseCoordinatesFromUrl, normalizeCoordinates } from '../utils/mapUtils';
import { DEFAULT_BOKEO_TIMELINE } from '../data/timelineDefaults';
import { initialDefaultFinanceData } from '../data/financeDefaults';
import initialDefaultFinanceQrMembers from '../data/financeQrDefaults.json';
import ministryDefaults from '../data/ministryDefaults.json';

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
  ...ministryDefaults,
  homePoster: {
    ...ministryDefaults.homePoster,
    bokeoTimeline:
      Array.isArray(ministryDefaults.homePoster?.bokeoTimeline) &&
      ministryDefaults.homePoster.bokeoTimeline.length > 0
        ? ministryDefaults.homePoster.bokeoTimeline
        : DEFAULT_BOKEO_TIMELINE,
  },
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
          leaders: typeof data.leaders === 'number' ? Math.max(0, data.leaders) : Math.max(0, Number(data.leaders) || 0),
        };
      });
    } catch (e: any) {
      console.warn('Notice loading villages from Firestore (offline/cached):', e?.message || e);
      try {
        const { getDocsFromCache } = await import('firebase/firestore');
        const cacheSnap = await getDocsFromCache(collection(db, VILLAGES_COL));
        villages = cacheSnap.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id || data.id,
            heard: Number(data.heard) || 0,
            believers: Number(data.believers) || 0,
            baptized: Number(data.baptized) || 0,
            attending: typeof data.attending === 'number' ? data.attending : (Number(data.attending) || 0),
            leaders: typeof data.leaders === 'number' ? Math.max(0, data.leaders) : Math.max(0, Number(data.leaders) || 0),
          };
        });
      } catch {}
    }

    try {
      const eventsSnap = await getDocs(collection(db, EVENTS_COL));
      events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('Notice loading events from Firestore (offline/cached):', e?.message || e);
      try {
        const { getDocsFromCache } = await import('firebase/firestore');
        const cacheSnap = await getDocsFromCache(collection(db, EVENTS_COL));
        events = cacheSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {}
    }

    try {
      const teamsSnap = await getDocs(collection(db, TEAMS_COL));
      teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('Notice loading teams from Firestore (offline/cached):', e?.message || e);
      try {
        const { getDocsFromCache } = await import('firebase/firestore');
        const cacheSnap = await getDocsFromCache(collection(db, TEAMS_COL));
        teams = cacheSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {}
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

    // Fallback per collection individually so a quota/network failure on one collection never returns an empty array
    if (villages.length === 0) {
      villages = [...initialDefaultData.villages];
    }
    if (events.length === 0) {
      events = [...initialDefaultData.events];
    }
    if (teams.length === 0) {
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

