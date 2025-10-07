// main.js

const form = document.getElementById("leadForm");

// 🎨 ألوان دوّرها الأساسية
const dawerhaColors = [
  "#6A3FA0", // البنفسجي الأساسي
  "#8C59C4", // البنفسجي الفاتح
  "#2E2240", // البنفسجي الداكن
  "#F3E9FF", // الخلفية الفاتحة
  "#B794F6", // درجة وسط
  "#9D72D0"  // درجة إضافية
];

// 🎲 دالة توليد ألوان عشوائية من ألوان دوّرها
function generateColors(count = 6) {
  const shuffled = [...dawerhaColors].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(form);

  const prizes = data.get("prizes").split(",").map(p => p.trim());
  
  // 🎨 توليد ألوان تلقائياً بناءً على عدد الجوائز
  const colors = generateColors(prizes.length);

  const { data: company, error } = await supabaseClient
    .from("companies")
    .insert([{
      type: data.get("type"),
      name: data.get("company"),
      email: data.get("email"),
      phone: data.get("phone"),
      prizes: prizes,
      colors: colors,
      status: "pending"
    }])
    .select()
    .single();

  if (error) {
    alert("❌ حدث خطأ: " + error.message);
  } else {
    // 🔗 رابط مطلق كامل (يشمل دومين الموقع)
    const companyUrl = `${window.location.origin}/company.html?id=${company.id}`;

    // تحويل إلى صفحة الشكر وتمرير الرابط
    window.location.href = `thanks.html?link=${encodeURIComponent(companyUrl)}`;
  }
});
