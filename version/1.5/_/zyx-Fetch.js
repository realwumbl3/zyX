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
