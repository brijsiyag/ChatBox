const socket = io();
var objDiv = document.querySelector(".message-container");
let messageContainer = document.querySelector(".message-container");
let form = document.querySelector(".form");
let sidebarLower = document.getElementById("sidebarLower");
let sidebarUpper = document.getElementById("sidebarUpper");
let sidebar = document.querySelector(".sidebar");
let openedUser;

socket.on('self-user-joined', data => {
    console.log(data.userArr);
    displayNames(data.userArr);
});

sidebarUpper.childNodes[3].innerText = userName;
socket.emit('new-user-joined', userName);


let noOfUsers = document.createElement("h1");
noOfUsers.classList.add("count");

let userNameInHeading = document.createElement("h1");
userNameInHeading.classList.add("user-name-heading");
userNameInHeading.innerText = userName;
document.querySelector("header").append(userNameInHeading);

form.addEventListener("submit", event => {
    event.preventDefault();
    let message = document.querySelector(".messageInp").value;
    if (message != "") {
        let Time;
        if (new Date().getHours()>12) {
            Time = ("0" + (new Date().getHours()-12)).slice(-2) +":" + ("0" + (new Date().getMinutes())).slice(-2) + " pm" ;
        }
        else{
            Time = ("0" + (new Date().getHours())).slice(-2) +":" + ("0" + (new Date().getMinutes())).slice(-2) + " am" ;
        }
        socket.emit("send", {message:message,Time:Time,toWhom:openedUser});
        let main_msg = document.createElement("div"), sender = document.createElement("div"), msg = document.createElement("div"),time = document.createElement("span");
        msg.innerText = document.querySelector(".messageInp").value;
        msg.classList.add("msg");
        time.innerText = "     " + Time;
        time.classList.add("time");
        msg.append(time);
        main_msg.append(msg);
        main_msg.classList.add("right");
        main_msg.classList.add("main-msg");
        messageContainer.append(main_msg);
        objDiv.scrollTop = objDiv.scrollHeight;
        const messageOb = {
            message: message,
            time: Time,
            discription: "sent"
        };
        messagesFromDbs.connectedUsers.find(x => x.otherUserName == openedUser).messages.push(messageOb);
    }
    document.querySelector(".messageInp").value = "";
    document.querySelector(".messageInp").autofocus = true;
    document.querySelector(".messageInp").click();
});

socket.on("received", (data) => {
    let main_msg = document.createElement("div"), sender = document.createElement("div"), msg = document.createElement("div"),time = document.createElement("span");
    msg.innerText = data.message;
    sender.innerText = data.sender;
    msg.classList.add("msg");
    sender.classList.add("user-name");
    time.innerText = "     " + data.time;
    time.classList.add("time");
    msg.append(time);
    main_msg.append(sender);
    main_msg.append(msg);
    main_msg.classList.add("left");
    main_msg.classList.add("main-msg");
    messageContainer.append(main_msg);
    objDiv.scrollTop = objDiv.scrollHeight;

    const messageOb = {
        message: data.message,
        time: data.time,
        discription: "received"
    };
    console.log(messageOb);
    messagesFromDbs.connectedUsers.find(x => x.otherUserName == data.sender).messages.push(messageOb);
});
//displaying names of online users in sidebar
async function displayNames(userArr) {
    userArr.forEach(element => {
        if (element.username != userName) {
            let nameListItem = document.createElement("div"), nameListImg = document.createElement("img"), nameListName = document.createElement("h2");
            nameListImg.setAttribute("src", "./images/user.png");
            nameListItem.append(nameListImg);
            nameListName.innerText = element.username;
            nameListName.classList.add(".otherUserHeading");
            nameListItem.append(nameListName);
            nameListItem.classList.add("usersInSidebar");
            nameListItem.setAttribute("id", "userInSidebar");
            sidebarLower.append(nameListItem);
        }
    });
    userSelector();
};
socket.on("left",data =>{
    // displayNames(data.userArr);
    // let message = document.createElement("div");
    // message.innerText = data.name + " left Chat";
    // message.classList.add("joined");
    // messageContainer.append(message);
    // objDiv.scrollTop = objDiv.scrollHeight;
    // noOfUsers.innerText = "No of Online Users : " + data.count;
    // document.querySelector("header").append(noOfUsers);
});
socket.on('user-joined', data => {
    // displayNames(data.userArr);
    // let message = document.createElement("div");
    // message.innerText = data.name + " Joined Chat";
    // message.classList.add("joined");
    // messageContainer.append(message);
    // objDiv.scrollTop = objDiv.scrollHeight;
    // noOfUsers.innerText = "No of Online Users : " + data.count;
    // document.querySelector("header").append(noOfUsers);
});


function userSelector() {
    sidebarLower.childNodes.forEach((element)=>{
        element.addEventListener("click",()=>{
            document.querySelector(".selectedUser").classList.remove("selectedUser");
            element.classList.add("selectedUser");
            openedUser = element.childNodes[1].innerText;
            displayMessages(openedUser);
            userNameInHeading.innerText = openedUser;
        });
    });
};

function displayMessages(otherUser) {
    messageContainer.innerHTML = "";
    messagesFromDbs.connectedUsers.find(x => x.otherUserName == otherUser).messages.forEach(element => {
        let main_msg = document.createElement("div"), sender = document.createElement("div"), msg = document.createElement("div"),time = document.createElement("span");
        if (element.discription == "sent") {
            msg.style.marginTop = "5px";
            main_msg.classList.add("right");
        }
        else{
            sender.classList.add("user-name");
            sender.innerText = messagesFromDbs.connectedUsers[0].otherUserName;
            main_msg.classList.add("left");
            main_msg.append(sender);
        }
        msg.innerText = element.message;
        msg.classList.add("msg");
        time.innerText = element.time;
        time.classList.add("time");
        msg.append(time);
        main_msg.append(msg);
        main_msg.classList.add("main-msg");
        messageContainer.append(main_msg);
        objDiv.scrollTop = objDiv.scrollHeight;
    });
}