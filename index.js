// setup
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const fetch = require('node-fetch');
const app = express();

async function getModHasIcon(modName) {
  const url = "https://mirror.sgkoi.dev/direct";
  return fetch(`${url}/${modName}.png`, { method: "Get" })
    .then(d => d.status === 200);
}

async function getModPage(modName) {
  const url = "http://javid.ddns.net/tModLoader/tools/querymodhomepage.php";
  return fetch(`${url}?modname=${modName}`, { method: "Get" })
    .then(d => d.text());
}

async function getModInfo(modName) {
  const url = "http://javid.ddns.net/tModLoader/tools/modinfo.php";
  return fetch(`${url}?modname=${modName}`, { method: "Get" })
    .then(d => d.json());
}

// fixes file paths
app.use(express.static(__dirname));
//enables json use
app.use(express.json());

//get request for the homepage
app.get('/', async (request, response) => {
  await response.sendFile(path.join(process.cwd(), 'index.html'));
});

// listening for requests
app.listen(3000, () => {
  console.log('server started');
});

let fetchedMod;
app.post('/getDescription', async (request, response) => {
  console.log("getting description");
  let allDescriptions = await fetch('http://javid.ddns.net/tModLoader/tools/querymodnamehomepagedescription.php', { method: "Get" }).then(r => r.json());
  response.status(200).json(allDescriptions.filter(x => x.name == fetchedMod)[0].description);
});

app.post('/idk', async (request, response) => {
  var con = mysql.createConnection({
    host: "sql7.freesqldatabase.com",
    user: "sql7384742",
    password: "GYR1aYu68T",
    database: "sql7384742"
  });
  con.connect((err)=> {
    if (err) console.log(err);
    console.log("recieved mod list");
  });
  
  let sql = `SELECT displayname FROM mods`;

  con.query(sql, async (err, result) => {
    try {
      if (err) {
        console.error(err);
        response.status(500);
        return;
      }
      response.status(200).json(result);
    }
    catch (err) {
      console.error(err);
      response.status(500);
    }
  });
  con.end();
});

// get data from database and send it to front-end
app.post('/api', async (request, response) => {
  var con = mysql.createConnection({
    host: "sql7.freesqldatabase.com",
    user: "sql7384742",
    password: "GYR1aYu68T",
    database: "sql7384742"
  });
  con.connect((err)=> {
    if (err) console.log(err);
    console.log("connected to DB");
  });
  
  let modname = con.escape(request.body.str);

  console.log('Got a request: ' + modname);
  let sql = `SELECT * FROM mods WHERE name=${modname} OR displayname=${modname}`;

  con.query(sql, async (err, result) => {
    try {
      const modInfo = getModInfo(result[0].name);
      const pageUrl = getModPage(result[0].name);
      const hasIcon = getModHasIcon(result[0].name);

      const data = await Promise.all([modInfo, pageUrl, hasIcon])
        .then(([info, page, icon]) => ({
          ...result[0],
          ...info,
          homepage: page || "no homepage",
          hasIcon: icon,
        }));

      response.status(200).json(data);
      fetchedMod = data.name; 
    }
    catch (err) {
      console.error(err);
      response.status(500);
      response.json(null);
    }
  });
  con.end();
});

//stuff to do on exit
process.on('exit', function() {
  console.log('About to close');
});