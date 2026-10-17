# مواصفات واجهة برمجة التطبيقات (API Specification) - منصة وقاية
**الإصدار:** 1.0 (REST API خفيف وسريع)  
**تاريخ التحديث:** أكتوبر 2026  
**صيغة البيانات:** JSON (UTF-8)  
**العنوان الأساسي (Base URL):** `/api`  

---

## 1. التوثيق والمصادقة (Authentication Header)
تستخدم المنصة توكنات خفيفة (JWT) يتم إرسالها في ترويسة الطلب:
```http
Authorization: Bearer <token>
```
*ملاحظة: تصفح المنتجات والبحث متاح للجميع (Public) دون الحاجة لترويسة التوثيق.*

---

## 2. استجابة الأخطاء الموحدة (Standard Error Response)
عند حدوث أي خطأ، يتم إرجاع كود الحالة المناسب بصيغة JSON التالية:
```json
{
  "success": false,
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "الصنف المطلوب غير موجود"
  }
}
```

---

## 3. مسارات المستخدمين والتسجيل (Auth Endpoints)

### 3.1 إنشاء حساب سريع (Register)
- **المسار:** `POST /api/auth/register`
- **الوصف:** تسجيل حساب جديد في أقل من 10 ثوانٍ.
- **جسم الطلب (Request Body):**
```json
{
  "name": "سارة محمد",
  "identifier": "sara@example.com",
  "password": "SecretPassword123",
  "is_doctor": false
}
```
- **الاستجابة الناجحة (`201 Created`):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 5,
    "name": "سارة محمد",
    "identifier": "sara@example.com",
    "is_doctor": false
  }
}
```

### 3.2 تسجيل الدخول (Login)
- **المسار:** `POST /api/auth/login`
- **جسم الطلب:**
```json
{
  "identifier": "sara@example.com",
  "password": "SecretPassword123"
}
```
- **الاستجابة الناجحة (`200 OK`):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 5,
    "name": "سارة محمد",
    "identifier": "sara@example.com",
    "is_doctor": false
  }
}
```

### 3.3 التحقق من الجلسة الحالية (Current User)
- **المسار:** `GET /api/auth/me`
- **الترويسة المطلوبة:** `Authorization: Bearer <token>`
- **الاستجابة الناجحة (`200 OK`):**
```json
{
  "success": true,
  "user": {
    "id": 5,
    "name": "سارة محمد",
    "identifier": "sara@example.com",
    "is_doctor": false
  }
}
```

---

## 4. مسارات الأصناف والبحث (Items Endpoints)

### 4.1 البحث وسرد الأصناف (List / Search Items)
- **المسار:** `GET /api/items`
- **معاملات الاستعلام (Query Parameters):**
  - `q`: نص البحث (مثل: "لانشون" أو "ريفو"). اختياري.
  - `category`: تصفية الفئة (`all`, `food`, `medication`). الافتراضي: `all`.
  - `page`: رقم الصفحة (الافتراضي: 1).
  - `limit`: عدد النتائج (الافتراضي: 20).
- **الاستجابة الناجحة (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "لانشون حلواني سادة",
      "category": "food",
      "image_url": "/uploads/halwani-lancheon.webp",
      "hemolysis_votes": 8,
      "safe_votes": 89,
      "total_votes": 97,
      "hemolysis_percent": 8.2,
      "safe_percent": 91.8,
      "user_vote": "safe",
      "created_at": "2026-10-14T20:00:00Z"
    },
    {
      "id": 2,
      "name": "أقراص ريفو الخضراء (أسبيرين)",
      "category": "medication",
      "image_url": null,
      "hemolysis_votes": 165,
      "safe_votes": 8,
      "total_votes": 173,
      "hemolysis_percent": 95.4,
      "safe_percent": 4.6,
      "user_vote": null,
      "created_at": "2026-10-14T20:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_records": 120,
    "total_pages": 6
  }
}
```

### 4.2 تفاصيل صنف محدد (Get Item Details)
- **المسار:** `GET /api/items/:id`
- **الاستجابة الناجحة (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "لانشون حلواني سادة",
    "category": "food",
    "image_url": "/uploads/halwani-lancheon.webp",
    "hemolysis_votes": 8,
    "safe_votes": 89,
    "total_votes": 97,
    "hemolysis_percent": 8.2,
    "safe_percent": 91.8,
    "user_vote": "safe"
  }
}
```

### 4.3 إضافة صنف جديد (Add New Item)
- **المسار:** `POST /api/items`
- **الصلاحية:** يتطلب تسجيل دخول (`Authorization: Bearer <token>`).
- **جسم الطلب:**
```json
{
  "name": "شوكولاتة جيرسي بجوز الهند",
  "category": "food",
  "image_url": null,
  "initial_vote": "safe"
}
```
- **الاستجابة الناجحة (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "شوكولاتة جيرسي بجوز الهند",
    "category": "food",
    "image_url": null,
    "hemolysis_votes": 0,
    "safe_votes": 1,
    "total_votes": 1,
    "created_by": 5
  }
}
```

---

## 5. مسار التصويت الفوري (Voting Endpoint)

### 5.1 تسجيل أو تغيير الصوت (Submit / Update Vote)
- **المسار:** `POST /api/items/:id/vote`
- **الصلاحية:** يتطلب تسجيل دخول (`Authorization: Bearer <token>`).
- **جسم الطلب:**
```json
{
  "vote_type": "hemolysis"
}
```
*القيم المسموح بها لـ `vote_type` هي فقط: `"hemolysis"` أو `"safe"`.*

- **الاستجابة الناجحة (`200 OK`):**
```json
{
  "success": true,
  "message": "تم تسجيل صوتك بنجاح",
  "item_id": 1,
  "user_vote": "hemolysis",
  "updated_stats": {
    "hemolysis_votes": 9,
    "safe_votes": 88,
    "total_votes": 97,
    "hemolysis_percent": 9.3,
    "safe_percent": 90.7
  }
}
```

---

## 6. أكواد استجابة HTTP المستعملة
- `200 OK`: نجاح العملية واسترجاع البيانات.
- `201 Created`: نجاح إنشاء الحساب أو إضافة صنف جديد.
- `400 Bad Request`: نقص في الحقول الإجبارية أو بيانات غير مطابقة للمواصفات.
- `401 Unauthorized`: المستخدم غير مسجل دخول عند محاولة التصويت أو الإضافة.
- `404 Not Found`: الصنف غير موجود.
- `409 Conflict`: البريد الإلكتروني أو الهاتف مستخدم مسبقاً.
