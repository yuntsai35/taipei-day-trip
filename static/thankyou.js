document.querySelector(".left").onclick = () => {
    window.location.href = "/";
};

function showlogin() {
    const outer = document.getElementById("login-outer");
    const signup = document.getElementById("signup");
    const login = document.getElementById("login");
    if (login.style.display == "none") {
        login.style.display = "flex";
        signup.style.display = "none";
        outer.style.display="block";
    } else {
        login.style.display = "none";
    }
}

function showsignup(){
    const outer = document.getElementById("login-outer");
    const signup = document.getElementById("signup");
    const login = document.getElementById("login");
    if (signup.style.display== "none"){
        outer.style.display="block";
        signup.style.display = "flex";
        login.style.display="none";
    }else{
        signup.style.display = "none";
        
    }
}

function hide(){
    const outer = document.getElementById("login-outer");
    const signup = document.getElementById("signup");
    const login = document.getElementById("login");
    outer.style.display='none';
    signup.style.display='none';
    login.style.display='none';
}

async function signup(){
    let name=document.querySelector(".signup-name").value;
    let email=document.querySelector(".signup-email").value;
    let password=document.querySelector(".signup-password").value;
    let hint = document.getElementById("signup-hint");

    if(name === "" || email === "" || password === ""){
            hint.innerHTML = "姓名、信箱或密碼不可為空格！";
            hint.style.color = "red"; 
        return 
    }
    
    let response=await fetch("/api/user",{
        method:"POST",
        headers: {
            "Content-Type": "application/json"
        },
        body:JSON.stringify({"name":name,"email":email,"password":password})
    });
    let result = await response.json();
    
    if(response.ok){
        hint.innerHTML = "註冊成功！";
        hint.style.color = "red"; 
    }else{
        hint.innerHTML = result.message;
        hint.style.color = "red";
    }
    }

async function login(){
    let email=document.querySelector(".login-email").value;
    let password=document.querySelector(".login-password").value;
    let hint = document.getElementById("login-hint");

    if(email === "" || password === ""){
            hint.innerHTML = "姓名、信箱或密碼不可為空格！";
            hint.style.color = "red"; 
        return 
    }
    
    let response=await fetch("/api/user/auth",{
        method:"PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body:JSON.stringify({"email":email,"password":password})
    });
    let result = await response.json();
    
    if(response.ok){
        localStorage.setItem('token', result.token);
        window.location.reload();
        checkLoginStatus();
    }else{
        hint.innerHTML = result.message;
        hint.style.color = "red";
    }
    }

async function checkLoginStatus() {
    const token = localStorage.getItem("token"); 
    const authText = document.getElementById("item"); 

    let response = await fetch("/api/user/auth", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }
    });

    const result = await response.json();

    if (response.ok && result.data !== null) {
        authText.textContent = "登出系統";
        authText.onclick = signOut; 
    } else {
        authText.textContent = "登入/註冊";
        authText.onclick = showlogin;

    }
}
window.addEventListener("load", checkLoginStatus);

function signOut() {
    localStorage.removeItem("token");
    window.location.href = "/";
}


async function checkorderinfo() {
    const token = localStorage.getItem("token"); 
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('number');

    if (!orderNumber) return; 

    let response = await fetch(`/api/order/${orderNumber}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }
    });
    
    const container = document.querySelector(".main-top-container");
    container.innerHTML = "";

    if (response.ok) {

        const result = await response.json();
        if (result.data) {
            console.log("訂單資料：", result.data);

            const data = result.data;
        
        let timeChange = "";
        if (data.trip.time === "morning") {
            timeChange = "上午 9 點到下午 4 點";
        } else {
            timeChange = "下午 2 點到晚上 9 點";}

        let statusChange = "";
        if (data.status == 0) {
            statusChange = "已付款";
        } else {
            statusChange = "未付款";}
    
        if (data.status == 0) {
        const bookinginfo = document.createElement("div");
                bookinginfo.innerHTML = `
                    <div class="title">您好，<div class="booking-name">${data.contact.name}</div>，感謝您的訂購!</div>
                    <div class="title">您的訂單已建立成功，以下是預訂資訊。</div>
                    <div class="title">訂單編號為 ${data.number} </div>
                    <div class="bookinginfo">
                    <div class="bookinginfo-left">
                        <img class="pic" src="${data.trip.attraction.image}" alt="">
                    </div>
                    <div class="bookingifo-right">
                        <div class="booking-title">台北一日遊: ${data.trip.attraction.name}</div>
                        <div class="booking-info">日期: ${data.trip.date}</div>
                        <div class="booking-info">時間: ${timeChange}</div>
                        <div class="booking-info">費用: 新台幣${data.price}元</div>
                        <div class="booking-info">地點: ${data.trip.attraction.address}</div>
                        <div class="booking-info">付款狀態: ${statusChange}</div>
                    </div>
                    </div>
                `;
                container.appendChild(bookinginfo);
            }else{
                const bookinginfo = document.createElement("div");
                bookinginfo.innerHTML = `
                    <div class="title">您好，<div class="booking-name">${data.contact.name}</div>，您的訂單及付款未建立成功。</div>
                    <div class="title">訂單編號為 ${data.number} </div>
                    <div class="bookinginfo">
                    <div class="bookinginfo-left">
                        <img class="pic" src="${data.trip.attraction.image}" alt="">
                    </div>
                    <div class="bookingifo-right">
                        <div class="booking-title">台北一日遊: ${data.trip.attraction.name}</div>
                        <div class="booking-info">日期: ${data.trip.date}</div>
                        <div class="booking-info">時間: ${timeChange}</div>
                        <div class="booking-info">費用: 新台幣${data.price}元</div>
                        <div class="booking-info">地點: ${data.trip.attraction.address}</div>
                        <div class="booking-info">付款狀態: ${statusChange}</div>
                    </div>
                    </div>
                `;
                container.appendChild(bookinginfo);
            }


        }

    } else if (response.status === 403) {
        alert("請先登入系統");
        window.location.href = "/";
    }
}
checkorderinfo();