const fsUtils = require('./../fireStoreUtils');
const firebase = require('firebase-admin');
const uuid = require('uuid/v1');
const db = firebase.firestore();
const Utils = require('./../userUtils');
var verifyToken = require('./../middleware/verifyToken').verifyToken;
var requireRole = require('./../middleware/verifyToken').requireRole;
var pg = require('pg');
var cors = require('cors');
var bodyParser = require('body-parser');


// Routes
module.exports = (app) => {

    app.use(cors());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());

    app.get('/helloWorld', verifyToken, (req, res) => {
        return res.send("Hello " + req.usn + " from Firebase!");
    });

    app.get('/ssoRedirectUrl', (req, res) => {
        let returnUrl = req.query.returnUrl;
        let nonce = uuid();
        var data = {
            nonce,
            timestamp: (new Date).getTime(),
            count: 0
        };

        db.collection('nonce').doc(nonce).set(data);
        let redirectUrl = Utils.getRedirectUrl(nonce, returnUrl);
        return res.send(redirectUrl);
    });

    app.post('/signin', (req, res) => {
        try {
            req.body = JSON.parse(req.body);
        }
        catch (e) {
            // console.log(e);      
        }
        var sso = req.body["sso"];
        var sig = req.body.sig;
        let decodedSSO = Utils.verifySignature(sso, sig);

        if (!decodedSSO)
            return res.status(403).json({
                success: false,
                message: "Signature does not match",
            });

        let nonce = decodedSSO.nonce;
        // Check if nonce in decodedSSO exists in database
        return db.collection('nonce').doc(nonce).get()
            .then(doc => {
                let tenMinutes = 10 * 60 * 1000;
                if (!doc.exists || ((new Date).getTime() - doc.data().timestamp > tenMinutes) || (doc.data().count > 0)) {
                    // TODO: Increase nonce count
                    throw Object.assign({}, {
                        message: "Nonce is invalid",
                        name: 'Forbidden',
                    });
                }
                else {
                    return doc.id;
                }
            })
            .then((docId) => {
                // Increase nonce count
                return;
            })
            .then(() => {
                let token = Utils.generateToken(decodedSSO);
                var data = {
                    token,
                    timestamp: (new Date).getTime()
                };
                // console.log("New Token: ", token);

                db.collection('sessions').doc(String(token)).set(data, { merge: false });
                return token;
            })
            .then((token) => {
                return res.status(200).json({
                    success: true,
                    message: "User signed in.",
                    token
                });
            })
            .catch((error) => {
                // console.log(error);
                if (error.name === "Forbidden") {
                    return res.status(403).json({
                        success: false,
                        message: error.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Session not created',
                    error: error
                });
            });
    });

    app.get('/myRating', verifyToken, (req, res) => {
        let usn = req.usn;
        return db.collection('rating').doc(usn).get()
            .then(doc => {
                if (!doc.exists) {
                    // console.log('No such document!');
                    return res.status(200).send("{}");
                } else {
                    console.log('Document data:', doc.data());
                    return res.status(200).send(JSON.stringify(doc.data().teamsVoted));
                }
            })
            .catch((error) => {
                // console.log(error);
                return res.status(500).json({
                    success: false,
                    message: 'Error getting document',
                    error: error
                });
            });
    })

    app.get('/stats', requireRole("admin"), (req, res) => {
        var conString = "postgres://YourUserName:YourPassword@localhost:5432/YourDatabase";

        var client = new pg.Client(conString);
        try {
            client.connect();
            var query = client.query("SELECT name, count(*) FROM votes, teams WHERE teams.id = votes.team_id GROUP BY team_id, name ORDER BY count(*) desc");
            query.on('row', function (row) {
                let returnObj = {};
                returnObj[row.name] = row.count;
            })
            query.on('end', function () {
                client.end();
                return res.status(200).json(returnObj);

            });
        }
        catch{
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post('/newTeam', (req, res) => {
        try {
            req.body = JSON.parse(req.body);
        }
        catch (e) {
            // console.log(e);      
        }
        // console.log(req.body);
        var data = Object.assign({ isVerified: false }, {
            name: req.body.name || "Unknown",
            description: req.body.description || "(No description provided.)",
            photoUrl: req.body.photoUrl || "",
            createdAt: (new Date).getTime()
        });
        var teamName = data.name;
        var conString = "postgres://YourUserName:YourPassword@localhost:5432/YourDatabase";

        var client = new pg.Client(conString);
        try {
            client.connect();
            client.query({
                text: "INSERT INTO teams(id, name,isVerified, description) values($1, $2, $3, $4)",
                values: [data.id, data.name, data.isVerified, data.description]
            });
            return res.status(200).json({
                success: true,
                message: "Team created.",
            });
        }
        catch{
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post('/addUsn', (req, res) => {
        try {
            req.body = JSON.parse(req.body);
        }
        catch (e) {
            // console.log(e);      
        }
        // console.log(req.body);
        var data = Object.assign({}, {
            usn: req.body.usn,
            pid: req.body.pid,
        });

        let encodedData = Utils.b64EncodeUnicode(JSON.stringify(data));
        data["lastModifiedAt"] = (new Date).getTime();
        var pg = require('pg');
        var conString = "postgres://YourUserName:YourPassword@localhost:5432/YourDatabase";

        var client = new pg.Client(conString);
        try {
            client.connect();
            client.query({
                text: "INSERT INTO attendance(id, usn,phone_id, last_modified_at) values($1, $2, $3, $4)",
                values: [data.id, data.usn, data.pid, data.lastModifiedAt]
            });
            return res.status(200).json({
                success: true,
                message: "Usn Added.",
            });
        }
        catch{
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    app.post('/registerId', (req, res) => {
        try {
            req.body = JSON.parse(req.body);
        }
        catch (e) {
            // console.log(e);      
        }
        // console.log(req.body);
        var data = Object.assign({ isVerified: true }, {
            pid: req.body.pid,
            createdAt: (new Date).getTime()
        });
        var usn = data.usn;
        var conString = "postgres://YourUserName:YourPassword@localhost:5432/YourDatabase";

        var client = new pg.Client(conString);
        try {
            client.connect();
            client.query({
                text: "INSERT INTO registered_phones(phone_id, isverified, registered_at) values($1, $2, $3)",
                values: [data.pid, usn, data.createdAt]
            });
            return res.status(200).json({
                success: true,
                message: "ID added.",
            });
        }
        catch{
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });


    app.get("/teams", (req, res) => {
        var conString = "postgres://YourUserName:YourPassword@localhost:5432/YourDatabase";

        var client = new pg.Client(conString);
        try {
            client.connect();
            var query = client.query("SELECT * FROM teams");
            query.on('row', function (row) {
                teams = [];
                let data = [row.name, row.isVerified, row.description]
                teams.push(Object.assign({ id: row.id }, data));
            });
            query.on('end', function () {
                client.end();
                return res.status(200).json(teams);

            });
        }
        catch{
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    })


    app.post('/rating', verifyToken, (req, res) => {
        // Not finalized yet.
        try {
            req.body = JSON.parse(req.body);
        }
        catch (e) {
            // console.log(e);      
        }
        // console.log("Data:" + req.body)
        var data = Object.assign({ usn: req.usn }, { teamsVoted: JSON.parse(req.body) });
        var usn = req.usn;
        data.timestamp = (new Date).getTime();
        var conString = "postgres://YourUserName:YourPassword@localhost:5432/YourDatabase";

        var client = new pg.Client(conString);
        try {
            client.connect();
            client.query({
                text: "INSERT INTO votes(id, usn,team_id, timestamp) values($1, $2, $3, $4)",
                values: [data.id, data.usn, data.teamsVoted, data.timestamp]
            });
            return res.status(200).json({
                success: true,
                message: "Ratings recorded.",
            });
        }
        catch{
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}