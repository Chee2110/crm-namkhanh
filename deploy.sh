#!/bin/bash
# =============================================================
# CRM Nam Khánh - Safe Update & Deploy Script for VPS
# =============================================================

set -e

echo "============================================"
echo "  CRM Nam Khánh - Update & Deploy Script"
echo "============================================"

echo "[1/4] Kéo code mới nhất từ GitHub..."
git pull origin main

echo "[2/4] Khởi động CSDL và đảm bảo mật khẩu PostgreSQL container đồng bộ..."
docker compose up -d postgres redis
sleep 3
docker exec -i crm_namkhanh_postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD '${POSTGRES_PASSWORD:-123456}';" || true

echo "[3/4] Build & Khởi động lại Backend & Frontend..."
docker compose up -d --build backend frontend

echo "[4/4] Kiểm tra trạng thái dịch vụ..."
docker ps --filter "name=crm_namkhanh"

echo "============================================"
echo "  ✅ DEPLOY HOÀN TẤT! Web đã được cập nhật."
echo "============================================"
