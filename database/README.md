# THƯ MỤC CƠ SỞ DỮ LIỆU - CRM NAM KHÁNH

Thư mục này chứa toàn bộ các file SQL và bản sao lưu (backup) cơ sở dữ liệu của hệ thống **CRM NK Nam Khánh** (PostgreSQL).

---

## 📁 Danh sách các file trong thư mục

| Tên File | Định dạng | Dung lượng | Mô tả chi tiết |
| :--- | :--- | :--- | :--- |
| **`crm_namkhanh_full.sql`** | SQL Script (.sql) | ~110 KB | **Bản đầy đủ nhất (Khuyên dùng):** Chứa toàn bộ cấu trúc tạo bảng (DDL) + toàn bộ dữ liệu mẫu (Roles, 25 Modules phân quyền RBAC, Cơ cấu phòng ban, Tổng kho VPP, Tài khoản Admin `dinhhchi2110@gmail.com`, Khách hàng, Báo giá, Đơn hàng...). |
| **`crm_namkhanh.db`** | Binary Dump (.db) | ~96 KB | File backup dạng nhị phân chuẩn nén của PostgreSQL (`pg_dump -Fc`), có đuôi `.db` theo yêu cầu. Dùng để khôi phục nhanh qua `pg_restore` hoặc các công cụ giao diện như DBeaver, pgAdmin. |
| **`schema.sql`** | SQL Script (.sql) | ~29 KB | Chỉ chứa định nghĩa cấu trúc bảng, khóa ngoại, chỉ mục (Index) thuần túy được trích xuất từ Prisma ORM (không kèm dữ liệu). |

---

## 🚀 Hướng dẫn khôi phục (Restore / Import)

### 1. Import từ file `crm_namkhanh_full.sql` (Dễ nhất)

#### Cách A: Bằng lệnh Terminal (Dùng psql)
```bash
# Trên máy tính cục bộ:
psql -U postgres -d crm_namkhanh -f database/crm_namkhanh_full.sql

# Hoặc trên Docker container:
docker exec -i crm_namkhanh_postgres psql -U postgres -d crm_namkhanh < database/crm_namkhanh_full.sql
```

#### Cách B: Bằng công cụ đồ họa (DBeaver / pgAdmin / Navicat)
1. Kết nối vào Database `crm_namkhanh`.
2. Mở file **`database/crm_namkhanh_full.sql`** trong trình soạn thảo SQL (SQL Editor).
3. Bấm **Execute Script (F5)** để chạy toàn bộ file.

---

### 2. Khôi phục từ file nhị phân `crm_namkhanh.db`

```bash
pg_restore -U postgres -d crm_namkhanh -v database/crm_namkhanh.db
```

---

## 🔑 Thông tin tài khoản mặc định sau khi Import

* **Tài khoản Admin:** `dinhhchi2110@gmail.com`
* **Mật khẩu:** `Dhc2110@`
* **Vai trò:** Toàn quyền hệ thống (Admin & CEO)
