interface ImageUrls {
  default: string;
  sm?: string;
  lg?: string;
}


export interface Banner {
    id: string;
    title: string;
    imageUrls: ImageUrls;
    type: 'hero-main' | 'hero-secondary' | 'customise-pc' | 'cta';
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'inactive'; 
    startDate?: string;
    endDate?: string;
    link?: string;
  }




