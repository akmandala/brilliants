import crypto from 'node:crypto';

export const signLcsc = (params: Record<string, string>, secret?: string): string | undefined => {
  if (!secret) return undefined;
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};
