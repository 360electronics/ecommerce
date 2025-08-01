export interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
  }
  
  export interface ContactInfo {
    phone: string[];
    email: string;
    socialLinks: {
      instagram: string;
      whatsapp: string;
      youtube: string;
      facebook: string;
    };
  }