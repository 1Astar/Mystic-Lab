export type PortraitDomainId =
  | 'personality'
  | 'career'
  | 'relationship'
  | 'wealth'
  | 'inner';

/** 五域卡片：倾向 + 用法 + 小心 */
export type PortraitDomainCard = {
  id: PortraitDomainId;
  title: string;
  lead: string;
  tip: string;
  watch: string;
};

export type BaziPortrait = {
  keyword: string;
  /** 五域页导语 */
  domainsLead: string;
  personality: string;
  career: string;
  relationship: string;
  wealth: string;
  innerWork: string;
  domains: PortraitDomainCard[];
  themes: [string, string, string];
  source: 'template';
  generatedAt: string;
};
