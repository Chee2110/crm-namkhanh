# BẢN ĐẶC TẢ CHỨC NĂNG CHI TIẾT & CHECKLIST TRIỂN KHAI CODE
## HỆ THỐNG QUẢN TRỊ KHÁCH HÀNG & BÁN HÀNG CRM – NAM KHÁNH
*(Tài liệu WBS kỹ thuật, Kiến trúc hệ thống, Công nghệ sử dụng & Checklist kiểm thử dành cho Lập trình viên)*

---

### I. TỔNG QUAN DỰ ÁN & LỘ TRÌNH TRIỂN KHAI 6 SPRINT (ROADMAP)

Hệ thống được bóc tách thành **25 module chức năng** tương ứng với các phân hệ từ tài liệu yêu cầu. Để đảm bảo không bị nghẽn luồng dữ liệu, lộ trình lập trình được chia làm **6 Sprint** theo thứ tự phụ thuộc kiến trúc:

| Sprint | Giai đoạn (Phase) | Trọng tâm kỹ thuật | Module hoàn thành | Tiêu chuẩn đầu ra (Deliverables) |
| :---: | :--- | :--- | :--- | :--- |
| **Sprint 1** | **Phase 1: Foundation & Auth** | Thiết lập DB Schema, RBAC, Core Framework | **A.1 – A.5** (Cơ cấu, User, Role, Quyền, File) | Đăng nhập JWT/SSO, gán quyền, upload file mẫu, cây đơn vị tổ chức |
| **Sprint 2** | **Phase 2: Master Data & Kho** | Cây danh mục hàng hóa 3 cấp, quản lý kho, tính giá | **C.1 – C.7** (Kho, DM, Loại, SP, NCC, Báo cáo) | CRUD hàng hóa hoàn chỉnh, tính giá vốn bình quân, tự sinh NCC |
| **Sprint 3** | **Phase 3: Core CRM & Bán hàng** | Khách hàng 3-pane, Báo giá, Đơn hàng & trừ kho | **B.1, B.3, B.4** (Khách hàng, Báo giá, Đơn hàng) | Layout chia 3 phần, check trùng MST/SĐT, tính công nợ tự động |
| **Sprint 4** | **Phase 4: Thu Chi & Dòng tiền** | Quản lý phiếu thu, phiếu chi, khóa sửa, duyệt | **E.I.1 – E.III.1** (Phiếu chi, Phiếu thu, Báo cáo) | Khóa sửa 'Đã chi'/'Đã thu', override TGĐ, link phiếu thu -> đơn hàng |
| **Sprint 5** | **Phase 5: Kế hoạch & Báo cáo KD** | Báo cáo đa chiều, chỉ tiêu doanh thu - sản lượng | **B.2, B.5, B.6** (Tổng quan KD, Báo cáo KD, Kế hoạch) | Thống kê theo nhân viên/sản phẩm/khách hàng, Kế hoạch vs Thực tế |
| **Sprint 6** | **Phase 6: Dashboard & UAT** | Trang chủ Real-time, Performance tuning, UAT | **F-D1, F-D2** (Dashboard Doanh thu & Lợi nhuận) | Dashboard trang chủ, tối ưu truy vấn, kiểm thử tải và bàn giao |

---

### II. KIẾN TRÚC HỆ THỐNG, CÔNG NGHỆ SỬ DỤNG & CẤU TRÚC DỰ ÁN

#### 1. Mô hình Kiến trúc tổng thể (System Architecture)
Hệ thống CRM Nam Khánh có nghiệp vụ liên kết vòng đời cao (Khách hàng ➔ Báo giá ➔ Đơn hàng ➔ Kho ➔ Thu chi ➔ Báo cáo). Mô hình tối ưu được lựa chọn là **Modular Monolith (Nguyên khối phân tầng)** áp dụng nguyên lý **Clean Architecture / Layered Architecture**:

```
                              ┌───────────────────────────────────┐
                              │     FRONTEND (React SPA / Vite)   │
                              │ - Layout 3 phần (Khách hàng)      │
                              │ - DataGrid kéo thả cột, ẩn/hiện   │
                              │ - Biểu đồ Dashboard (Chart.js)    │
                              │ - Form Validation & In ấn/Xuất file│
                              └─────────────────┬─────────────────┘
                                                │ RESTful API (JSON / HTTPS)
                                                ▼
                              ┌───────────────────────────────────┐
                              │     BACKEND API GATEWAY / CORE    │
                              │       (Node.js + NestJS)          │
                              │ ┌───────────────────────────────┐ │
                              │ │ Auth & RBAC Guard             │ │
                              │ │ (Token, Data-scope Filter)    │ │
                              │ └───────────────┬───────────────┘ │
                              │                 ▼                 │
                              │ ┌───────────────────────────────┐ │
                              │ │ Modules nghiệp vụ:            │ │
                              │ │ • Module Hệ thống & Users     │ │
                              │ │ • Module Kho & Hàng hóa       │ │
                              │ │ • Module Khách hàng & Orders  │ │
                              │ │ • Module Thu - Chi & Duyệt    │ │
                              │ │ • Module Dashboard & Báo cáo  │ │
                              │ └───────────────┬───────────────┘ │
                              └─────────────────┼─────────────────┘
                                                │ ORM (Prisma / TypeORM)
                        ┌───────────────────────┴───────────────────────┐
                        ▼                                               ▼
             ┌─────────────────────┐                         ┌─────────────────────┐
             │ PostgreSQL Database │                         │     Redis Cache     │
             │ (Lưu trữ quan hệ,   │                         │ (Cache Dashboard,   │
             │  ACID, Audit Logs)  │                         │  Khóa phân tán)     │
             └─────────────────────┘                         └─────────────────────┘
```

#### 2. Ngăn xếp Công nghệ sử dụng (Technology Stack Specification)

| Tầng hệ thống | Công nghệ lựa chọn | Phiên bản | Vai trò & Lý do lựa chọn |
| :--- | :--- | :---: | :--- |
| **Backend Core** | **Node.js + NestJS** | 10.x+ | Framework doanh nghiệp số 1 cho Node.js, kiến trúc Module rõ ràng, hỗ trợ Dependency Injection, tự sinh tài liệu Swagger UI chuẩn OpenAPI. |
| **Ngôn ngữ** | **TypeScript** | 5.x+ | Đảm bảo tính toàn vẹn kiểu dữ liệu (Type-safety) 100% từ Frontend đến Backend và Database. |
| **Cơ sở dữ liệu** | **PostgreSQL** | 16.x+ | Hệ quản trị CSDL quan hệ hàng đầu về độ tin cậy giao dịch ACID, hỗ trợ trường `JSONB` lưu thông số kỹ thuật động và audit log, Indexing cực nhanh. |
| **Database ORM** | **Prisma ORM** | 5.x+ | Quản lý Database Migration, tự động sinh Type an toàn, hỗ trợ Transaction xử lý gạch nợ và cập nhật kho tức thời. |
| **Bộ nhớ đệm** | **Redis** | 7.x+ | Caching dữ liệu Dashboard và Báo cáo (TTL 3-5 phút) giúp tải trang chủ dưới 0.5s; Rate limiting chống brute-force đăng nhập. |
| **Frontend Core** | **ReactJS + Vite** | 18.x+ | Nền tảng Single Page Application (SPA) siêu nhanh, tải trang mượt mà, tối ưu trải nghiệm thao tác người dùng văn phòng. |
| **UI Framework** | **Ant Design (AntD)** | 5.x+ | Bộ UI Component doanh nghiệp hoàn hảo: DataGrid phân trang/sắp xếp, Treeview cơ cấu tổ chức, Matrix phân quyền, Drawer xem chi tiết, DatePicker tiếng Việt. |
| **State Management**| **TanStack Query + Zustand** | Latest | `TanStack Query (v5)` quản lý Server State & Caching API; `Zustand` quản lý UI State (User session, Theme, Bộ lọc) siêu nhẹ. |
| **Trực quan hóa** | **Chart.js / react-chartjs-2** | 4.x+ | Vẽ biểu đồ cột doanh thu theo năm/quý/tháng, biểu đồ tròn % danh mục hàng hóa, biểu đồ phân bổ dòng tiền thu/chi. |
| **Xử lý File & In** | **SheetJS (xlsx) & react-to-print** | Latest | Xuất/nhập file Excel cho Đơn hàng, Báo giá, Báo cáo công nợ; In ấn trực tiếp Báo giá, Phiếu thu/chi chuẩn khổ A4/A5. |
| **Đóng gói / Deploy**| **Docker & Nginx** | Latest | Đóng gói toàn bộ Backend, Frontend, Postgres, Redis vào `docker-compose.yml` triển khai nhanh chóng trên máy chủ VPS/Cloud. |

---

#### 3. Cấu trúc Thư mục Dự án chuẩn (Project Directory Structure)

Dự án được tổ chức theo cấu trúc chuẩn monorepo tách bạch 2 tầng:

```text
CRM_NAMKHANH/
├── backend/                        # Nguồn mã nguồn Backend (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma           # Định nghĩa 19 bảng CSDL & Quan hệ quan trọng
│   │   └── migrations/             # Lịch sử các phiên bản migration CSDL
│   ├── src/
│   │   ├── common/                 # Thư viện dùng chung toàn Backend
│   │   │   ├── decorators/         # Custom Decorators (@CurrentUser, @Roles)
│   │   │   ├── guards/             # AuthGuard (JWT), RolesGuard (RBAC), DataScopeGuard
│   │   │   ├── filters/            # Global Exception Filter (Bắt lỗi chuẩn HTTP)
│   │   │   ├── interceptors/       # Logging, Transform Response Interceptor
│   │   │   └── utils/              # Helper tính toán tài chính, sinh mã chứng từ tự động
│   │   ├── modules/                # Các phân hệ nghiệp vụ độc lập
│   │   │   ├── auth/               # Đăng nhập, JWT, Refresh Token, Phân quyền
│   │   │   ├── departments/        # A.1: Cơ cấu tổ chức phòng ban (Tree)
│   │   │   ├── users/              # A.2: Quản lý người dùng, hồ sơ, bảo mật lương
│   │   │   ├── roles/              # A.3 & A.4: Danh mục vai trò & Ma trận phân quyền
│   │   │   ├── documents/          # A.5: Hồ sơ giấy tờ (Hợp đồng mẫu, CO-CQ)
│   │   │   ├── warehouses/         # C.2: Quản lý Kho vật lý
│   │   │   ├── categories/         # C.3 & C.4: Danh mục & Loại hàng hóa
│   │   │   ├── products/           # C.5 & C.6: Hàng hóa SKU & Tự động đồng bộ NCC
│   │   │   ├── customers/          # B.1: Khách hàng, check trùng SĐT/MST, bàn giao
│   │   │   ├── quotations/         # B.3: Báo giá, mẫu in, xuất Excel, chuyển thành đơn
│   │   │   ├── orders/             # B.4: Đơn hàng, giao hàng, hóa đơn, trừ tồn kho
│   │   │   ├── sales-plans/        # B.6: Kế hoạch kinh doanh theo kỳ
│   │   │   ├── finances/           # E: Quản lý Khoản chi, Khoản thu, Phiếu thu/chi, Khóa sửa
│   │   │   ├── reports/            # B.5 & C.7 & E.III: Tổng hợp báo cáo đa chiều
│   │   │   └── dashboard/          # F-D1 & F-D2: Dashboard Doanh thu & Lợi nhuận
│   │   ├── app.module.ts           # Root Module
│   │   └── main.ts                 # Điểm khởi động, cấu hình Swagger, CORS, ValidationPipe
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Nguồn mã nguồn Frontend (React + Vite)
│   ├── public/                     # Tài nguyên tĩnh: Logo, mẫu in ấn, icon
│   ├── src/
│   │   ├── assets/                 # Styles, images nội bộ
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── layout/             # Sidebar, Header, Breadcrumbs, UserDropdown
│   │   │   ├── datatable/          # Custom Table hỗ trợ kéo thả đổi cột, ẩn/hiện cột
│   │   │   ├── print-template/     # Mẫu in chuẩn (Báo giá, Phiếu thu, Phiếu chi)
│   │   │   └── charts/             # Component biểu đồ cột, biểu đồ tròn đóng gói sẵn
│   │   ├── pages/                  # Các trang màn hình theo phân hệ
│   │   │   ├── auth/               # Màn hình Đăng nhập, Quên mật khẩu
│   │   │   ├── dashboard/          # Trang chủ Dashboard Doanh thu & Lợi nhuận
│   │   │   ├── system/             # Cơ cấu tổ chức, Người dùng, Vai trò, Phân quyền, Hồ sơ
│   │   │   ├── inventory/          # Tổng quan kho, Kho, Danh mục, Sản phẩm, Nhà cung cấp
│   │   │   ├── sales/              # Khách hàng (Layout 3 phần), Báo giá, Đơn hàng, Kế hoạch
│   │   │   ├── finances/           # Phiếu thu, Phiếu chi, Phê duyệt chi/thu
│   │   │   └── reports/            # Báo cáo doanh số, công nợ, tồn kho, dòng tiền
│   │   ├── services/               # Cấu hình Axios & các hàm gọi API Backend
│   │   ├── stores/                 # Zustand Store (AuthStore, UIStore)
│   │   ├── hooks/                  # Custom Hooks (usePermission, useDebounce...)
│   │   ├── types/                  # TypeScript Data Models đồng bộ với Backend
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml              # Cấu hình chạy Postgres + Redis + Backend + Frontend
└── .env.example                    # File mẫu cấu hình biến môi trường
```

---

#### 4. Nguyên tắc Thiết kế Dữ liệu & Bảo mật cốt lõi

1. **Phân quyền 2 tầng chặt chẽ (2-Tier Security Model):**
   - *Tầng 1 - Quyền chức năng (Menu & Action RBAC):* Kiểm tra vai trò của người dùng có quyền Thêm, Xem, Sửa, Xóa trên phân hệ hay không.
   - *Tầng 2 - Phạm vi dữ liệu (Row-Level Data Scope):*
     - Nhân viên Sales: Chỉ truy vấn bản ghi Khách hàng / Đơn hàng do chính mình phụ trách (`owner_id = current_user.id`).
     - Trưởng phòng: Xem được toàn bộ dữ liệu thuộc phòng ban của mình.
     - Ban Giám đốc: Toàn quyền truy vấn dữ liệu toàn công ty.
2. **Tính bất biến của chứng từ tài chính (Financial Immutability & Audit Trail):**
   - Phiếu chi / Phiếu thu khi đã ở trạng thái `"Đã chi"` / `"Đã thu"` thì **Backend khóa hoàn toàn lệnh UPDATE**.
   - Chỉ duy nhất tài khoản thuộc vai trò **Tổng giám đốc** mới có quyền gọi API mở khóa sửa, và bắt buộc lưu lại lịch sử thay đổi vào bảng `audit_logs` (Lưu ai sửa, thời gian nào, giá trị cũ và mới).
3. **Tính toán số học tập trung ở Backend (Server-side Calculation):**
   - Toàn bộ công thức tính: `Thành tiền = SL x Đơn giá`, `Tổng tiền = Thành tiền + VAT`, `Còn phải thu = Giá trị đơn – Thực thu` **phải do Backend tính toán và ghi nhận**. Frontend chỉ hiển thị tạm thời, tuyệt đối không tin cậy dữ liệu tính toán gửi từ client lên.
4. **Bảo mật dữ liệu lương & thông tin nhạy cảm:**
   - Trường Lương cơ bản và Phụ cấp của nhân viên phải được phân tách quyền truy cập độc lập. Chỉ Admin hệ thống và Ban Giám đốc mới có trường này trong response API.

---

### III. CHECKLIST CHI TIẾT PHÂN HỆ A: HỆ THỐNG & QUẢN TRỊ NỀN TẢNG

#### 1. [A.1] Cơ cấu tổ chức (Department Tree)
- [x] **Frontend UI:**
  - [x] Component hiển thị dạng Cây thư mục (Treeview) phân cấp phòng ban.
  - [x] Modal Thêm mới / Chỉnh sửa đơn vị.
  - [x] Bảng DataGrid: `STT | Hình ảnh | Mã đơn vị | Tên đơn vị | Địa chỉ | Trực thuộc | Trưởng bộ phận | Chức năng nhiệm vụ | Trạng thái`.
  - [x] Bộ lọc nhanh theo Trạng thái (Đang hoạt động, Tạm ngừng hoạt động, Ngừng hoạt động).
- [x] **Backend API:**
  - [x] `GET /api/v1/departments` (Query dạng Tree hoặc Flat list).
  - [x] `POST /api/v1/departments` (Thêm mới đơn vị).
  - [x] `PUT /api/v1/departments/:id` (Cập nhật đơn vị).
  - [x] `DELETE /api/v1/departments/:id` (Xóa đơn vị kèm kiểm tra ràng buộc).
  - [x] Upload logo/hình ảnh phòng ban.
- [x] **Ràng buộc nghiệp vụ (Validation):**
  - [x] Mã đơn vị là DUY NHẤT.
  - [x] Chống vòng lặp phân cấp (Đơn vị con không thể làm cha của đơn vị cha).
  - [x] Chặn xóa đơn vị nếu đang có nhân sự trực thuộc.

#### 2. [A.2] Quản lý Người dùng (User Management)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Ảnh đại diện | Mã người dùng | Họ tên | Ngày sinh | SĐT | Gmail | Đơn vị | Quản lý trực tiếp | Vai trò | Lương cơ bản | Phụ cấp | Trạng thái | Ngày vào công ty`.
  - [x] Form tạo/sửa nhân viên chia theo khối: Thông tin cá nhân, Hợp đồng làm việc, Mức lương & Phụ cấp.
  - [x] Cơ chế ẩn/hiện cột Lương cơ bản & Phụ cấp dựa trên quyền tài khoản đăng nhập.
- [x] **Backend API:**
  - [x] `GET /api/v1/users` (Phân trang, tìm kiếm họ tên, email, lọc theo phòng ban, vai trò).
  - [x] `POST /api/v1/users` (Tạo tài khoản + băm mật khẩu + gán vai trò).
  - [x] `PUT /api/v1/users/:id` (Cập nhật hồ sơ).
  - [x] `PATCH /api/v1/users/:id/status` (Đổi trạng thái: Đang làm việc / Ngừng làm việc).
  - [x] Upload ảnh đại diện (Avatar).
- [x] **Ràng buộc nghiệp vụ (Validation):**
  - [x] Mã người dùng, SĐT, Gmail là DUY NHẤT toàn hệ thống.
  - [x] Gmail chuẩn định dạng, hỗ trợ liên kết SSO Google Workspace (Đã tích hợp API SSO & modal đăng nhập 1-click).
  - [x] BẢO MẬT: Trường Lương & Phụ cấp phải được phân quyền riêng biệt, mã hóa trong CSDL, chỉ Giám đốc/HR xem được.
  - [x] Khi nhân viên "Ngừng làm việc": Khóa quyền đăng nhập nhưng tuyệt đối KHÔNG xóa cứng trong CSDL để giữ lịch sử giao dịch.

#### 3. [A.3] Danh mục Vai trò (Role Management)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Mã vai trò | Tên vai trò | Mô tả vai trò | Ngày tạo`.
  - [x] Form thêm/sửa Vai trò.
  - [x] Nút điều hướng sang Ma trận phân quyền.
- [x] **Backend API:**
  - [x] `GET /api/v1/roles` (Danh sách vai trò).
  - [x] `POST /api/v1/roles` (Tạo vai trò mới).
  - [x] `PUT /api/v1/roles/:id` (Sửa thông tin vai trò).
  - [x] `DELETE /api/v1/roles/:id` (Xóa vai trò không mặc định).
- [x] **Ràng buộc nghiệp vụ:**
  - [x] Mã vai trò duy nhất (ADMIN, CEO, SALES_DIR, SALES, ACCOUNTANT, WAREHOUSE).
  - [x] Không cho xóa các vai trò hệ thống cốt lõi.

#### 4. [A.4] Phân quyền dữ liệu & Chức năng (RBAC & Data Scope)
- [x] **Frontend UI:**
  - [x] Giao diện Ma trận phân quyền (Matrix Table):
    - Dòng: Danh sách các phân hệ/chức năng con.
    - Cột: 4 quyền [Thêm] [Xem] [Sửa] [Xóa].
  - [x] Tích chọn/Bỏ chọn checkbox tức thời.
  - [x] Nút 'Chọn tất cả' / 'Bỏ chọn tất cả'.
- [x] **Backend API:**
  - [x] `GET /api/v1/roles/:id/permissions` (Lấy danh sách quyền của vai trò).
  - [x] `PUT /api/v1/roles/:id/permissions` (Cập nhật quyền hàng loạt).
  - [x] Middleware xác thực quyền (Authorization Guard) kiểm tra token trước khi thực thi API.
- [x] **Ràng buộc nghiệp vụ (Validation):**
  - [x] Quyền chức năng: Kiểm tra 4 hành động CRUD.
  - [x] Phạm vi dữ liệu (Data Scope):
    - Nhân viên kinh doanh: Chỉ xem/sửa khách hàng & đơn hàng do mình phụ trách.
    - Trưởng phòng: Xem toàn bộ dữ liệu của nhân viên trong phòng ban mình quản lý.
    - Ban giám đốc: Xem toàn bộ dữ liệu công ty.

#### 5. [A.5] Hồ sơ giấy tờ (Templates & Legal Documents)
- [x] **Frontend UI:**
  - [x] Tab 1 - Hợp đồng mẫu: `STT | Ngày tạo | Mã tài liệu | Tên tài liệu | File tài liệu | Tải về / Xem trước`.
  - [x] Tab 2 - Chứng chỉ CO-CQ & Năng lực: `STT | Ngày tạo | Mã chứng chỉ | Tên chứng chỉ | File chứng chỉ | File hồ sơ đính kèm`.
  - [x] Modal Upload file tài liệu.
- [x] **Backend API:**
  - [x] `GET /api/v1/documents?type=contract|cert` (Danh sách tài liệu).
  - [x] `POST /api/v1/documents` (Upload file + lưu metadata).
  - [x] `DELETE /api/v1/documents/:id` (Xóa tài liệu).
  - [x] `GET /api/v1/documents/:id/download` (Download an toàn).
- [x] **Ràng buộc nghiệp vụ:**
  - [x] Giới hạn file tải lên tối đa 25MB, định dạng: PDF, DOC, DOCX, XLSX, JPG, PNG.

---

### IV. CHECKLIST CHI TIẾT PHÂN HỆ C: KHO & HÀNG HÓA

#### 1. [C.1] Tổng quan kho (Inventory Dashboard)
- [x] **Frontend UI:**
  - [x] 4 Thẻ chỉ số KPI đầu trang:
    - [x] Tổng số lượng sản phẩm tồn
    - [x] Tổng số danh mục sản phẩm
    - [x] Tổng số loại sản phẩm
    - [x] Tổng giá trị tồn kho (VNĐ)
  - [x] Biểu đồ cơ cấu giá trị tồn kho theo danh mục.
  - [x] Bảng tóm tắt: `STT | Mã | Tên | Số lượng | Giá trị tồn kho`.
- [x] **Backend API:**
  - [x] `GET /api/v1/inventory/overview` (Tổng hợp 4 thẻ KPI và dữ liệu biểu đồ).
- [x] **Ràng buộc nghiệp vụ:**
  - [x] Giá trị tồn kho = Σ (Số lượng tồn x Giá nhập bình quân).

#### 2. [C.2] Quản lý Kho vật lý (Warehouses)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Ảnh | Mã kho | Tên kho | Địa chỉ kho | Đơn vị quản lý | Ngày tạo`.
  - [x] Form thêm/sửa Kho.
- [x] **Backend API:**
  - [x] `GET /api/v1/warehouses`
  - [x] `POST /api/v1/warehouses`
  - [x] `PUT /api/v1/warehouses/:id`
  - [x] `DELETE /api/v1/warehouses/:id`
- [x] **Ràng buộc:** Mã kho duy nhất; Đơn vị quản lý liên kết bảng Đơn vị (A.1); Không xóa kho khi đang có hàng.

#### 3. [C.3] Danh mục hàng hóa (Categories - Cấp 1)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Ảnh | Mã danh mục | Tên danh mục | Thuộc kho | Ngày tạo`.
  - [x] Form thêm/sửa Danh mục (Dropdown chọn Thuộc kho).
- [x] **Backend API:**
  - [x] `GET /api/v1/categories?warehouseId=`
  - [x] `POST /api/v1/categories`
  - [x] `PUT /api/v1/categories/:id`
  - [x] `DELETE /api/v1/categories/:id`
- [x] **Ràng buộc:** Mã DM duy nhất; Không xóa danh mục nếu còn Loại hàng con.

#### 4. [C.4] Loại hàng hóa (Product Types - Cấp 2)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Ảnh | Mã loại | Tên loại | Thuộc danh mục | Ngày tạo`.
  - [x] Form thêm/sửa Loại hàng (Chọn Kho -> Chọn Danh mục tương ứng).
- [x] **Backend API:**
  - [x] `GET /api/v1/product-types?categoryId=`
  - [x] `POST /api/v1/product-types`
  - [x] `PUT /api/v1/product-types/:id`
  - [x] `DELETE /api/v1/product-types/:id`
- [x] **Ràng buộc:** Mã loại duy nhất; Là đơn vị phân loại dùng trong Kế hoạch KD (B.6).

#### 5. [C.5] Quản lý Hàng hóa chi tiết (Products / SKU Master)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Ảnh | Mã hàng hóa | Tên hàng hóa | Loại | Danh mục | Kho | ĐVT chính | Giá bán | Thuế VAT`.
  - [x] Thanh cấu hình Ẩn/Hiện cột (Màu sắc, Dài, Rộng, Cao, Trọng lượng, Giá nhập).
  - [x] Form Thêm/Sửa Hàng hóa với 4 khối dữ liệu:
    - [x] Thông tin chung: Mã, Tên, ĐVT, Loại hàng, Danh mục, Kho.
    - [x] Nguồn gốc & NCC: Tên nhà cung cấp, Địa chỉ, Số điện thoại.
    - [x] Thông tin giá: Giá nhập, Giá bán, Thuế VAT (%).
    - [x] Thông số khác: Màu sắc, Dài (mm), Rộng (mm), Cao (mm), Trọng lượng (kg), Mô tả.
- [x] **Backend API:**
  - [x] `GET /api/v1/products` (Phân trang, search text, lọc đa chiều).
  - [x] `POST /api/v1/products` (Transaction: lưu hàng hóa + tự động tạo NCC).
  - [x] `PUT /api/v1/products/:id`
  - [x] `DELETE /api/v1/products/:id`
  - [x] Upload ảnh sản phẩm.
- [x] **RÀNG BUỘC NGHIỆP VỤ TỰ ĐỘNG CỰC KỲ QUAN TRỌNG:**
  - [x] Khi tạo Hàng hóa, hệ thống tự động kiểm tra Tên nhà cung cấp: Nếu chưa có trong hệ thống thì **TỰ ĐỘNG TẠO MỚI** bản ghi vào bảng Nhà cung cấp (C.6).

#### 6. [C.6] Danh sách Nhà cung cấp (Suppliers Directory)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Tên nhà cung cấp | Địa chỉ | Số điện thoại`.
  - [x] Modal xem danh sách các sản phẩm do NCC này cung ứng.
- [x] **Backend API:**
  - [x] `GET /api/v1/suppliers`
  - [x] `POST /api/v1/suppliers`
  - [x] `PUT /api/v1/suppliers/:id`
  - [x] `GET /api/v1/suppliers/:id/products`
- [x] **Ràng buộc:** Đồng bộ 2 chiều (tự động thêm từ C.5 và cho phép quản trị trực tiếp tại C.6).

#### 7. [C.7] Báo cáo tồn kho (Inventory Reports)
- [x] **Frontend UI:**
  - [x] Tabs chuyển 3 chiều xem: Theo Danh mục / Theo Loại / Theo Chi tiết hàng hóa.
  - [x] Bảng số liệu: `STT | Mã | Tên | ĐVT | Số lượng tồn | Giá nhập bình quân | Giá trị tồn | Tỷ lệ %`.
  - [x] Biểu đồ Doughnut tỷ trọng giá trị tồn.
  - [x] Nút Xuất Excel báo cáo tồn kho.
- [x] **Backend API:**
  - [x] `GET /api/v1/reports/inventory?view=category|type|product`
  - [x] `GET /api/v1/reports/inventory/export-excel`
- [x] **Công thức tính:**
  - [x] Giá trị tồn = Số lượng x Giá nhập bình quân gia quyền.
  - [x] Tỷ lệ % = Giá trị mục / Tổng giá trị kho.

---

### V. CHECKLIST CHI TIẾT PHÂN HỆ B: KINH DOANH & BÁN HÀNG

#### 1. [B.1] Quản lý Khách hàng (Customers & Handover)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Người quản lý | Mã KH | Tên KH | Điện thoại | Địa chỉ | MST | Loại KH | Nguồn gốc | Bàn giao | Ghi chú`.
  - [x] Tính năng kéo thả tùy biến thứ tự các cột trên bảng (HTML5 Drag & Drop, lưu LocalStorage).
  - [x] Nút thao tác Bàn giao khách hàng (Chọn nhân sự nhận + nhập lý do).
  - [x] Modal Lịch sử bàn giao khách hàng (Audit Timeline).
  - [x] **GIAO DIỆN ĐẶC THÙ CHIA 3 PHẦN KHI CLICK VÀO 1 KHÁCH HÀNG:**
    - [x] Cột trái (30%): Thông tin chi tiết khách hàng, Mã số thuế, Người liên hệ, Địa chỉ giao hàng.
    - [x] Cột giữa (45%): Lịch sử giao dịch theo thời gian (Danh sách Báo giá, Đơn hàng, Phiếu thu).
    - [x] Cột phải (25%): Thẻ tổng quan công nợ, Doanh số mua tích lũy, Đơn hàng gần nhất & Ghi chú chăm sóc.
- [x] **Backend API:**
  - [x] `GET /api/v1/customers` (Phân trang, search, lọc theo Người quản lý, Loại KH, Nguồn).
  - [x] `POST /api/v1/customers` (Kiểm tra trùng lặp SĐT & MST trước khi lưu).
  - [x] `PUT /api/v1/customers/:id`
  - [x] `POST /api/v1/customers/:id/handover` (Chuyển quyền sở hữu + lưu audit log).
  - [x] `GET /api/v1/customers/:id/timeline` (Lịch sử giao dịch).
- [x] **Ràng buộc nghiệp vụ (Validation):**
  - [x] **CHECK TRÙNG LẶP REAL-TIME:** Báo lỗi ngay lập tức nếu Số điện thoại hoặc Mã số thuế đã tồn tại trong CSDL.
  - [x] Người quản lý: Tự động gán tài khoản tạo bản ghi. Khi bàn giao, cập nhật Người quản lý mới và ghi vết lịch sử.
  - [x] Loại khách hàng: Doanh nghiệp, Hộ kinh doanh, Tổ chức, Cá nhân.
  - [x] Nguồn gốc: Tự tìm kiếm, Được giới thiệu, Mạng xã hội, Triển lãm (cho phép thêm mới).

#### 2. [B.2] Doanh thu & Sản lượng (Sales Overview)
- [x] **Frontend UI:**
  - [x] Bộ chọn kỳ: Năm nay / Quý này / Tháng này.
  - [x] Khối Doanh thu:
    - [x] Hiển thị Tổng số tiền doanh thu.
    - [x] Biểu đồ tròn: Tỷ lệ % doanh thu theo danh mục hàng hóa.
    - [x] Biểu đồ cột: Biến động doanh thu theo thời gian.
  - [x] Bảng DS Khách hàng giao dịch: `Tên công ty | Người liên hệ | Số điện thoại | Người phụ trách`.
  - [x] Khối Giao dịch: `Đơn hàng gần nhất (ngày/mã) | Số lượng đơn hàng | Tổng giá trị giao dịch`.
  - [x] Khối Sản lượng: Bảng (`STT | Mã DM | Tên DM | Số lượng | Tỷ lệ %`) + Biểu đồ tròn tỷ trọng sản lượng.
- [x] **Backend API:**
  - [x] `GET /api/v1/sales-overview?period=year|quarter|month`
- [x] **Ràng buộc:** Tính toán tổng hợp real-time từ các đơn hàng hợp lệ.

#### 3. [B.3] Quản lý Báo giá (Quotations)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Ngày báo giá | Số báo giá | Người phụ trách | Tên khách hàng | Số điện thoại | Giá trị | Tình trạng`.
  - [x] Form tạo Báo giá:
    - [x] Thông tin chung: Chọn KH (hỗ trợ tạo nhanh KH mới), Người liên hệ, SĐT, MST, Địa chỉ, Ngày báo giá, Tình trạng.
    - [x] Bảng Hàng hóa: Chọn sản phẩm (tự điền ĐVT, Đơn giá), Số lượng, Thành tiền, Thuế suất (%), Tổng tiền.
    - [x] Dòng chốt Tổng cộng giá trị báo giá.
  - [x] Thao tác: In báo giá, Xem mẫu báo giá, Xuất file Excel.
  - [x] **POPUP/MODAL CHI TIẾT KHI CLICK DÒNG BÁO GIÁ:**
    - [x] Khối Thông tin chung: Tên KH, SĐT, Người phụ trách, Ngày báo giá, Số báo giá.
    - [x] Khối Bảng hàng hóa: STT, Tên hàng hóa, ĐVT, Số lượng, Giá trị, Tổng giá trị.
  - [x] Nút "Tạo Đơn hàng từ Báo giá" (khi trạng thái Đã chốt).
- [x] **Backend API:**
  - [x] `GET /api/v1/quotations`
  - [x] `POST /api/v1/quotations`
  - [x] `PUT /api/v1/quotations/:id`
  - [x] `PATCH /api/v1/quotations/:id/status` (Bản thảo -> Đang đàm phán -> Đã gửi -> Đã chốt).
  - [x] `POST /api/v1/quotations/:id/convert-to-order`
  - [x] `GET /api/v1/quotations/:id/export-excel` (Client-side & API export)
  - [x] `GET /api/v1/quotations/:id/print` (Modal A4 print preview)
- [x] **Ràng buộc:** Số báo giá tự sinh duy nhất; Thành tiền = SL x Đơn giá; Tổng tiền = Thành tiền + Tiền thuế VAT.

#### 4. [B.4] Quản lý Đơn hàng (Orders & Fulfillment)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `Ngày đặt | Người phụ trách | Số đơn hàng | Tên khách hàng | Tình trạng | Tình trạng thanh toán | Giá trị đơn hàng | Thực thu | Còn phải thu | Hóa đơn`.
  - [x] Tùy chọn Ẩn/Hiện cột linh hoạt.
  - [x] Form tạo Đơn hàng:
    - [x] Thông tin chung: Số đơn hàng, Khách hàng, Địa chỉ giao hàng, SĐT, MST, Người liên hệ, Ngày đặt, Ngày giao.
    - [x] Bảng chi tiết hàng hóa (Mã, Tên, SL, ĐVT, Đơn giá, Thành tiền, VAT, Tổng tiền).
    - [x] Khối trạng thái: Tình trạng giao hàng, Tình trạng thanh toán, Thực thu, Còn phải thu, Xuất hóa đơn.
  - [x] Thao tác Bàn giao đơn hàng & Lịch sử bàn giao.
  - [x] **POPUP/MODAL CHI TIẾT KHI CLICK DÒNG ĐƠN HÀNG:**
    - [x] Thông tin chung: Tên KH, SĐT, Người phụ trách, Ngày đặt hàng, Số đơn hàng.
    - [x] Bảng hàng hóa: STT, Tên hàng, ĐVT, Số lượng, Giá trị, Tổng giá trị đơn hàng.
- [x] **Backend API:**
  - [x] `GET /api/v1/orders`
  - [x] `POST /api/v1/orders`
  - [x] `PUT /api/v1/orders/:id`
  - [x] `PATCH /api/v1/orders/:id/handover`
  - [x] Event trừ tồn kho khi đơn hàng chuyển sang trạng thái "Đã giao hàng".
- [x] **RÀNG BUỘC NGHIỆP VỤ CÔNG NỢ TỰ ĐỘNG:**
  - [x] `Còn phải thu = Giá trị đơn hàng – Thực thu` (Hệ thống tự tính, KHÔNG CHO PHÉP NHẬP TAY).
  - [x] Thực thu tự động cập nhật khi có Phiếu thu (E.II.2) liên kết thanh toán cho đơn hàng này.
  - [x] Trạng thái giao: Chưa giao, Đã giao một phần, Đang giao, Đã giao hàng.
  - [x] Trạng thái thanh toán: Chưa thanh toán, Thanh toán một phần, Đã thanh toán.
  - [x] Trạng thái hóa đơn: Chưa xuất, Đang xuất, Đã xuất.

#### 5. [B.5] Báo cáo Kinh doanh & Công nợ (Sales & AR Reports)
- [x] **Frontend UI:**
  - [x] **Tab 5.1: Báo cáo Sản lượng & Doanh thu:**
    - [x] Bộ lọc theo: Danh mục / Loại hàng hóa / Chi tiết hàng hóa.
    - [x] Bộ lọc theo Nhân viên kinh doanh.
    - [x] Bảng: `STT | Mã | Tên | Số lượng bán | Doanh thu | Tỷ lệ %`.
  - [x] **Tab 5.2: Báo cáo Công nợ:**
    - [x] Bộ lọc theo: Tổng công nợ / Theo khách hàng / Theo nhân viên.
    - [x] Bảng: `STT | Mã | Tên | Tổng giá trị mua sau thuế | Đã trả (Thực thu) | Còn Nợ (Còn phải thu)`.
  - [x] Xuất file Excel báo cáo.
- [x] **Backend API:**
  - [x] `GET /api/v1/reports/sales-revenue`
  - [x] `GET /api/v1/reports/debts`
  - [x] `GET /api/v1/reports/debts/export-excel`

#### 6. [B.6] Lập kế hoạch kinh doanh (Sales Planning)
- [x] **Frontend UI:**
  - [x] Form lập kế hoạch: Ngày tháng lập, Mã NV, Họ tên người lập (tự lấy theo user đăng nhập), Đơn vị phòng ban, Chọn Kỳ kế hoạch (Tháng/Quý/Năm).
  - [x] Bảng chỉ tiêu: `STT | Mã loại hàng hóa | Tên loại hàng hóa | ĐVT | Số lượng kế hoạch | Doanh thu kế hoạch`.
  - [x] Dòng Tổng cộng kế hoạch.
  - [x] Màn hình đối chiếu Kế hoạch vs Kết quả thực tế (% Hoàn thành chỉ tiêu).
- [x] **Backend API:**
  - [x] `GET /api/v1/sales-plans`
  - [x] `POST /api/v1/sales-plans`
  - [x] `GET /api/v1/sales-plans/compare`

---

### VI. CHECKLIST CHI TIẾT PHÂN HỆ E: QUẢN LÝ THU CHI & TÀI CHÍNH

#### 1. [E.I.1] Danh mục & Loại chi phí (Expense Classification)
- [x] **Frontend UI:**
  - [x] Tab 1: Danh mục chi phí (`STT | Mã DM | Tên DM | Nội dung`).
  - [x] Tab 2: Loại chi phí (`STT | Mã loại | Tên loại | Thuộc danh mục | Nội dung`).
- [x] **Backend API:**
  - [x] `GET /api/v1/expense-categories`, `POST /api/v1/expense-categories`
  - [x] `GET /api/v1/expense-types`, `POST /api/v1/expense-types`
- [x] **Ràng buộc:** Cấu trúc phân loại 2 tầng phục vụ gom nhóm báo cáo chi phí.

#### 2. [E.I.2] Lập phiếu chi & Phê duyệt (Payment Vouchers)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Ngày chi | Số phiếu chi | Người nhận tiền | Địa chỉ | Nội dung chi | Số tiền | File chứng từ | Tình trạng`.
  - [x] Form tạo Phiếu chi: Ngày lập, Mã chi phí, Loại chi phí, Người nhận tiền, Địa chỉ, Nội dung, Ngày/Số chứng từ hóa đơn, Số tiền, Upload file hóa đơn.
  - [x] Nút Phê duyệt / Từ chối chi dành cho Quản lý / TGĐ.
  - [x] Xuất file Excel, PDF phiếu chi theo mẫu in chuẩn.
- [x] **Backend API:**
  - [x] `GET /api/v1/payment-vouchers`
  - [x] `POST /api/v1/payment-vouchers`
  - [x] `PATCH /api/v1/payment-vouchers/:id/approve` (Duyệt chi).
  - [x] `POST /api/v1/payment-vouchers/:id/override-edit` (API đặc quyền của TGĐ).
  - [x] `GET /api/v1/payment-vouchers/:id/export-pdf`
- [x] **RÀNG BUỘC BẢO MẬT TUYỆT ĐỐI:**
  - [x] Trạng thái: Đề nghị chi -> Đã duyệt chi -> Từ chối chi -> Đã chi.
  - [x] **KHI TRẠNG THÁI = 'ĐÃ CHI': KHÓA HOÀN TOÀN KHÔNG CHO SỬA.**
  - [x] Chỉ duy nhất Tổng giám đốc mới có quyền mở khóa sửa (và hệ thống bắt buộc lưu Audit Log: ai sửa, ngày giờ, nội dung sửa).

#### 3. [E.II.1] Nhóm loại khoản thu (Revenue Categories)
- [x] **Frontend UI:** Bảng DataGrid: `STT | Mã khoản thu | Tên khoản thu | Nội dung`. Form thêm mới nhóm thu.
- [x] **Backend API:** `GET /api/v1/revenue-types`, `POST /api/v1/revenue-types`.

#### 4. [E.II.2] Lập phiếu thu & Liên kết công nợ (Receipt Vouchers)
- [x] **Frontend UI:**
  - [x] Bảng DataGrid: `STT | Ngày thu | Số phiếu thu | Người nộp tiền | Địa chỉ | Nội dung thu | Số tiền | File chứng từ | Tình trạng`.
  - [x] Form tạo Phiếu thu:
    - [x] Chọn Khách hàng & Chọn Đơn hàng liên kết thanh toán.
    - [x] Ngày lập, Nhóm thu, Người nộp tiền, Địa chỉ, Nội dung, Ngày/Số chứng từ, Số tiền, File đính kèm.
  - [x] Nút Duyệt thu / Từ chối thu.
  - [x] Xuất file Excel / PDF phiếu thu theo mẫu.
- [x] **Backend API:**
  - [x] `GET /api/v1/receipt-vouchers`
  - [x] `POST /api/v1/receipt-vouchers` (Tạo phiếu thu).
  - [x] `PATCH /api/v1/receipt-vouchers/:id/approve` (Duyệt -> Chuyển Đã thu -> Cập nhật Đơn hàng).
  - [x] `POST /api/v1/receipt-vouchers/:id/override-edit` (Chỉ TGĐ).
- [x] **RÀNG BUỘC LIÊN KẾT CÔNG NỢ & BẢO MẬT:**
  - [x] Khi phiếu thu ở trạng thái 'Đã thu' và có liên kết Đơn hàng -> **TỰ ĐỘNG CẬP NHẬT TĂNG THỰC THU** và **GIẢM CÒN PHẢI THU** trên Đơn hàng (B.4).
  - [x] **KHI TRẠNG THÁI = 'ĐÃ THU': KHÓA SỬA HOÀN TOÀN.** Chỉ TGĐ có quyền mở sửa kèm audit log.

#### 5. [E.III.1] Báo cáo Thu - Chi & Dòng tiền (Cashflow Reports)
- [x] **Frontend UI:**
  - [x] Tab Báo cáo khoản thu: Tổng thu theo trạng thái, Tổng thu theo mã khoản thu, Bảng số liệu (`STT | Mã | Tên khoản thu | Số tiền | Tỷ lệ %`), Biểu đồ tròn.
  - [x] Tab Báo cáo khoản chi: Tổng chi theo trạng thái, Tổng chi theo mã chi phí, Bảng số liệu (`STT | Mã | Tên khoản chi | Số tiền | Tỷ lệ %`), Biểu đồ cột/tròn.
  - [x] Đề xuất thêm: Báo cáo dòng tiền ròng (Chênh lệch Thu – Chi) theo kỳ.
- [x] **Backend API:**
  - [x] `GET /api/v1/reports/cashflow/receipts`
  - [x] `GET /api/v1/reports/cashflow/payments`
  - [x] `GET /api/v1/reports/cashflow/net`

---

### VII. CHECKLIST CHI TIẾT DASHBOARD ĐIỀU HÀNH KINH DOANH (TRANG CHỦ)

#### 1. [F-D1] Dashboard Doanh thu & Sản lượng
- [x] **Frontend UI:**
  - [x] 3 Khối thời gian hiển thị:
    - [x] Luỹ kế toàn bộ (Toàn thời gian)
    - [x] Theo Năm hiện tại
    - [x] Theo Tháng hiện tại
  - [x] Biểu đồ trực quan: Cột hoặc Tròn thể hiện cơ cấu theo danh mục sản phẩm.
  - [x] Bảng số liệu chi tiết: `STT | Mã danh mục | Tên danh mục | Sản lượng | Doanh thu | Tỷ lệ %`.
  - [x] Dòng Tổng cộng chốt ở chân bảng.
- [x] **Backend API:**
  - [x] `GET /api/v1/dashboard/revenue-volume?period=all|year|month`
  - [x] Caching dữ liệu (Redis TTL 5 phút) để trang chủ load nhanh dưới 1 giây.

#### 2. [F-D2] Dashboard Lợi nhuận gộp (Profit Dashboard)
- [x] **Frontend UI:**
  - [x] 3 Khối thời gian: Luỹ kế / Năm nay / Tháng này.
  - [x] Biểu đồ tỷ trọng lợi nhuận từng danh mục.
  - [x] Bảng số liệu: `STT | Mã danh mục | Tên danh mục | Lợi nhuận (VNĐ) | Tỷ lệ %`.
  - [x] Dòng Tổng cộng cuối bảng.
  - [x] Cảnh báo màu đỏ nổi bật nếu có danh mục bị âm lợi nhuận.
- [x] **Backend API:**
  - [x] `GET /api/v1/dashboard/profit?period=all|year|month`
- [x] **Công thức tính:** Lợi nhuận = Doanh thu bán – Giá vốn hàng bán (tính theo giá nhập bình quân gia quyền từ kho).

---

### VIII. DANH MỤC 19 BẢNG CƠ SỞ DỮ LIỆU CHUẨN BỊ MIGRATION (DATABASE SCHEMA)

```
1.  departments             -> Quản lý cây phòng ban, cơ cấu tổ chức (A.1)
2.  roles                   -> Danh mục vai trò: Admin, Sales, Kế toán, Kho (A.3)
3.  users                   -> Tài khoản người dùng, lương cơ bản, phụ cấp (A.2)
4.  user_roles              -> Bảng quan hệ Nhiều - Nhiều giữa User và Role
5.  role_permissions       -> Ma trận phân quyền CRUD cho từng chức năng (A.4)
6.  legal_documents         -> Quản lý file hợp đồng mẫu, chứng chỉ CO-CQ (A.5)
7.  warehouses              -> Danh mục kho vật lý (C.2)
8.  product_categories      -> Danh mục sản phẩm cấp 1 thuộc kho (C.3)
9.  product_types           -> Loại sản phẩm cấp 2 thuộc danh mục (C.4)
10. suppliers               -> Danh sách nhà cung cấp (auto-sync từ hàng hóa) (C.6)
11. products                -> Chi tiết hàng hóa, thông số kỹ thuật, giá vốn (C.5)
12. customers               -> Danh sách khách hàng, check trùng MST/SĐT (B.1)
13. customer_handovers      -> Lịch sử bàn giao khách hàng giữa các sales (B.1)
14. quotations              -> Master Báo giá gửi khách hàng (B.3)
15. quotation_items         -> Chi tiết từng mặt hàng trong báo giá (B.3)
16. orders                  -> Master Đơn hàng bán, trạng thái giao & thanh toán (B.4)
17. order_items             -> Chi tiết hàng hóa đơn hàng, trừ kho khi giao (B.4)
18. order_handovers         -> Lịch sử bàn giao đơn hàng (B.4)
19. sales_plans             -> Kế hoạch kinh doanh theo kỳ (B.6)
20. sales_plan_items        -> Chi tiêu doanh thu, sản lượng theo loại hàng (B.6)
21. expense_categories      -> Danh mục chi phí cấp 1 (E.I.1)
22. expense_types           -> Loại chi phí cấp 2 (E.I.1)
23. payment_vouchers        -> Phiếu chi tiền, khóa sửa khi 'Đã chi' (E.I.2)
24. revenue_types           -> Nhóm loại khoản thu (E.II.1)
25. receipt_vouchers        -> Phiếu thu tiền, link đơn hàng, khóa khi 'Đã thu' (E.II.2)
```

---

### IX. ĐẶC TẢ NGHIỆP VỤ CHUYÊN SÂU: HOÀN TIỀN (+/- TIỀN) VÀ CƠ CHẾ TÍNH TOÁN CÔNG NỢ

> [!IMPORTANT]
> **Vấn đề cốt lõi:** Trong tài liệu PDF gốc của khách hàng, vấn đề Hoàn tiền (Refund) và Cộng/Trừ tiền phát sinh **hoàn toàn chưa được đề cập**, và công nợ mới chỉ được định nghĩa ở mức sơ khai: `Còn phải thu = Giá trị đơn hàng – Thực thu`. 
> Dưới đây là đặc tả chuẩn hóa để đội ngũ lập trình xây dựng CSDL và Logic code toàn diện, tránh phải đập đi xây lại hệ thống sau này.

#### 1. Quy trình xử lý Hoàn tiền & Điều chỉnh (+ / -) tiền

##### Tình huống 1: Khách hàng HỦY ĐƠN HÀNG khi đã thanh toán / đặt cọc một phần
- **Hiện tượng:** Khách đặt đơn 50.000.000đ, đã đặt cọc 15.000.000đ (có Phiếu thu `Đã thu` 15.000.000đ). Khách báo hủy đơn.
- **Quy trình xử lý trên hệ thống:**
  1. Đơn hàng chuyển trạng thái sang `Đã hủy` (Chỉ Quản lý/Admin duyệt hủy).
  2. Số tiền cọc 15.000.000đ có 2 phương án giải quyết (lựa chọn khi thao tác):
     - **Phương án A (Hoàn trả tiền mặt/chuyển khoản cho khách):**
       - Hệ thống tự động/cho phép tạo **Phiếu chi hoàn tiền** (Phân hệ E.I.2).
       - Loại chi phí: `HOAN_TIEN_KHACH_HANG` (Gắn mã `order_id` và `customer_id`).
       - Khi Phiếu chi được duyệt `Đã chi`: Số tiền 15.000.000đ này được ghi nhận vào dòng tiền chi, giảm trừ số tiền giữ của đơn hàng về 0đ, công nợ đơn = 0đ.
     - **Phương án B (Giữ lại tiền cọc làm số dư của khách để cấn trừ đơn sau):**
       - Tiền 15.000.000đ được chuyển vào trường `Số dư ký quỹ / Tiền trả trước` (Credit Balance) trong hồ sơ khách hàng.
       - Khi khách phát sinh đơn hàng mới, cho phép chọn "Sử dụng tiền dư trả trước" để thanh toán.

##### Tình huống 2: Khách hàng TRẢ LẠI HÀNG (Return/Exchange) sau khi đã nhận hàng
- **Hiện tượng:** Đơn hàng đã giao, nhưng khách đổi trả bớt 1 phần sản phẩm (giá trị 5.000.000đ) do lỗi hoặc thay đổi nhu cầu.
- **Quy trình xử lý:**
  1. Tạo **Phiếu trả hàng / Nhập kho trả lại** (Phân hệ C): Kho cộng lại số lượng sản phẩm tương ứng vào tồn kho.
  2. Điều chỉnh giá trị đơn hàng: Hệ thống ghi nhận phát sinh giảm trừ `Giá trị điều chỉnh = -5.000.000đ`.
  3. Xử lý công nợ:
     - Nếu khách **chưa thanh toán đủ**: Trừ trực tiếp 5.000.000đ vào `Còn phải thu` của đơn hàng đó.
     - Nếu khách **đã thanh toán 100%**: Hệ thống tự động tạo **Phiếu chi hoàn tiền** trả lại khách HOẶC cộng 5.000.000đ vào `Số dư trả trước` của khách.

##### Tình huống 3: Điều chỉnh tăng/giảm tiền đơn hàng (+ / -) do phát sinh phụ phí hoặc chiết khấu sau bán
- **Quy trình:**
  - Bổ sung trường `Phát sinh điều chỉnh (+/-)` và `Lý do điều chỉnh` trên Đơn hàng.
  - Công thức tính mới: `Giá trị đơn hàng chốt = (Tổng tiền hàng sau thuế) + (Phát sinh tăng/giảm)`.

---

#### 2. Cơ chế tính toán Công nợ toàn diện (Debt Accounting Engine)

Hệ thống quản trị công nợ trên **2 cấp độ độc lập nhưng liên kết chặt chẽ**:

##### Cấp độ 1: Công nợ chi tiết trên từng Đơn hàng (Order-level Debt)
Mỗi đơn hàng quản lý dòng tiền độc lập:
$$\text{Thực thu ròng} = \sum (\text{Phiếu thu 'Đã thu'}) - \sum (\text{Phiếu chi hoàn tiền 'Đã chi'})$$
$$\text{Còn phải thu} = \text{Giá trị đơn hàng sau thuế} - \text{Thực thu ròng}$$

- **Tự động cập nhật Trạng thái thanh toán (Payment Status Trigger):**
  - Nếu $\text{Thực thu ròng} = 0$: Trạng thái $\rightarrow$ `Chưa thanh toán`
  - Nếu $0 < \text{Thực thu ròng} < \text{Giá trị đơn}$: Trạng thái $\rightarrow$ `Thanh toán một phần`
  - Nếu $\text{Thực thu ròng} = \text{Giá trị đơn}$: Trạng thái $\rightarrow$ `Đã thanh toán`
  - Nếu $\text{Thực thu ròng} > \text{Giá trị đơn}$: Trạng thái $\rightarrow$ `Khách trả thừa` (Số tiền thừa $\rightarrow$ Credit Balance).

##### Cấp độ 2: Sổ nợ tổng hợp của Khách hàng (Customer Ledger - Sổ cái công nợ)
Không chỉ tính đơn lẻ, hệ thống phải theo dõi toàn bộ vòng đời nợ của một đối tác:
$$\text{Công nợ hiện tại của Khách} = \sum (\text{Còn phải thu của tất cả các đơn chưa tất toán}) - \text{Số dư trả trước}$$

- **Cơ chế Gạch nợ / Phân bổ tiền thanh toán (Payment Allocation):**
  - Khi khách hàng chuyển khoản 1 cục tiền gộp (ví dụ khách nợ 3 đơn cũ: Đơn 1 = 10tr, Đơn 2 = 15tr, Đơn 3 = 20tr; khách chuyển 20tr):
    - **Tự động theo FIFO (First-In-First-Out):** Ưu tiên gạch sạch nợ Đơn 1 (10tr) $\rightarrow$ còn 10tr gạch tiếp vào Đơn 2 $\rightarrow$ Đơn 2 còn nợ 5tr $\rightarrow$ Đơn 3 giữ nguyên 20tr.
    - **Thủ công do Kế toán chỉ định:** Kế toán được tích chọn chính xác số tiền này dùng để trả cho Đơn hàng nào trên Form lập Phiếu thu.

---

#### 3. Bảng Checklist kỹ thuật bổ sung cho phần Công nợ & Hoàn tiền

- [x] **Database Migration bổ sung:**
  - [x] Thêm trường `refund_amount` (Số tiền đã hoàn) và `adjusted_amount` (Số tiền điều chỉnh +/-) vào bảng `orders`.
  - [x] Thêm trường `credit_balance` (Số dư có / Tiền trả thừa) vào bảng `customers`.
  - [x] Thêm liên kết `order_id` (Nullable) vào bảng `payment_vouchers` (để dùng cho Phiếu chi hoàn tiền).
  - [x] Tạo bảng trung gian `receipt_voucher_allocations` (nếu 1 phiếu thu gạch nợ cho nhiều đơn hàng: `voucher_id`, `order_id`, `allocated_amount`).
- [x] **Backend Service:**
  - [x] Transaction gạch nợ: Khi duyệt Phiếu thu -> Tự động trừ công nợ các đơn hàng tương ứng trong 1 Database Transaction.
  - [x] Transaction hoàn tiền: Khi duyệt Phiếu chi hoàn tiền -> Trừ Thực thu của đơn hoặc trừ Credit Balance của khách.
- [x] **Frontend UI:**
  - [x] Form Phiếu thu có Bảng danh sách các đơn hàng còn nợ của khách kèm ô nhập số tiền phân bổ gạch nợ.
  - [x] Nút "Lập phiếu chi hoàn tiền" trên màn hình chi tiết Đơn hàng đã hủy hoặc có trả hàng.
  - [x] Thẻ hiển thị "Số dư tiền trả trước" trên màn hình 3 phần của Khách hàng (B.1).

---

### X. TIÊU CHUẨN NGHIỆM THU TÍNH NĂNG (DEFINITION OF DONE - DoD)

Trước khi đánh dấu hoàn thành `[x]` một chức năng để chuyển sang chức năng kế tiếp, tính năng đó phải vượt qua 6 tiêu chuẩn nghiệm thu sau:

- [x] **1. CSDL & Indexing:** Migration đã chạy thành công; các trường thường xuyên lọc/tìm kiếm đã được đánh Index (`phone`, `tax_code`, `code`, `order_number`, `status`, `created_at`).
- [x] **2. Backend API:** Đầy đủ validation đầu vào (DTO/Zod/Joi), bắt lỗi ngoại lệ chuẩn mã HTTP (400, 401, 403, 404, 500), bảo vệ bởi Middleware kiểm tra Token và Phân quyền.
- [x] **3. Frontend UI/UX:** Giao diện hoàn chỉnh, chuẩn Responsive; Bắt lỗi validate tức thời (báo đỏ khi trùng SĐT/MST hoặc để trống trường bắt buộc); Hiển thị Loading/Toast notification khi thao tác.
- [x] **4. Nghiệp vụ cốt lõi:** Đã kiểm thử các nghiệp vụ quan trọng:
  - Khóa sửa Phiếu thu / Phiếu chi khi đã ở trạng thái "Đã thu" / "Đã chi".
  - Tự động trừ tồn kho khi giao hàng.
  - Tự động sinh Nhà cung cấp khi thêm hàng hóa mới.
  - Tự động tính `Còn phải thu = Giá trị đơn hàng – Thực thu`.
- [x] **5. In ấn & Xuất file:** Xuất file Excel, PDF và In ấn đúng theo biểu mẫu công ty.
- [x] **6. Testing & Audit:** Đã test luồng chính (Happy Path) và các trường hợp biên (Edge Cases); Các hành động nhạy cảm (Bàn giao khách, Bàn giao đơn, Override chứng từ) đều được ghi nhận vào bảng Audit Log.

---

### XI. QUY CHUẨN THIẾT KẾ GIAO DIỆN (UI/UX DESIGN SYSTEM & SPECIFICATIONS)
*(Kế thừa và chuẩn hóa trực tiếp từ phân hệ BonCi / Mộc Việt của Công ty TNHH NK Nam Khánh)*

Nhằm đảm bảo tính đồng bộ nhận diện thương hiệu, tốc độ tải trang cao và trải nghiệm người dùng văn phòng trực quan, toàn bộ giao diện Frontend của CRM Nam Khánh phải tuân thủ nghiêm ngặt hệ thống Design System dưới đây:

#### 1. Bảng Màu Sắc Thương Hiệu & Trạng Thái (Color Palette & Tokens)

Hệ màu được xây dựng dựa trên phong cách **Modern Clean SaaS / Dashboard ERP**, lấy sắc đỏ thương hiệu Nam Khánh làm chủ đạo kết hợp các màu trạng thái đối lập rõ ràng:

| Vai trò màu | Mã Hex / RGB | Tailwind / Token Class | Ứng dụng cụ thể trong hệ thống CRM |
| :--- | :--- | :--- | :--- |
| **Màu thương hiệu chính (Primary Red)** | `#E53935`<br>`rgb(229 57 53)` | `bg-primary`<br>`text-primary`<br>`border-primary` | Nút hành động chính (`.btn-primary`), nút Hamburger mobile, thanh active menu (`border-l-[3px] border-red-500`), viền ô input khi focus, cột doanh thu biểu đồ BarChart, thanh cuộn chuột (`::-webkit-scrollbar-thumb`). |
| **Primary Hover** | `#C62828`<br>`rgb(198 40 40)` | `hover:bg-red-700` | Trạng thái hover của nút bấm chính và các button hành động cấp 1. |
| **Primary Light (Nền active menu)** | `#FFEBEE`<br>`rgb(255 235 238)` | `bg-primary-50`<br>`bg-red-50` | Nền menu đang kích hoạt trong Sidebar (`bg-red-50 text-red-700`), nền thẻ tag nổi bật, hover menu item. |
| **Nền tổng thể (App Background)** | `#F9FAFB`<br>`rgb(249 250 251)` | `bg-gray-50` | Toàn bộ background của trang (ngoại trừ các card nội dung và sidebar). |
| **Nền khối nội dung (Card / Sidebar)**| `#FFFFFF` | `bg-white` | Nền của Sidebar, các Card KPI, DataGrid, Modal popup, Drawer form. |
| **Đường viền ngăn cách (Border Line)** | `#F3F4F6` / `#E5E7EB` | `border-gray-100`<br>`border-gray-200` | Viền thẻ card, đường phân cách giữa các dòng trong bảng (`.table-td`), viền sidebar phải. |
| **Xanh lá (Success / Doanh thu)** | `#43A047` / `#16A34A` | `text-green-600`<br>`bg-green-50` | Thẻ KPI Doanh thu bán hàng, nhãn **Đã thanh toán** (`.badge-green`), đơn hàng **Đã giao**, tồn kho an toàn (> 10 chiếc). |
| **Xanh dương (Blue / Tồn kho)** | `#1E88E5` / `#2563EB` | `text-blue-600`<br>`bg-blue-50` | Thẻ KPI Tổng tồn kho, Lợi nhuận dương, icon Lịch sử mua hàng của khách, khung thông báo hướng dẫn file Excel mẫu. |
| **Vàng cam / Hổ phách (Warning / Pending)**| `#FB8C00` / `#FDD835` | `text-amber-500`<br>`bg-amber-100` | Biểu tượng cảnh báo tồn kho thấp, nhãn **Sắp hết hàng** (≤ 10 chiếc, `.badge-yellow`), hóa đơn **Chưa thanh toán**, giao hàng **Đang giao**. |
| **Đỏ cảnh báo (Danger / Hết hàng)** | `#DC2626` / `#B91C1C` | `text-red-600`<br>`bg-red-100` | Nhãn sản phẩm **Hết hàng** (tồn = 0, `.badge-red`), nút xóa dữ liệu (`.btn-danger`), hoàn đơn hàng. |
| **Tím (Purple / Lợi nhuận & Danh mục)** | `#8E24AA` / `#7E22CE` | `text-purple-700`<br>`bg-purple-50` | Thẻ KPI Lợi nhuận tháng, thẻ Giá trị tồn kho, các nhóm danh mục đặc thù. |
| **Lớp phủ Modal / Drawer Overlay** | `rgba(0, 0, 0, 0.45)` | `#bonci-overlay` | Lớp backdrop làm mờ nền khi mở Drawer form thêm mới hoặc mở Menu trên mobile. |

##### Bảng mã 6 màu chuẩn cho Biểu đồ thống kê (Chart.js / Recharts Palette):
```javascript
const CHART_PALETTE = [
  "#E53935", // 1. Đỏ Nam Khánh (Primary)
  "#1E88E5", // 2. Xanh dương
  "#43A047", // 3. Xanh lá
  "#FDD835", // 4. Vàng nắng
  "#FB8C00", // 5. Cam tươi
  "#8E24AA"  // 6. Tím hoa cà
];
```

---

#### 2. Quy chuẩn Typography & Font chữ

1. **Giao diện Web App (Dashboard & Forms):**
   - **Font family:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (Google Fonts).
   - **Font weight:** 400 (Regular cho nội dung thường), 500 (Medium cho nhãn form & nút bấm), 600 (Semi-bold cho tiêu đề card & tên cột bảng), 700 (Bold cho số liệu KPI & Tiêu đề trang).
   - **Thang kích thước chữ:**
     - Tiêu đề trang (`h1`): `text-xl font-bold text-gray-800` (20px).
     - Tiêu đề Card / Nhóm (`h2`, `h3`): `text-sm font-semibold text-gray-700` (14px, uppercase tracking-wide với nhóm cài đặt).
     - Số liệu KPI nổi bật: `text-2xl font-bold text-gray-900` (24px, giảm về 20px trên mobile).
     - Nội dung bảng & Text thông thường: `text-sm text-gray-700` (14px).
     - Chú thích phụ, ngày tháng, mã chứng từ: `text-xs text-gray-400` hoặc `font-mono text-xs font-semibold` (12px).
2. **Biểu mẫu In ấn (Phiếu xuất kho & Báo giá A4):**
   - Sử dụng font chuẩn văn bản kế toán: `Times New Roman` hoặc `Arial`.
   - Kích thước văn bản in: 11px - 13px, Tiêu đề chứng từ in hoa cỡ 15px - 16px đậm, căn giữa.

---

#### 3. Bộ CSS Utility Classes & UI Component Quy chuẩn

Toàn bộ lập trình viên Frontend sử dụng các class đóng gói sẵn theo phong cách BonCi thay vì viết CSS tự do:

```css
/* Nút bấm hành động chính */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  background-color: #E53935;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #FFFFFF;
  transition: background-color 0.15s ease-in-out;
}
.btn-primary:hover {
  background-color: #C62828;
}

/* Nút phụ / Hủy bỏ / Xuất file */
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #E5E7EB;
  background-color: #FFFFFF;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.15s ease-in-out;
}
.btn-secondary:hover {
  background-color: #F9FAFB;
}

/* Nút cảnh báo / Xóa */
.btn-danger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  background-color: #DC2626;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #FFFFFF;
  transition: background-color 0.15s ease-in-out;
}
.btn-danger:hover {
  background-color: #B91C1C;
}

/* Ô nhập liệu Form (Input & Select) */
.input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #E5E7EB;
  background-color: #FFFFFF;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus {
  border-color: #E53935;
  outline: none;
  box-shadow: 0 0 0 2px rgba(229, 57, 53, 0.2);
}

/* Thẻ Card chứa nội dung & KPI */
.card {
  border-radius: 0.75rem; /* bo góc 12px */
  border: 1px solid #F3F4F6;
  background-color: #FFFFFF;
  padding: 1.25rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Header & Cell của Bảng dữ liệu DataGrid */
.table-th {
  background-color: #F9FAFB;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6B7280;
}
.table-th:first-child { border-top-left-radius: 0.5rem; }
.table-th:last-child  { border-top-right-radius: 0.5rem; }

.table-td {
  border-top: 1px solid #F3F4F6;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #374151;
}

/* Huy hiệu trạng thái (Status Badges) */
.badge-green {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background-color: #DCFCE7;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #166534;
}

.badge-yellow {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background-color: #FEF9C3;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #854D0E;
}

.badge-red {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background-color: #FEE2E2;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #B91C1C;
}

/* Tùy biến thanh cuộn Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #FFCDD2; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #E53935; }
```

---

#### 4. Cấu trúc Bố cục Layout & Quy tắc Responsive

##### A. Thanh Menu Sidebar (Desktop):
- **Cố định bên trái:** Rộng `w-60` (240px), cao 100vh, nền trắng, viền phải `border-r border-gray-100`.
- **Phần đầu:** Logo Nam Khánh kích thước `w-10 h-10` (`object-contain`), tên công ty in đậm `font-bold text-base text-gray-900` và tên chi nhánh `text-xs text-gray-400`.
- **Menu Items:** Mỗi mục có icon 18px (Lucide icon), khoảng cách `gap-3`, bo góc `rounded-lg`, padding `px-3 py-2.5`. Khi active hiển thị nền đỏ nhạt `bg-red-50 text-red-700` kèm viền trái màu đỏ đậm `border-l-[3px] border-red-500`.
- **Chân trang Sidebar:** Nút "Cài đặt" (`/settings`), hiển thị email tài khoản hiện tại (`text-xs text-gray-400`) và nút "Đăng xuất".

##### B. Responsive trên Mobile & Tablet:
- **Mobile (< 768px):**
  - Sidebar trượt ra khỏi màn hình (`transform: translateX(-100%)`).
  - Nút Hamburger màu đỏ `#E53935` xuất hiện cố định ở góc trái trên cùng (`top: 10px, left: 10px`, kích thước `38x38px`, bo góc 8px, bóng đổ `shadow`).
  - Khi bấm mở menu: Sidebar trượt ra (`translateX(0)`), đồng thời xuất hiện lớp nền mờ `#bonci-overlay` (`rgba(0,0,0,0.45)`). Khi bấm vào liên kết hoặc bấm ra ngoài nền mờ thì tự động đóng sidebar.
  - Toàn bộ lưới 4 thẻ KPI (`grid-cols-4`) tự co về **2 cột** trên tablet và **1 cột** trên mobile nhỏ (< 480px).
  - Khung Drawer form từ chiều rộng cố định 480px chuyển thành **100% chiều rộng màn hình**.

---

#### 5. Màn hình Đăng nhập (Login Screen UI Pattern)

- **Hiệu ứng nền sáng chuyển sắc (Ambient Blur Blobs):**
  - Đốm tròn mờ góc trên trái: Đường kính 288px (`w-72 h-72`), bo tròn, làm mờ cực đại `blur-3xl`, độ mờ 25%, màu đỏ thương hiệu `#E53935`.
  - Đốm tròn mờ góc dưới phải: Đường kính 288px, làm mờ `blur-3xl`, độ mờ 20%, màu xanh dương `#1E88E5`.
  - Đốm tròn mờ giữa bên trái: Đường kính 192px, màu xanh lá `#43A047`, độ mờ 15%.
  - Đốm tròn mờ góc trên phải: Đường kính 192px, màu vàng `#FDD835`, độ mờ 20%.
- **Hộp đăng nhập trung tâm:**
  - Kích thước vừa vặn `max-w-sm` đặt giữa màn hình.
  - Logo Nam Khánh trong khung bo tròn mềm `rounded-2xl shadow-lg bg-white p-2 w-20 h-20` căn giữa.
  - Thẻ card đăng nhập: Nền trắng, bo tròn lớn `rounded-2xl`, bóng đổ nổi `shadow-xl`, viền mờ `border-gray-100`, padding rộng `p-8`.

---

#### 6. Quy chuẩn Biểu mẫu In ấn A4 (Phiếu xuất kho kiêm Biên bản giao hàng)

Đối với màn hình in ấn hóa đơn và xuất kho (`/invoices/:id/print`):
- **Quy định in ấn CSS Print:**
  ```css
  @media print {
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    body { background: #FFFFFF; }
    @page { margin: 15mm; size: A4; }
  }
  ```
- **Bố cục đầu phiếu:**
  - Cột trái: Logo công ty Nam Khánh (`logo_hoa_don.jpg`, max-height 80px, max-width 160px).
  - Cột thông tin công ty: Tên công ty in hoa đậm, Địa chỉ, Mã số thuế, Số điện thoại, Email, 2 số tài khoản ngân hàng thụ hưởng.
- **Tiêu đề phiếu:** Căn giữa, in hoa, đậm:
  `PHIẾU XUẤT KHO KIÊM BIÊN BẢN GIAO HÀNG`
  kèm ngày, tháng, năm lập và Số chứng từ (`Số hóa đơn: HD...`).
- **Thông tin khách hàng:** Kính gửi tên khách hàng, Địa chỉ giao hàng, Người nhận hàng, Số điện thoại.
- **Bảng chi tiết hàng hóa (8 cột chuẩn):** STT | Mã hàng | Tên sản phẩm, quy cách | Đơn vị tính | Số lượng | Đơn giá | Thành tiền | Ghi chú.
- **Tổng kết tiền:** Dòng tổng tiền hàng, thuế VAT, Tổng tiền thanh toán và dòng diễn giải **Số tiền viết bằng chữ** (sử dụng hàm chuyển đổi số sang chữ tiếng Việt chuẩn xác `numberToWords`).
- **Chân chữ ký 4 bên:** Người lập phiếu | Người nhận hàng | Thủ kho | Giám đốc / Đại diện công ty.

---

#### 7. Bảng Checklist Triển khai UI/UX Frontend dành cho Lập trình viên

- [x] **Khởi tạo Design System Tokens:**
  - [x] Khai báo mã màu `#E53935` vào cấu hình Tailwind `theme.colors.primary` hoặc biến CSS `:root`.
  - [x] Thêm font chữ `Inter` từ Google Fonts vào `index.html`.
  - [x] Cài đặt các class tiện ích `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.card`, `.badge-green`, `.badge-yellow`, `.badge-red` vào tệp CSS toàn cục.
  - [x] Cấu hình thanh cuộn tùy biến với tone màu hồng nhạt `#FFCDD2` và hover đỏ `#E53935`.
- [x] **Khung giao diện (Shell Layout):**
  - [x] Xây dựng Component `Sidebar`: Logo Nam Khánh, Avatar, Menu 7 mục chính + 1 mục Cài đặt, active highlight viền đỏ 3px.
  - [x] Xây dựng Component Mobile Hamburger (`#bonci-ham`) màu đỏ `#E53935` và nền phủ mờ (`#bonci-overlay`) trượt mở mượt mà.
  - [x] Xây dựng Component `StatCard` (Thẻ KPI 4 màu: Đỏ, Xanh dương, Xanh lá, Tím).
- [x] **Trang Đăng nhập (Login):**
  - [x] Dựng hiệu ứng 4 đốm sáng mờ Ambient Blur Blobs (Đỏ, Xanh dương, Xanh lá, Vàng) tạo chiều sâu thị giác.
  - [x] Validate form trực quan, nút Đăng nhập hiệu ứng loading spinner.
- [x] **Màn hình Bảng dữ liệu (DataGrid) & Biểu đồ:**
  - [x] Dựng DataGrid có header in hoa xám nhạt (`.table-th`), dòng cách nhau viền mảnh (`.table-td`), nhãn trạng thái viên thuốc.
  - [x] Tích hợp 6 màu `CHART_PALETTE` vào biểu đồ BarChart doanh thu 12 tháng và PieChart tỷ lệ danh mục.
- [x] **Trang In ấn A4:**
  - [x] Xây dựng giao diện in chuẩn khổ A4, tự động ẩn Sidebar & Header khi mở hộp thoại in trình duyệt (`@media print`).
  - [x] Đảm bảo đầy đủ logo, thông tin 2 tài khoản ngân hàng và bộ chữ ký 4 bên.

