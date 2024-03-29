export function zyXPost(url, _) {
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "POST",
        credentials: 'include',
        body: JSON.stringify(_)
    })
}

export function zyXGet(url) {
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "GET",
        credentials: 'include'
    })
}

export function getImageBlob(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "blob";
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(new Error("Image loading error"));
            }
        };
        xhr.send();
    });
}