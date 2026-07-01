export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  category: string;
  imageBg: string; // Tailwind gradient classes
  specs: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface Recommendation {
  productId: string;
  reason: string;
}

export interface Order {
  id: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  createdAt: string;
}
