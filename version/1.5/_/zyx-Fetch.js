export const zyXPost = (url, _) => {
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "POST",
        credentials: 'include',
        body: JSON.stringify(_)
    })
}

export const zyXGet = (url) => {
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "GET",
        credentials: 'include'
    })
}

class ZyXGet2Task {
    constructor(url) {
        this.url = url
    }

    async fetch() {
        const attempt = await fetch(this.url, {
            headers: new Headers({ "Content-Type": "application/json" }),
            method: "GET",
            credentials: 'include'
        })
        if (!attempt.ok) {
            console.log("zyXGet2 fetch attempt not ok", this)
        } else {
            this._data = await attempt.json()
        }
        return this
    }

    data() {
        return this._data ? this._data : null
    }

}

export async function zyXGet2(url) {
    const task = new ZyXGet2Task(url)
    return await task.fetch()
}
