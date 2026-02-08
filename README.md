# ArchSaint-Nexus: E-Commerce Receipt Generator

A production-ready NestJS application for automated receipt generation and delivery. This system handles order processing, generates professional PDF receipts, stores them securely, and delivers them via email using a robust background job queue system.

## 🎯 Project Overview

**ArchSaint-Nexus** is an enterprise-grade receipt generation system built with NestJS, TypeORM, and PostgreSQL. It provides a complete solution for e-commerce platforms to automatically generate, store, and deliver receipts to customers.

### Deployed Link
Deployed on render [here](https://receipt-generator-f57d.onrender.com/api/v1/).
To view the API documentation, visit the [Swagger UI](https://receipt-generator-f57d.onrender.com/api/v1/docs).

### Key Features

- ✅ **Automated Receipt Generation**: Background job processing with Bull Queue and Redis
- ✅ **Professional PDF Receipts**: Generated using PDFKit with customizable templates
- ✅ **Secure Cloud Storage**: AWS S3-compatible storage (Supabase) with presigned URLs
- ✅ **Email Delivery**: Automated email sending via Resend or Nodemailer (Gmail)
- ✅ **Role-Based Access Control**: Customer and Admin roles with proper authorization
- ✅ **Idempotent Processing**: Prevents duplicate receipt generation with pessimistic locking
- ✅ **Resilient Architecture**: Retry mechanisms with exponential backoff
- ✅ **API Documentation**: Comprehensive Swagger/OpenAPI documentation

## 🏗️ Architecture

### Technology Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Queue System**: Bull (Redis-backed)
- **PDF Generation**: PDFKit
- **Cloud Storage**: AWS S3 SDK (Supabase Storage)
- **Email Service**: Resend or Nodemailer (Gmail SMTP)
- **Authentication**: JWT with bcrypt password hashing
- **API Documentation**: Swagger/OpenAPI

### Database Schema

#### Entities

**Customer**
- Represents order recipients (email + name)
- Separate from authenticated users
- One-to-many relationship with Orders

**User**
- Authenticated accounts with roles (CUSTOMER/ADMIN)
- JWT-based authentication
- Password hashing with bcrypt

**Order**
- Links to Customer (not User)
- Default status: CONFIRMED (payment assumed successful)
- Includes: subtotal, tax, discount, total, payment method
- One-to-many relationship with OrderItems
- One-to-one relationship with Receipt

**OrderItem**
- Product details for each order line item
- Cascade delete with parent Order

**Receipt**
- Unique receipt ID format: `RCP-YYYYMMDD-{timestamp}`
- Status tracking: PENDING → PDF_UPLOADED → EMAIL_SENT
- Stores S3 object key for retrieval
- Error logging for failed attempts

### Background Job Processing

The system uses a two-queue architecture for resilient processing:

1. **receipt-generation** queue:
   - Generates PDF from order data
   - Uploads PDF to S3-compatible storage
   - Updates receipt status to PDF_UPLOADED
   - Enqueues email job

2. **receipt-email** queue:
   - Retrieves PDF from storage
   - Sends email with PDF attachment
   - Updates receipt status to EMAIL_SENT
   - Records timestamp

Both queues implement:
- Retry logic (3-5 attempts)
- Exponential backoff
- Error logging
- Idempotent job processing

## 📁 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── decorators/          # Custom decorators (@CurrentUser, @Roles)
│   ├── guards/              # JWT and Role guards
│   └── strategies/          # Passport JWT strategy
├── common/                  # Shared utilities
│   └── utils.queue.ts       # Queue helper functions
├── config/                  # Configuration files
│   ├── database.config.ts
│   ├── email.config.ts
│   ├── jwt.config.ts
│   ├── redis.config.ts
│   └── storage.config.ts
├── controllers/             # API controllers
│   ├── auth.controller.ts
│   ├── order.controller.ts
│   ├── receipt.controller.ts
│   └── webhook.controller.ts
├── dtos/                    # Data Transfer Objects
├── entities/                # TypeORM entities
│   ├── customer.entity.ts
│   ├── order.entity.ts
│   ├── order-item.entity.ts
│   ├── receipt.entity.ts
│   └── user.entity.ts
├── migrations/              # Database migrations
├── modules/                 # NestJS modules
│   ├── auth.module.ts
│   ├── database.module.ts
│   ├── queue.module.ts
│   └── receipt.module.ts
├── processors/              # Background job processors
│   ├── receipt.processor.ts
│   └── email.processor.ts
├── services/                # Business logic services
│   ├── auth.service.ts
│   ├── email.service.ts
│   ├── order.service.ts
│   ├── pdf.service.ts
│   ├── receipt.service.ts
│   ├── storage.service.ts
│   └── webhook.service.ts
└── main.ts                  # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bappa-Kamba/receipt-generator
   cd receipt-generator
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Application
   NODE_ENV=development
   PORT=3000

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=receipt_generator

   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Object Storage Configuration (Supabase)
   SUPABASE_STORAGE_ACCESS_KEY_ID=your_access_key
   SUPABASE_STORAGE_SECRET_ACCESS_KEY=your_secret_key
   SUPABASE_STORAGE_BUCKET=receipts
   SUPABASE_STORAGE_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
   SUPABASE_STORAGE_REGION=us-east-1

   # Business Information (for receipts)
   BUSINESS_NAME=KamTech Store
   BUSINESS_ADDRESS=123 Commerce Street, Tech City, TC 12345
   BUSINESS_PHONE=+234-12-3456-7890
   BUSINESS_EMAIL=support@kamtechstore.com

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d

   # Email Configuration (Gmail SMTP)
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   EMAIL_FROM=your-email@gmail.com
   EMAIL_FROM_NAME=KamTech Store
   ```

4. **Run database migrations**
   ```bash
   pnpm run migration:run
   ```

### Development

```bash
# Start in development mode with hot-reload
pnpm run start:dev

# Start in debug mode
pnpm run start:debug
```

### Production

```bash
# Build the application
pnpm run build

# Start in production mode
pnpm run start:prod
```

## 📚 API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:3000/api/v1/docs
```

### Key Endpoints

#### Authentication

- `POST /auth/register` - Register a new user (CUSTOMER or ADMIN)
- `POST /auth/login` - Login and receive JWT token

#### Orders

- `POST /orders` - Create a new order (authenticated)
- `GET /orders` - Get all orders (paginated, role-based filtering)
- `GET /orders/:orderId` - Get order details (owner or admin only)
- `GET /orders/:orderId/receipt` - Get receipt for an order

#### Receipts

- `GET /receipts` - Get all receipts (paginated, role-based filtering)
- `GET /receipts/:receiptId` - Get receipt details with presigned URL

#### Webhooks

- `POST /webhooks/payment-success` - Trigger receipt generation (public endpoint)

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Customer and Admin roles
- **Resource Ownership Validation**: Users can only access their own data
- **Presigned URLs**: Access to stored receipts
- **Pessimistic Locking**: Prevents race conditions in receipt generation

## 🎯 Key Implementation Details

### Receipt Generation Flow

1. **Order Creation**: Customer creates an order (status: CONFIRMED)
2. **Webhook Trigger**: External system calls `/webhooks/payment-success`
3. **Transaction Lock**: Pessimistic write lock prevents duplicate processing
4. **Job Enqueue**: Receipt generation job added to Bull queue
5. **PDF Generation**: PDFKit creates professional receipt PDF
6. **Cloud Upload**: PDF uploaded to S3-compatible storage
7. **Email Delivery**: Receipt emailed to customer
8. **Status Update**: Receipt marked as EMAIL_SENT
9. **Cleanup**: Local PDF file deleted

### Idempotency & Resilience

- **Duplicate Prevention**: Checks for existing receipts before processing
- **Resume Capability**: Can resume from PDF_UPLOADED or EMAIL_SENT states
- **Retry Logic**: Exponential backoff for failed jobs
- **Error Logging**: Detailed error messages stored in receipt entity
- **File Cleanup**: Automatic cleanup of temporary PDF files

### Authorization Rules

- **CUSTOMER Role**: Can only access their own orders and receipts (email match)
- **ADMIN Role**: Can access all orders and receipts
- **Public Endpoints**: Webhook endpoint (no authentication required)

## 🧪 Testing

```bash
# Run unit tests
pnpm run test
```
> Tests have not been implemented in this iteration

## 📊 Database Migrations

```bash
# Generate a new migration
pnpm run migration:generate -- src/migrations/MigrationName

# Create a blank migration
pnpm run migration:create -- src/migrations/MigrationName

# Run pending migrations
pnpm run migration:run

# Revert last migration
pnpm run migration:revert

# Show migration status
pnpm run migration:show
```

## 🔧 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Ensure Redis is running: `redis-cli ping`
   - Check REDIS_URL in .env file

2. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check database credentials in .env
   - Ensure database exists: `createdb receipt_generator`

3. **Email Sending Failed**
   - For Gmail: Enable 2FA and create an App Password
   - Check GMAIL_USER and GMAIL_APP_PASSWORD in .env

4. **Storage Upload Failed**
   - Verify Supabase credentials
   - Check bucket permissions
   - Ensure endpoint URL is correct

## 📝 Recent Updates

### Completed Improvements

✅ **Architecture Clarification**
- Separated Customer (order recipient) from User (authenticated account)
- Removed Payment module (orders default to CONFIRMED status)

✅ **Security Enhancements**
- Implemented password hashing with bcrypt
- Added resource ownership validation
- Role-based access control with decorators

✅ **Race Condition Fix**
- Pessimistic locking in webhook processing
- Idempotent receipt generation

✅ **File Management**
- Automatic cleanup of temporary PDF files
- Error handling with cleanup in finally block

✅ **Receipt ID Improvement**
- Human-readable format: `RCP-YYYYMMDD-{timestamp}`
- Better tracking and debugging

## 🚧 Future Enhancements

- [ ] Add comprehensive unit tests
- [ ] Implement integration tests for webhook signature verification
- [ ] Add load testing for pessimistic locking
- [ ] Create database seeding scripts
- [ ] Add receipt template customization
- [ ] Implement receipt regeneration endpoint
- [ ] Add analytics and reporting
- [ ] Support multiple languages
- [ ] Add receipt preview before sending

## 📄 License

This project is licensed under the UNLICENSED license.

## 👥 Author

Built with ❤️ using NestJS by [Bappa Kamba](https://github.com/Bappa-Kamba)

## 📞 Support

For questions and support, please refer to the API documentation or create an issue in the repository.

---

**Note**: This is a production-ready application. Ensure all environment variables are properly configured before deployment, especially JWT_SECRET and database credentials.
