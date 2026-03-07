
import React from 'react';

export const COLORS = {
  bg: '#0f172a',
  accent: '#22c55e',
  darker: '#0a0f1d'
};

export const COPY = {
  LANDING: {
    heroTitle: 'FPL Rush',
    heroSubtitle: 'أكبر منصة تحديات فانتزي في مصر',
    heroTagline: 'لا قمار، لا رسوم.. مهارتك هي اللي هتكسبك!',
    ctaJoin: 'انضم الآن',
    ctaLogin: 'تسجيل دخول',
    ctaPartnership: 'شركاء النجاح',
  },
  PARTNERSHIP: {
    brandsTitle: 'للبراندات والعلامات التجارية',
    brandsDesc: 'وصل علامتك التجارية لأكبر شريحة من الشباب المصري المهتم بالكورة. تقارير دقيقة ووصول مباشر.',
    influencersTitle: 'للبلوجرز وصناع المحتوى',
    influencersDesc: 'اعمل مسابقة خاصة لمتابعيك وزود التفاعل بشكل حقيقي ومبني على المنافسة.',
    copyEmail: 'نسخ البريد الإلكتروني',
    copied: 'تم النسخ!',
    email: 'fplrush.official@gmail.com'

  },
  ADMIN: {
    dashboardTitle: 'لوحة التحكم - إدارة المسابقات',
    createTitle: 'إنشاء تحدي جديد',
    listTitle: 'كل التحديات المتاحة',
    publish: 'نشر التحدي',
  }
};

export const INITIAL_CHALLENGES: any[] = [
  {
    id: '1',
    title: 'تحدي العمالقة - الأسبوع 20-25',
    image: 'https://picsum.photos/800/400?random=1',
    prize: '5000 EGP + تيشرت أصلي',
    startGW: 20,
    endGW: 25,
    minPoints: 1200,
    maxPlayers: 1000,
    specialConditions: 'ممنوع استخدام الـ Wildcard خلال فترة التحدي.',
    requiredStartGW: 1,
    status: 'active',
    participantsCount: 450
  },
  {
    id: '2',
    title: 'كأس فانتزي رمضان',
    image: 'https://picsum.photos/800/400?random=2',
    prize: 'جائزة كبرى 10,000 ج.م',
    startGW: 28,
    endGW: 32,
    minPoints: 1000,
    maxPlayers: 2000,
    specialConditions: 'التحدي خاص بالمستخدمين اللي بدؤوا من الجولة الأولى فقط.',
    requiredStartGW: 1,
    status: 'upcoming',
    participantsCount: 0
  }
];
