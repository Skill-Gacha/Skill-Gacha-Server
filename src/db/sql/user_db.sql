CREATE TABLE IF NOT EXISTS `CharacterInfo` (
    `id` INT NOT NULL PRIMARY KEY auto_increment,
    `nickname` VARCHAR (50) NOT NULL UNIQUE,
    `element` INT NOT NULL,
    `maxHp` FLOAT NOT NULL,
    `maxMp` FLOAT NOT NULL,
    `gold` INT NOT NULL DEFAULT 0,
    `stone` INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `Skills` (
    `id` INT PRIMARY KEY NOT NULL auto_increment,
    `nickname` VARCHAR (50) NOT NULL,
    `skill1` INT DEFAULT NULL,
    `skill2` INT DEFAULT NULL,
    `skill3` INT DEFAULT NULL,
    `skill4` INT DEFAULT NULL,
    FOREIGN KEY (`nickname`) REFERENCES `CharacterInfo` (`nickname`) ON DELETE CASCADE,
    UNIQUE KEY `unique_nickname` (`nickname`)
);

CREATE TABLE IF NOT EXISTS `Ratings` (
    `nickname` varchar (50) NOT NULL,
    `rating` int NOT NULL,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON
    UPDATE
    CURRENT_TIMESTAMP,
    PRIMARY KEY (`nickname`),
    FOREIGN KEY (`nickname`) REFERENCES `CharacterInfo` (`nickname`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `Items` (
    `nickname` VARCHAR(50) NOT NULL,
    `item_id` INT NOT NULL,
    `count` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`nickname`, `item_id`),
    FOREIGN KEY (`nickname`) REFERENCES `CharacterInfo` (`nickname`) ON DELETE CASCADE,
    CHECK (`item_id` BETWEEN 4001 AND 4005),
    CHECK (`count` >= 0)
);