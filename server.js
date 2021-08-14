require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const { parse } = require("path");
const { isNullOrUndefined } = require("util");
const { env } = require("process");
const { Cookie } = require("express-session");

app.set("view engine","ejs");
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "Secret",
    resave: false,
    saveUninitialized: false,
    cookie:{expires:new Date(Date.now() + 3600000)}
}));


app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://birju:9351@chu-cha.gorz9.mongodb.net/chu-cha?retryWrites=true&w=majority", { useUnifiedTopology: true, useNewUrlParser: true });
// mongoose.connect("mongodb://localhost:27017/abcd", { useUnifiedTopology: true, useNewUrlParser: true })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);


const userSchema = new mongoose.Schema({
    userName: String,
    connectedUsers: [
        {
            otherUserName: String,
            messages: [
                {
                    message: String,
                    time: String,
                    discription: String
                }
            ]
        }
    ]
});
const loginSchema = new mongoose.Schema({
    username:String,
    password:String
});
loginSchema.plugin(passportLocalMongoose);


const IdPass = mongoose.model("idpass", loginSchema);
const UserList = mongoose.model("main", userSchema);

passport.use(IdPass.createStrategy());
passport.serializeUser(IdPass.serializeUser());
passport.deserializeUser(IdPass.deserializeUser());
// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));


app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});


app.get("/chat-box",(req,res)=>{
    if (req.isAuthenticated()) {
        UserList.find({ userName:req.user.username}, { connectedUsers: 1, _id: 0, __v: 0, connectedUsers: { _id: 0, messages: { _id: 0 } } }, (err, found) => {
            res.render("index", { messages: JSON.stringify(found[0]), name: req.user.username });
        });
    }
    else{
        res.redirect("/login");
    }
});

app.post("/register",(req,res)=>{
    IdPass.register({username:req.body.username},req.body.password,(err,user)=>{
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else{
            IdPass.find({},{_id:0,username:1},(err, found) => {
                const userSch = new UserList({
                    userName: req.body.username,
                    connectedUsers:[]
                });
                found.forEach(element => {
                    const obj = {
                        otherUserName: element.username,
                        messages:[]
                    };
                    userSch.connectedUsers.push(obj);
                });
                userSch.save();
                });
                const obj = {
                    otherUserName: req.body.username,
                    messages:[]
                };
                UserList.updateMany({},
                  {
                    "$push": {
                      "connectedUsers": obj
                    }
                },(err)=>{
                    if (err) {
                        console.log(err);
                    }
                    else{
                        console.log("Successful");
                    }
                });
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/chat-box");
            })
        }
    })
});

app.post("/login",(req,res)=>{
    const user = new IdPass({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user,(err)=>{
        if (err) {
            console.log(err);
            console.log("Not Done");
        }
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/chat-box");
            });
        }
    });
});

// app.post("/login", (req, res) => {
//     let email = req.body.Email, Password = req.body.Password;
//     if (req.body.username != undefined) {
//             const signUp = new IdPass ({
//                 email:email,
//                 password:Password,
//                 name:req.body.username
//             });
//             signUp.save();
//             IdPass.find({},{_id:0,email:0,password:0,__v:0},(err, found) => {
//             let arr = [];
//             const userSch = new UserList({
//                 userName: req.body.username,
//                 connectedUsers:[]
//             });
//             found.forEach(element => {
//                 const obj = {
//                     otherUserName: element.name,
//                     messages:[]
//                 };
//                 userSch.connectedUsers.push(obj);
//             });
//             userSch.save();
//             });
//             const obj = {
//                 otherUserName: req.body.username,
//                 messages:[]
//             };
//             UserList.updateMany({},
//               {
//                 "$push": {
//                   "connectedUsers": obj
//                 }
//             },(err)=>{
//                 if (err) {
//                     console.log(err);
//                 }
//                 else{
//                     console.log("Successful");
//                 }
//             });
//             res.redirect("/login");
//     }
//     else{
//     IdPass.findOne({email:email},{password:1,name:1},(error, mainFound) => {
//         if (error) {
//             console.log(error);
//             res.redirect("/login");
//         }
//         else  if(mainFound){
//         if (mainFound.password == Password) {
//             user = found.name;
//             res.redirect("/main");
//             UserList.find({ userName: mainFound.name }, { connectedUsers: 1, _id: 0, __v: 0, connectedUsers: { _id: 0, messages: { _id: 0 } } }, (err, found) => {
//                 res.render("index", { messages: JSON.stringify(found[0]), name: mainFound.name });
//             });
//         }
//         else {
//             res.send("Invalid Id Pass");
//         }
//     }
//     else {
//         res.send("Invalid Id Pass");
//     }
//     });
// }
// });

let SocketToUsername = {}, userArr = [], socketIds = [],userNameToSocket = {};

io.on("connection", socket => {
    //user joined
    socket.on("new-user-joined", name => {
        socketIds.push(socket.id);
        SocketToUsername[socket.id] = name;
        userNameToSocket[name] = socket.id;
        userArr.push(name);
        socket.broadcast.emit('user-joined', { name: name, userArr: userArr });
        UserList.find({ userName: name }, (err, found) => {
            IdPass.find({},{_id:0,username:1},(err, usersFound) => {
                socket.emit('self-user-joined', { name: name, userArr: usersFound, allMessages: found });
            });
        });
    });
    //Receiving Message
    socket.on("send", data => {
        //Saving message in senders database
        const messageOb = {
            message: data.message,
            time: data.Time,
            discription: "sent"
        };
        UserList.updateOne({
            userName: SocketToUsername[socket.id],"connectedUsers.otherUserName": data.toWhom},{"$push": {"connectedUsers.$.messages": messageOb}},(err)=>{
            if (err) {
                console.log(err);
            }
        });
        //Saving message in receiver's database
        messageOb.discription = "received";
        UserList.updateOne({userName: data.toWhom,"connectedUsers.otherUserName": SocketToUsername[socket.id]},
          {"$push": {"connectedUsers.$.messages": messageOb}},(err)=>{
            if (err) {
                console.log(err);
            }
        });
        //Sending Received Message through socket
        let obj = {
            sender: SocketToUsername[socket.id],
            message: data.message,
            time: data.Time
        };
        socket.to(userNameToSocket[data.toWhom]).emit('received', obj);
    });
    //user Disconnected
    socket.on("disconnect", message => {
        userArr.pop(SocketToUsername[socket.id]);
        socket.broadcast.emit("left", { name: SocketToUsername[socket.id], userArr: userArr });
        delete SocketToUsername[socket.id];
    });
});

httpServer.listen(PORT,() => {
    console.log("Server Started");
});