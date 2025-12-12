-- CREATE DATABASE
CREATE DATABASE resort_db;

USE resort_db;

-- bookings table
CREATE TABLE bookings (
    booking_id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date_book  DATE NULL,
    total_guest INT(11) NOT NULL,
    booking_type ENUM('Reservation', 'Check-in', 'Day Guest')NOT NULL,
    payment ENUM(
        'Direct Payment',
        'ZUZU (Online Payment)',
        'Refunded',
        'Pending',
        'None'
    ) NOT NULL,
    status ENUM(
        'Reserved',
        'Checked-in',
        'Checked-out',
        'Cancelled'
    ) DEFAULT 'Reserved',
    accomodations VARCHAR(255)
        COLLATE utf8mb4_bin
        DEFAULT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_date DATE NULL,
    promo VARCHAR(255)  NULL,
    promo_area VARCHAR(255)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- area_revenue
CREATE TABLE area_revenue (
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

-- accomodation data table
CREATE TABLE accomodation_data (
    booking_id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
    status ENUM('Active', 'Expired', 'Upcoming') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- admin table
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
    name VARCHAR(255) NULL,
    date TIMESTAMP  NULL,
    room_name VARCHAR(20)   NULL,
    room_no VARCHAR(3)  NULL,
    alert_type VARCHAR(50)  NULL,
    classification VARCHAR(50) NULL,
    counts int(50) NULL,
    guests int(50) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- staff attendance table
CREATE TABLE staff_attendance (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    staff_id INT(11) NOT NULL,
    name VARCHAR(100) NOT NULL,
    time_in VARCHAR(20) NOT NULL,
    time_out VARCHAR(20) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Present (Whole Day)', 'Present (Half Day)', 'Absent', '--', 'Present (Overtime)') NOT NULL
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
    job_position VARCHAR(100) NOT NULL,
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
    job_position VARCHAR(50) NOT NULL,
    date DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- room staff assigned history
CREATE TABLE room_assign_history (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    room VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- default admin credentials
INSERT INTO admin (username, password, email, contact, code, hash_pass, date_pass_change)
VALUES ('admin', 'plainpass123', 'admin@example.com', '09123456789', 123456, '$2y$10$9H0p1KdEQ1gEoH9s2lO0gOVYBWqs0ioY1hGQfgF4FklajfHsyAqLC','2025-01-01');

-- temporary data for notifications
INSERT INTO notifications(name, date, room_name, room_no, alert_type, classification, counts, guests) VALUES ('temporary', CURRENT_DATE() - INTERVAL 1 DAY, NULL, NULL , 'occupancy', NULL , NULL, NULL );

-- accommodation_spaces
INSERT INTO accomodation_spaces (name, room, status, rate, orig_rate, promo)
VALUES
('Premium', 101, 'avl', 10000, 10000, 'None'),
('Premium', 102, 'avl', 10000, 10000, 'None'),
('Premium', 103, 'avl', 10000, 10000, 'None'),
('Premium', 104, 'avl', 10000, 10000, 'None'),
('Family', 101, 'avl', 3000, 3000, 'None'),
('Family', 102, 'avl', 3000, 3000, 'None'),
('Family', 103, 'avl', 3000, 3000, 'None'),
('Family', 104, 'avl', 3000, 3000, 'None'),
('Family', 105, 'avl', 3000, 3000, 'None'),
('Family', 106, 'avl', 3000, 3000, 'None'),
('Family', 107, 'avl', 3000, 3000, 'None'),
('Barkada', 101, 'avl', 7000, 7000, 'None'),
('Barkada', 102, 'avl', 7000, 7000, 'None'),
('Barkada', 103, 'avl', 7000, 7000, 'None'),
('Barkada', 104, 'avl', 7000, 7000, 'None'),
('Barkada', 105, 'avl', 7000, 7000, 'None'),
('Barkada', 106, 'avl', 7000, 7000, 'None'),
('Barkada', 107, 'avl', 7000, 7000, 'None'),
('Standard', 101, 'avl', 8000, 8000, 'None'),
('Standard', 102, 'avl', 8000, 8000, 'None'),
('Standard', 103, 'avl', 8000, 8000, 'None'),
('Garden', 101, 'avl', 3500, 3500, 'None'),
('Garden', 102, 'avl', 3500, 3500, 'None'),
('Garden', 103, 'avl', 3500, 3500, 'None'),
('Garden', 104, 'avl', 3500, 3500, 'None'),
('Garden', 105, 'avl', 3500, 3500, 'None'),
('Garden', 106, 'avl', 3500, 3500, 'None'),
('Garden', 107, 'avl', 3500, 3500, 'None'),
('Garden', 108, 'avl', 3500, 3500, 'None'),
('Garden', 109, 'avl', 3500, 3500, 'None'),
('Garden', 110, 'avl', 3500, 3500, 'None'),
('Garden', 111, 'avl', 3500, 3500, 'None'),
('Garden', 112, 'avl', 3500, 3500, 'None'),
('Cabana', 101, 'avl', 1000, 1000, 'None'),
('Cabana', 102, 'avl', 1000, 1000, 'None'),
('Cabana', 103, 'avl', 1000, 1000, 'None'),
('Cabana', 104, 'avl', 1000, 1000, 'None'),
('Cabana', 105, 'avl', 1000, 1000, 'None'),
('Cabana', 106, 'avl', 1000, 1000, 'None'),
('Cabana', 107, 'avl', 1000, 1000, 'None'),
('Cabana', 108, 'avl', 1000, 1000, 'None'),
('Small', 101, 'avl', 500, 500, 'None'),
('Small', 102, 'avl', 500, 500, 'None'),
('Small', 103, 'avl', 500, 500, 'None'),
('Small', 104, 'avl', 500, 500, 'None'),
('Small', 105, 'avl', 500, 500, 'None'),
('Small', 106, 'avl', 500, 500, 'None'),
('Small', 107, 'avl', 500, 500, 'None'),
('Small', 108, 'avl', 500, 500, 'None'),
('Big', 101, 'avl', 1000, 1000, 'None'),
('Big', 102, 'avl', 1000, 1000, 'None'),
('Big', 103, 'avl', 1000, 1000, 'None'),
('Big', 104, 'avl', 1000, 1000, 'None'),
('Big', 105, 'avl', 1000, 1000, 'None'),
('Big', 106, 'avl', 1000, 1000, 'None'),
('Big', 107, 'avl', 1000, 1000, 'None'),
('Big', 108, 'avl', 1000, 1000, 'None'),
('Hall', 101, 'avl', 1000, 1000, 'None');


-- create  trigger for updating data on bookings then affect the accomodation data
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

-- show trigger
SHOW TRIGGERS;


-- create auto check-out guest event scheduler
SET time_zone = '+08:00';
DELIMITER $$

CREATE EVENT IF NOT EXISTS auto_checkout_guests
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE()
DO
BEGIN
    -- Update booking status
    UPDATE bookings
    SET status = 'Checked-out'
    WHERE check_out <= CURRENT_DATE() AND MONTH(check_out) = MONTH(CURRENT_DATE()) AND YEAR(check_out) = YEAR(CURRENT_DATE())
    AND status = 'Checked-in';

    -- Update accomodation_spaces for rooms that just checked out
    UPDATE accomodation_spaces a
    JOIN bookings b
        ON a.name = TRIM(SUBSTRING_INDEX(b.accomodations, ' ', 1))
        AND a.room = CAST(SUBSTRING_INDEX(b.accomodations, ' ', -1) AS UNSIGNED)
    SET a.status = 'need-clean'
    WHERE check_out <= CURRENT_DATE() AND MONTH(check_out) = MONTH(CURRENT_DATE()) AND YEAR(check_out) = YEAR(CURRENT_DATE()) AND b.status = 'Checked-out';

    -- Insert notifications for housekeeping
    INSERT INTO notifications(name, date, room_name, room_no, alert_type, classification)
    SELECT CONCAT('(System check-out): Housekeeping requested for ', b.accomodations),
            NOW(),
            TRIM(SUBSTRING_INDEX(b.accomodations, ' ', 1)) ,
            CAST(SUBSTRING_INDEX(b.accomodations, ' ', -1) AS UNSIGNED),
            'housekeeping', 'system-checkout'
    FROM bookings b
    WHERE check_out <= CURRENT_DATE() AND MONTH(check_out) = MONTH(CURRENT_DATE()) AND YEAR(check_out) = YEAR(CURRENT_DATE()) AND b.status = 'Checked-in';
END$$

DELIMITER ;

-- check event if its turn on
SHOW VARIABLES LIKE 'event_scheduler';

-- turned on the event
SET GLOBAL event_scheduler = ON;

-- remove the event
DROP EVENT auto_checkout_guests;


