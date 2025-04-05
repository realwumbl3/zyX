if (window.location.hash === "#asnewtab") {
    // Remove the hash from URL without triggering navigation
    window.history.replaceState({}, "", window.location.pathname);
    
    // Push an extra history state to enable "going back" to close the tab
    window.history.pushState({isNewTab: true}, "", window.location.pathname);
    
    // Update the button to say "Close"
    document.getElementById("back-button").innerHTML = "Close";
    
    // Handle both button click and browser back button
    document.getElementById("back-button").onclick = (e) => {
        e.preventDefault();
        window.close();
    };
    
    // Listen for popstate (back button) to close the tab
    window.addEventListener('popstate', (event) => {
        window.close();
    });
}

