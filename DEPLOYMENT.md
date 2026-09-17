# Deploy VPS

## 1. Tạo secrets

Trên VPS, tạo file `.env` cạnh `docker-compose.yml` từ `.env.example`. `POSTGRES_PASSWORD` và mật khẩu trong `DATABASE_URL` phải là **cùng một giá trị**. Nếu mật khẩu có ký tự như `@`, `:`, `/`, `?`, hoặc `#`, hãy URL-encode riêng mật khẩu trong `DATABASE_URL`.

Ví dụ mật khẩu `abc@123`:

```dotenv
POSTGRES_PASSWORD=abc%40123
DATABASE_URL=postgresql://postgres:abc%40123@postgres:5432/crm_namkhanh?schema=public
```

Không commit file `.env`.

## 2. Khắc phục VPS đã có dữ liệu

Postgres chỉ đọc `POSTGRES_PASSWORD` khi khởi tạo volume lần đầu. Vì vậy, đổi `.env` **không tự đổi** mật khẩu trong volume cũ. Với dữ liệu cần giữ, đặt lại mật khẩu từ container Postgres rồi khởi động lại backend:

```bash
docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "ALTER USER \"$POSTGRES_USER\" WITH PASSWORD '$POSTGRES_PASSWORD';"
docker compose up -d --build
```

Nếu đây là môi trường mới hoặc không cần dữ liệu hiện tại, dùng `docker compose down -v` rồi `docker compose up -d --build` để tạo database mới. Lệnh `down -v` xóa toàn bộ dữ liệu database, không dùng cho production đang có dữ liệu.

## 3. Xác nhận

```bash
docker compose ps
curl -fsS http://127.0.0.1:5000/api/v1/health
```
