async function getId(){
   const s =window.location.pathname
   const split_list = s.split('/')
   const attractionId = split_list[2]

   const response = await fetch(`/api/attraction/${attractionId}`, { method: "GET" });
   const result = await response.json();
   const data = result.data;


   const container = document.querySelector(".main-bottom-container");
   
   const cardInfo = document.createElement("div");
    cardInfo.id = `${data.id}`;
    cardInfo.className = "attraction-card-reserve";
    cardInfo.innerHTML = `
                <div class="description">${data.description}</div>
                <div class="container-address">
                    <div class="address-title">景點地址:</div>
                    <div class="address-content">${data.address}</div>
                </div>
                <div class="container-transport">
                    <div class="transport-title">交通方式:</div>
                    <div class="transport-content">${data.transport}</div>
                </div>
        `;
    container.appendChild(cardInfo);


    const title = document.querySelector(".main-top-right-info");
    const titleInfo = document.createElement("div");
    titleInfo.id = `${data.id}`;
    titleInfo.className = "main-top-right-detail";
    titleInfo.innerHTML = `
                <div class="titleName">${data.name}</div>
                <div class="titleLocation">
                    <div class="titleLocation-cat">${data.category}</div>
                    <div class="titleLocation-preposition"> at </div>
                    <div class="titleLocation-mrt">${data.mrt}</div>
                </div>
        `;
    title.appendChild(titleInfo);

    const pictures = document.querySelector(".list-bar-picture");
    const  pic= document.createElement("div");
    pic.className = "main-top-left-pic";
    let allImagesHtml = "";

    result.data.images.forEach((imgUrl) => {
        allImagesHtml += `
                <img class="pic" src=${imgUrl} alt="">
        `;
        pic.innerHTML = allImagesHtml;
        pictures.appendChild(pic);})
        

    const picture_amount=result.data.images.length;   
    const scrollBar=document.querySelector(".scroll-bar"); 
    const scrollTrack = document.querySelector(".my-scroll");
    const thumbWidthPercent = (1 / picture_amount) * 100;
    scrollBar.style.width = thumbWidthPercent + "%";

    pic.addEventListener('scroll', function() {
    const maxScroll = this.scrollWidth - this.clientWidth;
    const scrollPercent = this.scrollLeft / maxScroll;
    const moveRange = scrollTrack.clientWidth - scrollBar.clientWidth;
    const barMove = scrollPercent * moveRange;
    scrollBar.style.transform = `translateX(${barMove}px)`;
});


    const listBarPicture = document.querySelector(".main-top-left-pic");
    const btnLeft = document.querySelector(".list-bar-left");
    const btnRight = document.querySelector(".list-bar-right");


    btnLeft.addEventListener("click", () => {
        listBarPicture.scrollBy({
            left: -500,
            behavior: 'smooth' 
        });
    });

    btnRight.addEventListener("click", () => {
        listBarPicture.scrollBy({
            left: 500,
            behavior: 'smooth'
        });
    });
};     
getId();

const am = document.getElementById("am");
const pm = document.getElementById("pm");
const feeDisplay = document.querySelector(".reserve-fee-number");

feeDisplay.innerText = "新台幣 2000 元";

am.addEventListener("click", () => {
    feeDisplay.innerText = "新台幣 2000 元";
});

pm.addEventListener("click", () => {
    feeDisplay.innerText = "新台幣 2500 元";
});

document.querySelector(".left").onclick = () => {
    window.location.href = "/";
};