export interface Customer {
    name: string
    email: string
    phone: string
    avatar: string
  }
  
  export interface Ticket {
    id: string
    type: string
    description: string
    status: string
    createdAt: string
    customer: {
      name: string
      email: string
      phone: string
      avatar: string
    }
  }
  