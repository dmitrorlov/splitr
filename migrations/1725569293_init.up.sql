CREATE TABLE IF NOT EXISTS hosts
(
    id          INTEGER PRIMARY KEY,
    address     VARCHAR(255) UNIQUE                 NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS networks
(
    id         INTEGER PRIMARY KEY,
    name       VARCHAR(255) UNIQUE                 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS network_hosts
(
    id          INTEGER PRIMARY KEY,
    network_id  INTEGER                             NOT NULL,
    address     VARCHAR(255)                        NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (network_id, address),
    FOREIGN KEY (network_id) REFERENCES networks (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS network_host_setups
(
    id              INTEGER PRIMARY KEY,
    network_host_id INTEGER                             NOT NULL,
    network_host_ip VARCHAR(255)                        NOT NULL,
    subnet_mask     VARCHAR(255)                        NOT NULL,
    router          VARCHAR(255)                        NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (network_host_id) REFERENCES network_hosts (id) ON DELETE CASCADE
);
