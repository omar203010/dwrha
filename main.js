// main.js

const form = document.getElementById("leadForm");

// 🎨 ألوان دوّرها الأساسية - واضحة ومتباينة
const dawerhaColors = [
  "#6A3FA0", // البنفسجي الأساسي
  "#F2C23E", // ذهبي
  "#8C59C4", // البنفسجي الفاتح
  "#FF6B9D", // وردي
  "#2E2240", // البنفسجي الداكن
  "#4ECDC4", // تركواز
  "#B794F6", // بنفسجي وسط
  "#FF8B5A"  // برتقالي
];

// 🎲 دالة توليد ألوان عشوائية من ألوان دوّرها
function generateColors(count = 6) {
  const shuffled = [...dawerhaColors].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 🔐 دالة توليد كلمة مرور عشوائية
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const special = '@#$%';
  let password = 'Dwrha';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += special.charAt(Math.floor(Math.random() * special.length));
  password += new Date().getFullYear();
  return password;
}

// 🔐 دالة تشفير كلمة المرور (نفس الطريقة في auth.js)
function hashPassword(password) {
  return btoa(password + '_dawerha_salt_2025');
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري التسجيل...';

  const data = new FormData(form);

  const prizes = data.get("prizes").split(",").map(p => p.trim());
  
  // 🎨 توليد ألوان تلقائياً بناءً على عدد الجوائز
  const colors = generateColors(prizes.length);

  // 🔐 توليد كلمة مرور مؤقتة
  const tempPassword = generatePassword();

  const { data: company, error } = await supabaseClient
    .from("companies")
    .insert([{
      type: data.get("type"),
      name: data.get("company"),
      email: data.get("email"),
      phone: data.get("phone"),
      prizes: prizes,
      colors: colors,
      password_hash: hashPassword(tempPassword),
      is_active: false, // ستُفعّل بعد موافقة الإدارة
      status: "pending"
    }])
    .select()
    .single();

  if (error) {
    alert("❌ حدث خطأ: " + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  } else {
    // 🔗 رابط مطلق كامل (يشمل دومين الموقع)
    const companyUrl = `${window.location.origin}/company.html?id=${company.id}`;

    // تحويل إلى صفحة الشكر وتمرير البيانات
    const params = new URLSearchParams({
      link: companyUrl,
      email: company.email,
      password: tempPassword,
      company_id: company.id
    });
    
    window.location.href = `thanks.html?${params.toString()}`;
  }
});
