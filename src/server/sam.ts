import { env } from "~/env";

const SAM_API_BASE = "https://api.sam.gov/prod/opportunities/v2/search";

export interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  department?: string;
  fullParentPathName?: string; // fallback for department: "DEPT OF DEFENSE.ARMY...."
  subTier?: string;
  office?: string;
  postedDate: string;
  type: string;
  baseType?: string;
  responseDeadLine?: string;
  naicsCode?: string;
  classificationCode?: string;
  active: string;
  state?: string;
  pointOfContact?: { email?: string; fullName?: string }[];
  award?: { amount?: string; awardee?: { name?: string } };
}

interface SamApiResponse {
  totalRecords: number;
  opportunitiesData: SamOpportunity[];
}

export interface FetchOpportunitiesParams {
  postedFrom?: string; // MM/DD/YYYY
  postedTo?: string;   // MM/DD/YYYY
  limit?: number;
  offset?: number;
  ptype?: string;      // o=solicitation, p=presolicitation, k=combined, a=award
  naicsCode?: string;
  deptname?: string;
}

export async function fetchOpportunities(
  params: FetchOpportunitiesParams = {},
): Promise<{ opportunities: SamOpportunity[]; total: number }> {
  const query = new URLSearchParams({
    api_key: env.SAM_GOV_API_KEY,
    limit: String(params.limit ?? 100),
    offset: String(params.offset ?? 0),
    ...(params.postedFrom && { postedFrom: params.postedFrom }),
    ...(params.postedTo && { postedTo: params.postedTo }),
    ...(params.ptype && { ptype: params.ptype }),
    ...(params.naicsCode && { naicsCode: params.naicsCode }),
    ...(params.deptname && { deptname: params.deptname }),
  });

  const res = await fetch(`${SAM_API_BASE}?${query.toString()}`);

  if (!res.ok) {
    throw new Error(`SAM.gov API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SamApiResponse;
  return {
    opportunities: data.opportunitiesData ?? [],
    total: data.totalRecords ?? 0,
  };
}
