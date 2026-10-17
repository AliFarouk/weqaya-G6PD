# موجهات التصميم لأداة ستيتش (Google Stitch Design Prompts)
**المشروع:** منصة وقاية لأنيميا الفول (Weqaya G6PD)  
**اللغة المستهدفة:** العربية (RTL First)  
**الهوية البصرية:** طبية حديثة، فيروزي داكن وأخضر ناصع مع أحمر تحذيري، تصميم بطاقات نظيف وفائق البساطة.  

---

## الموجه 1: الشاشة الرئيسية والتغذية الحية (Home & Instant Feed)

```text
A modern, ultra-clean mobile web application interface for "Weqaya G6PD" (وقاية), an Egyptian Arabic crowdsourced medical safety directory for favism/G6PD patients. 

Screen details:
- Orientation: Mobile vertical portrait (390x844 iPhone 14 style) with Right-to-Left (RTL) Arabic layout.
- Top Header: Clean white navbar with a teal shield logo, Arabic brand name "وقاية", an accent button "➕ أضف صنف", and a login link "دخول".
- Hero Search Bar: Prominent, rounded search bar with a search icon and Arabic placeholder: "ابحث باسم المنتج.. مثال: لانشون، ريفو، كتاكيتو".
- Filter Chips: Horizontal scrolling pill buttons: "الكل" (selected, teal solid), "أكلات 🍔" (white outline), "أدوية 💊" (white outline).
- Feed List: Vertical list of clean white cards on a soft light grey (#F8FAFC) background.
  - Card 1: Food badge "🍔 أكل", title "لانشون حلواني سادة", dual progress bar showing 8% red (حصل تكسير) vs 92% green (آمن), vote count "97 صوّتوا", and two action buttons "[ ⚠️ حصل تكسير ]" and "[ ✅ آمن معي ]".
  - Card 2: Medication badge "💊 دواء", title "أقراص ريفو الخضراء (أسبيرين)", dual progress bar showing 95% red vs 5% green, vote count "173 صوّتوا".
- Typography: Arabic modern sans-serif (Cairo or Tajawal font), crisp contrast, friendly medical aesthetics.
```

---

## الموجه 2: بطاقة الصنف التفاعلية وشريط الأمان (Item Card & Dual Progress Bar)

```text
Close-up UI component shot of an interactive crowdsourced safety card for an Arabic medical application "Weqaya G6PD" (Right-to-Left layout).

Component specifications:
- Container: Clean white elevated card, rounded corners (16px), subtle soft drop shadow.
- Header row: Right side shows a category badge "🍔 أكل أو مشروب" with a subtle green-tinted background. Left side shows "١١٦ صوّتوا" (116 voted) in grey text.
- Title: Bold Egyptian product trade name in Arabic "بسكويت كتاكيتو شوكولاتة" (18px, dark slate color #0F172A).
- The Dual Progress Bar:
  - Height 14px, rounded-full container.
  - Left side: Coral Red fill (#EF4444) taking 3% with tooltip "3% تكسير".
  - Right side: Vibrant Emerald Green fill (#10B981) taking 97% with tooltip "97% آمن".
- Action Buttons Row:
  - Left button: "[ ⚠️ حصل تكسير ]" with a light red border and soft pink hover state.
  - Right button: "[ ✅ آمن معي ]" with a solid emerald green background and white checkmark icon, highlighted as currently selected by the user.
- Disclaimer footer note below card: small 12px muted Arabic text "تجارب مجتمعية استرشادية".
```

---

## الموجه 3: نافذة إضافة صنف جديد (Add Item Modal)

```text
A sleek, modal bottom sheet / pop-up dialog in Arabic RTL for adding a new product to "Weqaya G6PD".

Modal specifications:
- Header: Title in bold Arabic "➕ إضافة صنف جديد للدليل", with an (X) close button on the left.
- Field 1 (Input): Text box labeled "اسم الصنف بالسوق المصري" with placeholder "مثال: طعمية بالسمسم، سبترين شراب".
- Field 2 (Category Selector): Two large toggle cards side by side:
  - Option A: "🍔 أكل أو سناك" (selected, with teal border and subtle checkmark).
  - Option B: "💊 دواء أو مكمل" (unselected, clean border).
- Field 3 (Optional Photo): Dotted-border upload box with a camera icon and Arabic text "التقط أو ارفع صورة غلاف المنتج (اختياري)".
- Field 4 (Initial Vote): Segmented control "ما هي تجربتك الشخصية معه؟":
  - "[ ⚠️ سبب تكسيراً ]"
  - "[ ✅ كان آمناً تماماً ]"
- Submit Button: Full-width vibrant teal button "#0D9488" with bold text "نشر الصنف فوراً 🚀".
```

---

## الموجه 4: نافذة المصادقة السريعة (10-Second Quick Auth Modal)

```text
A friendly, 10-second fast-registration pop-up modal for an Arabic health application "Weqaya G6PD" on mobile view.

Modal specifications:
- Layout: Centered pop-up card with soft blurred backdrop (glassmorphism effect).
- Title & Hook: Medical shield icon at top, headline "صوتك يحمي مريضاً آخر! 🛡️", subtitle "سجّل في 10 ثوانٍ لحفظ تجربتك وتأكيد تصويتك فوراً".
- Tabs: Segmented switch between "حساب جديد" (active) and "تسجيل الدخول".
- Inputs (Arabic RTL):
  - "الاسم الأول أو اسم الشهرة" (e.g. أم أحمد).
  - "رقم الهاتف أو البريد الإلكتروني".
  - "كلمة المرور".
- Checkbox toggle: Clean custom checkbox with label: "🩺 أنا طبيب أو صيدلي (إضافة شارة التوثيق)".
- Action Button: Large full-width emerald green button "تأكيد وتسجيل صوتي ✅".
- Micro-copy: "لن نشارك بياناتك أبداً | مجاني 100%".
```
