CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    status TEXT DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    player1_score INTEGER NOT NULL,
    player2_score INTEGER NOT NULL,
    winner_id INTEGER,
    win_type TEXT DEFAULT 'score',
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    game_type TEXT DEFAULT 'pong',
    tournament_id INTEGER,
    FOREIGN KEY(player1_id) REFERENCES users(id),
    FOREIGN KEY(player2_id) REFERENCES users(id),
    FOREIGN KEY(winner_id) REFERENCES users(id)
);

INSERT OR IGNORE INTO users (username, email, password_hash, display_name, avatar_url)
VALUES
  ('Serge', 'serge@student.42.fr', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Serge P', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSq2Q26rH3nI4ossmbYm8jpCyYwuytbyk6iYXJ4_C4tO8FFgv4Wk488h9CB24G5jB46Qjk&usqp=CAU'),
  ('Xavier', 'xavier@student.42.fr', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Xavier N', 'https://www.lemediaplus.com/wp-content/uploads/2023/02/Xavier-niel-fortune.png'),
  ('Donkey_Kong', 'donkeyKong@nitendo.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Donkey Kong', 'https://m1.quebecormedia.com/emp/emp/dk1b93f6bb-34a1-498c-8234-fb9c7c6f794a_ORIGINAL.jpg?impolicy=crop-resize&x=0&y=0&w=1200&h=675&width=925'),
  ('jane_doe', 'jane@example.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Jane Doe', 'https://ui-avatars.com/api/?name=Jane+Doe&background=random&color=fff&size=128'),
  ('alice_smith', 'alice@example.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Alice Smith', 'https://gravatar.com/avatar/3bd177d6fdf72eecc626c6cc19dfbdc6?s=400&d=identicon&r=g'),
  ('Alexis B', 'alexb@example.com', '$2b$10$3Gy9uzvm61CTJ0kuPN3FYu1vJrmylnrmKNmkdoHNTF2owheMzkucu', 'Alexis le Brun', 'https://media.ouest-france.fr/v1/pictures/MjAyMzA5NjIyNGQ3MmNlNzkyNTdjYzgwY2IyNDllOWQ2MmQzYzM?width=1260&height=708&focuspoint=50%2C36&cropresize=1&client_id=bpeditorial&sign=06fccb8b939b1ef4f9042a38edab621665dc6428590f6fa79a643ed33535af5f');


-- Serge et alice sont amis (Serge a initié)
INSERT OR IGNORE INTO friendships (user1_id, user2_id, initiator_id, status)
VALUES (1, 5, 1, 'accepted');

-- Serge et jane sont amis (jane a initié)
INSERT OR IGNORE INTO friendships (user1_id, user2_id, initiator_id, status)
VALUES (1, 4, 4, 'accepted');

-- Donkey_kong a envoyé une demande d'ami à Serge (en attente)
INSERT OR IGNORE INTO friendships (user1_id, user2_id, initiator_id, status)
VALUES (1, 3, 3, 'pending');

-- Xavier a envoyé une demande d'ami à Serge (en attente)
INSERT OR IGNORE INTO friendships (user1_id, user2_id, initiator_id, status)
VALUES (1, 2, 2, 'pending');

-- Alice a bloqué Xavier
INSERT OR IGNORE INTO friendships (user1_id, user2_id, initiator_id, status)
VALUES (2, 5, 5, 'blocked'); -- Alice a initié et bloqué xavier
