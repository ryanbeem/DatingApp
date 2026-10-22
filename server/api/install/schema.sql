-- Blue collar dating app schema (MySQL 5.7+ / MariaDB 10.2+)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('seeker','worker') NOT NULL COMMENT 'seeker = woman looking, worker = tradesman',
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  is_banned TINYINT(1) NOT NULL DEFAULT 0,
  last_active_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS profiles (
  user_id INT UNSIGNED PRIMARY KEY,
  first_name VARCHAR(60) NOT NULL,
  birthdate DATE NULL,
  city VARCHAR(80) NULL,
  state VARCHAR(40) NULL,
  bio TEXT NULL,
  job_title VARCHAR(80) NULL COMMENT 'Shown under the photo, e.g. Mechanic',
  employer VARCHAR(120) NULL,
  years_experience TINYINT UNSIGNED NULL,
  is_licensed TINYINT(1) NOT NULL DEFAULT 0,
  employment_status ENUM('employed','self_employed','between_jobs') NULL,
  looking_for TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY (job_title),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS photos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  filename VARCHAR(80) NOT NULL,
  is_main TINYINT(1) NOT NULL DEFAULT 0,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS qualities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  category VARCHAR(40) NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_qualities (
  user_id INT UNSIGNED NOT NULL,
  quality_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, quality_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quality_id) REFERENCES qualities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS swipes (
  swiper_id INT UNSIGNED NOT NULL,
  target_id INT UNSIGNED NOT NULL,
  direction ENUM('like','pass') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (swiper_id, target_id),
  KEY (target_id),
  FOREIGN KEY (swiper_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS matches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_a INT UNSIGNED NOT NULL COMMENT 'lower user id',
  user_b INT UNSIGNED NOT NULL COMMENT 'higher user id',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (user_a, user_b),
  KEY (user_b),
  FOREIGN KEY (user_a) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS photo_likes (
  user_id INT UNSIGNED NOT NULL,
  photo_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, photo_id),
  KEY (photo_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_id INT UNSIGNED NOT NULL,
  recipient_id INT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  KEY (sender_id, recipient_id),
  KEY (recipient_id, sender_id),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id INT UNSIGNED NOT NULL,
  blocked_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id),
  KEY (blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT UNSIGNED NOT NULL,
  reported_id INT UNSIGNED NOT NULL,
  reason VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO qualities (name, category, sort_order) VALUES
  ('Hardworking','Character',1),('Reliable','Character',2),('Honest','Character',3),('Patient','Character',4),
  ('Good sense of humor','Character',5),('Protective','Character',6),('Romantic','Character',7),('Easygoing','Character',8),
  ('Handy around the house','Skills',10),('Can fix cars','Skills',11),('Good cook','Skills',12),('Grill master','Skills',13),
  ('Owns tools','Skills',14),('Builds furniture','Skills',15),
  ('Steady paycheck','Stability',20),('Owns a home','Stability',21),('Owns a truck','Stability',22),('Debt free','Stability',23),
  ('Saves money','Stability',24),('Union member','Stability',25),('Licensed in my trade','Stability',26),
  ('Family oriented','Family',30),('Has kids','Family',31),('Wants kids','Family',32),('Great with kids','Family',33),('Close to my family','Family',34),
  ('Outdoorsy','Lifestyle',40),('Hunting','Lifestyle',41),('Fishing','Lifestyle',42),('Camping','Lifestyle',43),('Dog lover','Lifestyle',44),
  ('Cat lover','Lifestyle',45),('Sports fan','Lifestyle',46),('Gym regular','Lifestyle',47),('Country music','Lifestyle',48),('Homebody','Lifestyle',49),
  ('Non-smoker','Habits',50),('Social drinker','Habits',51),('Doesn''t drink','Habits',52),('Early riser','Habits',53),
  ('Faith is important','Values',60),('Loyal','Values',61),('Old fashioned','Values',62),('Community minded','Values',63);
