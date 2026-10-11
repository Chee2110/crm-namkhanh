/// <reference types="node" />
/**
 * SEED BỔ SUNG DỮ LIỆU MẪU SỐ LƯỢNG LỚN (100 - 250 dòng / trang)
 * - Chỉ THÊM dữ liệu, không xoá / sửa dữ liệu hiện có.
 * - Mỗi phần tự kiểm tra, nếu đã seed rồi thì bỏ qua (chạy lại an toàn).
 * - Mã chứng từ nối tiếp theo quy tắc `count + 1` của backend để tạo mới sau này không trùng mã.
 * Chạy: npx tsx prisma/seed-bulk.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------- Tiện ích ngẫu nhiên có seed (kết quả ổn định giữa các lần chạy) ----------------
let _seed = 20261011;
const rand = () => {
  _seed |= 0;
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;
const weighted = <T>(items: [T, number][]): T => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of items) {
    if ((r -= w) < 0) return v;
  }
  return items[items.length - 1][0];
};
const pad = (n: number, len: number) => String(n).padStart(len, '0');
const round1000 = (n: number) => Math.round(n / 1000) * 1000;
const unaccent = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

const NOW = new Date('2026-10-11T10:00:00+07:00');
const START = new Date('2025-11-01T08:00:00+07:00');
const randDate = (from = START, to = NOW) => new Date(from.getTime() + rand() * (to.getTime() - from.getTime()));
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
const minDate = (a: Date, b: Date) => (a < b ? a : b);

// ---------------- Kho dữ liệu tiếng Việt ----------------
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Trịnh', 'Mai', 'Tạ'];
const DEM_NAM = ['Văn', 'Đức', 'Minh', 'Quang', 'Hữu', 'Công', 'Thành', 'Tuấn', 'Gia', 'Hoàng'];
const DEM_NU = ['Thị', 'Thu', 'Ngọc', 'Thanh', 'Phương', 'Minh', 'Hải', 'Khánh', 'Mai', 'Diệu'];
const TEN_NAM = ['Anh', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Hải', 'Hiếu', 'Hùng', 'Huy', 'Khánh', 'Long', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Trung', 'Tú', 'Việt'];
const TEN_NU = ['Anh', 'Chi', 'Dung', 'Giang', 'Hà', 'Hạnh', 'Hằng', 'Hương', 'Lan', 'Linh', 'Ly', 'My', 'Nga', 'Ngân', 'Nhung', 'Oanh', 'Phương', 'Quyên', 'Thảo', 'Trang', 'Vân', 'Yến'];
const personName = () => {
  const male = chance(0.5);
  return {
    male,
    name: `${pick(HO)} ${male ? pick(DEM_NAM) : pick(DEM_NU)} ${male ? pick(TEN_NAM) : pick(TEN_NU)}`
  };
};

const DISTRICTS = [
  'Ba Đình, Hà Nội', 'Hoàn Kiếm, Hà Nội', 'Đống Đa, Hà Nội', 'Hai Bà Trưng, Hà Nội', 'Cầu Giấy, Hà Nội',
  'Thanh Xuân, Hà Nội', 'Hoàng Mai, Hà Nội', 'Long Biên, Hà Nội', 'Tây Hồ, Hà Nội', 'Nam Từ Liêm, Hà Nội',
  'Bắc Từ Liêm, Hà Nội', 'Hà Đông, Hà Nội', 'Gia Lâm, Hà Nội', 'Đông Anh, Hà Nội', 'Quận 1, TP.HCM',
  'Quận 3, TP.HCM', 'Quận 7, TP.HCM', 'Bình Thạnh, TP.HCM', 'Tân Bình, TP.HCM', 'TP. Thủ Đức, TP.HCM',
  'Hải Châu, Đà Nẵng', 'Ngô Quyền, Hải Phòng', 'TP. Bắc Ninh, Bắc Ninh', 'TP. Hải Dương, Hải Dương', 'TP. Vinh, Nghệ An'
];
const STREETS = [
  'Nguyễn Trãi', 'Láng Hạ', 'Trần Duy Hưng', 'Phạm Hùng', 'Xuân Thủy', 'Kim Mã', 'Giải Phóng', 'Lê Duẩn',
  'Nguyễn Chí Thanh', 'Hoàng Quốc Việt', 'Tôn Đức Thắng', 'Lý Thường Kiệt', 'Trường Chinh', 'Nguyễn Văn Cừ',
  'Lê Văn Lương', 'Tố Hữu', 'Phạm Văn Đồng', 'Võ Chí Công', 'Điện Biên Phủ', 'Cách Mạng Tháng 8', 'Nguyễn Văn Linh'
];
const PROVINCES = ['Hà Nội', 'Hải Phòng', 'Bắc Ninh', 'Hưng Yên', 'Hải Dương', 'Quảng Ninh', 'Thái Nguyên', 'Vĩnh Phúc', 'Nam Định', 'Thanh Hóa', 'Nghệ An', 'Đà Nẵng', 'Huế', 'Khánh Hòa', 'Bình Dương', 'Đồng Nai', 'TP.HCM', 'Cần Thơ', 'Long An', 'Lâm Đồng'];
const address = () => {
  const district = pick(DISTRICTS);
  return { full: `Số ${int(1, 350)} ${pick(STREETS)}, ${district}`, district };
};

const COMPANY_CORE = [
  'Minh Phát', 'Hưng Thịnh', 'An Khang', 'Thành Công', 'Phú Gia', 'Đại Việt', 'Hoàng Long', 'Sao Mai', 'Tân Á', 'Bảo Tín',
  'Việt Tiến', 'Thiên Phú', 'Kim Ngân', 'Hải Đăng', 'Nam Á', 'Đông Dương', 'Trường Sơn', 'Hồng Hà', 'Phương Đông', 'Toàn Cầu',
  'Lạc Hồng', 'Ánh Dương', 'Song Hành', 'Vạn Xuân', 'Quang Minh', 'Hòa Bình', 'Tiến Phát', 'Đức Anh', 'Thăng Long', 'Bình Minh'
];
const COMPANY_FIELD = ['Công Nghệ', 'Xây Dựng', 'Thương Mại', 'Logistics', 'Dược Phẩm', 'Bất Động Sản', 'Truyền Thông', 'Điện Tử', 'Thực Phẩm', 'Tư Vấn', 'Kiểm Toán', 'Bảo Hiểm', 'May Mặc', 'Năng Lượng', 'Du Lịch'];
const SCHOOL_NAMES = ['Nguyễn Du', 'Lê Quý Đôn', 'Chu Văn An', 'Trần Phú', 'Nguyễn Huệ', 'Lương Thế Vinh', 'Kim Liên', 'Việt Đức', 'Phan Đình Phùng', 'Marie Curie', 'Ngô Sĩ Liên', 'Trưng Vương', 'Hoàng Hoa Thám', 'Đoàn Thị Điểm', 'Thành Công'];
const ORG_PREFIX = ['UBND Phường', 'Trung tâm Y tế Quận', 'Chi cục Thuế Quận', 'Bảo hiểm Xã hội Quận', 'Kho bạc Nhà nước Quận', 'Phòng Giáo dục Quận', 'Bệnh viện Đa khoa'];

// ---------------- Danh mục hàng hóa ----------------
type Item = { name: string; unit: string; price: [number, number]; vat: number; spec: string };
const THEMES: { theme: string; key: string; items: Item[]; brands: string[] }[] = [
  { theme: 'Giấy note & Nhãn dán', key: 'NOTE', brands: ['Pronoti', 'Deli', '3M Post-it', 'Stick'], items: [
    { name: 'Giấy note vàng 3x3', unit: 'Xấp', price: [8000, 15000], vat: 8, spec: '100 tờ/xấp' },
    { name: 'Giấy note phân trang 5 màu', unit: 'Xấp', price: [12000, 25000], vat: 8, spec: '5 màu x 25 tờ' },
    { name: 'Nhãn dán Tomy A5', unit: 'Tập', price: [15000, 30000], vat: 8, spec: '10 tờ/tập' }
  ] },
  { theme: 'Sổ tay & Vở ghi', key: 'SO', brands: ['Hồng Hà', 'Campus', 'Klong', 'Moleskine'], items: [
    { name: 'Sổ bìa da A5', unit: 'Quyển', price: [45000, 120000], vat: 8, spec: '200 trang' },
    { name: 'Vở kẻ ngang 200 trang', unit: 'Quyển', price: [12000, 25000], vat: 8, spec: 'Giấy 70gsm' },
    { name: 'Sổ lò xo A4', unit: 'Quyển', price: [25000, 55000], vat: 8, spec: '120 trang' }
  ] },
  { theme: 'Bút lông & Bút dạ', key: 'LONG', brands: ['Thiên Long', 'Artline', 'Zebra', 'Monami'], items: [
    { name: 'Bút lông bảng WB-03', unit: 'Hộp', price: [60000, 110000], vat: 8, spec: '10 cây/hộp' },
    { name: 'Bút dạ quang HL-03', unit: 'Hộp', price: [50000, 95000], vat: 8, spec: '10 cây/hộp' },
    { name: 'Bút lông dầu PM-09', unit: 'Hộp', price: [70000, 120000], vat: 8, spec: '10 cây/hộp' }
  ] },
  { theme: 'Bút chì & Tẩy', key: 'CHI', brands: ['Staedtler', 'Thiên Long', 'Faber-Castell', 'Deli'], items: [
    { name: 'Bút chì gỗ 2B', unit: 'Hộp', price: [25000, 60000], vat: 8, spec: '12 cây/hộp' },
    { name: 'Bút chì kim 0.5mm', unit: 'Cây', price: [15000, 45000], vat: 8, spec: 'Ngòi 0.5mm' },
    { name: 'Tẩy trắng E-05', unit: 'Hộp', price: [30000, 55000], vat: 8, spec: '20 viên/hộp' }
  ] },
  { theme: 'Thước & Compa', key: 'THUOC', brands: ['Thiên Long', 'Deli', 'Hồng Hà', 'Maped'], items: [
    { name: 'Thước kẻ nhựa 30cm', unit: 'Cái', price: [5000, 15000], vat: 8, spec: 'Nhựa dẻo trong' },
    { name: 'Bộ compa kỹ thuật', unit: 'Bộ', price: [35000, 90000], vat: 8, spec: '8 chi tiết' },
    { name: 'Thước nhôm 50cm', unit: 'Cái', price: [20000, 45000], vat: 8, spec: 'Nhôm anode' }
  ] },
  { theme: 'Kẹp giấy & Ghim', key: 'KEP', brands: ['Deli', 'Echo', 'Plus', 'Max'], items: [
    { name: 'Kẹp bướm 32mm', unit: 'Hộp', price: [12000, 25000], vat: 8, spec: '12 cái/hộp' },
    { name: 'Ghim cài C62', unit: 'Hộp', price: [5000, 12000], vat: 8, spec: '100 cái/hộp' },
    { name: 'Kẹp giấy màu 28mm', unit: 'Hộp', price: [8000, 18000], vat: 8, spec: '100 cái/hộp' }
  ] },
  { theme: 'Bìa hồ sơ & Túi clear', key: 'HOSO', brands: ['Plus', 'Kingjim', 'TTP', 'Deli'], items: [
    { name: 'Túi clear bag A4', unit: 'Xấp', price: [25000, 50000], vat: 8, spec: '12 cái/xấp' },
    { name: 'Bìa trình ký A4', unit: 'Cái', price: [20000, 45000], vat: 8, spec: 'Nhựa PP' },
    { name: 'Bìa 40 lá A4', unit: 'Cái', price: [35000, 70000], vat: 8, spec: '40 lá' }
  ] },
  { theme: 'Khay & Kệ tài liệu', key: 'KHAY', brands: ['Deli', 'Xukiva', 'Plus', 'Kingjim'], items: [
    { name: 'Khay tài liệu 3 tầng', unit: 'Cái', price: [90000, 220000], vat: 10, spec: 'Nhựa cứng' },
    { name: 'Kệ hồ sơ 4 ngăn', unit: 'Cái', price: [70000, 180000], vat: 10, spec: 'Mica' },
    { name: 'Hộp cắm bút xoay', unit: 'Cái', price: [35000, 85000], vat: 10, spec: '4 ngăn' }
  ] },
  { theme: 'Mực in & Hộp mực', key: 'MUC', brands: ['HP', 'Canon', 'Brother', 'Epson'], items: [
    { name: 'Hộp mực laser 12A', unit: 'Hộp', price: [350000, 1450000], vat: 10, spec: '2.000 trang' },
    { name: 'Mực in phun 4 màu', unit: 'Bộ', price: [280000, 650000], vat: 10, spec: '4 lọ x 70ml' },
    { name: 'Drum máy in', unit: 'Cái', price: [600000, 1800000], vat: 10, spec: '12.000 trang' }
  ] },
  { theme: 'Băng keo & Keo dán', key: 'KEO', brands: ['Deli', 'Thiên Long', 'Scotch', 'Stanley'], items: [
    { name: 'Băng keo 2 mặt 2.4cm', unit: 'Cuộn', price: [8000, 18000], vat: 8, spec: '10 yard' },
    { name: 'Keo khô 21g', unit: 'Hộp', price: [60000, 120000], vat: 8, spec: '12 thỏi/hộp' },
    { name: 'Băng keo giấy 4.8cm', unit: 'Cuộn', price: [12000, 25000], vat: 8, spec: '20 yard' }
  ] },
  { theme: 'Pin & Phụ kiện điện', key: 'PIN', brands: ['Panasonic', 'Energizer', 'Duracell', 'Lioa'], items: [
    { name: 'Pin AA', unit: 'Vỉ', price: [20000, 60000], vat: 10, spec: '4 viên/vỉ' },
    { name: 'Pin AAA', unit: 'Vỉ', price: [18000, 55000], vat: 10, spec: '4 viên/vỉ' },
    { name: 'Ổ cắm điện 6 lỗ', unit: 'Cái', price: [120000, 280000], vat: 10, spec: 'Dây 3m' }
  ] },
  { theme: 'Bảng viết & Phụ kiện', key: 'BANG', brands: ['Bavico', 'Hàn Quốc', 'Deli', 'Thiên Long'], items: [
    { name: 'Bảng trắng từ 1.2x2.4m', unit: 'Cái', price: [1200000, 2400000], vat: 10, spec: 'Khung nhôm' },
    { name: 'Bảng ghim bần 60x90', unit: 'Cái', price: [250000, 480000], vat: 10, spec: 'Khung gỗ' },
    { name: 'Nam châm bảng', unit: 'Hộp', price: [25000, 60000], vat: 8, spec: '10 viên/hộp' }
  ] },
  { theme: 'Dấu & Mực dấu', key: 'DAU', brands: ['Shiny', 'Horse', 'Deli', 'Colop'], items: [
    { name: 'Dấu liền mực tên', unit: 'Cái', price: [80000, 180000], vat: 10, spec: 'Mặt dấu 14x38mm' },
    { name: 'Mực dấu đỏ 28ml', unit: 'Lọ', price: [15000, 35000], vat: 8, spec: '28ml' },
    { name: 'Hộp dấu số tự động', unit: 'Cái', price: [250000, 550000], vat: 10, spec: '8 số' }
  ] },
  { theme: 'Phong bì & Bao thư', key: 'PB', brands: ['Hồng Hà', 'Bãi Bằng', 'Plus', 'Tân Mai'], items: [
    { name: 'Phong bì trắng 12x22', unit: 'Xấp', price: [20000, 40000], vat: 8, spec: '100 cái/xấp' },
    { name: 'Phong bì A4 kraft', unit: 'Xấp', price: [45000, 90000], vat: 8, spec: '50 cái/xấp' },
    { name: 'Bao thư có cửa sổ', unit: 'Xấp', price: [30000, 60000], vat: 8, spec: '100 cái/xấp' }
  ] },
  { theme: 'Giấy in nhiệt & Hóa đơn', key: 'NHIET', brands: ['Hanson', 'Bãi Bằng', 'Oji', 'Double A'], items: [
    { name: 'Giấy in nhiệt K80', unit: 'Cuộn', price: [8000, 16000], vat: 8, spec: 'Phi 80mm' },
    { name: 'Giấy in nhiệt K57', unit: 'Cuộn', price: [5000, 10000], vat: 8, spec: 'Phi 45mm' },
    { name: 'Giấy in liên tục 3 liên', unit: 'Thùng', price: [450000, 750000], vat: 8, spec: '1.000 tờ/thùng' }
  ] },
  { theme: 'Máy in & Máy scan', key: 'MAYIN', brands: ['HP', 'Canon', 'Brother', 'Epson'], items: [
    { name: 'Máy in laser đen trắng', unit: 'Máy', price: [2800000, 6500000], vat: 10, spec: 'In 2 mặt' },
    { name: 'Máy scan tài liệu', unit: 'Máy', price: [3500000, 9500000], vat: 10, spec: 'ADF 50 tờ' },
    { name: 'Máy in màu đa năng', unit: 'Máy', price: [4500000, 12000000], vat: 10, spec: 'In - Scan - Copy' }
  ] },
  { theme: 'Máy chiếu & Màn chiếu', key: 'CHIEU', brands: ['Epson', 'ViewSonic', 'Dalite', 'Sony'], items: [
    { name: 'Máy chiếu văn phòng', unit: 'Máy', price: [8500000, 18000000], vat: 10, spec: '3.600 lumens' },
    { name: 'Màn chiếu treo tường 100 inch', unit: 'Cái', price: [900000, 2200000], vat: 10, spec: '1.8x1.8m' },
    { name: 'Bút trình chiếu laser', unit: 'Cái', price: [180000, 650000], vat: 10, spec: 'Kết nối USB' }
  ] },
  { theme: 'Thiết bị lưu trữ', key: 'LUUTRU', brands: ['Kingston', 'SanDisk', 'Samsung', 'Transcend'], items: [
    { name: 'USB 32GB', unit: 'Cái', price: [90000, 180000], vat: 10, spec: 'USB 3.0' },
    { name: 'Ổ cứng di động 1TB', unit: 'Cái', price: [1200000, 1900000], vat: 10, spec: 'USB 3.1' },
    { name: 'Thẻ nhớ microSD 64GB', unit: 'Cái', price: [150000, 320000], vat: 10, spec: 'Class 10' }
  ] },
  { theme: 'Đồ dùng vệ sinh văn phòng', key: 'VESINH', brands: ['Pulppy', 'Sunlight', 'Lix', 'An Khang'], items: [
    { name: 'Giấy vệ sinh cuộn lớn', unit: 'Bịch', price: [65000, 140000], vat: 8, spec: '6 cuộn/bịch' },
    { name: 'Nước lau sàn 4L', unit: 'Can', price: [80000, 160000], vat: 8, spec: 'Can 4 lít' },
    { name: 'Khăn giấy rút', unit: 'Thùng', price: [180000, 320000], vat: 8, spec: '30 gói/thùng' }
  ] },
  { theme: 'Nước uống & Pantry', key: 'PANTRY', brands: ['Lavie', 'Nescafé', 'Lipton', 'Vinamilk'], items: [
    { name: 'Nước suối 500ml', unit: 'Thùng', price: [85000, 120000], vat: 8, spec: '24 chai/thùng' },
    { name: 'Cà phê hòa tan 3in1', unit: 'Hộp', price: [55000, 110000], vat: 8, spec: '20 gói/hộp' },
    { name: 'Trà túi lọc', unit: 'Hộp', price: [35000, 70000], vat: 8, spec: '25 túi/hộp' }
  ] },
  { theme: 'Bao bì đóng gói', key: 'BAOBI', brands: ['Tân Tiến', 'Rạng Đông', 'Hưng Phát', 'Việt Mỹ'], items: [
    { name: 'Thùng carton 3 lớp', unit: 'Cái', price: [6000, 15000], vat: 8, spec: '40x30x30cm' },
    { name: 'Màng PE quấn hàng', unit: 'Cuộn', price: [90000, 160000], vat: 8, spec: '2.4kg/cuộn' },
    { name: 'Túi xốp hơi chống sốc', unit: 'Cuộn', price: [180000, 350000], vat: 8, spec: '1.2x100m' }
  ] },
  { theme: 'Văn phòng phẩm học sinh', key: 'HOCSINH', brands: ['Thiên Long', 'Hồng Hà', 'Deli', 'Colokit'], items: [
    { name: 'Bộ màu sáp 24 màu', unit: 'Hộp', price: [25000, 60000], vat: 8, spec: '24 màu' },
    { name: 'Hộp bút học sinh', unit: 'Cái', price: [35000, 90000], vat: 8, spec: 'Nhựa 2 tầng' },
    { name: 'Bút mực học sinh', unit: 'Cây', price: [25000, 70000], vat: 8, spec: 'Ngòi mài thầy ông đồ' }
  ] },
  { theme: 'Lịch & Quà tặng doanh nghiệp', key: 'QUATANG', brands: ['Nam Khánh', 'Hồng Hà', 'Sài Gòn Gift', 'Việt Art'], items: [
    { name: 'Lịch để bàn in logo', unit: 'Cuốn', price: [35000, 90000], vat: 10, spec: '13 tờ' },
    { name: 'Bình giữ nhiệt khắc logo', unit: 'Cái', price: [120000, 320000], vat: 10, spec: '500ml' },
    { name: 'Bộ quà tặng sổ & bút', unit: 'Bộ', price: [180000, 450000], vat: 10, spec: 'Hộp giấy cứng' }
  ] },
  { theme: 'Thiết bị trình chiếu', key: 'TRINHCHIEU', brands: ['Logitech', 'Ugreen', 'Baseus', 'Microsoft'], items: [
    { name: 'Webcam hội nghị', unit: 'Cái', price: [900000, 3200000], vat: 10, spec: 'Full HD 1080p' },
    { name: 'Cáp HDMI 5m', unit: 'Sợi', price: [120000, 280000], vat: 10, spec: 'HDMI 2.0' },
    { name: 'Loa hội nghị bluetooth', unit: 'Cái', price: [1500000, 4500000], vat: 10, spec: 'Mic đa hướng' }
  ] },
  { theme: 'Đồ nội thất văn phòng nhỏ', key: 'NOITHAT', brands: ['Hòa Phát', 'Xuân Hòa', 'The One', 'Fami'], items: [
    { name: 'Ghế xoay văn phòng', unit: 'Cái', price: [850000, 2500000], vat: 10, spec: 'Lưng lưới' },
    { name: 'Tủ hồ sơ sắt 2 cánh', unit: 'Cái', price: [2200000, 4800000], vat: 10, spec: '1.83m' },
    { name: 'Hộc tủ di động 3 ngăn', unit: 'Cái', price: [950000, 1900000], vat: 10, spec: 'Có khóa' }
  ] }
];
const SEGMENTS = ['Phổ thông', 'Cao cấp', 'Doanh nghiệp', 'Trường học'];
const COLORS = ['Trắng', 'Đen', 'Xanh dương', 'Đỏ', 'Vàng', 'Xám bạc', 'Nhiều màu', 'Trong suốt'];

async function main() {
  console.log('--- BẮT ĐẦU SEED BỔ SUNG DỮ LIỆU SỐ LƯỢNG LỚN ---');

  const admin = await prisma.user.findFirst({ where: { code: 'ADMIN' } });
  if (!admin) throw new Error('Chưa có tài khoản ADMIN. Hãy chạy seed gốc trước: npm run prisma:seed');

  const roles = await prisma.role.findMany();
  const roleByCode = new Map(roles.map((r) => [r.code, r]));
  const depts = await prisma.department.findMany();
  const deptByCode = new Map(depts.map((d) => [d.code, d]));

  // =====================================================================
  // 1. PHÒNG BAN (+100)
  // =====================================================================
  if (!(await prisma.department.findUnique({ where: { code: 'NHOM-001' } }))) {
    const groups: { parent: string; label: string; addr: string }[] = [
      { parent: 'PKD1', label: 'Nhóm Kinh Doanh Doanh Nghiệp', addr: 'Tầng 3 - Trụ sở Nam Khánh' },
      { parent: 'PKD2', label: 'Nhóm Đại Lý & Bán Lẻ', addr: 'Tầng 3 - Trụ sở Nam Khánh' },
      { parent: 'KKD', label: 'Nhóm Chăm Sóc Khách Hàng', addr: 'Tầng 4 - Trụ sở Nam Khánh' },
      { parent: 'PKT', label: 'Tổ Kế Toán Công Nợ', addr: 'Tầng 2 - P.202' },
      { parent: 'PKHO', label: 'Tổ Kho Vận', addr: 'Tổng kho Gia Lâm, Hà Nội' }
    ];
    const rows: any[] = [];
    for (let i = 1; i <= 100; i++) {
      const g = groups[(i - 1) % groups.length];
      const area = DISTRICTS[(i - 1) % DISTRICTS.length].split(',')[0];
      const created = randDate(new Date('2025-06-01'), NOW);
      rows.push({
        code: `NHOM-${pad(i, 3)}`,
        name: `${g.label} - ${area} ${pad(Math.ceil(i / DISTRICTS.length), 2)}`,
        parentId: deptByCode.get(g.parent)?.id || null,
        address: `${g.addr} (phụ trách ${area})`,
        mission: `Phụ trách khu vực ${area}: phát triển khách hàng, chăm sóc đơn hàng và phối hợp giao nhận văn phòng phẩm`,
        status: weighted([['ACTIVE', 85], ['INACTIVE', 10], ['SUSPENDED', 5]]),
        createdAt: created
      });
    }
    await prisma.department.createMany({ data: rows, skipDuplicates: true });
    console.log(`✓ Phòng ban: +${rows.length}`);
  } else console.log('• Phòng ban: đã có, bỏ qua');
  const allDepts = await prisma.department.findMany();
  const subDepts = allDepts.filter((d) => d.code.startsWith('NHOM-'));

  // =====================================================================
  // 2. VAI TRÒ (+100) kèm ma trận quyền chỉ đọc theo nhóm
  // =====================================================================
  if (!(await prisma.role.findUnique({ where: { code: 'VT-001' } }))) {
    const titles: { t: string; modules: string[] }[] = [
      { t: 'Chuyên viên Kinh doanh', modules: ['B_CUSTOMERS', 'B_QUOTATIONS', 'B_ORDERS', 'C_PRODUCTS'] },
      { t: 'Trưởng nhóm Kinh doanh', modules: ['B_CUSTOMERS', 'B_QUOTATIONS', 'B_ORDERS', 'B_REPORTS', 'B_SALES_PLANS'] },
      { t: 'Nhân viên Chăm sóc Khách hàng', modules: ['B_CUSTOMERS', 'B_ORDERS'] },
      { t: 'Kế toán Công nợ', modules: ['E_RECEIPT_VOUCHERS', 'B_ORDERS', 'B_REPORTS'] },
      { t: 'Kế toán Thanh toán', modules: ['E_PAYMENT_VOUCHERS', 'E_EXPENSES'] },
      { t: 'Thủ quỹ', modules: ['E_RECEIPT_VOUCHERS', 'E_PAYMENT_VOUCHERS', 'E_CASHFLOW_REPORTS'] },
      { t: 'Nhân viên Kho', modules: ['C_PRODUCTS', 'C_WAREHOUSES', 'C_REPORTS'] },
      { t: 'Điều phối Giao nhận', modules: ['B_ORDERS', 'C_WAREHOUSES'] },
      { t: 'Nhân viên Mua hàng', modules: ['C_SUPPLIERS', 'C_PRODUCTS'] },
      { t: 'Kiểm soát Nội bộ', modules: ['B_REPORTS', 'E_CASHFLOW_REPORTS', 'C_REPORTS'] },
      { t: 'Hành chính Nhân sự', modules: ['A_USERS', 'A_DEPARTMENTS', 'A_DOCUMENTS'] },
      { t: 'Thư ký Ban Giám đốc', modules: ['A_DOCUMENTS', 'F_DASHBOARD_REVENUE'] },
      { t: 'Phân tích Dữ liệu', modules: ['F_DASHBOARD_REVENUE', 'F_DASHBOARD_PROFIT', 'B_SALES_OVERVIEW'] },
      { t: 'Cộng tác viên Bán hàng', modules: ['B_CUSTOMERS', 'B_QUOTATIONS'] },
      { t: 'Quản lý Đại lý', modules: ['B_CUSTOMERS', 'B_ORDERS', 'B_REPORTS'] },
      { t: 'Giám sát Kho', modules: ['C_OVERVIEW', 'C_REPORTS', 'C_WAREHOUSES'] },
      { t: 'Nhân viên Marketing', modules: ['B_CUSTOMERS', 'B_SALES_OVERVIEW'] },
      { t: 'Kỹ thuật Thiết bị', modules: ['C_PRODUCTS', 'B_ORDERS'] },
      { t: 'Quản lý Dự án B2B', modules: ['B_QUOTATIONS', 'B_ORDERS', 'B_SALES_PLANS'] },
      { t: 'Thực tập sinh', modules: ['C_PRODUCTS'] }
    ];
    const scopes = ['Khu vực Hà Nội', 'Khu vực TP.HCM', 'Khu vực Miền Trung', 'Khối Doanh nghiệp', 'Khối Trường học'];
    let n = 0;
    for (const sc of scopes) {
      for (const tt of titles) {
        n++;
        const created = randDate(new Date('2025-06-01'), NOW);
        await prisma.role.create({
          data: {
            code: `VT-${pad(n, 3)}`,
            name: `${tt.t} - ${sc}`,
            description: `Vai trò ${tt.t.toLowerCase()} phụ trách ${sc.toLowerCase()}`,
            isSystem: false,
            createdAt: created,
            permissions: {
              create: tt.modules.map((m) => ({
                moduleCode: m,
                canRead: true,
                canCreate: chance(0.6),
                canUpdate: chance(0.5),
                canDelete: false,
                dataScope: pick(['PERSONAL', 'DEPARTMENT', 'ALL'])
              }))
            }
          }
        });
      }
    }
    console.log(`✓ Vai trò: +${n}`);
  } else console.log('• Vai trò: đã có, bỏ qua');
  const customRoles = await prisma.role.findMany({ where: { code: { startsWith: 'VT-' } } });

  // =====================================================================
  // 3. NGƯỜI DÙNG (+120) - mật khẩu chung: Namkhanh@123
  // =====================================================================
  if (!(await prisma.user.findUnique({ where: { code: 'NV002' } }))) {
    const hash = await bcrypt.hash('Namkhanh@123', 10);
    const coreRoleMix: [string, number][] = [['SALES', 55], ['SALES_DIR', 8], ['ACCOUNTANT', 15], ['WAREHOUSE', 15], ['CEO', 2]];
    const usedEmails = new Set<string>();
    for (let i = 2; i <= 121; i++) {
      const p = personName();
      const parts = unaccent(p.name).toLowerCase().split(' ');
      let email = `${parts[parts.length - 1]}.${parts.slice(0, -1).map((x) => x[0]).join('')}${i}@namkhanh.vn`;
      while (usedEmails.has(email)) email = email.replace('@', 'x@');
      usedEmails.add(email);
      const roleCode = weighted(coreRoleMix);
      const dept =
        roleCode === 'ACCOUNTANT'
          ? pick(allDepts.filter((d) => d.code === 'PKT' || d.name.startsWith('Tổ Kế Toán')))
          : roleCode === 'WAREHOUSE'
          ? pick(allDepts.filter((d) => d.code === 'PKHO' || d.name.startsWith('Tổ Kho')))
          : pick(allDepts.filter((d) => ['PKD1', 'PKD2', 'KKD'].includes(d.code) || d.name.startsWith('Nhóm')));
      const startDate = randDate(new Date('2020-01-01'), new Date('2026-08-01'));
      const roleIds = [roleByCode.get(roleCode)!.id];
      if (chance(0.35) && customRoles.length) roleIds.push(pick(customRoles).id);
      await prisma.user.create({
        data: {
          code: `NV${pad(i, 3)}`,
          fullName: p.name,
          email,
          passwordHash: hash,
          phone: `09${pad(61000000 + i * 137, 8)}`,
          dob: randDate(new Date('1980-01-01'), new Date('2003-12-31')),
          departmentId: dept?.id || null,
          managerId: admin.id,
          basicSalary: round1000(int(8, 35) * 1000000),
          allowance: round1000(int(5, 40) * 100000),
          status: weighted([['ACTIVE', 90], ['INACTIVE', 10]]),
          startDate,
          createdAt: minDate(addDays(startDate, int(0, 10)), NOW),
          userRoles: { create: roleIds.map((roleId) => ({ roleId })) }
        }
      });
    }
    console.log('✓ Người dùng: +120 (mật khẩu: Namkhanh@123)');
  } else console.log('• Người dùng: đã có, bỏ qua');

  const staff = await prisma.user.findMany({ include: { userRoles: { include: { role: true } } } });
  const salesStaff = staff.filter((u) => u.userRoles.some((r) => ['SALES', 'SALES_DIR'].includes(r.role.code)) && u.status === 'ACTIVE');
  const accountants = staff.filter((u) => u.userRoles.some((r) => ['ACCOUNTANT', 'CEO', 'ADMIN'].includes(r.role.code)));
  const salesPool = salesStaff.length ? salesStaff : [admin as any];
  const accPool = accountants.length ? accountants : [admin as any];

  // Gán trưởng nhóm cho các phòng ban mới
  for (const d of subDepts) {
    if (!d.managerId) {
      const members = staff.filter((u) => u.departmentId === d.id);
      const mgr = members.length ? pick(members) : pick(salesPool);
      await prisma.department.update({ where: { id: d.id }, data: { managerId: mgr.id } });
    }
  }

  // =====================================================================
  // 4. HỒ SƠ GIẤY TỜ (+120)
  // =====================================================================
  if (!(await prisma.legalDocument.findUnique({ where: { code: 'HS-2026-001' } }))) {
    const contractTpl = ['Hợp đồng nguyên tắc cung ứng VPP', 'Hợp đồng mua bán giấy in', 'Phụ lục hợp đồng điều chỉnh đơn giá', 'Hợp đồng đại lý phân phối', 'Biên bản thanh lý hợp đồng', 'Hợp đồng cung cấp thiết bị văn phòng'];
    const certTpl = ['Chứng nhận xuất xứ CO', 'Chứng nhận chất lượng CQ', 'Giấy ủy quyền phân phối', 'Hồ sơ năng lực', 'Chứng nhận ISO 9001:2015', 'Giấy chứng nhận hợp quy'];
    const files = [
      { url: '/uploads/sample_contract_vpp_2026.pdf', mime: 'application/pdf', ext: 'pdf' },
      { url: '/uploads/sample_distributor_contract.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
      { url: '/uploads/chung_chi_co_cq_giay_in_vpp.pdf', mime: 'application/pdf', ext: 'pdf' },
      { url: '/uploads/ho_so_nang_luc_vpp_nam_khanh.pdf', mime: 'application/pdf', ext: 'pdf' }
    ];
    const rows: any[] = [];
    for (let i = 1; i <= 120; i++) {
      const isContract = chance(0.55);
      const base = isContract ? pick(contractTpl) : pick(certTpl);
      const partner = isContract ? `Công ty ${pick(['TNHH', 'CP'])} ${pick(COMPANY_FIELD)} ${pick(COMPANY_CORE)}` : pick(THEMES).theme;
      const f = isContract ? pick(files.slice(0, 2)) : pick(files.slice(2));
      const title = `${base} - ${partner}`;
      rows.push({
        code: `HS-2026-${pad(i, 3)}`,
        title,
        type: isContract ? 'CONTRACT' : 'CERTIFICATE',
        fileUrl: f.url,
        fileName: `${unaccent(base).toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${pad(i, 3)}.${f.ext}`,
        fileSize: int(150, 4800) * 1024,
        mimeType: f.mime,
        uploadedById: pick(staff).id,
        createdAt: randDate()
      });
    }
    await prisma.legalDocument.createMany({ data: rows, skipDuplicates: true });
    console.log(`✓ Hồ sơ giấy tờ: +${rows.length}`);
  } else console.log('• Hồ sơ giấy tờ: đã có, bỏ qua');

  // =====================================================================
  // 5. KHO VẬT LÝ (+100)
  // =====================================================================
  if (!(await prisma.warehouse.findUnique({ where: { code: 'KHO-CN-001' } }))) {
    const khoDepts = allDepts.filter((d) => d.code === 'PKHO' || d.name.startsWith('Tổ Kho'));
    const kinds = ['Kho chi nhánh', 'Kho trung chuyển', 'Kho ký gửi', 'Điểm giao nhận', 'Kho dự trữ'];
    const rows: any[] = [];
    for (let i = 1; i <= 100; i++) {
      const prov = PROVINCES[(i - 1) % PROVINCES.length];
      rows.push({
        code: `KHO-CN-${pad(i, 3)}`,
        name: `${kinds[(i - 1) % kinds.length]} ${prov} ${pad(Math.ceil(i / PROVINCES.length), 2)}`,
        address: `Lô ${int(1, 40)}, KCN/Cụm kho ${pick(['Nam', 'Bắc', 'Đông', 'Tây'])} ${prov}`,
        phone: `02${pad(40000000 + i * 911, 9)}`,
        departmentId: pick(khoDepts)?.id || null,
        status: weighted([['ACTIVE', 88], ['INACTIVE', 12]]),
        createdAt: randDate(new Date('2025-01-01'), NOW)
      });
    }
    await prisma.warehouse.createMany({ data: rows, skipDuplicates: true });
    console.log(`✓ Kho vật lý: +${rows.length}`);
  } else console.log('• Kho vật lý: đã có, bỏ qua');
  const warehouses = await prisma.warehouse.findMany({ where: { status: 'ACTIVE' } });

  // =====================================================================
  // 6. DANH MỤC (+100) & LOẠI HÀNG HÓA (+150)
  // =====================================================================
  if (!(await prisma.category.findUnique({ where: { code: 'DM-001' } }))) {
    let n = 0;
    const catRows: any[] = [];
    for (const seg of SEGMENTS) {
      for (const th of THEMES) {
        n++;
        catRows.push({
          code: `DM-${pad(n, 3)}`,
          name: `${th.theme} - ${seg}`,
          warehouseId: pick(warehouses).id,
          description: `Nhóm ${th.theme.toLowerCase()} phân khúc ${seg.toLowerCase()}: ${th.items.map((x) => x.name).join(', ')}`,
          status: weighted([['ACTIVE', 92], ['INACTIVE', 8]]),
          createdAt: randDate(new Date('2025-03-01'), NOW)
        });
      }
    }
    await prisma.category.createMany({ data: catRows, skipDuplicates: true });
    console.log(`✓ Danh mục hàng hóa: +${catRows.length}`);
  } else console.log('• Danh mục hàng hóa: đã có, bỏ qua');

  const newCats = await prisma.category.findMany({ where: { code: { startsWith: 'DM-0' } }, orderBy: { code: 'asc' } });
  const themeOfCat = (c: { name: string }) => THEMES.find((t) => c.name.startsWith(t.theme + ' - '))!;

  if (!(await prisma.productType.findUnique({ where: { code: 'LH-001' } }))) {
    const rows: any[] = [];
    let n = 0;
    for (const c of newCats) {
      const th = themeOfCat(c);
      if (!th) continue;
      const count = newCats.indexOf(c) % 2 === 0 ? 2 : 1;
      const items = [...th.items].sort(() => rand() - 0.5).slice(0, count);
      for (const it of items) {
        if (rows.length >= 150) break;
        n++;
        rows.push({
          code: `LH-${pad(n, 3)}`,
          name: `${it.name} (${c.name.split(' - ')[1]})`,
          categoryId: c.id,
          unit: it.unit,
          description: `Quy cách tham khảo: ${it.spec}`,
          status: weighted([['ACTIVE', 93], ['INACTIVE', 7]]),
          createdAt: randDate(new Date('2025-03-01'), NOW)
        });
      }
    }
    await prisma.productType.createMany({ data: rows, skipDuplicates: true });
    console.log(`✓ Loại hàng hóa: +${rows.length}`);
  } else console.log('• Loại hàng hóa: đã có, bỏ qua');
  const newTypes = await prisma.productType.findMany({ where: { code: { startsWith: 'LH-0' } }, include: { category: true } });

  // =====================================================================
  // 7. NHÀ CUNG CẤP (+120) - mã NCC-006 ... nối tiếp quy tắc backend
  // =====================================================================
  const supCount = await prisma.supplier.count();
  if (supCount < 50) {
    const rows: any[] = [];
    for (let i = 0; i < 120; i++) {
      const idx = supCount + 1 + i;
      const p = personName();
      const a = address();
      const core = `${pick(COMPANY_CORE)} ${pick(['', 'Việt', 'Group', 'Plus', 'Star'])}`.replace(/\s+/g, ' ').trim();
      const name = `Công ty ${pick(['TNHH', 'Cổ phần', 'TNHH MTV', 'CP Thương mại'])} ${pick(['Văn phòng phẩm', 'Giấy', 'Thiết bị Văn phòng', 'Bao bì', 'Phân phối', 'XNK'])} ${core}`;
      rows.push({
        code: `NCC-${pad(idx, 3)}`,
        name,
        phone: `02${pad(43000000 + idx * 733, 9)}`,
        email: `sales${idx}@${unaccent(core).toLowerCase().replace(/[^a-z]/g, '')}.com.vn`,
        address: a.full,
        taxCode: `0${pad(310000000 + idx * 7919, 9)}`,
        contactPerson: `${p.male ? 'Ông' : 'Bà'} ${p.name} (${pick(['Giám đốc kinh doanh', 'Trưởng kênh B2B', 'Phụ trách thị trường', 'Kế toán trưởng', 'Nhân viên bán hàng'])})`,
        notes: `Chuyên cung cấp ${pick(THEMES).theme.toLowerCase()}, thanh toán ${pick(['30 ngày', '45 ngày', 'trả ngay', '15 ngày'])}`,
        status: weighted([['ACTIVE', 90], ['INACTIVE', 10]]),
        createdAt: randDate(new Date('2025-01-01'), NOW)
      });
    }
    await prisma.supplier.createMany({ data: rows, skipDuplicates: true });
    console.log(`✓ Nhà cung cấp: +${rows.length}`);
  } else console.log('• Nhà cung cấp: đã có, bỏ qua');
  const suppliers = await prisma.supplier.findMany({ where: { status: 'ACTIVE' } });

  // =====================================================================
  // 8. SẢN PHẨM (+250)
  // =====================================================================
  if (!(await prisma.product.findUnique({ where: { code: 'SP-NOTE-001' } })) && !(await prisma.product.findFirst({ where: { code: { startsWith: 'SP-' }, barcode: { startsWith: '893600' } } }))) {
    const counters = new Map<string, number>();
    const rows: any[] = [];
    for (let i = 1; i <= 250; i++) {
      const t = newTypes[(i - 1) % newTypes.length];
      const th = themeOfCat(t.category);
      const it = th.items.find((x) => t.name.startsWith(x.name)) || th.items[0];
      const brand = pick(th.brands);
      const k = (counters.get(th.key) || 0) + 1;
      counters.set(th.key, k);
      const selling = round1000(int(it.price[0], it.price[1]));
      const cost = round1000(selling * (0.68 + rand() * 0.17));
      const minStock = int(10, 80);
      rows.push({
        code: `SP-${th.key}-${pad(k, 3)}`,
        barcode: `893600${pad(1000000 + i * 37, 7)}`,
        name: `${it.name} ${brand}${chance(0.4) ? ' ' + pick(['Pro', 'Plus', 'Eco', 'Premium', 'Classic']) : ''}`,
        category: t.category.name,
        unit: it.unit,
        costPrice: cost,
        sellingPrice: selling,
        vatRate: it.vat,
        stockQuantity: chance(0.1) ? int(0, minStock) : int(minStock + 5, 1500),
        minStockLevel: minStock,
        maxStockLevel: int(1000, 3000),
        warehouseId: t.category.warehouseId || pick(warehouses).id,
        categoryId: t.categoryId,
        productTypeId: t.id,
        supplierId: pick(suppliers).id,
        brand,
        specification: it.spec,
        subTypeCode: t.code,
        subTypeName: t.name,
        color: pick(COLORS),
        description: `${it.name} chính hãng ${brand}, quy cách ${it.spec}. Phù hợp nhu cầu ${t.category.name.split(' - ')[1].toLowerCase()}.`,
        status: weighted([['ACTIVE', 92], ['INACTIVE', 8]]),
        createdAt: randDate(new Date('2025-03-01'), NOW)
      });
    }
    await prisma.product.createMany({ data: rows, skipDuplicates: true });
    console.log(`✓ Sản phẩm: +${rows.length}`);
  } else console.log('• Sản phẩm: đã có, bỏ qua');
  const products = await prisma.product.findMany({ where: { status: 'ACTIVE' } });

  // =====================================================================
  // 9. KHÁCH HÀNG (+200) - mã KH0006 ... nối tiếp quy tắc backend
  // =====================================================================
  const custCount = await prisma.customer.count();
  if (custCount < 50) {
    const rows: any[] = [];
    for (let i = 0; i < 200; i++) {
      const idx = custCount + 1 + i;
      const type = weighted([['ENTERPRISE', 50], ['SCHOOL', 15], ['ORGANIZATION', 12], ['HOUSEHOLD', 13], ['INDIVIDUAL', 10]]);
      const a = address();
      const district = a.district.split(',')[0];
      const p = personName();
      let name = '';
      let email = '';
      if (type === 'ENTERPRISE') {
        const core = pick(COMPANY_CORE);
        name = `Công ty ${pick(['TNHH', 'Cổ phần', 'CP Tập đoàn', 'TNHH MTV'])} ${pick(COMPANY_FIELD)} ${core}`;
        email = `hanhchinh${idx}@${unaccent(core).toLowerCase().replace(/[^a-z]/g, '')}.vn`;
      } else if (type === 'SCHOOL') {
        name = `Trường ${pick(['Tiểu học', 'THCS', 'THPT', 'Mầm non'])} ${pick(SCHOOL_NAMES)} - ${district}`;
        email = `vanphong${idx}@truonghoc.edu.vn`;
      } else if (type === 'ORGANIZATION') {
        name = `${pick(ORG_PREFIX)} ${district}`;
        email = `vanthu${idx}@coquan.gov.vn`;
      } else if (type === 'HOUSEHOLD') {
        name = `${pick(['Nhà sách', 'Cửa hàng VPP', 'Đại lý VPP', 'Photocopy'])} ${pick(COMPANY_CORE)}`;
        email = `${unaccent(name).toLowerCase().replace(/[^a-z]/g, '')}${idx}@gmail.com`;
      } else {
        name = p.name;
        email = `${unaccent(p.name).toLowerCase().replace(/[^a-z]/g, '')}${idx}@gmail.com`;
      }
      const contact = type === 'INDIVIDUAL' ? p.name : `${p.male ? 'Anh' : 'Chị'} ${p.name} (${pick(['Hành chính', 'Kế toán', 'Mua hàng', 'Văn thư', 'Chủ cửa hàng'])})`;
      rows.push({
        code: `KH${pad(idx, 4)}`,
        name,
        phone: type === 'INDIVIDUAL' || type === 'HOUSEHOLD' ? `09${pad(12000000 + idx * 4931, 8)}` : `024${pad(30000000 + idx * 1777, 8)}`,
        taxCode: type === 'INDIVIDUAL' ? null : `01${pad(5000000 + idx * 6151, 8)}`,
        address: a.full,
        deliveryAddress: chance(0.6) ? `${pick(['Kho', 'Phòng Hành chính', 'Văn phòng', 'Bộ phận lễ tân'])} - ${a.full}` : a.full,
        customerType: type,
        source: weighted([['SELF_FOUND', 40], ['REFERRAL', 25], ['SOCIAL', 15], ['EXHIBITION', 10], ['OTHER', 10]]),
        contactPerson: contact,
        email,
        notes: pick([
          'Đặt hàng định kỳ đầu tháng',
          'Ưu tiên giao buổi sáng',
          'Yêu cầu xuất hóa đơn VAT đầy đủ',
          'Khách hàng tiềm năng, cần chăm sóc thêm',
          'Thanh toán chuyển khoản sau 30 ngày',
          'Nhu cầu lớn giấy in A4 và bút viết',
          ''
        ]) || null,
        managerId: pick(salesPool).id,
        status: weighted([['ACTIVE', 90], ['INACTIVE', 10]]),
        creditLimit: pick([30000000, 50000000, 80000000, 100000000, 150000000]),
        maxDebtDays: pick([15, 30, 45, 60]),
        createdAt: randDate(new Date('2025-08-01'), NOW)
      });
    }
    await prisma.customer.createMany({ data: rows, skipDuplicates: true });
    console.log(`✓ Khách hàng: +${rows.length}`);
  } else console.log('• Khách hàng: đã có, bỏ qua');
  const customers = await prisma.customer.findMany();
  const activeCustomers = customers.filter((c) => c.status === 'ACTIVE');

  const buildItems = () => {
    const n = int(1, 5);
    const chosen = [...products].sort(() => rand() - 0.5).slice(0, n);
    return chosen.map((p) => {
      const unitPrice = Number(p.sellingPrice);
      const quantity = unitPrice > 2000000 ? int(1, 5) : unitPrice > 300000 ? int(2, 20) : int(10, 300);
      const amount = unitPrice * quantity;
      const total = Math.round(amount * (1 + p.vatRate / 100));
      return { productId: p.id, productCode: p.code, productName: p.name, unit: p.unit, quantity, unitPrice, amount, vatRate: p.vatRate, total };
    });
  };
  const sumItems = (items: { amount: number; total: number }[]) => {
    const subtotal = items.reduce((s, x) => s + x.amount, 0);
    const totalAmount = items.reduce((s, x) => s + x.total, 0);
    return { subtotal, vatAmount: totalAmount - subtotal, totalAmount };
  };

  // =====================================================================
  // 10. BÁO GIÁ (+200)
  // =====================================================================
  const qCount = await prisma.quotation.count();
  if (qCount < 50) {
    for (let i = 0; i < 200; i++) {
      const idx = qCount + 1 + i;
      const c = pick(activeCustomers);
      const date = randDate();
      const items = buildItems();
      const sums = sumItems(items);
      const status = weighted([['CONFIRMED', 40], ['SENT', 20], ['NEGOTIATING', 15], ['DRAFT', 15], ['CANCELLED', 10]]);
      await prisma.quotation.create({
        data: {
          code: `BG-2026-${pad(idx, 4)}`,
          customerId: c.id,
          managerId: c.managerId || pick(salesPool).id,
          date,
          validUntil: addDays(date, pick([15, 30, 45])),
          status,
          ...sums,
          vatRate: items.some((x) => x.vatRate === 10) ? 10 : 8,
          notes: pick([
            `Báo giá cung ứng VPP định kỳ cho ${c.name}`,
            'Báo giá theo yêu cầu, đã bao gồm phí vận chuyển nội thành',
            'Giá áp dụng cho đơn hàng số lượng lớn',
            'Báo giá thiết bị văn phòng kèm bảo hành 12 tháng',
            'Khách hàng yêu cầu điều chỉnh số lượng trước khi chốt'
          ]),
          createdAt: date,
          items: { create: items }
        }
      });
    }
    console.log('✓ Báo giá: +200');
  } else console.log('• Báo giá: đã có, bỏ qua');

  // =====================================================================
  // 11. ĐƠN HÀNG (+250) - một phần chuyển từ báo giá đã chốt
  // =====================================================================
  const oCount = await prisma.order.count();
  if (oCount < 50) {
    const confirmedQ = await prisma.quotation.findMany({
      where: { status: 'CONFIRMED', orders: { none: {} } },
      include: { items: true, customer: true }
    });
    let qi = 0;
    for (let i = 0; i < 250; i++) {
      const idx = oCount + 1 + i;
      const fromQ = qi < confirmedQ.length && chance(0.4) ? confirmedQ[qi++] : null;
      const c = fromQ ? fromQ.customer : pick(activeCustomers);
      const items = fromQ
        ? fromQ.items.map((x) => ({
            productId: x.productId,
            productCode: x.productCode,
            productName: x.productName,
            unit: x.unit,
            quantity: x.quantity,
            unitPrice: Number(x.unitPrice),
            amount: Number(x.amount),
            vatRate: x.vatRate,
            total: Number(x.total)
          }))
        : buildItems();
      const sums = sumItems(items);
      const orderDate = fromQ ? minDate(addDays(fromQ.date, int(0, 5)), NOW) : randDate();
      const ageDays = (NOW.getTime() - orderDate.getTime()) / 86400000;
      const deliveryStatus =
        ageDays > 20
          ? weighted([['DELIVERED', 85], ['CANCELLED', 8], ['PARTIAL', 7]])
          : weighted([['PENDING', 30], ['DELIVERING', 30], ['PARTIAL', 10], ['DELIVERED', 25], ['CANCELLED', 5]]);
      let paymentStatus = 'UNPAID';
      let paidAmount = 0;
      if (deliveryStatus !== 'CANCELLED') {
        paymentStatus =
          deliveryStatus === 'DELIVERED'
            ? weighted([['PAID', 60], ['PARTIAL_PAID', 25], ['UNPAID', 15]])
            : weighted([['UNPAID', 55], ['PARTIAL_PAID', 30], ['PAID', 15]]);
        paidAmount =
          paymentStatus === 'PAID' ? sums.totalAmount : paymentStatus === 'PARTIAL_PAID' ? round1000(sums.totalAmount * (0.3 + rand() * 0.5)) : 0;
      }
      const remainingAmount = deliveryStatus === 'CANCELLED' ? 0 : sums.totalAmount - paidAmount;
      const invoiceStatus =
        deliveryStatus === 'CANCELLED' ? 'NOT_ISSUED' : deliveryStatus === 'DELIVERED' ? weighted([['ISSUED', 80], ['ISSUING', 10], ['NOT_ISSUED', 10]]) : weighted([['NOT_ISSUED', 70], ['ISSUING', 30]]);
      await prisma.order.create({
        data: {
          code: `DH-2026-${pad(idx, 4)}`,
          customerId: c.id,
          quotationId: fromQ?.id || null,
          managerId: c.managerId || pick(salesPool).id,
          orderDate,
          deliveryDate: addDays(orderDate, int(1, 7)),
          deliveryAddress: c.deliveryAddress || c.address,
          contactPerson: c.contactPerson,
          phone: c.phone,
          deliveryStatus,
          paymentStatus,
          invoiceStatus,
          ...sums,
          vatRate: items.some((x) => x.vatRate === 10) ? 10 : 8,
          paidAmount,
          remainingAmount,
          notes:
            deliveryStatus === 'CANCELLED'
              ? 'Khách hàng hủy đơn do thay đổi kế hoạch mua sắm'
              : pick(['Giao hàng giờ hành chính', 'Gọi trước khi giao 30 phút', 'Xuất hóa đơn VAT theo thông tin công ty', 'Giao tại kho, có xe nâng hỗ trợ', 'Đơn hàng định kỳ tháng', null]),
          createdAt: orderDate,
          items: { create: items }
        }
      });
    }
    console.log('✓ Đơn hàng: +250');
  } else console.log('• Đơn hàng: đã có, bỏ qua');

  // =====================================================================
  // 12. DANH MỤC CHI PHÍ (+100, kèm loại chi phí) & NHÓM KHOẢN THU (+100)
  // =====================================================================
  if (!(await prisma.expenseCategory.findUnique({ where: { code: 'CP-001' } }))) {
    const groups: { name: string; types: string[] }[] = [
      { name: 'Chi phí Văn phòng', types: ['Văn phòng phẩm nội bộ', 'Sửa chữa thiết bị', 'Phí vệ sinh tòa nhà'] },
      { name: 'Chi phí Vận chuyển', types: ['Xăng xe giao hàng', 'Thuê xe tải ngoài', 'Phí cầu đường & bến bãi'] },
      { name: 'Chi phí Marketing', types: ['Quảng cáo Facebook/Google', 'In ấn catalogue', 'Hội chợ triển lãm'] },
      { name: 'Chi phí Nhân sự', types: ['Thưởng doanh số', 'Công tác phí', 'Đào tạo nội bộ'] },
      { name: 'Chi phí Kho bãi', types: ['Thuê kho', 'Bốc xếp hàng hóa', 'Pallet & kệ kho'] },
      { name: 'Chi phí Tài chính', types: ['Phí ngân hàng', 'Lãi vay ngắn hạn', 'Phí chuyển tiền'] },
      { name: 'Chi phí Tiếp khách', types: ['Ăn uống đối tác', 'Quà tặng khách hàng', 'Hội nghị khách hàng'] },
      { name: 'Chi phí CNTT', types: ['Phần mềm bản quyền', 'Hosting & tên miền', 'Thiết bị mạng'] },
      { name: 'Chi phí Pháp lý', types: ['Phí công chứng', 'Tư vấn luật', 'Lệ phí giấy phép'] },
      { name: 'Chi phí Khác', types: ['Từ thiện & tài trợ', 'Chi phí phát sinh', 'Bồi thường hàng hỏng'] }
    ];
    const units = ['Trụ sở chính', 'Chi nhánh Hà Nội', 'Chi nhánh TP.HCM', 'Chi nhánh Đà Nẵng', 'Kho Gia Lâm', 'Kho Bình Dương', 'Khối Kinh doanh', 'Khối Kế toán', 'Khối Kho vận', 'Dự án B2B'];
    let tn = 0;
    let n = 0;
    for (const g of groups) {
      for (const u of units) {
        n++;
        const typeNames = [...g.types].sort(() => rand() - 0.5).slice(0, int(1, 2));
        await prisma.expenseCategory.create({
          data: {
            code: `CP-${pad(n, 3)}`,
            name: `${g.name} - ${u}`,
            description: `${g.name} phát sinh tại ${u.toLowerCase()}`,
            status: weighted([['ACTIVE', 92], ['INACTIVE', 8]]),
            createdAt: randDate(new Date('2025-06-01'), NOW),
            types: {
              create: typeNames.map((t) => ({ code: `LCP-${pad(++tn, 3)}`, name: `${t} (${u})`, description: `Hạch toán ${t.toLowerCase()}` }))
            }
          }
        });
      }
    }
    console.log(`✓ Danh mục chi phí: +${n} (kèm ${tn} loại chi phí)`);
  } else console.log('• Danh mục chi phí: đã có, bỏ qua');

  if (!(await prisma.revenueType.findUnique({ where: { code: 'KT-001' } }))) {
    const bases = ['Thu bán hàng VPP', 'Thu bán thiết bị văn phòng', 'Thu dịch vụ in ấn', 'Thu phí vận chuyển', 'Thu tiền đặt cọc', 'Thu hoàn ứng', 'Thu thanh lý tài sản', 'Thu chiết khấu nhà cung cấp', 'Thu lãi tiền gửi', 'Thu khác'];
    const channels = ['Khách doanh nghiệp', 'Trường học', 'Cơ quan nhà nước', 'Đại lý cấp 1', 'Đại lý cấp 2', 'Bán lẻ tại cửa hàng', 'Bán online', 'Dự án B2B', 'Chi nhánh TP.HCM', 'Chi nhánh Đà Nẵng'];
    const rows: any[] = [];
    let n = 0;
    for (const b of bases) {
      for (const ch of channels) {
        n++;
        rows.push({
          code: `KT-${pad(n, 3)}`,
          name: `${b} - ${ch}`,
          description: `${b} từ kênh ${ch.toLowerCase()}`,
          status: weighted([['ACTIVE', 93], ['INACTIVE', 7]]),
          createdAt: randDate(new Date('2025-06-01'), NOW)
        });
      }
    }
    await prisma.revenueType.createMany({ data: rows, skipDuplicates: true });
    console.log(`✓ Nhóm khoản thu: +${rows.length}`);
  } else console.log('• Nhóm khoản thu: đã có, bỏ qua');

  // =====================================================================
  // 13. PHIẾU THU (+200) - gắn với đơn hàng đã thanh toán
  // =====================================================================
  const rvCount = await prisma.receiptVoucher.count();
  if (rvCount < 50) {
    const revTypes = await prisma.revenueType.findMany({ where: { status: 'ACTIVE' } });
    const salesRev = revTypes.filter((t) => t.name.startsWith('Thu bán') || t.code === 'KT-BAN-HANG');
    const paidOrders = await prisma.order.findMany({ where: { paidAmount: { gt: 0 } }, include: { customer: true } });
    for (let i = 0; i < 200; i++) {
      const idx = rvCount + 1 + i;
      const o = paidOrders.length && chance(0.8) ? pick(paidOrders) : null;
      const c = o ? o.customer : pick(activeCustomers);
      const voucherDate = o ? minDate(addDays(o.orderDate, int(0, 20)), NOW) : randDate();
      const status = weighted([['PAID', 65], ['APPROVED', 12], ['PENDING', 15], ['REJECTED', 8]]);
      const approver = pick(accPool);
      await prisma.receiptVoucher.create({
        data: {
          code: `PT-2026-${pad(idx, 4)}`,
          voucherDate,
          typeId: o ? pick(salesRev.length ? salesRev : revTypes).id : pick(revTypes).id,
          payer: c.contactPerson || c.name,
          phone: c.phone,
          address: c.address,
          reason: o ? `Thu tiền thanh toán đơn hàng ${o.code} - ${c.name}` : `Thu tiền đặt cọc / tạm ứng đơn hàng của ${c.name}`,
          amount: o ? Number(o.paidAmount) : round1000(int(2, 40) * 1000000),
          paymentMethod: weighted([['BANK_TRANSFER', 75], ['CASH', 25]]),
          invoiceNumber: chance(0.6) ? `UNC-${pick(['VCB', 'TCB', 'BIDV', 'MB', 'ACB'])}-${int(10000, 99999)}` : null,
          invoiceDate: chance(0.5) ? voucherDate : null,
          status,
          customerId: c.id,
          orderId: o?.id || null,
          createdById: pick(accPool).id,
          approvedById: status === 'PENDING' ? null : approver.id,
          approvedAt: status === 'PENDING' ? null : addDays(voucherDate, int(0, 2)),
          rejectedReason: status === 'REJECTED' ? pick(['Sai thông tin người nộp', 'Chưa nhận được tiền trên sao kê', 'Trùng phiếu thu']) : null,
          notes: status === 'PAID' ? 'Đã đối soát sao kê ngân hàng' : null,
          createdAt: voucherDate
        }
      });
    }
    console.log('✓ Phiếu thu: +200');
  } else console.log('• Phiếu thu: đã có, bỏ qua');

  // =====================================================================
  // 14. PHIẾU CHI (+200)
  // =====================================================================
  const pvCount = await prisma.paymentVoucher.count();
  if (pvCount < 50) {
    const types = await prisma.expenseType.findMany({ include: { category: true } });
    for (let i = 0; i < 200; i++) {
      const idx = pvCount + 1 + i;
      const t = pick(types);
      const voucherDate = randDate();
      const status = weighted([['PAID', 60], ['APPROVED', 15], ['PENDING', 17], ['REJECTED', 8]]);
      const isPerson = chance(0.5);
      const p = personName();
      const sup = pick(suppliers);
      const a = address();
      await prisma.paymentVoucher.create({
        data: {
          code: `PC-2026-${pad(idx, 4)}`,
          voucherDate,
          categoryId: t.categoryId,
          typeId: t.id,
          recipient: isPerson ? `${p.name} (${pick(['Phòng Kinh doanh', 'Đội xe giao hàng', 'Phòng Kế toán', 'Kho Gia Lâm', 'Phòng Hành chính'])})` : sup.name,
          phone: isPerson ? `09${pad(30000000 + int(1, 9999999), 8)}` : sup.phone,
          address: isPerson ? a.full : sup.address,
          reason: `Thanh toán ${t.name.split(' (')[0].toLowerCase()} tháng ${voucherDate.getMonth() + 1}/${voucherDate.getFullYear()}`,
          amount: round1000(int(3, 400) * 100000),
          paymentMethod: weighted([['BANK_TRANSFER', 60], ['CASH', 40]]),
          invoiceNumber: chance(0.6) ? `HD-${pad(int(1, 99999), 7)}` : null,
          invoiceDate: chance(0.5) ? voucherDate : null,
          status,
          createdById: pick(accPool).id,
          approvedById: status === 'PENDING' ? null : pick(accPool).id,
          approvedAt: status === 'PENDING' ? null : addDays(voucherDate, int(0, 2)),
          rejectedReason: status === 'REJECTED' ? pick(['Thiếu chứng từ hóa đơn', 'Vượt định mức chi', 'Sai mục đích chi']) : null,
          notes: status === 'PAID' ? 'Đã xuất quỹ / chuyển khoản' : null,
          createdAt: voucherDate
        }
      });
    }
    console.log('✓ Phiếu chi: +200');
  } else console.log('• Phiếu chi: đã có, bỏ qua');

  // =====================================================================
  // 15. KẾ HOẠCH KINH DOANH (+100)
  // =====================================================================
  if ((await prisma.salesPlan.count()) < 50) {
    const planDepts = allDepts.filter((d) => ['PKD1', 'PKD2', 'KKD'].includes(d.code) || d.name.startsWith('Nhóm'));
    const periods: { type: string; value: string; year: number }[] = [];
    for (const y of [2025, 2026]) {
      for (let m = 1; m <= 12; m++) {
        if (y === 2025 && m < 7) continue;
        if (y === 2026 && m > 12) continue;
        periods.push({ type: 'MONTH', value: `T${pad(m, 2)}/${y}`, year: y });
      }
      for (let q = 1; q <= 4; q++) periods.push({ type: 'QUARTER', value: `Q${q}/${y}`, year: y });
      periods.push({ type: 'YEAR', value: `${y}`, year: y });
    }
    const cats = [
      { category: 'Giấy in văn phòng', unit: 'Ream', price: 85000 },
      { category: 'Bút viết & Mực', unit: 'Hộp', price: 95000 },
      { category: 'File bìa còng & Lưu trữ', unit: 'Cái', price: 65000 },
      { category: 'Dụng cụ văn phòng', unit: 'Cái', price: 75000 },
      { category: 'Thiết bị & Máy văn phòng', unit: 'Cái', price: 650000 }
    ];
    for (let i = 0; i < 100; i++) {
      const per = periods[i % periods.length];
      const d = planDepts[i % planDepts.length];
      const mult = per.type === 'YEAR' ? 12 : per.type === 'QUARTER' ? 3 : 1;
      const done = per.year === 2025 || chance(0.6);
      await prisma.salesPlan.create({
        data: {
          title: `Kế hoạch kinh doanh ${per.type === 'MONTH' ? 'tháng' : per.type === 'QUARTER' ? 'quý' : 'năm'} ${per.value.replace(/^[TQ]/, '')} - ${d.name}`,
          periodType: per.type,
          periodValue: per.value,
          year: per.year,
          departmentId: d.id,
          createdById: d.managerId || admin.id,
          notes: pick(['Tập trung khách hàng doanh nghiệp', 'Đẩy mạnh kênh trường học mùa tựu trường', 'Mở rộng đại lý cấp 2', 'Tăng tỷ trọng thiết bị văn phòng', 'Duy trì khách hàng định kỳ']),
          status: weighted([['ACTIVE', 85], ['INACTIVE', 15]]),
          createdAt: new Date(`${per.year}-${per.type === 'MONTH' ? per.value.slice(1, 3) : '01'}-01T08:00:00+07:00`),
          items: {
            create: cats.map((c) => {
              const targetQuantity = Math.round(int(40, 400) * mult * (c.price > 500000 ? 0.1 : 1));
              const actualQuantity = done ? Math.round(targetQuantity * (0.7 + rand() * 0.45)) : 0;
              return {
                category: c.category,
                unit: c.unit,
                targetQuantity,
                targetRevenue: targetQuantity * c.price,
                actualQuantity,
                actualRevenue: actualQuantity * c.price
              };
            })
          }
        }
      });
    }
    console.log('✓ Kế hoạch kinh doanh: +100');
  } else console.log('• Kế hoạch kinh doanh: đã có, bỏ qua');

  console.log('--- HOÀN THÀNH SEED BỔ SUNG ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed bổ sung:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
