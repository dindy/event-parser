import mysql from 'mysql2/promise';



// connection.connect((err) => {
//     if (err) throw err;
//     console.log('Connected to MySQL Database!');    
// })

const findApp = async (instanceDomain) => {
    
    var connection = await mysql.createConnection({
        host     : process.env.MYSQL_HOST,
        user     : process.env.MYSQL_USER,
        password : process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
    });
    
    console.log(instanceDomain)
    const { results, fields } = await connection.query(`SELECT * FROM \`apps\` WHERE \`instance_domain\` = '${instanceDomain}'`)
    console.log(results); // results contains rows returned by server
    console.log(fields); // fields contains extra meta data about results, if available
}
 
// connection.end();

export { findApp }