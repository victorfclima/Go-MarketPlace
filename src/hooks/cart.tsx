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

  // useEffect(() => {
  //   console.log(products);
  // }, [products]);

  const addToCart = useCallback(
    async product => {
      const productKeys = await AsyncStorage.getAllKeys();
      if (productKeys.indexOf(product.id) < 0) {
        await AsyncStorage.setItem(`${product.id}`, JSON.stringify(product));
        return setProducts([...products, product]);
      }
      return console.log('Product is already on cart');
    },
    [products],
  );

  const increment = useCallback(async id => {
    // TODO INCREMENTS A PRODUCT QUANTITY IN THE CART
  }, []);

  const decrement = useCallback(async id => {
    // TODO DECREMENTS A PRODUCT QUANTITY IN THE CART
  }, []);

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
