import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// ABN Lookup SOAP endpoint
const ABR_SOAP_URL = 'https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx';

// In-memory cache for ABN results (24 hour expiry)
const abnCache = new Map<string, { data: ABNDetails; expires: number }>();

export interface ABNDetails {
  abn: string;
  entityName: string;
  businessNames?: string[];
  entityType: string;
  activeFromDate: string;
  gstStatus: string;
  isActive: boolean;
  lastUpdated: string;
}

/**
 * Clean and validate ABN format
 */
function normalizeABN(abn: string): string {
  return abn.replace(/\s/g, '');
}

/**
 * Validate ABN format (11 digits)
 */
function isValidABNFormat(abn: string): boolean {
  return /^\d{11}$/.test(abn);
}

/**
 * Build SOAP request for ABN lookup
 */
function buildABNSoapRequest(abn: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SearchByABNv202001 xmlns="http://abr.business.gov.au/ABRXMLSearch/">
      <searchString>${abn}</searchString>
      <includeHistoricalDetails>N</includeHistoricalDetails>
      <authenticationGuid>00000000-0000-0000-0000-000000000000</authenticationGuid>
    </SearchByABNv202001>
  </soap:Body>
</soap:Envelope>`;
}

/**
 * Parse ABN SOAP response
 */
async function parseABNResponse(soapResponse: string): Promise<ABNDetails | null> {
  try {
    const parsed = await parseStringPromise(soapResponse, { 
      explicitArray: false,
      ignoreAttrs: false
    });

    const response = parsed?.['soap:Envelope']?.['soap:Body']?.['SearchByABNv202001Response'];
    const abnPayload = response?.['SearchByABNv202001Result']?.['response'];

    if (!abnPayload || abnPayload['usageStatement']) {
      // No results or usage limit reached
      return null;
    }

    const businessEntity = abnPayload['businessEntity'];
    if (!businessEntity) {
      return null;
    }

    const abn = businessEntity['abn']?.['identifierValue'] || '';
    const entityName = businessEntity['mainName']?.['organisationName'] || 
                       businessEntity['mainName']?.['fullName'] || '';
    
    const businessNames = [];
    const businessNamesData = businessEntity['mainTradingName'];
    if (businessNamesData) {
      if (Array.isArray(businessNamesData)) {
        businessNames.push(...businessNamesData.map((name: any) => name['organisationName']));
      } else {
        businessNames.push(businessNamesData['organisationName']);
      }
    }

    const entityType = businessEntity['entityType']?.['entityDescription'] || 'Unknown';
    const activeFromDate = businessEntity['entityStatus']?.['effectiveFrom'] || '';
    const entityStatus = businessEntity['entityStatus']?.['entityStatusCode'] || '';
    const isActive = entityStatus === 'Active';

    // GST status
    let gstStatus = 'Not Registered';
    const goods = businessEntity['goodsAndServicesTax'];
    if (goods && goods['effectiveFrom'] && !goods['effectiveTo']) {
      gstStatus = 'Registered';
    }

    return {
      abn,
      entityName,
      businessNames: businessNames.length > 0 ? businessNames : undefined,
      entityType,
      activeFromDate,
      gstStatus,
      isActive,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to parse ABN response:', error);
    return null;
  }
}

/**
 * Get ABN details from Australian Business Register
 * Results are cached for 24 hours
 */
export async function getABNDetails(abn: string): Promise<ABNDetails | null> {
  const normalizedABN = normalizeABN(abn);
  
  if (!isValidABNFormat(normalizedABN)) {
    throw new Error('Invalid ABN format. ABN must be 11 digits.');
  }

  // Check cache first
  const cached = abnCache.get(normalizedABN);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    const soapRequest = buildABNSoapRequest(normalizedABN);
    
    const response = await axios.post(ABR_SOAP_URL, soapRequest, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://abr.business.gov.au/ABRXMLSearch/SearchByABNv202001'
      },
      timeout: 10000 // 10 second timeout
    });

    const abnDetails = await parseABNResponse(response.data);
    
    if (abnDetails) {
      // Cache for 24 hours
      abnCache.set(normalizedABN, {
        data: abnDetails,
        expires: Date.now() + (24 * 60 * 60 * 1000)
      });
    }

    return abnDetails;
  } catch (error) {
    console.error('ABN lookup failed:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('ABN lookup timeout. Please try again.');
      }
      if (error.response?.status === 500) {
        throw new Error('ABN service temporarily unavailable.');
      }
    }
    
    throw new Error('Failed to lookup ABN. Please check the ABN and try again.');
  }
}

/**
 * Clear expired cache entries (cleanup utility)
 */
export function clearExpiredABNCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  abnCache.forEach((cached, abn) => {
    if (cached.expires <= now) {
      keysToDelete.push(abn);
    }
  });
  
  keysToDelete.forEach(abn => abnCache.delete(abn));
}

// Run cache cleanup every hour
setInterval(clearExpiredABNCache, 60 * 60 * 1000);