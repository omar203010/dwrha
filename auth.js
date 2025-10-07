// 🔐 auth.js - نظام المصادقة لدوّرها

// 🔹 دالة تشفير كلمة المرور (بسيطة - يمكن استبدالها بـ bcrypt لاحقاً)
function hashPassword(password) {
  // في الإنتاج، استخدم bcrypt أو argon2
  // هذا تشفير بسيط للتوضيح
  return btoa(password + '_dawerha_salt_2025');
}

// 🔹 توليد Token عشوائي
function generateToken() {
  return 'dwrha_' + Math.random().toString(36).substring(2) + '_' + Date.now() + '_' + Math.random().toString(36).substring(2);
}

// 🔹 تسجيل دخول الشركة
async function loginCompany(email, password) {
  try {
    // البحث عن الشركة
    const { data: company, error } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('email', email)
      .eq('password_hash', hashPassword(password))
      .single();

    if (error || !company) {
      return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // التحقق من أن الشركة مفعّلة
    if (!company.is_active || company.status !== 'approved') {
      return { success: false, message: 'حسابك غير مفعّل أو قيد المراجعة. يرجى التواصل مع الإدارة.' };
    }

    // إنشاء جلسة جديدة
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // صالح لمدة 24 ساعة

    const { error: sessionError } = await supabaseClient
      .from('sessions')
      .insert([{
        user_type: 'company',
        user_id: company.id,
        email: company.email,
        token: token,
        expires_at: expiresAt.toISOString()
      }]);

    if (sessionError) {
      console.error('خطأ في إنشاء الجلسة:', sessionError);
      return { success: false, message: 'حدث خطأ في تسجيل الدخول' };
    }

    // تحديث آخر تسجيل دخول
    await supabaseClient
      .from('companies')
      .update({ last_login: new Date().toISOString() })
      .eq('id', company.id);

    // حفظ معلومات الجلسة في localStorage
    const session = {
      token: token,
      userType: 'company',
      userId: company.id,
      email: company.email,
      name: company.name,
      expiresAt: expiresAt.toISOString()
    };
    localStorage.setItem('dawerha_session', JSON.stringify(session));

    return { 
      success: true, 
      message: 'تم تسجيل الدخول بنجاح',
      company: company,
      redirectTo: `company-dashboard.html?id=${company.id}`
    };

  } catch (err) {
    console.error('خطأ في تسجيل الدخول:', err);
    return { success: false, message: 'حدث خطأ غير متوقع' };
  }
}

// 🔹 تسجيل دخول الإدارة
async function loginAdmin(email, password) {
  try {
    // البحث عن المستخدم الإداري
    const { data: admin, error } = await supabaseClient
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', hashPassword(password))
      .single();

    if (error || !admin) {
      return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    if (!admin.is_active) {
      return { success: false, message: 'حسابك غير مفعّل' };
    }

    // إنشاء جلسة
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12); // صالح لمدة 12 ساعة

    const { error: sessionError } = await supabaseClient
      .from('sessions')
      .insert([{
        user_type: 'admin',
        user_id: admin.id,
        email: admin.email,
        token: token,
        expires_at: expiresAt.toISOString()
      }]);

    if (sessionError) {
      return { success: false, message: 'حدث خطأ في تسجيل الدخول' };
    }

    // تحديث آخر تسجيل دخول
    await supabaseClient
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // حفظ الجلسة
    const session = {
      token: token,
      userType: 'admin',
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      expiresAt: expiresAt.toISOString()
    };
    localStorage.setItem('dawerha_session', JSON.stringify(session));

    return { 
      success: true, 
      message: 'تم تسجيل الدخول بنجاح',
      admin: admin,
      redirectTo: 'admin-dashboard.html'
    };

  } catch (err) {
    console.error('خطأ في تسجيل الدخول:', err);
    return { success: false, message: 'حدث خطأ غير متوقع' };
  }
}

// 🔹 الحصول على الجلسة الحالية
function getCurrentSession() {
  const sessionStr = localStorage.getItem('dawerha_session');
  if (!sessionStr) return null;

  try {
    const session = JSON.parse(sessionStr);
    
    // التحقق من انتهاء الصلاحية
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem('dawerha_session');
      return null;
    }

    return session;
  } catch (err) {
    localStorage.removeItem('dawerha_session');
    return null;
  }
}

// 🔹 التحقق من صلاحية الجلسة من قاعدة البيانات
async function verifySession(token) {
  try {
    const { data: session, error } = await supabaseClient
      .from('sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    return session ? true : false;
  } catch (err) {
    return false;
  }
}

// 🔹 التحقق من أن المستخدم مسجل دخول (للصفحات المحمية)
async function requireAuth(userType = null) {
  const session = getCurrentSession();
  
  if (!session) {
    // إعادة التوجيه لصفحة تسجيل الدخول
    const loginPage = userType === 'admin' ? 'admin-login.html' : 'login.html';
    window.location.href = loginPage;
    return null;
  }

  // التحقق من نوع المستخدم إذا تم تحديده
  if (userType && session.userType !== userType) {
    alert('ليس لديك صلاحية للوصول لهذه الصفحة');
    window.location.href = 'index.html';
    return null;
  }

  // التحقق من صلاحية الجلسة في قاعدة البيانات
  const isValid = await verifySession(session.token);
  if (!isValid) {
    localStorage.removeItem('dawerha_session');
    const loginPage = userType === 'admin' ? 'admin-login.html' : 'login.html';
    window.location.href = loginPage;
    return null;
  }

  return session;
}

// 🔹 تسجيل الخروج
async function logout() {
  const session = getCurrentSession();
  
  if (session) {
    // حذف الجلسة من قاعدة البيانات
    await supabaseClient
      .from('sessions')
      .delete()
      .eq('token', session.token);
  }

  // حذف الجلسة من localStorage
  localStorage.removeItem('dawerha_session');
  
  // إعادة التوجيه للصفحة الرئيسية
  window.location.href = 'index.html';
}

// 🔹 إنشاء حساب للشركة (يُستخدم عند التسجيل)
async function createCompanyAccount(companyData) {
  try {
    // توليد كلمة مرور مؤقتة عشوائية
    const tempPassword = 'Dwrha' + Math.random().toString(36).substring(2, 8).toUpperCase() + '@' + new Date().getFullYear();
    
    const { data: company, error } = await supabaseClient
      .from('companies')
      .insert([{
        ...companyData,
        password_hash: hashPassword(tempPassword),
        is_active: false, // ستُفعّل بعد موافقة الإدارة
      }])
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      company: company,
      tempPassword: tempPassword,
      message: 'تم إنشاء الحساب بنجاح'
    };

  } catch (err) {
    console.error('خطأ في إنشاء الحساب:', err);
    return { success: false, message: 'حدث خطأ في إنشاء الحساب' };
  }
}

// 🔹 تصدير الدوال للاستخدام
window.authSystem = {
  loginCompany,
  loginAdmin,
  getCurrentSession,
  requireAuth,
  logout,
  createCompanyAccount,
  hashPassword
};

