# JMN Website API Documentation

## What We Do Endpoints

Base URL: `/api/whatwedo`

### 1. Get All Items
- **Method**: `GET`
- **URL**: `/`
- **Description**: Returns all items from the `whatwedo` table ordered by creation date (newest first).
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Project Alpha",
        "slug": "project-alpha",
        "category": "Development",
        "created_at": "2026-06-19T04:30:00.000Z"
      }
    ]
  }
  ```

### 2. Get Single Item by ID
- **Method**: `GET`
- **URL**: `/:id`
- **Description**: Returns a single item matching the provided `id`.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "Project Alpha",
      "slug": "project-alpha",
      "category": "Development",
      "created_at": "2026-06-19T04:30:00.000Z"
    }
  }
  ```
- **Response** (404 Not Found):
  ```json
  {
    "success": false,
    "message": "Item not found"
  }
  ```

### 3. Create Item
- **Method**: `POST`
- **URL**: `/`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Project Alpha",
    "slug": "project-alpha",
    "category": "Development"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Item created successfully",
    "data": {
      "id": 1,
      "name": "Project Alpha",
      "slug": "project-alpha",
      "category": "Development"
    }
  }
  ```
- **Response** (400 Bad Request):
  ```json
  {
    "success": false,
    "message": "Please provide all required fields: name, slug, category"
  }
  ```
  *or*
  ```json
  {
    "success": false,
    "message": "Slug must be unique. This slug is already taken."
  }
  ```

### 4. Update Item
- **Method**: `PUT`
- **URL**: `/:id`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Project Alpha Updated",
    "slug": "project-alpha-updated",
    "category": "Research"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Item updated successfully",
    "data": {
      "id": "1",
      "name": "Project Alpha Updated",
      "slug": "project-alpha-updated",
      "category": "Research"
    }
  }
  ```

### 5. Delete Item
- **Method**: `DELETE`
- **URL**: `/:id`
- **Response** (200 OK):
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Item deleted successfully"
  }
  ```

---

## What We Do Detail Endpoints

Base URL: `/api/whatwedodetail`

### 1. Get All Detail Items
- **Method**: `GET`
- **URL**: `/`
- **Description**: Returns all detail items from the `whatwedodetail` table joined with aggregated `think_items` as JSON.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "whatwedo_id": 1,
        "banner_image": "/uploads/1718816345678-test_banner.png",
        "banner_title": "Banner Title",
        "expertise_header": "Our Expertise",
        "expertise_desc": "Expertise Description",
        "created_at": "2026-06-19T04:35:00.000Z",
        "think_items": [
          {
            "id": 1,
            "image": "/uploads/1718816345679-test_think.png",
            "header": "How We Think Item 1",
            "desc": "Think Description 1",
            "sort_order": 1
          }
        ]
      }
    ]
  }
  ```

### 2. Get Single Detail Item by ID
- **Method**: `GET`
- **URL**: `/:id`
- **Description**: Returns a single detail item along with its ordered list of `think_items`.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "whatwedo_id": 1,
      "banner_image": "/uploads/1718816345678-test_banner.png",
      "banner_title": "Banner Title",
      "expertise_header": "Our Expertise",
      "expertise_desc": "Expertise Description",
      "created_at": "2026-06-19T04:35:00.000Z",
      "think_items": [
        {
          "id": 1,
          "whatwedodetail_id": 1,
          "think_image": "/uploads/1718816345679-test_think.png",
          "think_header": "How We Think Item 1",
          "think_desc": "Think Description 1",
          "sort_order": 1,
          "created_at": "2026-06-19T04:35:00.000Z"
        }
      ]
    }
  }
  ```
- **Response** (404 Not Found):
  ```json
  {
    "success": false,
    "message": "Detail record not found"
  }
  ```

### 2.5 Get Detail Item by What We Do ID
- **Method**: `GET`
- **URL**: `/whatwedo/:whatwedo_id`
- **Description**: Returns the detail item and associated `think_items` matching the provided `whatwedo_id`.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "whatwedo_id": 1,
      "banner_image": "/uploads/1718816345678-test_banner.png",
      "banner_title": "Banner Title",
      "expertise_header": "Our Expertise",
      "expertise_desc": "Expertise Description",
      "created_at": "2026-06-19T04:35:00.000Z",
      "think_items": [
        {
          "id": 1,
          "whatwedodetail_id": 1,
          "think_image": "/uploads/1718816345679-test_think.png",
          "think_header": "How We Think Item 1",
          "think_desc": "Think Description 1",
          "sort_order": 1,
          "created_at": "2026-06-19T04:35:00.000Z"
        }
      ]
    }
  }
  ```
- **Response** (404 Not Found):
  ```json
  {
    "success": false,
    "message": "Detail record not found for the given whatwedo_id"
  }
  ```

### 3. Create Detail Item (with dynamic images)
- **Method**: `POST`
- **URL**: `/`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `whatwedo_id` (Number, Required)
  - `banner_title` (String, Optional)
  - `expertise_header` (String, Optional)
  - `expertise_desc` (String, Optional)
  - `think_items` (JSON String of Array, e.g. `[{"header": "T1", "desc": "D1"}, {"header": "T2", "desc": "D2"}]`)
  - `banner_image` (File, Optional)
  - `think_image_0` (File, Optional - mapped to think item index 0)
  - `think_image_1` (File, Optional - mapped to think item index 1)
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Detail record created successfully",
    "data": {
      "id": 1,
      "whatwedo_id": "1",
      "banner_image": "/uploads/1718816345678-test_banner.png",
      "banner_title": "Banner Title",
      "expertise_header": "Our Expertise",
      "expertise_desc": "Expertise Description",
      "think_items": [
        {
          "header": "T1",
          "desc": "D1",
          "image": "/uploads/1718816345679-think_0.png"
        }
      ]
    }
  }
  ```

### 4. Update Detail Item (with dynamic images)
- **Method**: `PUT`
- **URL**: `/:id`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `whatwedo_id` (Number, Optional)
  - `banner_title` (String, Optional)
  - `expertise_header` (String, Optional)
  - `expertise_desc` (String, Optional)
  - `think_items` (JSON String of Array, e.g. `[{"header": "T1 Updated", "desc": "D1", "image": "/uploads/old_img.png"}]`)
  - `banner_image` (File, Optional - Replaces existing banner image)
  - `think_image_0` (File, Optional - Replaces or adds image for think item at index 0)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Detail record updated successfully",
    "data": {
      "id": "1",
      "whatwedo_id": 1,
      "banner_image": "/uploads/1718816345678-new_banner.png",
      "banner_title": "Updated Banner Title",
      "expertise_header": "Our Expertise",
      "expertise_desc": "Expertise Description",
      "think_items": [
        {
          "header": "T1 Updated",
          "desc": "D1",
          "image": "/uploads/1718816345680-new_think_0.png"
        }
      ]
    }
  }
  ```

### 5. Delete Detail Item
- **Method**: `DELETE`
- **URL**: `/:id`
- **Description**: Deletes the database records (main table and think items) and all associated physical images from disk.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Detail record and associated images deleted successfully"
  }
  ```

---

## Technologies Endpoints

Base URL: `/api/technologies`

### 1. Get All Technologies
- **Method**: `GET`
- **URL**: `/`
- **Description**: Returns all technologies ordered by creation date (newest first).
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "React",
        "slug": "react",
        "created_at": "2026-06-19T09:15:00.000Z"
      }
    ]
  }
  ```

### 2. Get Single Technology by ID
- **Method**: `GET`
- **URL**: `/:id`
- **Description**: Returns a single technology matching the provided `id`.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "React",
      "slug": "react",
      "created_at": "2026-06-19T09:15:00.000Z"
    }
  }
  ```
- **Response** (404 Not Found):
  ```json
  {
    "success": false,
    "message": "Technology not found"
  }
  ```

### 3. Create Technology
- **Method**: `POST`
- **URL**: `/`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "React",
    "slug": "react"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Technology created successfully",
    "data": {
      "id": 1,
      "name": "React",
      "slug": "react"
    }
  }
  ```
- **Response** (400 Bad Request):
  ```json
  {
    "success": false,
    "message": "Please provide all required fields: name, slug"
  }
  ```
  *or*
  ```json
  {
    "success": false,
    "message": "Slug must be unique. This slug is already taken."
  }
  ```

### 4. Update Technology
- **Method**: `PUT`
- **URL**: `/:id`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "React Native",
    "slug": "react-native"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Technology updated successfully",
    "data": {
      "id": "1",
      "name": "React Native",
      "slug": "react-native"
    }
  }
  ```

### 5. Delete Technology
- **Method**: `DELETE`
- **URL**: `/:id`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Technology deleted successfully"
  }
  ```

---

## Career Endpoints

Base URL: `/api/career`

### 1. Get All Career Items
- **Method**: `GET`
- **URL**: `/`
- **Description**: Returns all career items ordered by creation date (newest first).
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "job_title": "Software Engineer",
        "job_category": "Engineering",
        "job_desc": "Responsible for developing applications.",
        "job_type": "Full-time",
        "created_at": "2026-06-19T09:20:00.000Z"
      }
    ]
  }
  ```

### 2. Get Single Career Item by ID
- **Method**: `GET`
- **URL**: `/:id`
- **Description**: Returns a single career item matching the provided `id`.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "job_title": "Software Engineer",
      "job_category": "Engineering",
      "job_desc": "Responsible for developing applications.",
      "job_type": "Full-time",
      "created_at": "2026-06-19T09:20:00.000Z"
    }
  }
  ```
- **Response** (404 Not Found):
  ```json
  {
    "success": false,
    "message": "Career item not found"
  }
  ```

### 3. Create Career Item
- **Method**: `POST`
- **URL**: `/`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "job_title": "Software Engineer",
    "job_category": "Engineering",
    "job_desc": "Responsible for developing applications.",
    "job_type": "Full-time"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Career item created successfully",
    "data": {
      "id": 1,
      "job_title": "Software Engineer",
      "job_category": "Engineering",
      "job_desc": "Responsible for developing applications.",
      "job_type": "Full-time"
    }
  }
  ```
- **Response** (400 Bad Request):
  ```json
  {
    "success": false,
    "message": "Please provide required fields: job_title"
  }
  ```

### 4. Update Career Item
- **Method**: `PUT`
- **URL**: `/:id`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "job_title": "Senior Software Engineer",
    "job_category": "Engineering",
    "job_desc": "Responsible for leading team development.",
    "job_type": "Full-time"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Career item updated successfully",
    "data": {
      "id": "1",
      "job_title": "Senior Software Engineer",
      "job_category": "Engineering",
      "job_desc": "Responsible for leading team development.",
      "job_type": "Full-time"
    }
  }
  ```

### 5. Delete Career Item
- **Method**: `DELETE`
- **URL**: `/:id`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Career item deleted successfully"
  }
  ```

---

## Career Applications Endpoints

Base URL: `/api/career_applications`

### 1. Get All Applications
- **Method**: `GET`
- **URL**: `/`
- **Description**: Returns all career applications ordered by application date (newest first).
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "candidate_name": "John Doe",
        "candidate_contact": "+1234567890",
        "candidate_email": "john@example.com",
        "candidate_location": "New York",
        "resume": "/uploads/1718816345678-resume.pdf",
        "job_title": "Software Engineer",
        "applied_at": "2026-06-19T09:30:00.000Z"
      }
    ]
  }
  ```

### 2. Get Single Application by ID
- **Method**: `GET`
- **URL**: `/:id`
- **Description**: Returns a single career application matching the provided `id`.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "candidate_name": "John Doe",
      "candidate_contact": "+1234567890",
      "candidate_email": "john@example.com",
      "candidate_location": "New York",
      "resume": "/uploads/1718816345678-resume.pdf",
      "job_title": "Software Engineer",
      "applied_at": "2026-06-19T09:30:00.000Z"
    }
  }
  ```
- **Response** (404 Not Found):
  ```json
  {
    "success": false,
    "message": "Application not found"
  }
  ```

### 3. Create Application
- **Method**: `POST`
- **URL**: `/`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `candidate_name` (String, Required)
  - `candidate_contact` (String, Optional)
  - `candidate_email` (String, Optional)
  - `candidate_location` (String, Optional)
  - `job_title` (String, Optional)
  - `resume` (File, Optional - PDF, DOC, DOCX resume file)
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Application created successfully",
    "data": {
      "id": 1,
      "candidate_name": "John Doe",
      "candidate_contact": "+1234567890",
      "candidate_email": "john@example.com",
      "candidate_location": "New York",
      "resume": "/uploads/1718816345678-resume.pdf",
      "job_title": "Software Engineer"
    }
  }
  ```
- **Response** (400 Bad Request):
  ```json
  {
    "success": false,
    "message": "Please provide required fields: candidate_name"
  }
  ```

### 4. Update Application
- **Method**: `PUT`
- **URL**: `/:id`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `candidate_name` (String, Required)
  - `candidate_contact` (String, Optional)
  - `candidate_email` (String, Optional)
  - `candidate_location` (String, Optional)
  - `job_title` (String, Optional)
  - `resume` (File, Optional - Replaces existing resume file)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Application updated successfully",
    "data": {
      "id": "1",
      "candidate_name": "John Doe Updated",
      "candidate_contact": "+1234567890",
      "candidate_email": "john.updated@example.com",
      "candidate_location": "San Francisco",
      "resume": "/uploads/1718816345679-new-resume.pdf",
      "job_title": "Senior Software Engineer"
    }
  }
  ```

### 5. Delete Application
- **Method**: `DELETE`
- **URL**: `/:id`
- **Description**: Deletes the database record and associated physical resume file from disk.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Application deleted successfully"
  }
  ```

---

## Home Endpoints

Base URL: `/api/home`

### 1. Get All Home Configurations
- **Method**: `GET`
- **URL**: `/`
- **Description**: Returns all home configurations ordered by update date (newest first).
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "home_video": "/uploads/1718816345678-intro_video.mp4",
        "home_title": "Welcome to JMN",
        "home_desc": "We build premium software solutions.",
        "company_exp": 10,
        "apps_dev": 50,
        "project_dev": 120,
        "countries_served": 15,
        "client_satisfaction_percent": "98.50",
        "talented_squad": 40,
        "updated_at": "2026-06-19T09:35:00.000Z"
      }
    ]
  }
  ```

### 2. Get Single Home Configuration by ID
- **Method**: `GET`
- **URL**: `/:id`
- **Description**: Returns a single home configuration matching the provided `id`.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "home_video": "/uploads/1718816345678-intro_video.mp4",
      "home_title": "Welcome to JMN",
      "home_desc": "We build premium software solutions.",
      "company_exp": 10,
      "apps_dev": 50,
      "project_dev": 120,
      "countries_served": 15,
      "client_satisfaction_percent": "98.50",
      "talented_squad": 40,
      "updated_at": "2026-06-19T09:35:00.000Z"
    }
  }
  ```
- **Response** (404 Not Found):
  ```json
  {
    "success": false,
    "message": "Home configuration not found"
  }
  ```

### 3. Create Home Configuration (with video file)
- **Method**: `POST`
- **URL**: `/`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `home_title` (String, Optional)
  - `home_desc` (String, Optional)
  - `company_exp` (Number, Optional)
  - `apps_dev` (Number, Optional)
  - `project_dev` (Number, Optional)
  - `countries_served` (Number, Optional)
  - `client_satisfaction_percent` (Decimal, Optional)
  - `talented_squad` (Number, Optional)
  - `home_video` (File, Optional - Video file format)
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Home configuration created successfully",
    "data": {
      "id": 1,
      "home_video": "/uploads/1718816345678-intro_video.mp4",
      "home_title": "Welcome to JMN",
      "home_desc": "We build premium software solutions.",
      "company_exp": "10",
      "apps_dev": "50",
      "project_dev": "120",
      "countries_served": "15",
      "client_satisfaction_percent": "98.50",
      "talented_squad": "40"
    }
  }
  ```

### 4. Update Home Configuration (with video file)
- **Method**: `PUT`
- **URL**: `/:id`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `home_title` (String, Optional)
  - `home_desc` (String, Optional)
  - `company_exp` (Number, Optional)
  - `apps_dev` (Number, Optional)
  - `project_dev` (Number, Optional)
  - `countries_served` (Number, Optional)
  - `client_satisfaction_percent` (Decimal, Optional)
  - `talented_squad` (Number, Optional)
  - `home_video` (File, Optional - Replaces existing video)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Home configuration updated successfully",
    "data": {
      "id": "1",
      "home_video": "/uploads/1718816345679-new_video.mp4",
      "home_title": "Updated JMN Welcome",
      "home_desc": "We build premium software solutions.",
      "company_exp": 10,
      "apps_dev": 50,
      "project_dev": 120,
      "countries_served": 15,
      "client_satisfaction_percent": 98.5,
      "talented_squad": 40
    }
  }
  ```

### 5. Delete Home Configuration
- **Method**: `DELETE`
- **URL**: `/:id`
- **Description**: Deletes the database entry and removes the associated video file from disk.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Home configuration and associated video deleted successfully"
  }
  ```

---

## Client Endpoints

Base URL: `/api/client`

### 1. Get All Clients
- **Method**: `GET`
- **URL**: `/`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "client_name": "Google",
        "logo_image": "/uploads/1718816345678-logo.png",
        "created_at": "2026-06-19T09:40:00.000Z"
      }
    ]
  }
  ```

### 2. Get Single Client by ID
- **Method**: `GET`
- **URL**: `/:id`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "client_name": "Google",
      "logo_image": "/uploads/1718816345678-logo.png",
      "created_at": "2026-06-19T09:40:00.000Z"
    }
  }
  ```

### 3. Create Client (with logo file)
- **Method**: `POST`
- **URL**: `/`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `client_name` (String, Required)
  - `logo_image` (File, Optional - Image file format)
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Client created successfully",
    "data": {
      "id": 1,
      "client_name": "Google",
      "logo_image": "/uploads/1718816345678-logo.png"
    }
  }
  ```

### 4. Update Client (with logo file)
- **Method**: `PUT`
- **URL**: `/:id`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `client_name` (String, Optional)
  - `logo_image` (File, Optional - Replaces existing logo)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Client updated successfully",
    "data": {
      "id": "1",
      "client_name": "Google Updated",
      "logo_image": "/uploads/1718816345679-new_logo.png"
    }
  }
  ```

### 5. Delete Client
- **Method**: `DELETE`
- **URL**: `/:id`
- **Description**: Deletes the client record and removes the logo image from disk.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Client and associated logo deleted successfully"
  }
  ```

---

## Achievements Endpoints

Base URL: `/api/achievements`

### 1. Get All Achievements
- **Method**: `GET`
- **URL**: `/`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "archiv_name": "Fastest Growth",
        "archiv_image": "/uploads/1718816345678-archiv.png",
        "archiv_desc": "Awarded for rapid growth in 2026.",
        "created_at": "2026-06-19T09:40:00.000Z"
      }
    ]
  }
  ```

### 2. Get Single Achievement by ID
- **Method**: `GET`
- **URL**: `/:id`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "archiv_name": "Fastest Growth",
      "archiv_image": "/uploads/1718816345678-archiv.png",
      "archiv_desc": "Awarded for rapid growth in 2026.",
      "created_at": "2026-06-19T09:40:00.000Z"
    }
  }
  ```

### 3. Create Achievement (with image file)
- **Method**: `POST`
- **URL**: `/`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `archiv_name` (String, Required)
  - `archiv_desc` (String, Optional)
  - `archiv_image` (File, Optional - Image file format)
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Achievement created successfully",
    "data": {
      "id": 1,
      "archiv_name": "Fastest Growth",
      "archiv_image": "/uploads/1718816345678-archiv.png",
      "archiv_desc": "Awarded for rapid growth in 2026."
    }
  }
  ```

### 4. Update Achievement (with image file)
- **Method**: `PUT`
- **URL**: `/:id`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `archiv_name` (String, Optional)
  - `archiv_desc` (String, Optional)
  - `archiv_image` (File, Optional - Replaces existing image)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Achievement updated successfully",
    "data": {
      "id": "1",
      "archiv_name": "Fastest Growth Updated",
      "archiv_image": "/uploads/1718816345679-new_archiv.png",
      "archiv_desc": "Awarded for rapid growth in 2026."
    }
  }
  ```

### 5. Delete Achievement
- **Method**: `DELETE`
- **URL**: `/:id`
- **Description**: Deletes the database record and removes the achievement image file from disk.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Achievement and associated image deleted successfully"
  }
  ```