# Ochre Morocco — Mobile App

تطبيق موبايل لموقع Ochre Morocco، مبني باستخدام **Expo (React Native)**.

## المتطلبات

- Node.js 18+
- npm أو yarn
- تطبيق **Expo Go** على هاتفك (لتجربة التطبيق مباشرة)

## التشغيل

```bash
cd mobile
npm install
npm start
```

ثم امسح الـ QR Code بتطبيق Expo Go.

## النشر

### App Store (iOS)
استخدم [EAS Build](https://docs.expo.dev/build/introduction/):
```bash
npm install -g eas-cli
eas build --platform ios
```

### Google Play (Android)
```bash
eas build --platform android
```

## الملاحظات
- الموقع المُضمَّن: `https://maroc-excursion.github.io/Ochre-Morocco/`
- عند الحصول على نطاق خاص، غيّر `SITE_URL` في `app/index.tsx`
