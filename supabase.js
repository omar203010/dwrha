// supabase.js
const { createClient } = window.supabase;

// 🔗 رابط مشروعك
const SUPABASE_URL = "https://zysakfczqrqefdaxrehc.supabase.co";

// 🔑 المفتاح العام (Anon Key)
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c2FrZmN6cXJxZWZkYXhyZWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjU0MTMsImV4cCI6MjA3NDc0MTQxM30.a0Zyxl_P077CDdt3SPFkCihgIETELL89Qed0Jr_4q4M";

// ⚡ إنشاء عميل Supabase
window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
