/* ==========================================================================
   ميدان فِت — Google Apps Script Web App (كود جديد يحل محل القديم بالكامل)
   يُستبدل في مشروع Apps Script المربوط بالـ Google Sheet الذي فيه ورقة اسمها "Users".

   صف الهيدر (الصف الأول) بورقة Users يجب أن يكون، بهذا الترتيب بالضبط:
   التاريخ (Timestamp) | اسم المستخدم (Username) | كلمة المرور (Password) | نوع الرياضة |
   الاسم الكامل | الجنس | تاريخ الميلاد | وحدة قياس الطول | الطول | وحدة قياس الوزن |
   الوزن | الخبرة بالتدريب | طبيعة اليوم خارج التمرين | أيام التدريب بالأسبوع |
   تقسيمة تمارين الجيم | هدف التدريب الأساسي | الهدف بالوزن | أسلوب بناء التمارين |
   إضافة الكارديو | مدة التمرين | مكان التمرين                                  (= 21 عموداً)

   ملاحظة أمان: كلمة المرور تُحفظ نص صريح (بدون تشفير) بناءً على طلب صريح من
   صاحب التطبيق — بدون أي تشفير/هاش. لو حبيت تضيف تشفير لاحقاً، هاد المكان
   المناسب (مثلاً Utilities.computeDigest قبل appendRow/setValues).
   ========================================================================== */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var data = JSON.parse(e.postData.contents);
  var rows = sheet.getDataRange().getValues();

  function out(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  }
  function findRow(email) {
    for (var i = 1; i < rows.length; i++) if (rows[i][1] === email) return i;
    return -1;
  }

  /* ---------- إنشاء حساب: يحفظ فقط البريد وكلمة المرور، الملف الشخصي يُحفظ
     لاحقاً بإجراء saveProfile بعد ما يخلّص المستخدم شاشات الإعداد ---------- */
  if (data.action === "signup") {
    if (findRow(data.email) !== -1) {
      return out({ status: "error", message: "البريد الإلكتروني مسجل مسبقاً" });
    }
    var newRow = new Array(21).fill("");
    newRow[0] = new Date().toISOString();
    newRow[1] = data.email;
    newRow[2] = data.password;
    sheet.appendRow(newRow);
    return out({ status: "success", message: "تم إنشاء الحساب بنجاح" });
  }

  /* ---------- تسجيل الدخول: يرجّع الملف الشخصي الكامل (لو موجود) عشان
     التطبيق يقدر يرجّع بيانات المستخدم حتى لو دخل من جهاز/متصفح جديد ---------- */
  if (data.action === "login") {
    var i = findRow(data.email);
    if (i === -1 || rows[i][2] !== data.password) {
      return out({ status: "error", message: "البريد أو كلمة المرور غير صحيحة" });
    }
    var r = rows[i];
    return out({
      status: "success",
      email: r[1],
      profile: {
        sport: r[3], name: r[4], sex: r[5], dob: r[6], hUnit: r[7], h: r[8],
        wUnit: r[9], w: r[10], exp: r[11], life: r[12], days: r[13], split: r[14],
        goal: r[15], cg: r[16], buildStyle: r[17], cardio: r[18], dur: r[19], loc: r[20]
      }
    });
  }

  /* ---------- حفظ/تحديث الملف الشخصي الكامل (يُستدعى بعد ما يخلّص المستخدم
     شاشات الإعداد لأول مرة، ويُستدعى كمان كل مرة يعدّل بياناته من الإعدادات) ---------- */
  if (data.action === "saveProfile") {
    var i = findRow(data.email);
    var values = [
      data.sport || "", data.name || "", data.sex || "", data.dob || "", data.hUnit || "", data.h || "",
      data.wUnit || "", data.w || "", data.exp || "", data.life || "", data.days || "", data.split || "",
      data.goal || "", data.cg || "", data.buildStyle || "", data.cardio || "", data.dur || "", data.loc || ""
    ];
    if (i === -1) {
      // لم يسبق أن عمل signup (حالة نادرة) — ينشئ صفاً جديداً كاملاً
      var row = [new Date().toISOString(), data.email, data.password || ""].concat(values);
      sheet.appendRow(row);
    } else {
      sheet.getRange(i + 1, 4, 1, values.length).setValues([values]); // الأعمدة D..U، بدون لمس التاريخ/البريد/كلمة المرور
    }
    return out({ status: "success", message: "تم حفظ الملف الشخصي" });
  }

  return out({ status: "error", message: "إجراء غير معروف" });
}
