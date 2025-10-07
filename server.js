// خادم بسيط لإعادة توجيه /admin
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5500;

// أنواع الملفات
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // إعادة توجيه /admin إلى admin-dashboard.html
  if (pathname === '/admin' || pathname === '/admin/') {
    pathname = '/admin-dashboard.html';
  }
  
  // منع الوصول المباشر لـ admin-dashboard.html إلا عبر /admin
  if (pathname === '/admin-dashboard.html' && !req.url.includes('/admin')) {
    res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>غير مسموح</title>
          <style>
            body { font-family: 'Cairo', sans-serif; text-align: center; padding: 100px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>🚫 غير مسموح</h1>
          <p>هذه الصفحة متاحة فقط عبر الرابط المخصص للإدارة</p>
          <a href="/">العودة للصفحة الرئيسية</a>
        </body>
      </html>
    `);
    return;
  }
  
  // إذا كان المسار فارغاً، توجه إلى index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, pathname);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html dir="rtl" lang="ar">
            <head>
              <meta charset="UTF-8">
              <title>404 - الصفحة غير موجودة</title>
              <style>
                body { font-family: 'Cairo', sans-serif; text-align: center; padding: 100px; }
                h1 { color: #6A3FA0; }
              </style>
            </head>
            <body>
              <h1>404 - الصفحة غير موجودة</h1>
              <p>الصفحة التي تبحث عنها غير موجودة</p>
              <a href="/">العودة للصفحة الرئيسية</a>
            </body>
          </html>
        `);
      } else {
        res.writeHead(500);
        res.end(`خطأ في الخادم: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 خادم دوّرها يعمل على المنفذ ${PORT}`);
  console.log(`📱 الرابط: http://localhost:${PORT}`);
  console.log(`🔧 لوحة الإدارة: http://localhost:${PORT}/admin`);
  console.log(`\n💡 تلميح: اضغط Ctrl+C لإيقاف الخادم`);
});
