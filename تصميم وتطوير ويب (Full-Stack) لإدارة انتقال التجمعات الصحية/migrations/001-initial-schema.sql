-- إنشاء قاعدة البيانات
CREATE DATABASE health_cluster_db;

-- استخدام قاعدة البيانات
\c health_cluster_db;

-- إنشاء جدول التجمعات
CREATE TABLE clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    region VARCHAR(255) NOT NULL,
    governorate VARCHAR(255) NOT NULL,
    address TEXT,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول المستخدمين
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL,
    cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول المهام
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'started',
    priority VARCHAR(50) DEFAULT 'medium',
    type VARCHAR(50) DEFAULT 'request',
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    due_date TIMESTAMP,
    started_at TIMESTAMP,
    in_progress_at TIMESTAMP,
    delivered_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول تاريخ المهام
CREATE TABLE task_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    changes JSONB DEFAULT '{}',
    comment TEXT,
    performed_by UUID NOT NULL REFERENCES users(id),
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء الفهارس
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_cluster_id ON tasks(cluster_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_task_histories_task_id ON task_histories(task_id);
CREATE INDEX idx_task_histories_created_at ON task_histories(created_at);
CREATE INDEX idx_clusters_code ON clusters(code);
CREATE INDEX idx_users_email ON users(email);

-- إنشاء جدول الإشعارات
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدخال بيانات تجريبية
INSERT INTO clusters (name, code, region, governorate, contact_person, contact_phone, contact_email)
VALUES 
    ('التجمع الصحي المركزي', 'CL001', 'المنطقة الشرقية', 'الرياض', 'أحمد محمد', '0550000001', 'cluster1@health.sa'),
    ('التجمع الصحي الغربي', 'CL002', 'المنطقة الغربية', 'مكة', 'سعد علي', '0550000002', 'cluster2@health.sa');