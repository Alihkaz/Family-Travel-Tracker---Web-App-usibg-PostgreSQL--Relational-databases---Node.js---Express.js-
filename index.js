// 

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;


//creating a blue print from the installed package(pg) , and filling up credentials to send them later when we connect ! 
const db = new pg.Client({
  user:process.env.USER,
  host:"localhost",
  database:"family",
  password: process.env.DB_PASSWORD,
  port:process.env.PORT,
});
db.connect();



app.use(bodyParser.urlencoded({ extended: true })); //to handle the input sended by the user 
app.use(express.static("public")); //to specify the location of the static files 

let currentUserId = 1;





let users=[];


// a function that we will use later in the routes , it aims to read the data base
// then we get the result as a form of array having items , each item have the countrie code
// then we push that code into an array that will be readed by the ejs file and change the status of the code depending on it
async function checkVisisted() {
  const result2 = await db.query(
    "SELECT visited_country FROM visited_countries JOIN users ON users.id=visited_by_id WHERE visited_by_id =$1 ;",
    [currentUserId]); //// reading the users table in family database ,  and getting the joined table for only the current user id along with all his visited country 

  let countries = []; //creating an empty array
  // loop through the array , extract the value in each item aand push it to the countries array 
  result2.rows.forEach((country) => {countries.push(country.visited_country);});
  return countries;
};









//  afunction that will read the users database , then return the result as 
// an array , each item in the array have a name and the colour of the user ! 
async function checkUsers() {

  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
};







// home page where we will display the visited countries according to the result of reading the db
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentuser = await checkUsers();
  
  res.render("index.ejs", {countries: countries,
                          total: countries.length,
                          users: users, 
                          color: currentuser.colour,
  });
});










// adding new country to the visited country table in family database
// after the user clicks on add button in index.ejs or the frontend side
// where we will first try to convert the country to a code , then try to insert it in the visited countries 
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await checkUsers();


  try { //tryting to see if the country exists and there is no typo
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    //  LIKE '%' || $1 || '%' , will search for similar pattern disregarding space at the begining and at the end ! 
    const data = result.rows[0]; //the country code will be the first item we get in the js array ! 
    const countryCode = data.country_code;





    // if yes , then check if the user with the current id has visited it before ! 
    try {
      await db.query("INSERT INTO visited_countries (visited_country,visited_by_id) VALUES ($1,$2)", [countryCode,currentUserId] );
      res.redirect("/");} 
 
    catch (err) {console.log(err); } //if he visited it before , then return that the country exists in his list


  } 
  
  catch (err) {console.log(err);} //if the country doesnot exist at all , then return that the country doesnot exists



});









// rendering the user registering form to fill it 
app.post("/user", async (req, res) => {

  // if the user clicks on add family member button , then we render the form to register
  if(req.body.add==='new'){
    
    res.render("new.ejs"); }
  // console.log(req.body)
  
else{
  // getting the id of the user that request to view his map , then  giving it to the home page so we can
  // filter the visited country table , and extract the visited coubtries by that user according to his id ! 
  currentUserId=req.body.user; 

  res.redirect("/");
}
  });







// adding new users al;ong with the picked color to the users table in family database
app.post("/new", async (req, res) => {
 
  console.log(req.body)
 const nameinput = req.body.name;   // extracting the new name entered by the user
 const colorinput = req.body.color; // extracting the new color entered by the user

  //adding the new registered user info to the users info ! 
  const result=await db.query("INSERT INTO users (name,colour) VALUES ($1,$2)",[nameinput,colorinput]); 

  //getting the id of the current created user to redirect him yo his page after he is registered
  const id = result.rows[0].id; 
  currentUserId = id;
  res.redirect("/");
  
});






// listening on the local port 3000
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});






