const container = document.querySelector("#main-pic");
let currentKeyword = ""; 

async function attraction_information() {
    const response = await fetch(`/api/attractions?page=0`, { method: "GET" });
    const result = await response.json();

    nextPage = result.nextPage;

    result.data.forEach((data) => {
        const card = document.createElement("div");
        card.className = "attraction-card";
        card.innerHTML = `
                <div class="img-container">
                    <img class="pic" src="${data.images[0]}" alt="">
                    <p class="text">${data.name}</p>
                </div>
                <div class="card-info" id="card-info">
                    <span class="mrt">${data.mrt}</span>
                    <span class="cat">${data.category}</span>
                </div>
        `;
        container.appendChild(card);
    });
}
attraction_information();

//先觀察是否滾到底，確定到底之後fetch 1 的前4個 fetch 1的後四個 

const infiniteWrap = document.querySelector("#js-detective"); 
let nextPage = 1; 
let isLoading = false; 

const options = {
    root: null,
    threshold: 1,
};

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !isLoading && nextPage !== null) {
                loadMore();
            }
        });
    },
    { root: null, threshold: 0.1 } 
);

async function loadMore() {
    isLoading = true; 
    let url = `/api/attractions?page=${nextPage}`;
    const catButton = document.querySelector(".select-cat");
    const currentCategory = catButton.id;

    if (currentKeyword) { url += `&keyword=${currentKeyword}`; }
    if (currentCategory && currentCategory !== "全部分類" && currentCategory !== "select-btn") { 
        url += `&category=${currentCategory}`; 
    }

    try {
        const response = await fetch(url);
        const res = await response.json();
        
        if (res.data) {
            res.data.forEach((data) => {
                const card = document.createElement("div");
                card.className = "attraction-card";
                card.id=data.id;
                card.innerHTML = `
                    <div class="img-container">
                        <img class="pic" src="${data.images[0]}" alt="">
                        <p class="text">${data.name}</p>
                    </div>
                    <div class="card-info">
                        <span class="mrt">${data.mrt}</span>
                        <span class="cat">${data.category}</span>
                    </div>
                `;
                container.appendChild(card);
            });
            nextPage = res.nextPage;
        }
    } catch (error) {
        console.error("Fetch error:", error);
    } finally {
        isLoading = false; 
        if (nextPage === null) {
            observer.unobserve(infiniteWrap);
        }
    }
}

observer.observe(infiniteWrap);




async function categories_list(){
    let response=await fetch("/api/categories",{
        method:"GET",
    }); 
    let result=await response.json();
    const container = document.querySelector("#options");
    container.innerHTML = "";

    if (result.data !== null && result.data) {
        const allcategory= document.createElement("span");
              allcategory.className = "category";
              allcategory.textContent= "全部分類";
              allcategory.onclick= showSidebar;
              container.appendChild(allcategory);
        result.data.forEach(item => {
        const category= document.createElement("span");
            category.className = "category";
            category.id= item;
            category.textContent = item;
            category.onclick= showSidebar;
            container.appendChild(category);
        });
    }}
categories_list();

function showSidebar(event) {
    const sidebar = document.querySelector("#options");
    const catButton = document.querySelector(".select-cat");

    if (sidebar.style.display == "grid") {
        sidebar.style.display = "none";
        const target = event.target;
        if (target.classList.contains("category")) {
            const selectedText = target.textContent; 
            catButton.textContent = selectedText;
            catButton.id=selectedText;
        }
    } else {
        sidebar.style.display = "grid";
    }
}

async function mrts_list(){
    let response=await fetch("/api/mrts",{
        method:"GET",
    }); 
    let result=await response.json();
    const container = document.querySelector("#list-bar-content");
    container.innerHTML = "";

    if (result.data !== null && result.data) {
        result.data.forEach(item => {
        const mrt= document.createElement("span");
            mrt.className = "list-bar-mrt";
            mrt.id=item;
            mrt.textContent = item;
            mrt.onclick=inputkeyword;
            container.appendChild(mrt);
        });
    }}
mrts_list();

async function inputkeyword(event){
    const TextArea = document.getElementById('search');
    const outputbutton = event.target.id;
    TextArea.value=outputbutton;
    filter();
}


async function filter() {
    currentKeyword = document.querySelector("#search").value;

    const catButton = document.querySelector(".select-cat");
    const currentCategory = catButton.id;

    nextPage = 0; 
    isLoading = true;
    const container = document.querySelector("#main-pic");
    container.innerHTML = ""; 
    
   
    let url = `/api/attractions?page=${nextPage}&keyword=${currentKeyword}`;
    
  
    if (currentCategory && currentCategory !== "全部分類" && currentCategory !== "select-btn") {
        url += `&category=${currentCategory}`;
    }

    try {
        const response = await fetch(url);
        const res = await response.json();

        if (res.data && res.data.length > 0) {
            res.data.forEach((data) => {
                const card = document.createElement("div");
                card.className = "attraction-card";
                card.innerHTML = `
                    <div class="img-container">
                        <img class="pic" src="${data.images[0]}" alt="">
                        <p class="text">${data.name}</p>
                    </div>
                    <div class="card-info">
                        <span class="mrt">${data.mrt}</span>
                        <span class="cat">${data.category}</span>
                    </div>
                `;
                container.appendChild(card);
            });
            nextPage = res.nextPage; 
            observer.observe(infiniteWrap); 
        } else {
            
            container.innerHTML = "<div style='grid-column: 1/-1; text-align: center; margin-top: 30px; color: gray;'>查無資料</div>";
            nextPage = null;
        }
    } catch (error) {
        console.error("Fetch error:", error);
    } finally {
        isLoading = false;
    }
}


const listBarContent = document.getElementById("list-bar-content");
const btnLeft = document.querySelector(".list-bar-left");
const btnRight = document.querySelector(".list-bar-right");


    btnLeft.addEventListener("click", () => {
        listBarContent.scrollBy({
            left: -300,
            behavior: 'smooth' 
        });
    });

    btnRight.addEventListener("click", () => {
        listBarContent.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });
