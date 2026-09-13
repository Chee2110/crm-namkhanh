import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CÔNG TY TNHH NK NAM KHÁNH - CRM VĂN PHÒNG PHẨM`);
  console.log(`📡 Backend API: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`====================================================`);
});
