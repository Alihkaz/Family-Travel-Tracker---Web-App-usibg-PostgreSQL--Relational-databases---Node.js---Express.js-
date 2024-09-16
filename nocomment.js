// 

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;


const db = new pg.Client({
  user:process.env.USER,
  host:"localhost",
  database:"family",
  password: process.env.DB_PASSWORD,
  port:process.env.PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static("public")); 

let currentUserId = 1;



let users=[];

async function checkVisisted() {
  const result2 = await db.query(
    "SELECT visited_country FROM visited_countries JOIN users ON users.id=visited_by_id WHERE visited_by_id =$1 ;",
    [currentUserId]); 

  let countries = []; 

  result2.rows.forEach((country) => {countries.push(country.visited_country);});
  return countries;
};





async function checkUsers() {

  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
};



app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentuser = await checkUsers();
  
  res.render("index.ejs", {countries: countries,
                          total: countries.length,
                          users: users, 
                          color: currentuser.colour, });
});









app.post("/add", async (req, res) => {


  const input = req.body["country"];
  const currentUser = await checkUsers();


  try { 
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;

    try {
      await db.query("INSERT INTO visited_countries (visited_country,visited_by_id) VALUES ($1,$2)", [countryCode,currentUserId] );
      res.redirect("/");} 
 
    catch (err) {console.log(err); }

    } 
  
  catch (err) {console.log(err);} 


});










app.post("/user", async (req, res) => {


  if(req.body.add==='new'){
    res.render("new.ejs"); }

  
    else{
    currentUserId=req.body.user;
    res.redirect("/");
    }

  });








app.post("/new", async (req, res) => {
 
  
  const nameinput = req.body.name;  
  const colorinput = req.body.color; 
  const result=await db.query("INSERT INTO users (name,colour) VALUES ($1,$2)",[nameinput,colorinput]); 


  const id = result.rows[0].id;
  currentUserId = id;
  res.redirect("/");
  
});






app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


