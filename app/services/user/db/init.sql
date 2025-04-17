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
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user1_id) REFERENCES users(id),
    FOREIGN KEY(user2_id) REFERENCES users(id),
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
  ('john_doe', 'john@example.com', 'hashed_password_123', 'John Doe', 'https://gravatar.com/avatar/3bd177d6fdf72eecc626c6cc19dfbdc6?s=400&d=identicon&r=g'),
  ('jane_doe', 'jane@example.com', 'hashed_password_456', 'Jane Doe', 'https://example.com/avatar2.jpg'),
  ('alice_smith', 'alice@example.com', 'hashed_password_789', 'Alice Smith', 'https://example.com/avatar3.jpg');
