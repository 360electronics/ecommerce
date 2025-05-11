export interface Banner {
    id: string;
    title: string;
    imageUrl: string;
    type: 'hero-main' | 'hero-secondary' | 'customise-pc' | 'cta';
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'inactive'; 
    startDate?: string;
    endDate?: string;
    link?: string;
  }