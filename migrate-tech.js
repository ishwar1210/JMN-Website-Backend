require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  try {
    console.log('Starting migration for technologiesdetail...');

    // 1. Get existing columns
    const [cols] = await db.query('DESCRIBE technologiesdetail');
    const existingCols = cols.map(c => c.Field);

    const columnsToAdd = {
      banner_image: 'VARCHAR(500) NULL',
      banner_title: 'VARCHAR(255) NULL',
      expertise_header: 'VARCHAR(255) NULL',
      expertise_desc: 'TEXT NULL'
    };

    for (const [colName, colType] of Object.entries(columnsToAdd)) {
      if (!existingCols.includes(colName)) {
        await db.query(`ALTER TABLE technologiesdetail ADD COLUMN ${colName} ${colType}`);
        console.log(`Added column ${colName} successfully.`);
      } else {
        console.log(`Column ${colName} already exists.`);
      }
    }

    // 2. Create technologies_think table
    await db.query(`
      CREATE TABLE IF NOT EXISTS technologies_think (
        id INT AUTO_INCREMENT PRIMARY KEY,
        technologiesdetail_id INT NOT NULL,
        think_image VARCHAR(500) NULL,
        think_header VARCHAR(255) NULL,
        think_desc TEXT NULL,
        sort_order INT NOT NULL,
        FOREIGN KEY (technologiesdetail_id) REFERENCES technologiesdetail(id) ON DELETE CASCADE
      )
    `);
    console.log('Created/Checked technologies_think table.');

    // 3. Create stored procedures
    
    // SP_GetAllTechnologiesDetail
    await db.query('DROP PROCEDURE IF EXISTS SP_GetAllTechnologiesDetail');
    await db.query(`
      CREATE PROCEDURE SP_GetAllTechnologiesDetail()
      BEGIN
        SELECT td.*, t.name AS category_name
        FROM technologiesdetail td
        JOIN technologies t ON td.technologies_id = t.id
        ORDER BY td.created_at DESC;
      END
    `);
    console.log('Created SP_GetAllTechnologiesDetail.');

    // SP_GetTechnologiesDetailById
    await db.query('DROP PROCEDURE IF EXISTS SP_GetTechnologiesDetailById');
    await db.query(`
      CREATE PROCEDURE SP_GetTechnologiesDetailById(IN p_id INT)
      BEGIN
        SELECT td.*, t.name AS category_name
        FROM technologiesdetail td
        JOIN technologies t ON td.technologies_id = t.id
        WHERE td.id = p_id;
        
        SELECT * FROM technologies_think
        WHERE technologiesdetail_id = p_id
        ORDER BY sort_order ASC;
      END
    `);
    console.log('Created SP_GetTechnologiesDetailById.');

    // SP_GetTechnologiesDetailByTechnologiesId
    await db.query('DROP PROCEDURE IF EXISTS SP_GetTechnologiesDetailByTechnologiesId');
    await db.query(`
      CREATE PROCEDURE SP_GetTechnologiesDetailByTechnologiesId(IN p_tech_id INT)
      BEGIN
        SELECT td.*, t.name AS category_name
        FROM technologiesdetail td
        JOIN technologies t ON td.technologies_id = t.id
        WHERE td.technologies_id = p_tech_id;
        
        SELECT tt.* 
        FROM technologies_think tt
        JOIN technologiesdetail td ON tt.technologiesdetail_id = td.id
        WHERE td.technologies_id = p_tech_id
        ORDER BY tt.sort_order ASC;
      END
    `);
    console.log('Created SP_GetTechnologiesDetailByTechnologiesId.');

    // SP_InsertTechnologiesDetail
    await db.query('DROP PROCEDURE IF EXISTS SP_InsertTechnologiesDetail');
    await db.query(`
      CREATE PROCEDURE SP_InsertTechnologiesDetail(
        IN p_technologies_id INT,
        IN p_banner_image VARCHAR(500),
        IN p_banner_title VARCHAR(255),
        IN p_expertise_header VARCHAR(255),
        IN p_expertise_desc TEXT,
        IN p_think_items JSON
      )
      BEGIN
        DECLARE v_detail_id INT;
        DECLARE i INT DEFAULT 0;
        DECLARE v_count INT;

        START TRANSACTION;

        INSERT INTO technologiesdetail (technologies_id, banner_image, banner_title, expertise_header, expertise_desc)
        VALUES (p_technologies_id, p_banner_image, p_banner_title, p_expertise_header, p_expertise_desc);

        SET v_detail_id = LAST_INSERT_ID();
        SET v_count = JSON_LENGTH(p_think_items);

        WHILE i < v_count DO
            INSERT INTO technologies_think (technologiesdetail_id, think_image, think_header, think_desc, sort_order)
            VALUES (
                v_detail_id,
                JSON_UNQUOTE(JSON_EXTRACT(p_think_items, CONCAT('$[', i, '].image'))),
                JSON_UNQUOTE(JSON_EXTRACT(p_think_items, CONCAT('$[', i, '].header'))),
                JSON_UNQUOTE(JSON_EXTRACT(p_think_items, CONCAT('$[', i, '].desc'))),
                i + 1
            );
            SET i = i + 1;
        END WHILE;

        COMMIT;
        SELECT v_detail_id AS inserted_id;
      END
    `);
    console.log('Created SP_InsertTechnologiesDetail.');

    // SP_UpdateTechnologiesDetail
    await db.query('DROP PROCEDURE IF EXISTS SP_UpdateTechnologiesDetail');
    await db.query(`
      CREATE PROCEDURE SP_UpdateTechnologiesDetail(
        IN p_id INT,
        IN p_technologies_id INT,
        IN p_banner_image VARCHAR(500),
        IN p_banner_title VARCHAR(255),
        IN p_expertise_header VARCHAR(255),
        IN p_expertise_desc TEXT,
        IN p_think_items JSON
      )
      BEGIN
        DECLARE i INT DEFAULT 0;
        DECLARE v_count INT;

        START TRANSACTION;

        UPDATE technologiesdetail
        SET technologies_id = p_technologies_id,
            banner_image = p_banner_image,
            banner_title = p_banner_title,
            expertise_header = p_expertise_header,
            expertise_desc = p_expertise_desc
        WHERE id = p_id;

        -- Clean old think items to re-insert updated list
        DELETE FROM technologies_think WHERE technologiesdetail_id = p_id;

        SET v_count = JSON_LENGTH(p_think_items);

        WHILE i < v_count DO
            INSERT INTO technologies_think (technologiesdetail_id, think_image, think_header, think_desc, sort_order)
            VALUES (
                p_id,
                JSON_UNQUOTE(JSON_EXTRACT(p_think_items, CONCAT('$[', i, '].image'))),
                JSON_UNQUOTE(JSON_EXTRACT(p_think_items, CONCAT('$[', i, '].header'))),
                JSON_UNQUOTE(JSON_EXTRACT(p_think_items, CONCAT('$[', i, '].desc'))),
                i + 1
            );
            SET i = i + 1;
        END WHILE;

        COMMIT;
      END
    `);
    console.log('Created SP_UpdateTechnologiesDetail.');

    // SP_DeleteTechnologiesDetail
    await db.query('DROP PROCEDURE IF EXISTS SP_DeleteTechnologiesDetail');
    await db.query(`
      CREATE PROCEDURE SP_DeleteTechnologiesDetail(IN p_id INT)
      BEGIN
        START TRANSACTION;
        DELETE FROM technologiesdetail WHERE id = p_id;
        COMMIT;
      END
    `);
    console.log('Created SP_DeleteTechnologiesDetail.');

    console.log('Migration finished successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
