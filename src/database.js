const sqlite3 = require("sqlite3").verbose();
const _ = require("lodash");
const dateFormat = "YYYY-mm-dd HH:MM:SS";

const database = () => {
  const db = new sqlite3.Database('assets/sample.db');
  /**
   * verification_table
   * ID           INTEGER PK AUTOINCREMENT
   * VER_CODE     VARCHAR(100)
   * CREATED_DT   DATETIME
   * 
   * secret_table
   * ID           INTEGER PK AUTOINCREMENT
   * SEC_CODE     VARCHAR(100)
   * GENERATE_DT   DATETIME
   * CREATED_DT   DATETIME
   */
  const init = () => {
    db.run('CREATE TABLE IF NOT EXISTS verification_table(ID INTEGER PRIMARY KEY AUTOINCREMENT, VER_CODE VARCHAR(100), CREATED_DT DATETIME)');
    db.run('CREATE TABLE IF NOT EXISTS secret_table(ID INTEGER PRIMARY KEY AUTOINCREMENT, SEC_CODE VARCHAR(100), GENERATE_DT DATETIME, CREATED_DT DATETIME)');
  }

  const insertVerificationCode = (vCode) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO verification_table(VER_CODE,CREATED_DT) VALUES($code, DateTime("now"))',
        {
          $code: vCode,
        },
        (err) => {
          if (err) {
            console.log(err.message);
            reject(err);
          }
          resolve('success');
        }
      )
    });
  }

  const insertSecretCode = (list) => {
    _.forEach(list, ({ secret, time }) => {
      db.run(
        'INSERT INTO secret_table(SEC_CODE, GENERATE_DT, CREATED_DT) VALUES($key, $time, DateTime("now"))',
        {
          $key: secret,
          $time: time
        },
        (err) => {
          if (err) {
            console.log(err.message);
          }
        }
      );
    });
  };

  const checkVerificationCode = (vCode) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT ID FROM verification_table WHERE VER_CODE = $code ORDER BY CREATED_DT ASC',
        {
          $code: vCode,
        },
        (err, row) => {
          if (!row) {
            console.log('verification Code not found');
            reject('verification Code not found')
          } else if (row) {
            resolve(row.ID);
          } else if (err) {
            console.log(err.message);
            reject(err);
          }
        }
      )
    });
  }

  const getSecretList = () => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT SEC_CODE, GENERATE_DT FROM secret_table WHERE GENERATE_DT >= datetime("now", "-14 day")',
        (err, row) => {
          if (row) {
            resolve(
              row.map(
                ({ SEC_CODE, GENERATE_DT }) => { return { "secret": SEC_CODE, "time": GENERATE_DT }; }
              )
            );
          }
          if (err) {
            console.log(err.message);
            reject(err);
          }
        }
      )
    });
  }

  const cleanExpiredSecret = () => {
    db.exec('DELETE FROM secret_table WHERE GENERATE_DT <= datetime("now", "-14 day")')
  }

  const deleteUsedVerificationCode = (id) => {
    db.run('DELETE FROM verification_table WHERE ID = $id', { $id: id });
  }

  //
  return {
    init,
    insertVerificationCode,
    insertSecretCode,
    checkVerificationCode,
    getSecretList,
    cleanExpiredSecret,
    deleteUsedVerificationCode,
  }
}
module.exports = {
  database
}