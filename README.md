# CapyxPerks - Employee Benefits Platform

A comprehensive platform where company employees can log in with their work email, receive yearly credits, and redeem them for company goodies like shirts, bags, mugs, etc.

## Features

- **Demo Password Gate**: Protect your demo site with a configurable password
- **Azure AD Authentication**: Secure SSO login with work email
- **Credit System**: Annual credit allocation based on employee role
- **Product Catalog**: Browse and view company perks with variants (size, color)
- **Shopping Cart**: Add products to cart and manage quantities
- **Order Processing**: Complete checkout with credit deduction
- **Admin Dashboard**: Manage products, inventory, users, and credits
- **Redis Sessions**: Fast session management and cart caching
- **Real-time Balance**: Live credit balance updates

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- React Query for data fetching
- Zustand for state management
- Vite for build tooling

### Backend
- Python with FastAPI
- PostgreSQL for data storage
- Redis for sessions and caching
- SQLAlchemy ORM
- JWT authentication with Azure AD integration

### Infrastructure
- Docker and Docker Compose
- PostgreSQL (containerized)
- Redis (containerized)
- Nginx for frontend serving

## Project Structure

```
CapyxPerks/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication logic
│   ├── services.py          # Business logic
│   ├── database.py          # Database configuration
│   ├── config.py            # Configuration
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # React components
│   │   ├── api/             # API client
│   │   ├── store/           # State management
│   │   ├── hooks/           # Custom hooks
│   │   └── types/            # TypeScript types
│   └── package.json
└── docker-compose.yml        # Docker orchestration
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Azure AD App Registration (for authentication)

### Setup

1. **Clone the repository**
   ```bash
   cd /home/tomma/CapyxPerks
   ```

2. **Configure Azure AD**
   
   Create an Azure AD App Registration and obtain:
   - Client ID
   - Client Secret
   - Tenant ID
   
   Set up redirect URI: `http://localhost:3000/auth/callback`

3. **Set environment variables**
   
   Create a `.env` file in the project root:
   ```env
   # Demo Password (default: capyx2024)
   DEMO_PASSWORD=capyx2024
   
   # Azure AD (optional - only for Azure AD authentication)
   AZURE_AD_CLIENT_ID=your-client-id
   AZURE_AD_CLIENT_SECRET=your-client-secret
   AZURE_AD_TENANT_ID=your-tenant-id
   AZURE_AD_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
   ```
   
   📖 See [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md) for detailed configuration options
   📖 See [DEMO_PASSWORD_CONFIG.md](DEMO_PASSWORD_CONFIG.md) for demo password management

4. **Start the services**
   ```bash
   docker-compose up -d
   ```

5. **Initialize the database**
   ```bash
   docker-compose exec backend python -c "from database import init_db; init_db()"
   ```

6. **Access the application**
   - Frontend: http://localhost:80 (or http://localhost:3001)
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   
   **Note:** On first access, you'll be prompted for the demo password (default: `capyx2024`)

## API Endpoints

### Demo
- `GET /api/demo/password` - Get demo password for access gate (public)

### Authentication
- `GET /api/auth/azure` - Get Azure AD login URL
- `POST /api/auth/callback` - Handle Azure AD callback

### User
- `GET /api/me` - Get current user profile
- `GET /api/credits/balance` - Get credit balance
- `GET /api/credits/ledger` - Get credit transaction history

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details with variants
- `GET /api/variants/:id` - Get variant details

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

### Admin
- `POST /api/admin/products` - Create product (admin only)
- `POST /api/admin/products/:id/variants` - Add variant (admin only)
- `POST /api/admin/products/:id/variants/:vid/inventory` - Update inventory (admin only)
- `POST /api/admin/credits/grant` - Grant credits (admin only)
- `POST /api/admin/users/import` - Import users (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/orders` - Get all orders (admin only)

## Credit System

### Credit Allocation
- **Intern**: 100 credits/year
- **Employee**: 200 credits/year
- **Senior**: 300 credits/year
- **Admin**: 1000 credits/year

### Credit Types
- `GRANT`: Credits added to account
- `DEBIT`: Credits deducted from account
- `ADJUST`: Credits adjusted by admin

## Database Schema

### Core Tables
- `users` - User accounts
- `credit_ledger` - All credit transactions
- `products` - Product catalog
- `product_variants` - Product variants (size, color)
- `inventory_lots` - Inventory tracking
- `orders` - Customer orders
- `order_items` - Order line items

## Development

### Running Locally (without Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Deployment

### Frontend
Deploy to Vercel or similar static hosting.

### Backend
Deploy to AWS ECS, Fly.io, or Render with Docker containers.

### Database
Use AWS RDS for PostgreSQL in production.

## Security

- JWT tokens with secure signing
- Azure AD OAuth 2.0/OIDC integration
- Redis session management with expiration
- CORS protection
- Input validation with Pydantic
- SQL injection protection via SQLAlchemy ORM

## License

MIT

