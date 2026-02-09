-- Esquema base para la simulación CAD de ambulancias

CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  location TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  call_time TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE ambulances (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT NOT NULL,
  ambulance_id TEXT NOT NULL,
  distance_km REAL NOT NULL,
  accepted INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id)
);

CREATE TABLE calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  completed INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id)
);

CREATE TABLE radio_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id)
);

INSERT INTO ambulances (id, name, latitude, longitude, status)
VALUES
  ("AMB-101", "Ambulancia 101", 51.5079, -0.0877, "Disponible"),
  ("AMB-202", "Ambulancia 202", 51.5007, -0.1246, "Disponible"),
  ("AMB-303", "Ambulancia 303", 51.5154, -0.0722, "Disponible"),
  ("AMB-404", "Ambulancia 404", 51.5094, -0.0983, "Disponible");
