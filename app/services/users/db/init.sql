CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'offline',
    language VARCHAR(2) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_two_fa_enabled BOOLEAN DEFAULT FALSE,
    two_fa_secret TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    initiator_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user1_id) REFERENCES users(id),
    FOREIGN KEY(user2_id) REFERENCES users(id),
    FOREIGN KEY(initiator_id) REFERENCES users(id),
    CONSTRAINT user_order CHECK (user1_id < user2_id),
    CONSTRAINT unique_pair UNIQUE (user1_id, user2_id)
);

INSERT OR IGNORE INTO users (username, email, password_hash, display_name, avatar_url, wins, losses)
VALUES
	('alan', 'alanSmithee@student.42.fr', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Alan Smithee', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSq2Q26rH3nI4ossmbYm8jpCyYwuytbyk6iYXJ4_C4tO8FFgv4Wk488h9CB24G5jB46Qjk&usqp=CAU', 3, 4),
	('Xavier', 'xavier@boss.42.fr', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Xavier N', 'https://www.lemediaplus.com/wp-content/uploads/2023/02/Xavier-niel-fortune.png', 2, 3),
	('dkk', 'donkeyKong@nitendoMaisJeVeuxPasDeProcesStp.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Donkey Kong', 'https://m1.quebecormedia.com/emp/emp/dk1b93f6bb-34a1-498c-8234-fb9c7c6f794a_ORIGINAL.jpg?impolicy=crop-resize&x=0&y=0&w=1200&h=675&width=925', 1, 1),
	('Alexis', 'alexb@example.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Alexis Lebrun', 'https://media.ouest-france.fr/v1/pictures/MjAyMzA5NjIyNGQ3MmNlNzkyNTdjYzgwY2IyNDllOWQ2MmQzYzM?width=1260&height=708&focuspoint=50%2C36&cropresize=1&client_id=bpeditorial&sign=06fccb8b939b1ef4f9042a38edab621665dc6428590f6fa79a643ed33535af5f', 1, 1),
    ('god', 'bhl@moi.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Bernard-Henri Lévy', 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Bernard-Henri_L%C3%A9vy_par_Marc_Roussel_en_2024.jpg', 0, 5),
    ('Karl', 'KM@grandmaster.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Karl Marx', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Karl_Marx.jpg/1200px-Karl_Marx.jpg', 3, 2),
    ('Baruch', 'BS@grandmaster.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Baruch Spinoza', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Spinoza.jpg/1200px-Spinoza.jpg', 3, 1),
    ('Socrate', 'Soc@grandmaster.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Socrate le Sage', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Anderson%2C_Domenico_%281854-1938%29_-_n._23185_-_Socrate_%28Collezione_Farnese%29_-_Museo_Nazionale_di_Napoli.jpg/250px-Anderson%2C_Domenico_%281854-1938%29_-_n._23185_-_Socrate_%28Collezione_Farnese%29_-_Museo_Nazionale_di_Napoli.jpg', 4, 0),
    ('jane', 'jane@example.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Jane Doe', 'https://ui-avatars.com/api/?name=Jane+Doe&background=random&color=fff&size=128', 0, 0),
	('alice', 'alice@example.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Alice Smith', 'https://gravatar.com/avatar/3bd177d6fdf72eecc626c6cc19dfbdc6?s=400&d=identicon&r=g', 0, 0);

INSERT OR IGNORE INTO friendships (user1_id, user2_id, initiator_id, status)
VALUES
    (1, 5, 1, 'accepted'),-- Serge et alice sont amis (Serge a initié)
    (1, 4, 4, 'accepted'),-- Serge et jane sont amis (jane a initié)
    (1, 3, 3, 'pending'),-- Donkey_kong a envoyé une demande d'ami à Serge (en attente)
    (1, 2, 2, 'pending'),-- Xavier a envoyé une demande d'ami à Serge (en attente)
    (2, 3, 2, 'pending'),-- Xavier a envoyé une demande d'ami à Donkey_kong (en attente)
    (2, 4, 4, 'pending'),-- Jane a envoyé une demande d'ami à Xavier (en attente)
    (2, 5, 5, 'accepted'),-- Alice a accepté la demande d'ami de Xavier (Xavier a initié)
    (3, 4, 4, 'accepted'),-- Jane a accepté la demande d'ami de Donkey_kong (Donkey_kong a initié)
    (3, 5, 5, 'accepted');-- Alice a accepté la demande d'ami de Donkey_kong (Donkey_kong a initié)
