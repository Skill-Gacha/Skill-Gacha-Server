CREATE TABLE IF NOT EXISTS `Characterinfo` (
    `id` INT NOT NULL PRIMARY KEY auto_increment,
    `nickname` VARCHAR (50) NOT NULL UNIQUE,
    `element` INT NOT NULL,
    `maxhp` FLOAT NOT NULL,
    `maxmp` FLOAT NOT NULL,
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
    FOREIGN KEY (`nickname`) REFERENCES `Characterinfo` (`nickname`) ON DELETE CASCADE,
    UNIQUE KEY `unique_nickname` (`nickname`)
);

CREATE TABLE IF NOT EXISTS `Ratings` (
    `nickname` varchar (50) NOT NULL,
    `rating` int NOT NULL,
    `updatedat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON
    UPDATE
    CURRENT_TIMESTAMP,
    PRIMARY KEY (`nickname`),
    FOREIGN KEY (`nickname`) REFERENCES `Characterinfo` (`nickname`) ON DELETE CASCADE
);
