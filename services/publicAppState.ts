import { pb } from './pocketbase';

export interface PublicAppStateRecord {
  id?: string;
  value?: unknown;
}

export const fetchPublicAppStateRecord = async (key: string): Promise<{
  ok: boolean;
  status: number;
  record: PublicAppStateRecord | null;
}> => {
  try {
    const records = await pb.collection('app_state').getList(1, 1, {
      filter: pb.filter('scope = {:scope} && key = {:key}', {
        scope: 'global',
        key,
      }),
      fields: 'id,value',
    });

    return {
      ok: true,
      status: 200,
      record: records.items[0] || null,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: Number(error?.status || error?.response?.status || 500),
      record: null,
    };
  }
};
