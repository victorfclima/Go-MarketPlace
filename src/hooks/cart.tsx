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
      // AsyncStorage.clear();
      const productKeys = await AsyncStorage.getAllKeys();
      const addedProducts = await AsyncStorage.multiGet(productKeys);
      addedProducts.map(item => {
        const oldProduct = JSON.parse(item[1]);
        productsOnCart.push(oldProduct);
        return setProducts(productsOnCart);
      });
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const findProduct = products.findIndex(item => item.id === id);
      products[findProduct].quantity += 1;
      await AsyncStorage.setItem(
        `${id}`,
        JSON.stringify(products[findProduct]),
      );
      setProducts([...products]);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productKeys = await AsyncStorage.getAllKeys();
      if (productKeys.indexOf(product.id) < 0) {
        const newProductAdded = {
          ...product,
          quantity: 1,
        };
        await AsyncStorage.setItem(
          `${product.id}`,
          JSON.stringify(newProductAdded),
        );
        return setProducts([...products, newProductAdded]);
      }
      return increment(product.id);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findProduct = products.findIndex(item => item.id === id);
      products[findProduct].quantity -= 1;
      setProducts([...products]);
      if (products[findProduct].quantity > 0) {
        await AsyncStorage.setItem(
          `${id}`,
          JSON.stringify(products[findProduct]),
        );
      } else {
        const productsRemaining = products.filter(product => product.id !== id);
        setProducts(productsRemaining);
        await AsyncStorage.removeItem(`${id}`);
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
