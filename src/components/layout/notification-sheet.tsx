'use client';

import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ShoppingCart, Headset, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function NotificationSheetContent() {
  const t = useTranslations('Notifications');

  const notifications = [
    {
      id: 1,
      icon: ShoppingCart,
      title: t('item1_title'),
      desc: t('item1_desc'),
      time: t('item1_time'),
    },
    {
      id: 2,
      icon: Headset,
      title: t('item2_title'),
      desc: t('item2_desc'),
      time: t('item2_time'),
    },
    {
      id: 3,
      icon: ShoppingCart,
      title: t('item3_title'),
      desc: t('item3_desc'),
      time: t('item3_time'),
    },
    {
      id: 4,
      icon: ShoppingCart,
      title: t('item1_title'),
      desc: t('item1_desc'),
      time: t('item1_time'),
    },
    {
      id: 5,
      icon: Headset,
      title: t('item2_title'),
      desc: t('item2_desc'),
      time: t('item2_time'),
    },
    {
      id: 6,
      icon: ShoppingCart,
      title: t('item3_title'),
      desc: t('item3_desc'),
      time: t('item3_time'),
    },
  ];

  return (
    <>
      <SheetHeader className="p-4 border-b">
        <SheetTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('title')}
        </SheetTitle>
        <SheetDescription className="hidden">
          {t('title')}
        </SheetDescription>
      </SheetHeader>
      <div className="p-0">
        {notifications.map((notification) => (
          <div key={notification.id} className="flex items-start gap-4 p-4 border-b">
            <div className="mt-1">
              <notification.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-semibold">{notification.title}</p>
              <p className="text-sm text-muted-foreground">{notification.desc}</p>
              <p className="text-xs text-blue-500 mt-1">{notification.time}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
