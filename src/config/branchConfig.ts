export interface BranchConfig {
  id: string; // Unique key e.g. 'Malad', 'Goregaon'
  name: string; // Display name e.g. 'Malad Branch', 'Goregaon Branch'
  whatsappNumber: string; // Numeric string with country code, e.g. '919830678387'
  phone: string; // Display phone e.g. '+91 9830678387'
  address?: string;
}

export const DEFAULT_BRANCH_ID = 'Malad';

export const BRANCHES_CONFIG: Record<string, BranchConfig> = {
  'Malad': {
    id: 'Malad',
    name: 'Mumbai (Malad)',
    whatsappNumber: '919830678387',
    phone: '+91 9830678387',
    address: 'Shop 1-3, SV Road, Opp. Malad Railway Station, Malad West, Mumbai - 400064'
  },
  'Goregaon': {
    id: 'Goregaon',
    name: 'Mumbai (Goregaon)',
    whatsappNumber: '919830678387',
    phone: '+91 9830678387',
    address: 'G-4, Sun Plaza, SV Road, Near Goregaon East Metro, Goregaon, Mumbai - 400063'
  }
};

/**
 * Sanitize and format phone number into pure digits for WhatsApp URL wa.me/<number>
 */
export function formatWhatsAppNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return BRANCHES_CONFIG[DEFAULT_BRANCH_ID].whatsappNumber;
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Get Branch Configuration for given branch ID / name.
 * Searches dynamic centers added by Admin or falls back to BRANCHES_CONFIG.
 */
export function getBranchInfo(branchId?: string, centers?: any[]): BranchConfig {
  const cleanId = (branchId || '').trim();

  // 1. Search in dynamic backend centers array added by Admin
  if (cleanId && centers && centers.length > 0) {
    const matchedCenter = centers.find((c: any) => c.city && c.city.toLowerCase() === cleanId.toLowerCase());
    if (matchedCenter) {
      const num = matchedCenter.whatsappNumber || matchedCenter.phone || '919830678387';
      return {
        id: matchedCenter.city,
        name: matchedCenter.city.toLowerCase().includes('branch') || matchedCenter.city.toLowerCase().includes('mumbai') ? matchedCenter.city : `${matchedCenter.city} Branch`,
        whatsappNumber: formatWhatsAppNumber(num),
        phone: matchedCenter.phone || '+91 9830678387',
        address: matchedCenter.address
      };
    }
  }

  // 2. Lookup in default BRANCHES_CONFIG
  if (cleanId && BRANCHES_CONFIG[cleanId]) {
    return BRANCHES_CONFIG[cleanId];
  }

  if (cleanId) {
    const matchedKey = Object.keys(BRANCHES_CONFIG).find(
      k => k.toLowerCase() === cleanId.toLowerCase() || BRANCHES_CONFIG[k].name.toLowerCase().includes(cleanId.toLowerCase())
    );
    if (matchedKey && BRANCHES_CONFIG[matchedKey]) {
      return BRANCHES_CONFIG[matchedKey];
    }
  }

  // 3. Default branch fallback
  return BRANCHES_CONFIG[DEFAULT_BRANCH_ID];
}

/**
 * Get WhatsApp Phone Number for specified branch ID (or default branch if not specified/invalid)
 */
export function getBranchWhatsAppNumber(branchId?: string, centers?: any[]): string {
  const branch = getBranchInfo(branchId, centers);
  return formatWhatsAppNumber(branch.whatsappNumber);
}

/**
 * Get Official WhatsApp URL format:
 * https://wa.me/<number>?text=<encoded_message>
 */
export function getWhatsAppUrl(branchId?: string, customMessage?: string, centers?: any[]): string {
  const whatsappNumber = getBranchWhatsAppNumber(branchId, centers);
  const defaultText = "Hello AssurX Diagnostics! I want to book a test 😊";
  const messageText = customMessage || defaultText;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageText)}`;
}

/**
 * Get list of all available branches for dropdown selectors.
 * Prefers Admin Panel centers from database, falling back to DEFAULT_BRANCHES.
 */
export function getAllBranches(centers?: any[]): Array<{ code: string; name: string }> {
  if (centers && centers.length > 0) {
    return centers.map((c: any) => ({
      code: c.city,
      name: c.city.toLowerCase().includes('branch') || c.city.toLowerCase().includes('mumbai') ? c.city : `${c.city} Branch`
    }));
  }

  return Object.keys(BRANCHES_CONFIG).map(key => ({
    code: BRANCHES_CONFIG[key].id,
    name: BRANCHES_CONFIG[key].name
  }));
}
