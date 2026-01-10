async function reservation() {
    const token = localStorage.getItem("token"); 

    let response = await fetch("/api/user/auth", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }
    });

    const result = await response.json();

    if (response.ok && result.data !== null) {
        window.location.href = "/booking";
        
    } else {
        showlogin();
    }
}