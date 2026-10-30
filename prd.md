# Urban Spice --- Restaurant Website PRD

**Product:** Urban Spice Restaurant Website\
**Document type:** Product Requirements Document (PRD)\
**Version:** 1.0\
**Status:** Ready for development planning\
**Currency:** Indian Rupee (₹)\
**Design reference:** User-provided "Huff & Puff" restaurant UI
screenshot

------------------------------------------------------------------------

## 1. Project Overview

Urban Spice is a responsive restaurant website where customers can
explore the menu, add food to a cart, and place orders using one of
three fulfilment methods:

1.  **Home Delivery** --- deliver the order to the customer's address.
2.  **Pickup / Takeaway** --- customer collects the order from the
    restaurant.
3.  **Dine-in** --- customer eats at the restaurant, with an optional
    table number or reservation note.

Customers can pay online using **Razorpay in Test Mode** or choose
**Cash on Delivery (COD)** where applicable. An admin dashboard allows
authorised staff to manage menu items, orders, order statuses, and
payment statuses.

The first version should be easy to understand, maintain, and operate.
Avoid microservices and unnecessary complexity.

## 2. Goals

-   Create a premium, polished restaurant website inspired by the
    supplied reference.
-   Make the website work on mobile, tablet, and desktop.
-   Let customers browse food and place orders with minimal friction.
-   Support delivery, pickup, and dine-in order flows.
-   Display all prices and totals in Indian Rupees (₹).
-   Keep payment secrets and database credentials on the backend.
-   Give restaurant staff a simple admin interface for daily operations.
-   Build a maintainable foundation that can later be deployed publicly.

## 3. Out of Scope for Version 1

To keep the first release manageable, do not build these unless
specifically requested later:

-   Multiple restaurant branches and franchise management.
-   Complex delivery-driver live GPS tracking.
-   Loyalty points, subscriptions, and referral programs.
-   AI chatbot, recommendations, or advanced analytics.
-   Multi-currency support.
-   Split payments or international payments.
-   Native iOS or Android applications.
-   Automatic table allocation or a complicated reservation engine.

## 4. Target Users

### 4.1 Customer

A visitor who wants to discover food, add items to a cart, select
delivery/pickup/dine-in, enter the required details, pay, and track
order status.

### 4.2 Admin / Restaurant Staff

An authorised team member who manages menu availability, reviews
incoming orders, updates preparation and fulfilment status, and checks
payment information.

## 5. Design and UX Requirements

### 5.1 Visual direction

Use the provided screenshot as visual inspiration, not as a
pixel-perfect copy.

-   **Overall style:** premium, modern, appetising, minimal.
-   **Background:** charcoal / near-black.
-   **Text:** white and soft grey.
-   **Accent:** strong restaurant red for primary actions, prices,
    badges, and cart buttons.
-   **Food photography:** high-quality images with consistent cropping.
-   **Typography:** expressive serif display font for the hero headline;
    clean sans-serif for navigation, forms, menu descriptions, and
    buttons.
-   **Cards:** rounded corners, subtle shadows, clear spacing.
-   **Motion:** subtle hover and loading transitions only; respect
    reduced-motion preferences.
-   **Accessibility:** readable contrast, visible focus states, labelled
    form fields, keyboard navigation, and useful error messages.

Suggested design tokens: - Background: `#171717` - Surface/card:
`#242424` - Primary text: `#FFFFFF` - Secondary text: `#BDBDBD` - Accent
red: `#E51D2A` - Success: accessible green - Error: accessible red

These are initial suggestions and may be tuned during implementation.

### 5.2 Responsive behaviour

-   Mobile-first layout.
-   Desktop hero uses text on one side and a featured food image on the
    other.
-   Mobile hero stacks content vertically; buttons remain easy to tap.
-   Menu cards use a responsive grid.
-   Navigation becomes a compact mobile menu.
-   Cart and checkout must work on narrow screens without horizontal
    scrolling.
-   Admin tables should become horizontally scrollable or switch to
    compact cards on mobile.

## 6. Pages and Routes

### Public pages

-   `/` --- Home page.
-   `/menu` --- Full menu with categories, search, and filters.
-   `/menu/[slug]` --- Optional individual menu item detail page.
-   `/cart` --- Cart review and quantity editing.
-   `/checkout` --- Fulfilment details, order summary, and payment
    selection.
-   `/order/success` --- Confirmation after verified order
    creation/payment.
-   `/orders/[orderNumber]` --- Order status page; protect access using
    an appropriate secure order token or authenticated account.
-   `/about` --- Restaurant story, location, and opening hours.
-   `/contact` --- Contact information and enquiry form.
-   `/login` and `/register` --- Optional customer accounts for V1;
    guest checkout should remain possible.

### Admin pages

-   `/admin` --- Dashboard overview.
-   `/admin/menu` --- List, search, and manage menu items.
-   `/admin/menu/new` --- Create a menu item.
-   `/admin/orders` --- View, filter, and manage orders.
-   `/admin/orders/[id]` --- Order details and status updates.

Admin APIs must enforce staff permissions on the backend. Hiding an
admin link in the frontend is not security.

## 7. Homepage Requirements

### 7.1 Header

-   Urban Spice logo/name.
-   Navigation: Home, Menu, About, Contact.
-   Cart icon with current item count.
-   Clear "Order Now" or "View Menu" button.
-   Sign in link if customer accounts are enabled.
-   Responsive mobile navigation.

### 7.2 Hero section

Suggested copy: - Brand: **Urban Spice** - Headline: **"Bold Flavours.
Unforgettable Moments."** - Supporting text: "Freshly prepared
favourites, made for sharing." - Primary CTA: "Explore Menu" - Secondary
CTA: "Order Now" - Large featured food image with attractive
composition.

Do not claim awards, ratings, review counts, delivery times, or customer
totals unless verified and supplied by the restaurant.

### 7.3 Popular dishes

-   Display selected active menu items.
-   Each card shows image, name, short description, price in ₹,
    availability, and Add to Cart.
-   Use real database items; seed data may be used for local development
    and must be labelled as sample data.

### 7.4 Order type section

Clearly explain the three options: - Home Delivery - Pickup / Takeaway -
Dine-in

### 7.5 Additional homepage sections

-   Food categories.
-   Restaurant introduction.
-   Opening hours and location.
-   Contact details.
-   Footer with navigation and policies.

## 8. Menu Requirements

Each menu item should contain: - Name. - Unique slug or identifier. -
Description. - Price in INR. - Category. - Image URL or stored image
reference. - Vegetarian / non-vegetarian indicator where applicable. -
Optional spice level and allergen notes. - Availability flag. -
Featured/popular flag. - Created and updated timestamps.

Menu features: - Browse by category. - Search by item name. - Optional
vegetarian filter. - Show unavailable items as unavailable and prevent
adding them to the cart. - Show clear loading, empty, and error
states. - Prices must be formatted consistently, for example `₹249.00`
or `₹249`; choose one format and use it consistently.

## 9. Cart Requirements

-   Add items to cart.
-   Increase/decrease quantity.
-   Remove items.
-   Show item price, quantity, and line total.
-   Show subtotal and any configured delivery fee, discount, or tax.
-   Display final total clearly.
-   Prevent zero or negative quantities.
-   Revalidate item availability and prices on the backend at checkout.
-   Do not trust totals or prices sent by the browser.
-   Persist the cart locally for convenience if appropriate, but the
    server must calculate the final order amount.

### Pricing rules

-   Store prices in PostgreSQL using `DecimalField`, never binary
    floating-point.
-   Use INR as the only currency in V1.
-   Keep tax and delivery-fee rules configurable; do not invent legal
    tax rates or claim tax compliance without review.
-   Show a clear breakdown before payment.

## 10. Three Ordering Flows

### 10.1 Home Delivery

Required fields: - Customer name. - Phone number. - Full delivery
address. - City and PIN code. - Optional landmark and delivery
instructions.

Flow: 1. Customer chooses Home Delivery. 2. Customer enters delivery
details. 3. Server validates address fields and cart availability. 4.
Server calculates item totals, fees, taxes, and final total. 5. Customer
chooses Razorpay Test Mode or COD, if COD is enabled for delivery. 6.
Order is created with a clear initial status. 7. For online payment,
backend creates a Razorpay order and returns only the necessary public
checkout details. 8. Backend verifies the payment signature before
marking payment successful. 9. Customer sees the confirmation page and
order number.

### 10.2 Pickup / Takeaway

Required fields: - Customer name. - Phone number. - Optional pickup time
or note.

Flow: 1. Customer selects Pickup / Takeaway. 2. Customer enters contact
details. 3. Server recalculates totals and creates the order. 4.
Customer pays online or selects COD/pay-at-pickup according to the
configured restaurant policy. 5. Order status is shown to the customer.
6. Staff marks the order ready and then collected.

Do not promise an estimated pickup time unless the restaurant has
configured one.

### 10.3 Dine-in

Required fields: - Customer name. - Phone number. - Table number or
reservation reference if the restaurant uses one. - Optional special
request.

Flow: 1. Customer selects Dine-in. 2. Customer enters the required
contact/table details. 3. Server validates the cart and calculates
totals. 4. Customer selects online payment or the configured
pay-at-restaurant/COD-like option. 5. Staff receives the order and
updates its status.

**Terminology note:** COD normally means paying when a delivery arrives.
For dine-in and pickup, label the offline option "Pay at Restaurant" or
"Pay at Pickup" instead of incorrectly calling it COD. If the business
specifically wants COD displayed for all types, confirm that policy
before release.

## 11. Payment Requirements --- Razorpay Test Mode + Offline Payment

### 11.1 Razorpay

-   Begin in Razorpay Test Mode only.
-   Use official Razorpay Checkout integration.
-   Backend creates the Razorpay order using secret credentials.
-   Frontend receives only the public key ID and the order details
    required to open Checkout.
-   Backend verifies the returned payment signature.
-   Do not mark payment successful based only on a frontend success
    callback.
-   Store provider order ID, payment ID, signature-verification result,
    amount, currency, and payment status as appropriate.
-   Handle cancelled, failed, pending, and successful payments.
-   Make payment verification and webhook processing idempotent to avoid
    duplicate updates.
-   Verify webhook signatures using the raw request body and configured
    webhook secret.
-   Never log secrets, card details, UPI PINs, or sensitive payment
    data.
-   Do not store card numbers, CVV, or UPI PINs in the application
    database.

### 11.2 Environment variables

Backend `.env` example (use placeholders only):

``` env
DEBUG=True
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/urban_spice
RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace_me
RAZORPAY_WEBHOOK_SECRET=replace_me
FRONTEND_URL=http://localhost:3000
ALLOWED_HOSTS=localhost,127.0.0.1
```

Frontend `.env.local`:

``` env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_replace_me
```

Rules: - Only public configuration belongs in `NEXT_PUBLIC_*`. -
`RAZORPAY_KEY_SECRET`, Django secret, database password, and webhook
secret must remain backend-only. - Add `.env`, `.env.local`, and other
secret files to `.gitignore`. - Commit `.env.example` with placeholder
values, never real credentials. - Use separate credentials for local,
staging, and production environments. - Production must set
`DEBUG=False`, HTTPS, secure cookies, allowed hosts, CORS/CSRF
configuration, and secure secret management.

### 11.3 Payment/order status model

Suggested payment statuses: - `PENDING` - `PAID` - `FAILED` -
`REFUNDED` - `CANCELLED`

An order may exist before payment is confirmed. Store order status
separately from payment status. If payment fails, provide a safe retry
flow and avoid creating duplicate paid orders.

## 12. Order Status Workflow

Suggested order statuses: - `PLACED` - `CONFIRMED` - `PREPARING` -
`READY` - `OUT_FOR_DELIVERY` --- delivery only. - `COMPLETED` -
`CANCELLED`

Rules: - Only authorised staff can update order statuses. - Enforce
valid transitions on the backend. - `READY` is used for pickup/dine-in;
`OUT_FOR_DELIVERY` is for delivery. - Record status timestamps and, if
useful, which staff member made the change. - Customers see a simple
status timeline. - Do not allow customers to mark their own orders as
paid or completed.

## 13. Admin Dashboard

### 13.1 Overview

Show: - Orders today. - Orders awaiting confirmation/preparation. -
Completed orders. - Gross order totals for the selected period. - Recent
orders.

Label metrics clearly. Do not call gross order totals "profit" unless
expenses and refunds are included in a valid profit calculation.

### 13.2 Menu management

Staff can: - Create menu items. - Edit names, descriptions, prices,
categories, images, and availability. - Mark items as featured. -
Soft-disable or archive items instead of breaking historical order
records. - Search and filter the menu.

Validation: - Name and category required. - Price must be greater than
zero (unless a deliberate free item is supported). - Invalid image types
and oversized uploads must be rejected. - Backend validation is
mandatory.

### 13.3 Order management

Staff can: - View orders by date, order type, status, and payment
status. - Open order details and customer-provided fulfilment
information. - See ordered items, quantities, totals, and payment
reference. - Update status using valid transitions. - See whether the
order is delivery, pickup, or dine-in. - See COD / pay-at-restaurant
orders clearly. - Avoid exposing customer information to unauthorised
users.

### 13.4 Admin security

-   Use Django staff/superuser permissions or a properly configured
    staff role.
-   Require authentication for all admin APIs.
-   Apply object-level permissions where needed.
-   Rate-limit login and sensitive endpoints where practical.
-   Keep an audit trail for sensitive order/payment changes.

## 14. Backend Architecture

Use one Django project and one Django REST Framework API. Suggested
Django apps:

-   `accounts` --- optional customer profile and authentication.
-   `menu` --- categories and menu items.
-   `orders` --- orders, order items, fulfilment details, status
    history.
-   `payments` --- Razorpay order creation, signature verification,
    webhooks.

Keep the architecture simple. Apps may be combined if the implementation
becomes clearer for a beginner.

### Suggested API endpoints

#### Menu

-   `GET /api/menu/categories/`
-   `GET /api/menu/items/`
-   `GET /api/menu/items/{id}/`

Optional filters: `category`, `search`, `vegetarian`, `available`.

#### Orders

-   `POST /api/orders/` --- validate cart and create an order.
-   `GET /api/orders/{order_number}/` --- retrieve an order only with
    valid ownership or a secure order access token.
-   `GET /api/orders/` --- authenticated customer's orders.
-   `POST /api/orders/{order_number}/cancel/` --- only if cancellation
    rules permit it.

#### Payments

-   `POST /api/payments/razorpay/create-order/`
-   `POST /api/payments/razorpay/verify/`
-   `POST /api/payments/razorpay/webhook/`

#### Admin

-   `GET /api/admin/dashboard/`
-   `POST /api/admin/menu/items/`
-   `PATCH /api/admin/menu/items/{id}/`
-   `DELETE /api/admin/menu/items/{id}/` --- preferably archive/disable
    instead of hard-delete.
-   `GET /api/admin/orders/`
-   `PATCH /api/admin/orders/{id}/status/`

Use consistent JSON responses, proper HTTP status codes, pagination for
lists, and useful validation messages. Never allow public clients to
update payment status directly.

## 15. Database Design

Use PostgreSQL. Suggested core tables/models:

### Category

-   `id`
-   `name`
-   `slug`
-   `is_active`

### MenuItem

-   `id`
-   `category_id`
-   `name`
-   `slug`
-   `description`
-   `price` --- decimal
-   `image`
-   `is_vegetarian`
-   `is_available`
-   `is_featured`
-   `created_at`
-   `updated_at`

### User / Customer

Use Django's built-in user model or a carefully configured custom user
model from the start. - `id` - `name` - `email` (optional if phone-based
guest checkout is used) - `phone` - Authentication fields managed
securely by Django.

### Order

-   `id`
-   `order_number` --- unique, non-sequential/random enough to avoid
    easy guessing.
-   `customer` --- nullable for guest checkout if required.
-   `customer_name`
-   `customer_phone`
-   `order_type` --- `DELIVERY`, `PICKUP`, `DINE_IN`
-   `order_status`
-   `payment_method` --- `RAZORPAY`, `COD`, `PAY_AT_PICKUP`,
    `PAY_AT_RESTAURANT`
-   `payment_status`
-   `subtotal`
-   `delivery_fee`
-   `tax_amount`
-   `discount_amount`
-   `total_amount`
-   `currency` --- `INR`
-   `delivery_address` --- nullable, required for delivery.
-   `city` and `pincode` --- where applicable.
-   `table_number` or `reservation_reference` --- optional for dine-in.
-   `customer_note`
-   `created_at`
-   `updated_at`

### OrderItem

-   `id`
-   `order_id`
-   `menu_item_id` --- nullable if the menu item is later
    archived/deleted.
-   `item_name_snapshot`
-   `unit_price_snapshot`
-   `quantity`
-   `line_total`

Save a snapshot of the name and price at checkout so historical orders
remain accurate after menu changes.

### Payment

-   `id`
-   `order_id`
-   `provider`
-   `provider_order_id`
-   `provider_payment_id`
-   `amount`
-   `currency`
-   `status`
-   `signature_verified`
-   `created_at`
-   `updated_at`

Add appropriate database constraints and indexes for order number,
status, timestamps, and payment references. Prevent duplicate provider
payment processing.

## 16. Frontend Structure

Suggested Next.js App Router layout:

``` text
urban-spice/
  frontend/
    app/
      page.tsx
      menu/page.tsx
      cart/page.tsx
      checkout/page.tsx
      order/success/page.tsx
      about/page.tsx
      contact/page.tsx
      admin/page.tsx
      admin/menu/page.tsx
      admin/orders/page.tsx
    components/
      layout/
      home/
      menu/
      cart/
      checkout/
      admin/
      ui/
    lib/
      api.ts
      currency.ts
      validation.ts
    types/
      menu.ts
      order.ts
    public/
      images/
    .env.example
  backend/
    manage.py
    config/
    accounts/
    menu/
    orders/
    payments/
    requirements.txt
    .env.example
  docs/
    API.md
    DEPLOYMENT.md
  PRD.md
  README.md
```

This is a suggested structure, not a rigid requirement. Keep components
small and reuse common UI pieces. Do not put all frontend logic into one
enormous file.

## 17. Recommended Implementation Tools

-   Next.js with TypeScript and App Router.
-   Tailwind CSS.
-   Django and Django REST Framework.
-   PostgreSQL.
-   `DecimalField` for all monetary amounts.
-   Django migrations for schema changes.
-   Official Razorpay Checkout and server SDK/API.
-   Django's password hashing and permission system.
-   A small API helper in Next.js for backend requests.
-   Environment variables for configuration.
-   Git for version control.

Use stable, mutually compatible package versions and commit lockfiles.
Do not install unnecessary libraries without a clear need.

## 18. Validation, Security, and Reliability

-   Validate all incoming data on both frontend and backend; backend
    validation is authoritative.
-   Recalculate price and totals on the server.
-   Use Django ORM and parameterised queries; never concatenate
    untrusted SQL.
-   Configure CORS for the expected frontend origin only.
-   Configure CSRF appropriately for the chosen authentication method.
-   Protect staff endpoints and payment endpoints.
-   Verify Razorpay signatures on the server.
-   Handle duplicate payment callbacks/webhooks safely.
-   Use database transactions when creating orders and order items.
-   Do not expose secret keys or database credentials in frontend
    bundles or Git.
-   Use HTTPS in deployment.
-   Add basic rate limiting to login, checkout, and payment verification
    where practical.
-   Avoid storing unnecessary personal data.
-   Provide privacy, terms, cancellation/refund, and contact information
    before public launch.
-   Use safe image upload validation if admins can upload files.
-   Log operational errors without exposing passwords, secrets, or
    payment-sensitive information.

## 19. Accessibility and Quality

-   Semantic HTML and accessible labels.
-   Keyboard-operable navigation, menus, dialogs, and forms.
-   Visible focus indicators.
-   Proper contrast and readable text.
-   Helpful field-level validation.
-   Loading, success, empty, and error states.
-   Responsive layout from small mobile screens through desktop.
-   Optimised images and avoid layout shifts.
-   Use server components by default in Next.js; add client components
    only where interactivity requires them.

## 20. Testing Plan

### Frontend

-   Menu category and search behaviour.
-   Add, increment, decrement, and remove cart items.
-   Cart survives page navigation.
-   Checkout form validation changes based on order type.
-   Currency formatting.
-   Mobile navigation and responsive layout.
-   Error messages when the API is unavailable.

### Backend

-   Menu listing and filtering.
-   Invalid price and quantity rejection.
-   Server-side price calculation.
-   Delivery requires an address.
-   Pickup and dine-in do not require a delivery address.
-   Unavailable items cannot be ordered.
-   Customers cannot access another customer's order.
-   Non-staff users cannot access admin endpoints.
-   Valid and invalid Razorpay signature handling.
-   Duplicate webhook/payment event handling.
-   Order status transition validation.

### End-to-end acceptance scenarios

1.  Customer adds an available item, chooses delivery, enters an
    address, and creates a COD order.
2.  Customer chooses pickup and completes a Razorpay Test Mode payment.
3.  Customer places a dine-in order and sees its correct status.
4.  Admin adds a menu item and it appears on the public menu.
5.  Admin changes an order from confirmed to preparing to ready.
6.  An invalid payment signature never marks an order paid.
7.  The same payment webhook delivered twice does not double-process the
    payment.
8.  All prices and totals appear in ₹ on mobile and desktop.

## 21. Definition of Done

V1 is ready for review when: - All required public pages are implemented
and responsive. - Menu data comes from the Django API. - Cart and all
three order types work end to end. - Backend validates
stock/availability, quantities, and all totals. - Razorpay Test Mode
payment creation and server-side verification work. - COD is available
according to the configured fulfilment policy. - Payment status and
order status are separate and correct. - Admin can manage menu items and
orders securely. - PostgreSQL migrations run successfully. - No secrets
are committed to Git. - Tests for the critical checkout and payment
flows pass. - README documents setup, environment variables, migrations,
sample data, test payment setup, and deployment.

## 22. Beginner-Friendly Development Phases

### Phase 1 --- Project setup

-   Create the frontend and backend folders.
-   Start Next.js with TypeScript and Tailwind.
-   Create the Django project and DRF API.
-   Connect PostgreSQL and run migrations.
-   Add `.gitignore` and placeholder `.env.example` files.

**Checkpoint:** Both servers start locally and Django connects to
PostgreSQL.

### Phase 2 --- Design the frontend

-   Build the header, hero, food cards, category section, and footer.
-   Match the dark charcoal, white, and red visual style.
-   Add responsive mobile navigation.
-   Use temporary sample food data only for initial visual work.

**Checkpoint:** Homepage looks polished on desktop and mobile.

### Phase 3 --- Menu API and database

-   Add Category and MenuItem models.
-   Add Django admin for menu editing.
-   Build public menu API.
-   Connect Next.js menu components to the API.
-   Add a small set of clearly identified sample menu items.

**Checkpoint:** Staff can add a menu item and customers can see it.

### Phase 4 --- Cart and checkout

-   Implement cart actions and totals.
-   Build checkout forms for delivery, pickup, and dine-in.
-   Validate the required fields for each order type.
-   Create orders and order-item snapshots in PostgreSQL.
-   Recalculate all totals on the server.

**Checkpoint:** Test orders can be created without online payment.

### Phase 5 --- Payments

-   Configure Razorpay Test Mode credentials in backend environment
    variables.
-   Create Razorpay orders from the backend.
-   Integrate Checkout on the frontend.
-   Verify signatures and webhooks on the backend.
-   Add offline payment options appropriate to each fulfilment type.

**Checkpoint:** Test payments can be verified safely; failed payments
remain unpaid.

### Phase 6 --- Admin dashboard

-   Build order list, filters, order details, and status actions.
-   Build menu create/edit/availability controls.
-   Restrict admin endpoints to authorised staff.
-   Show payment and order statuses separately.

**Checkpoint:** Staff can manage test orders from the dashboard.

### Phase 7 --- Testing and deployment

-   Test mobile/desktop and the main ordering flows.
-   Configure production environment variables and PostgreSQL.
-   Deploy the frontend and backend separately.
-   Configure HTTPS, CORS/CSRF, allowed hosts, static/media storage, and
    database backups.
-   Keep Razorpay in Test Mode until the owner intentionally completes
    live-payment setup and testing.

**Checkpoint:** A staging deployment works end to end before public
launch.

## 23. Deployment Notes

A straightforward deployment approach is: - Frontend: Vercel or another
compatible Next.js host. - Backend: a managed Python/Django hosting
service. - Database: managed PostgreSQL. - Media: persistent media
storage or object storage for uploaded menu images.

Do not assume local disk storage will persist on every host. Configure
CORS and CSRF using the actual deployed domains. Run migrations as part
of a controlled release process. Configure backups and review hosting
costs before launch.

## 24. Open Business Decisions

These values should be confirmed before launch; sensible defaults can be
used in local development: - Restaurant address, phone, opening hours,
and social links. - Actual menu names, descriptions, prices, and
photos. - Delivery coverage and delivery fee. - Tax and discount
rules. - Whether COD is allowed only for delivery. - Whether
pickup/dine-in use "Pay at Pickup" / "Pay at Restaurant". - Whether
dine-in requires a table number or reservation. - Cancellation and
refund policy. - Whether customer registration is needed or guest
checkout is preferred. - Production hosting and domain name.

## 25. Final Product Principle

Build a clean, attractive, reliable restaurant ordering website---not an
overcomplicated platform. Prioritise the customer journey:

**Discover food → Add to cart → Choose order type → Enter details → Pay
or choose an allowed offline method → Receive confirmation → Staff
fulfils the order.**

Every payment and order status must be determined and validated by the
backend. The supplied screenshot guides the look and feel; Urban Spice
branding, genuine restaurant content, usability, and reliable ordering
take priority.
