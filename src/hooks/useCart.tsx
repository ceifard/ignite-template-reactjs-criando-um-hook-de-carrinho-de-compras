import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      let products = [...cart]
      let productFound = products.find(prod => prod.id == productId)

      const productResponse = await api.get(`/products/${productId}`)
      const product = productResponse.data;  

      if(productFound) {
        updateProductAmount({productId, amount: 1})  
      } else {  
        products = [
          ...products,
          {...product, amount: 1}
        ]
        setCart(products)       
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))    
                    
      }

    } catch (error: any) {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productResponse = await api.get(`/products/${productId}`)
      let products = [...cart]
      let updatedProducts = products.filter(product => product.id != productId)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProducts))      
      setCart(updatedProducts)  
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productStockResponse = await api.get(`/stock/${productId}`)
      const { amount: productStockAmount } = productStockResponse.data;    
      let products = [...cart]  
      let product = products.find(productFound => productFound.id == productId) as Product
      if (product.amount + amount > productStockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      else if ( (product.amount + amount) < 0) return
      product.amount += amount    
      setCart(products)  
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
    } catch (error: any) {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
