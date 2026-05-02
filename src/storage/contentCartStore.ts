import { v4 as uuid } from 'uuid';
import type { ContentCartItem, ParserResult } from '../types';

const KEY = 'component-parser-content-cart-v1';

export const normalizeCartMpn = (mpn: string): string => mpn.trim().toUpperCase().replace(/\s+/g, '');

export const getContentCart = (): ContentCartItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ContentCartItem[]) : [];
  } catch {
    return [];
  }
};

export const saveContentCart = (items: ContentCartItem[]): void => localStorage.setItem(KEY, JSON.stringify(items));
export const clearContentCart = (): ContentCartItem[] => {
  saveContentCart([]);
  return [];
};

export const removeContentCartItem = (id: string): ContentCartItem[] => {
  const next = getContentCart().filter((i) => i.id !== id);
  saveContentCart(next);
  return next;
};

export const isPartInCart = (mpn: string): boolean => getContentCart().some((i) => normalizeCartMpn(i.mpn) === normalizeCartMpn(mpn));

export const addContentCartItem = (item: Omit<ContentCartItem, 'id' | 'addedAt'>): { items: ContentCartItem[]; added: boolean } => {
  const current = getContentCart();
  if (current.some((i) => normalizeCartMpn(i.mpn) === normalizeCartMpn(item.mpn))) return { items: current, added: false };
  const next = [...current, { ...item, id: uuid(), addedAt: new Date().toISOString() }];
  saveContentCart(next);
  return { items: next, added: true };
};

export const cartItemFromResult = (args: {
  result: ParserResult;
  sourceProjectId?: string;
  sourceChatId?: string;
  sourceMessageId?: string;
}): Omit<ContentCartItem, 'id' | 'addedAt'> => ({
  sourceProjectId: args.sourceProjectId,
  sourceChatId: args.sourceChatId,
  sourceMessageId: args.sourceMessageId,
  mpn: args.result.input?.mpn_original || args.result.identity?.mpn_normalized || 'UNKNOWN',
  manufacturer: args.result.identity?.manufacturer,
  family: args.result.classification?.family,
  componentType: args.result.identity?.component_class || args.result.package?.package_type,
  footprintName: args.result.package?.footprint_name,
  description: args.result.altium?.description,
  role: args.result.supportingPartMeta ? 'supporting' : 'main',
  supportRole: args.result.supportingPartMeta?.role
});
