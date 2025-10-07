// main.js

const form = document.getElementById("leadForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(form);

  const prizes = data.get("prizes").split(",").map(p => p.trim());
  const colors = data.get("colors").split(",").map(c => c.trim());

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
