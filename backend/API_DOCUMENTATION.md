# GCG Document Hub - API Documentation

## Overview

The GCG Document Hub API provides a comprehensive REST API for managing Good Corporate Governance (GCG) documents, user management, organizational structure, and system monitoring. The API follows RESTful principles and uses JWT authentication.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "method": "GET"
}
```

---

## 1. Authentication Endpoints

### 1.1 User Registration
- **POST** `/auth/register`
- **Description**: Register a new user account
- **Access**: Public
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "user",
  "direktoratId": "uuid-optional",
  "subdirektoratId": "uuid-optional",
  "divisiId": "uuid-optional"
}
```

### 1.2 User Login
- **POST** `/auth/login`
- **Description**: Authenticate user and receive access tokens
- **Access**: Public
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": { ... }
  }
}
```

### 1.3 Refresh Token
- **POST** `/auth/refresh`
- **Description**: Get new access token using refresh token
- **Access**: Public
- **Body**:
```json
{
  "refreshToken": "refresh_token"
}
```

### 1.4 User Logout
- **POST** `/auth/logout`
- **Description**: Logout user and invalidate refresh token
- **Access**: Authenticated

### 1.5 Get User Profile
- **GET** `/auth/profile`
- **Description**: Get current user's profile information
- **Access**: Authenticated

### 1.6 Change Password
- **PUT** `/auth/change-password`
- **Description**: Change user's password
- **Access**: Authenticated
- **Body**:
```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password"
}
```

---

## 2. User Management Endpoints

### 2.1 Get All Users
- **GET** `/users?page=1&limit=10&search=john&role=admin`
- **Description**: Get paginated list of users with filtering
- **Access**: Admin+
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search by name or email
  - `role`: Filter by role
  - `direktoratId`: Filter by direktorat
  - `isActive`: Filter by active status

### 2.2 Get User by ID
- **GET** `/users/:id`
- **Description**: Get specific user details
- **Access**: Admin+

### 2.3 Create User
- **POST** `/users`
- **Description**: Create new user account
- **Access**: Admin+
- **Body**: Same as registration

### 2.4 Update User
- **PUT** `/users/:id`
- **Description**: Update user information
- **Access**: Admin+
- **Body**:
```json
{
  "name": "Updated Name",
  "role": "admin",
  "direktoratId": "new_uuid",
  "isActive": true
}
```

### 2.5 Delete User
- **DELETE** `/users/:id`
- **Description**: Delete user account
- **Access**: Superadmin only

### 2.6 Toggle User Status
- **PATCH** `/users/:id/status`
- **Description**: Activate/deactivate user
- **Access**: Admin+
- **Body**:
```json
{
  "isActive": false
}
```

### 2.7 Get User Statistics
- **GET** `/users/stats/overview`
- **Description**: Get user statistics and analytics
- **Access**: Admin+

---

## 3. Document Management Endpoints

### 3.1 Upload Document
- **POST** `/documents/upload`
- **Description**: Upload new document
- **Access**: Authenticated
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: Document file
  - `year`: Document year
  - `aspectId`: GCG aspect ID (optional)
  - `direktoratId`: Direktorat ID (optional)
  - `assignedTo`: User ID (optional)
  - `dueDate`: Due date (optional)

### 3.2 Get All Documents
- **GET** `/documents?page=1&limit=10&year=2024&status=pending`
- **Description**: Get paginated list of documents with filtering
- **Access**: Authenticated (role-based access)
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `search`: Search by filename
  - `year`: Filter by year
  - `aspectId`: Filter by aspect
  - `status`: Filter by status
  - `direktoratId`: Filter by direktorat

### 3.3 Get Document by ID
- **GET** `/documents/:id`
- **Description**: Get specific document details
- **Access**: Authenticated (role-based access)

### 3.4 Update Document
- **PUT** `/documents/:id`
- **Description**: Update document metadata
- **Access**: Authenticated (role-based access)
- **Body**:
```json
{
  "status": "approved",
  "assignedTo": "user_uuid",
  "dueDate": "2024-12-31"
}
```

### 3.5 Delete Document
- **DELETE** `/documents/:id`
- **Description**: Delete document and file
- **Access**: Authenticated (role-based access)

### 3.6 Download Document
- **GET** `/documents/:id/download`
- **Description**: Download document file
- **Access**: Authenticated (role-based access)

### 3.7 Search Documents
- **POST** `/documents/search`
- **Description**: Full-text search documents
- **Access**: Authenticated (role-based access)
- **Body**:
```json
{
  "query": "search term",
  "filters": {
    "year": 2024,
    "status": "pending"
  },
  "page": 1,
  "limit": 10
}
```

### 3.8 Get Document Statistics
- **GET** `/documents/stats?year=2024`
- **Description**: Get document statistics and analytics
- **Access**: Authenticated

---

## 4. Metadata Management Endpoints

### 4.1 Aspects

#### Get All Aspects
- **GET** `/metadata/aspects`
- **Description**: Get all GCG aspects
- **Access**: Authenticated

#### Get Aspect by ID
- **GET** `/metadata/aspects/:id`
- **Description**: Get specific aspect details
- **Access**: Authenticated

#### Create Aspect
- **POST** `/metadata/aspects`
- **Description**: Create new GCG aspect
- **Access**: Admin+
- **Body**:
```json
{
  "nama": "Transparency",
  "deskripsi": "Transparency in corporate governance"
}
```

#### Update Aspect
- **PUT** `/metadata/aspects/:id`
- **Description**: Update aspect information
- **Access**: Admin+

#### Delete Aspect
- **DELETE** `/metadata/aspects/:id`
- **Description**: Delete aspect
- **Access**: Admin+

### 4.2 Klasifikasi

#### Get All Klasifikasi
- **GET** `/metadata/klasifikasi`
- **Description**: Get all document classifications
- **Access**: Authenticated

#### Create Klasifikasi
- **POST** `/metadata/klasifikasi`
- **Description**: Create new classification
- **Access**: Admin+

#### Update Klasifikasi
- **PUT** `/metadata/klasifikasi/:id`
- **Description**: Update classification
- **Access**: Admin+

#### Delete Klasifikasi
- **DELETE** `/metadata/klasifikasi/:id`
- **Description**: Delete classification
- **Access**: Admin+

### 4.3 Years

#### Get All Years
- **GET** `/metadata/years`
- **Description**: Get all available years
- **Access**: Authenticated

#### Create Year
- **POST** `/metadata/years`
- **Description**: Create new year
- **Access**: Admin+
- **Body**:
```json
{
  "tahun": 2025,
  "isActive": true
}
```

#### Update Year
- **PUT** `/metadata/years/:id`
- **Description**: Update year settings
- **Access**: Admin+

#### Delete Year
- **DELETE** `/metadata/years/:id`
- **Description**: Delete year
- **Access**: Admin+

---

## 5. Organizational Structure Endpoints

### 5.1 Direktorat

#### Get All Direktorat
- **GET** `/struktur/direktorat`
- **Description**: Get all directorates
- **Access**: Authenticated

#### Create Direktorat
- **POST** `/struktur/direktorat`
- **Description**: Create new directorate
- **Access**: Admin+
- **Body**:
```json
{
  "nama": "Finance Directorate",
  "deskripsi": "Manages financial operations"
}
```

#### Update Direktorat
- **PUT** `/struktur/direktorat/:id`
- **Description**: Update directorate
- **Access**: Admin+

#### Delete Direktorat
- **DELETE** `/struktur/direktorat/:id`
- **Description**: Delete directorate
- **Access**: Admin+

### 5.2 Subdirektorat

#### Get All Subdirektorat
- **GET** `/struktur/subdirektorat?direktoratId=uuid`
- **Description**: Get all sub-directorates
- **Access**: Authenticated

#### Create Subdirektorat
- **POST** `/struktur/subdirektorat`
- **Description**: Create new sub-directorate
- **Access**: Admin+
- **Body**:
```json
{
  "nama": "Accounting Division",
  "direktoratId": "parent_uuid",
  "deskripsi": "Handles accounting functions"
}
```

#### Update Subdirektorat
- **PUT** `/struktur/subdirektorat/:id`
- **Description**: Update sub-directorate
- **Access**: Admin+

#### Delete Subdirektorat
- **DELETE** `/struktur/subdirektorat/:id`
- **Description**: Delete sub-directorate
- **Access**: Admin+

### 5.3 Divisi

#### Get All Divisi
- **GET** `/struktur/divisi?subdirektoratId=uuid&direktoratId=uuid`
- **Description**: Get all divisions
- **Access**: Authenticated

#### Create Divisi
- **POST** `/struktur/divisi`
- **Description**: Create new division
- **Access**: Admin+
- **Body**:
```json
{
  "nama": "Accounts Payable",
  "subdirektoratId": "parent_uuid",
  "deskripsi": "Manages accounts payable"
}
```

#### Update Divisi
- **PUT** `/struktur/divisi/:id`
- **Description**: Update division
- **Access**: Admin+

#### Delete Divisi
- **DELETE** `/struktur/divisi/:id`
- **Description**: Delete division
- **Access**: Admin+

---

## 6. Activity Logs & System Monitoring

### 6.1 Activity Logs

#### Get All Activity Logs
- **GET** `/activity/logs?page=1&limit=50&userId=uuid&action=login`
- **Description**: Get paginated activity logs with filtering
- **Access**: Admin+
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `userId`: Filter by user
  - `action`: Filter by action type
  - `entityType`: Filter by entity type
  - `startDate`: Filter by start date
  - `endDate`: Filter by end date
  - `ipAddress`: Filter by IP address

#### Get Activity Log by ID
- **GET** `/activity/logs/:id`
- **Description**: Get specific activity log
- **Access**: Admin+

#### Get User Activity Logs
- **GET** `/activity/users/:userId/logs`
- **Description**: Get activity logs for specific user
- **Access**: Admin+

### 6.2 Statistics & Monitoring

#### Get Activity Statistics
- **GET** `/activity/stats?period=30d`
- **Description**: Get activity statistics for specified period
- **Access**: Admin+
- **Query Parameters**:
  - `period`: Time period (7d, 30d, 90d, 1y)

#### Get System Health
- **GET** `/activity/health`
- **Description**: Get system health and performance metrics
- **Access**: Admin+

#### Export Activity Logs
- **GET** `/activity/export?format=csv&startDate=2024-01-01&endDate=2024-12-31`
- **Description**: Export activity logs in JSON or CSV format
- **Access**: Admin+
- **Query Parameters**:
  - `format`: Export format (json, csv)
  - `startDate`: Start date for export
  - `endDate`: End date for export

---

## 7. Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 413 | Payload Too Large - File size exceeds limit |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error - Server error |

---

## 8. Rate Limiting

The API implements rate limiting to prevent abuse:
- **Window**: 15 minutes
- **Limit**: 100 requests per IP address per window
- **Headers**: Rate limit information included in response headers

---

## 9. File Upload

### Supported File Types
- PDF, DOC, DOCX
- XLS, XLSX
- PPT, PPTX
- TXT
- JPG, JPEG, PNG

### File Size Limits
- **Default**: 10MB
- **Configurable**: Via environment variable `MAX_FILE_SIZE`

### File Storage
- Files are stored in year-based directories
- Unique filenames generated to prevent conflicts
- File metadata stored in database

---

## 10. Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permission levels for users
- **Input Validation**: Comprehensive input validation and sanitization
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against abuse
- **Helmet**: Security headers middleware
- **Activity Logging**: Comprehensive audit trail

---

## 11. Development & Testing

### Environment Variables
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/gcg_hub
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### Testing Endpoints
- **Health Check**: `GET /health`
- **API Status**: Check response headers for rate limit info

---

## 12. Deployment

### Production Considerations
- Use strong JWT secrets
- Configure proper CORS origins
- Set up database connection pooling
- Implement proper logging
- Use HTTPS in production
- Configure file storage (S3 recommended for production)
- Set up monitoring and alerting

### Docker Support
The application includes Docker configuration for easy deployment and scaling.

---

## Support

For API support and questions, please refer to the project documentation or contact the development team.
