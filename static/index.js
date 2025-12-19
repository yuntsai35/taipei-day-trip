async function attraction_information(){
    let response=await fetch("/api/attractions?page=0",{
        method:"GET",
    }); 
    let result=await response.json();
    const container = document.querySelector("#main-pic");
    container.innerHTML = "";

    if (result.data !== null && result.data) {
        result.data.forEach(data => {
            const card = document.createElement("div");
            card.className="attraction-card";
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
    }
}
attraction_information();

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
            category.textContent = item;
            category.onclick= showSidebar;
            container.appendChild(category);
        });
    }}
categories_list();

function showSidebar(){
  const sidebar = document.querySelector("#options")
  if (options.style.display === "grid") {
        options.style.display = "none";
    } else {
        options.style.display = "grid";
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
            mrt.className = "mrt";
            mrt.textContent = item;
            container.appendChild(mrt);
        });
    }}
mrts_list();



