"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useProducts } from '@/hooks/use-products';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addOrder } from '@/lib/firestore/orders';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, OrderItem } from '@/types';
import { Badge } from '@/components/ui/badge';

interface OrderSelection {
  [productId: string]: {
    product: Product;
    quantity: number;
  };
}

export default function NewOrderPage() {
  const t = useTranslations('Dashboard');
  const { products, loading: productsLoading } = useProducts();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [selection, setSelection] = useState<OrderSelection>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productsLoading) return;

    const repeatParam = searchParams.get('repeat');
    const addParam = searchParams.get('add');
    let newSelection: OrderSelection = {};

    const itemsToParse = repeatParam || addParam;

    if (itemsToParse) {
        itemsToParse.split(',').forEach(item => {
            const [productId, quantityStr] = item.split(':');
            const quantity = Number(quantityStr);
            const product = products.find(p => p.id === productId);

            if (product && quantity > 0 && product.stock > 0) {
                 newSelection[productId] = { product, quantity: Math.min(quantity, product.stock) };
            }
        });
        setSelection(newSelection);
         // Clear query params after processing
        window.history.replaceState({}, '', '/client/new-order');
    }

  }, [searchParams, products, productsLoading]);


  const handleQuantityChange = (product: Product, quantityStr: string) => {
    let quantity = Number(quantityStr);
    const productId = product.id;

    if (isNaN(quantity) || quantity < 0) {
      quantity = 0;
    }

    if (quantity > product.stock) {
      quantity = product.stock;
      toast({
        variant: "destructive",
        title: "Stock Limit Reached",
        description: `You can only order up to ${product.stock} units of ${product.name}.`,
      });
    }

    setSelection(prev => {
      const newSelection = { ...prev };
      if (quantity > 0) {
        newSelection[productId] = { product, quantity };
      } else {
        delete newSelection[productId];
      }
      return newSelection;
    });
  };

  const productsByCategory = useMemo(() => {
    return products.reduce((acc, product) => {
      const { category } = product;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products]);

  const { orderItems, total } = useMemo(() => {
    const orderItems: OrderItem[] = Object.values(selection).map(({ product, quantity }) => ({
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
    }));
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { orderItems, total };
  }, [selection]);

  const handleSubmitOrder = async () => {
    if (!user || !userProfile) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find user profile. Please try again.",
        });
        return;
    }
    if (orderItems.length === 0) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please select at least one product.",
        });
        return;
    }
     if (!userProfile.address) {
      toast({
        variant: "destructive",
        title: "Missing Address",
        description: "Your profile is missing a shipping address. Please contact support.",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
        await addOrder({
            userId: user.uid,
            businessName: userProfile.businessName,
            items: orderItems,
            total,
            status: 'pending',
            shippingAddress: userProfile.address,
        });
        toast({
            title: "Order Placed!",
            description: "Your order has been successfully submitted.",
        });
        setSelection({});
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: error.message || "There was an issue placing your order.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-headline font-bold">{t('portal_title')}</h1>

      {productsLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : (
        Object.keys(productsByCategory).map(category => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsByCategory[category].map(product => (
                <Card key={product.id} className="flex flex-col">
                  <CardHeader className="p-0">
                     <Image
                        src={product.photoUrl}
                        alt={product.name}
                        width={400}
                        height={300}
                        className="rounded-t-lg object-cover aspect-[4/3]"
                        data-ai-hint="product image"
                      />
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                     <div className="mt-2">
                        {product.stock > 0 ? (
                           <Badge variant="secondary">In Stock: {product.stock}</Badge>
                        ) : (
                           <Badge variant="destructive">Out of Stock</Badge>
                        )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 flex items-center justify-between">
                     <div className="font-bold text-lg">{formatCurrency(product.price)}</div>
                     <Input
                        type="number"
                        min="0"
                        max={product.stock}
                        placeholder="Qty"
                        className="w-20"
                        value={selection[product.id]?.quantity || ''}
                        onChange={(e) => handleQuantityChange(product, e.target.value)}
                        disabled={product.stock === 0}
                      />
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {orderItems.length > 0 && (
         <Card className="sticky bottom-4 shadow-2xl">
            <CardHeader>
                <CardTitle>Your Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <p className="text-lg font-medium">Total:</p>
                    <p className="text-2xl font-bold">{formatCurrency(total)}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                  onClick={handleSubmitOrder} 
                  disabled={isSubmitting || productsLoading}
                  className="w-full" 
                  size="lg"
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </Button>
            </CardFooter>
         </Card>
      )}
    </div>
  );
}
