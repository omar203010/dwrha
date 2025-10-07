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

// عناصر نموذج الاسم
const nameSection = document.getElementById("nameSection");
const wheelSection = document.getElementById("wheelSection");
const nameForm = document.getElementById("nameForm");
const visitorNameInput = document.getElementById("visitorName");

let currentVisitorName = "";

// 🔹 3) معالجة نموذج الاسم
if (nameForm) {
  nameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    currentVisitorName = visitorNameInput.value.trim();
    
    if (currentVisitorName) {
      // إظهار العجلة تحت النموذج
      wheelSection.style.display = "flex";
      
      // تعطيل النموذج بعد الإرسال
      visitorNameInput.disabled = true;
      const submitBtn = nameForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "✅ تم التسجيل";
      submitBtn.style.background = "#2ecc71";
      
      // رسم العجلة بعد الظهور
      if (prizes.length > 0) {
        drawWheel();
      }
      
      // التمرير السلس للعجلة
      setTimeout(() => {
        wheelSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  });
}

// 🔹 4) إنشاء نافذة الفوز (Modal)
const modal = document.createElement("div");
modal.id = "prizeModal";
modal.innerHTML = `
  <div id="modalContent" style="
    position: fixed;
    inset: 0;
    display: none;
    justify-content: center;
    align-items: center;
    background: rgba(0,0,0,0.7);
    z-index: 9999;
  ">
    <div style="
      background: #fff;
      border-radius: 20px;
      padding: 40px 30px;
      width: 90%;
      max-width: 420px;
      text-align: center;
      font-family: 'Cairo', sans-serif;
      box-shadow: 0 15px 40px rgba(0,0,0,0.4);
      animation: fadeIn 0.4s ease;
    ">
      <h2 style="color:#2ecc71;font-size:32px;margin:0 0 15px;">🎉 مبروك <span id="modalVisitorName"></span>!</h2>
      <p id="modalPrize" style="font-size:24px;margin:15px 0 30px;color:#333;font-weight:bold;"></p>
      <button id="modalAction" style="
        background:#6A3FA0;
        color:white;
        border:none;
        padding:14px 30px;
        border-radius:12px;
        cursor:pointer;
        font-size:18px;
        font-weight:bold;
        box-shadow: 0 4px 12px rgba(106,63,160,0.4);
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">🎁 استلام الجائزة</button>
    </div>
  </div>
`;
document.body.appendChild(modal);

const modalContent = document.getElementById("modalContent");
const modalPrize = document.getElementById("modalPrize");
const modalVisitorNameEl = document.getElementById("modalVisitorName");
const modalAction = document.getElementById("modalAction");

// 🔹 5) وظيفة النافذة - استلام الجائزة وإعادة التحميل للعميل التالي
modalAction.addEventListener("click", () => {
  // إعادة تحميل الصفحة مباشرة للعميل التالي
  window.location.reload();
});

// 🔹 6) متغيرات العجلة
let prizes = [];
let colors = [];
let spinning = false;

// 🔹 7) التحقق من وجود ID
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

// 🔹 8) تحميل بيانات الشركة من Supabase
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
      : ["#6A3FA0", "#F2C23E", "#FF6B9D", "#4ECDC4", "#8C59C4", "#FF8B5A"];

    // لا نرسم العجلة هنا، سيتم رسمها بعد إدخال الاسم
  } catch (err) {
    console.error("🚨 خطأ أثناء تحميل بيانات الشركة:", err);
    document.body.innerHTML = `
      <h2 style="text-align:center; color:#c0392b; margin-top:60px;">
        ⚠️ حدث خطأ أثناء تحميل الشركة
      </h2>
    `;
  }
}

// 🔹 9) رسم العجلة بألوان واضحة ومنفصلة
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const numSeg = prizes.length;
  const arc = (2 * Math.PI) / numSeg;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 8; // هامش صغير من الحواف

  for (let i = 0; i < numSeg; i++) {
    // رسم القطاع
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, i * arc, (i + 1) * arc);
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    
    // إضافة حدود بيضاء بين الأقسام لمزيد من الوضوح
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // كتابة النص
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(i * arc + arc / 2);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Cairo";
    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(prizes[i], radius - 20, 10);
    ctx.restore();
  }
  
  // رسم دائرة في المنتصف
  ctx.beginPath();
  ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
  ctx.fillStyle = "#2F1D52";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.stroke();
}

// 🔹 10) دوران العجلة
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

      // 💾 حفظ بيانات الدورة في قاعدة البيانات
      saveSpin(wonPrize);

      // ✅ عرض النافذة بالفوز مع اسم الزائر
      modalVisitorNameEl.textContent = currentVisitorName;
      modalPrize.textContent = wonPrize;
      modalContent.style.display = "flex";
    }
  }
  requestAnimationFrame(animate);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// 🔹 11) حفظ بيانات الدورة في قاعدة البيانات
async function saveSpin(prize) {
  try {
    const { data, error } = await supabaseClient
      .from("game_spins")
      .insert([{
        company_id: companyId,
        visitor_name: currentVisitorName || "زائر",
        prize: prize,
        won: true,
        created_at: new Date().toISOString(),
        session_id: getSessionId()
      }]);

    if (error) {
      console.error("❌ خطأ في حفظ بيانات الدورة:", error);
    } else {
      console.log("✅ تم حفظ بيانات الدورة بنجاح");
    }
  } catch (err) {
    console.error("🚨 خطأ غير متوقع:", err);
  }
}

// 🔹 12) الحصول على Session ID فريد
function getSessionId() {
  let sessionId = sessionStorage.getItem('dawerha_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('dawerha_session_id', sessionId);
  }
  return sessionId;
}

// 🔹 13) حدث الزر
if (spinBtn) spinBtn.addEventListener("click", spinWheel);
