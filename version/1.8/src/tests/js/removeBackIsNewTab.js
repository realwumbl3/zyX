if (window.location.hash === "#asnewtab") {
    window.history.replaceState({}, "", window.location.pathname);
    document.getElementById("back-button").innerHTML = "Close";
    document.getElementById("back-button").onclick = () => {
        window.close();
    };
}

