# Urban Spice — Restaurant Ordering Platform

Urban Spice is a responsive restaurant web application where customers can explore dishes, add items to a cart, and place orders via **Home Delivery**, **Pickup / Takeaway**, or **Dine-in**, with **Razorpay Test Mode** and **Cash / Pay-on-arrival** options.

---

## 🏗️ Architecture Overview

The system is built as a clean, decoupled two-tier application:

1. **Frontend (`frontend/`)**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS.
2. **Backend (`backend/`)**: Python 3.11 + Django 5 + Django REST Framework (DRF) + `django-cors-headers`.
3. **Database**: PostgreSQL (database: `urban_spice`).

```text
Resturent-Webside/
├── frontend/                     # Next.js App Router client
│   ├── app/                      # Pages & layouts (page.tsx, layout.tsx, globals.css)
│   ├── lib/                      # Reusable utilities (api.ts, currency.ts)
│   ├── public/                   # Static assets & icons
│   ├── .env.example              # Frontend environment template
│   └── .env.local                # Local environment configuration
├── backend/                      # Django REST API server
│   ├── config/                   # Core Django project settings & URLs
│   ├── accounts/                 # Customer profiles & authentication app
│   ├── menu/                     # Menu items & categories app
│   ├── orders/                   # Orders & fulfilment management app
│   ├── payments/                 # Razorpay integration & verification app
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Backend environment template
│   └── .env                      # Local backend secrets (git-ignored)
├── .gitignore                    # Master git ignore file
├── prd.md                        # Product Requirements Document
└── README.md                     # Setup guide and documentation
```

---

## 🚀 Setup & Running Guide (Step-by-Step)

### Prerequisites
- **Node.js** (v18+) and **npm**
- **Python** (v3.10+)
- **PostgreSQL** (running locally on port `5432`)

---

### 1. Database Setup (PostgreSQL)

If not already created, create the database:
```bash
# Connect to PostgreSQL and create urban_spice database
psql -d postgres -c "CREATE DATABASE urban_spice;"
```

---

### 2. Backend Setup (Django + DRF)

Open a terminal and navigate to `backend/`:

```bash
cd backend
```

#### Step 2.1: Create & Activate Virtual Environment
```bash
# Create an isolated Python environment
python3 -m venv .venv

# Activate on macOS / Linux:
source .venv/bin/activate
```

#### Step 2.2: Install Dependencies
```bash
# Upgrade pip and install all required packages
pip install --upgrade pip
pip install -r requirements.txt
```

*What was installed:*
- `Django`: Web framework.
- `djangorestframework`: For building JSON REST APIs.
- `django-cors-headers`: Allows frontend requests from `http://localhost:3000`.
- `psycopg2-binary`: PostgreSQL adapter for Python.
- `python-dotenv`: Loads secrets from `.env`.
- `dj-database-url`: Parses PostgreSQL database URLs.

#### Step 2.3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` matches your local PostgreSQL setup:
```env
DEBUG=True
DJANGO_SECRET_KEY=urban-spice-dev-insecure-key-for-local-development-only
DATABASE_URL=postgresql://localhost:5432/urban_spice
FRONTEND_URL=http://localhost:3000
ALLOWED_HOSTS=localhost,127.0.0.1
```

#### Step 2.4: Run Database Migrations
```bash
python manage.py migrate
```
*Applies all default tables (auth, admin, sessions) to the PostgreSQL database.*

#### Step 2.5: Start Django Development Server
```bash
python manage.py runserver 8000
```
- API Root: [http://localhost:8000/api/](http://localhost:8000/api/)
- Django Admin: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

### 3. Frontend Setup (Next.js)

Open a second terminal window and navigate to `frontend/`:

```bash
cd frontend
```

#### Step 3.1: Install Dependencies (if not already done)
```bash
npm install
```

#### Step 3.2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Contents of `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_replace_me
```

#### Step 3.3: Start Next.js Development Server
```bash
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Project Phases Status

### Phase 1: Foundation & Setup ✅ (Complete)
- Frontend (Next.js 16) and backend (Django 5 + DRF) repositories created.
- PostgreSQL database `urban_spice` connected with initial migrations.
- `.gitignore` and `.env.example` templates committed.

### Phase 2: Responsive Frontend Design ✅ (Complete)
- **Header**: Responsive navigation with Urban Spice branding, smooth section anchors, and interactive cart drawer toggle.
- **Hero Section**: Editorial serif display typography ("Bold Flavours. Unforgettable Moments."), appetizing food photography showcase, and quick CTAs.
- **Order Types**: Dedicated cards for Home Delivery, Pickup / Takeaway, and Dine-in.
- **Popular Dishes**: Interactive menu grid with category filters (All, Starters, Mains, Biryani, Breads), vegetarian toggle, search bar, and prices in Indian Rupees (`₹`).
- **About & Hours**: Kitchen culinary journey, opening hours, and Rajouri Garden location.
- **Contact & Reservation**: Phone, email, and interactive table enquiry form.
- **Footer**: Fulfilment links, payment methods notice (Razorpay Test Mode + Cash/Counter), and restaurant policies.
- **Interactive Cart**: Slide-out drawer with quantity increment/decrement, item removal, and subtotal calculation in ₹.

---

### Phase 3: Menu API & Database ✅ (Complete)
- **Django Models**: `Category` and `MenuItem` with `DecimalField` prices and relationships.
- **Django Admin**: Both models registered with search, list filters, and inline editing.
- **REST Endpoints**:
  - `GET /api/menu/categories/`
  - `GET /api/menu/items/`
  - `GET /api/menu/items/{id}/`
- **Dynamic Filters**: Real-time filtering by category slug, vegetarian status (`?vegetarian=true`), and full-text search (`?search=...`).
- **Repeatable Seeding**: Run `python manage.py seed_menu` to populate initial menu data idempotently into PostgreSQL.
- **Frontend Integration**: Next.js homepage menu grid directly queries PostgreSQL through Django REST API, complete with skeleton loaders and error states.

---

### Phase 4: Cart and Checkout System ✅ (Complete)
- **Django Models**: `Order` and `OrderItem` models with `DecimalField` amounts, statuses, and historical snapshots.
- **Backend Validation**:
  - Validates item IDs, positive quantities, and item availability against PostgreSQL.
  - Recalculates line totals, subtotal, 5% GST, and delivery fee on the server inside atomic transactions.
  - Enforces mandatory fields per fulfilment type (address for Home Delivery, contact info for Pickup/Dine-in).
- **REST Endpoints**:
  - `POST /api/orders/`: Creates orders, validates stock, returns complete order confirmation with snapshots.
  - `GET /api/orders/{order_number}/`: Retrieves order details securely by unique reference.
- **Frontend Pages & Features**:
  - `CartContext` (`localStorage` persisted) surviving page navigation across `/`, `/cart`, and `/checkout`.
  - Dedicated `/cart` page with quantity adjustment, item removal, and subtotal calculation in Indian Rupees (`₹`).
  - Dedicated `/checkout` page supporting Home Delivery (COD), Pickup / Takeaway (Pay at Pickup), and Dine-in (Pay at Table).
  - Dedicated `/order/success` confirmation page with copyable order number, status timeline, and order summary.

### Phase 5: Staff Admin Dashboard ✅ (Complete)
- **Staff Authentication**: Token-based authentication enforcing `is_staff=True` permissions on the backend.
- **REST Endpoints**:
  - `POST /api/admin/login/`: Validates staff credentials and issues authentication token.
  - `GET /api/admin/dashboard/`: Returns operational metrics (total orders, orders today, awaiting confirmation, gross sales).
  - `GET /api/admin/orders/`: Returns filtered orders (`status`, `type`, and search query).
  - `GET /api/admin/orders/{id}/`: Returns single order details and item snapshots.
  - `PATCH /api/admin/orders/{id}/status/`: Validates and executes state transitions per fulfilment type without modifying payment status.
- **Frontend Dashboard (`/admin`)**:
  - Secure login screen with feedback and default credentials.
  - Operational metrics bar showing live restaurant statistics.
  - Filter by order status (`PLACED`, `CONFIRMED`, `PREPARING`, `READY`, etc.) and order type (`DELIVERY`, `PICKUP`, `DINE_IN`).
  - Search by order number, customer name, or customer phone.
  - Interactive Order Detail modal with workflow progression action buttons based on current state.

#### Staff Account Access
- **Dashboard URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Default Staff Credentials**:
  - Username: `admin`
  - Password: `admin123`
- **To create a new staff member via terminal**:
  ```bash
  cd backend
  ./.venv/bin/python manage.py createsuperuser
  ```

---

## 🔮 Next Phase: Phase 6 — Razorpay Test Mode & Payments

- Configure Razorpay Test Mode API keys in backend environment variables.
- Implement server-side Razorpay order creation (`/api/payments/razorpay/create-order/`).
- Integrate Razorpay Checkout Modal on the frontend.
- Verify payment signatures and webhooks on the backend to mark payment status as `PAID`.
