// wheel.js

// 🔹 1) قراءة ID من الرابط
function getCompanyId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

const companyId = getCompanyId();

// 🔹 2) عناصر الصفحة
const logoEl = document.getElementById("companyLogo");
const nameEl = document.getElementById("companyName");
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas?.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("resultText");

// 🔹 3) إنشاء نافذة الفوز (Modal)
const modal = document.createElement("div");
modal.id = "prizeModal";
modal.innerHTML = `
  <div id="modalContent" style="
    position: fixed;
    inset: 0;
    display: none;
    justify-content: center;
    align-items: center;
    background: rgba(0,0,0,0.6);
    z-index: 9999;
  ">
    <div style="
      background: #fff;
      border-radius: 16px;
      padding: 30px;
      width: 90%;
      max-width: 400px;
      text-align: center;
      font-family: 'Cairo', sans-serif;
      box-shadow: 0 10px 20px rgba(0,0,0,0.3);
      animation: fadeIn 0.4s ease;
    ">
      <h2 style="color:#2ecc71;">🎉 مبروك!</h2>
      <p id="modalPrize" style="font-size:20px;margin:10px 0;color:#333;"></p>
      <button id="modalAction" style="
        background:#6A3FA0;
        color:white;
        border:none;
        padding:10px 20px;
        border-radius:10px;
        cursor:pointer;
        font-size:16px;
      ">🎁 استلام الجائزة</button>
      <br><br>
      <button id="modalClose" style="
        background:#ccc;
        color:#222;
        border:none;
        padding:6px 14px;
        border-radius:8px;
        cursor:pointer;
        font-size:14px;
      ">إغلاق</button>
    </div>
  </div>
`;
document.body.appendChild(modal);

const modalContent = document.getElementById("modalContent");
const modalPrize = document.getElementById("modalPrize");
const modalAction = document.getElementById("modalAction");
const modalClose = document.getElementById("modalClose");

// 🔹 4) وظائف النافذة
modalAction.addEventListener("click", () => {
  alert("✅ تم تنفيذ أكشن استلام الجائزة بنجاح!");
  modalContent.style.display = "none";
});

modalClose.addEventListener("click", () => {
  modalContent.style.display = "none";
});

// 🔹 5) متغيرات العجلة
let prizes = [];
let colors = [];
let spinning = false;

// 🔹 6) التحقق من وجود ID
if (!companyId) {
  document.body.innerHTML = `
    <h2 style="text-align:center; color:#e74c3c; margin-top:60px;">
      ❌ لم يتم العثور على الشركة
    </h2>
    <p style="text-align:center; color:#555;">يرجى التأكد من صحة الرابط أو التواصل مع فريق دوّرها.</p>
  `;
  console.warn("⚠️ لا يوجد معرف شركة في الرابط.");
} else {
  loadCompany();
}

// 🔹 7) تحميل بيانات الشركة من Supabase
async function loadCompany() {
  try {
    const { data, error } = await supabaseClient
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error || !data) {
      document.body.innerHTML = `
        <h2 style="text-align:center; color:#e74c3c; margin-top:60px;">
          ❌ لم يتم العثور على بيانات الشركة
        </h2>
      `;
      console.error("خطأ في تحميل بيانات الشركة:", error);
      return;
    }

    console.log("✅ بيانات الشركة:", data);

    if (data.status === "pending" || data.status == null) {
      document.body.innerHTML = `
        <h2 style="text-align:center; margin-top:60px;">
          ⏳ طلبك قيد المراجعة من فريق دوّرها…
        </h2>
      `;
      return;
    }

    if (data.status === "rejected") {
      document.body.innerHTML = `
        <h2 style="text-align:center; color:red; margin-top:60px;">
          ❌ نعتذر، تم رفض طلبك.
        </h2>
      `;
      return;
    }

    nameEl.textContent = data.name || "شركة غير مسماة";
    logoEl.src = data.logo_url || "assets/logo-dawerha.jpeg";

    prizes = Array.isArray(data.prizes) && data.prizes.length > 0
      ? data.prizes
      : ["جائزة 1", "جائزة 2", "جائزة 3"];

    colors = Array.isArray(data.colors) && data.colors.length > 0
      ? data.colors
      : ["#6A3FA0", "#F2C23E", "#F77B72"];

    drawWheel();
  } catch (err) {
    console.error("🚨 خطأ أثناء تحميل بيانات الشركة:", err);
    document.body.innerHTML = `
      <h2 style="text-align:center; color:#c0392b; margin-top:60px;">
        ⚠️ حدث خطأ أثناء تحميل الشركة
      </h2>
    `;
  }
}

// 🔹 8) رسم العجلة
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const numSeg = prizes.length;
  const arc = (2 * Math.PI) / numSeg;

  for (let i = 0; i < numSeg; i++) {
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, i * arc, (i + 1) * arc);
    ctx.lineTo(canvas.width / 2, canvas.height / 2);
    ctx.fill();

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(i * arc + arc / 2);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Cairo";
    ctx.textAlign = "right";
    ctx.fillText(prizes[i], canvas.width / 2 - 10, 10);
    ctx.restore();
  }
}

// 🔹 9) دوران العجلة
function spinWheel() {
  if (spinning) return;
  spinning = true;

  const spins = Math.floor(Math.random() * 5) + 5;
  const prizeIndex = Math.floor(Math.random() * prizes.length);
  const finalAngle = 2 * Math.PI * spins + prizeIndex * (2 * Math.PI / prizes.length);

  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / 3000;
    const angle = easeOutCubic(progress) * finalAngle;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    drawWheel();
    ctx.restore();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      const wonPrize = prizes[prizeIndex];
      resultText.textContent = `🎉 ربحت: ${wonPrize}`;

      // ✅ عرض النافذة بالفوز
      modalPrize.textContent = wonPrize;
      modalContent.style.display = "flex";
    }
  }
  requestAnimationFrame(animate);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// 🔹 10) حدث الزر
if (spinBtn) spinBtn.addEventListener("click", spinWheel);
