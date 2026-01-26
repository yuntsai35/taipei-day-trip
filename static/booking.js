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
        authText.textContent = "會員中心";
        authText.onclick = membership; 
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


async function getreservationinfo(){
    const token = localStorage.getItem("token"); 
    if (!token) {
        window.location.href = "/";
        return;
    }
    
    let personalinfo=await fetch("/api/user/auth",{
        method:"GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }
    }); 
    
    let personaldata=await personalinfo.json();
    const TextAreaname= document.getElementById('bookingname');
    const TextAreaemail = document.getElementById('bookingemail');
    TextAreaname.value=personaldata.data.name;
    TextAreaemail.value=personaldata.data.email;


    let response=await fetch("/api/booking",{
        method:"GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }

    }); 
    let result=await response.json();
    const container = document.querySelector(".main-top-container");
    container.innerHTML = "";

    if (result.data !== null && result.data) {
        const data = result.data;
        
        let timeChange = "";
        if (result.time === "morning") {
            timeChange = "上午 9 點到下午 4 點";
        } else {
            timeChange = "下午 2 點到晚上 9 點";}

        const bookinginfo = document.createElement("div");
                bookinginfo.innerHTML = `
                    <div class="title">您好，<div class="booking-name">${personaldata.data.name}</div>，待預定地行程如下:</div>
                    <div class="bookinginfo">
                    <div class="bookinginfo-left">
                        <img class="pic" src="${data.images}" alt="">
                    </div>
                    <div class="bookingifo-right">
                        <div class="booking-title">台北一日遊: ${data.name}</div>
                        <div class="booking-info">日期: ${result.date}</div>
                        <div class="booking-info">時間: ${timeChange}</div>
                        <div class="booking-info">費用: 新台幣${result.price}元</div>
                        <div class="booking-info">地點: ${data.address}</div>
                        <img onclick=deletereservationinfo() class="delete" src="/static/delete.png">
                    </div>
                    </div>
                `;
                container.appendChild(bookinginfo);

        const containerprice = document.querySelector(".main-price-container");
                containerprice.innerHTML = `
                    <div class="main-price">總價:新台幣${result.price}元</div>
                    <button class="main-price-btn" onclick="onSubmit(event)">確認訂購並付款</button>
                `;

        
            } else {
        const information = document.querySelector(".booking-information");
        information.style.display = "none";
        container.innerHTML = `
            <div class="title">您好，<div class="booking-name">${personaldata.data.name}</div>，待預定地行程如下:</div>
            <div class="info">目前沒有任何待預約的行程</div>`
    }
            
        }
getreservationinfo();

async function deletereservationinfo(){
    const token = localStorage.getItem("token"); 
    if (!token) {
        showlogin();
        return;
    }

    let response=await fetch("/api/booking",{
        method:"DELETE",
        headers: {
            "Authorization": `Bearer ${token}` 
        }

    }); 
    let result=await response.json();
    if (result.ok) {
        window.location.reload();
    } else {
        console.log(result.message);
    }
}


TPDirect.setupSDK(166552, 'app_kb8zABJ0iVQagADg4jpnKQV5tDlAoucpfLESYa0yiYw1FL87ZBzIPSFvc0z1', 'sandbox')
// Display ccv field
let fields = {
        number: {
            // css selector
            element: '#card-number',
            placeholder: '**** **** **** ****'
        },
        expirationDate: {
            // DOM object
            element: document.getElementById('card-expiration-date'),
            placeholder: 'MM / YY'
        },
        ccv: {
            element: '#card-ccv',
            placeholder: 'ccv'
        }
    }
    

TPDirect.card.setup({
    
    fields: fields,
    styles: {
        // Style all elements
        'input': {
            'color': 'gray'
        },
        // Styling ccv field
        'input.ccv': {
            // 'font-size': '16px'
        },
        // Styling expiration-date field
        'input.expiration-date': {
            // 'font-size': '16px'
        },
        // Styling card-number field
        'input.card-number': {
            // 'font-size': '16px'
        },
        // style focus state
        ':focus': {
            // 'color': 'black'
        },
        // style valid state
        '.valid': {
            'color': 'green'
        },
        // style invalid state
        '.invalid': {
            'color': 'red'
        },
        // Media queries
        // Note that these apply to the iframe, not the root window.
        '@media screen and (max-width: 400px)': {
            'input': {
                'color': 'orange'
            }
        }
    },
    isMaskCreditCardNumber: true,
    maskCreditCardNumberRange: {
        beginIndex: 6,
        endIndex: 11
    }
})

function onSubmit(event) {
    event.preventDefault()

    const errorMsgElement = document.getElementById("payment-error-msg");
    errorMsgElement.textContent = ""; 

    const tappayStatus = TPDirect.card.getTappayFieldsStatus()

    if (tappayStatus.canGetPrime === false) {
        errorMsgElement.textContent = "請確認信用卡資訊是否填寫正確"
        return
    }

    // Get prime
    TPDirect.card.getPrime(async (result) => {
        if (result.status !== 0) {
            errorMsgElement.textContent = result.msg
            return
        }

        const token = localStorage.getItem("token"); 

        
        let personalinfo=await fetch("/api/user/auth",{
            method:"GET",
            headers: {
                "Authorization": `Bearer ${token}` 
            }
        }); 
        
        let personaldata=await personalinfo.json();
        const id = personaldata.data.id;

        const name = document.querySelector("#bookingname").value;
        const email = document.querySelector("#bookingemail").value;
        const phone = document.querySelector("#bookingphonenumber").value;

        let response=await fetch("/api/booking",{
        method:"GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }
        }); 

        let resultdata=await response.json();

        if (resultdata.data !== null && resultdata.data) {
            const data = resultdata.data;
            const prime = result.card.prime;
            const attractionId = data.id;
        
            let orderresponse=await fetch("/api/orders",{
            method:"POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body:JSON.stringify({"prime":prime,"memberid":id,"attraction": attractionId,"date": resultdata.date,"time":resultdata.time,"price":resultdata.price,"name":name,"email":email, "phone": phone})
            });
            const orderresult = await orderresponse.json();
            if (orderresponse.ok) {
                window.location.href = "/thankyou?number=" + orderresult.data.number;
            }else{
                errorMsgElement.textContent = orderresult.message
                console.log(orderresult);
            }
        
        } })}     

async function membership() {
    const token = localStorage.getItem("token"); 

    let response = await fetch("/api/user/auth", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }
    });

    const result = await response.json();

    if (response.ok && result.data !== null) {
        window.location.href = "/membership";
        
    } else {
        showlogin();
    }
}