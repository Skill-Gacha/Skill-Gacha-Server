CREATE TABLE IF NOT EXISTS `CharacterInfo`
(
    `id`
    INT
    NOT
    NULL
    PRIMARY
    KEY
    AUTO_INCREMENT,
    `nickname`
    VARCHAR
(
    50
) NOT NULL UNIQUE,
    `job` INT NOT NULL,
    `level` INT NOT NULL,
    `maxHp` FLOAT NOT NULL,
    `maxMp` FLOAT NOT NULL,
    `atk` FLOAT NOT NULL,
    `def` FLOAT NOT NULL,
    `magic` FLOAT NOT NULL,
    `speed` FLOAT NOT NULL,
    `money` INT NOT NULL DEFAULT 0,
    `posX` FLOAT NOT NULL DEFAULT -4,
    `posY` FLOAT NOT NULL DEFAULT 0.7,
    `posZ` FLOAT NOT NULL DEFAULT 137,
    `rot` FLOAT NOT NULL DEFAULT 0
    );

-- CREATE TABLE `gameLogs`
-- (
--     `id`        int PRIMARY KEY NOT NULL AUTO_INCREMENT,
--     `handlerId` int             NOT NULL,
--     `message`   text            NOT NULL,
--     `createdAt` timestamp       NOT NULL DEFAULT (now())
-- );

-- CREATE TABLE `results`
-- (
--     `id`            int PRIMARY KEY NOT NULL AUTO_INCREMENT,
--     `hostId`        int             NOT NULL,
--     `opponentId`    int             NOT NULL,
--     `hostScore`     int             NOT NULL,
--     `opponentScore` int             NOT NULL,
--     `createdAt`     timestamp       NOT NULL DEFAULT (now())
-- );

-- CREATE TABLE `users`
-- (
--     `id`        int PRIMARY KEY NOT NULL AUTO_INCREMENT,
--     `username`  varchar(50) DEFAULT null,
--     `email`     varchar(255)    NOT NULL,
--     `password`  varchar(255)    NOT NULL,
--     `highScore` int         DEFAULT (0),
--     `createAt`  timestamp   DEFAULT (CURRENT_TIMESTAMP),
--     `updateAt`  timestamp   DEFAULT (CURRENT_TIMESTAMP)
-- );

-- ALTER TABLE `results`
--     ADD CONSTRAINT `results_user_id_foreign` FOREIGN KEY (`hostId`) REFERENCES `users` (`username`);

-- ALTER TABLE `results`
--     ADD CONSTRAINT `results_user_id_foreign` FOREIGN KEY (`opponentId`) REFERENCES `users` (`username`);