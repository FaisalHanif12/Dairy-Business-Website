const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const mysqlPromise = require('mysql2/promise');
const config = require('./config.json');
// Use dbHost, dbUser, dbPassword, and dbName to set up your database connection

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = ['http://localhost:3000', 'https://maherdairy.com', 'https://www.maherdairy.com'];

const corsOptionsDelegate = function (req, callback) {
  let corsOptions;
  let isDomainAllowed = allowedOrigins.includes(req.header('Origin'));
  if (isDomainAllowed) {
    corsOptions = { origin: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));
const dbConfig = {
    host: config.DATABASE_HOST,
    port: config.DATABASE_PORT || 3306, // If port is not specified in config.json, default to 3306
    user: config.DATABASE_USER,
    password: config.DATABASE_PASSWORD,
    database: config.DATABASE_NAME,
};

let connection;
const pool = mysqlPromise.createPool(dbConfig);
function handleDisconnect() {
    connection = mysql.createConnection(dbConfig);

    connection.connect(err => {
        if (err) {
            console.error('Error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect
        } else {
            console.log('Connected to the database successfully');
        }
    });

    connection.on('error', err => {
        console.error('Database error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect if the connection is closed
        } else {
            throw err;
        }
    });
}

handleDisconnect();

app.get("/consumerssale", (req, res) => {
    const sql = "SELECT * FROM consumerssale";
    connection.query(sql, (err, data) => {
        if (err) {
            console.error("SQL query error: ", err);
            res.status(500);
            res.setHeader('Content-Type', 'application/json');
            return res.json({ error: err.message });
        }
        res.setHeader('Content-Type', 'application/json');
        return res.json(data);
    });
});



app.get("/relatives", (req, res) => {
    const sql = "SELECT * FROM relatives";
    connection.query(sql, (err, data) => {
        if (err) {
            console.error("SQL query error: ", err);
            res.status(500);
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({ error: err.message });
        }
        return res.json(data);
    });
});

app.get("/expenditure", (req, res) => {
    const sql = "SELECT * FROM expenditure";
    connection.query(sql, (err, data) => {
        if (err) {
            console.error("SQL query error: ", err);
            res.status(500);
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({ error: err.message });
        }
        return res.json(data);
    });
});

app.post("/consumerssale", (req, res) => {
    const { Date, Name } = req.body;
    const Quantity = parseInt(req.body.Quantity, 10);
    const UnitPrice = parseFloat(req.body.UnitPrice);

    // Basic validation
    if (!Date || !Name || isNaN(Quantity) || isNaN(UnitPrice)) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    const Total = Quantity * UnitPrice;
    const sql = "INSERT INTO consumerssale (Date, Name, Quantity, UnitPrice, Total) VALUES (?, ?, ?, ?, ?)";

    connection.query(sql, [Date, Name, Quantity, UnitPrice, Total], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Sale added successfully', id: result.insertId });
    });
});

app.post("/expenditure", (req, res) => {
    const { Date, source } = req.body;
    let amount = parseFloat(req.body.amount);

    if (isNaN(amount) || !Date.trim() || !source.trim()) {
        return res.status(400).json({ error: "Invalid input provided." });
    }

    const sql = "INSERT INTO expenditure (Date, source, amount) VALUES (?, ?, ?)";

    connection.query(sql, [Date, source, amount], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Expense added successfully', id: result.insertId });
    });
});



app.post("/relatives", (req, res) => {
    // Extract Date and Rname directly from req.body
    const { Date, Rname } = req.body;

    // Parse Quantity and RUnitPrice from req.body and calculate RTotal
    const Quantity = parseFloat(req.body.Quantity);
    const RUnitPrice = parseFloat(req.body.RUnitPrice); // Ensure this matches the property name in your client-side code.

    let RTotal = 0;
    if (!isNaN(Quantity) && !isNaN(RUnitPrice)) {
        RTotal = Quantity * RUnitPrice;
    } else {
        // If Quantity or RUnitPrice are not valid numbers, respond with an error.
        return res.status(400).json({ error: "Invalid Quantity or Unit Price." });
    }

    // Proceed with inserting the data into the database
    const sql = "INSERT INTO relatives (Date, Rname, Quantity, RUnitPrice, RTotal) VALUES (?, ?, ?, ?, ?)";
    connection.query(sql, [Date, Rname, Quantity, RUnitPrice, RTotal], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: err.message });
        }
        return res.status(201).json({ message: 'Sale added successfully', id: result.insertId });
    });
});


app.put("/consumerssale/:id", (req, res) => {
    const { Date, Name, Quantity, UnitPrice } = req.body;
    const Total = Quantity * UnitPrice;
    const sql = "UPDATE consumerssale SET Date = ?, Name = ?, Quantity = ?, UnitPrice = ?, Total = ? WHERE idConsumersSale = ?";

    connection.query(sql, [Date, Name, Quantity, UnitPrice, Total, req.params.id], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: err.message });
        }
        return res.json({ message: 'Sale updated successfully' });
    });
});

app.put("/relatives/:id", async (req, res) => {
    const { Date, Rname, Quantity, RUnitPrice } = req.body;
    const RTotal = Quantity * RUnitPrice; // Ensure this calculation is correct and not resulting in NaN
    const sql = "UPDATE relatives SET Date = ?, Rname = ?, Quantity = ?, RUnitPrice = ?, RTotal = ? WHERE idRelatives = ?";

    try {
        const [result] = await connection.promise().query(sql, [Date, Rname, Quantity, RUnitPrice, RTotal, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No record found with that ID to update' });
        }
        res.json({ message: 'Sale updated successfully' });
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put("/expenditure/:id", async (req, res) => {
    const { Date, source, amount } = req.body;

    const sql = "UPDATE expenditure SET Date = ?, source = ?, amount  = ? WHERE idexpenditure = ?";

    try {
        const [result] = await connection.promise().query(sql, [Date, source, amount, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No record found with that ID to update' });
        }
        res.json({ message: 'Sale updated successfully' });
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.delete("/consumerssale/:id", (req, res) => {
    // Replace 'id' with the actual column name of your primary key
    const sql = "DELETE FROM consumerssale WHERE idConsumersSale = ?";

    connection.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            // No record with that ID was found to delete
            return res.status(404).json({ message: 'No record found with that ID to delete' });
        }
        return res.json({ message: 'Sale deleted successfully' });
    });
});

app.delete("/relatives/:id", (req, res) => {
    // Replace 'id' with the actual column name of your primary key
    const sql = "DELETE FROM relatives WHERE idRelatives = ?";

    connection.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            // No record with that ID was found to delete
            return res.status(404).json({ message: 'No record found with that ID to delete' });
        }
        return res.json({ message: 'Sale deleted successfully' });
    });
});
app.delete("/expenditure/:id", (req, res) => {
    // Replace 'id' with the actual column name of your primary key
    const sql = "DELETE FROM expenditure WHERE idexpenditure = ?";

    connection.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            // No record with that ID was found to delete
            return res.status(404).json({ message: 'No record found with that ID to delete' });
        }
        return res.json({ message: 'Sale deleted successfully' });
    });
});
// Fetch all consumer khata data
app.get('/consumerkhata', (req, res) => {
    const sql = 'SELECT * FROM consumerkhata';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Error fetching consumerkhata data:", error);
            res.status(500).setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type for error response
            return res.json({ error: error.message });
        }
        res.setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type for successful response
        res.json(results);
    });
});

app.get('/employeekhata', (req, res) => {
    const sql = 'SELECT * FROM employeekhata';
    connection.query(sql, (error, results) => {
        console.log(results); // Log the results to inspect the Date values
        if (error) {
            console.error("Error fetching employeekhata data:", error);
            res.status(500).setHeader('Content-Type', 'application/json'); // Set Content-Type for error response
            return res.json({ error: error.message });
        }
        res.setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type for successful response
        res.json(results);
    });
});



app.post('/consumerkhata', (req, res) => {
    const { date, name, baqaya } = req.body;
    const sql = 'INSERT INTO consumerkhata (date, name, baqaya) VALUES (?, ?, ?)';
    connection.query(sql, [date, name, baqaya], (error, result) => {
        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ message: 'Data added successfully', id: result.insertId });
    });
});

app.post('/employeekhata', (req, res) => {
    const { date, name, baqaya } = req.body;
    const sql = 'INSERT INTO employeekhata (Date, name, baqaya) VALUES (?, ?, ?)';
    connection.query(sql, [date, name, baqaya], (error, result) => {
        if (error) {
            console.error('SQL Error:', error);
            return res.status(500).json({ error: error.message });
        }
        res.status(201).json({ message: 'Data added successfully', id: result.insertId });
    });
});


// Update existing consumer khata data
app.put('/consumerkhata/:id', (req, res) => {
    const { id } = req.params;
    const { Date, name, baqaya } = req.body;

    // Log incoming data for debugging
    console.log(`Updating consumer ${id} with date: ${Date}, name: ${name}, baqaya: ${baqaya}`);

    // Simple validation (You can expand this based on your requirements)
    if (!Date || !name || baqaya === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = 'UPDATE consumerkhata SET date = ?, name = ?, baqaya = ? WHERE idconsumerkhata = ?';
    connection.query(sql, [Date, name, baqaya, id], (error, result) => {
        if (error) {
            console.error('SQL Error:', error);
            return res.status(500).json({ error: error.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No record found with that ID' });
        }
        res.json({ message: 'Data updated successfully' });
    });
});

app.put('/employeekhata/:id', (req, res) => {
    const { id } = req.params;
    const { Date, name, baqaya } = req.body;

    // Log incoming data for debugging
    console.log(`Updating consumer ${id} with date: ${Date}, name: ${name}, baqaya: ${baqaya}`);

    // Simple validation (You can expand this based on your requirements)
    if (!Date || !name || baqaya === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = 'UPDATE employeekhata SET date = ?, name = ?, baqaya = ? WHERE idEmployeekhata = ?';
    connection.query(sql, [Date, name, baqaya, id], (error, result) => {
        if (error) {
            console.error('SQL Error:', error);
            return res.status(500).json({ error: error.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No record found with that ID' });
        }
        res.json({ message: 'Data updated successfully' });
    });
});

// Server-side: Express route to handle POST request for new Wasooli transactions
app.post('/wasooli', async (req, res) => {
    const { date, Wasooli, consumerId } = req.body; // Assuming you send consumerId in the body

    // Input validation
    if (!date || Wasooli === undefined || isNaN(parseInt(Wasooli)) || parseInt(Wasooli) < 0 || !consumerId) {
        return res.status(400).send({ error: "Missing, invalid, or negative Wasooli amount, or missing consumer ID" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [consumerExists] = await connection.query('SELECT * FROM consumerkhata WHERE idconsumerkhata = ?', [consumerId]);
        if (consumerExists.length === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Consumer not found" });
        }

        await connection.query('INSERT INTO wasooli (consumerkhata_id, date, Wasooli) VALUES (?, ?, ?)', [consumerId, date, Wasooli]);
        await connection.query('UPDATE consumerkhata SET baqaya = baqaya - ? WHERE idconsumerkhata = ?', [Wasooli, consumerId]);

        await connection.commit();
        res.status(201).send({ message: "Wasooli transaction added and baqaya updated successfully." });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Error handling Wasooli transaction:", error);
        res.status(500).send({ error: "Internal server error", details: error.message });
    } finally {
        if (connection) {
            await connection.release();
        }
    }
});
app.post('/kharchay', async (req, res) => {
    const { date, source , Wasooli, consumerId } = req.body; // Assuming you send consumerId in the body

    // Input validation
    if (!date || Wasooli === undefined || isNaN(parseInt(Wasooli)) || parseInt(Wasooli) < 0 || !consumerId) {
        return res.status(400).send({ error: "Missing, invalid, or negative Wasooli amount, or missing consumer ID" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [consumerExists] = await connection.query('SELECT * FROM employeekhata WHERE idEmployeekhata = ?', [consumerId]);
        if (consumerExists.length === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Consumer not found" });
        }

        await connection.query('INSERT INTO kharchay (employeekhataId, date, source, Wasooli) VALUES (?, ?, ?, ?)', [consumerId, date,source, Wasooli]);
        await connection.query('UPDATE employeekhata SET baqaya = baqaya - ? WHERE idEmployeekhata = ?', [Wasooli, consumerId]);

        await connection.commit();
        res.status(201).send({ message: "Wasooli transaction added and baqaya updated successfully." });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Error handling Wasooli transaction:", error);
        res.status(500).send({ error: "Internal server error", details: error.message });
    } finally {
        if (connection) {
            await connection.release();
        }
    }
});

app.get('/wasooli/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await pool.query('SELECT * FROM wasooli WHERE consumerkhata_id = ?', [id]);
        res.setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type
        // Return an empty array instead of 404 if no transactions found
        res.json(results.length > 0 ? results : []);
    } catch (error) {
        console.error('Error fetching Wasooli data:', error);
        res.status(500).setHeader('Content-Type', 'application/json'); // Set Content-Type for error response
        res.send({ error: 'Internal server error', details: error.message });
    }
});

app.get('/kharchay/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await pool.query('SELECT * FROM kharchay WHERE employeekhataId = ?', [id]);
        res.setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type
        // Return an empty array instead of 404 if no transactions found
        res.json(results.length > 0 ? results : []);
    } catch (error) {
        console.error('Error fetching Kharchay data:', error);
        res.status(500).setHeader('Content-Type', 'application/json'); // Set Content-Type for error response
        res.send({ error: 'Internal server error', details: error.message });
    }
});


app.delete('/wasooli/:id', async (req, res) => {
    const { id } = req.params;
    try {
      // Get a connection from the pool
      const connection = await pool.getConnection();
  
      // Start a transaction
      await connection.beginTransaction();
  
      const transactionQuery = 'SELECT * FROM wasooli WHERE idwasooli = ?';
      const [wasooliResults] = await connection.query(transactionQuery, [id]);
      if (wasooliResults.length === 0) {
        await connection.rollback(); // Rollback the transaction
        connection.release(); // Don't forget to release the connection back to the pool
        return res.status(404).send({ message: 'Wasooli transaction not found.' });
      }
  
      const wasooliAmount = wasooliResults[0].Wasooli; // Ensure this matches your column name
      const consumerId = wasooliResults[0].consumerkhata_id;
  
      const updateBaqayaQuery = 'UPDATE consumerkhata SET baqaya = baqaya + ? WHERE idconsumerkhata = ?';
      await connection.query(updateBaqayaQuery, [wasooliAmount, consumerId]);
  
      const deleteQuery = 'DELETE FROM wasooli WHERE idwasooli = ?';
      await connection.query(deleteQuery, [id]);
  
      await connection.commit(); // Commit the transaction
  
      connection.release(); // Release the connection back to the pool
  
      res.json({ message: 'Wasooli transaction deleted and Baqaya updated.', deletedAmount: wasooliAmount });
    } catch (error) {
      // If an error occurs, rollback the transaction and release the connection
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error('Error during transaction:', error);
      res.status(500).send({ error: 'Internal server error', details: error.message });
    }
  });
  app.delete('/kharchay/:id', async (req, res) => {
    const { id } = req.params;
    try {
      // Get a connection from the pool
      const connection = await pool.getConnection();
  
      // Start a transaction
      await connection.beginTransaction();
  
      const transactionQuery = 'SELECT * FROM kharchay WHERE idkharchay = ?';
      const [wasooliResults] = await connection.query(transactionQuery, [id]);
      if (wasooliResults.length === 0) {
        await connection.rollback(); // Rollback the transaction
        connection.release(); // Don't forget to release the connection back to the pool
        return res.status(404).send({ message: 'Wasooli transaction not found.' });
      }
  
      const wasooliAmount = wasooliResults[0].Wasooli; // Ensure this matches your column name
      const consumerId = wasooliResults[0].employeekhataId;
  
      const updateBaqayaQuery = 'UPDATE employeekhata SET baqaya = baqaya + ? WHERE idEmployeekhata = ?';
      await connection.query(updateBaqayaQuery, [wasooliAmount, consumerId]);
  
      const deleteQuery = 'DELETE FROM kharchay WHERE idkharchay = ?';
      await connection.query(deleteQuery, [id]);
  
      await connection.commit(); // Commit the transaction
  
      connection.release(); // Release the connection back to the pool
  
      res.json({ message: 'Wasooli transaction deleted and Baqaya updated.', deletedAmount: wasooliAmount });
    } catch (error) {
      // If an error occurs, rollback the transaction and release the connection
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error('Error during transaction:', error);
      res.status(500).send({ error: 'Internal server error', details: error.message });
    }
  });
  

  app.put('/wasooli/:id', async (req, res) => {
    const { id } = req.params;
    const { date, Wasooli } = req.body; // Changed variable name from "wasooli" to "Wasooli" to match client-side

    

    // Validation for missing or invalid data
    if (!date || isNaN(Wasooli) || Wasooli <= 0) { // Changed variable name from "wasooli" to "Wasooli"
        return res.status(400).json({ message: "Invalid or missing data" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Fetch the original transaction
        const [originalTransactions] = await connection.query('SELECT * FROM wasooli WHERE idwasooli = ?', [id]);
        if (originalTransactions.length === 0) {
            await connection.rollback(); // No need to commit if we're throwing an error
            connection.release();
            return res.status(404).json({ message: 'Original Wasooli transaction not found.' });
        }
        const originalTransaction = originalTransactions[0];

        // Validate and calculate new Wasooli amount
        const newWasooliAmount = parseInt(Wasooli); // Changed variable name from "wasooli" to "Wasooli"
        const originalWasooliAmount = parseInt(originalTransaction.Wasooli);
        if (isNaN(newWasooliAmount) || isNaN(originalWasooliAmount)) {
            throw new Error('Wasooli amounts must be valid numbers.');
        }

        await connection.query('UPDATE consumerkhata SET baqaya = baqaya + ? WHERE idconsumerkhata = ?', [originalWasooliAmount, originalTransaction.consumerkhata_id]);

        // Update the Wasooli transaction with the new amount
        await connection.query('UPDATE wasooli SET date = ?, Wasooli = ? WHERE idwasooli = ?', [date, newWasooliAmount, id]);

        // Then, subtract the new Wasooli amount from baqaya
        await connection.query('UPDATE consumerkhata SET baqaya = baqaya - ? WHERE idconsumerkhata = ?', [newWasooliAmount, originalTransaction.consumerkhata_id]);

        await connection.commit(); // Correct place for commit
        res.json({ message: 'Wasooli transaction updated successfully.' });
    } catch (error) {
        console.error('Error during transaction, rolling back:', error);
        if (connection) {
            await connection.rollback(); // Ensure rollback in case of error
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        if (connection) {
            await connection.release(); // Ensure connection is always released
        }
    }
});


app.put('/kharchay/:id', async (req, res) => {
    const { id } = req.params;
    const { date, source, Wasooli } = req.body; // Changed variable name from "wasooli" to "Wasooli" to match client-side



    // Validation for missing or invalid data
    if (!date || isNaN(Wasooli) || Wasooli <= 0) { // Changed variable name from "wasooli" to "Wasooli"
        return res.status(400).json({ message: "Invalid or missing data" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Fetch the original transaction
        const [originalTransactions] = await connection.query('SELECT * FROM kharchay WHERE idkharchay = ?', [id]);
        if (originalTransactions.length === 0) {
            await connection.rollback(); // No need to commit if we're throwing an error
            connection.release();
            return res.status(404).json({ message: 'Original Wasooli transaction not found.' });
        }
        const originalTransaction = originalTransactions[0];

        // Validate and calculate new Wasooli amount
        const newWasooliAmount = parseInt(Wasooli); // Changed variable name from "wasooli" to "Wasooli"
        const originalWasooliAmount = parseInt(originalTransaction.Wasooli);
        if (isNaN(newWasooliAmount) || isNaN(originalWasooliAmount)) {
            throw new Error('kharcha amounts must be valid numbers.');
        }

        await connection.query('UPDATE employeekhata SET baqaya = baqaya + ? WHERE idEmployeekhata = ?', [originalWasooliAmount, originalTransaction.employeekhataId]);

        // Update the Wasooli transaction with the new amount
        await connection.query('UPDATE kharchay SET date = ?, source = ?, Wasooli = ? WHERE idkharchay = ?', [date, source, newWasooliAmount, id]);

        // Then, subtract the new Wasooli amount from baqaya
        await connection.query('UPDATE employeekhata SET baqaya = baqaya - ? WHERE idEmployeekhata = ?', [newWasooliAmount, originalTransaction.employeekhataId]);

           
        await connection.commit(); // Correct place for commit
        res.json({ message: 'Wasooli transaction updated successfully.' });
    } catch (error) {
        console.error('Error during transaction, rolling back:', error);
        if (connection) {
            await connection.rollback(); // Ensure rollback in case of error
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        if (connection) {
            await connection.release(); // Ensure connection is always released
        }
    }
});



// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
