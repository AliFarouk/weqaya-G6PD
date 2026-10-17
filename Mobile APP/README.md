# تطبيق الهاتف المحمول — وقاية G6PD (Capacitor Mobile App)

تعتمد حزمة الموبايل على تغليف تطبيق **وقاية** المتجاوب بالكامل باستخدام **Capacitor** لإنتاج تطبيقات أصلية (Native Android APK / iOS App) بأعلى أداء ممكن وبدون كتابة أي كود مكرر.

---

## 1. المعمارية السحابية وربط الخادم (`server.url`)
نظراً لأن الواجهة الخلفية ومسارات الـ REST API مبنية داخل مسارات خادم Next.js (`src/app/api/...`)، تم ضبط ملف `capacitor.config.ts` بحيث يتصل مباشرة بعنوان الخادم السحابي المنشور:

```typescript
const config: CapacitorConfig = {
  appId: 'org.weqaya.g6pd',
  appName: 'وقاية G6PD',
  server: {
    // عنوان النشر السحابي لمنصة وقاية
    url: 'https://weqaya.org',
    cleartext: false,
  },
};
```

> **ملاحظة معمارية هامة:** لا نستخدم `next export` الثابت لأن التطبيق يعتمد على مسارات API الموحدة وتشفير التوكنات ومعالجة التزامن العالي من جانب الخادم مباشرة.

---

## 2. خطوات تجميع وتوليد تطبيق أندرويد (Build Android APK)

### المتطلبات المسبقة:
- تثبيت **Android Studio** مع Android SDK 34+.
- تثبيت **Java JDK 17+**.

### خطوات التجميع:
1. انتقل إلى مجلد الويب:
   ```powershell
   cd "C:\xampp2\htdocs\Weqaya G6PD\Website"
   ```
2. تثبيت تبعيات Capacitor:
   ```powershell
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
3. مزامنة الملفات والأصول مع مشروع الأندرويد:
   ```powershell
   npx cap sync android
   ```
4. فتح المشروع في أندرويد ستوديو لتجميع ملف الـ APK:
   ```powershell
   npx cap open android
   ```
5. من داخل Android Studio:
   - اختر من القائمة: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
   - ستجد ملف الـ APK جاهزاً للتثبيت الفوري في المسار:
     `Mobile APP/Android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 3. أيقونات وشاشات البدء (App Icons & Splash Screen)
- أيقونة التطبيق الرسمية متوفرة في: `Website/public/brand/App Icon Favicon 512x512.png` بدقة 512×512 ومجهزة لمواءمة الـ Safe Zone في أندرويد و iOS (Maskable Icon).
- شاشة البدء Splash Screen تعتمد لون العلامة الرسمي `#5E72E4` مع درع وقاية الأبيض.
