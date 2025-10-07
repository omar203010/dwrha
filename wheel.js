// wheel.js

// 🔹 1) قراءة ID من الرابط
function getCompanyId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

const companyId = getCompanyId();
if (!companyId) {
  document.body.innerHTML = "<h2 style='text-align:center'>❌ لم يتم العثور على الشركة</h2>";
  throw new Error("No company ID");
}

// 🔹 2) عناصر الصفحة
const logoEl = document.getElementById("companyLogo");
const nameEl = document.getElementById("companyName");
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("resultText");

// 🔹 3) متغيرات
let prizes = [];
let colors = [];
let spinning = false;

// 🔹 4) تحميل بيانات الشركة من Supabase
async function loadCompany() {
  const { data, error } = await supabaseClient
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error || !data) {
    document.body.innerHTML = "<h2 style='text-align:center'>❌ لم يتم العثور على بيانات الشركة</h2>";
    console.error(error);
    return;
  }

  // 🔍 تشخيص حالة الطلب
  console.log("Company data:", data);
  console.log("Status:", data.status);

  // 🟡 حالة الانتظار
  if (data.status === "pending" || data.status === null || data.status === undefined) {
    document.body.innerHTML = "<h2 style='text-align:center'>⏳ طلبك قيد المراجعة من فريق دوّرها…</h2>";
    return;
  }

  // 🔴 حالة الرفض
  if (data.status === "rejected") {
    document.body.innerHTML = "<h2 style='text-align:center; color:red'>❌ نعتذر، تم رفض طلبك.</h2>";
    return;
  }

  // 🟢 حالة التفعيل (approved أو أي قيمة أخرى)
  nameEl.textContent = data.name;
  
  // معالجة الشعار
  if (data.logo_url) {
    logoEl.src = data.logo_url;
  } else {
    // شعار افتراضي إذا لم يكن هناك شعار
    logoEl.src = "assets/logo-dawerha.jpeg";
    logoEl.alt = "شعار افتراضي";
  }

  prizes = data.prizes || ["جائزة 1", "جائزة 2"];
  colors = data.colors || ["#6A3FA0", "#F2C23E"];

  drawWheel();
}

// 🔹 5) رسم العجلة
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const numSeg = prizes.length;
  const arc = (2 * Math.PI) / numSeg;

  for (let i = 0; i < numSeg; i++) {
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2,
      i * arc,
      (i + 1) * arc
    );
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

// 🔹 6) دوران العجلة
function spinWheel() {
  if (spinning) return;
  spinning = true;

  const spins = Math.floor(Math.random() * 5) + 5;
  const prizeIndex = Math.floor(Math.random() * prizes.length);
  const finalAngle =
    2 * Math.PI * spins + prizeIndex * (2 * Math.PI / prizes.length);

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
    }
  }
  requestAnimationFrame(animate);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

spinBtn.addEventListener("click", spinWheel);

// 🔹 7) تحميل الشركة عند فتح الصفحة
loadCompany();
