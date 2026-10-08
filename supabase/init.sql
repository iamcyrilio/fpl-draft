-- Créer les tables pour la draft FPL

-- Table des participants
CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position_order JSONB, -- {"Gardien": [1,2,3...], "Défenseur": [...], ...}
  selections JSONB DEFAULT '{}', -- {"Gardien": [...], "Défenseur": [...], ...}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table de l'état de la draft
CREATE TABLE draft_state (
  id INT PRIMARY KEY DEFAULT 1,
  status TEXT DEFAULT 'waiting', -- waiting, in_progress, completed
  current_turn INT DEFAULT 0,
  current_position TEXT DEFAULT 'Gardien',
  current_participant_id TEXT,
  time_remaining INT DEFAULT 30,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des joueurs drafté
CREATE TABLE drafted_players (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id INT NOT NULL,
  player_name TEXT NOT NULL,
  player_position TEXT NOT NULL,
  player_club TEXT NOT NULL,
  player_cote FLOAT,
  drafted_by TEXT NOT NULL,
  round INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (drafted_by) REFERENCES participants(id)
);

-- Table des configurations de draft
CREATE TABLE draft_config (
  id INT PRIMARY KEY DEFAULT 1,
  participants_list JSONB DEFAULT '[]', -- [{"id": "cyril", "name": "Cyril"}, ...]
  draft_orders JSONB DEFAULT '{}', -- {"Gardien": [...], "Défenseur": [...], ...}
  picks_required JSONB DEFAULT '{"Gardien": 2, "Défenseur": 6, "Milieu": 6, "Attaquant": 4}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE draft_state;
ALTER PUBLICATION supabase_realtime ADD TABLE drafted_players;
ALTER PUBLICATION supabase_realtime ADD TABLE draft_config;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;

-- Créer les index pour les performances
CREATE INDEX idx_drafted_players_drafted_by ON drafted_players(drafted_by);
CREATE INDEX idx_drafted_players_player_id ON drafted_players(player_id);
