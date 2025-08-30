

## Technical Specifications: Warehouse Inventory Management System

**Version:** 1.0
**Date:** 2025-05-17
**Project Owner:** Deep Kulshreshtha
**Lead Developer:** Deep Kulshreshtha

**1. Introduction**

This document outlines the technical specifications for a Warehouse Inventory Management System. The system aims to provide a platform for wholesalers to manage their product inventory and for their dealers to view available quantities and place orders. It will facilitate efficient communication and streamline the ordering process, replacing manual inquiries. The system will support a multi-tenant architecture, where each tenant can manage multiple businesses (one wholesaler and multiple dealers), with role-based access control for users within those businesses.

**2. Goals and Objectives**

* Provide real-time inventory visibility for dealers.
* Enable dealers to create product orders directly through the system.
* Allow wholesalers to manage their product catalog and inventory levels.
* Support multiple tenants, each with their own wholesaler and dealer network.
* Implement robust user authentication and role-based authorization to control data access and feature availability.
* Deliver a responsive and mobile-friendly user interface.
* Ensure data integrity, especially during order processing and inventory updates.

**3. System Architecture**

The system will follow a three-tier architecture:

The system will follow a layered architecture packaged into a **single deployable unit**:

* **Presentation Tier (Frontend):**
    * Technology: HTML, CSS (with Bootstrap framework), JavaScript.
    * Responsibility: User interface rendering, user input handling.
    * Note: The static frontend assets (HTML, CSS, JS, images) will be served directly by the backend application.
* **Application Tier (Backend):**
    * Technology: Python with FastAPI framework.
    * Responsibility: Business logic, API endpoint implementation, authentication, authorization, data validation, interaction with the database, and **serving the static frontend files**.
* **Data Tier (Database):**
    * Technology: MySQL.
    * Responsibility: Persistent storage of all application data.
* **External Services:**
    * **Google Cloud Storage (GCS):** For storing product images.

**4. Technology Stack**

* **Database:** MySQL (Version to be determined, latest stable recommended)
* **Backend Framework:** Python (Version 3.8+ recommended) with FastAPI
* **Frontend Framework/Libraries:** HTML5, CSS3, Bootstrap (Latest version)
* **Web Server:** Uvicorn (for FastAPI)
* **Image Storage:** **Google Cloud Storage (GCS)**


**5. Data Model**

All entities will include the following common properties:

* `isDeleted` (BOOLEAN, DEFAULT false)
* `ModifiedBy` (INTEGER, Foreign Key to User.Id, NULLABLE)
* `CreatedBy` (INTEGER, Foreign Key to User.Id, NULLABLE)
* `CreatedAt` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - *Essential for default sorting*
* `ModifiedAt` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

---

**5.1. Tenant**
*Purpose: Represents the top-level customer organization.*
| Column Name         | Data Type       | Constraints                                  | Description                                  |
| :------------------ | :-------------- | :------------------------------------------- | :------------------------------------------- |
| TenantId            | INTEGER         | PRIMARY KEY, AUTO_INCREMENT                  | Unique identifier for the tenant             |
| TenantName          | VARCHAR(255)    | NOT NULL                                     | Name of the tenant                           |
| TenantDescription   | TEXT            | NULLABLE                                     | Description of the tenant                    |
| TenantStatus        | VARCHAR(50)     | NOT NULL (e.g., Active, Inactive, Suspended) | Current status of the tenant                 |
| TenantStartDateTime | DATETIME        | NULLABLE                                     | Date when tenant access starts               |
| TenantEndDateTime   | DATETIME        | NULLABLE                                     | Date when tenant access ends                 |
| TenantType          | VARCHAR(100)    | NULLABLE                                     | Type of tenant (e.g., Standard, Premium)     |
| TenantSubType       | VARCHAR(100)    | NULLABLE                                     | Sub-type of tenant                           |
| AdditionalData      | JSON            | NULLABLE                                     | Additional unstructured data for the tenant  |
| isDeleted           | BOOLEAN         | NOT NULL, DEFAULT false                      |                                              |
| ModifiedBy          | INTEGER         | FK to User.Id, NULLABLE                      | Common property                              |
| CreatedBy           | INTEGER         | FK to User.Id, NULLABLE                      | Common property                              |
| CreatedAt           | TIMESTAMP       | NOT NULL, DEFAULT CURRENT_TIMESTAMP          |                                              |
| ModifiedAt           | TIMESTAMP       | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                              |

---

**5.2. Business**
*Purpose: Represents a Wholesaler or Dealer entity within a Tenant.*
| Column Name    | Data Type    | Constraints                                               | Description                                        |
| :------------- | :----------- | :-------------------------------------------------------- | :------------------------------------------------- |
| Id             | INTEGER      | PRIMARY KEY, AUTO_INCREMENT                               | Unique identifier for the business                 |
| TenantId       | INTEGER      | NOT NULL, FOREIGN KEY to Tenant(TenantId)                 | Associates business with a tenant                  |
| Type           | ENUM('WHOLESALER', 'DEALER') | NOT NULL                                  | Type of business                                   |
| SubType        | VARCHAR(100) | NULLABLE                                                  | Sub-type for the business (e.g., regional dealer)  |
| Name           | VARCHAR(255) | NOT NULL                                                  | Name of the business                               |
| Description    | TEXT         | NULLABLE                                                  | Description of the business                        |
| AddressLine1   | VARCHAR(255) | NULLABLE                                                  | Business address                                   |
| AddressLine2   | VARCHAR(255) | NULLABLE                                                  | Business address                                   |
| Email          | VARCHAR(255) | NULLABLE, UNIQUE (Consider per tenant or globally)        | Business contact email                             |
| PhoneNumber    | VARCHAR(20)  | NULLABLE                                                  | Business contact phone number                      |
| Status         | ENUM('Active', 'Inactive') | NOT NULL, DEFAULT 'Active'                 | Current status of the business                     |
| StartDateTime  | DATETIME     | NULLABLE                                                  | Date when business access starts (overrides common)|
| EndDateTime    | DATETIME     | NULLABLE                                                  | Date when business access ends (overrides common)  |
| isDeleted      | BOOLEAN      | NOT NULL, DEFAULT false                                   |                                                    |
| ModifiedBy     | INTEGER      | FK to User.Id, NULLABLE                                   | Common property                                    |
| CreatedBy      | INTEGER      | FK to User.Id, NULLABLE                                   | Common property                                    |
| CreatedAt      | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                       |                                                    |
| ModifiedAt      | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                    |
*Note: `StartDateTime` and `EndDateTime` here seem specific to the business entity, distinct from the common audit properties if they signify operational dates.*

---

**5.3. User**
*Purpose: Represents an individual user of the system, associated with a Tenant and optionally a Business.*
| Column Name    | Data Type    | Constraints                                                                 | Description                                           |
| :------------- | :----------- | :-------------------------------------------------------------------------- | :---------------------------------------------------- |
| Id             | INTEGER      | PRIMARY KEY, AUTO_INCREMENT                                                 | Unique identifier for the user                        |
| TenantId       | INTEGER      | NOT NULL, FOREIGN KEY to Tenant(TenantId)                                   | Associates user with a tenant                         |
| BusinessId     | INTEGER      | NULLABLE, FOREIGN KEY to Business(Id)                                       | Associates user with a specific business (if not admin) |
| Role           | ENUM('SuperAdmin', 'TechAdmin', 'SalesAdmin', 'WholesalerAdmin', 'Wholesaler', 'DealerAdmin', 'Dealer') | NOT NULL | User's role defining access level                 |
| UserName       | VARCHAR(100) | NOT NULL, UNIQUE                                                            | Unique username for login                             |
| PasswordHash   | VARCHAR(255) | NOT NULL                                                                    | Hashed password                                       |
| Name           | VARCHAR(255) | NOT NULL                                                                    | Full name of the user                                 |
| AddressLine1   | VARCHAR(255) | NULLABLE                                                                    | User's address                                        |
| AddressLine2   | VARCHAR(255) | NULLABLE                                                                    | User's address                                        |
| Email          | VARCHAR(255) | NOT NULL, UNIQUE                                                            | User's contact email                                  |
| PhoneNumber    | VARCHAR(20)  | NULLABLE                                                                    | User's contact phone number                           |
| Description    | TEXT         | NULLABLE                                                                    | Additional notes about the user                       |
| UserStatus     | ENUM('Active', 'Inactive') | NOT NULL, DEFAULT 'Active'                                  | Current status of the user                            |
| isDeleted      | BOOLEAN      | NOT NULL, DEFAULT false                                                     |                                                       |
| ModifiedBy     | INTEGER      | FK to User.Id, NULLABLE                                                     | Common property                                       |
| CreatedBy      | INTEGER      | FK to User.Id, NULLABLE                                                     | Common property                                       |
| CreatedAt      | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                                         |                                                       |
| ModifiedAt      | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP             |                                                       |

---

**5.4. Configurations**
*Purpose: Stores dynamic configurations for different entities (Tenant, Business, User).*
| Column Name | Data Type    | Constraints                               | Description                                                  |
| :---------- | :----------- | :---------------------------------------- | :----------------------------------------------------------- |
| Id          | INTEGER      | PRIMARY KEY, AUTO_INCREMENT               | Unique identifier for the configuration                      |
| Type        | ENUM('Tenant', 'Business', 'User') | NOT NULL          | The type of entity this configuration applies to           |
| SubType     | VARCHAR(100) | NULLABLE                                  | Further specifies the configuration type (e.g., UI_Theme)  |
| RefId       | VARCHAR(255) | NOT NULL                                  | Identifier of the entity (TenantId, BusinessId, UserId)    |
| Key         | VARCHAR(255) | NOT NULL                                  | Configuration key                                            |
| Value       | TEXT         | NOT NULL                                  | Configuration value                                          |
| ValueType   | ENUM('Integer', 'String', 'Boolean', 'JSON') | NOT NULL | Data type of the value (for parsing/validation)             |
| isDeleted   | BOOLEAN      | NOT NULL, DEFAULT false                   |                                                              |
| ModifiedBy  | INTEGER      | FK to User.Id, NULLABLE                   | Common property                                              |
| CreatedBy   | INTEGER      | FK to User.Id, NULLABLE                   | Common property                                              |
| CreatedAt   | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP       |                                                              |
| ModifiedAt   | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                              |
*Index on (Type, RefId, Key) for efficient lookups.*

---

**5.5. Features**
*Purpose: Manages feature flags or specific feature configurations, possibly for entitlements.*
| Column Name       | Data Type    | Constraints                               | Description                                           |
| :---------------- | :----------- | :---------------------------------------- | :---------------------------------------------------- |
| Id                | INTEGER      | PRIMARY KEY, AUTO_INCREMENT               | Unique identifier for the feature                     |
| Type              | ENUM('Tenant', 'User', 'Business') | NOT NULL          | Entity type the feature applies to (e.g., Tenant, User) |
| SubType           | VARCHAR(100) | NULLABLE                                  | Sub-type (e.g., Wholesaler, Dealer, SpecificRole)     |
| FeatureName       | VARCHAR(255) | NOT NULL                                  | Human-readable name of the feature                    |
| FeatureDescription| TEXT         | NULLABLE                                  | Description of the feature                            |
| FeatureKey        | VARCHAR(100) | NOT NULL, UNIQUE (scoped by Type/SubType?) | Unique key to identify the feature programmatically   |
| FeatureValue      | VARCHAR(255) | NOT NULL                                  | Value of the feature (e.g., true/false, limit number) |
| ValueType         | ENUM('Integer', 'String', 'Boolean', 'JSON') | NOT NULL | Data type of the value (for parsing/validation)             |
| StartDateTime     | DATETIME     | NULLABLE                                  | When the feature becomes active (overrides common)    |
| EndDateTime       | DATETIME     | NULLABLE                                  | When the feature expires (overrides common)           |
| Status            | ENUM('Active', 'Inactive') | NOT NULL, DEFAULT 'Active' | Status of the feature flag                            |
| isDeleted         | BOOLEAN      | NOT NULL, DEFAULT false                   |                                                       |
| ModifiedBy        | INTEGER      | FK to User.Id, NULLABLE                   | Common property                                       |
| CreatedBy         | INTEGER      | FK to User.Id, NULLABLE                   | Common property                                       |
| CreatedAt         | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP       |                                                       |
| ModifiedAt         | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                       |

---

**5.6. Subscription**
*Purpose: Manages subscriptions for Tenants, Businesses, or Users to specific services or feature sets.*
| Column Name   | Data Type    | Constraints                               | Description                                              |
| :------------ | :----------- | :---------------------------------------- | :------------------------------------------------------- |
| Id            | INTEGER      | PRIMARY KEY, AUTO_INCREMENT               | Unique identifier for the subscription                   |
| Type          | ENUM('Tenant', 'Business', 'User') | NOT NULL          | Entity type this subscription applies to                 |
| RefId         | VARCHAR(255) | NOT NULL                                  | Identifier of the entity (TenantId, BusinessId, UserId)  |
| SubType       | VARCHAR(100) | NULLABLE                                  | Specific plan or type of subscription (e.g., Gold, Basic)|
| StartDateTime | DATETIME     | NOT NULL                                  | Subscription start date (overrides common)             |
| EndDateTime   | DATETIME     | NOT NULL                                  | Subscription end date (overrides common)               |
| Status        | ENUM('Active', 'Inactive', 'Expired', 'Cancelled') | NOT NULL, DEFAULT 'Active' | Status of the subscription            |
| isDeleted     | BOOLEAN      | NOT NULL, DEFAULT false                   |                                                          |
| ModifiedBy    | INTEGER      | FK to User.Id, NULLABLE                   | Common property                                          |
| CreatedBy     | INTEGER      | FK to User.Id, NULLABLE                   | Common property                                          |
| CreatedAt     | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP       |                                                          |
| ModifiedAt     | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                          |

---

**5.7. Products**
*Purpose: Stores information about products offered by Wholesalers.*
| Column Name     | Data Type       | Constraints                               | Description                                        |
| :-------------- | :-------------- | :---------------------------------------- | :------------------------------------------------- |
| Id              | INTEGER         | PRIMARY KEY, AUTO_INCREMENT               | System's unique identifier for the product         |
| ProductId       | VARCHAR(100)    | NOT NULL                                  | Wholesaler's unique product identifier (SKU/Code)  |
| TenantId        | INTEGER         | NOT NULL, FOREIGN KEY to Tenant(TenantId) | Associates product with a tenant (Wholesaler)      |
| Name            | VARCHAR(255)    | NOT NULL                                  | Product name                                       |
| Description     | TEXT            | NULLABLE                                  | Detailed product description                       |
| Quantity        | INTEGER         | NOT NULL, DEFAULT 0, CHECK (Quantity >=0) | Current available stock quantity                   |
| MRP             | DECIMAL(10, 2)  | NOT NULL, CHECK (MRP >=0)                 | Maximum Retail Price                               |
| DiscountType    | ENUM('Fixed', 'Percentage') | NULLABLE                    | Type of discount applicable                        |
| DiscountAmount  | DECIMAL(10, 2)  | NULLABLE, CHECK (DiscountAmount >=0)      | Discount amount or percentage                      |
| TaxType         | VARCHAR(50)     | NULLABLE (e.g., 'GST')                    | Type of tax applicable                             |
| TaxAmount       | DECIMAL(10, 2)  | NULLABLE, CHECK (TaxAmount >=0)           | Tax amount or percentage                           |
| ImageLink       | VARCHAR(1024)   | NULLABLE                                  | URL/Link to the product image (**GCS Path**)            |
| AdditionalData  | JSON            | NULLABLE                                  | Additional unstructured data for the product       |
| isDeleted       | BOOLEAN         | NOT NULL, DEFAULT false                   |                                                    |
| ModifiedBy      | INTEGER         | FK to User.Id, NULLABLE                   | Common property                                    |
| CreatedBy       | INTEGER         | FK to User.Id, NULLABLE                   | Common property                                    |
| CreatedAt       | TIMESTAMP       | NOT NULL, DEFAULT CURRENT_TIMESTAMP       |                                                    |
| ModifiedAt       | TIMESTAMP       | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                    |
*Unique constraint on (TenantId, ProductId) to ensure product ID is unique per tenant.*

---

**5.8. Orders**
*Purpose: Represents an order placed by a Dealer or a request for products.*
| Column Name    | Data Type    | Constraints                               | Description                                       |
| :------------- | :----------- | :---------------------------------------- | :------------------------------------------------ |
| Id             | INTEGER      | PRIMARY KEY, AUTO_INCREMENT               | Unique identifier for the order                   |
| TenantId       | INTEGER      | NOT NULL, FOREIGN KEY to Tenant(TenantId) | Tenant associated with this order                 |
| BusinessId     | INTEGER      | NOT NULL, FOREIGN KEY to Business(Id)     | Dealer business that placed the order             |
| Type           | ENUM('Booked', 'Requested') | NOT NULL                    | Type of order                                     |
| SubType        | VARCHAR(100) | NULLABLE                                  | E.g., 'Urgent', 'Standard'                         |
| OrderStatus    | ENUM('New', 'InProgress', 'Done', 'Cancelled') | NOT NULL, DEFAULT 'New' | Current status of the order      |
| OrderDateTime  | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP       | Timestamp when the order was placed               |
| AdditionalData | JSON         | NULLABLE                                  | Additional unstructured data for the order        |
| isDeleted      | BOOLEAN      | NOT NULL, DEFAULT false                   |                                                   |
| ModifiedBy     | INTEGER      | FK to User.Id, NULLABLE                   | Common property                                   |
| CreatedBy      | INTEGER      | FK to User.Id, NULLABLE                   | Common property                                   |
| CreatedAt      | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP       |                                                   |
| ModifiedAt      | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                   |

---

**5.9. OrderedProducts**
*Purpose: Line items for each order, linking products to an order with specific quantities and pricing at the time of order.*
| Column Name    | Data Type       | Constraints                               | Description                                          |
| :------------- | :-------------- | :---------------------------------------- | :--------------------------------------------------- |
| Id             | INTEGER         | PRIMARY KEY, AUTO_INCREMENT               | Unique identifier for the ordered product line item  |
| OrderId        | INTEGER         | NOT NULL, FOREIGN KEY to Orders(Id)       | Associates this item with an order                   |
| ProductId      | INTEGER         | NOT NULL, FOREIGN KEY to Products(Id)     | The product that was ordered                         |
| Quantity       | INTEGER         | NOT NULL, CHECK (Quantity > 0)            | Quantity of the product ordered                      |
| Price          | DECIMAL(10, 2)  | NOT NULL                                  | Price per unit at the time of order (after discount) |
| DiscountType   | ENUM('Fixed', 'Percentage') | NULLABLE                    | Discount type applied for this item in this order    |
| DiscountAmount | DECIMAL(10, 2)  | NULLABLE                                  | Discount amount/percentage for this item             |
| TaxType        | VARCHAR(50)     | NULLABLE                                  | Tax type applied for this item                       |
| TaxAmount      | DECIMAL(10, 2)  | NULLABLE                                  | Tax amount/percentage for this item                  |
| TotalCost      | DECIMAL(10, 2)  | NOT NULL                                  | Total cost for this line item (Quantity * Price + Tax - Discount) |
| isDeleted      | BOOLEAN         | NOT NULL, DEFAULT false                   |                                                      |
| ModifiedBy     | INTEGER         | FK to User.Id, NULLABLE                   | Common property                                      |
| CreatedBy      | INTEGER         | FK to User.Id, NULLABLE                   | Common property                                      |
| CreatedAt      | TIMESTAMP       | NOT NULL, DEFAULT CURRENT_TIMESTAMP       |                                                      |
| ModifiedAt      | TIMESTAMP       | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                      |

*Unique constraint on (OrderId, ProductId) to avoid duplicate products within the same order.*

---

**6. API Design**

* **General Principles:**
    * RESTful API design.
    * Stateless.
    * All requests and responses will be in JSON format.
    * Standard HTTP methods:
        * `GET`: Retrieve resources.
        * `POST`: Create resources.
        * `PUT`: Update resources (full update).
        * `PATCH`: Partially update resources (e.g., for soft delete or status change).
        * `DELETE`: Soft delete resources (mark `isDeleted = true`, set `CreatedBy`).
    * Authentication: Token-based authentication (e.g., JWT). The token will be passed in the `Authorization` header (`Bearer <token>`).
    * Authorization: Role-based, checked at the endpoint level.
    * Base URL: `/api/v1/`
* **Common API Functionalities:**
    * **Pagination:** All `GET` requests returning lists will support pagination via query parameters (e.g., `?page=1&size=20`). Default size: 20. Response should include total items, total pages, current page.
    * **Sorting:** Support sorting via query parameters (e.g., `?sort_by=CreatedAt&order=desc`). Default sort: `CreatedAt` descending.
    * **Filtering:** Specific endpoints may support filtering based on relevant fields.
    * **Error Handling:** Consistent error response format (e.g., `{"error": {"code": "...", "message": "..."}}`). Standard HTTP status codes will be used.
* **Endpoints:**
    * **Authentication:**
        * `POST /auth/login`: Authenticates a user and returns a token.
        * `POST /auth/refresh-token`: (Optional) Refreshes an expired token.
        * `POST /auth/logout`: (Optional) Invalidates a token (if server-side token management is used).
    * **CRUD Endpoints for Entities:**
        For each entity (Tenants, Businesses, Users, Configurations, Features, Subscriptions, Products, Orders, OrderedProducts), the following endpoints will be created (paths are examples):
        * `POST /<entity_plural_name>`: Create a new entity.
        * `GET /<entity_plural_name>`: List entities (paginated, sortable, filterable).
        * `GET /<entity_plural_name>/{id}`: Retrieve a specific entity by ID.
        * `PUT /<entity_plural_name>/{id}`: Update an existing entity.
        * `PATCH /<entity_plural_name>/{id}`: Partially update an existing entity (e.g. for status change).
        * `DELETE /<entity_plural_name>/{id}`: Soft delete an entity.
    * **Specific Business Logic Endpoints:**
        * `POST /bookings/create`: Endpoint for creating bookings which may result in one 'Booked' order and/or one 'Requested' order. This will handle the transactional logic for updating product quantities.

**7. User Roles and Permissions**

| Role            | Data Visibility                                                               | Key Actions Permitted                                                                                                        |
| :-------------- | :---------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| SuperAdmin      | All data across all Tenants, Businesses.                                      | Full CRUD on all entities, system configuration.                                                                             |
| TechAdmin       | All data across all Tenants, Businesses.                                      | Full CRUD on all entities, system configuration, technical settings.                                                       |
| SalesAdmin      | All data across all Tenants, Businesses.                                      | Full CRUD on Tenants, Businesses, Users, Products, Orders. Primarily for sales and business management.                     |
| WholesalerAdmin | Own Tenant's data, own Wholesaler business data, all Dealer businesses data within their Tenant. | CRUD on own Wholesaler's Products, manage Users within own Wholesaler, view/manage Orders for all Dealers in their Tenant. Manage own Wholesaler business details. Create/edit/delete Products. |
| Wholesaler      | Own Tenant's data, own Wholesaler business data, all Dealer businesses data within their Tenant. | View own Wholesaler's Products, view/manage Orders for all Dealers in their Tenant. Create/edit/delete Products.             |
| DealerAdmin     | Own Tenant's data, own Dealer business data only.                             | Manage Users within own Dealer business. Create Bookings/Orders. View own Orders. Manage own Dealer business details.         |
| Dealer          | Own Tenant's data, own Dealer business data only.                             | Create Bookings/Orders. View own Orders.                                                                                     |

**8. Functional Requirements**

**8.1. Common Functionalities**
* **CRUD Operations:** All entities will have comprehensive CRUD APIs.
* **Authentication & Authorization:** Secure login; role-based access to pages and functionalities.
* **Soft Deletes:** No hard deletes. Entities marked with `isDeleted=true` and `CreatedBy` user ID.
* **Pagination:** Data fetched in pages (default 20 rows).
* **Sorting:** Default sorting by `CreatedAt` descending.
* **Infinite Loader:** UI will display an infinite loader/spinner during backend API calls.
* **Toast Notifications:** Success/failure messages for key operations (create, update, delete).

**8.2. User Interface (UI)**
* **Layout:** Sidebar navigation, main content area.
* **Styling:** Single stylesheet (`stylesheet.css`). Material Design principles, subtle and graceful color palette.
* **Responsiveness:** UI built with Bootstrap, ensuring mobile-friendliness.

**8.3. Login Page**
* Input fields: Username, Password.
* "Login" button.
* Authentication against User table (`PasswordHash`).
* On successful login, store JWT and redirect to the main application.
* Display error messages for invalid credentials.

**8.4. Products Page**
* **Visibility:** SuperAdmin, TechAdmin, SalesAdmin, WholesalerAdmin, Wholesaler.
* **Tenant Selection:**
    * SuperAdmin/TechAdmin/SalesAdmin: Dropdown to select Tenant. Products list updates upon selection.
    * WholesalerAdmin/Wholesaler: Tenant pre-selected and dropdown disabled.
* **Product Listing:**
    * Columns: Image (thumbnail), Product ID, Name, Description, Quantity, MRP, Discount (formatted string), Tax (formatted string).
    * Image Thumbnail: Click to open a dialog with the original image.
    * Actions per row: Edit, Delete buttons.
* **Search:** Search box for ProductId or Name.
* **"Create Product" Button:**
    * Opens a dialog with fields for all Product properties.
    * Image Upload:
        * User selects an image file.
        * Frontend uploads image to **Google Cloud Storage (GCS)** (path: `gs://{bucket_name}/tenants/{tenantId}/products/{uuid}_{image_filename}.{extension}`). The backend may need an endpoint to provide a **GCS signed URL** for direct GCS upload from the frontend, or the frontend uploads to the backend which then relays to GCS.
        * GCS returns the full image path/URL.

        * Image path stored in `Products.ImageLink`.
    * Save: Creates product record. Display success/failure toast.
* **Edit Product:** Opens dialog pre-filled with product data.
* **Delete Product:** Confirmation dialog. On confirm, soft deletes product.

**8.5. Bookings Page**
* **Visibility:** All roles.
* **Tenant/Dealer Selection:**
    * SuperAdmin/TechAdmin/SalesAdmin:
        1.  TenantName dropdown.
        2.  DealerName dropdown (populates based on selected Tenant, lists all Dealers of that tenant).
    * WholesalerAdmin/Wholesaler:
        1.  TenantName dropdown (pre-selected with their Tenant, disabled).
        2.  DealerName dropdown (lists all Dealers of their Tenant).
    * DealerAdmin/Dealer:
        1.  TenantName dropdown (pre-selected with their Tenant, disabled).
        2.  DealerName dropdown (pre-selected with their Dealer Business, disabled).
* **Product Listing (for selected Dealer/Tenant):**
    * Similar to Products page: Image, Product Id, Name, Description, Current Quantity, MRP, Discount, Tax.
    * Checkbox per row: To select the product for booking.
    * Editable "Order Quantity" field per row (numeric input, defaults to 0 or 1).
* **Search:** Search box for ProductId or Name within the displayed products.
* **"Create Booking" Button:**
    * Top right. Disabled by default. Enabled if at least one product is selected (checkbox checked and Order Quantity > 0).
    * On click:
        * For each selected product:
            * If `Order Quantity <= Available Quantity`:
                * Line item for a 'Booked' order.
            * If `Order Quantity > Available Quantity`:
                * Line item for 'Booked' order with `Available Quantity`.
                * Line item for 'Requested' order with (`Order Quantity - Available Quantity`).
        * **Order Creation (Transactional):**
            1.  If any items qualify for 'Booked' order:
                * Create an `Orders` record with `Type='Booked'`, `OrderStatus='New'`.
                * For each booked item, create `OrderedProducts` record.
                * Decrement `Products.Quantity` by the booked amount.
                * This entire block (order creation + quantity update) MUST be transactional. If any part fails, all changes are rolled back.
            2.  If any items qualify for 'Requested' order (and there's no corresponding 'Booked' part for that product if all items ordered were available):
                * Create an `Orders` record with `Type='Requested'`, `OrderStatus='New'`.
                * For each requested item, create `OrderedProducts` record.
        * Display success/failure toast.
* **"Refresh" Button:** Next to "Create Booking". Reloads product quantities from the server for the current view.

**8.6. Orders Page**
* **Visibility:** All roles.
* **Tenant/Business Scope:**
    * SuperAdmin/TechAdmin/SalesAdmin: TenantId dropdown. Displays all orders for the selected tenant.
    * WholesalerAdmin/Wholesaler: TenantId pre-selected and disabled. Displays all orders for their tenant.
    * DealerAdmin/Dealer: TenantId pre-selected and disabled. Displays only orders created by their BusinessId.
* **Date Range Filter:**
    * Dropdown: "Last 7 days" (default), "Last 30 days", "All", "Custom Range".
    * "Custom Range": Shows Start Date and End Date pickers.
* **Tabs:** "Booked Orders", "Requested Orders".
* **Status Buttons (within each tab):** "All", "New", "InProgress", "Done". Filters orders by `OrderStatus`.
* **Order Listing:**
    * Rows display summary: Order ID, Order Date, Dealer Name (if applicable), Total Amount (calculated from OrderedProducts), Status.
    * Clickable Rows: Expand to show `OrderedProducts` details (Product Name, Quantity, Price, TotalCost).
* **Edit Button (per row):**
    * Opens a dialog with a dropdown for `OrderStatus` (New, InProgress, Done, Cancelled).
    * Allows users (with appropriate permissions, typically Admins/Wholesalers) to update the order status.
* **Auto-Refresh:** Page data refreshes every 15 minutes.
* **Manual "Refresh" Button:** To fetch latest order data.



**8.7. Administration Panel**

This section outlines the UI pages and functionalities for managing Tenants, Businesses (Wholesalers and Dealers), and Users. Access to these functionalities is strictly role-dependent.

* **Sidebar Navigation:** A new sidebar link, "Admin Panel" (or "Setup & Management"), will be visible to users with roles: SuperAdmin, TechAdmin, SalesAdmin, WholesalerAdmin, DealerAdmin. The specific sub-sections visible within the Admin Panel will depend on the user's role.

**8.7.1. Tenant Management Page**
* **Access Roles:** SuperAdmin, TechAdmin, SalesAdmin.
* **URL:** `/tenants`
* **UI Layout:**
    * Main title: "Tenant Management".
    * Top right: "Create Tenant" button.
    * Search/Filter bar: By Tenant Name, Status.
    * Table listing Tenants with columns: Tenant Name, Tenant Status, Tenant Type, Start Date, End Date, Actions.
    * Actions per row:
        * "Manage" (or "View Details"): Navigates to Tenant Detail View (`/tenants/{tenantId}`).
        * "Edit": Opens a dialog/form to edit Tenant properties.
        * "Delete" (Soft): Confirmation dialog before soft-deleting.
* **"Create Tenant" Functionality:**
    * Opens a dialog/form with fields corresponding to the `Tenant` entity (Tenant Name, Description, Status, Type, SubType, Start/End DateTime, Additional Data).
    * On save, calls `POST /api/v1/tenants`. Success/failure toast.
* **"Edit Tenant" Functionality:**
    * Opens a dialog/form pre-filled with Tenant data.
    * On save, calls `PUT /api/v1/tenants/{tenantId}`. Success/failure toast.

**8.7.2. Tenant Detail View / Business Management Page**
* **Access Roles:** SuperAdmin, TechAdmin, SalesAdmin.
* **URL:** `/tenants/{tenantId}`
* **UI Layout:**
    * Breadcrumb navigation (e.g., Admin Panel > Tenants > {TenantName}).
    * **Section 1: Tenant Information**
        * Displays selected Tenant's details (read-only here, editing via Tenant Management Page).
    * **Section 2: Wholesaler Management**
        * Title: "Wholesaler".
        * **If no Wholesaler exists for this Tenant:**
            * "Create Wholesaler" button (Visible to: SuperAdmin, TechAdmin, SalesAdmin).
        * **If a Wholesaler exists:**
            * Display Wholesaler details (Name, Email, Status).
            * "Edit Wholesaler" button (Visible to: SuperAdmin, TechAdmin, SalesAdmin).
            * "Manage Users" button (navigates to Wholesaler User Management page: `/tenants/{tenantId}/wholesaler/users`).
            * "Delete Wholesaler" button (Soft delete) (Visible to: SuperAdmin, TechAdmin, SalesAdmin).
    * **Section 3: Dealer Management**
        * Title: "Dealers".
        * Top right of this section: "Create Dealer" button (Visible to: SuperAdmin, TechAdmin, SalesAdmin. Also WholesalerAdmin if they are navigated here via their own tenant context, though their primary access would be different, see 8.7.4).
        * Search/Filter bar for Dealers within this Tenant.
        * Table listing Dealers associated with this Tenant: Name, Email, Status, Actions.
        * Actions per Dealer row:
            * "Edit": Opens dialog to edit Dealer properties.
            * "Manage Users": Navigates to Dealer User Management page (`/tenants/{tenantId}/dealers/{dealerBusinessId}/users`).
            * "Delete" (Soft).

**8.7.3. Business Creation/Edit (Wholesaler/Dealer) - Dialog/Form**
* **Triggered by:** "Create Wholesaler", "Edit Wholesaler", "Create Dealer", "Edit Dealer" buttons.
* **Form Fields:** Based on the `Business` entity: Name, Description, Address, Email, Phone, Status, SubType.
    * `TenantId` is pre-filled from the context.
    * `Type` is pre-set (WHOLESALER or DEALER) based on the action.
* **API Calls:**
    * Create: `POST /api/v1/businesses` (payload includes `TenantId` and `Type`).
    * Edit: `PUT /api/v1/businesses/{businessId}`.
* Success/failure toast notifications.

**8.7.4. Dealer Management Page (for WholesalerAdmin)**
* **Access Roles:** WholesalerAdmin.
* **URL:** `/my-dealers` (Tenant context is implicit from logged-in WholesalerAdmin).
* **UI Layout:**
    * Main title: "Manage Dealers for {WholesalerAdmin's Tenant Name}".
    * Top right: "Create Dealer" button.
    * Search/Filter bar for Dealers.
    * Table listing Dealers associated with the WholesalerAdmin's Tenant: Name, Email, Status, Actions.
    * Actions per Dealer row:
        * "Edit": Opens dialog to edit Dealer properties.
        * "Manage Users": Navigates to Dealer User Management page (`/dealers/{dealerBusinessId}/users` - tenant context implicit).
        * "Delete" (Soft).
* **"Create Dealer" / "Edit Dealer"**: Uses the Business Creation/Edit form (8.7.3), `TenantId` pre-filled. WholesalerAdmin can only create/edit Dealers within their own Tenant.

**8.7.5. Wholesaler User Management Page**
* **Access Path:**
    * SuperAdmin/TechAdmin/SalesAdmin: From Tenant Detail View > Wholesaler > "Manage Users" button. URL: `/tenants/{tenantId}/wholesaler/users`.
    * WholesalerAdmin: Sidebar link "Manage My Wholesaler Users". URL: `/my-wholesaler-users`. (TenantId and Wholesaler BusinessId implicit from logged-in user).
* **UI Layout:**
    * Main title: "Manage Users for Wholesaler: {Wholesaler Name}".
    * Breadcrumbs if applicable.
    * Top right: "Create Wholesaler User" button.
    * Search/Filter bar for Users.
    * Table listing Users for this Wholesaler: Name, UserName, Email, Role, UserStatus, Actions.
    * Actions per User row: "Edit", "Delete" (Soft), "Change Status".
* **"Create Wholesaler User" / "Edit User" Functionality:**
    * Opens a dialog/form with fields from the `User` entity.
    * `TenantId` and `BusinessId` (Wholesaler's ID) are pre-filled.
    * **Role Dropdown (Wholesaler Users):**
        * If creating user is SuperAdmin, TechAdmin, SalesAdmin: Can assign `WholesalerAdmin` or `Wholesaler`.
        * If creating user is WholesalerAdmin: Can only assign `Wholesaler`.
    * API Calls:
        * Create: `POST /api/v1/users`.
        * Edit: `PUT /api/v1/users/{userId}`.
    * Password handling: For creation, an initial password field. For edit, typically "Change Password" is a separate, more secure flow or fields are optional.
    * Success/failure toast.

**8.7.6. Dealer User Management Page**
* **Access Path:**
    * SuperAdmin/TechAdmin/SalesAdmin: From Tenant Detail View > Dealers list > "Manage Users" button for a dealer. URL: `/tenants/{tenantId}/dealers/{dealerBusinessId}/users`.
    * WholesalerAdmin: From their "Manage Dealers" page (8.7.4) > "Manage Users" button for a dealer. URL: `/dealers/{dealerBusinessId}/users` (TenantId implicit).
    * DealerAdmin: Sidebar link "Manage My Dealer Users". URL: `/my-dealer-users`. (TenantId and Dealer BusinessId implicit).
* **UI Layout:**
    * Main title: "Manage Users for Dealer: {Dealer Name}".
    * Breadcrumbs if applicable.
    * Top right: "Create Dealer User" button.
    * Search/Filter bar for Users.
    * Table listing Users for this Dealer: Name, UserName, Email, Role, UserStatus, Actions.
    * Actions per User row: "Edit", "Delete" (Soft), "Change Status".
* **"Create Dealer User" / "Edit User" Functionality:**
    * Opens a dialog/form with fields from the `User` entity.
    * `TenantId` and `BusinessId` (Dealer's ID) are pre-filled.
    * **Role Dropdown (Dealer Users):**
        * If creating user is SuperAdmin, TechAdmin, SalesAdmin, WholesalerAdmin: Can assign `DealerAdmin` or `Dealer`.
        * If creating user is DealerAdmin: Can only assign `Dealer`.
    * API Calls:
        * Create: `POST /api/v1/users`.
        * Edit: `PUT /api/v1/users/{userId}`.
    * Success/failure toast.

**Backend API Considerations (Reiteration/Emphasis):**

* The existing generic CRUD endpoints (`POST /api/v1/tenants`, `POST /api/v1/businesses`, `POST /api/v1/users`, etc.) will be used.
* **Crucial Implementation Detail:** The backend logic for these creation/update endpoints MUST rigorously enforce the role-based permissions outlined.
    * When creating a `Business` (Wholesaler/Dealer), the API must check if the authenticated user's role permits creating that type of business for the specified `TenantId`.
    * When creating a `User`, the API must check if the authenticated user's role permits creating a user for the specified `BusinessId` and assigning the specified `Role`. For example, a WholesalerAdmin cannot create a user with the `WholesalerAdmin` role.
    * The backend should also ensure that a Tenant can only have one Wholesaler. The `POST /api/v1/businesses` endpoint should reject creation of a WHOLESALER if one already exists for the given `TenantId`.




**9. Non-Functional Requirements**

* **Performance:**
    * Page load times: Aim for < 3 seconds for typical views.
    * API response times: Aim for < 500ms for most calls, < 2s for complex queries.
    * Database queries optimized with appropriate indexing.
* **Scalability:**
    * Backend should be designed to be horizontally scalable (stateless API).
    * Database should be able_ to handle growth in data and users.
* **Security:**
    * Protection against common web vulnerabilities (XSS, CSRF, SQL Injection). FastAPI provides some inherent protection, but best practices must be followed.
    * Passwords securely hashed (e.g., bcrypt, Argon2).
    * HTTPS for all communication.
    * Regular security audits (recommended).
    * S3 bucket access should be restricted.
* **Usability:**
    * Intuitive and user-friendly interface.
    * Clear error messages and guidance.
    * Consistent design and navigation.
* **Maintainability:**
    * Well-structured, documented code.
    * Adherence to coding standards (e.g., PEP 8 for Python).
    * Unit and integration tests for backend logic.
* **Reliability/Availability:**
    * Aim for high availability (e.g., 99.9%).
    * Proper error handling and logging.
    * Database backups.

**10. Image Handling (Google Cloud Storage)**

* **Bucket Structure:** A dedicated **Google Cloud Storage (GCS)** bucket.
* **Path Convention:** `gs://{bucket_name}/tenants/{tenantId}/products/{product_uuid}_{original_filename}.{extension}`
    * Using a UUID for the image name prevents collisions.
    * `tenantId` ensures data isolation within the bucket.
* **Upload Process:**
    1.  The frontend can either upload directly to GCS using **signed URLs** (generated by the backend for GCS) or upload to a backend endpoint which then streams the file to GCS. Signed URLs are generally preferred for scalability and to offload work from the backend.
    2.  The backend stores the `ImageLink` (full GCS URI or public URL if configured) in the `Products` table.
* **Access Control:** GCS bucket permissions and IAM roles configured for secure access (e.g., backend service account has write access, public read access for images or signed URLs for limited-time read access).


**11. Database Specifics**

* **Transactions:** Critical operations like order creation and inventory updates must be performed within database transactions to ensure atomicity.
* **Indexing:** Create indexes on foreign keys, columns frequently used in WHERE clauses, and columns used for sorting to optimize query performance.
    * E.g., `Products(TenantId, Name)`, `Products(TenantId, ProductId)`, `Orders(TenantId, BusinessId, OrderDateTime)`, `Orders(OrderStatus)`.
* **Data Integrity:** Use NOT NULL constraints, CHECK constraints, and foreign key constraints to maintain data integrity.

**12. Deployment Considerations (High-Level)**

* **Single Deployable Unit:** The backend FastAPI application will be configured to serve the static frontend assets (HTML, CSS, JavaScript built from the frontend project).
    * The frontend code will be built into a static `dist` or `build` directory.
    * FastAPI's `StaticFiles` middleware will be used to mount this directory.
* **Deployment Environment:**
    * The application can be containerized using Docker.
    * Suitable hosting platforms include:
        * Google Cloud Run (ideal for containerized, stateless applications).
        * Google App Engine (Standard or Flex).
        * Google Kubernetes Engine (GKE) for more complex orchestration.
        * A Virtual Machine (Google Compute Engine) configured with a web server like Nginx (as a reverse proxy to Uvicorn and potentially serving static files for optimization, though FastAPI can handle it).
* **Database:** MySQL database can be hosted using Google Cloud SQL or a similar managed database service.
* **CI/CD:** A CI/CD pipeline (e.g., using Google Cloud Build, Jenkins, GitLab CI) should be set up for automated building of frontend assets, packaging the single deployable, testing, and deployment.


**13. Future Considerations (Do not consider for now)**

* Advanced reporting and analytics.
* Notifications system (email, in-app) for order status changes, low stock alerts.
* Integration with accounting systems.
* Payment gateway integration.
* Audit logging for all changes.

**14. Glossary of Terms**

* **Tenant:** The primary organizational unit, typically a paying customer, which houses one wholesaler and multiple dealers.
* **Business:** An entity within a Tenant, can be a Wholesaler or a Dealer.
* **MRP:** Maximum Retail Price.
* **GST:** Goods and Services Tax.
* **S3:** Amazon Simple Storage Service.
* **CRUD:** Create, Read, Update, Delete.
* **JWT:** JSON Web Token.
* **UI:** User Interface.
* **API:** Application Programming Interface.
* **Booked Order:** An order for products where the quantity is available and has been reserved/deducted from inventory.
* **Requested Order:** An order (or part of an order) for products where the quantity exceeds current availability. This serves as a request for future fulfillment.

This document provides a comprehensive technical specification. Further details may be refined during the development sprints.