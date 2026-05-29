# Phase 4 & Phase 5 Implementation Guide

## Phase 4: Reports, Notifications, and Chat

### Overview
Phase 4 focuses on business intelligence, real-time communication, and employee engagement through three main modules:

1. **Reports & Analytics** - Data-driven insights for decision making
2. **Notifications** - Multi-channel alerting system (in-app + email)
3. **Chat & Collaboration** - Real-time messaging for teams

### Phase 4 - Backend Implementation

#### 1. Reports Module (✅ COMPLETE)

**Location**: `/apps/api/src/`

**Files Created**:
- `repositories/report.repository.ts` - Database queries for report generation
- `services/report.service.ts` - Business logic and RBAC validation
- `controllers/report.controller.ts` - HTTP endpoints
- `validators/report.validator.ts` - Input validation schemas
- `routes/report.routes.ts` - Route definitions

**Available Reports**:

1. **Attendance Report**
   - Date range filtering
   - Department filtering
   - Statistics: present, absent, late, half-day, remote, on-leave
   - CSV/JSON export support
   - Endpoint: `GET /api/v1/reports/attendance`

2. **Payroll Report**
   - Monthly breakdown
   - Department filtering
   - Salary aggregates and totals
   - Endpoint: `GET /api/v1/reports/payroll`

3. **Project Progress Report**
   - Task statistics by status
   - Project completion tracking
   - Team member details
   - Endpoint: `GET /api/v1/reports/projects`

4. **Leave Report**
   - Date range filtering
   - Leave status tracking
   - Employee details
   - Endpoint: `GET /api/v1/reports/leaves`

5. **Productivity Report**
   - Task completion rates
   - Attendance tracking
   - Task priority breakdown
   - Endpoint: `GET /api/v1/reports/productivity`

**RBAC Permissions**:
- HR + Manager + Super Admin: Attendance reports
- HR + Super Admin: Payroll reports
- HR + Super Admin: Leave reports
- Manager + Super Admin: Productivity reports
- All roles: Project reports

**Export Formats**:
- CSV format for spreadsheet applications
- JSON format for data integration

#### 2. Notifications Module (✅ COMPLETE)

**Location**: `/apps/api/src/services/notification.service.ts`

**Features**:
- In-app notifications (persisted to database)
- Email notifications with HTML templates
- Event-based triggering
- Email templates for:
  - Leave approvals/rejections
  - Payroll processing
  - Task assignments
  - Announcements

**Key Methods**:
```typescript
// Create and send notification
await notificationService.createNotification(
  userId,
  'LEAVE',
  'Leave Request Approved',
  'Your leave request has been approved'
);

// Send email
await notificationService.sendEmailNotification(
  email@example.com,
  subject,
  htmlContent
);

// Get unread notifications
const unread = await notificationService.getUnreadNotifications(userId);

// Mark as read
await notificationService.markAsRead(notificationId);
```

**Notification Types**:
- SYSTEM - System alerts
- TASK - Task-related notifications
- LEAVE - Leave request updates
- PAYROLL - Salary processing
- PROJECT - Project updates
- CHAT - Chat messages
- ANNOUNCEMENT - Company announcements

**SMTP Configuration** (in `.env`):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@crm.local
```

**TODO - Phase 4 Follow-up**:
- [ ] Create notification controller and API endpoints
- [ ] Integrate with Socket.io for real-time notifications
- [ ] Add notification preferences/settings per user
- [ ] Create background job queue for bulk notifications
- [ ] Add webhook support for third-party integrations

#### 3. Chat Module (✅ COMPLETE)

**Location**: `/apps/api/src/services/chat.service.ts`

**Features**:
- Direct messaging between users
- Project team chat rooms
- Message history
- Member management
- File sharing support

**Key Methods**:
```typescript
// Create direct chat
const room = await chatService.getOrCreateDirectRoom(userId1, userId2);

// Create project room
const room = await chatService.getOrCreateProjectRoom(projectId, user);

// Get user's chat rooms
const { rooms, total } = await chatService.getChatRooms(user);

// Send message
const message = await chatService.sendMessage(
  roomId,
  senderId,
  content,
  mentions,
  fileUrl
);

// Edit/delete messages
await chatService.editMessage(messageId, senderId, newContent);
await chatService.deleteMessage(messageId, userId);

// Manage members
await chatService.addMembers(roomId, userIds, user);
await chatService.removeMember(roomId, userId, requester);
```

**Database Models**:
- `ChatRoom` - Conversation container (direct or project-based)
- `ChatMember` - Room membership tracking
- `Message` - Individual messages with sender info

**TODO - Phase 4 Follow-up**:
- [ ] Create chat controller and API endpoints
- [ ] Implement WebSocket handlers for real-time messaging
- [ ] Add message read receipts
- [ ] Add typing indicators
- [ ] Implement message search
- [ ] Add file upload/download endpoints

---

## Phase 5: SaaS Features and AI-Ready Architecture

### Overview
Phase 5 transforms the CRM into a true multi-tenant SaaS platform with subscription management, billing, and AI integration points.

### Phase 5 - Architecture & Planning

#### 1. Multi-Tenancy & Subscription Management

**Current State**:
- Single company per installation (Company model exists)
- Basic subscription fields in CompanySubscription model

**Phase 5 Enhancements**:
```typescript
// Enhance CompanySubscription model
model CompanySubscription {
  id                String              @id @default(uuid())
  companyId         String              @unique
  planId            String
  status            SubscriptionStatus  // ACTIVE, TRIAL, EXPIRED, CANCELLED
  stripeCustomerId  String?             // Stripe integration
  stripeSubscriptionId String?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  trialEndsAt       DateTime?
  cancelledAt       DateTime?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  company       Company  @relation(fields: [companyId], references: [id])
  plan          Plan     @relation(fields: [planId], references: [id])
  invoices      Invoice[]
  usageRecords  UsageRecord[]
}

model Plan {
  id                String   @id @default(uuid())
  name              String   // STARTER, PROFESSIONAL, ENTERPRISE
  slug              String   @unique
  displayName       String
  description       String?
  monthlyPrice      Decimal
  annualPrice       Decimal?
  maxUsers          Int
  maxProjects       Int
  features          String[] // Array of feature flags
  createdAt         DateTime @default(now())
  
  subscriptions CompanySubscription[]
}

model Invoice {
  id                  String    @id @default(uuid())
  companyId           String
  subscriptionId      String
  amount              Decimal
  currency            String    @default("USD")
  status              String    // DRAFT, SENT, PAID, FAILED
  dueDate             DateTime
  paidAt              DateTime?
  stripeInvoiceId     String?
  createdAt           DateTime  @default(now())
  
  company       Company                @relation(fields: [companyId], references: [id])
  subscription  CompanySubscription    @relation(fields: [subscriptionId], references: [id])
}

model UsageRecord {
  id              String   @id @default(uuid())
  subscriptionId  String
  metric          String   // "api_calls", "storage_gb", "users", etc.
  value           Float
  period          String   // "2024-05"
  createdAt       DateTime @default(now())
  
  subscription    CompanySubscription @relation(fields: [subscriptionId], references: [id])
}
```

#### 2. Billing & Payment Integration

**Services to Create**:
- `SubscriptionService` - Subscription lifecycle management
- `BillingService` - Invoice generation and payment tracking
- `StripeService` - Stripe webhook handling

**Key Features**:
- Trial period management (14 days default)
- Automatic renewal
- Plan upgrades/downgrades
- Pro-rate calculations
- Invoice generation
- Payment retries
- Dunning management

#### 3. Usage Tracking & Metering

**Metrics to Track**:
- API requests per month
- Storage usage (GB)
- Active users
- Data exports
- Report generations

**Implementation**:
```typescript
// Track API usage
async function trackUsage(companyId: string, metric: string, value: number) {
  const subscription = await prisma.companySubscription.findUnique({
    where: { companyId }
  });
  
  if (subscription) {
    await prisma.usageRecord.create({
      data: {
        subscriptionId: subscription.id,
        metric,
        value,
        period: getCurrentMonth(), // "2024-05"
      }
    });
  }
}
```

#### 4. Feature Flags & Plan-Based Access Control

**Architecture**:
```typescript
// Feature flag system
const PLAN_FEATURES = {
  STARTER: ['attendance', 'leave', 'basic_reports'],
  PROFESSIONAL: ['attendance', 'leave', 'payroll', 'projects', 'tasks', 'advanced_reports', 'chat'],
  ENTERPRISE: ['*'] // All features
};

// Middleware to check plan features
async function requireFeature(feature: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const company = req.user!.company;
    if (!hasFeature(company, feature)) {
      return res.status(403).json({
        error: 'Feature not available in your plan',
        suggestedPlan: 'PROFESSIONAL'
      });
    }
    next();
  };
}
```

#### 5. AI Integration Points (Ready)

**Phase 5 AI Framework**:
```typescript
// AI Service - prepared for LLM integration
export class AIService {
  // Predictive analytics
  async predictLeavePatterns(companyId: string) {
    // TODO: Analyze leave history, holidays, patterns
  }
  
  // Smart report generation
  async generateInsightSummary(reportData: any) {
    // TODO: Use LLM to generate executive summary
  }
  
  // Intelligent search
  async searchWithAI(query: string, companyId: string) {
    // TODO: Vector embeddings for semantic search
  }
  
  // Automated suggestions
  async suggestOptimalTeamComposition(projectId: string) {
    // TODO: ML model for team recommendations
  }
}
```

**Ready for Integrations**:
- OpenAI GPT-4 (text generation, analysis)
- Anthropic Claude (document processing)
- Vector databases (Pinecone, Supabase pgvector)
- Hugging Face (ML models)

#### 6. Admin Dashboard

**Admin Module Features**:
- User management
- Role management
- Subscription monitoring
- Usage analytics
- Billing management
- System health checks
- Audit logs viewer

#### 7. Compliance & Security (Phase 5)

**SOC 2 Compliance**:
- [ ] Implement comprehensive audit logging
- [ ] Add SSO/SAML support
- [ ] Implement IP whitelisting
- [ ] Add two-factor authentication (2FA)
- [ ] Create compliance reporting

**Data Security**:
- [ ] Encrypt sensitive fields at rest
- [ ] Add field-level encryption for PII
- [ ] Implement data retention policies
- [ ] Add GDPR/CCPA compliance features

---

## Integration Checklist

### Phase 4 - Frontend Integration (TODO)

**Components to Create**:

1. **Reports Page** (`/apps/web/src/pages/reports/`)
   - ReportsPage.tsx (main page)
   - AttendanceReportView.tsx
   - PayrollReportView.tsx
   - ProjectReportView.tsx
   - LeaveReportView.tsx
   - ProductivityReportView.tsx
   - ExportButton.tsx

2. **Notifications UI** (`/apps/web/src/components/notifications/`)
   - NotificationBell.tsx (header component)
   - NotificationPanel.tsx (dropdown)
   - NotificationList.tsx
   - NotificationItem.tsx
   - useNotifications hook

3. **Chat UI** (`/apps/web/src/pages/chat/` & `/apps/web/src/components/chat/`)
   - ChatPage.tsx (main page)
   - ChatRoomList.tsx
   - ChatWindow.tsx
   - MessageInput.tsx
   - MessageList.tsx
   - useChat hook

### Phase 5 - Admin Dashboard (TODO)

**Admin Components**:
- UserManagementPage.tsx
- SubscriptionManagementPage.tsx
- BillingPage.tsx
- AuditLogsPage.tsx
- SystemHealthPage.tsx

---

## Database Schema Additions

### Phase 4 Schema (Already in place)
- ✅ Notification model
- ✅ Announcement model
- ✅ ChatRoom, ChatMember, Message models
- ✅ Activity model for audit logs

### Phase 5 Schema (To be added)

```prisma
model Plan {
  id              String   @id @default(uuid())
  name            String   @unique
  displayName     String
  description     String?
  monthlyPrice    Decimal  @db.Decimal(10, 2)
  annualPrice     Decimal? @db.Decimal(10, 2)
  maxUsers        Int
  maxProjects     Int
  features        String[] // JSON array of features
  createdAt       DateTime @default(now())
  
  subscriptions   CompanySubscription[]
  @@map("plans")
}

// Update existing CompanySubscription
model CompanySubscription {
  // ... existing fields ...
  stripeCustomerId      String?
  stripeSubscriptionId  String?
  trialEndsAt          DateTime?
  invoices             Invoice[]
  usageRecords         UsageRecord[]
}

model Invoice {
  id                    String   @id @default(uuid())
  companyId             String   @map("company_id")
  subscriptionId        String   @map("subscription_id")
  amount                Decimal  @db.Decimal(12, 2)
  currency              String   @default("USD")
  status                String   @default("DRAFT")
  dueDate               DateTime @map("due_date")
  paidAt                DateTime? @map("paid_at")
  stripeInvoiceId       String?  @map("stripe_invoice_id")
  createdAt             DateTime @default(now()) @map("created_at")
  
  company       Company               @relation(fields: [companyId], references: [id])
  subscription  CompanySubscription   @relation(fields: [subscriptionId], references: [id])
  
  @@index([companyId])
  @@map("invoices")
}

model UsageRecord {
  id              String   @id @default(uuid())
  subscriptionId  String   @map("subscription_id")
  metric          String   // "api_calls", "storage_gb", etc.
  value           Float
  period          String   // "2024-05"
  createdAt       DateTime @default(now()) @map("created_at")
  
  subscription    CompanySubscription @relation(fields: [subscriptionId], references: [id])
  
  @@index([subscriptionId, period])
  @@map("usage_records")
}
```

---

## API Endpoints Summary

### Phase 4 - Reports

```
GET  /api/v1/reports/attendance
GET  /api/v1/reports/payroll
GET  /api/v1/reports/projects
GET  /api/v1/reports/leaves
GET  /api/v1/reports/productivity
GET  /api/v1/reports/attendance/export
```

### Phase 4 - Notifications (TODO)

```
GET  /api/v1/notifications
POST /api/v1/notifications/:id/read
POST /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/:id
```

### Phase 4 - Chat (TODO)

```
GET    /api/v1/chat/rooms
GET    /api/v1/chat/rooms/:id
GET    /api/v1/chat/rooms/:id/messages
POST   /api/v1/chat/messages
PUT    /api/v1/chat/messages/:id
DELETE /api/v1/chat/messages/:id
POST   /api/v1/chat/direct/:userId
```

### Phase 5 - Subscriptions (TODO)

```
GET    /api/v1/subscriptions/plans
GET    /api/v1/subscriptions/current
POST   /api/v1/subscriptions/upgrade
POST   /api/v1/subscriptions/cancel
GET    /api/v1/subscriptions/invoices
```

### Phase 5 - Admin (TODO)

```
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PUT    /api/v1/admin/users/:id
GET    /api/v1/admin/subscriptions
GET    /api/v1/admin/audit-logs
```

---

## Testing Scenarios

### Phase 4 Testing

1. **Reports**
   - [ ] Generate attendance report with date range
   - [ ] Export report as CSV
   - [ ] Verify RBAC restrictions
   - [ ] Test pagination

2. **Notifications**
   - [ ] Create notification
   - [ ] Send email with SMTP
   - [ ] Mark as read
   - [ ] Get unread count

3. **Chat**
   - [ ] Create direct chat
   - [ ] Send/receive messages
   - [ ] Join project room
   - [ ] Edit/delete messages

### Phase 5 Testing

1. **Subscriptions**
   - [ ] Create trial subscription
   - [ ] Upgrade plan
   - [ ] Track usage metrics
   - [ ] Generate invoice

2. **Billing**
   - [ ] Stripe webhook integration
   - [ ] Payment processing
   - [ ] Retry failed payments

---

## Next Steps

1. ✅ Create backend services (Phase 4)
2. Create API controllers and routes for Chat/Notifications
3. Integrate Socket.io for real-time features
4. Build Phase 4 frontend components
5. Add Stripe integration (Phase 5)
6. Implement subscription management (Phase 5)
7. Add admin dashboard (Phase 5)
8. Implement AI services (Phase 5)
9. Add compliance features (Phase 5)

---

## Resources

- Stripe API: https://stripe.com/docs/api
- Socket.io: https://socket.io/docs/
- OpenAI API: https://platform.openai.com/docs
- Nodemailer: https://nodemailer.com/
- Prisma: https://www.prisma.io/docs/

---

**Last Updated**: May 27, 2026
**Phase Status**: Phase 1-3 Complete, Phase 4 Backend In Progress, Phase 5 Planning Complete
