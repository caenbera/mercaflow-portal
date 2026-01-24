'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, ShoppingCart, Headset } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function NotificationBell() {
  const t = useTranslations('Notifications');
  const notificationCount = 3; // Static example

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
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-visible rounded-full relative"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {notificationCount}
            </span>
          )}
          <span className="sr-only">{t('sr_toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-bold">{t('title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map((notification) => (
          <DropdownMenuItem key={notification.id} className="flex items-start gap-3 p-2">
            <div className="mt-1">
              <notification.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-xs text-muted-foreground">{notification.desc}</p>
              <p className="text-xs text-blue-500 mt-1">{notification.time}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
