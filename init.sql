-- new 
insert into notifications(name, date, room_name, room_no) VALUES ('temporary', CURRENT_DATE(), 'occupancy', 0)

-- CREATE DATABASE
CREATE DATABASE resort_db;

USE resort_db;

-- bookings table
CREATE TABLE bookings (
    booking_id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    total_guest INT(11) NOT NULL,
    booking_type ENUM('Reservation', 'Walk-in', 'Day Guest')NOT NULL,
    payment ENUM(
        'Direct Payment',
        'ZUZU (Online Payment)',
        'Pending'
    ) NOT NULL,
    status ENUM(
        'Reserved',
        'Checked-in',
        'Checked-out',
        'Cancelled'
    ) DEFAULT 'Reserved',
    accomodations VARCHAR(100)
        COLLATE utf8mb4_bin
        DEFAULT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- accomodation data table
CREATE TABLE full_texts (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    booking_id INT(11) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    premium INT(11) DEFAULT 0,
    standard INT(11) DEFAULT 0,
    garden INT(11) DEFAULT 0,
    barkada INT(11) DEFAULT 0,
    family INT(11) DEFAULT 0,
    cabana INT(11) DEFAULT 0,
    small INT(11) DEFAULT 0,
    big INT(11) DEFAULT 0,
    hall INT(11) DEFAULT 0,
    total INT(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- accomodation_spaces table
CREATE TABLE accomodation_spaces (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    room INT(11) NOT NULL,
    status VARCHAR(39) NOT NULL,
    staff_assign VARCHAR(100) NULL,
    date DATE NULL,
    rate INT(11) NOT NULL,
    orig_rate INT(11) NOT NULL,
    promo VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- promos
CREATE TABLE promos (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    discount INT(11) NOT NULL,
    area VARCHAR(100) NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Active', 'Expired') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- area_data table
CREATE TABLE area_table (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    count INT(11) NOT NULL,
    max INT(11) NOT NULL,
    rate INT(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--admin table
CREATE TABLE admin (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    contact VARCHAR(11) NOT NULL,
    code INT(6) NOT NULL,
    hash_pass VARCHAR(255) NOT NULL,
    date_pass_change DATE DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- notifications
CREATE TABLE notifications (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    room_name VARCHAR(20)  NOT NULL,
    room_no INT(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- staff attendance table
CREATE TABLE staff_attendance (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    time_in VARCHAR(20) NOT NULL,
    time_out VARCHAR(20) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Present (Whole Day)', 'Present (Half Day)', 'Absent', '--', 'Present (Overtime)') NOT NULL,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- staff details
CREATE TABLE staff_details (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    staff_name VARCHAR(100) NOT NULL,
    date_started DATE NOT NULL,
    daily_salary INT(100) NOT NULL,
    weekly_salary INT(11) NOT NULL,
    monthly_salary INT(11) NOT NULL,
    estimate_weekly INT(100) NOT NULL,
    estimate_month INT(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    avl_leave INT(11) NOT NULL,
    status ENUM('On Leave', 'Active', 'Absent') NOT NULL,
    workdays DOUBLE NOT NULL,
    absent INT(11) NOT NULL,
    reset_date DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- staff_leaves_data 
CREATE TABLE staff_leaves_data (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    staff_id INT(11) NOT NULL,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL,
    date DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- default admin credentials
INSERT INTO admin (username, password, email, contact, code, hash_pass, date_pass_change)
VALUES
('admin', 'plainpass123', 'admin@example.com', '09123456789', 123456, '$2y$10$9H0p1KdEQ1gEoH9s2lO0gOVYBWqs0ioY1hGQfgF4FklajfHsyAqLC','2025-01-01');

-- accommodation_spaces
INSERT INTO accomodation_spaces (name, room, status, date, rate, orig_rate, promo, staff_assign)
VALUES
('Premium', 101, 'avl', NULL, 10000, 10000, 'None', NULL),
('Premium', 102, 'avl', NULL, 10000, 10000, 'None', NULL),
('Premium', 103, 'avl', NULL, 10000, 10000, 'None', NULL),
('Premium', 104, 'avl', NULL, 10000, 10000, 'None', NULL),
('Family', 101, 'avl', NULL, 3000, 3000, 'None', NULL),
('Family', 102, 'avl', NULL, 3000, 3000, 'None', NULL),
('Family', 103, 'avl', NULL, 3000, 3000, 'None', NULL),
('Family', 104, 'avl', NULL, 3000, 3000, 'None', NULL),
('Family', 105, 'avl', NULL, 3000, 3000, 'None', NULL),
('Family', 106, 'avl', NULL, 3000, 3000, 'None', NULL),
('Family', 107, 'avl', NULL, 3000, 3000, 'None', NULL),
('Barkada', 101, 'avl', NULL, 7000, 7000, 'None', NULL),
('Barkada', 102, 'avl', NULL, 7000, 7000, 'None', NULL),
('Barkada', 103, 'avl', NULL, 7000, 7000, 'None', NULL),
('Barkada', 104, 'avl', NULL, 7000, 7000, 'None', NULL),
('Barkada', 105, 'avl', NULL, 7000, 7000, 'None', NULL),
('Barkada', 106, 'avl', NULL, 7000, 7000, 'None', NULL),
('Barkada', 107, 'avl', NULL, 7000, 7000, 'None', NULL),
('Standard', 101, 'avl', NULL, 8000, 8000, 'None', NULL),
('Standard', 102, 'avl', NULL, 8000, 8000, 'None', NULL),
('Standard', 103, 'avl', NULL, 8000, 8000, 'None', NULL),
('Garden', 101, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 102, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 103, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 104, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 105, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 106, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 107, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 108, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 109, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 110, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 111, 'avl', NULL, 3500, 3500, 'None', NULL),
('Garden', 112, 'avl', NULL, 3500, 3500, 'None', NULL),
('Cabana', 101, 'avl', NULL, 1000, 1000, 'None', NULL),
('Cabana', 102, 'avl', NULL, 1000, 1000, 'None', NULL),
('Cabana', 103, 'avl', NULL, 1000, 1000, 'None', NULL),
('Cabana', 104, 'avl', NULL, 1000, 1000, 'None', NULL),
('Cabana', 105, 'avl', NULL, 1000, 1000, 'None', NULL),
('Cabana', 106, 'avl', NULL, 1000, 1000, 'None', NULL),
('Cabana', 107, 'avl', NULL, 1000, 1000, 'None', NULL),
('Cabana', 108, 'avl', NULL, 1000, 1000, 'None', NULL),
('Small', 101, 'avl', NULL, 500, 500, 'None', NULL),
('Small', 102, 'avl', NULL, 500, 500, 'None', NULL),
('Small', 103, 'avl', NULL, 500, 500, 'None', NULL),
('Small', 104, 'avl', NULL, 500, 500, 'None', NULL),
('Small', 105, 'avl', NULL, 500, 500, 'None', NULL),
('Small', 106, 'avl', NULL, 500, 500, 'None', NULL),
('Small', 107, 'avl', NULL, 500, 500, 'None', NULL),
('Small', 108, 'avl', NULL, 500, 500, 'None', NULL),
('Big', 101, 'avl', NULL, 1000, 1000, 'None', NULL),
('Big', 102, 'avl', NULL, 1000, 1000, 'None', NULL),
('Big', 103, 'avl', NULL, 1000, 1000, 'None', NULL),
('Big', 104, 'avl', NULL, 1000, 1000, 'None', NULL),
('Big', 105, 'avl', NULL, 1000, 1000, 'None', NULL),
('Big', 106, 'avl', NULL, 1000, 1000, 'None', NULL),
('Big', 107, 'avl', NULL, 1000, 1000, 'None', NULL),
('Big', 108, 'avl', NULL, 1000, 1000, 'None', NULL),
('Hall', 101, 'avl', NULL, 1000, 1000, 'None', NULL);


INSERT INTO area_table (name, count, max, rate)
VALUES
('Premium Villa Room', 4, 12, 10000),
('Standard Villa Room', 3, 10, 8000),
('Garden View Room', 12, 4, 3500),
('Barkada Room', 7, 8, 6500),
('Family Room', 7, 10, 3000),
('Cabana Cottage', 8, 30, 1000),
('Small Cottage', 8, 20, 500),
('Hall', 1, 100, 3000),
('Big Cottage', 8, 50, 1000);


-- trigger for updating data on bookings then affect the accomodation data
DELIMITER $$

CREATE TRIGGER after_booking_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF (OLD.check_in <> NEW.check_in) OR (OLD.check_out <> NEW.check_out) THEN
        UPDATE accomodation_data
        SET check_in = NEW.check_in,
            check_out = NEW.check_out
        WHERE booking_id = NEW.booking_id;
    END IF;
END$$

DELIMITER ;
