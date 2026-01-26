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


async function memberinfo() {
    const token = localStorage.getItem("token"); 

    let response = await fetch(`/api/membership`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }
    });
    
    const container = document.querySelector(".main-top-container");

    if (response.ok) {

        const result = await response.json();

            const data = result.data;

            const memberinfo = document.createElement("div");
                memberinfo.innerHTML = `
                    <div class="memberinfo">
                    <div class="memberinfo-left">
                        <img class="pic" src=${data.photo} alt="">
                    </div>
                    <div class="memberinfo-right">
                        <div class="member-title">會員資料</div>
                        <div class="member-info" id="membername">會員姓名: ${data.name}</div>
                        <div class="member-info">會員信箱: ${data.email}</div>
                        <div class="member-info" id="memberpassword">會員信箱: ${data.password}</div>
                    </div>
                    </div>
                `;
                container.appendChild(memberinfo);
            }else if (response.status === 403) {
        alert("請先登入系統");
        window.location.href = "/";
        } 
    }
memberinfo();


async function updatename(){
    let name=document.querySelector(".changename").value;
    let hint = document.getElementById("name-hint");
    let membername=document.querySelector("#membername");
    const token = localStorage.getItem("token");

    if(name === "" ){
            hint.innerHTML = "姓名不可為空格！";
            hint.style.color = "red"; 
        return 
    }
    
    let response=await fetch("/api/user/name",{
        method:"PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body:JSON.stringify({"name":name})
    });
    let result = await response.json();
    
    if(response.ok){
        hint.innerHTML = "更新成功！";
        membername.innerHTML = "會員姓名: " + name;
    }}

async function updatepassword(){
    let oldpassword=document.querySelector(".changeoldpassword").value;
    let newpassword=document.querySelector(".changenewpassword").value;
    let hint = document.getElementById("password-hint");
    let membername=document.querySelector("#memberpassword");
    const token = localStorage.getItem("token");

    if(oldpassword === "" || newpassword === "" ){
            hint.innerHTML = "密碼不可為空格！";
            hint.style.color = "red"; 
        return 
    }
    
    let response=await fetch("/api/user/password",{
        method:"PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body:JSON.stringify({"oldpassword": oldpassword, "newpassword": newpassword})
    });
    let result = await response.json();
    
    if(response.ok){
        hint.innerHTML = "更新成功！";
        membername.innerHTML = "會員密碼: " + newpassword;
    }else {    
        hint.innerHTML = result.message;
        hint.style.color = "red";
    }
}    

async function checkHistoryOrder(){
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/orders`, { 
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const result = await response.json();
    
    const container = document.querySelector(".main-bottom-container");
    container.innerHTML = "";

    if (result.data === null) {
        container.innerHTML = "<div style='color: #757575; padding: 20px; font-weight: bold;'>暫無訂購紀錄</div>";
        return;
    }


    result.data.forEach((data) => {
        
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

        const card = document.createElement("div");
        card.id = `${data.id}`;
        card.className = "attraction-card";
        card.innerHTML = `
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
        container.appendChild(card);
    });
}


async function simpleUpload() {
    const fileInput = document.querySelector("#avatarInput");
    const hint = document.querySelector("#upload-hint");
    const token = localStorage.getItem("token");

    // 檢查是否有選取檔案
    if (!fileInput.files[0]) {
        hint.innerHTML = "請先選擇圖片檔案";
        hint.style.color = "red";
        return;
    }

    // 建立 FormData 並放入檔案
    const formData = new FormData();
    // 注意：這裡的 key ('file') 必須與後端 API 參數名稱一致
    formData.append("file", fileInput.files[0]);

    try {
        const response = await fetch("/api/user/avatar", {
            method: "PATCH",
            headers: {
                // 重要：傳送 FormData 時「不要」設定 Content-Type
                // 瀏覽器會自動生成帶有 Boundary 的 multipart/form-data
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            hint.innerHTML = "圖片上傳成功！";
            hint.style.color = "green";
            // 成功後重新整理頁面以顯示新頭像
            location.reload(); 
        } else {
            hint.innerHTML = result.message || "上傳失敗";
            hint.style.color = "red";
        }
    } catch (error) {
        console.error("上傳錯誤:", error);
        hint.innerHTML = "伺服器連線異常";
        hint.style.color = "red";
    }
}