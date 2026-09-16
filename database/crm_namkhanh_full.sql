--
-- PostgreSQL database dump
--

\restrict Cg4ilXeu4F0egxbXBG8oeuwDqaT5fy9wASobHQE2AKcBi7PU9c0zP6EfqPo8FpZ

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    user_id text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    ip_address text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    warehouse_id text,
    description text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: customer_handover_histories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_handover_histories (
    id text NOT NULL,
    customer_id text NOT NULL,
    from_user_id text,
    to_user_id text NOT NULL,
    reason text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.customer_handover_histories OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    tax_code text,
    address text,
    delivery_address text,
    customer_type text DEFAULT 'ENTERPRISE'::text NOT NULL,
    source text DEFAULT 'SELF_FOUND'::text NOT NULL,
    contact_person text,
    email text,
    notes text,
    manager_id text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    credit_balance numeric(15,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    parent_id text,
    manager_id text,
    address text,
    mission text,
    avatar_url text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- Name: expense_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_types (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category_id text NOT NULL,
    description text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.expense_types OWNER TO postgres;

--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.legal_documents (
    id text NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    uploaded_by_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.legal_documents OWNER TO postgres;

--
-- Name: order_handover_histories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_handover_histories (
    id text NOT NULL,
    order_id text NOT NULL,
    from_user_id text,
    to_user_id text NOT NULL,
    reason text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_handover_histories OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    order_id text NOT NULL,
    product_id text,
    product_code text NOT NULL,
    product_name text NOT NULL,
    unit text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    amount numeric(15,2) DEFAULT 0 NOT NULL,
    vat_rate integer DEFAULT 8 NOT NULL,
    total numeric(15,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_return_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_return_items (
    id text NOT NULL,
    return_id text NOT NULL,
    product_id text,
    product_code text NOT NULL,
    product_name text NOT NULL,
    unit text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    amount numeric(15,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.order_return_items OWNER TO postgres;

--
-- Name: order_returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_returns (
    id text NOT NULL,
    code text NOT NULL,
    order_id text NOT NULL,
    return_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason text NOT NULL,
    total_refund_amount numeric(15,2) DEFAULT 0 NOT NULL,
    refund_method text DEFAULT 'DEDUCT_DEBT'::text NOT NULL,
    status text DEFAULT 'COMPLETED'::text NOT NULL,
    created_by_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.order_returns OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id text NOT NULL,
    code text NOT NULL,
    customer_id text NOT NULL,
    quotation_id text,
    manager_id text,
    order_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delivery_date date,
    delivery_address text,
    contact_person text,
    phone text,
    delivery_status text DEFAULT 'PENDING'::text NOT NULL,
    payment_status text DEFAULT 'UNPAID'::text NOT NULL,
    invoice_status text DEFAULT 'NOT_ISSUED'::text NOT NULL,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL,
    vat_rate integer DEFAULT 8 NOT NULL,
    vat_amount numeric(15,2) DEFAULT 0 NOT NULL,
    total_amount numeric(15,2) DEFAULT 0 NOT NULL,
    paid_amount numeric(15,2) DEFAULT 0 NOT NULL,
    remaining_amount numeric(15,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    adjusted_amount numeric(15,2) DEFAULT 0 NOT NULL,
    adjustment_reason text,
    refund_amount numeric(15,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: payment_vouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_vouchers (
    id text NOT NULL,
    code text NOT NULL,
    voucher_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category_id text,
    type_id text,
    recipient text NOT NULL,
    phone text,
    address text,
    reason text NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_method text DEFAULT 'CASH'::text NOT NULL,
    invoice_number text,
    invoice_date date,
    file_url text,
    file_name text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    customer_id text,
    order_id text,
    created_by_id text,
    approved_by_id text,
    approved_at timestamp(3) without time zone,
    rejected_reason text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payment_vouchers OWNER TO postgres;

--
-- Name: product_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_types (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category_id text NOT NULL,
    unit text,
    description text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_types OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    unit text NOT NULL,
    cost_price numeric(15,2) DEFAULT 0 NOT NULL,
    selling_price numeric(15,2) DEFAULT 0 NOT NULL,
    vat_rate integer DEFAULT 8 NOT NULL,
    stock_quantity integer DEFAULT 100 NOT NULL,
    description text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    barcode text,
    category_id text,
    color text,
    height numeric(10,2),
    image_url text,
    length numeric(10,2),
    min_stock_level integer DEFAULT 20 NOT NULL,
    product_type_id text,
    supplier_id text,
    warehouse_id text,
    weight numeric(10,2),
    width numeric(10,2)
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: quotation_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_items (
    id text NOT NULL,
    quotation_id text NOT NULL,
    product_id text,
    product_code text NOT NULL,
    product_name text NOT NULL,
    unit text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    amount numeric(15,2) DEFAULT 0 NOT NULL,
    vat_rate integer DEFAULT 8 NOT NULL,
    total numeric(15,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.quotation_items OWNER TO postgres;

--
-- Name: quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotations (
    id text NOT NULL,
    code text NOT NULL,
    customer_id text NOT NULL,
    manager_id text,
    date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    valid_until date,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL,
    vat_rate integer DEFAULT 8 NOT NULL,
    vat_amount numeric(15,2) DEFAULT 0 NOT NULL,
    total_amount numeric(15,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.quotations OWNER TO postgres;

--
-- Name: receipt_voucher_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receipt_voucher_allocations (
    id text NOT NULL,
    voucher_id text NOT NULL,
    order_id text NOT NULL,
    amount numeric(15,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.receipt_voucher_allocations OWNER TO postgres;

--
-- Name: receipt_vouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receipt_vouchers (
    id text NOT NULL,
    code text NOT NULL,
    voucher_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type_id text,
    payer text NOT NULL,
    phone text,
    address text,
    reason text NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_method text DEFAULT 'BANK_TRANSFER'::text NOT NULL,
    invoice_number text,
    invoice_date date,
    file_url text,
    file_name text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    customer_id text,
    order_id text,
    created_by_id text,
    approved_by_id text,
    approved_at timestamp(3) without time zone,
    rejected_reason text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.receipt_vouchers OWNER TO postgres;

--
-- Name: revenue_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revenue_types (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.revenue_types OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id text NOT NULL,
    role_id text NOT NULL,
    module_code text NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_read boolean DEFAULT false NOT NULL,
    can_update boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    data_scope text DEFAULT 'PERSONAL'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: sales_plan_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_plan_items (
    id text NOT NULL,
    sales_plan_id text NOT NULL,
    category text NOT NULL,
    unit text NOT NULL,
    target_quantity integer DEFAULT 0 NOT NULL,
    target_revenue numeric(15,2) DEFAULT 0 NOT NULL,
    actual_quantity integer DEFAULT 0 NOT NULL,
    actual_revenue numeric(15,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.sales_plan_items OWNER TO postgres;

--
-- Name: sales_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_plans (
    id text NOT NULL,
    title text NOT NULL,
    period_type text DEFAULT 'MONTH'::text NOT NULL,
    period_value text NOT NULL,
    year integer DEFAULT 2026 NOT NULL,
    department_id text,
    created_by_id text,
    notes text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sales_plans OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    tax_code text,
    contact_person text,
    notes text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id text NOT NULL,
    role_id text NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    code text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    phone text,
    dob date,
    department_id text,
    manager_id text,
    avatar_url text,
    basic_salary numeric(15,2),
    allowance numeric(15,2),
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    start_date date,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouses (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    address text,
    department_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    phone text,
    status text DEFAULT 'ACTIVE'::text NOT NULL
);


ALTER TABLE public.warehouses OWNER TO postgres;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at) FROM stdin;
c0602a34-8668-4740-9025-8cf1f6ad1af7	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-10T09:30:23.406Z", "email": "admin@namkhanh.vn"}	\N	2026-09-10 09:30:23.418
d0df7dd5-0fef-4638-acb9-517719c75706	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-10T09:37:10.797Z", "email": "admin@namkhanh.vn"}	\N	2026-09-10 09:37:10.799
ba0157ce-803f-4a04-8235-b94b065dda03	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-10T09:47:53.660Z", "email": "admin@namkhanh.vn"}	\N	2026-09-10 09:47:53.662
2cdc94a6-ee90-44e4-8f88-e71f050887b7	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-10T10:48:09.922Z", "email": "admin@namkhanh.vn"}	\N	2026-09-10 10:48:09.923
51330824-b75c-4efd-80d9-d4305c327208	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-10T10:57:20.106Z", "email": "admin@namkhanh.vn"}	\N	2026-09-10 10:57:20.108
307b9b8f-1831-474e-890b-9de587dd7cd2	621cf917-d0da-4232-b833-b5e0e4306237	RESET_PASSWORD_SUCCESS	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"email": "admin@namkhanh.vn", "resetAt": "2026-09-13T07:13:02.645Z"}	\N	2026-09-13 07:13:02.661
e2016da4-38bb-484f-9805-1faffd9db161	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-13T07:13:02.715Z", "email": "admin@namkhanh.vn"}	\N	2026-09-13 07:13:02.731
536b74ed-e467-453c-98cb-66d6460b4dd9	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-14T11:07:01.530Z", "email": "admin@namkhanh.vn"}	\N	2026-09-14 11:07:01.532
4fbacda8-5331-401e-a770-0af7e2254cba	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-14T11:15:53.934Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-14 11:15:53.94
3e52c614-9f37-4956-9d06-ce2eb40a13a2	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-14T11:16:11.241Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-14 11:16:11.246
d689f3fd-b3aa-4e59-92c2-f3323caf560f	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-14T11:16:24.397Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-14 11:16:24.403
ec8580b8-4a44-42a2-944e-97f5d9bcb154	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-14T11:16:53.587Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-14 11:16:53.593
01228926-32c7-4704-8aab-d37aec76ee02	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-14T11:19:22.389Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-14 11:19:22.393
4e46e732-a976-4790-bbd4-ac61d79eb769	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-14T11:19:30.540Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-14 11:19:30.544
3ee3e189-857d-4552-8371-592039e95863	a61cb4f2-0d66-4041-aca3-2a33a3b94043	RESET_PASSWORD_SUCCESS	User	a61cb4f2-0d66-4041-aca3-2a33a3b94043	\N	{"email": "dinhkhanh@gmail.com", "resetAt": "2026-09-14T11:20:40.714Z"}	\N	2026-09-14 11:20:40.716
5fef224f-a4e3-4d18-bf2a-1e5abef2330f	a61cb4f2-0d66-4041-aca3-2a33a3b94043	LOGIN	User	a61cb4f2-0d66-4041-aca3-2a33a3b94043	\N	{"time": "2026-09-14T11:20:42.442Z", "email": "dinhkhanh@gmail.com"}	\N	2026-09-14 11:20:42.444
057de609-6637-47ca-b911-c92faaca6c2e	a61cb4f2-0d66-4041-aca3-2a33a3b94043	LOGIN	User	a61cb4f2-0d66-4041-aca3-2a33a3b94043	\N	{"time": "2026-09-14T11:20:51.378Z", "email": "dinhkhanh@gmail.com"}	\N	2026-09-14 11:20:51.38
75441441-5103-457d-9513-8da40c312422	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-14T11:24:29.784Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-14 11:24:29.789
54ee0122-4fa9-44fd-af5c-f1792b1622f0	a61cb4f2-0d66-4041-aca3-2a33a3b94043	LOGIN	User	a61cb4f2-0d66-4041-aca3-2a33a3b94043	\N	{"time": "2026-09-14T11:24:59.975Z", "email": "dinhkhanh@gmail.com"}	\N	2026-09-14 11:24:59.981
6d5a1c78-2aef-4c18-a8bd-617480b879d3	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-14T11:27:35.839Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-14 11:27:35.845
4909e236-bd5f-4e2b-9303-8090867a21f8	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-15T10:28:56.637Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-15 10:28:56.638
4855c197-63df-4e55-b701-26d61cff0260	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-15T10:38:17.194Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-15 10:38:17.198
d73e3d14-d3c7-4d0c-8a93-005d33ba4767	621cf917-d0da-4232-b833-b5e0e4306237	LOGIN	User	621cf917-d0da-4232-b833-b5e0e4306237	\N	{"time": "2026-09-15T10:39:18.036Z", "email": "dinhhchi2110@gmail.com"}	\N	2026-09-15 10:39:18.038
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, code, name, warehouse_id, description, status, created_at, updated_at) FROM stdin;
fb26f000-8920-4242-98cc-98160fa8a7de	DM-GIAY	Giấy in văn phòng	ee4050e2-f903-4169-8d42-cbc2ec20c88c	Giấy photocopy, giấy in vi tính liên tục, giấy bóng kính bìa các loại	ACTIVE	2026-09-10 11:01:55.127	2026-09-14 11:14:52.092
b61b0a68-a6c6-4553-b022-0279d2734d1d	DM-BUT	Bút viết & Mực	ee4050e2-f903-4169-8d42-cbc2ec20c88c	Bút bi, bút gel, bút lông bảng, bút dạ quang và mực dấu chuyên dụng	ACTIVE	2026-09-10 11:01:55.133	2026-09-14 11:14:52.094
0a009e92-8067-4eab-b1f4-786820dabfd1	DM-BIA	File bìa còng & Lưu trữ	ee4050e2-f903-4169-8d42-cbc2ec20c88c	File còng bật, bìa lá, bìa nút, cặp tài liệu lưu trữ chứng từ lâu năm	ACTIVE	2026-09-10 11:01:55.134	2026-09-14 11:14:52.095
b727ff6e-1960-4e57-8830-d52b60bfe6e5	DM-DUNGCU	Dụng cụ văn phòng	4a52c4ed-1450-4b52-8037-9bf628f58f55	Băng dính dán thùng, bấm kim, kim bấm, kẹp bướm, kéo và dao rọc giấy	ACTIVE	2026-09-10 11:01:55.136	2026-09-14 11:14:52.096
f18c89a2-2acd-46e8-9705-449d71f10362	DM-MAY	Thiết bị & Máy văn phòng	4a52c4ed-1450-4b52-8037-9bf628f58f55	Máy tính tài chính Casio, máy in hóa đơn, máy hủy tài liệu công sở	ACTIVE	2026-09-10 11:01:55.137	2026-09-14 11:14:52.097
\.


--
-- Data for Name: customer_handover_histories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_handover_histories (id, customer_id, from_user_id, to_user_id, reason, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, code, name, phone, tax_code, address, delivery_address, customer_type, source, contact_person, email, notes, manager_id, status, created_at, updated_at, credit_balance) FROM stdin;
61ac9e0c-b603-4169-a9d4-3e9ba24aa17d	KH0006	Công ty Cổ phần Tập đoàn FPT	2473007300	101248141	Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội	Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội	ENTERPRISE	SELF_FOUND	Anh Hoàng	\N	\N	621cf917-d0da-4232-b833-b5e0e4306237	ACTIVE	2026-09-11 12:41:51.706	2026-09-14 11:13:12.21	0.00
f59e180a-4a53-41b1-96e7-da87ebfecaa9	KH0007	Trường THCS Lê Quý Đôn	2438345678	102345678	Số 66 Nguyễn Văn Huyên, Cầu Giấy, Hà Nội	Số 66 Nguyễn Văn Huyên, Cầu Giấy, Hà Nội	SCHOOL	SELF_FOUND	Cô Lan	\N	\N	621cf917-d0da-4232-b833-b5e0e4306237	ACTIVE	2026-09-11 12:41:51.762	2026-09-14 11:13:12.21	0.00
57ebb3f9-ee89-4452-9207-c0ab59ed8f73	KH002	Ngân Hàng TMCP Ngoại Thương Việt Nam (Vietcombank) - CN Thăng Long	02438313733	0100112437	98 Hoàng Quốc Việt, Nghĩa Đô, Cầu Giấy, Hà Nội	Kho Hành chính Vietcombank Thăng Long	ENTERPRISE	SELF_FOUND	Chị Nguyễn Phương Thảo (Phó phòng Quản trị)	thaonp.tlg@vietcombank.com.vn	Nhu cầu lớn về giấy in A4 80gsm PaperOne và File còng lưu hồ sơ tín dụng	621cf917-d0da-4232-b833-b5e0e4306237	ACTIVE	2026-09-10 10:10:45.994	2026-09-14 11:14:52.127	0.00
4d4c444d-f91f-4577-ac5b-58b6b5c8bc91	KH003	Trường THPT Chuyên Hà Nội - Amsterdam	02438463096	0101438992	Số 1 đường Hoàng Minh Giám, Cầu Giấy, Hà Nội	Phòng Thiết bị Văn phòng - Tầng 1 Nhà A	SCHOOL	EXHIBITION	Thầy Lê Quang Đạt	vanphong@hn-ams.edu.vn	Cung cấp giấy in đề thi, bút bi, đồ dùng phòng học và máy tính văn phòng	621cf917-d0da-4232-b833-b5e0e4306237	ACTIVE	2026-09-10 10:10:45.997	2026-09-14 11:14:52.128	0.00
a71b22cf-aa26-4093-98cb-039425dd46ec	KH004	Nhà sách & Văn Phòng Phẩm Minh Đức	0913988222	8345920192	142 Nguyễn Trãi, Thanh Xuân, Hà Nội	Kho phân phối Minh Đức - 142 Nguyễn Trãi	HOUSEHOLD	SELF_FOUND	Chị Trần Thị Minh	vppminhduc@gmail.com	Đại lý phân phối cấp 1, nhập số lượng lớn giấy in và bút viết theo quý	621cf917-d0da-4232-b833-b5e0e4306237	ACTIVE	2026-09-10 10:10:45.999	2026-09-14 11:14:52.129	0.00
27d75309-cefc-4d0b-964b-9e2369d6e9c0	KH005	Bệnh Viện Bạch Mai - Phòng Hành Chính Quản Trị	02438693731	0100778899	78 Giải Phóng, Phương Mai, Đống Đa, Hà Nội	Kho vật tư văn phòng - Tầng hầm Nhà P	ORGANIZATION	OTHER	Bác sĩ Vũ Tuấn Anh	vattu@bachmai.gov.vn	Cung cấp giấy in bệnh án, bìa hồ sơ bệnh nhân, bút viết y tế	621cf917-d0da-4232-b833-b5e0e4306237	ACTIVE	2026-09-10 10:10:46.001	2026-09-14 11:14:52.13	0.00
989dfadc-f7bd-46be-97e0-5191ca0050b7	KH0008	THCS đông á	393950301	12154514	Trịnh Văn Bô Hà Nội	Trịnh Văn Bô Hà Nội	Trường học	SELF_FOUND	Đinh Chi	\N	\N	621cf917-d0da-4232-b833-b5e0e4306237	ACTIVE	2026-09-11 12:41:51.793	2026-09-14 11:13:12.21	0.00
daf833ab-2074-4f1a-9635-f0990978e485	KH001	Công ty Cổ phần Tập Đoàn Công Nghệ CMC	02437689000	0100244112	Tòa nhà CMC, Phố Duy Tân, Cầu Giấy, Hà Nội	Tầng 12 Tòa nhà CMC, Phố Duy Tân, Cầu Giấy, Hà Nội	ENTERPRISE	REFERRAL	Anh Hoàng Hải (Trưởng phòng Hành chính)	hai.hoang@cmc.com.vn	Khách hàng ký hợp đồng nguyên tắc cung ứng VPP định kỳ mỗi tháng từ 20-30 triệu	621cf917-d0da-4232-b833-b5e0e4306237	ACTIVE	2026-09-10 10:10:45.986	2026-09-14 11:14:52.126	0.00
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, code, name, parent_id, manager_id, address, mission, avatar_url, status, created_at, updated_at) FROM stdin;
76e18620-0b57-4ab6-ba72-e643eabe10b8	BGD	Ban Giám Đốc Nam Khánh	\N	621cf917-d0da-4232-b833-b5e0e4306237	Trụ sở chính Hà Nội	Hoạch định chiến lược và điều hành toàn diện hệ thống phân phối văn phòng phẩm	\N	ACTIVE	2026-09-10 09:26:45.708	2026-09-14 11:14:52.07
07ef996f-c6cf-4258-806d-4ccd9b668987	KKD	Khối Kinh Doanh & Tiếp Thị	76e18620-0b57-4ab6-ba72-e643eabe10b8	621cf917-d0da-4232-b833-b5e0e4306237	Tầng 3 - Trụ sở Nam Khánh	Phát triển thị trường, cung ứng văn phòng phẩm cho doanh nghiệp, cơ quan & trường học	\N	ACTIVE	2026-09-10 09:26:45.714	2026-09-14 11:14:52.072
954e83a8-f351-485f-9695-dbe7489b0f75	PKD1	Phòng Kinh Doanh 1 (Dự Án)	07ef996f-c6cf-4258-806d-4ccd9b668987	621cf917-d0da-4232-b833-b5e0e4306237	Tầng 3 - P.301	Phụ trách cung ứng văn phòng phẩm trọn gói cho khối doanh nghiệp, ngân hàng & cơ quan	\N	ACTIVE	2026-09-10 09:26:45.716	2026-09-14 11:14:52.073
c24908c7-361a-4493-be0c-34c0d43ed158	PKD2	Phòng Kinh Doanh 2 (Bán Lẻ & Đại Lý)	07ef996f-c6cf-4258-806d-4ccd9b668987	621cf917-d0da-4232-b833-b5e0e4306237	Tầng 3 - P.302	Phát triển mạng lưới đại lý văn phòng phẩm, trường học và chuỗi cửa hàng bán lẻ	\N	ACTIVE	2026-09-10 09:26:45.717	2026-09-14 11:14:52.074
ce373d95-7ff3-4d28-83a0-550cf34ba4a5	PKT	Phòng Tài Chính - Kế Toán	76e18620-0b57-4ab6-ba72-e643eabe10b8	621cf917-d0da-4232-b833-b5e0e4306237	Tầng 2 - P.202	Quản trị dòng tiền, kiểm soát công nợ khách hàng và thu chi phân phối	\N	ACTIVE	2026-09-10 09:26:45.718	2026-09-14 11:14:52.074
557de49c-669d-4751-b3cc-750246f6a343	PKHO	Phòng Quản Lý Kho & Vận Chuyển	76e18620-0b57-4ab6-ba72-e643eabe10b8	621cf917-d0da-4232-b833-b5e0e4306237	Tổng kho Gia Lâm, Hà Nội	Tổng kho Văn phòng phẩm & Giấy in Nam Khánh - Lưu kho và điều phối giao nhận nhanh	\N	ACTIVE	2026-09-10 09:26:45.72	2026-09-14 11:14:52.075
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_categories (id, code, name, description, status, created_at, updated_at) FROM stdin;
4fd0455c-ec5f-43ff-a534-9c920274ef2e	CP-VP	Chi phí Quản lý Văn phòng	Tiền thuê mặt bằng, điện nước, internet, vật tư văn phòng nội bộ	ACTIVE	2026-09-10 16:00:20.014	2026-09-10 16:00:20.014
614d0974-6c44-42cf-a1ef-c03399ceb954	CP-BH	Chi phí Bán hàng & Vận chuyển	Xăng xe giao hàng, cước vận chuyển, tiếp khách, hoa hồng kinh doanh	ACTIVE	2026-09-10 16:00:20.018	2026-09-10 16:00:20.018
208d5175-65a1-4884-86c1-9413be717592	CP-NS	Chi phí Nhân sự & Đào tạo	Phụ cấp ăn trưa, công tác phí, hoạt động đào tạo, teambuilding	ACTIVE	2026-09-10 16:00:20.02	2026-09-10 16:00:20.02
\.


--
-- Data for Name: expense_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_types (id, code, name, category_id, description, status, created_at, updated_at) FROM stdin;
ff1119fa-c54d-4401-9352-3863f7d2e71f	LCP-THUE-NHA	Tiền thuê văn phòng & kho bãi	4fd0455c-ec5f-43ff-a534-9c920274ef2e	Thanh toán định kỳ hàng tháng	ACTIVE	2026-09-10 16:00:20.021	2026-09-10 16:00:20.021
b7ca629c-faef-4087-9e65-40bccf975059	LCP-DIEN-NUOC	Tiền điện, nước & Internet viễn thông	4fd0455c-ec5f-43ff-a534-9c920274ef2e	\N	ACTIVE	2026-09-10 16:00:20.026	2026-09-10 16:00:20.026
7f669675-7426-4164-b153-7bedccc33437	LCP-VAN-CHUYEN	Cước vận chuyển & Xăng xe giao hàng VPP	614d0974-6c44-42cf-a1ef-c03399ceb954	\N	ACTIVE	2026-09-10 16:00:20.028	2026-09-10 16:00:20.028
d120546b-06ce-42bb-ad48-8997eb2c166c	LCP-TIEP-KHACH	Chi phí tiếp khách & Đàm phán hợp đồng	614d0974-6c44-42cf-a1ef-c03399ceb954	\N	ACTIVE	2026-09-10 16:00:20.03	2026-09-10 16:00:20.03
\.


--
-- Data for Name: legal_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.legal_documents (id, code, title, type, file_url, file_name, file_size, mime_type, uploaded_by_id, created_at, updated_at) FROM stdin;
39f997f7-c622-4130-b2a1-58669d36497f	HD-MAU-01	Hợp đồng nguyên tắc cung ứng văn phòng phẩm trọn gói 2026	CONTRACT	/uploads/sample_contract_2026.pdf	hop_dong_nguyen_tac_vpp_nam_khanh_2026.pdf	1048576	application/pdf	621cf917-d0da-4232-b833-b5e0e4306237	2026-09-10 09:26:45.852	2026-09-14 11:14:52.076
21f784c5-6942-4fe1-9bf9-b1a567d53331	HD-MAU-02	Hợp đồng phân phối văn phòng phẩm cho hệ thống đại lý cấp 1	CONTRACT	/uploads/sample_transport_contract.docx	hop_dong_dai_ly_phan_phoi_vpp.docx	524288	application/vnd.openxmlformats-officedocument.wordprocessingml.document	621cf917-d0da-4232-b833-b5e0e4306237	2026-09-10 09:26:45.859	2026-09-14 11:14:52.078
8c3e4bcb-7266-4859-a49e-2b57e47d0938	CQ-2026-01	Chứng nhận ủy quyền phân phối & CO-CQ Giấy in, Bút viết, Văn phòng phẩm	CERTIFICATE	/uploads/chung_chi_co_cq_thep_2026.pdf	co_cq_giay_in_but_viet_nam_khanh.pdf	2097152	application/pdf	621cf917-d0da-4232-b833-b5e0e4306237	2026-09-10 09:26:45.863	2026-09-14 11:14:52.08
ad382b98-7fd9-40bd-b601-259364a9f3d2	NL-2026-02	Hồ sơ năng lực nhà cung cấp Văn phòng phẩm & Thiết bị văn phòng Nam Khánh 2026	CERTIFICATE	/uploads/ho_so_nang_luc_nam_khanh.pdf	ho_so_nang_luc_vpp_nam_khanh_2026.pdf	3145728	application/pdf	621cf917-d0da-4232-b833-b5e0e4306237	2026-09-10 09:26:45.866	2026-09-14 11:14:52.081
\.


--
-- Data for Name: order_handover_histories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_handover_histories (id, order_id, from_user_id, to_user_id, reason, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, product_code, product_name, unit, quantity, unit_price, amount, vat_rate, total) FROM stdin;
a7745472-039b-497b-aa18-cad26a5a6fd9	da0e5c71-1f6d-4875-bdbe-fabafdb9f25d	cfb11aeb-fbce-4f93-9893-77d923503c65	SP-GIAY-01	Giấy in Double A A4 70gsm (Chính hãng)	Ream	200	82000.00	16400000.00	8	17712000.00
066a7f64-bbcb-421a-a5e7-fbe3dc96055a	da0e5c71-1f6d-4875-bdbe-fabafdb9f25d	98cf2fbc-95fc-4c88-9126-70e5e9a1485b	SP-BUT-01	Bút bi Thiên Long TL-027 0.5mm (Xanh/Đen/Đỏ)	Hộp	50	95000.00	4750000.00	8	5130000.00
b297570a-a057-40d3-a01c-6ff64d123718	da0e5c71-1f6d-4875-bdbe-fabafdb9f25d	3285eb80-4d3f-4a0b-be14-954c851faabc	SP-BIA-01	File còng bật Kingjim 7cm A4 (Hai mặt xi)	Cái	44	65000.00	2850000.00	8	3078000.00
62c0de13-60d9-4e1b-aa6c-a9203919d9a9	1a31df3e-318d-49c0-8ed0-024d30ea50d6	0870dfd2-ac18-4d83-bab8-7d1b51ad57da	SP-GIAY-02	Giấy in PaperOne A4 80gsm	Ream	150	95000.00	14250000.00	8	15390000.00
4d9ab8ec-6b0d-4297-9870-8097e31e07d6	1a31df3e-318d-49c0-8ed0-024d30ea50d6	3285eb80-4d3f-4a0b-be14-954c851faabc	SP-BIA-01	File còng bật Kingjim 7cm A4 (Hai mặt xi)	Cái	42	65000.00	2750000.00	8	2970000.00
\.


--
-- Data for Name: order_return_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_return_items (id, return_id, product_id, product_code, product_name, unit, quantity, unit_price, amount) FROM stdin;
\.


--
-- Data for Name: order_returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_returns (id, code, order_id, return_date, reason, total_refund_amount, refund_method, status, created_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, code, customer_id, quotation_id, manager_id, order_date, delivery_date, delivery_address, contact_person, phone, delivery_status, payment_status, invoice_status, subtotal, vat_rate, vat_amount, total_amount, paid_amount, remaining_amount, notes, created_at, updated_at, adjusted_amount, adjustment_reason, refund_amount) FROM stdin;
da0e5c71-1f6d-4875-bdbe-fabafdb9f25d	DH-2026-0001	daf833ab-2074-4f1a-9635-f0990978e485	bb3876c2-4fd7-495a-b185-83465d594365	621cf917-d0da-4232-b833-b5e0e4306237	2026-03-02	2026-03-04	Tầng 12 Tòa nhà CMC, Phố Duy Tân, Cầu Giấy, Hà Nội	Anh Hoàng Hải (Trưởng phòng Hành chính)	02437689000	DELIVERED	PARTIAL_PAID	ISSUED	24000000.00	8	1920000.00	25920000.00	20000000.00	5920000.00	Đã giao hàng đầy đủ kèm phiếu xuất kho. Khách hàng đã thanh toán đợt 1 20 triệu, còn nợ 5.92 triệu	2026-09-10 10:10:46.012	2026-09-14 11:13:12.223	0.00	\N	0.00
1a31df3e-318d-49c0-8ed0-024d30ea50d6	DH-2026-0002	57ebb3f9-ee89-4452-9207-c0ab59ed8f73	\N	621cf917-d0da-4232-b833-b5e0e4306237	2026-03-06	2026-03-08	Kho Hành chính Vietcombank Thăng Long	Chị Nguyễn Phương Thảo (Phó phòng Quản trị)	02438313733	DELIVERING	PAID	ISSUED	17000000.00	8	1360000.00	18360000.00	18360000.00	0.00	Khách hàng chuyển khoản thanh toán 100% trước khi giao hàng. Đang vận chuyển xe tải.	2026-09-10 10:10:46.028	2026-09-14 11:13:12.223	0.00	\N	0.00
\.


--
-- Data for Name: payment_vouchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_vouchers (id, code, voucher_date, category_id, type_id, recipient, phone, address, reason, amount, payment_method, invoice_number, invoice_date, file_url, file_name, status, customer_id, order_id, created_by_id, approved_by_id, approved_at, rejected_reason, notes, created_at, updated_at) FROM stdin;
777a7e27-53e1-4f60-801e-69334e81b1d4	PC-2026-0001	2026-03-01	4fd0455c-ec5f-43ff-a534-9c920274ef2e	ff1119fa-c54d-4401-9352-3863f7d2e71f	Công ty CP Đầu Tư Địa Ốc Cầu Giấy	0988112233	Tầng 3, Tòa nhà Cầu Giấy, Hà Nội	Thanh toán tiền thuê văn phòng trụ sở chính Tháng 03/2026	15000000.00	BANK_TRANSFER	HD-THUE-0326	\N	\N	\N	PAID	\N	\N	621cf917-d0da-4232-b833-b5e0e4306237	621cf917-d0da-4232-b833-b5e0e4306237	2026-03-01 10:00:00	\N	Đã hoàn tất chuyển khoản Vietcombank	2026-09-10 16:00:20.047	2026-09-14 11:13:12.234
95ac51cf-e845-4b1e-adee-fa836a2d9cc4	PC-2026-0002	2026-03-05	614d0974-6c44-42cf-a1ef-c03399ceb954	7f669675-7426-4164-b153-7bedccc33437	Nguyễn Văn Hùng (Đội xe giao hàng)	0912345678	\N	Thanh toán xăng xe và phí cầu đường giao hàng tuần 1 tháng 3	2350000.00	CASH	\N	\N	\N	\N	PAID	\N	\N	621cf917-d0da-4232-b833-b5e0e4306237	621cf917-d0da-4232-b833-b5e0e4306237	2026-03-05 14:30:00	\N	\N	2026-09-10 16:00:20.052	2026-09-14 11:13:12.234
679f8949-912a-4bf6-afc0-96e82d97589e	PC-2026-0003	2026-03-08	614d0974-6c44-42cf-a1ef-c03399ceb954	d120546b-06ce-42bb-ad48-8997eb2c166c	Trần Văn Nam (Phòng Kinh Doanh)	0903456789	\N	Tiếp khách đàm phán hợp đồng cung cấp VPP khối cơ quan	3200000.00	CASH	\N	\N	\N	\N	APPROVED	\N	\N	621cf917-d0da-4232-b833-b5e0e4306237	621cf917-d0da-4232-b833-b5e0e4306237	2026-03-08 16:00:00	\N	Đã duyệt chi, chờ xuất quỹ	2026-09-10 16:00:20.055	2026-09-14 11:13:12.234
\.


--
-- Data for Name: product_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_types (id, code, name, category_id, unit, description, status, created_at, updated_at) FROM stdin;
03493537-de4a-4e87-91fd-767327a3c609	LH-GIAY-A4	Giấy in khổ A4	fb26f000-8920-4242-98cc-98160fa8a7de	Ream	Định lượng 70gsm, 80gsm tiêu chuẩn	ACTIVE	2026-09-10 11:01:55.139	2026-09-14 11:14:52.098
74491a47-d1ff-4fff-abb9-1076c2bbe15f	LH-GIAY-A3	Giấy in khổ A3	fb26f000-8920-4242-98cc-98160fa8a7de	Ream	Giấy in bản vẽ, sơ đồ A3	ACTIVE	2026-09-10 11:01:55.144	2026-09-14 11:14:52.1
8b72416a-5995-42e1-822a-eb41d47cd63c	LH-BUT-BI	Bút bi & Bút Gel	b61b0a68-a6c6-4553-b022-0279d2734d1d	Hộp	Bút viết hàng ngày cho nhân viên	ACTIVE	2026-09-10 11:01:55.146	2026-09-14 11:14:52.102
72f4e890-56a7-4d8b-95f1-f602d8fafde2	LH-BUT-KY	Bút ký cao cấp	b61b0a68-a6c6-4553-b022-0279d2734d1d	Cây	Bút ký hợp đồng, bút dạ kim	ACTIVE	2026-09-10 11:01:55.148	2026-09-14 11:14:52.104
c0a65922-6561-42e5-ae10-2aa083401bbf	LH-BIA-CONG	File bìa còng 5cm-7cm	0a009e92-8067-4eab-b1f4-786820dabfd1	Cái	Lưu trữ tài liệu kế toán dày	ACTIVE	2026-09-10 11:01:55.149	2026-09-14 11:14:52.105
a778d752-668d-4f08-9427-ab5bb2be7e5f	LH-BIA-NUT	Bìa lá & Bìa nút	0a009e92-8067-4eab-b1f4-786820dabfd1	Xấp	Bảo quản hồ sơ phân loại nhỏ	ACTIVE	2026-09-10 11:01:55.151	2026-09-14 11:14:52.105
df37093d-c9fe-4389-aa2e-7aa4a013bc11	LH-BAM-KIM	Máy bấm kim & Kim bấm	b727ff6e-1960-4e57-8830-d52b60bfe6e5	Cái	Bấm kim số 10, số 3, trợ lực	ACTIVE	2026-09-10 11:01:55.153	2026-09-14 11:14:52.106
9b287493-3994-4403-b3a4-53c28ab9aea6	LH-BANG-DINH	Băng dính & Dao cắt	b727ff6e-1960-4e57-8830-d52b60bfe6e5	Cuộn	Băng dính OPP dán thùng carton	ACTIVE	2026-09-10 11:01:55.154	2026-09-14 11:14:52.107
036e67c8-900e-4a29-bdce-abea07ed4b57	LH-MAY-TINH	Máy tính cầm tay kế toán	f18c89a2-2acd-46e8-9705-449d71f10362	Cái	Máy tính 12 số, máy tài chính	ACTIVE	2026-09-10 11:01:55.155	2026-09-14 11:14:52.108
e21193dc-9ba5-4920-9746-92c0c6df43f0	LH-MAY-HUY	Máy hủy tài liệu & Đóng gáy	f18c89a2-2acd-46e8-9705-449d71f10362	Máy	Hủy giấy văn phòng bảo mật	ACTIVE	2026-09-10 11:01:55.157	2026-09-14 11:14:52.108
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, code, name, category, unit, cost_price, selling_price, vat_rate, stock_quantity, description, status, created_at, updated_at, barcode, category_id, color, height, image_url, length, min_stock_level, product_type_id, supplier_id, warehouse_id, weight, width) FROM stdin;
d618cb3a-27cd-4de1-b0d4-f7a6dec0ef5c	SP-BUT-02	Bút ký Pentel EnerGel BL57 0.7mm	Bút viết & Mực	Cây	42000.00	58000.00	8	350	Bút gel mực nhanh khô không lem, đầu bi hợp kim siêu bền, chuyên dùng ký kết văn bản	ACTIVE	2026-09-10 10:10:45.975	2026-09-14 11:14:52.118	4902506070777	b61b0a68-a6c6-4553-b022-0279d2734d1d	Xanh đậm	\N	\N	\N	30	72f4e890-56a7-4d8b-95f1-f602d8fafde2	610b1545-9039-4f75-a752-af6c04883f00	ee4050e2-f903-4169-8d42-cbc2ec20c88c	\N	\N
eeb03d4a-1556-4563-a261-0df869b3cb85	SP-BIA-02	Bìa lá Plus A4 trong suốt (Độ dày 0.2mm)	File bìa còng & Lưu trữ	Xấp	55000.00	75000.00	8	400	Xấp 100 lá nhựa PP trong suốt, bảo quản tài liệu sạch đẹp không bám bụi	ACTIVE	2026-09-10 10:10:45.977	2026-09-14 11:14:52.121	4977564012345	0a009e92-8067-4eab-b1f4-786820dabfd1	Trong suốt	\N	\N	\N	40	a778d752-668d-4f08-9427-ab5bb2be7e5f	8494b166-7e0a-4f01-8e7b-685e6dcc0b65	ee4050e2-f903-4169-8d42-cbc2ec20c88c	\N	\N
86ee657d-6060-4cc0-b2bf-3d38fbb5b9e4	SP-DC-01	Máy bấm kim Max HD-10 Nhật Bản	Dụng cụ văn phòng	Cái	62000.00	85000.00	8	300	Máy bấm kim số 10 lực bấm nhẹ, thân bọc nhựa ABS cao cấp, bấm được 20 tờ	ACTIVE	2026-09-10 10:10:45.979	2026-09-14 11:14:52.123	4902870012348	b727ff6e-1960-4e57-8830-d52b60bfe6e5	Xanh, Xám	\N	\N	\N	25	df37093d-c9fe-4389-aa2e-7aa4a013bc11	011f4dc0-435a-416a-a0c3-5cd3aa6f33e8	4a52c4ed-1450-4b52-8037-9bf628f58f55	\N	\N
d443f89e-0cf3-4e58-8a4e-7bf6a43cde65	SP-MAY-01	Máy tính tài chính Casio FX-580VN X	Thiết bị & Máy văn phòng	Cái	520000.00	660000.00	10	150	521 tính năng, màn hình LCD độ phân giải cao, hỗ trợ kiểm toán và tính toán kế toán	ACTIVE	2026-09-10 10:10:45.981	2026-09-14 11:14:52.125	4549526605000	f18c89a2-2acd-46e8-9705-449d71f10362	Đen carbon	\N	\N	\N	15	036e67c8-900e-4a29-bdce-abea07ed4b57	011f4dc0-435a-416a-a0c3-5cd3aa6f33e8	4a52c4ed-1450-4b52-8037-9bf628f58f55	\N	\N
3285eb80-4d3f-4a0b-be14-954c851faabc	SP-BIA-01	File còng bật Kingjim 7cm A4 (Hai mặt xi)	File bìa còng & Lưu trữ	Cái	48000.00	65000.00	8	600	Còng sắt mạ niken chống gỉ, gáy 7cm chứa tối đa 500 tờ A4, lưu trữ chứng từ kế toán	ACTIVE	2026-09-10 10:10:45.976	2026-09-14 14:18:15.648	4971660007890	0a009e92-8067-4eab-b1f4-786820dabfd1	Xanh dương Kingjim	70.00	\N	318.00	50	c0a65922-6561-42e5-ae10-2aa083401bbf	8494b166-7e0a-4f01-8e7b-685e6dcc0b65	ee4050e2-f903-4169-8d42-cbc2ec20c88c	0.00	280.00
cfb11aeb-fbce-4f93-9893-77d923503c65	SP-GIAY-01	Giấy in Double A A4 70gsm (Chính hãng)	Giấy in văn phòng	Ream	68000.00	82000.00	8	1500	Giấy in cao cấp không kẹt giấy, độ trắng sáng 148-151 CIE, đóng gói 500 tờ/ream, 5 ream/thùng	ACTIVE	2026-09-10 10:10:45.964	2026-09-14 11:14:52.11	8858742900123	fb26f000-8920-4242-98cc-98160fa8a7de	Trắng 148 CIE	50.00	\N	297.00	200	03493537-de4a-4e87-91fd-767327a3c609	7a029006-1e64-4086-a9b0-cf76186e6188	ee4050e2-f903-4169-8d42-cbc2ec20c88c	2.50	210.00
0870dfd2-ac18-4d83-bab8-7d1b51ad57da	SP-GIAY-02	Giấy in PaperOne A4 80gsm	Giấy in văn phòng	Ream	78000.00	95000.00	8	1200	Giấy in định lượng 80gsm chuyên dùng in hợp đồng, chứng từ quan trọng và in 2 mặt	ACTIVE	2026-09-10 10:10:45.97	2026-09-14 11:14:52.114	8991389201991	fb26f000-8920-4242-98cc-98160fa8a7de	Trắng 160 CIE	55.00	\N	297.00	150	03493537-de4a-4e87-91fd-767327a3c609	7a029006-1e64-4086-a9b0-cf76186e6188	ee4050e2-f903-4169-8d42-cbc2ec20c88c	2.80	210.00
a3a304fe-fd43-43b5-adbc-ec8378304368	SP-GIAY-03	Giấy in Bãi Bằng Hồng Tem Vàng A4 70gsm	Giấy in văn phòng	Ream	52000.00	65000.00	8	800	Giấy in nội địa chất lượng cao, độ mịn đồng đều, tiết kiệm chi phí cho doanh nghiệp	ACTIVE	2026-09-10 10:10:45.972	2026-09-14 11:14:52.115	8935012304567	fb26f000-8920-4242-98cc-98160fa8a7de	Trắng 84-90 ISO	48.00	\N	297.00	100	03493537-de4a-4e87-91fd-767327a3c609	c120fcab-c834-4c09-89a2-d875420b82fb	ee4050e2-f903-4169-8d42-cbc2ec20c88c	2.20	210.00
98cf2fbc-95fc-4c88-9126-70e5e9a1485b	SP-BUT-01	Bút bi Thiên Long TL-027 0.5mm (Xanh/Đen/Đỏ)	Bút viết & Mực	Hộp	70000.00	95000.00	8	500	Hộp 20 cây bút bi mực trơn êm, nét viết thanh mảnh, mực đạt chuẩn an toàn quốc tế	ACTIVE	2026-09-10 10:10:45.973	2026-09-14 11:14:52.117	8935001802711	b61b0a68-a6c6-4553-b022-0279d2734d1d	Xanh, Đen, Đỏ	\N	\N	\N	50	8b72416a-5995-42e1-822a-eb41d47cd63c	610b1545-9039-4f75-a752-af6c04883f00	ee4050e2-f903-4169-8d42-cbc2ec20c88c	\N	\N
17cb6ecc-6ed7-4b82-80b9-5849a6ed95a3	SP-DC-02	Băng dính dán thùng OPP 4.8cm x 100Y (Trong/Đục)	Dụng cụ văn phòng	Cuộn	15000.00	22000.00	8	1000	Độ dính 50 mic, màng dai dẻo chịu lực tốt, phục vụ đóng thùng đóng kiện	ACTIVE	2026-09-10 10:10:45.98	2026-09-14 11:14:52.124	8936012890123	b727ff6e-1960-4e57-8830-d52b60bfe6e5	Trong / Vàng đục	\N	\N	\N	100	9b287493-3994-4403-b3a4-53c28ab9aea6	610b1545-9039-4f75-a752-af6c04883f00	4a52c4ed-1450-4b52-8037-9bf628f58f55	\N	\N
\.


--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_items (id, quotation_id, product_id, product_code, product_name, unit, quantity, unit_price, amount, vat_rate, total) FROM stdin;
086e5aa1-9742-47d0-9cdc-be09ad3dda32	bb3876c2-4fd7-495a-b185-83465d594365	cfb11aeb-fbce-4f93-9893-77d923503c65	SP-GIAY-01	Giấy in Double A A4 70gsm (Chính hãng)	Ream	200	82000.00	16400000.00	8	17712000.00
23ee8c89-b295-4ae7-a600-aba1c9c582a8	bb3876c2-4fd7-495a-b185-83465d594365	98cf2fbc-95fc-4c88-9126-70e5e9a1485b	SP-BUT-01	Bút bi Thiên Long TL-027 0.5mm (Xanh/Đen/Đỏ)	Hộp	50	95000.00	4750000.00	8	5130000.00
99c6035e-11f9-4aa9-8751-693b436255cb	bb3876c2-4fd7-495a-b185-83465d594365	3285eb80-4d3f-4a0b-be14-954c851faabc	SP-BIA-01	File còng bật Kingjim 7cm A4 (Hai mặt xi)	Cái	44	65000.00	2850000.00	8	3078000.00
4ab57875-d35c-419f-b962-c085d8b57c18	9e7f7af2-3d1a-4620-897e-bd5fc244ff5c	0870dfd2-ac18-4d83-bab8-7d1b51ad57da	SP-GIAY-02	Giấy in PaperOne A4 80gsm	Ream	150	95000.00	14250000.00	8	15390000.00
7f906a0f-2d72-4ee9-949e-d387f20e7e6c	9e7f7af2-3d1a-4620-897e-bd5fc244ff5c	3285eb80-4d3f-4a0b-be14-954c851faabc	SP-BIA-01	File còng bật Kingjim 7cm A4 (Hai mặt xi)	Cái	42	65000.00	2750000.00	8	2970000.00
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotations (id, code, customer_id, manager_id, date, valid_until, status, subtotal, vat_rate, vat_amount, total_amount, notes, created_at, updated_at) FROM stdin;
9e7f7af2-3d1a-4620-897e-bd5fc244ff5c	BG-2026-0002	57ebb3f9-ee89-4452-9207-c0ab59ed8f73	621cf917-d0da-4232-b833-b5e0e4306237	2026-03-05	2026-04-05	SENT	17000000.00	8	1360000.00	18360000.00	Báo giá lô giấy in PaperOne 80gsm và File còng Kingjim phục vụ lưu trữ hồ sơ thẻ ngân hàng	2026-09-10 10:10:46.023	2026-09-14 11:13:12.219
bb3876c2-4fd7-495a-b185-83465d594365	BG-2026-0001	daf833ab-2074-4f1a-9635-f0990978e485	621cf917-d0da-4232-b833-b5e0e4306237	2026-03-01	2026-03-31	CONFIRMED	24000000.00	8	1920000.00	25920000.00	Báo giá cung ứng giấy in và văn phòng phẩm tháng 03/2026 cho toàn bộ các khối phòng ban CMC	2026-09-10 10:10:46.003	2026-09-14 11:14:52.132
\.


--
-- Data for Name: receipt_voucher_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.receipt_voucher_allocations (id, voucher_id, order_id, amount, created_at) FROM stdin;
\.


--
-- Data for Name: receipt_vouchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.receipt_vouchers (id, code, voucher_date, type_id, payer, phone, address, reason, amount, payment_method, invoice_number, invoice_date, file_url, file_name, status, customer_id, order_id, created_by_id, approved_by_id, approved_at, rejected_reason, notes, created_at, updated_at) FROM stdin;
ef3232d0-8cf2-49d4-aa69-3e47b1517299	PT-2026-0001	2026-03-03	5fca915b-0110-4503-bdb7-4b1b2c69c624	Anh Hoàng Hải (Trưởng phòng Hành chính)	02437689000	Tòa nhà CMC, Phố Duy Tân, Cầu Giấy, Hà Nội	Thu tiền thanh toán đơn hàng VPP của Công ty Cổ phần Tập Đoàn Công Nghệ CMC	8500000.00	BANK_TRANSFER	UNC-TCB-88392	\N	\N	\N	PAID	daf833ab-2074-4f1a-9635-f0990978e485	da0e5c71-1f6d-4875-bdbe-fabafdb9f25d	621cf917-d0da-4232-b833-b5e0e4306237	621cf917-d0da-4232-b833-b5e0e4306237	2026-03-03 11:00:00	\N	Tiền đã về tài khoản Techcombank Nam Khánh	2026-09-10 16:00:20.057	2026-09-14 11:13:12.239
28334a9c-8da7-486b-bb32-d6e3e5e3204c	PT-2026-0002	2026-03-09	5fca915b-0110-4503-bdb7-4b1b2c69c624	Phạm Thị Lan	0977665544	Thanh Xuân, Hà Nội	Đặt cọc 50% đơn hàng vật tư và giấy in văn phòng quý 1	5000000.00	CASH	\N	\N	\N	\N	PENDING	daf833ab-2074-4f1a-9635-f0990978e485	\N	621cf917-d0da-4232-b833-b5e0e4306237	621cf917-d0da-4232-b833-b5e0e4306237	\N	\N	\N	2026-09-10 16:00:20.062	2026-09-14 11:13:12.239
\.


--
-- Data for Name: revenue_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.revenue_types (id, code, name, description, status, created_at, updated_at) FROM stdin;
5fca915b-0110-4503-bdb7-4b1b2c69c624	KT-BAN-HANG	Thu tiền bán hàng Văn phòng phẩm	Thu tiền khách hàng thanh toán đơn hàng VPP	ACTIVE	2026-09-10 16:00:20.031	2026-09-10 16:00:20.031
5113c303-24e2-46d9-8e24-79125b3836e6	KT-DICH-VU-IN	Thu dịch vụ in ấn & đóng cuốn	Gia công đóng bìa còng, in ấn tài liệu	ACTIVE	2026-09-10 16:00:20.036	2026-09-10 16:00:20.036
c50a48e0-abab-4fed-9315-35a83eb736a4	KT-HOAN-UNG	Thu hoàn ứng công tác phí	Nhân viên hoàn ứng sau khi hoàn tất công tác	ACTIVE	2026-09-10 16:00:20.038	2026-09-10 16:00:20.038
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, module_code, can_create, can_read, can_update, can_delete, data_scope, created_at, updated_at) FROM stdin;
0d05bf47-7b2e-4221-92e5-6c80489ac7ac	4cde6db8-044f-4e90-ae63-5ebc99aab403	C_CATEGORIES	t	t	t	t	ALL	2026-09-10 09:26:45.572	2026-09-14 11:14:51.897
aa5861c5-a148-4939-8163-99cb9e2b74da	4cde6db8-044f-4e90-ae63-5ebc99aab403	C_PRODUCT_TYPES	t	t	t	t	ALL	2026-09-10 09:26:45.572	2026-09-14 11:14:51.897
b341e48d-b3f0-44fb-9a85-d6dd28f5e57a	4cde6db8-044f-4e90-ae63-5ebc99aab403	C_PRODUCTS	t	t	t	t	ALL	2026-09-10 09:26:45.573	2026-09-14 11:14:51.898
7cdf9939-4b92-46ad-b510-7e64169a10a6	4cde6db8-044f-4e90-ae63-5ebc99aab403	C_SUPPLIERS	t	t	t	t	ALL	2026-09-10 09:26:45.574	2026-09-14 11:14:51.898
34573d0d-3817-42f1-b201-4a8f7fdb5d14	4cde6db8-044f-4e90-ae63-5ebc99aab403	C_REPORTS	t	t	t	t	ALL	2026-09-10 09:26:45.575	2026-09-14 11:14:51.899
8fc3eaf9-fb02-4881-8bcb-3ab4933f2bc8	4cde6db8-044f-4e90-ae63-5ebc99aab403	B_CUSTOMERS	t	t	t	t	ALL	2026-09-10 09:26:45.577	2026-09-14 11:14:51.9
63282754-df55-4d59-8596-b46deeae37c3	4cde6db8-044f-4e90-ae63-5ebc99aab403	B_SALES_OVERVIEW	t	t	t	t	ALL	2026-09-10 09:26:45.578	2026-09-14 11:14:51.9
474a3183-d2bd-4464-a510-79d3dbd34df8	4cde6db8-044f-4e90-ae63-5ebc99aab403	B_QUOTATIONS	t	t	t	t	ALL	2026-09-10 09:26:45.579	2026-09-14 11:14:51.901
79b32d13-b0d2-4a96-a63b-88e16e5a9449	4cde6db8-044f-4e90-ae63-5ebc99aab403	B_ORDERS	t	t	t	t	ALL	2026-09-10 09:26:45.58	2026-09-14 11:14:51.902
13a7f468-9ee0-41e4-9cd1-1abc132850d7	4cde6db8-044f-4e90-ae63-5ebc99aab403	B_REPORTS	t	t	t	t	ALL	2026-09-10 09:26:45.581	2026-09-14 11:14:51.902
17c54fed-2900-4e26-afd6-35824feaf17d	4cde6db8-044f-4e90-ae63-5ebc99aab403	B_SALES_PLANS	t	t	t	t	ALL	2026-09-10 09:26:45.582	2026-09-14 11:14:51.903
7b7a73d7-d961-4908-98d2-1108abd471b4	4cde6db8-044f-4e90-ae63-5ebc99aab403	E_EXPENSES	t	t	t	t	ALL	2026-09-10 09:26:45.583	2026-09-14 11:14:51.903
b6c0d116-46c9-4ac1-a2b5-8053c18c2f18	4cde6db8-044f-4e90-ae63-5ebc99aab403	E_PAYMENT_VOUCHERS	t	t	t	t	ALL	2026-09-10 09:26:45.584	2026-09-14 11:14:51.904
888b7e2f-47f1-4804-8ebb-3ca74960dc46	4cde6db8-044f-4e90-ae63-5ebc99aab403	E_REVENUE_TYPES	t	t	t	t	ALL	2026-09-10 09:26:45.585	2026-09-14 11:14:51.905
5ec25926-2c84-49a1-bc2f-d1a1f868f106	4cde6db8-044f-4e90-ae63-5ebc99aab403	E_RECEIPT_VOUCHERS	t	t	t	t	ALL	2026-09-10 09:26:45.586	2026-09-14 11:14:51.906
6ce82f11-92b3-491a-8437-5c086bb71d93	4cde6db8-044f-4e90-ae63-5ebc99aab403	E_CASHFLOW_REPORTS	t	t	t	t	ALL	2026-09-10 09:26:45.587	2026-09-14 11:14:51.907
7cc010eb-794d-4377-9442-908e00d8aaed	4cde6db8-044f-4e90-ae63-5ebc99aab403	F_DASHBOARD_REVENUE	t	t	t	t	ALL	2026-09-10 09:26:45.588	2026-09-14 11:14:51.908
144126d7-9bae-4df3-9604-58c15479b020	4cde6db8-044f-4e90-ae63-5ebc99aab403	F_DASHBOARD_PROFIT	t	t	t	t	ALL	2026-09-10 09:26:45.589	2026-09-14 11:14:51.908
afb50e4a-ba0a-4aaa-a8fd-94520a8bc77f	11099a08-0b1e-402f-9382-c7bac00bcef9	A_DEPARTMENTS	t	t	t	t	ALL	2026-09-10 09:26:45.591	2026-09-14 11:14:51.909
74cfd53a-35d5-471b-a613-0be870665d74	11099a08-0b1e-402f-9382-c7bac00bcef9	A_USERS	t	t	t	t	ALL	2026-09-10 09:26:45.592	2026-09-14 11:14:51.91
c2b6b8ec-d4d0-4a90-b274-b832b9883251	11099a08-0b1e-402f-9382-c7bac00bcef9	A_ROLES	t	t	t	t	ALL	2026-09-10 09:26:45.593	2026-09-14 11:14:51.911
48194ca8-e8fe-4aff-acc7-ea21704419ed	11099a08-0b1e-402f-9382-c7bac00bcef9	A_PERMISSIONS	t	t	t	t	ALL	2026-09-10 09:26:45.594	2026-09-14 11:14:51.911
a37ccbc0-895d-4416-8195-91a8bb816f98	11099a08-0b1e-402f-9382-c7bac00bcef9	A_DOCUMENTS	t	t	t	t	ALL	2026-09-10 09:26:45.595	2026-09-14 11:14:51.912
90aeca01-fdfc-4ff4-9807-fbbc65ecff15	11099a08-0b1e-402f-9382-c7bac00bcef9	C_OVERVIEW	t	t	t	t	ALL	2026-09-10 09:26:45.596	2026-09-14 11:14:51.913
3e3d75bb-d522-43db-a046-96c95efa4715	11099a08-0b1e-402f-9382-c7bac00bcef9	C_WAREHOUSES	t	t	t	t	ALL	2026-09-10 09:26:45.597	2026-09-14 11:14:51.913
7a3a9bc3-a2f5-452d-a226-93d229858bf5	11099a08-0b1e-402f-9382-c7bac00bcef9	C_CATEGORIES	t	t	t	t	ALL	2026-09-10 09:26:45.597	2026-09-14 11:14:51.914
ddb4bf4c-849b-4526-b6d6-75489005f66e	11099a08-0b1e-402f-9382-c7bac00bcef9	C_PRODUCT_TYPES	t	t	t	t	ALL	2026-09-10 09:26:45.598	2026-09-14 11:14:51.914
57b0fece-d6a1-443a-9845-6f2216e9b865	11099a08-0b1e-402f-9382-c7bac00bcef9	C_PRODUCTS	t	t	t	t	ALL	2026-09-10 09:26:45.599	2026-09-14 11:14:51.915
b0b0a118-82d3-45a8-9dc8-ed139db528ea	11099a08-0b1e-402f-9382-c7bac00bcef9	C_SUPPLIERS	t	t	t	t	ALL	2026-09-10 09:26:45.6	2026-09-14 11:14:51.915
a8a298fd-0bb1-4bf7-9291-b56cb39118e7	11099a08-0b1e-402f-9382-c7bac00bcef9	C_REPORTS	t	t	t	t	ALL	2026-09-10 09:26:45.601	2026-09-14 11:14:51.916
03c9ef4e-144b-49e6-95de-30f50f7c6bfc	11099a08-0b1e-402f-9382-c7bac00bcef9	B_CUSTOMERS	t	t	t	t	ALL	2026-09-10 09:26:45.602	2026-09-14 11:14:51.916
7f8421d2-1b15-46c0-8073-5fcca438760c	11099a08-0b1e-402f-9382-c7bac00bcef9	B_SALES_OVERVIEW	t	t	t	t	ALL	2026-09-10 09:26:45.603	2026-09-14 11:14:51.917
e9e92f1c-5d9e-46e8-814c-bec9fc0b0be8	11099a08-0b1e-402f-9382-c7bac00bcef9	B_QUOTATIONS	t	t	t	t	ALL	2026-09-10 09:26:45.604	2026-09-14 11:14:51.918
3496f858-020d-4ac9-8b17-0bfa4ebad494	11099a08-0b1e-402f-9382-c7bac00bcef9	B_ORDERS	t	t	t	t	ALL	2026-09-10 09:26:45.605	2026-09-14 11:14:51.918
7952a06d-a3ff-4b4a-93c3-8d0f3dd15483	11099a08-0b1e-402f-9382-c7bac00bcef9	B_SALES_PLANS	t	t	t	t	ALL	2026-09-10 09:26:45.607	2026-09-14 11:14:51.92
411ddc05-8a86-4a15-92ec-e9b44693f188	11099a08-0b1e-402f-9382-c7bac00bcef9	E_EXPENSES	t	t	t	t	ALL	2026-09-10 09:26:45.608	2026-09-14 11:14:51.92
70d6365b-1a2c-4504-bc78-8f320a9109cd	11099a08-0b1e-402f-9382-c7bac00bcef9	E_PAYMENT_VOUCHERS	t	t	t	t	ALL	2026-09-10 09:26:45.609	2026-09-14 11:14:51.922
257d6aa9-ed7d-44cd-b3ff-df671c32ef50	11099a08-0b1e-402f-9382-c7bac00bcef9	E_REVENUE_TYPES	t	t	t	t	ALL	2026-09-10 09:26:45.61	2026-09-14 11:14:51.922
063f7b41-c2d5-49c0-9beb-9040ade66ae4	11099a08-0b1e-402f-9382-c7bac00bcef9	E_RECEIPT_VOUCHERS	t	t	t	t	ALL	2026-09-10 09:26:45.611	2026-09-14 11:14:51.923
457062d1-8eb9-4bb6-a3c2-48c763b48f42	11099a08-0b1e-402f-9382-c7bac00bcef9	E_CASHFLOW_REPORTS	t	t	t	t	ALL	2026-09-10 09:26:45.612	2026-09-14 11:14:51.924
74647b42-12cf-4c11-9e21-86e267d7ecea	11099a08-0b1e-402f-9382-c7bac00bcef9	F_DASHBOARD_REVENUE	t	t	t	t	ALL	2026-09-10 09:26:45.613	2026-09-14 11:14:51.925
80f2a7c3-b077-4c8f-929f-a259dc36324d	11099a08-0b1e-402f-9382-c7bac00bcef9	F_DASHBOARD_PROFIT	t	t	t	t	ALL	2026-09-10 09:26:45.614	2026-09-14 11:14:51.926
3c0fe79d-fd4b-41a1-8096-af4c9ccf27ba	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	A_DEPARTMENTS	f	t	f	f	PERSONAL	2026-09-10 09:26:45.615	2026-09-14 11:14:51.926
379aae96-ab7d-41c0-80dc-46c23c9b2e42	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	A_USERS	f	t	f	f	PERSONAL	2026-09-10 09:26:45.615	2026-09-14 11:14:51.927
46e275f1-0d6d-4b1e-9a56-e3c214a3ba53	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	A_ROLES	f	t	f	f	PERSONAL	2026-09-10 09:26:45.616	2026-09-14 11:14:51.928
b308e9c5-9bdc-44e4-9449-a0f9190d7b07	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	A_PERMISSIONS	f	t	f	f	PERSONAL	2026-09-10 09:26:45.617	2026-09-14 11:14:51.928
ee41fa1f-1177-40f4-840d-3bc2e8fd7511	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	A_DOCUMENTS	t	t	t	t	DEPARTMENT	2026-09-10 09:26:45.618	2026-09-14 11:14:51.929
1ac1b403-a1ab-4a32-952b-5f8640c2217c	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	C_OVERVIEW	f	t	f	f	PERSONAL	2026-09-10 09:26:45.619	2026-09-14 11:14:51.93
ead7af68-a84d-4438-8a2e-f326104e4a37	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	C_WAREHOUSES	f	t	f	f	PERSONAL	2026-09-10 09:26:45.62	2026-09-14 11:14:51.931
5cfb1607-3959-477e-8a65-8d1882eeee00	4cde6db8-044f-4e90-ae63-5ebc99aab403	A_USERS	t	t	t	t	ALL	2026-09-10 09:26:45.563	2026-09-14 11:14:51.891
03566cb5-c704-45b5-ac76-26cbcd703720	4cde6db8-044f-4e90-ae63-5ebc99aab403	A_ROLES	t	t	t	t	ALL	2026-09-10 09:26:45.565	2026-09-14 11:14:51.892
56767eff-9b69-46a4-84a0-ddc02b701daa	4cde6db8-044f-4e90-ae63-5ebc99aab403	A_PERMISSIONS	t	t	t	t	ALL	2026-09-10 09:26:45.566	2026-09-14 11:14:51.893
e68189f3-3839-40bc-8228-e36fd8b0fdbc	4cde6db8-044f-4e90-ae63-5ebc99aab403	A_DOCUMENTS	t	t	t	t	ALL	2026-09-10 09:26:45.568	2026-09-14 11:14:51.894
a9bf8ea7-a345-4405-98c2-09b7c62b02ac	4cde6db8-044f-4e90-ae63-5ebc99aab403	C_OVERVIEW	t	t	t	t	ALL	2026-09-10 09:26:45.569	2026-09-14 11:14:51.895
953a4a23-fc8d-4eea-9398-849fe0c8817c	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	B_SALES_OVERVIEW	t	t	t	t	DEPARTMENT	2026-09-10 09:26:45.627	2026-09-14 11:14:51.935
d1ab4659-e288-4031-9489-d245d4176f2d	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	B_QUOTATIONS	t	t	t	t	DEPARTMENT	2026-09-10 09:26:45.628	2026-09-14 11:14:51.935
5d925930-93f7-406a-9598-3c0bb1487426	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	B_ORDERS	t	t	t	f	DEPARTMENT	2026-09-10 09:26:45.629	2026-09-14 11:14:51.936
9f3dc977-1147-4d6a-a7f3-fe044b3a6452	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	B_REPORTS	t	t	t	t	DEPARTMENT	2026-09-10 09:26:45.63	2026-09-14 11:14:51.937
b9187378-f98d-4e8d-bd94-4a59c2c150dc	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	B_SALES_PLANS	t	t	t	t	DEPARTMENT	2026-09-10 09:26:45.631	2026-09-14 11:14:51.938
d064eaf5-dea3-4045-8ba3-3251dc339098	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	E_EXPENSES	f	t	f	f	PERSONAL	2026-09-10 09:26:45.632	2026-09-14 11:14:51.938
8701359b-7b5a-4bbb-a10f-31bb7d6921b6	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	E_PAYMENT_VOUCHERS	f	t	f	f	PERSONAL	2026-09-10 09:26:45.633	2026-09-14 11:14:51.939
a0b13309-1e14-43d6-b3b4-cbe79f44f919	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	E_REVENUE_TYPES	f	t	f	f	PERSONAL	2026-09-10 09:26:45.634	2026-09-14 11:14:51.939
e9d33794-a302-4d85-a06a-98b3d85bd7d0	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	E_RECEIPT_VOUCHERS	f	t	f	f	PERSONAL	2026-09-10 09:26:45.635	2026-09-14 11:14:51.94
684b389e-9d5c-4ae6-8caa-da738f83f754	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	E_CASHFLOW_REPORTS	f	t	f	f	PERSONAL	2026-09-10 09:26:45.635	2026-09-14 11:14:51.941
dde880fe-7708-43df-bb1e-f1f69c73d7f9	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	F_DASHBOARD_REVENUE	t	t	t	t	DEPARTMENT	2026-09-10 09:26:45.636	2026-09-14 11:14:51.942
da381af2-44a5-4520-a7fc-6784d091cba2	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	F_DASHBOARD_PROFIT	t	t	t	t	DEPARTMENT	2026-09-10 09:26:45.637	2026-09-14 11:14:51.942
f6d1e82e-328c-4e41-9c01-3ae72caf0c40	0d1c1a22-e991-404b-858a-e23dbd635307	A_DEPARTMENTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.638	2026-09-14 11:14:51.943
149e22c6-c6ca-4a30-b95a-f4a6da7c0a28	0d1c1a22-e991-404b-858a-e23dbd635307	A_USERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.639	2026-09-14 11:14:51.943
463a5799-4941-4a49-9221-6d6cdc22c7a6	0d1c1a22-e991-404b-858a-e23dbd635307	A_ROLES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.64	2026-09-14 11:14:51.944
b136e761-2e15-4c05-8146-ef48e0642ebc	0d1c1a22-e991-404b-858a-e23dbd635307	A_PERMISSIONS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.641	2026-09-14 11:14:51.944
8d0be303-1a3d-4768-a558-9048d417d916	0d1c1a22-e991-404b-858a-e23dbd635307	A_DOCUMENTS	t	t	t	f	PERSONAL	2026-09-10 09:26:45.642	2026-09-14 11:14:51.945
8dad0795-052a-4ac4-94fb-b8cad712d279	0d1c1a22-e991-404b-858a-e23dbd635307	C_OVERVIEW	f	f	f	f	PERSONAL	2026-09-10 09:26:45.643	2026-09-14 11:14:51.946
d83b2e95-c0e4-4818-94c0-2792ed6205e5	0d1c1a22-e991-404b-858a-e23dbd635307	C_WAREHOUSES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.643	2026-09-14 11:14:51.946
1921018c-f3b3-4032-8799-82260691e927	0d1c1a22-e991-404b-858a-e23dbd635307	C_CATEGORIES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.644	2026-09-14 11:14:51.947
595d8bc0-ecfb-4ab5-b13c-b4508b43e179	0d1c1a22-e991-404b-858a-e23dbd635307	C_PRODUCT_TYPES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.645	2026-09-14 11:14:51.948
9628206e-ece0-47f9-bd9b-244ac61d1c08	0d1c1a22-e991-404b-858a-e23dbd635307	C_PRODUCTS	t	t	t	f	PERSONAL	2026-09-10 09:26:45.646	2026-09-14 11:14:51.948
dacfa6d6-cf15-4b69-9fd4-bd1367ddeeb5	0d1c1a22-e991-404b-858a-e23dbd635307	C_SUPPLIERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.647	2026-09-14 11:14:51.949
6b34e46f-46e4-4cff-a114-b1884c8bb4cc	0d1c1a22-e991-404b-858a-e23dbd635307	C_REPORTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.648	2026-09-14 11:14:51.949
5161dcbc-2847-44cc-9479-37954aeaa26e	0d1c1a22-e991-404b-858a-e23dbd635307	B_CUSTOMERS	t	t	t	f	PERSONAL	2026-09-10 09:26:45.649	2026-09-14 11:14:51.95
24b68ee7-76b6-44d2-b39d-e77acc692903	0d1c1a22-e991-404b-858a-e23dbd635307	B_SALES_OVERVIEW	f	f	f	f	PERSONAL	2026-09-10 09:26:45.65	2026-09-14 11:14:51.95
a2b6e2a8-d920-4188-bc95-635f6b00db61	0d1c1a22-e991-404b-858a-e23dbd635307	B_QUOTATIONS	t	t	t	f	PERSONAL	2026-09-10 09:26:45.65	2026-09-14 11:14:51.951
cfd2e97b-5213-4417-8875-671e1436fb26	0d1c1a22-e991-404b-858a-e23dbd635307	B_ORDERS	t	t	t	f	PERSONAL	2026-09-10 09:26:45.651	2026-09-14 11:14:51.952
ba0003c4-d9bb-463c-8648-db2ee76fe6ec	0d1c1a22-e991-404b-858a-e23dbd635307	B_REPORTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.652	2026-09-14 11:14:51.952
c3c9bc4e-8c66-4f21-b501-e24c4dcc5613	0d1c1a22-e991-404b-858a-e23dbd635307	E_EXPENSES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.654	2026-09-14 11:14:51.954
e2ab6fa9-c98b-4820-b3fc-3113de017be8	0d1c1a22-e991-404b-858a-e23dbd635307	E_PAYMENT_VOUCHERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.655	2026-09-14 11:14:51.955
6891c3de-0520-40c0-aeb0-fda22ddb56b9	0d1c1a22-e991-404b-858a-e23dbd635307	E_REVENUE_TYPES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.656	2026-09-14 11:14:51.956
1411d48d-92a6-4fd8-acbc-00bf182db330	0d1c1a22-e991-404b-858a-e23dbd635307	E_RECEIPT_VOUCHERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.657	2026-09-14 11:14:51.957
3e990b23-81dc-44db-adfb-f00fe3307e83	0d1c1a22-e991-404b-858a-e23dbd635307	E_CASHFLOW_REPORTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.658	2026-09-14 11:14:51.957
4685b6ef-c722-4293-b93e-ef269bbc5a0a	0d1c1a22-e991-404b-858a-e23dbd635307	F_DASHBOARD_REVENUE	f	f	f	f	PERSONAL	2026-09-10 09:26:45.66	2026-09-14 11:14:51.958
13be3446-edce-4cd5-a4b8-01345ea4d9fc	0d1c1a22-e991-404b-858a-e23dbd635307	F_DASHBOARD_PROFIT	f	f	f	f	PERSONAL	2026-09-10 09:26:45.661	2026-09-14 11:14:51.959
0ce6f8ae-c0da-4d8a-84b9-61725613e8a0	f092fee3-596d-4f39-8cde-02f3046c591a	A_DEPARTMENTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.663	2026-09-14 11:14:51.959
359396d2-9eea-41ae-ae86-97d1f527d272	f092fee3-596d-4f39-8cde-02f3046c591a	A_USERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.664	2026-09-14 11:14:51.96
8d66f481-3731-4dbf-acb2-11f293f46028	f092fee3-596d-4f39-8cde-02f3046c591a	A_ROLES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.665	2026-09-14 11:14:51.96
391077a0-b53a-4150-9de0-2b352671f55e	f092fee3-596d-4f39-8cde-02f3046c591a	A_PERMISSIONS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.665	2026-09-14 11:14:51.961
8d2b8b61-f4b4-46c2-b96d-e7afefe06b66	f092fee3-596d-4f39-8cde-02f3046c591a	A_DOCUMENTS	t	t	t	f	ALL	2026-09-10 09:26:45.666	2026-09-14 11:14:51.962
87e95771-e679-4d48-8c5a-ebbf4a703f12	f092fee3-596d-4f39-8cde-02f3046c591a	C_OVERVIEW	f	f	f	f	PERSONAL	2026-09-10 09:26:45.667	2026-09-14 11:14:51.963
05435391-844e-437d-a58c-78372d4e4523	f092fee3-596d-4f39-8cde-02f3046c591a	C_WAREHOUSES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.668	2026-09-14 11:14:51.964
d043e539-18d8-46fa-a588-45a35d1acf5b	f092fee3-596d-4f39-8cde-02f3046c591a	C_CATEGORIES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.669	2026-09-14 11:14:51.964
24d377bb-d21d-4e4b-a692-0babd13c608c	f092fee3-596d-4f39-8cde-02f3046c591a	C_PRODUCT_TYPES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.67	2026-09-14 11:14:51.965
ceaa531c-dad3-43f7-b5f1-17de110c1ac0	f092fee3-596d-4f39-8cde-02f3046c591a	C_PRODUCTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.67	2026-09-14 11:14:51.965
b360da62-19d0-4755-9f40-f5964dae7f77	f092fee3-596d-4f39-8cde-02f3046c591a	C_SUPPLIERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.671	2026-09-14 11:14:51.966
7de299e8-7f37-4314-b8bb-03cc63bd0087	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	C_PRODUCT_TYPES	f	t	f	f	PERSONAL	2026-09-10 09:26:45.623	2026-09-14 11:14:51.932
f1ff97a5-3863-48b3-b5ab-a8d06f70805d	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	C_PRODUCTS	f	t	f	f	PERSONAL	2026-09-10 09:26:45.623	2026-09-14 11:14:51.933
39518f5d-fb0f-4dda-a05e-4f2c1db73538	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	C_SUPPLIERS	f	t	f	f	PERSONAL	2026-09-10 09:26:45.624	2026-09-14 11:14:51.933
949a5908-e723-450b-9ca0-57796955681e	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	C_REPORTS	f	t	f	f	PERSONAL	2026-09-10 09:26:45.625	2026-09-14 11:14:51.934
d5ee23db-4294-44d1-b08f-dcf4b0768d2a	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	B_CUSTOMERS	t	t	t	t	DEPARTMENT	2026-09-10 09:26:45.626	2026-09-14 11:14:51.934
c63d8d40-eae6-47f3-becc-5a2c3e1c9b7f	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	C_SUPPLIERS	t	t	t	f	ALL	2026-09-10 09:26:45.694	2026-09-14 11:14:51.981
0d2eb982-8eb6-4d5b-a172-9ca2f258fcf5	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	C_REPORTS	t	t	t	f	ALL	2026-09-10 09:26:45.695	2026-09-14 11:14:51.982
ec6da2a5-0ce4-4592-9cc8-645905e8adda	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	B_CUSTOMERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.696	2026-09-14 11:14:51.982
25b94d09-5f3e-4dbc-8c20-38e71bb502ca	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	B_SALES_OVERVIEW	f	f	f	f	PERSONAL	2026-09-10 09:26:45.697	2026-09-14 11:14:51.983
ba2516c2-c530-43bb-933c-dfcdfcb37e9e	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	B_REPORTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.699	2026-09-14 11:14:51.984
8b677715-399e-494a-8920-bce0aac82850	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	B_SALES_PLANS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.7	2026-09-14 11:14:51.985
0cf20c86-d2a9-4420-b84a-1470a12256c8	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	E_EXPENSES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.701	2026-09-14 11:14:51.986
b7b24d98-f294-4f14-8fab-7b66f94c6a7b	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	E_PAYMENT_VOUCHERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.702	2026-09-14 11:14:51.986
4d9881dd-683c-4279-bc81-cb5c1c3aca36	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	E_RECEIPT_VOUCHERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.703	2026-09-14 11:14:51.987
c813189a-e622-4071-9c2f-88de83afba40	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	E_CASHFLOW_REPORTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.704	2026-09-14 11:14:51.988
4a49312f-10db-43be-bb92-1a7eed500b78	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	F_DASHBOARD_REVENUE	f	f	f	f	PERSONAL	2026-09-10 09:26:45.705	2026-09-14 11:14:51.988
8959fbbd-4975-459a-b278-73790b563817	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	F_DASHBOARD_PROFIT	f	f	f	f	PERSONAL	2026-09-10 09:26:45.706	2026-09-14 11:14:51.989
96dbcd4e-ebc2-4d27-94e8-767f1f2e1837	4cde6db8-044f-4e90-ae63-5ebc99aab403	A_DEPARTMENTS	t	t	t	t	ALL	2026-09-10 09:26:45.558	2026-09-14 11:14:51.889
c17bd768-c29b-4a77-9333-eba1b4378bc5	4cde6db8-044f-4e90-ae63-5ebc99aab403	C_WAREHOUSES	t	t	t	t	ALL	2026-09-10 09:26:45.57	2026-09-14 11:14:51.896
000eacef-80c7-4b8c-ac85-01e83e27a232	11099a08-0b1e-402f-9382-c7bac00bcef9	B_REPORTS	t	t	t	t	ALL	2026-09-10 09:26:45.606	2026-09-14 11:14:51.919
c18039ae-c77f-46d2-818f-7fce8804d19b	15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	C_CATEGORIES	f	t	f	f	PERSONAL	2026-09-10 09:26:45.621	2026-09-14 11:14:51.931
d2837979-3d0e-4420-9182-c93354f71601	0d1c1a22-e991-404b-858a-e23dbd635307	B_SALES_PLANS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.653	2026-09-14 11:14:51.953
f42aeed1-6f81-44c3-8544-2415170f0cc3	f092fee3-596d-4f39-8cde-02f3046c591a	C_REPORTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.674	2026-09-14 11:14:51.966
f7f6a42e-78f2-4331-9c64-d9a288c792f9	f092fee3-596d-4f39-8cde-02f3046c591a	B_SALES_OVERVIEW	f	f	f	f	PERSONAL	2026-09-10 09:26:45.676	2026-09-14 11:14:51.968
0b27d5ee-68d9-4b3e-917d-0d4dbb55974a	f092fee3-596d-4f39-8cde-02f3046c591a	B_QUOTATIONS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.677	2026-09-14 11:14:51.968
46469a5a-0a3d-4c5f-9302-75607aa1fe26	f092fee3-596d-4f39-8cde-02f3046c591a	B_ORDERS	t	t	t	f	ALL	2026-09-10 09:26:45.678	2026-09-14 11:14:51.969
d8b16325-73b3-44cc-87c6-72fe40139fc6	f092fee3-596d-4f39-8cde-02f3046c591a	B_REPORTS	t	t	t	f	ALL	2026-09-10 09:26:45.679	2026-09-14 11:14:51.97
1ec28e20-126b-446c-8566-412762aeef38	f092fee3-596d-4f39-8cde-02f3046c591a	B_SALES_PLANS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.68	2026-09-14 11:14:51.97
1fab9b45-a9ac-404d-9d3f-eab6a899cea5	f092fee3-596d-4f39-8cde-02f3046c591a	E_EXPENSES	t	t	t	f	ALL	2026-09-10 09:26:45.681	2026-09-14 11:14:51.971
6a26b9cb-0cc8-472f-962f-8b227de51ba5	f092fee3-596d-4f39-8cde-02f3046c591a	E_PAYMENT_VOUCHERS	t	t	t	f	ALL	2026-09-10 09:26:45.682	2026-09-14 11:14:51.971
f8facec0-7eba-4c1e-bc2c-763ed2213bc4	f092fee3-596d-4f39-8cde-02f3046c591a	E_REVENUE_TYPES	t	t	t	f	ALL	2026-09-10 09:26:45.683	2026-09-14 11:14:51.972
17066a27-aaf1-49aa-a59a-aa482f48e044	f092fee3-596d-4f39-8cde-02f3046c591a	E_RECEIPT_VOUCHERS	t	t	t	f	ALL	2026-09-10 09:26:45.683	2026-09-14 11:14:51.972
43d8b4a6-b113-4077-98fa-a4bed3e1f7c6	f092fee3-596d-4f39-8cde-02f3046c591a	E_CASHFLOW_REPORTS	t	t	t	f	ALL	2026-09-10 09:26:45.684	2026-09-14 11:14:51.973
b79989d2-77ca-4b76-b6dd-3facd230fef8	f092fee3-596d-4f39-8cde-02f3046c591a	F_DASHBOARD_REVENUE	f	f	f	f	PERSONAL	2026-09-10 09:26:45.685	2026-09-14 11:14:51.973
6993e296-228a-448f-bd52-e51218a05522	f092fee3-596d-4f39-8cde-02f3046c591a	F_DASHBOARD_PROFIT	f	f	f	f	PERSONAL	2026-09-10 09:26:45.685	2026-09-14 11:14:51.974
7ce55d2a-d1b7-4069-9642-b358233cc883	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	A_DEPARTMENTS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.687	2026-09-14 11:14:51.975
35379a17-d18b-4cd5-ac26-5fca3d010a33	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	A_USERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.687	2026-09-14 11:14:51.976
f9155dec-c1a3-4784-be70-b96481950455	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	A_ROLES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.688	2026-09-14 11:14:51.976
dee87253-1e7f-424c-b390-16b6368048c2	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	A_PERMISSIONS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.689	2026-09-14 11:14:51.977
7ada6a12-e8ef-4230-89c3-4932320171d4	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	A_DOCUMENTS	t	t	t	f	ALL	2026-09-10 09:26:45.69	2026-09-14 11:14:51.977
d88344d1-fff1-4e82-851e-88a399e3e20a	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	C_OVERVIEW	t	t	t	f	ALL	2026-09-10 09:26:45.691	2026-09-14 11:14:51.978
f6c8ec30-c081-4fc0-ab46-3ef17aa9dab1	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	C_WAREHOUSES	t	t	t	f	ALL	2026-09-10 09:26:45.691	2026-09-14 11:14:51.979
dc404476-90f7-4b68-91c2-1bbda1e373c7	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	C_CATEGORIES	t	t	t	f	ALL	2026-09-10 09:26:45.692	2026-09-14 11:14:51.979
5f508148-567c-4bb0-9c78-e80dea83eee0	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	C_PRODUCT_TYPES	t	t	t	f	ALL	2026-09-10 09:26:45.693	2026-09-14 11:14:51.98
4c845d71-e7a2-4f80-a91c-1e5d53b18d94	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	C_PRODUCTS	t	t	t	f	ALL	2026-09-10 09:26:45.694	2026-09-14 11:14:51.98
ea06ed5a-d581-4386-9425-aed7a84e040d	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	B_QUOTATIONS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.698	2026-09-14 11:14:51.983
9bfbca63-729c-4670-a115-d922e8b9cdbc	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	B_ORDERS	t	t	t	f	ALL	2026-09-10 09:26:45.698	2026-09-14 11:14:51.984
9b905efc-261c-4f9e-bc1a-f358fafbf514	9a0f3f2a-00a5-4790-9332-44007ae9d7c2	E_REVENUE_TYPES	f	f	f	f	PERSONAL	2026-09-10 09:26:45.702	2026-09-14 11:14:51.987
2333d723-7fc1-4a4d-b4b8-941e34ed8570	f092fee3-596d-4f39-8cde-02f3046c591a	B_CUSTOMERS	f	f	f	f	PERSONAL	2026-09-10 09:26:45.675	2026-09-14 11:14:51.967
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, code, name, description, is_system, created_at, updated_at) FROM stdin;
9a0f3f2a-00a5-4790-9332-44007ae9d7c2	WAREHOUSE	Thủ kho & Vận chuyển	Quản lý danh mục hàng hóa, kho vật lý và tồn kho	t	2026-09-10 09:26:45.557	2026-09-14 11:14:51.888
4cde6db8-044f-4e90-ae63-5ebc99aab403	ADMIN	Quản trị hệ thống (Admin)	Toàn quyền cấu hình và quản trị hệ thống	t	2026-09-10 09:26:45.539	2026-09-14 11:14:51.88
11099a08-0b1e-402f-9382-c7bac00bcef9	CEO	Tổng Giám đốc (CEO)	Toàn quyền giám sát công ty, xem lương và mở khóa chứng từ	t	2026-09-10 09:26:45.55	2026-09-14 11:14:51.885
15984fe3-ec5c-42ce-836a-9fc9bbbb30b3	SALES_DIR	Trưởng phòng Kinh doanh	Quản lý toàn bộ nhân viên và khách hàng phòng kinh doanh	t	2026-09-10 09:26:45.552	2026-09-14 11:14:51.886
0d1c1a22-e991-404b-858a-e23dbd635307	SALES	Nhân viên Kinh doanh	Chăm sóc khách hàng và lên đơn hàng cá nhân	t	2026-09-10 09:26:45.553	2026-09-14 11:14:51.887
f092fee3-596d-4f39-8cde-02f3046c591a	ACCOUNTANT	Kế toán tài chính	Quản lý thu chi, công nợ và duyệt phiếu	t	2026-09-10 09:26:45.555	2026-09-14 11:14:51.887
\.


--
-- Data for Name: sales_plan_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_plan_items (id, sales_plan_id, category, unit, target_quantity, target_revenue, actual_quantity, actual_revenue) FROM stdin;
1e5c4352-942d-45b7-ad1a-abbde19305ae	5bd487b1-0674-40d8-84e6-95c18d5e6597	Giấy in văn phòng	Ream	3000	240000000.00	2850	228000000.00
eeee68e7-ac83-4a05-a583-9d660cd9dfd0	5bd487b1-0674-40d8-84e6-95c18d5e6597	Bút viết & Mực	Hộp	800	76000000.00	720	68400000.00
3e52e490-7f06-4251-8fc9-6967780b3548	5bd487b1-0674-40d8-84e6-95c18d5e6597	File bìa còng & Lưu trữ	Cái	1200	78000000.00	1100	71500000.00
85e71747-e72c-4a4d-bc39-ea01b3f02918	5bd487b1-0674-40d8-84e6-95c18d5e6597	Dụng cụ văn phòng	Cái	600	45000000.00	520	39000000.00
ffbbe08c-873e-4c9b-9a7a-49aa0130b59d	5bd487b1-0674-40d8-84e6-95c18d5e6597	Thiết bị & Máy văn phòng	Cái	80	52000000.00	75	48750000.00
\.


--
-- Data for Name: sales_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_plans (id, title, period_type, period_value, year, department_id, created_by_id, notes, status, created_at, updated_at) FROM stdin;
5bd487b1-0674-40d8-84e6-95c18d5e6597	Kế hoạch kinh doanh phân phối Văn phòng phẩm Quý 1/2026	QUARTER	Q1/2026	2026	\N	621cf917-d0da-4232-b833-b5e0e4306237	Mục tiêu trọng tâm: Đẩy mạnh sản lượng Giấy in văn phòng và mở rộng mạng lưới khách hàng doanh nghiệp, ngân hàng	ACTIVE	2026-09-10 10:10:46.036	2026-09-14 11:13:12.231
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, code, name, phone, email, address, tax_code, contact_person, notes, status, created_at, updated_at) FROM stdin;
7a029006-1e64-4086-a9b0-cf76186e6188	NCC-DOUBLEA	Công ty TNHH Double A (Việt Nam)	02439743888	contact@doublea.com.vn	Tầng 15 Tòa nhà Vincom, 191 Bà Triệu, Hai Bà Trưng, Hà Nội	0101823940	Bà Trần Kim Oanh (Giám đốc Phân phối)	Nhà sản xuất độc quyền giấy in Double A cao cấp không kẹt giấy	ACTIVE	2026-09-10 11:01:55.116	2026-09-14 11:14:52.086
610b1545-9039-4f75-a752-af6c04883f00	NCC-THIENLONG	Công ty Cổ phần Tập đoàn Thiên Long	02837505555	banhang@thienlong.vn	Lô 6-8-10-12, Đường số 3, KCN Tân Tạo, Q. Bình Tân, TP.HCM	0301464830	Ông Nguyễn Văn Hùng (Trưởng kênh B2B Miền Bắc)	Cung cấp bút viết, mực dấu, dụng cụ học sinh và văn phòng phẩm	ACTIVE	2026-09-10 11:01:55.121	2026-09-14 11:14:52.089
8494b166-7e0a-4f01-8e7b-685e6dcc0b65	NCC-KINGJIM	Công ty TNHH King Jim (Việt Nam)	02743782888	sales@kingjim.com.vn	Đường D9, KCN Mỹ Phước 3, Bến Cát, Bình Dương	3700778899	Ông Sato Kenji (Đại diện kinh doanh)	Chuyên sản xuất File bìa còng, bìa nút, sổ lưu trữ hồ sơ công sở	ACTIVE	2026-09-10 11:01:55.123	2026-09-14 11:14:52.089
c120fcab-c834-4c09-89a2-d875420b82fb	NCC-BAIBANG	Tổng Công ty Giấy Việt Nam (Bãi Bằng)	02103829222	kinhdoanh@baibang.com.vn	Thị trấn Phong Châu, Huyện Phù Ninh, Phú Thọ	2600109999	Ông Đỗ Quốc Huy (Phụ trách thị trường HN)	Thương hiệu giấy in nội địa uy tín, độ trắng sáng ổn định	ACTIVE	2026-09-10 11:01:55.124	2026-09-14 11:14:52.09
011f4dc0-435a-416a-a0c3-5cd3aa6f33e8	NCC-CASIO	Công ty CP XNK Bình Tây (BITEX - NPP Casio/Max)	02839699999	info@bitex.com.vn	110-112 Hậu Giang, Phường 6, Quận 6, TP.HCM	0301449839	Bà Lê Thúy Hằng (Quản lý dự án)	Phân phối chính hãng máy tính Casio và máy bấm kim Max Nhật Bản	ACTIVE	2026-09-10 11:01:55.125	2026-09-14 11:14:52.091
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_id, role_id) FROM stdin;
621cf917-d0da-4232-b833-b5e0e4306237	4cde6db8-044f-4e90-ae63-5ebc99aab403
621cf917-d0da-4232-b833-b5e0e4306237	11099a08-0b1e-402f-9382-c7bac00bcef9
a61cb4f2-0d66-4041-aca3-2a33a3b94043	0d1c1a22-e991-404b-858a-e23dbd635307
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, code, full_name, email, password_hash, phone, dob, department_id, manager_id, avatar_url, basic_salary, allowance, status, start_date, created_at, updated_at) FROM stdin;
621cf917-d0da-4232-b833-b5e0e4306237	ADMIN	Quản Trị Viên Hệ Thống	dinhhchi2110@gmail.com	$2a$10$UK/erb1Ij65rPSjTH7jiQ.rIGh9OwNM7ez3lcc3ThlncMW07dDxcS	0988111222	\N	76e18620-0b57-4ab6-ba72-e643eabe10b8	\N	\N	30000000.00	5000000.00	ACTIVE	2024-01-01	2026-09-10 09:26:45.801	2026-09-14 11:14:52.062
a61cb4f2-0d66-4041-aca3-2a33a3b94043	NV002	Đinh Khánh	dinhkhanh@gmail.com	$2a$10$ohMyquXaENR08aCK5zfY8.3bPYWCrDF2mcpanjdAND6q/ZIGF6/na	\N	\N	\N	\N	\N	\N	\N	ACTIVE	2026-09-14	2026-09-14 11:20:11.828	2026-09-14 11:20:40.712
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouses (id, code, name, address, department_id, created_at, updated_at, phone, status) FROM stdin;
ee4050e2-f903-4169-8d42-cbc2ec20c88c	KHO-TONG	Tổng kho Văn phòng phẩm Nam Khánh (Gia Lâm)	Cụm Kho Bãi Gia Lâm, Hà Nội	557de49c-669d-4751-b3cc-750246f6a343	2026-09-10 09:58:18.691	2026-09-14 11:14:51.999	\N	ACTIVE
4a52c4ed-1450-4b52-8037-9bf628f58f55	KHO-TRUNG-TAM	Kho phân phối & Giao nhanh Nội thành Nam Khánh	Quận Hai Bà Trưng, Hà Nội	557de49c-669d-4751-b3cc-750246f6a343	2026-09-10 09:58:18.698	2026-09-14 11:14:52	\N	ACTIVE
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customer_handover_histories customer_handover_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_handover_histories
    ADD CONSTRAINT customer_handover_histories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expense_types expense_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_types
    ADD CONSTRAINT expense_types_pkey PRIMARY KEY (id);


--
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (id);


--
-- Name: order_handover_histories order_handover_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_handover_histories
    ADD CONSTRAINT order_handover_histories_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_return_items order_return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_return_items
    ADD CONSTRAINT order_return_items_pkey PRIMARY KEY (id);


--
-- Name: order_returns order_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_vouchers payment_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_pkey PRIMARY KEY (id);


--
-- Name: product_types product_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: quotation_items quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: receipt_voucher_allocations receipt_voucher_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_voucher_allocations
    ADD CONSTRAINT receipt_voucher_allocations_pkey PRIMARY KEY (id);


--
-- Name: receipt_vouchers receipt_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_vouchers
    ADD CONSTRAINT receipt_vouchers_pkey PRIMARY KEY (id);


--
-- Name: revenue_types revenue_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_types
    ADD CONSTRAINT revenue_types_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sales_plan_items sales_plan_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_plan_items
    ADD CONSTRAINT sales_plan_items_pkey PRIMARY KEY (id);


--
-- Name: sales_plans sales_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_plans
    ADD CONSTRAINT sales_plans_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: categories_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_code_key ON public.categories USING btree (code);


--
-- Name: customers_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_code_key ON public.customers USING btree (code);


--
-- Name: customers_manager_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_manager_id_idx ON public.customers USING btree (manager_id);


--
-- Name: customers_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);


--
-- Name: customers_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_phone_key ON public.customers USING btree (phone);


--
-- Name: customers_tax_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_tax_code_idx ON public.customers USING btree (tax_code);


--
-- Name: customers_tax_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_tax_code_key ON public.customers USING btree (tax_code);


--
-- Name: departments_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX departments_code_key ON public.departments USING btree (code);


--
-- Name: expense_categories_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX expense_categories_code_key ON public.expense_categories USING btree (code);


--
-- Name: expense_types_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX expense_types_code_key ON public.expense_types USING btree (code);


--
-- Name: legal_documents_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX legal_documents_code_key ON public.legal_documents USING btree (code);


--
-- Name: order_returns_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX order_returns_code_key ON public.order_returns USING btree (code);


--
-- Name: orders_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX orders_code_key ON public.orders USING btree (code);


--
-- Name: orders_customer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_customer_id_idx ON public.orders USING btree (customer_id);


--
-- Name: orders_delivery_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_delivery_status_idx ON public.orders USING btree (delivery_status);


--
-- Name: orders_manager_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_manager_id_idx ON public.orders USING btree (manager_id);


--
-- Name: orders_order_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_order_date_idx ON public.orders USING btree (order_date);


--
-- Name: orders_payment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_payment_status_idx ON public.orders USING btree (payment_status);


--
-- Name: payment_vouchers_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payment_vouchers_code_key ON public.payment_vouchers USING btree (code);


--
-- Name: payment_vouchers_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_vouchers_status_idx ON public.payment_vouchers USING btree (status);


--
-- Name: payment_vouchers_voucher_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_vouchers_voucher_date_idx ON public.payment_vouchers USING btree (voucher_date);


--
-- Name: product_types_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_types_code_key ON public.product_types USING btree (code);


--
-- Name: products_barcode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX products_barcode_key ON public.products USING btree (barcode);


--
-- Name: products_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX products_code_key ON public.products USING btree (code);


--
-- Name: quotations_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX quotations_code_key ON public.quotations USING btree (code);


--
-- Name: receipt_vouchers_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX receipt_vouchers_code_key ON public.receipt_vouchers USING btree (code);


--
-- Name: receipt_vouchers_customer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX receipt_vouchers_customer_id_idx ON public.receipt_vouchers USING btree (customer_id);


--
-- Name: receipt_vouchers_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX receipt_vouchers_status_idx ON public.receipt_vouchers USING btree (status);


--
-- Name: receipt_vouchers_voucher_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX receipt_vouchers_voucher_date_idx ON public.receipt_vouchers USING btree (voucher_date);


--
-- Name: revenue_types_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX revenue_types_code_key ON public.revenue_types USING btree (code);


--
-- Name: role_permissions_role_id_module_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX role_permissions_role_id_module_code_key ON public.role_permissions USING btree (role_id, module_code);


--
-- Name: roles_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_code_key ON public.roles USING btree (code);


--
-- Name: suppliers_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX suppliers_code_key ON public.suppliers USING btree (code);


--
-- Name: users_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_code_key ON public.users USING btree (code);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: warehouses_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX warehouses_code_key ON public.warehouses USING btree (code);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customer_handover_histories customer_handover_histories_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_handover_histories
    ADD CONSTRAINT customer_handover_histories_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_handover_histories customer_handover_histories_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_handover_histories
    ADD CONSTRAINT customer_handover_histories_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customer_handover_histories customer_handover_histories_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_handover_histories
    ADD CONSTRAINT customer_handover_histories_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customers customers_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expense_types expense_types_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_types
    ADD CONSTRAINT expense_types_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: legal_documents legal_documents_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_handover_histories order_handover_histories_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_handover_histories
    ADD CONSTRAINT order_handover_histories_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_handover_histories order_handover_histories_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_handover_histories
    ADD CONSTRAINT order_handover_histories_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_handover_histories order_handover_histories_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_handover_histories
    ADD CONSTRAINT order_handover_histories_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_return_items order_return_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_return_items
    ADD CONSTRAINT order_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_return_items order_return_items_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_return_items
    ADD CONSTRAINT order_return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.order_returns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_returns order_returns_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_returns order_returns_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_vouchers payment_vouchers_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_vouchers payment_vouchers_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_vouchers payment_vouchers_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_vouchers payment_vouchers_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_vouchers payment_vouchers_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_vouchers payment_vouchers_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.expense_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_types product_types_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_product_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES public.product_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quotation_items quotation_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quotation_items quotation_items_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quotations quotations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotations quotations_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: receipt_voucher_allocations receipt_voucher_allocations_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_voucher_allocations
    ADD CONSTRAINT receipt_voucher_allocations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: receipt_voucher_allocations receipt_voucher_allocations_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_voucher_allocations
    ADD CONSTRAINT receipt_voucher_allocations_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.receipt_vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: receipt_vouchers receipt_vouchers_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_vouchers
    ADD CONSTRAINT receipt_vouchers_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: receipt_vouchers receipt_vouchers_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_vouchers
    ADD CONSTRAINT receipt_vouchers_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: receipt_vouchers receipt_vouchers_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_vouchers
    ADD CONSTRAINT receipt_vouchers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: receipt_vouchers receipt_vouchers_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_vouchers
    ADD CONSTRAINT receipt_vouchers_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: receipt_vouchers receipt_vouchers_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_vouchers
    ADD CONSTRAINT receipt_vouchers_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.revenue_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_plan_items sales_plan_items_sales_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_plan_items
    ADD CONSTRAINT sales_plan_items_sales_plan_id_fkey FOREIGN KEY (sales_plan_id) REFERENCES public.sales_plans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_plans sales_plans_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_plans
    ADD CONSTRAINT sales_plans_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales_plans sales_plans_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_plans
    ADD CONSTRAINT sales_plans_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: warehouses warehouses_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict Cg4ilXeu4F0egxbXBG8oeuwDqaT5fy9wASobHQE2AKcBi7PU9c0zP6EfqPo8FpZ

