import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { isBigIntLiteral } from 'typescript';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const productsOnCart: Product[] = [];

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const findProduct = products.findIndex(item => item.id === id);
      products[findProduct].quantity += 1;
      setProducts([...products]);
      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        return increment(product.id);
      }
      const newProductAdded = {
        ...product,
        quantity: 1,
      };
      setProducts([...products, newProductAdded]);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const findProduct = products.findIndex(item => item.id === id);
      products[findProduct].quantity -= 1;
      setProducts([...products]);
      if (products[findProduct].quantity > 0) {
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(products),
        );
      } else {
        const productsRemaining = products.filter(product => product.id !== id);
        setProducts(productsRemaining);
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(productsRemaining),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
