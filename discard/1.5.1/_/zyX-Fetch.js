export function zyXPost(url, data) {
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "POST",
        credentials: 'include',
        body: JSON.stringify(data)
    })
}

export function zyXGet(url) {
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "GET",
        credentials: 'include'
    })
}

export function zyXFormPost(url, data) {
    const formData = new FormData();
    Object.entries(data).forEach(formData.append);
    return fetch(url,
        { method: "POST", body: formData }
    )
}

export function zyXFetchCSS(url) {
    return new Promise((res, rej) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.onload = () => {
            link.remove();
            res({ link, remove: () => link.remove() });
        }
        link.onerror = rej;
        link.href = url;
        document.head.appendChild(link);
    })
}

export async function zyXFetchBlob(url) {
    const response = await fetch(url);
    if (response.ok) {
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        return { blob, objectURL };
    } else {
        throw new Error("blobFetch failed");
    }
}

async function loadImg(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

export async function resizeImageToCanvas(url, maxSide) {
    const image = await loadImg(url);
    maxSide = maxSide || 512;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const [width, height] = resizeImage(image.width, image.height, maxSide);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return canvas
}

function resizeImage(width, height, maxSize) {
    if (width > maxSize || height > maxSize) {
        const ratio = maxSize / Math.max(width, height);
        return [width * ratio, height * ratio]
    }
    return [width, height];
}

export function urlSplitExt(url) {
    const filename = url.replace(/^.*[\\\/]/, "").split("?")[0];
    return { filename, ext: filename.split(".").pop() };
}

